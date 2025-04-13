class StatsWindow {
    constructor(game) {
        this.game = game;
        this.visible = false;
        this.width = 300;
        this.height = 280;
        this.x = (window.innerWidth - this.width) / 2;
        this.y = (window.innerHeight - this.height) / 2;
    }

    show() {
        this.visible = true;
    }

    hide() {
        this.visible = false;
    }

    toggle() {
        this.visible = !this.visible;
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
        let lineHeight = 30;
        let currentY = this.y + 40;
        let padding = 20;

        // Заголовок
        ctx.fillStyle = '#ffd700';
        ctx.fillText('Характеристики персонажа', this.x + padding, currentY);
        currentY += lineHeight + 10;

        // Основные характеристики
        ctx.fillStyle = '#fff';
        const stats = [
            ['Сила', this.game.playerStats.strength],
            ['Ловкость', this.game.playerStats.dexterity],
            ['Телосложение', this.game.playerStats.constitution],
            ['Интеллект', this.game.playerStats.intelligence],
            ['Мудрость', this.game.playerStats.wisdom],
            ['Харизма', this.game.playerStats.charisma]
        ];

        stats.forEach(([name, value]) => {
            const modifier = Math.floor((value - 10) / 2);
            const modifierText = modifier >= 0 ? `+${modifier}` : modifier;
            ctx.fillText(`${name}: ${value} (${modifierText})`, this.x + padding, currentY);
            currentY += lineHeight;
        });

        // Подсказка
        ctx.font = '16px monospace';
        ctx.fillStyle = '#666';
        ctx.fillText('Нажмите @ чтобы закрыть', this.x + padding, this.y + this.height - 20);
    }
} 