class GlyphSystem {
    constructor() {
        this.glyphsMap = {};
        this.loadedFiles = new Map();
        this.loadGlyphs();
    }

    async loadGlyphs() {
        try {
            const response = await fetch('src/data/glyphs.json');
            this.glyphsMap = await response.json();
        } catch (error) {
            console.error('Failed to load glyphs map:', error);
        }
    }

    async loadGlyphFile(filename) {
        if (this.loadedFiles.has(filename)) {
            return this.loadedFiles.get(filename);
        }

        try {
            const response = await fetch(`src/data/glyphs/${filename}.json`);
            const glyphData = await response.json();
            this.loadedFiles.set(filename, glyphData);
            return glyphData;
        } catch (error) {
            console.error(`Failed to load glyph file ${filename}:`, error);
            return null;
        }
    }

    getGlyph(name) {
        const glyphInfo = this.glyphsMap[name];
        if (!glyphInfo) return null;

        const fileData = this.loadedFiles.get(glyphInfo.file);
        if (!fileData) {
            // Если файл ещё не загружен, загружаем его синхронно через XMLHttpRequest
            const xhr = new XMLHttpRequest();
            xhr.open('GET', `src/data/glyphs/${glyphInfo.file}.json`, false);
            xhr.send();
            
            if (xhr.status === 200) {
                const fileData = JSON.parse(xhr.responseText);
                this.loadedFiles.set(glyphInfo.file, fileData);
                return fileData[glyphInfo.name];
            } else {
                console.error(`Failed to load glyph file ${glyphInfo.file}`);
                return null;
            }
        }

        return fileData[glyphInfo.name];
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