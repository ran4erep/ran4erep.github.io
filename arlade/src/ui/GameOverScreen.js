class GameOverScreen {
    constructor() {
        // Создаём оверлей для затемнения
        this.overlay = document.createElement('div');
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0);
            opacity: 0;
            transition: opacity 2s ease;
            z-index: 9999;
            display: flex;
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
        `;
        
        this.overlay.appendChild(this.text);
        document.body.appendChild(this.overlay);
    }
    
    show(onComplete) {
        // Блокируем управление
        game.inputSystem.enabled = false;
        
        // Запускаем анимацию
        requestAnimationFrame(() => {
            // Показываем оверлей
            this.overlay.style.opacity = '1';
            this.overlay.style.background = 'rgba(0, 0, 0, 0.95)';
            
            // Показываем и анимируем текст
            this.text.style.opacity = '1';
            this.text.style.transform = 'scale(1)';
        });
        
        // Ждём окончания анимации
        setTimeout(() => {
            if (onComplete) onComplete();
        }, 3000);
    }
    
    hide() {
        // Скрываем оверлей и текст
        this.overlay.style.opacity = '0';
        this.text.style.opacity = '0';
        this.text.style.transform = 'scale(1.5)';
        
        // Возвращаем управление
        game.inputSystem.enabled = true;
    }
}

const gameOverScreen = new GameOverScreen(); 