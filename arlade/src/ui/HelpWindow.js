class HelpWindow {
    constructor(game) {
        this.game = game;
        this.visible = false;
        this.scrollOffset = 0;
        this.scrollSpeed = 30;
        
        // Создаём элементы окна
        this.container = document.createElement('div');
        this.container.className = 'help-window';
        this.container.style.display = 'none';
        
        // Заголовок
        const title = document.createElement('h2');
        title.textContent = 'Справка по управлению';
        this.container.appendChild(title);

        // Создаём секции с командами
        this.createSection('Движение', [
            ['⯅ или W', 'Движение вверх'],
            ['⯆ или S', 'Движение вниз'],
            ['⯇ или A', 'Движение влево'],
            ['⯈ или D', 'Движение вправо'],
            ['Q', 'Движение вверх-влево'],
            ['E', 'Движение вверх-вправо'],
            ['Z', 'Движение вниз-влево'],
            ['C', 'Движение вниз-вправо'],
            ['Shift + W', 'Пропуск хода (Wait)']
        ]);

        this.createSection('Взаимодействие', [
            ['Пробел', 'Контекстное меню'],
            ['G', 'Взять предметы (Grab)'],
            ['Shift + O', 'Открыть дверь (Open)'],
            ['Shift + C', 'Закрыть дверь (Close)']
        ]);

        this.createSection('Интерфейс', [
            ['I', 'Открыть/закрыть инвентарь (Inventory)'],
            ['L', 'Режим осмотра (Look)'],
            ['Shift + @', 'Окно характеристик'],
            ['+ / -', 'Увеличить/уменьшить масштаб'],
            ['Esc', 'Меню паузы'],
            ['Del', 'Дебаг меню'],
            ['Shift + ?', 'Это окно справки']
        ]);

        // Добавляем стили
        const style = document.createElement('style');
        style.textContent = `
            .help-window {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                border: 2px solid #666;
                padding: 20px;
                color: #fff;
                font-family: "Press Start 2P", monospace;
                z-index: 1000;
                overflow-y: scroll;
            }

            .help-window::-webkit-scrollbar {
                width: 16px;
                background: #000;
                border-left: 2px solid #666;
            }

            .help-window::-webkit-scrollbar-track {
                background: #000;
            }

            .help-window::-webkit-scrollbar-thumb {
                background: #666;
                border: 2px solid #000;
                image-rendering: pixelated;
            }

            .help-window h2 {
                text-align: center;
                margin: 0 0 20px 0;
                color: #fff;
                font-size: 24px;
            }

            .help-section {
                margin-bottom: 20px;
            }

            .help-section h3 {
                color: #ffd700;
                margin: 0 0 10px 0;
                border-bottom: 1px solid #666;
                padding-bottom: 10px;
                font-size: 18px;
            }

            .help-command {
                display: flex;
                margin: 10px 0;
                font-size: 14px;
            }

            .help-key {
                width: 200px;
                color: #ff0;
            }

            .help-description {
                flex: 1;
                color: #aaa;
            }
        `;
        document.head.appendChild(style);
        
        // Добавляем окно в контейнер игры
        const gameContainer = document.getElementById('gameContainer');
        gameContainer.appendChild(this.container);

        // Добавляем обработчик клавиш для скроллинга
        document.addEventListener('keydown', (e) => {
            if (!this.visible) return;

            if (e.code === 'ArrowUp' || e.code === 'KeyW') {
                this.scroll(-this.scrollSpeed);
                e.preventDefault();
            } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                this.scroll(this.scrollSpeed);
                e.preventDefault();
            }
        });
    }

    scroll(delta) {
        const maxScroll = this.container.scrollHeight - this.container.clientHeight;
        this.scrollOffset = Math.max(0, Math.min(this.scrollOffset + delta, maxScroll));
        this.container.scrollTop = this.scrollOffset;
    }

    createSection(title, commands) {
        const section = document.createElement('div');
        section.className = 'help-section';
        
        const header = document.createElement('h3');
        header.textContent = title;
        section.appendChild(header);
        
        for (const [key, description] of commands) {
            const command = document.createElement('div');
            command.className = 'help-command';
            
            const keyElement = document.createElement('div');
            keyElement.className = 'help-key';
            keyElement.textContent = key;
            
            const descElement = document.createElement('div');
            descElement.className = 'help-description';
            descElement.textContent = description;
            
            command.appendChild(keyElement);
            command.appendChild(descElement);
            section.appendChild(command);
        }
        
        this.container.appendChild(section);
    }

    show() {
        this.visible = true;
        this.container.style.display = 'block';
        this.scrollOffset = 0;
        this.container.scrollTop = 0;
    }

    hide() {
        this.visible = false;
        this.container.style.display = 'none';
    }

    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }
} 