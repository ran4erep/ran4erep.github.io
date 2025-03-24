class Camera {
    constructor(game) {
        this.game = game;
        
        // Получаем размер экрана
        const container = document.getElementById('gameContainer');
        this.virtualWidth = container.clientWidth;
        this.virtualHeight = container.clientHeight;
        
        // Базовый размер тайла (16 пикселей - минимальный размер)
        this.MIN_TILE_SIZE = 16;
        this.MAX_TILE_SIZE = 96; // 16 * 6
        this.tileSize = 48; // Начальный размер (16 * 3)
        
        // Анимация масштабирования
        this.targetTileSize = this.tileSize;
        this.isZooming = false;
        this.zoomStartTime = 0;
        this.zoomStartSize = 0;
        this.zoomDuration = 150; // 150ms для анимации масштабирования
        
        // Позиция камеры (в пикселях)
        this.x = 0;
        this.y = 0;

        // Обработчик изменения размера окна
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    handleResize() {
        const container = document.getElementById('gameContainer');
        this.virtualWidth = container.clientWidth;
        this.virtualHeight = container.clientHeight;
        this.updateScale();
    }

    // Обновление масштаба
    updateScale() {
        // Обновляем положение камеры и сообщаем игре о необходимости перерисовки
        this.centerOnPlayer();
        renderer.clearCache();
        renderer.render();
    }

    // Анимация масштабирования
    updateZoom(currentTime) {
        if (!this.isZooming) return false;

        const elapsed = currentTime - this.zoomStartTime;
        const progress = Math.min(elapsed / this.zoomDuration, 1);

        if (progress < 1) {
            // Интерполируем размер тайла
            this.tileSize = this.zoomStartSize + (this.targetTileSize - this.zoomStartSize) * progress;
            // Центрируем на текущей позиции игрока
            this.centerOnPosition(this.game.visualX, this.game.visualY);
            return true;
        } else {
            // Анимация завершена
            this.tileSize = this.targetTileSize;
            this.isZooming = false;
            // Финальное центрирование
            this.centerOnPosition(this.game.visualX, this.game.visualY);
            return false;
        }
    }

    // Центрирование камеры на произвольной позиции
    centerOnPosition(x, y) {
        // Позиция камеры в пикселях, центрированная на указанной позиции
        this.x = x * this.tileSize - this.virtualWidth / 2;
        this.y = y * this.tileSize - this.virtualHeight / 2;

        // Ограничиваем камеру границами карты
        const maxX = this.game.currentMap.width * this.tileSize - this.virtualWidth;
        const maxY = this.game.currentMap.height * this.tileSize - this.virtualHeight;

        this.x = Math.max(0, Math.min(this.x, maxX));
        this.y = Math.max(0, Math.min(this.y, maxY));
    }

    // Центрирование камеры на игроке теперь использует centerOnPosition
    centerOnPlayer() {
        this.centerOnPosition(this.game.playerX, this.game.playerY);
    }

    // Увеличение масштаба (увеличение размера тайла)
    zoomIn() {
        if (this.targetTileSize < this.MAX_TILE_SIZE) {
            this.zoomStartSize = this.tileSize;
            this.targetTileSize = Math.min(this.targetTileSize + 16, this.MAX_TILE_SIZE);
            this.isZooming = true;
            this.zoomStartTime = performance.now();
            // Центрируем на текущей позиции игрока
            this.centerOnPosition(this.game.visualX, this.game.visualY);
        }
    }

    // Уменьшение масштаба (уменьшение размера тайла)
    zoomOut() {
        if (this.targetTileSize > this.MIN_TILE_SIZE) {
            this.zoomStartSize = this.tileSize;
            this.targetTileSize = Math.max(this.targetTileSize - 16, this.MIN_TILE_SIZE);
            this.isZooming = true;
            this.zoomStartTime = performance.now();
            // Центрируем на текущей позиции игрока
            this.centerOnPosition(this.game.visualX, this.game.visualY);
        }
    }

    // Получение количества видимых тайлов
    get visibleTilesX() {
        return Math.ceil(this.virtualWidth / this.tileSize);
    }

    get visibleTilesY() {
        return Math.ceil(this.virtualHeight / this.tileSize);
    }

    // Получение видимой области карты
    getVisibleArea() {
        return {
            startTileX: Math.floor(this.x / this.tileSize),
            startTileY: Math.floor(this.y / this.tileSize),
            endTileX: Math.ceil((this.x + this.virtualWidth) / this.tileSize),
            endTileY: Math.ceil((this.y + this.virtualHeight) / this.tileSize)
        };
    }

    // Преобразование координат тайла в экранные координаты
    worldToScreen(tileX, tileY) {
        return {
            x: tileX * this.tileSize - this.x,
            y: tileY * this.tileSize - this.y
        };
    }
} 