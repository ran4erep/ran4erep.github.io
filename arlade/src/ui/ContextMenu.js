class ContextMenu {
    constructor(game) {
        this.game = game;
        this.isVisible = false;
        this.actions = [];
        this.selectedIndex = 0;
        this.justOpened = false;
        
        // Создаем элемент меню
        this.element = document.createElement('div');
        this.element.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.9);
            color: #fff;
            font-family: 'Press Start 2P', monospace;
            font-size: 14px;
            line-height: 1.8;
            padding: 15px;
            border: 2px solid #666;
            display: none;
            white-space: pre;
            z-index: 1000;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            min-width: 250px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
        `;
        document.getElementById('gameContainer').appendChild(this.element);

        // Добавляем обработчики клавиш
        this.handleKeyDown = this.handleKeyDown.bind(this);
        document.addEventListener('keydown', this.handleKeyDown);
    }

    show(x, y, actions) {
        if (actions.length === 0) return;
        
        this.actions = actions;
        this.selectedIndex = 0;
        this.isVisible = true;
        this.justOpened = true;
        this.element.style.display = 'block';
        
        // Позиционируем меню рядом с объектом
        const canvas = this.game.canvas;
        const rect = canvas.getBoundingClientRect();
        const tileSize = canvas.width / this.game.camera.viewWidth;
        
        const screenX = (x - this.game.camera.x) * tileSize + rect.left;
        const screenY = (y - this.game.camera.y) * tileSize + rect.top;
        
        this.element.style.left = `${screenX + tileSize}px`;
        this.element.style.top = `${screenY}px`;
        
        this.render();
        
        // Сбрасываем флаг через небольшую задержку
        setTimeout(() => {
            this.justOpened = false;
        }, 100);
    }

    hide() {
        this.isVisible = false;
        this.justOpened = false;
        this.element.style.display = 'none';
        this.actions = [];
    }

    render() {
        // Формируем содержимое
        const width = Math.max(...this.actions.map(a => a.text.length));
        
        let content = '';
        
        // Действия
        this.actions.forEach((action, index) => {
            const isSelected = index === this.selectedIndex;
            const prefix = isSelected ? '> ' : ' ';
            const text = action.text.padEnd(width);
            content += prefix + text + '\n';
        });
        
        // Убираем последний перенос строки
        content = content.slice(0, -1);
        
        this.element.textContent = content;
    }

    handleKeyDown(e) {
        if (!this.isVisible) return;
        
        // Если меню только что открыто, игнорируем нажатие пробела
        if (this.justOpened && e.code === 'Space') return;

        switch (e.code) {
            case 'ArrowUp':
            case 'KeyW':
                e.preventDefault();
                this.selectedIndex = (this.selectedIndex - 1 + this.actions.length) % this.actions.length;
                this.render();
                break;
                
            case 'ArrowDown':
            case 'KeyS':
                e.preventDefault();
                this.selectedIndex = (this.selectedIndex + 1) % this.actions.length;
                this.render();
                break;
                
            case 'Space':
                e.preventDefault();
                const action = this.actions[this.selectedIndex];
                if (action && action.handler) {
                    action.handler();
                }
                this.hide();
                break;
                
            case 'Escape':
                e.preventDefault();
                this.hide();
                break;
        }
    }

    getAvailableActions(x, y) {
        const actions = [];
        
        // Проверяем, есть ли предметы на текущей клетке
        const itemsOnCurrentTile = this.game.floorItems.filter(item => item.x === x && item.y === y);
        if (itemsOnCurrentTile.length > 0) {
            actions.push({
                text: 'Подобрать предметы',
                handler: () => {
                    this.hide(); // Сначала закрываем меню
                    this.game.lootWindow.open(); // Открываем окно подбора предметов
                }
            });
        }
        
        // Проверяем наличие двери рядом с игроком
        const doorPos = this.game.collisionSystem.canInteractWithDoor(x, y);
        if (doorPos) {
            // Ищем дверь в массиве дверей
            const door = this.game.doors.find(d => d.x === doorPos.x && d.y === doorPos.y);
            if (door) {
                actions.push({
                    text: door.isOpened ? 'Закрыть дверь' : 'Открыть дверь',
                    handler: () => {
                        // Закрываем меню только если действие успешно выполнено
                        if (this.game.toggleDoor()) {
                            this.hide();
                        }
                    }
                });
            }
        }
        
        // Опция открытия инвентаря всегда доступна и всегда последняя
        actions.push({
            text: 'Открыть инвентарь',
            handler: () => {
                this.hide(); // Сначала закрываем меню
                this.game.inventorySystem.toggleInventory(); // Используем toggleInventory вместо openInventory
            }
        });
        
        return actions;
    }
} 