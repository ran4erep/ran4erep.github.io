class StatsWindow {
    constructor(game) {
        this.game = game;
        this.visible = false;
        this.width = 280;
        this.height = 280;
        this.padding = 40;
        this.lineHeight = 30;
        
        // Текущий выбранный стат
        this.selectedStat = 0;
        // Массив названий статов
        this.stats = [
            ['Сила', 'strength'],
            ['Ловкость', 'dexterity'],
            ['Телосложение', 'constitution'],
            ['Интеллект', 'intelligence'],
            ['Мудрость', 'wisdom'],
            ['Харизма', 'charisma']
        ];
        
        // Временные значения статов
        this.tempStats = {};
        // Временное значение очков прокачки
        this.tempPoints = this.game.statPoints;
        // Отслеживаем изменённые статы
        this.changedStats = new Set();
        
        // Инициализируем временные статы из game.playerStats
        for (const [, key] of this.stats) {
            this.tempStats[key] = this.game.playerStats[key];
        }
        
        this.updatePosition();
    }

    updatePosition() {
        this.x = (window.innerWidth - this.width) / 2;
        this.y = (window.innerHeight - this.height) / 2;
    }

    show() {
        this.visible = true;
        this.updatePosition();
        
        // Копируем текущие значения во временные
        this.tempStats = {};
        this.tempPoints = this.game.statPoints;
        this.changedStats.clear();
        
        for (const [, key] of this.stats) {
            this.tempStats[key] = this.game.playerStats[key];
        }
    }

    hide() {
        this.visible = false;
        this.selectedStat = 0;
    }

    toggle() {
        if (!this.visible) {
            this.show();
        } else {
            this.hide();
        }
    }

    // Сохраняем изменения
    saveChanges() {
        // Применяем временные значения к реальным
        this.game.statPoints = this.tempPoints;
        for (const [, key] of this.stats) {
            this.game.playerStats[key] = this.tempStats[key];
        }
        this.hide();
    }

    // Обработка нажатий клавиш
    handleKeyPress(key) {
        if (!this.visible) return;

        switch (key) {
            case 'ArrowUp':
                if (this.tempPoints > 0 || this.changedStats.size > 0) {
                    this.selectedStat = (this.selectedStat - 1 + this.stats.length) % this.stats.length;
                }
                break;
            case 'ArrowDown':
                if (this.tempPoints > 0 || this.changedStats.size > 0) {
                    this.selectedStat = (this.selectedStat + 1) % this.stats.length;
                }
                break;
            case 'ArrowRight':
                if (this.tempPoints > 0) {
                    const statKey = this.stats[this.selectedStat][1];
                    this.tempStats[statKey]++;
                    this.tempPoints--;
                    this.changedStats.add(statKey);
                }
                break;
            case 'ArrowLeft':
                const statKey = this.stats[this.selectedStat][1];
                // Проверяем, был ли стат изменён и можно ли его уменьшить
                if (this.changedStats.has(statKey) && this.tempStats[statKey] > this.game.playerStats[statKey]) {
                    this.tempStats[statKey]--;
                    this.tempPoints++;
                    // Если значение вернулось к начальному, удаляем стат из списка изменённых
                    if (this.tempStats[statKey] === this.game.playerStats[statKey]) {
                        this.changedStats.delete(statKey);
                    }
                }
                break;
            case 'Space':
                // Подтверждаем изменения и закрываем окно
                this.saveChanges();
                break;
            case 'Escape':
                // Просто закрываем окно
                this.hide();
                break;
        }
    }

    render(ctx) {
        if (!this.visible) return;

        // Рисуем фон окна
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Рисуем рамку
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Настройки текста
        ctx.font = '20px monospace';
        ctx.fillStyle = '#fff';
        let currentY = this.y + 40;

        // Заголовок
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.fillText('Характеристики персонажа', this.x + this.width / 2, currentY);
        currentY += this.lineHeight;

        // Очки опыта (показываем всегда)
        ctx.fillStyle = this.tempPoints > 0 ? '#00ff00' : '#666666';
        ctx.fillText(`Доступно очков: ${this.tempPoints}`, this.x + this.width / 2, currentY);
        currentY += this.lineHeight;

        // Измеряем максимальную ширину названий характеристик
        let maxNameWidth = 0;
        this.stats.forEach(([name]) => {
            const width = ctx.measureText(name).width;
            maxNameWidth = Math.max(maxNameWidth, width);
        });

        // Добавляем отступ для значений
        const valueOffset = maxNameWidth + 40;
        const minWindowWidth = valueOffset + 140;
        this.width = Math.max(280, minWindowWidth);
        this.updatePosition();

        // Основные характеристики
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';

        this.stats.forEach(([name, key], index) => {
            const value = this.tempStats[key];
            const initialValue = this.game.playerStats[key];
            const modifier = Math.floor((value - 10) / 2);
            const modifierText = modifier >= 0 ? `+${modifier}` : modifier;
            
            // Курсор выбора (только если есть очки или есть изменённые статы)
            if ((this.tempPoints > 0 || this.changedStats.size > 0) && index === this.selectedStat) {
                ctx.fillStyle = '#ffd700';
                ctx.fillText('►', this.x + this.padding - 25, currentY);
            }
            
            // Название характеристики (золотым только если это выбранный стат и есть очки или изменённые статы)
            ctx.fillStyle = ((this.tempPoints > 0 || this.changedStats.size > 0) && index === this.selectedStat) ? '#ffd700' : '#fff';
            ctx.fillText(name + ':', this.x + this.padding, currentY);
            
            // Значение и модификатор
            ctx.textAlign = 'left';
            // Если стат был изменён, показываем его зелёным цветом
            ctx.fillStyle = this.changedStats.has(key) ? '#00ff00' : '#fff';
            ctx.fillText(`${value} (${modifierText})`, this.x + this.padding + valueOffset, currentY);
            
            // Кнопка + если есть очки и это либо выбранный стат, либо уже прокачанный
            if (this.tempPoints > 0 && (index === this.selectedStat || this.changedStats.has(key))) {
                ctx.fillStyle = '#00ff00';
                ctx.fillText('+', this.x + this.padding + valueOffset + 80, currentY);
            }
            // Кнопка - если стат был изменён и его можно уменьшить
            if (this.changedStats.has(key) && value > initialValue) {
                ctx.fillStyle = '#ff0000';
                ctx.fillText('-', this.x + this.padding + valueOffset - 20, currentY);
            }
            
            currentY += this.lineHeight;
        });
    }
} 