class CombatSystem {
    constructor(game) {
        this.game = game;
    }

    // Метод для расчёта модификатора характеристики
    getStatModifier(stat) {
        return Math.floor((stat - 10) / 2);
    }

    // Метод для расчёта защиты игрока от брони
    getPlayerDefense() {
        let totalDefense = 0;

        // Получаем экипированные предметы
        const equipped = this.game.inventorySystem.equipped;
        
        // Проходим по всем слотам экипировки
        for (const slot in equipped) {
            const item = equipped[slot];
            if (!item) continue;

            // Если у предмета есть защита, добавляем её
            if (item.defense) {
                totalDefense += item.defense;
            }
        }

        return totalDefense;
    }

    // Метод для броска кубиков в формате D&D
    rollDice(diceNotation) {
        // Если нет нотации, возвращаем 1 (урон без оружия)
        if (!diceNotation) return 1;

        // Разбираем нотацию (например "2d6")
        const [count, sides] = diceNotation.toLowerCase().split('d').map(Number);
        
        // Если нотация некорректная, возвращаем 1
        if (!count || !sides) return 1;

        // Бросаем кубики и суммируем результаты
        let damage = 0;
        for (let i = 0; i < count; i++) {
            damage += Math.floor(Math.random() * sides) + 1;
        }
        return damage;
    }

    // Проверяет, может ли враг атаковать игрока
    canEnemyAttack(enemy) {
        // Проверяем, находится ли игрок на соседней клетке (включая диагонали)
        const dx = Math.abs(enemy.x - this.game.playerX);
        const dy = Math.abs(enemy.y - this.game.playerY);
        return dx <= 1 && dy <= 1;
    }

    // Враг атакует игрока
    enemyAttack(enemy) {
        if (this.canEnemyAttack(enemy) && enemy.movesLeft > 0) {
            // Запускаем анимацию атаки
            enemy.isAttacking = true;
            enemy.attackStartTime = performance.now();
            enemy.attackDuration = 180; // 150ms для атаки
            
            // Сохраняем начальную позицию
            enemy.attackAnim = {
                startX: enemy.x,
                startY: enemy.y
            };
            
            // Выбираем случайную атаку из доступных
            const attacks = ENEMY_TYPES[enemy.type].attacks;
            const attack = attacks[Math.floor(Math.random() * attacks.length)];
            
            // Проверяем уклонение игрока
            const dexMod = this.getStatModifier(this.game.playerStats.dexterity);
            const dodgeChance = 0.05 + (dexMod * 0.05); // 5% базовый шанс + 5% за каждый модификатор
            if (Math.random() < dodgeChance) {
                enemy.pendingAttack = {
                    damage: 0,
                    enemyName: ENEMY_TYPES[enemy.type].description,
                    attackName: 'промахивается по',
                    dodged: true
                };
            } else {
                // Считаем урон по формуле атаки
                let damage = this.rollDice(attack.damage);
                
                // Вычитаем защиту брони
                const defense = this.getPlayerDefense();
                damage = Math.max(1, damage - defense); // Минимум 1 урон
                
                // Сохраняем данные атаки для применения после анимации
                enemy.pendingAttack = {
                    damage: damage,
                    enemyName: ENEMY_TYPES[enemy.type].description,
                    attackName: attack.name,
                    dodged: false
                };
            }
            
            enemy.movesLeft--;
            return true;
        }
        return false;
    }

