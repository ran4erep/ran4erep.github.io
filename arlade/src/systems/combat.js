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
            enemy.attackDuration = 150; // 150ms для атаки
            
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
                // Наносим урон
                this.game.playerHealth -= enemy.pendingAttack.damage;
                
                // Создаём число урона
                this.game.damageNumberSystem.addNumber(
                    this.game.playerX,
                    this.game.playerY,
                    enemy.pendingAttack.damage,
                    true, // урон игроку
                    false // это не уклонение
                );
                
                // Выводим сообщение в лог
                hud.addLogMessage(`${enemy.pendingAttack.enemyName} ${enemy.pendingAttack.attackName} вас на ${enemy.pendingAttack.damage} единиц урона!`, 'attack');
                
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
            this.game.attackDuration = 150; // 150ms для атаки
            
            // Сохраняем цель атаки
            this.game.attackTarget = enemy;
            
            // Получаем оружие
            const weapon = this.game.inventorySystem.equipped.weapon;
            
            // Определяем какую характеристику использовать для атаки
            let attackModifier;
            if (!weapon) {
                // Без оружия используем силу (рукопашный бой)
                attackModifier = this.getStatModifier(this.game.playerStats.strength);
            } else {
                // С оружием используем силу для ближнего боя и ловкость для дальнего
                if (weapon.weaponType === 'melee') {
                    attackModifier = this.getStatModifier(this.game.playerStats.strength);
                } else if (weapon.weaponType === 'ranged') {
                    attackModifier = this.getStatModifier(this.game.playerStats.dexterity);
                }
            }
            
            // Бросок атаки d20 + модификатор
            const attackRoll = Math.floor(Math.random() * 20) + 1; // d20
            const totalAttackRoll = attackRoll + attackModifier;
            
            // Проверяем попадание
            if (totalAttackRoll < ENEMY_TYPES[enemy.type].armorClass) {
                // Промах
                this.game.pendingAttack = {
                    damage: 0,
                    targetEnemy: enemy,
                    missed: true
                };
            } else {
                // Считаем урон
                let damage = this.rollDice(weapon?.damage);
                
                // Минимальный урон всегда 1
                damage = Math.max(1, damage);
                
                // Сохраняем данные атаки для применения после анимации
                this.game.pendingAttack = {
                    damage: damage,
                    targetEnemy: enemy,
                    missed: false
                };
            }
            
            return true;
        }
        return false;
    }

    // Завершение атаки игрока после анимации
    finishPlayerAttack() {
        if (this.game.pendingAttack) {
            const enemy = this.game.pendingAttack.targetEnemy;
            
            if (this.game.pendingAttack.missed) {
                // Выводим сообщение о промахе
                hud.addLogMessage(`Вы промахиваетесь по ${ENEMY_TYPES[enemy.type].description}`, 'dodge');
                // Показываем "ПРОМАХ" над врагом
                this.game.damageNumberSystem.addNumber(
                    enemy.x,
                    enemy.y,
                    0,
                    false, // урон врагу
                    true  // это промах
                );
            } else {
                // Наносим урон
                enemy.health -= this.game.pendingAttack.damage;
                
                // Создаём число урона
                this.game.damageNumberSystem.addNumber(
                    enemy.x,
                    enemy.y,
                    this.game.pendingAttack.damage,
                    false, // урон врагу
                    false  // это не промах
                );
                
                // Выводим сообщение в лог
                hud.addLogMessage(`Вы атакуете ${ENEMY_TYPES[enemy.type].description} и наносите ${this.game.pendingAttack.damage} урона!`, 'attack');
                
                // Если враг погиб
                if (enemy.health <= 0) {
                    hud.addLogMessage(`${ENEMY_TYPES[enemy.type].description} погибает!`, 'attack');
                    
                    // Добавляем труп на место гибели врага
                    this.game.corpses.push({
                        x: enemy.x,
                        y: enemy.y,
                        type: 'corpse',
                        glyph: 'corpse',
                        z_index: 3 // Отображаем под врагами, но над полом
                    });
                    
                    this.game.enemySystem.removeEnemy(enemy);
                }
            }
            
            // Очищаем данные атаки
            this.game.pendingAttack = null;
            this.game.attackTarget = null;
        }
    }
}