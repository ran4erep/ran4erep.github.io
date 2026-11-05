class MainMenu {
    constructor(game) {
        this.game = game;
        this.isVisible = false;
        this.isPauseMenu = false;
        this.selectedIndex = 0; // Индекс выбранного пункта меню
        
        // Создаем элемент меню
        this.element = document.createElement('div');
        this.element.id = 'mainMenu';
        this.element.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            z-index: 10000;
            font-family: 'Press Start 2P', monospace;
            color: #fff;
            display: none;
        `;

        // Создаем контейнер для картинки и заголовка
        this.titleContainer = document.createElement('div');
        this.titleContainer.style.cssText = `
            position: relative;
            width: 100vw;
            height: 50vh;
            margin-bottom: 40px;
            overflow: hidden;
        `;

        // Создаем элемент с градиентом
        const gradient = document.createElement('div');
        gradient.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.95) 100%);
            z-index: 1;
        `;
        this.titleContainer.appendChild(gradient);

        // Добавляем картинку
        const titleImage = document.createElement('img');
        titleImage.src = 'title.jpg';
        titleImage.style.cssText = `
            width: 100%;
            height: 130%;
            object-position: center 60%;
        `;
        this.titleContainer.appendChild(titleImage);
        
        // Создаем заголовок
        const title = document.createElement('h1');
        title.textContent = 'ARLADE';
        title.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 48px;
            font-family: 'Press Start 2P', monospace;
            letter-spacing: 8px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            margin: 0;
            padding: 0 15px;
            z-index: 1;
        `;
        this.titleContainer.appendChild(title);
        
        this.element.appendChild(this.titleContainer);
        
        // Создаем контейнер для кнопок
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 20px;
            margin-top: 20px;
            position: relative;
            padding: 20px;
            border-radius: 5px;
        `;
        this.buttonContainer = buttonContainer;
        
        // Создаем кнопки
        this.buttons = [
            { text: 'Начать заново', action: () => this.startNewGame() },
            { text: 'Продолжить', action: () => this.continueGame() },
            { text: 'Настройки', action: () => this.openSettings() }
        ];
        
        this.buttons.forEach((btn, index) => {
            const button = document.createElement('button');
            button.textContent = btn.text;
            button.style.cssText = `
                background: none;
                border: 1px solid #ffffff40;
                color: #fff;
                padding: 0;
                font-size: 16px;
                font-family: 'Press Start 2P', monospace;
                cursor: pointer;
                transition: all 0.3s ease;
                width: 280px;
                height: 48px;
                line-height: 48px;
                text-align: center;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            `;
            
            button.addEventListener('mouseover', () => {
                button.style.backgroundColor = '#ffffff20';
                button.style.borderColor = '#ffffff80';
                this.selectedIndex = index;
                this.updateSelection();
            });
            
            button.addEventListener('mouseout', () => {
                if (this.selectedIndex !== index) {
                    button.style.backgroundColor = 'transparent';
                    button.style.borderColor = '#ffffff40';
                }
            });
            
            button.addEventListener('click', btn.action);
            buttonContainer.appendChild(button);
            btn.element = button;
        });
        
        this.element.appendChild(buttonContainer);
        document.body.appendChild(this.element);
        
        // Добавляем обработчик клавиатуры
        this.handleKeyPress = this.handleKeyPress.bind(this);
        
        // Инициализируем выбранный пункт меню
        this.updateSelection();
    }
    
    handleKeyPress(e) {
        if (!this.isVisible) return;
        
        switch (e.code) {
            case 'ArrowUp':
            case 'KeyW':
                e.preventDefault();
                this.selectedIndex = (this.selectedIndex - 1 + this.buttons.length) % this.buttons.length;
                this.updateSelection();
                break;
            case 'ArrowDown':
            case 'KeyS':
                e.preventDefault();
                this.selectedIndex = (this.selectedIndex + 1) % this.buttons.length;
                this.updateSelection();
                break;
            case 'Space':
            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0 && this.selectedIndex < this.buttons.length) {
                    this.buttons[this.selectedIndex].action();
                }
                break;
            case 'Escape':
                e.preventDefault();
                if (this.isPauseMenu) {
                    this.hide();
                }
                break;
        }
    }
    
    updateSelection() {
        this.buttons.forEach((btn, index) => {
            if (index === this.selectedIndex) {
                btn.element.style.backgroundColor = '#ffffff20';
                btn.element.style.borderColor = '#ffffff80';
            } else {
                btn.element.style.backgroundColor = 'transparent';
                btn.element.style.borderColor = '#ffffff40';
            }
        });
    }
    
    show() {
        this.isVisible = true;
        
        if (this.isPauseMenu) {
            // Стили для меню паузы
            this.element.style.background = 'none';
            this.element.style.display = 'flex';
            this.element.style.justifyContent = 'center';
            this.element.style.alignItems = 'center';
            
            this.titleContainer.style.display = 'none';
            this.buttonContainer.style.background = 'rgba(0, 0, 0, 0.95)';
            this.buttonContainer.style.border = '1px solid #ffffff40';
            
            // Меняем текст кнопки "Новая игра" на "Начать заново"
            this.buttons[0].element.textContent = 'Начать заново';
        } else {
            // Стили для главного меню
            this.element.style.background = 'rgba(0, 0, 0, 0.95)';
            this.element.style.display = 'flex';
            this.element.style.justifyContent = 'flex-start';
            this.element.style.alignItems = 'center';
            
            this.titleContainer.style.display = 'block';
            this.buttonContainer.style.background = 'none';
            this.buttonContainer.style.border = 'none';
            
            this.buttons[0].element.textContent = 'Новая игра';
        }
        
        this.selectedIndex = 0;
        this.updateSelection();
        
        // Останавливаем игровой цикл
        this.game.isPaused = true;
        
        // Добавляем обработчик клавиатуры
        document.addEventListener('keydown', this.handleKeyPress);
    }
    
    hide() {
        this.isVisible = false;
        this.element.style.display = 'none';
        // Возобновляем игровой цикл
        this.game.isPaused = false;
        
        // Удаляем обработчик клавиатуры
        document.removeEventListener('keydown', this.handleKeyPress);
    }
    
    startNewGame() {
        // Очищаем игровой лог
        hud.clearLog();
        
        // Запускаем новую игру
        this.game.startNewGame();
        
        // Скрываем меню в самом конце
        this.hide();
    }
    
    continueGame() {
        this.hide();
    }
    
    openSettings() {
        // TODO: Добавить настройки
        console.log('Settings not implemented yet');
    }

    handleClick(x, y) {
        if (!this.isVisible) return;

        const buttonWidth = 200;
        const buttonHeight = 40;
        const buttonSpacing = 20;
        const startX = (this.game.canvas.width - buttonWidth) / 2;
        const startY = this.game.canvas.height / 2;

        // Проверяем клик на каждой кнопке
        this.buttons.forEach((button, index) => {
            const buttonY = startY + (buttonHeight + buttonSpacing) * index;
            if (x >= startX && x < startX + buttonWidth &&
                y >= buttonY && y < buttonY + buttonHeight) {
                switch (button.text) {
                    case 'Новая игра':
                        if (!this.isPauseMenu) {
                            this.hide();
                            this.game.startNewGame();
                        }
                        break;
                    case 'Продолжить':
                        if (this.isPauseMenu) {
                            this.hide();
                            this.game.isPaused = false;
                        }
                        break;
                    case 'Помощь':
                        this.game.helpWindow.toggle();
                        break;
                }
            }
        });
    }
} 