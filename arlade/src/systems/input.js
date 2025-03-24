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
        
        this.bindKeys();
    }

    bindKeys() {
        document.addEventListener('keydown', (e) => {
            // Если открыто любое меню, обрабатываем только клавиши меню
            if ((this.game.contextMenu && this.game.contextMenu.isVisible) ||
                (this.game.debugMenu && this.game.debugMenu.isVisible)) {
                return;
            }

            switch (e.code) {
                case 'KeyF':
                    // Переключаем боевой режим
                    this.game.toggleCombatMode();
                    break;
                case 'ArrowUp':
                case 'KeyW':
                    if (e.shiftKey) {
                        // Пропуск хода
                        this.game.enemyTurn();
                    } else if (!this.game.isFirstPersonMode) {
                        this.keys.up = true;
                    }
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    if (!this.game.isFirstPersonMode) {
                        this.keys.down = true;
                    }
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    if (this.game.isFirstPersonMode) {
                        // Поворот влево на 45 градусов
                        this.game.lookDirection = (this.game.lookDirection - Math.PI/4) % (Math.PI * 2);
                        if (this.game.lookDirection < 0) {
                            this.game.lookDirection += Math.PI * 2;
                        }
                        this.game.renderer.render();
                    } else {
                        this.keys.left = true;
                    }
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    if (this.game.isFirstPersonMode) {
                        // Поворот вправо на 45 градусов
                        this.game.lookDirection = (this.game.lookDirection + Math.PI/4) % (Math.PI * 2);
                        this.game.renderer.render();
                    } else {
                        this.keys.right = true;
                    }
                    break;
                case 'KeyQ':
                    if (!this.game.isFirstPersonMode) {
                        this.keys.upLeft = true;
                    }
                    break;
                case 'KeyE':
                    if (!this.game.isFirstPersonMode) {
                        this.keys.upRight = true;
                    }
                    break;
                case 'KeyZ':
                    if (!this.game.isFirstPersonMode) {
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
                    } else if (!this.game.isFirstPersonMode) {
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
                    if (this.game.isCombatMode) {
                        this.game.handleShoot();
                    } else {
                        this.game.showContextMenu();
                    }
                    break;
                case 'Minus':
                    this.game.camera.zoomOut();
                    break;
                case 'Equal':
                    this.game.camera.zoomIn();
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

    update(deltaTime) {
        // Если открыто любое меню, не обрабатываем движение
        if ((this.game.contextMenu && this.game.contextMenu.isVisible) ||
            (this.game.debugMenu && this.game.debugMenu.isVisible)) {
            return;
        }

        const now = Date.now();
        if (now - this.lastMoveTime >= this.moveDelay) {
            let dx = 0;
            let dy = 0;
            
            // Проверяем сначала диагональные движения
            if (this.keys.upLeft) { dy -= 1; dx -= 1; }
            else if (this.keys.upRight) { dy -= 1; dx += 1; }
            else if (this.keys.downLeft) { dy += 1; dx -= 1; }
            else if (this.keys.downRight) { dy += 1; dx += 1; }
            // Если нет диагонального движения, проверяем обычное
            else {
                if (this.keys.up) dy -= 1;
                if (this.keys.down) dy += 1;
                if (this.keys.left) dx -= 1;
                if (this.keys.right) dx += 1;
            }
            
            if (dx !== 0 || dy !== 0) {
                if (this.game.tryMove(dx, dy)) {
                    this.lastMoveTime = now;
                    // Обновляем видимость после движения
                    visionSystem.update(this.game.playerX, this.game.playerY, this.game.currentMap.layout, this.game.lookDirection);
                    this.game.renderer.render();
                }
            }
        }
    }
} 