    // Завершение атаки после анимации
    finishAttack(enemy) {
        if (enemy.pendingAttack) {
            if (enemy.pendingAttack.dodged) {
                // Выводим сообщение об уклонении
                hud.addLogMessage(`${enemy.pendingAttack.enemyName} ${enemy.pendingAttack.attackName} вам`, 'dodge');
                // Показываем "ПРОМАХ" над игроком
                this.game.damageNumberSystem.addNumber(
                    this.game.playerX,
                    this.game.playerY,
                    0,
                    true, // урон игроку
                    true  // это уклонение
                );
            } else {
                // Создаём число урона
                this.game.damageNumberSystem.addNumber(
                    this.game.playerX,
                    this.game.playerY,
                    enemy.pendingAttack.damage,
                    true, // урон игроку
                    false // это не уклонение
                );
                
                // Выводим сообщение в лог
                hud.addLogMessage(`${enemy.pendingAttack.enemyName} ${enemy.pendingAttack.attackName} вас на ${enemy.pendingAttack.damage} единиц урона!`, 'enemy-attack');
                
                // Наносим урон только если не включен режим бессмертия
                if (!this.game.debugMode.godMode) {
                    this.game.playerHealth -= enemy.pendingAttack.damage;
                    
                    // Ограничиваем здоровье снизу нулём
                    if (this.game.playerHealth <= 0) {
                        this.game.playerHealth = 0;
                        this.game.isDead = true;
                        
                        // Добавляем труп на место гибели игрока
                        const corpse = {
                            x: this.game.playerX,
                            y: this.game.playerY,
                            type: 'corpse',
                            glyph: 'corpse',
                            z_index: 3 // Отображаем под врагами, но над полом
                        };
                        this.game.corpses.push(corpse);
                        
                        hud.addLogMessage('Вы погибли!', 'attack');
                        
                        // Показываем экран Game Over
                        gameOverScreen.show(() => {
                            // После окончания анимации показываем главное меню
                            this.game.mainMenu.isPauseMenu = false;
                            this.game.mainMenu.show();
                            // Скрываем экран Game Over
                            gameOverScreen.hide();
                        });
                    }
                }
            }
            
            // Очищаем данные атаки
            enemy.pendingAttack = null;
        }
    }

    // Проверяет, может ли игрок атаковать врага на указанной клетке
    canPlayerAttack(x, y) {
        const enemy = this.game.enemySystem.enemies.find(e => e.x === x && e.y === y);
        if (!enemy) return false;
        
        // Проверяем, находится ли враг на соседней клетке (включая диагонали)
        const dx = Math.abs(x - this.game.playerX);
        const dy = Math.abs(y - this.game.playerY);
        return dx <= 1 && dy <= 1;
    }

    // Игрок атакует врага
    playerAttack(x, y) {
        if (this.canPlayerAttack(x, y)) {
            const enemy = this.game.enemySystem.enemies.find(e => e.x === x && e.y === y);
            if (!enemy) return false;

            // Запускаем анимацию атаки
            this.game.isPlayerAttacking = true;
            this.game.attackStartTime = performance.now();
            this.game.attackDuration = 180; // 150ms для атаки
            
            // Сохраняем цель атаки
            this.game.attackTarget = enemy;
            
            // Получаем оружие из обеих рук
            const leftHand = this.game.inventorySystem.equipped.leftHand;
            const rightHand = this.game.inventorySystem.equipped.rightHand;
            
            let weapon = null;
            
            // Если оружие двуручное, используем его
            if (leftHand && leftHand.hands === 'both') {
                weapon = leftHand;
            }
            // Если в руках два одноручных оружия
            else if (leftHand && rightHand) {
                // Вычисляем максимальный возможный урон для каждого оружия
                const leftMaxDamage = this.getMaxPossibleDamage(leftHand.damage);
                const rightMaxDamage = this.getMaxPossibleDamage(rightHand.damage);
                
                // Выбираем оружие с фиксированным шансом 90/10
                // 90% для оружия с меньшим уроном
                const weakerWeapon = leftMaxDamage <= rightMaxDamage ? leftHand : rightHand;
                const strongerWeapon = leftMaxDamage <= rightMaxDamage ? rightHand : leftHand;
                
                // 90% шанс для слабого оружия, 10% для сильного
                weapon = Math.random() < 0.9 ? weakerWeapon : strongerWeapon;
            }
            // Если оружие только в одной руке
            else {
                weapon = leftHand || rightHand;
            }
            
            // Проверяем попадание (d20 + модификатор ловкости)
            const dexMod = this.getStatModifier(this.game.playerStats.dexterity);
            const hitRoll = this.rollDice('1d20') + dexMod;
            
            // Если промах
            if (hitRoll < ENEMY_TYPES[enemy.type].armorClass) {
                enemy.pendingDamage = 0;
                enemy.wasHit = false;
                
                // Показываем "ПРОМАХ" над врагом
                this.game.damageNumberSystem.addNumber(
                    enemy.x,
                    enemy.y,
                    0,
                    false, // не урон игроку
                    true   // это уклонение
                );
                
                hud.addLogMessage('Вы промахнулись!', 'dodge');
            } else {
                // Считаем урон по формуле оружия
                const baseDamage = weapon ? this.rollDice(weapon.damage) : 1;
                // Добавляем модификатор силы к урону
                const strMod = this.getStatModifier(this.game.playerStats.strength);
                const damage = Math.max(1, baseDamage + strMod); // Минимум 1 урон
                enemy.pendingDamage = damage;
                enemy.wasHit = true;
                
                // Показываем урон над врагом
                this.game.damageNumberSystem.addNumber(
                    enemy.x,
                    enemy.y,
                    damage,
                    false, // не урон игроку
                    false  // это не уклонение
                );
                
                // Выводим сообщение в лог
                const weaponName = weapon ? `при помощи ${weapon.name}` : 'кулаками';
                hud.addLogMessage(`Вы атакуете ${ENEMY_TYPES[enemy.type].description} ${weaponName} на ${damage} урона!`, 'player-attack');
            }
            
            return true;
        }
        return false;
    }

