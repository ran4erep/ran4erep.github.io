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

    bindKeys() {
        document.addEventListener('keydown', (e) => {
            // Проверяем видимость врагов для зажатия клавиш
            const visibleEnemies = this.game.enemySystem.enemies.filter(enemy => {
                const visibility = visionSystem.visibilityMap[enemy.y][enemy.x];
                return visibility === 2;
            });

            // Если есть видимые враги и клавиша зажата - игнорируем
            if (visibleEnemies.length > 0 && e.repeat) {
                return;
            }

            // Если открыт инвентарь
            if (this.game.inventorySystem.isOpen) {
                // Если открыто окно подробностей, обрабатываем только пробел и Escape
                if (this.game.inventorySystem.showingDetails) {
                    if (e.code === 'Space' || e.code === 'Escape') {
                        this.game.inventorySystem.handleKeyPress(' ');
                    }
                    return;
                }

                // i всегда закрывает инвентарь
                if (e.code === 'KeyI') {
                    this.game.inventorySystem.toggleInventory();
                    return;
                }

                // Передаём все клавиши в handleKeyPress для обработки меню выбора руки
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
            }

            // Если открыто меню подбора предметов
            if (this.game.lootWindow.isOpen) {
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
                    case 'Escape':
                        this.game.lootWindow.handleKeyPress('Escape');
                        break;
                }
                return;
            }

            switch (e.code) {
                case 'KeyL':
                    if (!this.isLookMode) {
                        // Включаем режим осмотра
                        this.isLookMode = true;
                        this.lookX = this.game.playerX;
                        this.lookY = this.game.playerY;
                    } else {
                        // Выключаем режим осмотра
                        this.isLookMode = false;
                    }
                    break;
                case 'KeyG':
                    // Открываем меню подбора предметов
                    this.game.lootWindow.open();
                    break;
                case 'Escape':
                    if (this.isLookMode) {
                        this.isLookMode = false;
                    } else if (this.game.helpWindow.visible) {
                        this.game.helpWindow.toggle();
                    } else if (this.game.statsWindow.visible) {
                        this.game.statsWindow.toggle();
                    } else if (!this.game.contextMenu?.isVisible && !this.game.debugMenu?.isVisible) {
                        this.game.mainMenu.isPauseMenu = true;
                        this.game.mainMenu.show();
                    }
                    break;
                case 'ArrowUp':
                case 'KeyW':
                    if (e.shiftKey && !this.isLookMode) {
                        // Пропуск хода только если не ход противников и нет анимаций
                        if (!this.game.isEnemyTurn && !this.game.isMoving && !this.game.isPlayerAttacking) {
                            hud.addLogMessage('Вы пропустили ход');
                            this.game.startEnemyTurn();
                        }
                    } else if (!this.game.statsWindow.visible && !this.game.helpWindow.visible && !this.game.contextMenu?.isVisible && !this.game.debugMenu?.isVisible) {
                        this.keys.up = true;
                    }
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    if (!this.game.statsWindow.visible && !this.game.helpWindow.visible && !this.game.contextMenu?.isVisible && !this.game.debugMenu?.isVisible) {
                        this.keys.down = true;
                    }
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    if (!this.game.statsWindow.visible && !this.game.helpWindow.visible && !this.game.contextMenu?.isVisible && !this.game.debugMenu?.isVisible) {
                        this.keys.left = true;
                    }
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    if (!this.game.statsWindow.visible && !this.game.helpWindow.visible && !this.game.contextMenu?.isVisible && !this.game.debugMenu?.isVisible) {
                        this.keys.right = true;
                    }
                    break;
                case 'KeyQ':
                    if (!this.game.statsWindow.visible && !this.game.helpWindow.visible && !this.game.contextMenu?.isVisible && !this.game.debugMenu?.isVisible) {
                        this.keys.upLeft = true;
                    }
                    break;
                case 'KeyE':
                    if (!this.game.statsWindow.visible && !this.game.helpWindow.visible && !this.game.contextMenu?.isVisible && !this.game.debugMenu?.isVisible) {
                        this.keys.upRight = true;
                    }
                    break;
                case 'KeyZ':
                    if (!this.game.statsWindow.visible && !this.game.helpWindow.visible && !this.game.contextMenu?.isVisible && !this.game.debugMenu?.isVisible) {
                        this.keys.downLeft = true;
                    }
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
                    } else if (!this.game.statsWindow.visible && !this.game.helpWindow.visible && !this.game.contextMenu?.isVisible && !this.game.debugMenu?.isVisible) {
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
                    if (!this.game.inventorySystem.isOpen && !this.game.lootWindow.isOpen) {
                        this.game.showContextMenu();
                    }
                    break;
                case 'Minus':
                    this.game.camera.zoomOut();
                    break;
                case 'Equal':
                    this.game.camera.zoomIn();
                    break;
                case 'KeyI':
                    // Не открываем инвентарь, если открыто контекстное меню
                    if (!this.game.contextMenu?.isVisible) {
                        this.game.inventorySystem.toggleInventory();
                    }
                    break;
                case 'Digit2':
                    if (e.shiftKey && !this.game.contextMenu?.isVisible) {
                        this.game.statsWindow.toggle();
                    }
                    break;
                case 'Slash':
                    if (e.shiftKey && !this.game.contextMenu?.isVisible) {
                        this.game.helpWindow.toggle();
                        e.preventDefault();
                        return;
                    }
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
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
                // Обычное движение игрока
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