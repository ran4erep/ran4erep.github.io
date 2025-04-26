class GameOverScreen {
    constructor() {
        // Создаём оверлей для затемнения
        this.overlay = document.createElement('div');
        this.overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0);
            opacity: 0;
            transition: opacity 2s ease;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            pointer-events: none;
        `;
        
        // Создаём текст GAME OVER
        this.text = document.createElement('div');
        this.text.textContent = 'Игра окончена...';
        this.text.style.cssText = `
            color: #ff0000;
            font-family: 'Press Start 2P', monospace;
            font-size: 32px;
            font-weight: normal;
            letter-spacing: 4px;
            text-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
            opacity: 0;
            transform: scale(1.5);
            transition: all 2s ease;
            text-align: center;
            line-height: 1.5;
            margin-bottom: 40px;
        `;

        // Создаём кнопку "Вернуться в меню"
        this.button = document.createElement('button');
        this.button.textContent = 'Вернуться в меню';
        this.button.style.cssText = `
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
            opacity: 0;
            pointer-events: none;
        `;

        // Добавляем фокус на кнопку по умолчанию
        this.button.tabIndex = 0;

        this.button.addEventListener('mouseover', () => {
            this.button.style.backgroundColor = '#ffffff20';
            this.button.style.borderColor = '#ffffff80';
        });

        this.button.addEventListener('mouseout', () => {
            this.button.style.backgroundColor = 'transparent';
            this.button.style.borderColor = '#ffffff40';
        });

        this.button.addEventListener('click', () => {
            this.returnToMenu();
        });

        // Добавляем обработчик клавиатуры
        this.handleKeyPress = this.handleKeyPress.bind(this);
        
        this.overlay.appendChild(this.text);
        this.overlay.appendChild(this.button);
        
        // Добавляем оверлей в игровой контейнер
        const gameContainer = document.getElementById('gameContainer');
        gameContainer.appendChild(this.overlay);
    }
    
    show() {
        // Блокируем управление
        game.inputSystem.enabled = false;
        
        // Запускаем анимацию
        requestAnimationFrame(() => {
            // Показываем оверлей
            this.overlay.style.opacity = '1';
            this.overlay.style.background = 'rgba(0, 0, 0, 0.95)';
            this.overlay.style.pointerEvents = 'auto';
            
            // Показываем и анимируем текст
            this.text.style.opacity = '1';
            this.text.style.transform = 'scale(1)';

            // Показываем кнопку с задержкой
            setTimeout(() => {
                this.button.style.opacity = '1';
                this.button.style.pointerEvents = 'auto';
                // Добавляем фокус и стили для кнопки
                this.button.focus();
                this.button.style.backgroundColor = '#ffffff20';
                this.button.style.borderColor = '#ffffff80';
                // Добавляем обработчик клавиатуры
                document.addEventListener('keydown', this.handleKeyPress);
            }, 2000);
        });
    }
    
    hide() {
        // Скрываем оверлей и текст
        this.overlay.style.opacity = '0';
        this.overlay.style.pointerEvents = 'none';
        this.text.style.opacity = '0';
        this.text.style.transform = 'scale(1.5)';
        this.button.style.opacity = '0';
        this.button.style.pointerEvents = 'none';
        
        // Удаляем обработчик клавиатуры
        document.removeEventListener('keydown', this.handleKeyPress);
        
        // Возвращаем управление
        game.inputSystem.enabled = true;
    }

    handleKeyPress(event) {
        if (event.code === 'Space' || event.code === 'Enter') {
            this.returnToMenu();
        }
    }

    returnToMenu() {
        this.hide();
        game.mainMenu.isPauseMenu = false;
        game.mainMenu.show();
    }
}

const gameOverScreen = new GameOverScreen(); 