    // Вспомогательный метод для расчёта максимального возможного урона от оружия
    getMaxPossibleDamage(diceNotation) {
        if (!diceNotation) return 1;
        const [count, sides] = diceNotation.toLowerCase().split('d').map(Number);
        if (!count || !sides) return 1;
        return count * sides;
    }

    // Завершение атаки игрока после анимации
    finishPlayerAttack() {
        const enemy = this.game.attackTarget;
        if (!enemy) return;

        // Если атака попала
        if (enemy.wasHit) {
            enemy.health -= enemy.pendingDamage;

            // Если враг погиб
            if (enemy.health <= 0) {
                // Добавляем сообщение о смерти противника
                hud.addLogMessage(`${ENEMY_TYPES[enemy.type].description} погиб!`, 'enemy-death');
                
                // Рассчитываем опыт за убийство
                const enemyType = ENEMY_TYPES[enemy.type];
                const maxDamage = enemyType.attacks.reduce((max, attack) => {
                    const [count, sides] = attack.damage.toLowerCase().split('d').map(Number);
                    return Math.max(max, count * sides);
                }, 0);
                
                // Рассчитываем множитель случайности
                const randomFactor = 0.9 + (Math.random() * 0.2);
                
                // Формула: XP = (MaxDamage * 4) * (1 + 0.1 * FloorNumber) * RandomFactor
                const xp = Math.floor((maxDamage * 4) * (1 + 0.1 * this.game.floorNumber) * randomFactor);
                
                // Добавляем сообщение о полученном опыте
                hud.addLogMessage(`Вы получили ${xp} опыта!`, 'experience');
                
                // Начисляем опыт
                this.game.gainExperience(xp);

                // Создаём труп на месте врага
                const corpse = {
                    x: enemy.x,
                    y: enemy.y,
                    type: 'corpse',
                    glyph: 'corpse',
                    z_index: 3 // Отображаем под врагами, но над полом
                };
                this.game.corpses.push(corpse);

                // Удаляем врага из списка
                const index = this.game.enemySystem.enemies.indexOf(enemy);
                if (index !== -1) {
                    this.game.enemySystem.enemies.splice(index, 1);
                }
            }
        }

        // Очищаем данные атаки
        enemy.pendingDamage = 0;
        enemy.wasHit = false;
        this.game.attackTarget = null;
    }
}