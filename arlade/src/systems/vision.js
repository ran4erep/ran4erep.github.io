class VisionSystem {
    constructor() {
        // Константы для настройки поля зрения
        this.VIEW_DISTANCE = 4;      // Дальность видимости
        this.VIEW_ANGLE = Math.PI / 2; // Угол обзора (90 градусов)
        this.INITIAL_VISION_RADIUS = 3; // Радиус начального круга разведки
        
        // Карта видимости: 0 - не исследовано, 1 - исследовано но не видно, 2 - видно сейчас
        this.visibilityMap = [];
        
        // Временная карта для обработки видимости
        this.tempVisibility = [];
    }

    // Инициализация карты видимости
    initializeMap(width, height) {
        this.width = width;
        this.height = height;
        this.visibilityMap = Array(height).fill().map(() => Array(width).fill(0));
        this.tempVisibility = Array(height).fill().map(() => Array(width).fill(false));
    }

    // Начальная разведка вокруг точки спавна
    exploreInitialArea(playerX, playerY, layout) {
        for (let dy = -this.INITIAL_VISION_RADIUS; dy <= this.INITIAL_VISION_RADIUS; dy++) {
            for (let dx = -this.INITIAL_VISION_RADIUS; dx <= this.INITIAL_VISION_RADIUS; dx++) {
                const x = playerX + dx;
                const y = playerY + dy;
                
                if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance <= this.INITIAL_VISION_RADIUS) {
                        this.visibilityMap[y][x] = 1; // Помечаем как исследованную
                    }
                }
            }
        }
    }

    // Обновление видимости
    update(playerX, playerY, layout, lookDirection) {
        // Сбрасываем все видимые тайлы на "исследованные"
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.visibilityMap[y][x] === 2) {
                    this.visibilityMap[y][x] = 1;
                }
                this.tempVisibility[y][x] = false;
            }
        }

        // Отмечаем все видимые клетки в радиусе видимости
        for (let dy = -this.VIEW_DISTANCE; dy <= this.VIEW_DISTANCE; dy++) {
            for (let dx = -this.VIEW_DISTANCE; dx <= this.VIEW_DISTANCE; dx++) {
                const x = playerX + dx;
                const y = playerY + dy;
                
                if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance <= this.VIEW_DISTANCE && this.hasLineOfSight(playerX, playerY, x, y, layout)) {
                        this.tempVisibility[y][x] = true;
                        this.visibilityMap[y][x] = 2;
                    }
                }
            }
        }

        // Второй проход: делаем видимыми все стены, примыкающие к видимым клеткам
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.tempVisibility[y][x] && layout[y][x] !== '#') {
                    // Проверяем все соседние клетки
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const nx = x + dx;
                            const ny = y + dy;
                            
                            if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                                if (layout[ny][nx] === '#') {
                                    this.visibilityMap[ny][nx] = 2;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Проверка прямой видимости между двумя точками
    hasLineOfSight(x0, y0, x1, y1, layout) {
        // Если целевая точка - стена или закрытая дверь, проверяем видимость до клетки перед ней
        const symbol = layout[y1][x1];
        const object = game.currentMap.objects[symbol];
        
        // Проверяем, является ли объект дверью
        if (object && object.type === 'door') {
            const door = game.doors.find(d => d.x === x1 && d.y === y1);
            if (!door || !door.isOpened) {
                const dx = x1 - x0;
                const dy = y1 - y0;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= 1.5) return true; // Если объект рядом, он всегда виден
                
                // Находим точку перед объектом
                const beforeX = x1 - Math.sign(dx);
                const beforeY = y1 - Math.sign(dy);
                return this.hasLineOfSightToEmpty(x0, y0, beforeX, beforeY, layout);
            }
            // Если дверь открыта, проверяем видимость как для обычной клетки
            return this.hasLineOfSightToEmpty(x0, y0, x1, y1, layout);
        }

        // Для стен
        const isBlockingObject = object && object.type === 'wall';
        if (isBlockingObject) {
            const dx = x1 - x0;
            const dy = y1 - y0;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= 1.5) return true;
            
            const beforeX = x1 - Math.sign(dx);
            const beforeY = y1 - Math.sign(dy);
            return this.hasLineOfSightToEmpty(x0, y0, beforeX, beforeY, layout);
        }

        return this.hasLineOfSightToEmpty(x0, y0, x1, y1, layout);
    }

    // Проверка прямой видимости до пустой клетки
    hasLineOfSightToEmpty(x0, y0, x1, y1, layout) {
        let dx = Math.abs(x1 - x0);
        let dy = Math.abs(y1 - y0);
        let x = x0;
        let y = y0;
        let n = 1 + dx + dy;
        let x_inc = (x1 > x0) ? 1 : -1;
        let y_inc = (y1 > y0) ? 1 : -1;
        let error = dx - dy;
        dx *= 2;
        dy *= 2;

        for (; n > 0; --n) {
            if (x === x1 && y === y1) return true;
            
            if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                const symbol = layout[y][x];
                const object = game.currentMap.objects[symbol];
                
                // Проверяем блокировку видимости
                if (object) {
                    if (object.type === 'wall') {
                        if (!(x === x0 && y === y0)) return false;
                    } else if (object.type === 'door') {
                        const door = game.doors.find(d => d.x === x && d.y === y);
                        if (!door || !door.isOpened) {
                            if (!(x === x0 && y === y0)) return false;
                        }
                    }
                }
            }

            if (error > 0) {
                x += x_inc;
                error -= dy;
            } else {
                y += y_inc;
                error += dx;
            }
        }
        
        return true;
    }

    // Проверка видимости тайла
    isTileVisible(x, y) {
        // В режиме отладки без тумана все тайлы видимы
        if (game.debugMode?.noFog) {
            return true;
        }
        return this.visibilityMap[y]?.[x] === 2;
    }

    // Проверка исследованности тайла
    isTileExplored(x, y) {
        // В режиме отладки без тумана все тайлы исследованы
        if (game.debugMode?.noFog) {
            return true;
        }
        return this.visibilityMap[y]?.[x] > 0;
    }

    // Принудительная установка видимости тайла
    forceTileVisible(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.visibilityMap[y][x] = 2;
            this.tempVisibility[y][x] = true;
        }
    }
}

// Экспортируем систему
const visionSystem = new VisionSystem(); 