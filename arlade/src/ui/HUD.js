class HUD {
    constructor() {
        // FPS счетчик (остаётся на игровом поле)
        this.fpsCounter = document.createElement('div');
        this.fpsCounter.style.position = 'absolute';
        this.fpsCounter.style.top = '10px';
        this.fpsCounter.style.left = '10px';
        this.fpsCounter.style.color = '#fff';
        this.fpsCounter.style.fontFamily = 'monospace';
        this.fpsCounter.style.zIndex = '1000';
        document.getElementById('gameContainer').appendChild(this.fpsCounter);
        this.fpsCounter.textContent = 'FPS: 0';
        
        // Создаём объект для хранения UI иконок
        this.uiIcons = {
            heart: {
                canvas: document.createElement('canvas'),
                loaded: false
            },
            magic: {
                canvas: document.createElement('canvas'),
                loaded: false
            }
        };

        // Инициализируем все иконки
        Object.values(this.uiIcons).forEach(icon => {
            icon.canvas.width = 32;
            icon.canvas.height = 32;
            icon.canvas.style.width = '32px';
            icon.canvas.style.height = '32px';
            icon.canvas.style.imageRendering = 'pixelated';
        });
        
        // Здоровье игрока (перемещаем в верхнюю панель)
        this.healthDisplay = document.createElement('div');
        this.healthDisplay.className = 'hud-element';
        this.healthDisplay.style.display = 'flex';
        this.healthDisplay.style.alignItems = 'center';
        this.healthDisplay.style.gap = '10px';
        
        // Создаём контейнер для полоски здоровья
        this.healthBarContainer = document.createElement('div');
        this.healthBarContainer.style.width = '200px';
        this.healthBarContainer.style.height = '20px';
        this.healthBarContainer.style.border = '2px solid #ffffff';
        this.healthBarContainer.style.position = 'relative';
        this.healthBarContainer.style.overflow = 'hidden';
        
        // Создаём полоску здоровья
        this.healthBar = document.createElement('div');
        this.healthBar.style.width = '100%';
        this.healthBar.style.height = '100%';
        this.healthBar.style.backgroundColor = '#00ff00';
        this.healthBar.style.transition = 'width 0.3s ease-out, background-color 0.3s ease-out';
        
        // Создаём текст здоровья поверх полоски
        this.healthText = document.createElement('div');
        this.healthText.style.position = 'absolute';
        this.healthText.style.left = '50%';
        this.healthText.style.top = '50%';
        this.healthText.style.transform = 'translate(-50%, -50%)';
        this.healthText.style.color = '#ffffff';
        this.healthText.style.fontSize = '12px';
        this.healthText.style.fontFamily = '"Press Start 2P"';
        this.healthText.style.textShadow = 
            '-1px -1px 0 #000, ' +
            '1px -1px 0 #000, ' +
            '-1px 1px 0 #000, ' +
            '1px 1px 0 #000, ' +
            '2px 2px 0 #000';
        this.healthText.style.backgroundColor = 'transparent';
        
        // Собираем всё вместе
        this.healthBarContainer.appendChild(this.healthBar);
        this.healthBarContainer.appendChild(this.healthText);
        this.healthDisplay.appendChild(this.uiIcons.heart.canvas);
        this.healthDisplay.appendChild(this.healthBarContainer);
        
        // Добавляем индикатор здоровья в верхнюю панель
        document.getElementById('topPanel').appendChild(this.healthDisplay);

        // Создаём индикатор маны
        this.manaDisplay = document.createElement('div');
        this.manaDisplay.className = 'hud-element';
        this.manaDisplay.style.display = 'flex';
        this.manaDisplay.style.alignItems = 'center';
        this.manaDisplay.style.gap = '10px';
        this.manaDisplay.style.marginLeft = '10px';

        // Создаём контейнер для полоски маны
        this.manaBarContainer = document.createElement('div');
        this.manaBarContainer.style.width = '200px';
        this.manaBarContainer.style.height = '20px';
        this.manaBarContainer.style.border = '2px solid #ffffff';
        this.manaBarContainer.style.position = 'relative';
        this.manaBarContainer.style.overflow = 'hidden';

        // Создаём полоску маны
        this.manaBar = document.createElement('div');
        this.manaBar.style.width = '100%';
        this.manaBar.style.height = '100%';
        this.manaBar.style.backgroundColor = '#0000ff';
        this.manaBar.style.transition = 'width 0.3s ease-out';

        // Создаём текст маны поверх полоски
        this.manaText = document.createElement('div');
        this.manaText.style.position = 'absolute';
        this.manaText.style.left = '50%';
        this.manaText.style.top = '50%';
        this.manaText.style.transform = 'translate(-50%, -50%)';
        this.manaText.style.color = '#ffffff';
        this.manaText.style.fontSize = '12px';
        this.manaText.style.fontFamily = '"Press Start 2P"';
        this.manaText.style.textShadow = 
            '-1px -1px 0 #000, ' +
            '1px -1px 0 #000, ' +
            '-1px 1px 0 #000, ' +
            '1px 1px 0 #000, ' +
            '2px 2px 0 #000';
        this.manaText.style.backgroundColor = 'transparent';

        // Собираем всё вместе для маны
        this.manaBarContainer.appendChild(this.manaBar);
        this.manaBarContainer.appendChild(this.manaText);
        this.manaDisplay.appendChild(this.uiIcons.magic.canvas);
        this.manaDisplay.appendChild(this.manaBarContainer);

        // Добавляем индикатор маны в верхнюю панель
        document.getElementById('topPanel').appendChild(this.manaDisplay);

        // Опыт игрока
        this.experienceDisplay = document.createElement('div');
        this.experienceDisplay.className = 'hud-element';
        this.experienceDisplay.style.display = 'flex';
        this.experienceDisplay.style.alignItems = 'center';
        this.experienceDisplay.style.gap = '10px';
        this.experienceDisplay.style.marginLeft = '10px';
        
        // Текст уровня
        this.levelText = document.createElement('div');
        this.levelText.style.color = '#ffffff';
        this.levelText.style.fontSize = '12px';
        this.levelText.style.fontFamily = '"Press Start 2P"';
        this.levelText.style.textShadow = 
            '-1px -1px 0 #000, ' +
            '1px -1px 0 #000, ' +
            '-1px 1px 0 #000, ' +
            '1px 1px 0 #000, ' +
            '2px 2px 0 #000';
        
        // Контейнер для полоски опыта
        this.expBarContainer = document.createElement('div');
        this.expBarContainer.style.width = '200px';
        this.expBarContainer.style.height = '20px';
        this.expBarContainer.style.border = '2px solid #ffffff';
        this.expBarContainer.style.position = 'relative';
        this.expBarContainer.style.overflow = 'hidden';
        this.expBarContainer.style.transition = 'border-color 0.3s ease-out';
        
        // Полоска опыта
        this.expBar = document.createElement('div');
        this.expBar.style.width = '0%';
        this.expBar.style.height = '100%';
        this.expBar.style.backgroundColor = '#ffd700';
        this.expBar.style.transition = 'width 0.3s ease-out';
        this.expBar.isGlowing = false;
        
        // Текст опыта поверх полоски
        this.expText = document.createElement('div');
        this.expText.style.position = 'absolute';
        this.expText.style.left = '50%';
        this.expText.style.top = '50%';
        this.expText.style.transform = 'translate(-50%, -50%)';
        this.expText.style.color = '#ffffff';
        this.expText.style.fontSize = '12px';
        this.expText.style.fontFamily = '"Press Start 2P"';
        this.expText.style.textShadow = 
            '-1px -1px 0 #000, ' +
            '1px -1px 0 #000, ' +
            '-1px 1px 0 #000, ' +
            '1px 1px 0 #000, ' +
            '2px 2px 0 #000';
        this.expText.style.backgroundColor = 'transparent';
        
        // Собираем всё вместе для опыта
        this.expBarContainer.appendChild(this.expBar);
        this.expBarContainer.appendChild(this.expText);
        this.experienceDisplay.appendChild(this.levelText);
        this.experienceDisplay.appendChild(this.expBarContainer);
        
        // Добавляем индикатор опыта в верхнюю панель
        document.getElementById('topPanel').appendChild(this.experienceDisplay);

        // Создаём отображение денег
        this.moneyDisplay = document.createElement('div');
        this.moneyDisplay.className = 'hud-element';
        this.moneyDisplay.style.display = 'flex';
        this.moneyDisplay.style.alignItems = 'center';
        this.moneyDisplay.style.marginLeft = 'auto'; // Прижимаем к правому краю
        this.moneyDisplay.style.marginRight = '10px'; // Отступ справа
        this.moneyDisplay.style.color = '#ffd700';
        this.moneyDisplay.style.fontSize = '12px';
        this.moneyDisplay.style.fontFamily = '"Press Start 2P"';
        this.moneyDisplay.style.textShadow = 
            '-1px -1px 0 #000, ' +
            '1px -1px 0 #000, ' +
            '-1px 1px 0 #000, ' +
            '1px 1px 0 #000, ' +
            '2px 2px 0 #000';

        // Добавляем индикатор денег в верхнюю панель
        document.getElementById('topPanel').appendChild(this.moneyDisplay);

        // Инициализируем игровой лог
        this.gameLog = document.getElementById('gameLog');
        this.maxLogEntries = 100; // Максимальное количество сообщений в логе
        
        this.frameCount = 0;
        this.lastFpsUpdate = performance.now();
        
        // Флаг наличия сообщений в текущем ходу
        this.hasMessagesInCurrentTurn = false;
        
        // Флаг для отслеживания загрузки иконки сердца
        this.heartIconLoaded = false;

        // Добавляем стили для разделителя ходов и сообщений об атаках
        const style = document.createElement('style');
        style.textContent = `
            .turn-separator {
                height: 1px;
                background: linear-gradient(to right, 
                    rgba(255, 255, 255, 0), 
                    rgba(255, 255, 255, 0.2) 20%, 
                    rgba(255, 255, 255, 0.2) 80%, 
                    rgba(255, 255, 255, 0)
                );
                margin: 15px 5px;
            }
            .player-attack {
                color: #ff3333; /* Более насыщенный красный для атак игрока */
            }
            .enemy-attack {
                color: #cc0000; /* Тёмно-красный для атак врагов */
            }
            .dodge {
                color: #999999; /* Серый для промахов */
            }
            .experience {
                color: #ffd700; /* Золотой цвет для сообщений об опыте */
            }
            .level-up {
                color: #ffd700; /* Золотой цвет для сообщений о новом уровне */
                animation: glow 2s ease-in-out 6; /* 6 повторений анимации по 1 секунде */
                font-weight: bold; /* Жирный текст */
            }
            @keyframes glow {
                0% { text-shadow: 0 0 0 #ffd700; }
                50% { 
                    color: #fff7cc;
                    text-shadow: 
                        0 0 20px #ffd700,
                        0 0 30px #ffd700,
                        0 0 40px #ffd700,
                        0 0 50px #ffd700;
                }
                100% { text-shadow: 0 0 0 #ffd700; }
            }
            @keyframes expGlow {
                0% { 
                    box-shadow: none;
                    filter: brightness(100%);
                }
                50% { 
                    box-shadow: 
                        0 0 20px #ffd700,
                        0 0 30px #ffd700,
                        0 0 40px #ffd700,
                        0 0 50px #ffd700;
                    filter: brightness(150%);
                }
                100% { 
                    box-shadow: none;
                    filter: brightness(100%);
                }
            }
            @keyframes borderGlow {
                0% { 
                    border-color: #ffffff;
                    box-shadow: none;
                }
                50% { 
                    border-color: #ffd700;
                    box-shadow: 
                        0 0 10px #ffd700,
                        0 0 20px #ffd700,
                        0 0 30px #ffd700;
                }
                100% { 
                    border-color: #ffffff;
                    box-shadow: none;
                }
            }
        `;
        document.head.appendChild(style);
    }

    drawUIIcon(canvas, iconName) {
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        
        // Очищаем canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Проверяем, загружен ли файл с глифами
        const glyphInfo = glyphSystem.glyphsMap[iconName];
        if (!glyphInfo) {
            return;
        }
        
        // Рисуем глиф
        glyphSystem.drawGlyph(ctx, iconName, 0, 0, 32);
    }

    // Добавление сообщения в лог
    addLogMessage(message, type = '') {
        // Если это первое сообщение в новом ходу и были сообщения в предыдущем
        if (!this.hasMessagesInCurrentTurn && this.gameLog.children.length > 0) {
            this.addTurnSeparator();
        }
        
        const entry = document.createElement('div');
        entry.className = 'log-entry' + (type ? ' ' + type : '');
        entry.textContent = message;
        
        this.gameLog.appendChild(entry);
        entry.scrollIntoView({ behavior: 'smooth' });
        
        // Удаляем старые сообщения, если их слишком много
        while (this.gameLog.children.length > this.maxLogEntries) {
            this.gameLog.removeChild(this.gameLog.firstChild);
        }

        this.hasMessagesInCurrentTurn = true;
    }

    // Добавление разделителя между ходами
    addTurnSeparator() {
        const separator = document.createElement('div');
        separator.className = 'turn-separator';
        this.gameLog.appendChild(separator);
        separator.scrollIntoView({ behavior: 'smooth' });
        
        // Сбрасываем флаг сообщений для нового хода
        this.hasMessagesInCurrentTurn = false;
    }

    update(deltaTime) {
        const currentTime = performance.now();
        this.frameCount++;
        
        if (currentTime - this.lastFpsUpdate >= 1000) {
            const fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsUpdate));
            this.fpsCounter.textContent = `FPS: ${fps}`;
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
        }

        // Пробуем загрузить иконки если они ещё не загружены
        if (Object.keys(glyphSystem.glyphsMap).length > 0) {
            Object.entries(this.uiIcons).forEach(([name, icon]) => {
                if (!icon.loaded) {
                    this.drawUIIcon(icon.canvas, name);
                    icon.loaded = true;
                }
            });
        }

        // Обновляем отображение здоровья
        if (game.playerHealth !== undefined) {
            // Вычисляем процент здоровья
            const healthPercent = game.playerHealth / game.maxHealth;
            
            // Определяем цвет в зависимости от процента здоровья
            let color;
            if (healthPercent > 0.5) {
                // От зеленого к желтому
                const green = 255;
                const red = Math.floor(255 * (1 - (healthPercent - 0.5) * 2));
                color = `rgb(${red}, ${green}, 0)`;
            } else {
                // От желтого к красному
                const green = Math.floor(255 * (healthPercent * 2));
                const red = 255;
                color = `rgb(${red}, ${green}, 0)`;
            }
            
            // Обновляем полоску здоровья
            this.healthBar.style.width = `${healthPercent * 100}%`;
            this.healthBar.style.backgroundColor = color;
            
            // Обновляем текст здоровья
            this.healthText.textContent = `${game.playerHealth}/${game.maxHealth}`;
        }

        // Обновляем отображение опыта
        if (game.experience !== undefined) {
            // Вычисляем процент опыта
            const expPercent = game.experience / game.experienceToNextLevel;
            
            // Если игрок получил новый уровень и анимация не активна
            if (game.justLeveledUp && !this.expBar.isGlowing) {
                // Устанавливаем флаг анимации
                this.expBar.isGlowing = true;
                
                // Добавляем анимацию свечения для полоски и рамки
                this.expBar.style.animation = 'expGlow 2s ease-in-out 6';
                this.expBarContainer.style.animation = 'borderGlow 2s ease-in-out 6';
                
                // Форсируем перерисовку
                this.expBar.offsetHeight;
                this.expBarContainer.offsetHeight;
                
                // Сбрасываем анимацию через 12 секунд
                setTimeout(() => {
                    this.expBar.style.animation = 'none';
                    this.expBarContainer.style.animation = 'none';
                    this.expBar.offsetHeight;
                    this.expBarContainer.offsetHeight;
                    this.expBar.isGlowing = false;
                }, 12000);
                
                // Сбрасываем флаг повышения уровня
                game.justLeveledUp = false;
            }
            // Если игрок получил опыт и анимация не активна
            else if (game.justGainedExp && !this.expBar.isGlowing) {
                // Устанавливаем флаг анимации
                this.expBar.isGlowing = true;
                
                // Добавляем анимацию свечения только для полоски
                this.expBar.style.animation = 'expGlow 1s ease-in-out';
                
                // Форсируем перерисовку
                this.expBar.offsetHeight;
                
                // Сбрасываем анимацию через 1 секунду
                setTimeout(() => {
                    this.expBar.style.animation = 'none';
                    this.expBar.offsetHeight;
                    this.expBar.isGlowing = false;
                }, 1000);
                
                // Сбрасываем флаг получения опыта
                game.justGainedExp = false;
            }
            
            // Обновляем полоску опыта
            this.expBar.style.width = `${expPercent * 100}%`;
            
            // Обновляем текст уровня
            this.levelText.textContent = `LVL: ${game.level}`;
            
            // Обновляем текст опыта
            this.expText.textContent = `${game.experience}/${game.experienceToNextLevel}`;
        }

        // Обновляем отображение маны
        if (game.playerMana !== undefined) {
            const manaPercent = game.playerMana / game.maxMana;
            this.manaBar.style.width = `${manaPercent * 100}%`;
            this.manaText.textContent = `${game.playerMana}/${game.maxMana}`;
        }

        // Обновляем отображение денег
        if (game.inventorySystem) {
            const goldCoins = game.inventorySystem.items.find(item => item.id === 'gold_coin');
            const amount = goldCoins ? goldCoins.quantity : 0;
            this.moneyDisplay.textContent = `$ ${amount}`;
        }
    }

    render() {
        // В данном случае нам не нужно ничего рендерить дополнительно,
        // так как интерфейс обновляется через DOM
    }

    // Очистка игрового лога
    clearLog() {
        while (this.gameLog.firstChild) {
            this.gameLog.removeChild(this.gameLog.firstChild);
        }
        this.hasMessagesInCurrentTurn = false;
    }
}

const hud = new HUD(); 