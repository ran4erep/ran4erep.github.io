class Game {
    constructor() {
        // Флаг для включения/отключения главного меню
        this.enableMainMenu = true;
        // Флаг паузы
        this.isPaused = false;
        // ID текущего игрового цикла
        this.gameLoopId = null;
        
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d', { alpha: true });
        this.ctx.imageSmoothingEnabled = false;
        
        this.lastFrameTime = performance.now();
        
        // Позиция игрока (в тайлах)
        this.playerX = 0;
        this.playerY = 0;
        
        // Здоровье игрока
        this.playerHealth = 30;
        this.maxHealth = 30;
        
        // Направление взгляда игрока (в радианах)
        // Начинаем с направления вправо (0 градусов)
        this.lookDirection = 0;
        
        // Карта
        this.currentMap = null;
        
        // Массив дверей с их состояниями
        this.doors = [];
        
        // Массив предметов на земле
        this.floorItems = [];
        
        // Контекстное меню
        this.contextMenu = null;
        
        // Флаг хода противников
        this.isEnemyTurn = false;
        
        // Настройка реального разрешения canvas
        const container = document.getElementById('gameContainer');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        
        // Animation properties
        this.visualX = 0;
        this.visualY = 0;
        this.isMoving = false;
        this.moveStartTime = 0;
        this.moveDuration = 150; // 150ms for movement animation
        
        // Флаг первого кадра
        this.hasFirstFrameRendered = false;
        
        this.lastMoveTime = 0;
        
        // Массив для хранения трупов
        this.corpses = [];
        
        // Экран загрузки
        this.loadingScreen = new LoadingScreen(this);
        this.isLoading = true;
        
        // Флаг смерти игрока
        this.isDead = false;
        
        // Характеристики игрока
        this.playerStats = {
            strength: 10,     // Сила
            dexterity: 10,    // Ловкость
            constitution: 10,  // Телосложение
            intelligence: 10,  // Интеллект
            wisdom: 10,       // Мудрость
            charisma: 10      // Харизма
        };
        
        // Система опыта
        this.level = 1;
        this.experience = 0;
        this.experienceToNextLevel = 100; // Базовое значение для первого уровня
        this.floorNumber = 1; // Текущий этаж подземелья
        this.justLeveledUp = false; // Флаг для отслеживания повышения уровня
        this.justGainedExp = false; // Флаг для отслеживания получения опыта
        
        // Инициализируем системы
        this.inputSystem = null;
        this.inventorySystem = null;
    }

    // Инициализация всех систем
    initSystems(inputSystem, camera, renderer, collisionSystem) {
        this.inputSystem = inputSystem;
        this.camera = camera;
        this.renderer = renderer;
        this.collisionSystem = collisionSystem;
        this.enemySystem = new EnemySystem(this);
        this.combatSystem = new CombatSystem(this);
        this.damageNumberSystem = new DamageNumberSystem(this);
        this.inventorySystem = new InventorySystem(this);
        
        // Инициализируем контекстное меню
        this.contextMenu = new ContextMenu(this);
        
        // Инициализируем дебаг-меню
        this.debugMenu = new DebugMenu(this);

        // Инициализируем главное меню
        this.mainMenu = new MainMenu(this);
        
        // Инициализируем окно статов
        this.statsWindow = new StatsWindow(this);

        // Инициализируем окно справки
        this.helpWindow = new HelpWindow(this);

        // Инициализируем окно лута
        this.lootWindow = new LootWindow(this);
        
        // Показываем главное меню
        if (this.enableMainMenu) {
            this.mainMenu.isPauseMenu = false;
            this.mainMenu.show();
        }
    }

    async startLoading() {
        // Показываем экран загрузки
        this.loadingScreen.show();

        // Запускаем цикл отрисовки экрана загрузки
        const renderLoadingScreen = () => {
            if (this.isLoading) {
                this.loadingScreen.render();
                requestAnimationFrame(renderLoadingScreen);
            }
        };
        renderLoadingScreen();

        try {
            // Функция задержки
            const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

            // Загрузка glyphs.json
            this.loadingScreen.updateProgress(1);
            await glyphSystem.loadGlyphs();

            // Загрузка maps.json
            this.loadingScreen.updateProgress(2);
            await this.loadMaps();

            // Загрузка items.json
            this.loadingScreen.updateProgress(3);
            await this.inventorySystem.loadItems();

            // Загрузка файлов глифов
            this.loadingScreen.updateProgress(4);
            const glyphFiles = ['tiles', 'actors', 'ui'];
            await Promise.all(glyphFiles.map(file => glyphSystem.loadGlyphFile(file)));

            // Секундная пауза после загрузки
            await delay(1000);

            // Загрузка завершена
            this.isLoading = false;
            this.loadingScreen.hide();

            // Запускаем игру
            this.loadMap('test_map');
            this.startGame();
        } catch (error) {
            console.error('Failed to load game resources:', error);
            // Здесь можно добавить отображение ошибки на экране загрузки
        }
    }

    async loadMaps() {
        try {
            const response = await fetch('src/data/maps.json');
            const maps = await response.json();
            this.maps = maps;
            return maps;
        } catch (error) {
            console.error('Failed to load maps:', error);
        }
    }

    startGame() {
        // Останавливаем предыдущий игровой цикл если он был
        if (this.gameLoopId !== null) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        
        // Если карта не загружена, загружаем тестовую карту
        if (!this.currentMap) {
            this.loadMap('test_map');
        }
        
        // Выполняем начальный рендер
        this.renderer.render();
        
        // Запускаем новый игровой цикл
        this.gameLoop();
    }

    loadMap(mapName) {
        // Делаем глубокую копию карты
        const mapData = this.maps[mapName];
        if (!mapData) {
            return;
        }

        // Создаем глубокую копию карты
        this.currentMap = {
            objects: { ...mapData.objects },
            layout: mapData.layout.map(row => row.slice())
        };
        
        // Очищаем массив дверей
        this.doors = [];
        
        // Очищаем массив противников
        this.enemySystem.enemies = [];

        // Вычисляем размеры карты из layout
        this.currentMap.height = this.currentMap.layout.length;
        this.currentMap.width = this.currentMap.layout[0].length;

        // Сканируем карту на наличие дверей и противников
        for (let y = 0; y < this.currentMap.height; y++) {
            for (let x = 0; x < this.currentMap.width; x++) {
                const symbol = this.currentMap.layout[y][x];
                const object = this.currentMap.objects[symbol];
                if (object) {
                    if (object.type === 'door') {
                        this.doors.push({
                            x: x,
                            y: y,
                            isOpened: object.isOpened || false
                        });
                    } else if (object.type === 'enemy') {
                        this.enemySystem.addEnemy(x, y, object.enemyType || 'basic');
                        // Заменяем символ противника на пол
                        const floorSymbol = Object.entries(this.currentMap.objects).find(([_, obj]) => obj.type === 'floor')[0];
                        this.currentMap.layout[y] = this.currentMap.layout[y].substring(0, x) + floorSymbol + this.currentMap.layout[y].substring(x + 1);
                    }
                }
            }
        }

        // Инициализируем карту видимости
        visionSystem.initializeMap(this.currentMap.width, this.currentMap.height);

        // Ищем точку спавна на карте (символ игрока)
        let spawnFound = false;
        for (let y = 0; y < this.currentMap.height; y++) {
            for (let x = 0; x < this.currentMap.width; x++) {
                const symbol = this.currentMap.layout[y][x];
                const object = this.currentMap.objects[symbol];
                if (object && object.type === 'player') {
                    this.playerX = x;
                    this.playerY = y;
                    // Заменяем символ спавна на пол
                    const floorSymbol = Object.entries(this.currentMap.objects).find(([_, obj]) => obj.type === 'floor')[0];
                    this.currentMap.layout[y] = this.currentMap.layout[y].substring(0, x) + floorSymbol + this.currentMap.layout[y].substring(x + 1);
                    spawnFound = true;
                    break;
                }
            }
            if (spawnFound) break;
        }

        if (!spawnFound) {
            console.error('No spawn point found in map:', mapName);
            // Устанавливаем игрока в первую проходимую точку
            for (let y = 0; y < this.currentMap.height; y++) {
                for (let x = 0; x < this.currentMap.width; x++) {
                    const symbol = this.currentMap.layout[y][x];
                    const object = this.currentMap.objects[symbol];
                    if (object && !object.blocks_movement) {
                        this.playerX = x;
                        this.playerY = y;
                        spawnFound = true;
                        break;
                    }
                }
                if (spawnFound) break;
            }
        }

        // Делаем начальную разведку вокруг точки спавна
        visionSystem.exploreInitialArea(this.playerX, this.playerY, this.currentMap.layout);

        // Инициализируем начальную видимость вокруг игрока
        visionSystem.update(this.playerX, this.playerY, this.currentMap.layout, this.lookDirection);

        // Центрируем камеру на игроке
        this.camera.centerOnPlayer();
        
        this.visualX = this.playerX;
        this.visualY = this.playerY;
    }

    gameLoop() {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        // Если игра на паузе, пропускаем обновление
        if (this.isPaused) {
            this.gameLoopId = requestAnimationFrame(() => this.gameLoop());
            return;
        }
        
        // Обновляем ввод
        this.inputSystem.update(deltaTime);
        
        // Обновляем FPS
        hud.update(deltaTime);

        // Обновляем зум камеры
        this.camera.updateZoom(currentTime);

        // Анимация движения игрока
        if (this.isMoving) {
            const progress = (currentTime - this.moveStartTime) / this.moveDuration;
            
            if (progress >= 1) {
                // Анимация завершена
                this.isMoving = false;
                this.visualX = this.playerX;
                this.visualY = this.playerY;
            } else {
                // Интерполируем позицию
                this.visualX = this.lastX + (this.playerX - this.lastX) * progress;
                this.visualY = this.lastY + (this.playerY - this.lastY) * progress;
            }

            // Центрируем камеру на визуальной позиции игрока только при движении
            this.camera.centerOnPosition(this.visualX, this.visualY);
        }

        // Анимация атаки игрока
        if (this.isPlayerAttacking) {
            const progress = (currentTime - this.attackStartTime) / this.attackDuration;
            
            if (progress >= 1) {
                // Анимация завершена
                this.isPlayerAttacking = false;
                this.visualX = this.playerX;
                this.visualY = this.playerY;
                // Завершаем атаку и выводим сообщение
                this.combatSystem.finishPlayerAttack();
            } else {
                if (progress < 0.5) {
                    // Первая половина - движение к врагу
                    this.visualX = this.playerX + (this.attackTarget.x - this.playerX) * progress * 2;
                    this.visualY = this.playerY + (this.attackTarget.y - this.playerY) * progress * 2;
                } else {
                    // Вторая половина - возврат на позицию
                    const returnProgress = (progress - 0.5) * 2;
                    this.visualX = this.attackTarget.x + (this.playerX - this.attackTarget.x) * returnProgress;
                    this.visualY = this.attackTarget.y + (this.playerY - this.attackTarget.y) * returnProgress;
                }
            }
        } else if (!this.isMoving) {
            // Если нет анимаций - центрируем камеру на реальной позиции игрока
            this.camera.centerOnPosition(this.playerX, this.playerY);
        }

        // Обновляем анимации только видимых врагов
        this.enemySystem.enemies.forEach(enemy => {
            const isVisible = visionSystem.isTileVisible(enemy.x, enemy.y);
            
            if (enemy.isMoving) {
                if (isVisible) {
                    const dx = enemy.x - enemy.visualX;
                    const dy = enemy.y - enemy.visualY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 0.1) {
                        enemy.isMoving = false;
                        enemy.visualX = enemy.x;
                        enemy.visualY = enemy.y;
                    } else {
                        enemy.visualX += dx * 0.2;
                        enemy.visualY += dy * 0.2;
                    }
                } else {
                    // Если враг не виден, сразу завершаем его движение
                    enemy.isMoving = false;
                    enemy.visualX = enemy.x;
                    enemy.visualY = enemy.y;
                }
            }
            
            // Анимация парения для видимых летающих врагов
            if ((isVisible || enemy.state === 'chase') && ENEMY_TYPES[enemy.type].flying) {
                // Обновляем время парения
                enemy.hoverTime += 0.1;
                // Вычисляем смещение по синусоиде (только вверх)
                const hoverOffset = Math.abs(Math.sin(enemy.hoverTime)) * 0.2;
                
                // Если враг движется, уменьшаем амплитуду парения
                if (enemy.isMoving) {
                    enemy.visualY = enemy.visualY - hoverOffset * 0.3; // Уменьшенная амплитуда при движении
                } else {
                    enemy.visualY = enemy.y - hoverOffset; // Полная амплитуда при зависании
                }
            }

            // Анимация атаки для видимых врагов
            if (enemy.isAttacking) {
                const progress = (currentTime - enemy.attackStartTime) / enemy.attackDuration;
                
                if (progress >= 1) {
                    // Анимация завершена
                    enemy.isAttacking = false;
                    enemy.visualX = enemy.x;
                    enemy.visualY = enemy.y;
                    // Завершаем атаку и выводим сообщение
                    this.combatSystem.finishAttack(enemy);
                } else {
                    if (progress < 0.5) {
                        // Первая половина - движение к игроку
                        enemy.visualX = enemy.x + (this.playerX - enemy.x) * progress * 2;
                        enemy.visualY = enemy.y + (this.playerY - enemy.y) * progress * 2;
                    } else {
                        // Вторая половина - возврат на позицию
                        const returnProgress = (progress - 0.5) * 2;
                        enemy.visualX = this.playerX + (enemy.x - this.playerX) * returnProgress;
                        enemy.visualY = this.playerY + (enemy.y - this.playerY) * returnProgress;
                    }
                }
            }
        });

        // Проверяем завершение анимаций врагов и выполняем оставшиеся ходы
        this.checkEnemyAnimations();

        // Обновляем видимость и рендерим
        visionSystem.update(this.playerX, this.playerY, this.currentMap.layout, this.lookDirection);
        this.renderer.render();

        // Рендерим инвентарь поверх всего
        if (this.inventorySystem) {
            this.inventorySystem.render(this.ctx);
        }

        // Рендерим окно статов
        if (this.statsWindow) {
            this.statsWindow.render(this.ctx);
        }

        // Рендерим главное меню поверх всего
        if (this.mainMenu && this.mainMenu.isVisible) {
            this.mainMenu.render(this.ctx);
        }

        // Отрисовываем окно лута
        this.lootWindow.render(this.ctx);

        // Планируем следующий кадр
        this.gameLoopId = requestAnimationFrame(() => this.gameLoop());
    }

    tryMove(dx, dy) {
        // Если игрок мёртв, движение запрещено
        if (this.isDead) return false;
        
        // Если сейчас ход противников, движение запрещено
        if (this.isEnemyTurn) return false;

        const newX = this.playerX + dx;
        const newY = this.playerY + dy;

        // Проверяем, можем ли атаковать врага на этой клетке
        if (this.combatSystem.canPlayerAttack(newX, newY)) {
            this.combatSystem.playerAttack(newX, newY);
            
            if (dx !== 0 || dy !== 0) {
                this.lookDirection = Math.atan2(dy, dx);
            }
            
            // Увеличиваем счетчик ходов
            this.lastMoveTime++;

            // Начинаем ход противников
            this.startEnemyTurn();
            
            return true;
        }

        // Если не атакуем, пробуем двигаться
        if (this.canMoveTo(newX, newY)) {
            // Сохраняем старую позицию для анимации
            this.lastX = this.playerX;
            this.lastY = this.playerY;
            
            // Обновляем реальную позицию
            this.playerX = newX;
            this.playerY = newY;
            
            // Начинаем анимацию
            this.isMoving = true;
            this.moveStartTime = performance.now();

            if (dx !== 0 || dy !== 0) {
                this.lookDirection = Math.atan2(dy, dx);
            }
            
            // Увеличиваем счетчик ходов
            this.lastMoveTime++;

            // Проверяем видимость игрока для врагов
            this.enemySystem.checkPlayerVisibility();

            // Начинаем ход противников
            this.startEnemyTurn();
            
            return true;
        }
        return false;
    }

    startEnemyTurn() {
        this.isEnemyTurn = true;
        // Сбрасываем ходы для всех врагов
        this.enemySystem.enemies.forEach(enemy => enemy.resetMoves());
        // Сбрасываем флаг сообщений для нового хода
        hud.hasMessagesInCurrentTurn = false;
        this.processEnemyTurn();
    }

    processEnemyTurn() {
        // Если есть анимации игрока, ждем их завершения
        if (this.isMoving || this.isPlayerAttacking) {
            return;
        }

        // Если идёт анимация атаки какого-либо врага, ждём её завершения
        if (this.enemySystem.enemies.some(enemy => enemy.isAttacking)) {
            return;
        }

        // Находим всех врагов, у которых остались очки действий
        const activeEnemies = this.enemySystem.enemies.filter(enemy => enemy.movesLeft > 0);

        if (activeEnemies.length > 0) {
            // Находим всех врагов, которые могут атаковать
            const attackingEnemies = activeEnemies.filter(enemy => this.combatSystem.canEnemyAttack(enemy));
            
            // Если атакующих больше одного, обрабатываем их по очереди
            if (attackingEnemies.length > 1) {
                const attacker = attackingEnemies[0];
                this.combatSystem.enemyAttack(attacker);
                return;
            }

            // В остальных случаях обрабатываем всех врагов параллельно
            let anyEnemyMoved = false;
            
            activeEnemies.forEach(enemy => {
                // Если враг уже в процессе анимации, пропускаем его
                if (enemy.isMoving || enemy.isAttacking) return;

                // Сначала проверяем, не видит ли враг игрока
                if (enemy.canSeePlayer(this)) {
                    enemy.lastKnownPlayerX = this.playerX;
                    enemy.lastKnownPlayerY = this.playerY;
                    if (enemy.state !== 'chase') {
                        enemy.statusGlyph = 'alert';
                        enemy.state = 'chase';
                        enemy.isChasing = true;
                    }
                }

                // Если враг может атаковать, делаем это
                if (this.combatSystem.canEnemyAttack(enemy)) {
                    this.combatSystem.enemyAttack(enemy);
                    anyEnemyMoved = true;
                    return;
                }

                // Если не может атаковать, пытается двигаться
                const oldX = enemy.x;
                const oldY = enemy.y;
                
                enemy.update(this);
                
                // Если позиция изменилась
                if (oldX !== enemy.x || oldY !== enemy.y) {
                    const isVisible = visionSystem.isTileVisible(oldX, oldY) || visionSystem.isTileVisible(enemy.x, enemy.y);
                    if (isVisible) {
                        // Если враг был виден в начальной или конечной позиции, анимируем движение
                        enemy.isMoving = true;
                        anyEnemyMoved = true;
                    } else {
                        // Если враг не виден, сразу обновляем его визуальную позицию
                        enemy.visualX = enemy.x;
                        enemy.visualY = enemy.y;
                    }
                }

                // После движения снова проверяем, не видит ли враг игрока
                if (enemy.canSeePlayer(this)) {
                    enemy.lastKnownPlayerX = this.playerX;
                    enemy.lastKnownPlayerY = this.playerY;
                    if (enemy.state !== 'chase') {
                        enemy.statusGlyph = 'alert';
                        enemy.state = 'chase';
                        enemy.isChasing = true;
                    }
                }
            });

            // Если хотя бы один видимый враг двигался или атаковал, ждём завершения анимации
            if (anyEnemyMoved) {
                return;
            }
            
            // Обновляем видимость
            visionSystem.update(this.playerX, this.playerY, this.currentMap.layout, this.lookDirection);
        } else {
            // Если активных врагов больше нет, заканчиваем ход противников
            this.isEnemyTurn = false;
        }
    }

    // Метод для проверки завершения анимации врагов и выполнения оставшихся ходов
    checkEnemyAnimations() {
        // Если не ход противников, ничего не делаем
        if (!this.isEnemyTurn) return;

        // Если есть активные анимации видимых врагов или игрока, ждем их завершения
        if (this.isMoving || this.enemySystem.hasVisibleMovingEnemies()) {
            return;
        }

        // Продолжаем ход противников
        this.processEnemyTurn();
    }

    toggleDoor() {
        const doorPos = this.collisionSystem.canInteractWithDoor(this.playerX, this.playerY);
        if (doorPos) {
            // Ищем дверь в массиве по координатам
            const door = this.doors.find(d => d.x === doorPos.x && d.y === doorPos.y);
            if (door) {
                // Если дверь открыта, проверяем нет ли на ней противника
                if (door.isOpened) {
                    const enemyOnDoor = this.enemySystem.enemies.some(enemy => 
                        enemy.x === door.x && enemy.y === door.y
                    );
                    if (enemyOnDoor) {
                        return false; // Нельзя закрыть дверь, если на ней стоит противник
                    }
                }
                
                door.isOpened = !door.isOpened;
                // Обновляем видимость
                visionSystem.update(this.playerX, this.playerY, this.currentMap.layout, this.lookDirection);
                this.renderer.render();
                
                // Запускаем ход противников после успешного действия с дверью
                this.startEnemyTurn();
                
                return true;
            }
        }
        return false;
    }

    // Определяет тип пола на основе окружающих тайлов
    determineFloorType(x, y) {
        const floorCounts = new Map();
        
        // Проверяем все соседние тайлы
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx >= 0 && nx < this.currentMap.width && ny >= 0 && ny < this.currentMap.height) {
                    const symbol = this.currentMap.layout[ny][nx];
                    const object = this.currentMap.objects[symbol];
                    
                    if (object && object.type === 'floor') {
                        const count = floorCounts.get(object.glyph) || 0;
                        floorCounts.set(object.glyph, count + 1);
                    }
                }
            }
        }
        
        // Находим самый часто встречающийся тип пола
        let maxCount = 0;
        let mostCommonFloor = 'floor'; // По умолчанию
        
        floorCounts.forEach((count, floorType) => {
            if (count > maxCount) {
                maxCount = count;
                mostCommonFloor = floorType;
            }
        });
        
        return mostCommonFloor;
    }

    showContextMenu() {
        if (this.contextMenu) {
            // Если меню уже открыто, ничего не делаем
            if (this.contextMenu.isVisible) return;
            
            const actions = this.contextMenu.getAvailableActions(this.playerX, this.playerY);
            if (actions.length > 0) {
                this.contextMenu.show(this.playerX, this.playerY, actions);
            }
        }
    }

    canMoveTo(x, y) {
        // Check map boundaries
        if (x < 0 || x >= this.currentMap.width || y < 0 || y >= this.currentMap.height) {
            return false;
        }

        // Get the symbol at the target position
        const symbol = this.currentMap.layout[y][x];
        const object = this.currentMap.objects[symbol];

        // Check if the tile blocks movement
        if (!object) return false;
        
        // Для дверей проверяем состояние в массиве doors
        if (object.type === 'door') {
            const door = this.doors.find(d => d.x === x && d.y === y);
            if (door && !door.isOpened) {
                return false;
            }
        }
        
        // Проверяем, нет ли на тайле врага
        if (this.enemySystem.isEnemyAt(x, y)) {
            return false;
        }
        
        return !object.blocks_movement;
    }

    update() {
        // Обновляем системы
        this.inputSystem.update();
        this.enemySystem.update();
        this.damageNumberSystem.update();
    }

    async startNewGame() {
        // Показываем экран загрузки
        this.isLoading = true;
        
        // Сбрасываем здоровье
        this.playerHealth = 30;
        this.maxHealth = 30;
        
        // Сбрасываем опыт и уровень
        this.level = 1;
        this.experience = 0;
        this.experienceToNextLevel = 100;
        this.floorNumber = 1;
        this.justLeveledUp = false;
        this.justGainedExp = false;
        
        // Сбрасываем флаг смерти
        this.isDead = false;
        
        // Очищаем массив трупов
        this.corpses = [];
        
        // Очищаем массив предметов на земле
        this.floorItems = [];
        
        // Очищаем лог
        hud.clearLog();

        // Загружаем все ресурсы
        await this.startLoading();
        
        // Инициализируем стартовые предметы
        if (this.inventorySystem) {
            this.inventorySystem.initStartingItems();
        }
    }

    gainExperience(amount) {
        this.experience += amount;
        this.justGainedExp = true; // Устанавливаем флаг при получении опыта
        while (this.experience >= this.experienceToNextLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.experience -= this.experienceToNextLevel;
        // Каждый следующий уровень требует на 60% больше опыта
        this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.6);
        // Восстанавливаем здоровье при повышении уровня
        this.playerHealth = this.maxHealth;
        // Устанавливаем флаг повышения уровня
        this.justLeveledUp = true;
        // Добавляем сообщение в лог
        hud.addLogMessage(`Вы достигли ${this.level} уровня!`, 'level-up');
    }
}

// Запуск игры
const game = new Game();
const camera = new Camera(game);
const renderer = new Renderer(game, camera);
const collisionSystem = new CollisionSystem(game);
const inputSystem = new InputSystem(game);

// Инициализация систем
game.initSystems(inputSystem, camera, renderer, collisionSystem); 