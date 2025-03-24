class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d', { alpha: true });
        this.ctx.imageSmoothingEnabled = false;
        
        this.lastFrameTime = performance.now();
        
        // Позиция игрока (в тайлах)
        this.playerX = 0;
        this.playerY = 0;
        
        // Направление взгляда игрока (в радианах)
        // Начинаем с направления вправо (0 градусов)
        this.lookDirection = 0;
        
        // Здоровье игрока
        this.playerHealth = 100;
        this.playerMaxHealth = 100;
        
        // Флаг окончания игры
        this.isGameOver = false;
        
        // Режим от первого лица
        this.isFirstPersonMode = false;
        // Боевой режим
        this.isCombatMode = false;
        this.firstPersonCanvas = document.createElement('canvas');
        this.firstPersonCtx = this.firstPersonCanvas.getContext('2d');
        
        // Карта
        this.currentMap = null;
        
        // Массив дверей с их состояниями
        this.doors = [];
        
        // Контекстное меню
        this.contextMenu = null;
        
        // Настройка реального разрешения canvas
        const container = document.getElementById('gameContainer');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.firstPersonCanvas.width = container.clientWidth;
        this.firstPersonCanvas.height = container.clientHeight;
        
        // Animation properties
        this.visualX = 0;
        this.visualY = 0;
        this.isMoving = false;
        this.moveStartTime = 0;
        this.moveDuration = 150; // 150ms for movement animation
        
        // Флаг первого кадра
        this.hasFirstFrameRendered = false;
        
        this.lastMoveTime = 0;
        
        this.isEnemyTurnInProgress = false;
        
        // Флаг фиксации индикатора прицеливания
        this.isAimIndicatorFixed = false;
    }

    // Инициализация всех систем
    initSystems(inputSystem, camera, renderer, collisionSystem) {
        this.inputSystem = inputSystem;
        this.camera = camera;
        this.renderer = renderer;
        this.collisionSystem = collisionSystem;
        this.enemySystem = new EnemySystem(this);
        
        // Инициализируем контекстное меню
        this.contextMenu = new ContextMenu(this);
        
        // Инициализируем дебаг-меню
        this.debugMenu = new DebugMenu(this);
        
        // Загрузка ресурсов и старт игры
        Promise.all([
            this.loadMaps(),
            glyphSystem.loadGlyphs()
        ]).then(() => {
            this.startGame();
        });
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
        // Загружаем тестовую карту
        this.loadMap('test_map');
        
        // Устанавливаем начальное здоровье
        this.playerHealth = this.playerMaxHealth;
        hud.updateHealth(this.playerHealth, this.playerMaxHealth);
        
        // Выполняем начальный рендер
        this.renderer.render();
        
        // Запускаем игровой цикл
        this.gameLoop();
    }

    loadMap(mapName) {
        this.currentMap = this.maps[mapName];
        if (!this.currentMap) {
            console.error('Map not found:', mapName);
            return;
        }

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
        this.inputSystem.update(deltaTime);
        // Update FPS counter
        hud.update(deltaTime);

        // Handle movement animation
        if (this.isMoving) {
            const elapsedTime = currentTime - this.moveStartTime;
            const progress = Math.min(elapsedTime / this.moveDuration, 1);

            if (progress >= 1) {
                this.isMoving = false;
                this.visualX = this.playerX;
                this.visualY = this.playerY;
            } else {
                this.visualX = this.playerX - (this.playerX - this.visualX) * (1 - progress);
                this.visualY = this.playerY - (this.playerY - this.visualY) * (1 - progress);
            }
            
            // Центрируем камеру на визуальной позиции игрока во время анимации
            this.camera.centerOnPosition(this.visualX, this.visualY);
        }

        // Обновляем анимацию движения врагов
        this.enemySystem.enemies.forEach(enemy => {
            // Обновляем анимацию только для видимых врагов
            if (visionSystem.isTileVisible(enemy.x, enemy.y)) {
                enemy.updateAnimation();
            } else {
                // Для невидимых врагов сразу устанавливаем конечную позицию
                enemy.visualX = enemy.x;
                enemy.visualY = enemy.y;
                enemy.isMoving = false;
            }
        });

        // Обновляем масштаб камеры
        if (this.camera.isZooming) {
            this.camera.updateZoom(currentTime);
        }

        // Обновляем видимость и рендерим
        visionSystem.update(this.playerX, this.playerY, this.currentMap.layout, this.lookDirection);
        this.renderer.render();

        // Планируем следующий кадр
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    tryMove(dx, dy) {
        // Если игра окончена, движение запрещено
        if (this.isGameOver) return false;

        // Если игрок анимируется или есть видимые анимирующиеся враги, движение запрещено
        if (this.isMoving || this.enemySystem.hasVisibleMovingEnemies()) return false;

        const newX = this.playerX + dx;
        const newY = this.playerY + dy;

        if (this.canMoveTo(newX, newY)) {
            // Start animation
            this.isMoving = true;
            this.moveStartTime = performance.now();

            if (dx !== 0 || dy !== 0) {
                this.lookDirection = Math.atan2(dy, dx);
            }
            
            // Update actual position
            this.playerX = newX;
            this.playerY = newY;

            // Увеличиваем счетчик ходов перед проверкой видимости
            this.lastMoveTime++;

            // Проверяем видимость игрока для всех врагов после движения
            this.enemySystem.checkPlayerVisibility();

            // После успешного хода игрока - ход противников
            this.enemyTurn();
            
            return true;
        }
        return false;
    }

    enemyTurn() {
        // Устанавливаем флаг, что идёт ход противников
        this.isEnemyTurnInProgress = true;

        // Сбрасываем ходы для всех врагов
        this.enemySystem.enemies.forEach(enemy => enemy.resetMoves());
        
        // Создаем функцию для выполнения одного хода врага
        const processEnemyTurn = () => {
            let enemyMoved = false;
            
            // Ищем врага, у которого остались действия
            for (const enemy of this.enemySystem.enemies) {
                if (enemy.actionsLeft > 0) {
                    // Запоминаем старую позицию
                    const oldX = enemy.x;
                    const oldY = enemy.y;
                    
                    // Делаем один ход
                    enemy.update(this);
                    
                    // Если позиция изменилась, запускаем анимацию
                    if (oldX !== enemy.x || oldY !== enemy.y) {
                        enemyMoved = true;
                        // Обновляем видимость и рендерим
                        visionSystem.update(this.playerX, this.playerY, this.currentMap.layout, this.lookDirection);
                        this.renderer.render();
                        
                        // Планируем следующий ход через 150мс
                        setTimeout(processEnemyTurn, 150);
                        break;
                    }
                }
            }
            
            // Если никто не двигался, значит ходы закончились
            if (!enemyMoved) {
                // Финальное обновление видимости
                visionSystem.update(this.playerX, this.playerY, this.currentMap.layout, this.lookDirection);
                // Разблокируем индикатор прицеливания
                this.isAimIndicatorFixed = false;
                this.renderer.render();
                // Сбрасываем флаг хода противников
                this.isEnemyTurnInProgress = false;
            }
        };
        
        // Запускаем первый ход
        processEnemyTurn();
    }

    handleEnemyAttack(enemy) {
        // Если включен режим бессмертия, урон не наносится
        if (this.debugMode?.immortality) {
            return;
        }

        // Базовый урон врага
        const damage = 10;
        
        // Наносим урон игроку
        this.playerHealth = Math.max(0, this.playerHealth - damage);
        
        // Обновляем индикатор здоровья
        hud.updateHealth(this.playerHealth, this.playerMaxHealth);
        
        // Показываем эффект получения урона
        hud.showDamageEffect();
        
        // Если здоровье закончилось - игра окончена
        if (this.playerHealth <= 0) {
            // Устанавливаем флаг окончания игры
            this.isGameOver = true;
            
            // Ждем окончания всех анимаций перед показом окна
            const checkAnimations = () => {
                if (this.isMoving || this.enemySystem.hasVisibleMovingEnemies()) {
                    // Если есть активные анимации, проверяем снова через 100мс
                    setTimeout(checkAnimations, 100);
                } else {
                    // Все анимации завершены, делаем последний рендер
                    this.renderer.render();
                    // Показываем окно о конце игры
                    setTimeout(() => {
                        alert('Game Over!');
                        location.reload();
                    }, 100);
                }
            };
            
            // Запускаем проверку анимаций
            checkAnimations();
        }
    }

    // Добавляем метод для восстановления здоровья (можно использовать для аптечек)
    healPlayer(amount) {
        this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + amount);
        hud.updateHealth(this.playerHealth, this.playerMaxHealth);
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

    // Метод для переключения боевого режима
    toggleCombatMode() {
        this.isCombatMode = !this.isCombatMode;
        if (this.isCombatMode) {
            // При входе в боевой режим всегда включаем вид от первого лица
            this.isFirstPersonMode = true;
            // Заставляем только видимых врагов заметить игрока
            this.enemySystem.enemies.forEach(enemy => {
                if (enemy.state !== 'chase' && visionSystem.isTileVisible(enemy.x, enemy.y)) {
                    enemy.state = 'chase';
                    enemy.lastStateChangeTime = this.lastMoveTime;
                    enemy.isChasing = true;
                    enemy.lastKnownPlayerX = this.playerX;
                    enemy.lastKnownPlayerY = this.playerY;
                    enemy.turnsWithoutPlayer = 0;
                }
            });
        } else {
            // При выходе из боевого режима отключаем вид от первого лица
            this.isFirstPersonMode = false;
        }
        // Перерисовываем игру
        this.renderer.render();
    }

    // Метод для обработки стрельбы
    handleShoot() {
        // Проверяем, можно ли сейчас стрелять
        if (!this.isCombatMode || this.isEnemyTurnInProgress || this.isGameOver || this.isAimIndicatorFixed) return;

        // Фиксируем индикатор прицеливания
        this.isAimIndicatorFixed = true;

        // Получаем точность выстрела
        const accuracy = this.renderer.checkAimAccuracy();
        
        // Если промах - показываем эффект и передаём ход противнику
        if (accuracy === 0) {
            console.log('Промах!');
            hud.showMissEffect();
            setTimeout(() => this.enemyTurn(), 500);
            return;
        }

        // Проверяем, есть ли враг перед игроком
        const maxDistance = 8; // Максимальная дистанция выстрела
        const dirX = Math.cos(this.lookDirection);
        const dirY = Math.sin(this.lookDirection);
        let hitEnemy = null;
        let hitDistance = maxDistance;

        // Проверяем каждого врага
        this.enemySystem.enemies.forEach(enemy => {
            if (enemy.health <= 0) return; // Пропускаем уже мертвых врагов

            // Вычисляем вектор к врагу
            const dx = enemy.x - this.playerX;
            const dy = enemy.y - this.playerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Если враг слишком далеко, пропускаем
            if (distance > maxDistance) return;

            // Вычисляем угол между направлением взгляда и вектором к врагу
            const angle = Math.atan2(dy, dx);
            let angleDiff = angle - this.lookDirection;
            
            // Нормализуем разницу углов в диапазон [-π, π]
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

            // Проверяем, находится ли враг в конусе обзора (±15 градусов)
            if (Math.abs(angleDiff) <= Math.PI / 12) {
                // Проверяем, есть ли прямая видимость до врага
                if (visionSystem.hasLineOfSight(this.playerX, this.playerY, enemy.x, enemy.y, this.currentMap.layout)) {
                    // Если этот враг ближе предыдущего найденного, запоминаем его
                    if (distance < hitDistance) {
                        hitEnemy = enemy;
                        hitDistance = distance;
                    }
                }
            }
        });

        // Если нашли врага, наносим урон
        if (hitEnemy) {
            // Базовый урон - 20, максимальный множитель от точности - 2
            const damageMultiplier = 1 + (accuracy / 100);
            const damage = Math.round(20 * damageMultiplier);
            
            hitEnemy.health -= damage;
            hitEnemy.showDamageEffect(); // Активируем эффект урона
            console.log(`Попадание! Урон: ${damage}, Здоровье врага: ${hitEnemy.health}`);

            // Если враг убит
            if (hitEnemy.health <= 0) {
                // Удаляем врага через небольшую задержку
                setTimeout(() => {
                    const index = this.enemySystem.enemies.indexOf(hitEnemy);
                    if (index !== -1) {
                        this.enemySystem.enemies.splice(index, 1);
                    }
                }, 200); // Задержка в 200мс
                console.log('Враг уничтожен!');
            }
        } else {
            console.log('Нет цели в зоне поражения!');
        }

        // После выстрела - ход противников с задержкой
        setTimeout(() => this.enemyTurn(), 500);
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