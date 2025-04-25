class InputSystem {
    constructor(game) {
        this.game = game;
        
        // Состояние клавиш
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            upLeft: false,
            upRight: false,
            downLeft: false,
            downRight: false
        };
        
        // Время последнего движения
        this.lastMoveTime = 0;
        // Задержка между движениями (в миллисекундах)
        this.moveDelay = 150;

        // Режим осмотра
        this.isLookMode = false;
        this.lookX = 0;
        this.lookY = 0;
        
        // Флаг возможности зажатия клавиш
        this.canHoldKeys = true;
        
        this.bindKeys();
    }

    // Определение активного UI элемента
    getActiveUI() {
        // Последовательность проверки важна - проверяем от "высших" к "низшим" по приоритету
        
        // Главное меню и меню паузы имеют наивысший приоритет
        if (this.game.mainMenu?.isVisible) {
            return this.game.mainMenu.isPauseMenu ? 'pauseMenu' : 'mainMenu';
        }
        
        if (this.game.inventorySystem.isOpen) {
            return 'inventory';
        }
        
        if (this.game.lootWindow.isOpen) {
            return 'lootWindow';
        }
        
        if (this.game.contextMenu?.isVisible) {
            return 'contextMenu';
        }
        
        if (this.game.debugMenu?.isVisible) {
            return 'debugMenu';
        }
        
        if (this.game.statsWindow?.visible) {
            return 'statsWindow';
        }
        
        if (this.game.helpWindow?.visible) {
            return 'helpWindow';
        }
        
        if (this.isLookMode) {
            return 'lookMode';
        }
        
        return 'gameControls';
    }

    bindKeys() {
        document.addEventListener('keydown', (e) => {
            // Проверяем видимость врагов для зажатия клавиш
            const visibleArea = this.game.camera.getVisibleArea();
            const visibleEnemies = this.game.enemySystem.enemies.filter(enemy => {
                // Проверяем, находится ли враг в видимой области камеры
                if (enemy.x < visibleArea.startTileX || enemy.x >= visibleArea.endTileX ||
                    enemy.y < visibleArea.startTileY || enemy.y >= visibleArea.endTileY) {
                    return false;
                }

                // Проверяем видимость врага (не в чёрном тумане войны)
                const visibility = visionSystem.visibilityMap[enemy.y][enemy.x];
                return visibility === 2;
            });

            // Если есть видимые враги и клавиша зажата - игнорируем
            if (visibleEnemies.length > 0 && e.repeat) {
                return;
            }

            // Получаем текущий активный UI
            const activeUI = this.getActiveUI();
            
            // Обрабатываем ввод в зависимости от активного UI
            switch (activeUI) {
                case 'mainMenu':
                case 'pauseMenu':
                    // В главном меню и меню паузы клавиши обрабатываются самим меню
                    // Просто игнорируем любые нажатия клавиш в input system
                    return;
                    
                case 'inventory':
                    // i всегда закрывает инвентарь
                    if (e.code === 'KeyI') {
                        this.game.inventorySystem.toggleInventory();
                        return;
                    }
                    
                    // Передаём все клавиши в инвентарь
                    // Инвентарь сам определит, какое подменю сейчас открыто
                    switch (e.code) {
                        case 'ArrowUp':
                        case 'KeyW':
                            this.game.inventorySystem.handleKeyPress('ArrowUp');
                            break;
                        case 'ArrowDown':
                        case 'KeyS':
                            this.game.inventorySystem.handleKeyPress('ArrowDown');
                            break;
                        case 'ArrowLeft':
                        case 'KeyA':
                            this.game.inventorySystem.handleKeyPress('ArrowLeft');
                            break;
                        case 'ArrowRight':
                        case 'KeyD':
                            this.game.inventorySystem.handleKeyPress('ArrowRight');
                            break;
                        case 'Enter':
                            this.game.inventorySystem.handleKeyPress('Enter');
                            break;
                        case 'Space':
                            this.game.inventorySystem.handleKeyPress(' ');
                            break;
                        case 'Escape':
                            this.game.inventorySystem.handleKeyPress('Escape');
                            break;
                    }
                    return;
                    
                case 'lootWindow':
                    // Передаём клавиши в окно подбора предметов
                    switch (e.code) {
                        case 'ArrowUp':
                        case 'KeyW':
                            this.game.lootWindow.handleKeyPress('ArrowUp');
                            break;
                        case 'ArrowDown':
                        case 'KeyS':
                            this.game.lootWindow.handleKeyPress('ArrowDown');
                            break;
                        case 'ArrowLeft':
                        case 'KeyA':
                            this.game.lootWindow.handleKeyPress('ArrowLeft');
                            break;
                        case 'ArrowRight':
                        case 'KeyD':
                            this.game.lootWindow.handleKeyPress('ArrowRight');
                            break;
                        case 'Space':
                            this.game.lootWindow.handleKeyPress('Space');
                            break;
                        case 'Enter':
                            this.game.lootWindow.handleKeyPress('Enter');
                            break;
                        case 'Escape':
                            this.game.lootWindow.handleKeyPress('Escape');
                            break;
                    }
                    return;
                    
                case 'contextMenu':
                    // Клавиши для контекстного меню обрабатываются в самом меню
                    return;
                    
                case 'debugMenu':
                    // Клавиши для меню отладки обрабатываются в самом меню
                    return;
                    
                case 'statsWindow':
                    // Закрытие окна статистики
                    if (e.code === 'Escape') {
                        this.game.statsWindow.toggle();
                    }
                    return;
                    
                case 'helpWindow':
                    // Закрытие окна помощи
                    if (e.code === 'Escape') {
                        this.game.helpWindow.toggle();
                    }
                    return;
                    
                case 'lookMode':
                    // Выход из режима осмотра
                    if (e.code === 'KeyL' || e.code === 'Escape') {
                        this.isLookMode = false;
                        return;
                    }
                    
                    // Обрабатываем клавиши перемещения для режима осмотра
                    switch (e.code) {
                        case 'ArrowUp':
                        case 'KeyW':
                            this.lookY = Math.max(0, this.lookY - 1);
                            break;
                        case 'ArrowDown':
                        case 'KeyS':
                            this.lookY = this.lookY + 1;
                            break;
                        case 'ArrowLeft':
                        case 'KeyA':
                            this.lookX = Math.max(0, this.lookX - 1);
                            break;
                        case 'ArrowRight':
                        case 'KeyD':
                            this.lookX = this.lookX + 1;
                            break;
                    }
                    return;
                    
                case 'gameControls':
                    // Стандартное управление игрой
                    switch (e.code) {
                        case 'KeyL':
                            this.isLookMode = true;
                            this.lookX = this.game.playerX;
                            this.lookY = this.game.playerY;
                            break;
                        case 'KeyG':
                            // Открываем меню подбора предметов
                            this.game.lootWindow.open();
                            break;
                        case 'Escape':
                            this.game.mainMenu.isPauseMenu = true;
                            this.game.mainMenu.show();
                            break;
                        case 'ArrowUp':
                        case 'KeyW':
                            if (e.shiftKey) {
                                // Пропуск хода только если не ход противников и нет анимаций
                                if (!this.game.isEnemyTurn && !this.game.isMoving && !this.game.isPlayerAttacking) {
                                    hud.addLogMessage('Вы пропустили ход');
                                    this.game.startEnemyTurn();
                                }
                            } else {
                                this.keys.up = true;
                            }
                            break;
                        case 'ArrowDown':
                        case 'KeyS':
                            this.keys.down = true;
                            break;
                        case 'ArrowLeft':
                        case 'KeyA':
                            this.keys.left = true;
                            break;
                        case 'ArrowRight':
                        case 'KeyD':
                            this.keys.right = true;
                            break;
                        case 'KeyQ':
                            this.keys.upLeft = true;
                            break;
                        case 'KeyE':
                            this.keys.upRight = true;
                            break;
                        case 'KeyZ':
                            this.keys.downLeft = true;
                            break;
                        case 'KeyC':
                            if (e.shiftKey) {
                                // Shift+C для закрытия двери
                                const doorPos = this.game.collisionSystem.canInteractWithDoor(this.game.playerX, this.game.playerY);
                                if (doorPos) {
                                    const door = this.game.doors.find(d => d.x === doorPos.x && d.y === doorPos.y);
                                    if (door && door.isOpened) {
                                        this.game.toggleDoor();
                                    }
                                }
                            } else {
                                this.keys.downRight = true;
                            }
                            break;
                        case 'KeyO':
                            if (e.shiftKey) {
                                // Shift+O для открытия двери
                                const doorPos = this.game.collisionSystem.canInteractWithDoor(this.game.playerX, this.game.playerY);
                                if (doorPos) {
                                    const door = this.game.doors.find(d => d.x === doorPos.x && d.y === doorPos.y);
                                    if (door && !door.isOpened) {
                                        this.game.toggleDoor();
                                    }
                                }
                            }
                            break;
                        case 'Space':
                            // Контекстное меню открывается только если нет других активных UI элементов
                            this.game.showContextMenu();
                            break;
                        case 'Minus':
                            this.game.camera.zoomOut();
                            break;
                        case 'Equal':
                            this.game.camera.zoomIn();
                            break;
                        case 'KeyI':
                            this.game.inventorySystem.toggleInventory();
                            break;
                        case 'Digit2':
                            if (e.shiftKey) {
                                this.game.statsWindow.toggle();
                            }
                            break;
                        case 'Slash':
                            if (e.shiftKey) {
                                this.game.helpWindow.toggle();
                                e.preventDefault();
                            }
                            break;
                    }
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
            // Освобождаем клавиши даже при активных UI элементах, 
            // чтобы избежать "залипания" при переключении между меню
            switch (e.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.keys.up = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.keys.down = false;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.keys.right = false;
                    break;
                case 'KeyQ':
                    this.keys.upLeft = false;
                    break;
                case 'KeyE':
                    this.keys.upRight = false;
                    break;
                case 'KeyZ':
                    this.keys.downLeft = false;
                    break;
                case 'KeyC':
                    if (!e.shiftKey) {
                        this.keys.downRight = false;
                    }
                    break;
            }
        });
    }

    update() {
        const currentTime = Date.now();
        if (currentTime - this.lastMoveTime < this.moveDelay) {
            return;
        }

        // Проверяем, активны ли какие-либо UI-компоненты
        const activeUI = this.getActiveUI();
        if (activeUI !== 'lookMode' && activeUI !== 'gameControls') {
            return; // Не обрабатываем перемещение, если активны другие меню
        }

        let dx = 0;
        let dy = 0;

        if (this.keys.up) dy = -1;
        if (this.keys.down) dy = 1;
        if (this.keys.left) dx = -1;
        if (this.keys.right) dx = 1;
        if (this.keys.upLeft) { dx = -1; dy = -1; }
        if (this.keys.upRight) { dx = 1; dy = -1; }
        if (this.keys.downLeft) { dx = -1; dy = 1; }
        if (this.keys.downRight) { dx = 1; dy = 1; }

        if (dx !== 0 || dy !== 0) {
            if (this.isLookMode) {
                // В режиме осмотра двигаем рамку
                const newX = this.lookX + dx;
                const newY = this.lookY + dy;
                
                // Получаем видимую область
                const visibleArea = this.game.camera.getVisibleArea();
                
                // Проверяем границы видимой области
                if (newX >= visibleArea.startTileX && newX < visibleArea.endTileX &&
                    newY >= visibleArea.startTileY && newY < visibleArea.endTileY) {
                    this.lookX = newX;
                    this.lookY = newY;
                    this.lastMoveTime = currentTime;
                }
            } else {
                // Обычное движение игрока, только если нет активных UI элементов
                if (this.game.tryMove(dx, dy)) {
                    this.lastMoveTime = currentTime;
                }
            }
        }

        // Сбрасываем состояние клавиш
        this.keys.up = false;
        this.keys.down = false;
        this.keys.left = false;
        this.keys.right = false;
        this.keys.upLeft = false;
        this.keys.upRight = false;
        this.keys.downLeft = false;
        this.keys.downRight = false;
    }
} 