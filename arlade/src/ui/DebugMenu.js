class DebugMenu {
    constructor(game) {
        this.game = game;
        this.isVisible = false;
        this.selectedIndex = 0;
        
        // Создаем элемент меню
        this.element = document.createElement('div');
        this.element.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: #fff;
            font-family: monospace;
            padding: 10px;
            border: 1px solid #666;
            display: none;
            white-space: pre;
            z-index: 9999;
            pointer-events: auto;
        `;
        document.getElementById('gameContainer').appendChild(this.element);

        // Инициализируем режим отладки
        this.game.debugMode = {
            noFog: false,
            showEnemyPaths: false,
            showEnemyVision: false,
            immortality: false
        };

        // Добавляем обработчики клавиш
        this.handleKeyDown = this.handleKeyDown.bind(this);
        document.addEventListener('keydown', this.handleKeyDown);
    }

    show() {
        this.isVisible = true;
        this.element.style.display = 'block';
        this.render();
    }

    hide() {
        this.isVisible = false;
        this.element.style.display = 'none';
    }

    getActions() {
        return [
            {
                text: `[${this.game.debugMode.noFog ? 'x' : ' '}] Отключить туман войны`,
                handler: () => {
                    this.game.debugMode.noFog = !this.game.debugMode.noFog;
                    this.render();
                    this.game.renderer.render();
                }
            },
            {
                text: `[${this.game.debugMode.showEnemyPaths ? 'x' : ' '}] Показать пути врагов`,
                handler: () => {
                    this.game.debugMode.showEnemyPaths = !this.game.debugMode.showEnemyPaths;
                    this.render();
                    this.game.renderer.render();
                }
            },
            {
                text: `[${this.game.debugMode.showEnemyVision ? 'x' : ' '}] Показать поле зрения врагов`,
                handler: () => {
                    this.game.debugMode.showEnemyVision = !this.game.debugMode.showEnemyVision;
                    this.render();
                    this.game.renderer.render();
                }
            },
            {
                text: `[${this.game.debugMode.immortality ? 'x' : ' '}] Режим бессмертия`,
                handler: () => {
                    this.game.debugMode.immortality = !this.game.debugMode.immortality;
                    this.render();
                }
            }
        ];
    }

    render() {
        const actions = this.getActions();
        const width = Math.max(...actions.map(a => a.text.length)) + 4;
        
        // Верхняя граница
        let content = '╔' + '═'.repeat(width) + '╗\n';
        
        // Заголовок
        content += '║' + ' Debug Menu '.padStart((width + 10) / 2).padEnd(width) + '║\n';
        content += '╠' + '═'.repeat(width) + '╣\n';
        
        // Действия
        actions.forEach((action, index) => {
            const isSelected = index === this.selectedIndex;
            const prefix = isSelected ? '> ' : '  ';
            const text = action.text.padEnd(width);
            content += '║' + prefix + text + '  ║\n';
        });
        
        // Нижняя граница
        content += '╚' + '═'.repeat(width) + '╝';
        
        this.element.textContent = content;
    }

    handleKeyDown(e) {
        if (e.code === 'Delete') {
            e.preventDefault();
            if (this.isVisible) {
                this.hide();
            } else {
                this.show();
            }
            return;
        }

        if (!this.isVisible) return;

        const actions = this.getActions();

        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = (this.selectedIndex - 1 + actions.length) % actions.length;
                this.render();
                break;
                
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = (this.selectedIndex + 1) % actions.length;
                this.render();
                break;
                
            case 'Enter':
            case ' ':
                e.preventDefault();
                const action = actions[this.selectedIndex];
                if (action && action.handler) {
                    action.handler();
                }
                break;
                
            case 'Escape':
                e.preventDefault();
                this.hide();
                break;
        }
    }
}