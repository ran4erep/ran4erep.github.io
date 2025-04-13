class GlyphSystem {
    constructor() {
        this.glyphs = {};
        this.loadGlyphs();
    }

    async loadGlyphs() {
        try {
            const response = await fetch('src/data/glyphs.json');
            this.glyphs = await response.json();
        } catch (error) {
            console.error('Failed to load glyphs:', error);
        }
    }

    getGlyph(name) {
        return this.glyphs[name];
    }

    drawGlyph(ctx, name, x, y, tileSize) {
        const glyph = this.getGlyph(name);
        if (!glyph) return;

        // Размер одного пикселя (матрица 16x16)
        const pixelSize = Math.ceil(tileSize / 16);

        // Сначала очищаем область глифа
        ctx.clearRect(x, y, tileSize, tileSize);

        glyph.pixels.forEach((row, rowIndex) => {
            [...row].forEach((pixel, colIndex) => {
                if (pixel === '-') return; // Пропускаем прозрачные пиксели
                const color = glyph.colors[pixel];
                if (!color) return; // Пропускаем пиксели без цвета
                
                ctx.fillStyle = color;
                ctx.fillRect(
                    Math.floor(x + colIndex * pixelSize),
                    Math.floor(y + rowIndex * pixelSize),
                    pixelSize + 1,
                    pixelSize + 1
                );
            });
        });
    }
}

const glyphSystem = new GlyphSystem(); 