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
            background: rgba(0, 0, 0, 0.95);
            color: #fff;
            font-family: 'Press Start 2P', monospace;
            padding: 20px;
            border: 2px solid #666;
            display: none;
            width: 400px;
            z-index: 9999;
            pointer-events: auto;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
        `;
        document.getElementById('gameContainer').appendChild(this.element);

        // Инициализируем режим отладки
        this.game.debugMode = {
            noFog: false,
            showEnemyPaths: false,
            showEnemyVision: false,
            godMode: false // Режим бессмертия
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
                text: `${this.game.debugMode.noFog ? '☒' : '☐'} Отключить туман войны`,
                handler: () => {
                    this.game.debugMode.noFog = !this.game.debugMode.noFog;
                    this.render();
                    this.game.renderer.render();
                }
            },
            {
                text: `${this.game.debugMode.showEnemyPaths ? '☒' : '☐'} Показать пути врагов`,
                handler: () => {
                    this.game.debugMode.showEnemyPaths = !this.game.debugMode.showEnemyPaths;
                    this.render();
                    this.game.renderer.render();
                }
            },
            {
                text: `${this.game.debugMode.showEnemyVision ? '☒' : '☐'} Показать поле зрения врагов`,
                handler: () => {
                    this.game.debugMode.showEnemyVision = !this.game.debugMode.showEnemyVision;
                    this.render();
                    this.game.renderer.render();
                }
            },
            {
                text: `${this.game.debugMode.godMode ? '☒' : '☐'} Режим бессмертия`,
                handler: () => {
                    this.game.debugMode.godMode = !this.game.debugMode.godMode;
                    this.render();
                }
            },
            {
                text: `☆ Добавить 10 опыта`,
                handler: () => {
                    this.game.gainExperience(10);
                    this.render();
                }
            }
        ];
    }

    render() {
        const actions = this.getActions();
        
        // Создаём HTML-контент
        let content = `
            <div style="
                text-align: center;
                font-size: 16px;
                color: #ffd700;
                margin-bottom: 20px;
                text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
            ">ОТЛАДКА</div>
            <div style="
                width: 100%;
                height: 2px;
                background: linear-gradient(to right, transparent, #666, transparent);
                margin-bottom: 20px;
            "></div>
        `;
        
        // Добавляем действия
        actions.forEach((action, index) => {
            const isSelected = index === this.selectedIndex;
            content += `
                <div style="
                    padding: 10px 20px;
                    color: ${isSelected ? '#ffd700' : '#fff'};
                    ${isSelected ? 'text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);' : ''}
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                ">
                    <span style="
                        color: ${isSelected ? '#ffd700' : '#666'};
                        margin-right: 10px;
                    ">${isSelected ? '►' : ' '}</span>
                    ${action.text}
                </div>
            `;
        });
        
        // Добавляем подсказку внизу
        content += `
            <div style="
                width: 100%;
                height: 2px;
                background: linear-gradient(to right, transparent, #666, transparent);
                margin-top: 20px;
                margin-bottom: 10px;
            "></div>
            <div style="
                text-align: center;
                font-size: 8px;
                color: #666;
                margin-top: 10px;
            ">Delete - закрыть | ↑↓ - выбор | Space - активировать</div>
        `;
        
        this.element.innerHTML = content;
    }

    handleKeyDown(e) {
        if (e.code === 'Delete') {
            e.preventDefault();
            
            // Если меню уже открыто, закрываем его
            if (this.isVisible) {
                this.hide();
                return;
            }
            
            // Проверяем, активно ли какое-то другое меню
            const activeUI = this.game.inputSystem.getActiveUI();
            
            // Открываем отладочное меню только если мы в обычном режиме игры или в режиме осмотра
            // И не открыто меню паузы
            if (activeUI === 'gameControls' || activeUI === 'lookMode') {
                this.show();
            }
            return;
        }

        if (!this.isVisible) return;

        const actions = this.getActions();

        switch (e.code) {
            case 'ArrowUp':
            case 'KeyW':
                e.preventDefault();
                this.selectedIndex = (this.selectedIndex - 1 + actions.length) % actions.length;
                this.render();
                break;
                
            case 'ArrowDown':
            case 'KeyS':
                e.preventDefault();
                this.selectedIndex = (this.selectedIndex + 1) % actions.length;
                this.render();
                break;
                
            case 'Space':
            case 'Enter':
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