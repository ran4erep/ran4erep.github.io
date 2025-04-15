class StatsWindow {
    constructor(game) {
        this.game = game;
        this.visible = false;
        this.width = 300;
        this.height = 280;
        this.padding = 20;
        this.lineHeight = 30;
        this.updatePosition();
    }

    updatePosition() {
        this.x = (window.innerWidth - this.width) / 2;
        this.y = (window.innerHeight - this.height) / 2;
    }

    show() {
        this.visible = true;
        this.updatePosition();
    }

    hide() {
        this.visible = false;
    }

    toggle() {
        this.visible = !this.visible;
        if (this.visible) {
            this.updatePosition();
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
        currentY += this.lineHeight + 10;

        // Основные характеристики
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        const stats = [
            ['Сила', this.game.playerStats.strength],
            ['Ловкость', this.game.playerStats.dexterity],
            ['Телосложение', this.game.playerStats.constitution],
            ['Интеллект', this.game.playerStats.intelligence],
            ['Мудрость', this.game.playerStats.wisdom],
            ['Харизма', this.game.playerStats.charisma]
        ];

        // Измеряем максимальную ширину названий характеристик
        let maxNameWidth = 0;
        stats.forEach(([name]) => {
            const width = ctx.measureText(name).width;
            maxNameWidth = Math.max(maxNameWidth, width);
        });

        // Добавляем отступ для значений
        const valueOffset = maxNameWidth + 40;
        const minWindowWidth = valueOffset + 150;
        this.width = Math.max(300, minWindowWidth);
        this.updatePosition();

        stats.forEach(([name, value]) => {
            const modifier = Math.floor((value - 10) / 2);
            const modifierText = modifier >= 0 ? `+${modifier}` : modifier;
            
            // Название характеристики
            ctx.fillText(name + ':', this.x + this.padding, currentY);
            
            // Значение и модификатор
            ctx.textAlign = 'left';
            ctx.fillText(`${value} (${modifierText})`, this.x + this.padding + valueOffset, currentY);
            
            currentY += this.lineHeight;
        });
    }
} 