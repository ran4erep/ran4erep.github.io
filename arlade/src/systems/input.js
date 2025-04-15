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
        
        this.bindKeys();
    }

    bindKeys() {
        document.addEventListener('keydown', (e) => {
            // Если открыто окно статов, обрабатываем только @ для закрытия
            if (this.game.statsWindow && this.game.statsWindow.visible) {
                if (e.code === 'Digit2' && e.shiftKey) {
                    this.game.statsWindow.hide();
                }
                return;
            }

            // Если открыто окно справки, обрабатываем только M и Escape
            if (this.game.helpWindow && this.game.helpWindow.visible) {
                if (e.code === 'KeyM' || e.code === 'Escape') {
                    this.game.helpWindow.hide();
                }
                return;
            }

            // Если открыто любое меню, обрабатываем только клавиши меню
            if ((this.game.contextMenu && this.game.contextMenu.isVisible) ||
                (this.game.debugMenu && this.game.debugMenu.isVisible)) {
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

                // Escape и i всегда закрывают инвентарь, но только если не открыто окно подробностей
                if (e.code === 'KeyI' || e.code === 'Escape') {
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
                case 'Escape':
                    if (this.isLookMode) {
                        this.isLookMode = false;
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
                    e.preventDefault();
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