class Renderer {
    constructor(game, camera) {
        this.game = game;
        this.camera = camera;
        this.ctx = game.ctx;
        
        // Кэш для отрисованных глифов
        this.glyphCache = new Map();
        
        // Создаем отдельные временные canvas для разных режимов
        this.fpCanvas = document.createElement('canvas');
        this.fpCanvas.width = 32;
        this.fpCanvas.height = 32;
        this.fpCtx = this.fpCanvas.getContext('2d', {
            alpha: true,
            willReadFrequently: true
        });
        
        this.topDownCanvas = document.createElement('canvas');
        this.topDownCanvas.width = 1024;
        this.topDownCanvas.height = 1024;
        this.topDownCtx = this.topDownCanvas.getContext('2d', {
            alpha: true,
            willReadFrequently: true
        });
        
        // Создаем ImageData для быстрого доступа к пикселям текстур
        this.textureImageData = new Map();
        
        // Кэшируем ImageData для первого лица
        this.fpImageData = null;
        this.fpBuffer = null;
        
        // Предварительно вычисленные значения для потолка
        this.ceilingColor = { r: 17, g: 17, b: 17 };
        
        // Предварительно вычисленные затенённые цвета для тумана войны
        this.fogCeilingColor = {
            r: this.ceilingColor.r * 0.5,
            g: this.ceilingColor.g * 0.5,
            b: this.ceilingColor.b * 0.5
        };
        
        // Параметры индикатора прицеливания
        this.aimIndicatorPosition = 0; // Позиция от 0 до 1
        this.aimIndicatorDirection = 1; // 1 - вправо, -1 - влево
        this.aimIndicatorSpeed = 1.2; // Скорость движения (в единицах за секунду)
        this.lastAimUpdate = performance.now();

        // Кэш для спрайтов и массивов
        this.spriteCache = new Map();
        this.sprites = [];
        this.zBuffer = null;
    }

    // Создание кэша для глифа
    createGlyphCache(glyphName, tileSize) {
        const canvas = document.createElement('canvas');
        canvas.width = tileSize;
        canvas.height = tileSize;
        const ctx = canvas.getContext('2d', { 
            alpha: true,
            willReadFrequently: true
        });
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        glyphSystem.drawGlyph(ctx, glyphName, 0, 0, tileSize);
        
        return canvas;
    }

    // Создание кэша для текстур от первого лица
    createFirstPersonGlyphCache(glyphName) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d', { 
            alpha: true,
            willReadFrequently: true
        });
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        glyphSystem.drawGlyph(ctx, glyphName, 0, 0, 32);
        
        // Сохраняем ImageData для быстрого доступа
        const imageData = ctx.getImageData(0, 0, 32, 32);
        this.textureImageData.set(glyphName, imageData);
        
        return canvas;
    }

    // Получение глифа из кэша
    getGlyphFromCache(glyphName, tileSize, isFirstPerson = false) {
        if (isFirstPerson) {
            const key = `fp_${glyphName}`;
            if (!this.glyphCache.has(key)) {
                this.glyphCache.set(key, this.createFirstPersonGlyphCache(glyphName));
            }
            return this.glyphCache.get(key);
        } else {
            const key = `${glyphName}_${tileSize}`;
            if (!this.glyphCache.has(key)) {
                this.glyphCache.set(key, this.createGlyphCache(glyphName, tileSize));
            }
            return this.glyphCache.get(key);
        }
    }

    // Очистка кэша
    clearCache() {
        this.glyphCache.clear();
    }

    // Основной метод отрисовки
    render() {
        this.ctx.clearRect(0, 0, this.game.canvas.width, this.game.canvas.height);

        if (this.game.isFirstPersonMode) {
            this.renderFirstPerson();
            
            // Обновляем позицию индикатора прицеливания только если он не зафиксирован
            if (this.game.isCombatMode && !this.game.isAimIndicatorFixed) {
                const currentTime = performance.now();
                const deltaTime = (currentTime - this.lastAimUpdate) / 1000;
                this.lastAimUpdate = currentTime;
                
                // Обновляем позицию индикатора
                this.aimIndicatorPosition += this.aimIndicatorSpeed * this.aimIndicatorDirection * deltaTime;
                
                // Если достигли края, меняем направление
                if (this.aimIndicatorPosition >= 1) {
                    this.aimIndicatorPosition = 1;
                    this.aimIndicatorDirection = -1;
                } else if (this.aimIndicatorPosition <= 0) {
                    this.aimIndicatorPosition = 0;
                    this.aimIndicatorDirection = 1;
                }
            }
        } else {
            // Обновляем видимость
            visionSystem.update(
                this.game.playerX,
                this.game.playerY,
                this.game.currentMap.layout,
                this.game.lookDirection
            );
            
            // Делаем тайл под игроком всегда видимым
            visionSystem.forceTileVisible(this.game.playerX, this.game.playerY);

            // Получаем видимую область
            const visibleArea = this.camera.getVisibleArea();
            
            // Собираем объекты для отрисовки
            const renderQueue = this.collectRenderQueue(visibleArea);
            
            // Отрисовываем объекты
            this.renderObjects(renderQueue);
            
            // Накладываем туман войны если он не отключен
            if (!this.game.debugMode?.noFog) {
                this.renderFogOfWar(visibleArea);
            }

            // Отрисовываем пути врагов в режиме отладки
            if (this.game.debugMode?.showEnemyPaths) {
                this.renderEnemyPaths();
            }

            // Отрисовываем поле зрения врагов в режиме отладки
            if (this.game.debugMode?.showEnemyVision) {
                this.renderEnemyVision(visibleArea);
            }
        }
    }

    renderFirstPerson() {
        const canvas = this.game.firstPersonCanvas;
        const ctx = this.game.firstPersonCtx;
        const width = canvas.width;
        const height = canvas.height;

        // Проверяем размеры
        if (width === 0 || height === 0) {
            console.error('Canvas dimensions are zero');
            return;
        }

        // Create or reuse ImageData and zBuffer
        if (!this.fpImageData || this.fpImageData.width !== width || this.fpImageData.height !== height) {
            this.fpImageData = ctx.createImageData(width, height);
            this.fpBuffer = this.fpImageData.data;
            this.zBuffer = new Float32Array(width);
        } else {
            this.zBuffer.fill(0);
        }

        // Pre-calculate constants
        const halfWidth = width >> 1;
        const halfHeight = height >> 1;
        const invWidth = 1.0 / width;

        // Player position and direction
        const posX = this.game.playerX + 0.5;
        const posY = this.game.playerY + 0.5;
        const dirX = Math.cos(this.game.lookDirection);
        const dirY = Math.sin(this.game.lookDirection);
        const planeX = -Math.sin(this.game.lookDirection);
        const planeY = Math.cos(this.game.lookDirection);

        // Pre-cache wall, door and floor textures
        this.getGlyphFromCache('wall', 32, true);
        this.getGlyphFromCache('door', 32, true);
        this.getGlyphFromCache('openedDoor', 32, true);
        this.getGlyphFromCache('floor', 32, true);
        const wallData = this.textureImageData.get('wall');
        const doorData = this.textureImageData.get('door');
        const openedDoorData = this.textureImageData.get('openedDoor');
        const floorData = this.textureImageData.get('floor');

        // Pre-collect all visible sprites
        this.sprites.length = 0;
        const maxDistance = 12.0;
        const maxDistanceSq = maxDistance * maxDistance;

        // Collect enemies
        for (const enemy of this.game.enemySystem.enemies) {
            const dx = enemy.x + 0.5 - posX;
            const dy = enemy.y + 0.5 - posY;
            const distSq = dx * dx + dy * dy;
            
            if (distSq <= maxDistanceSq && dx * dirX + dy * dirY > 0) {
                this.sprites.push({
                    x: enemy.x + 0.5,
                    y: enemy.y + 0.5,
                    texture: enemy.getGlyphName(),
                    distSq,
                    enemy // Сохраняем ссылку на врага для оптимизации
                });
            }
        }

        // Collect decorations
        for (let y = posY - maxDistance; y <= posY + maxDistance; y++) {
            const dy = y - posY;
            for (let x = posX - maxDistance; x <= posX + maxDistance; x++) {
                const dx = x - posX;
                const distSq = dx * dx + dy * dy;
                
                if (distSq <= maxDistanceSq && dx * dirX + dy * dirY > 0 &&
                    x >= 0 && x < this.game.currentMap.width &&
                    y >= 0 && y < this.game.currentMap.height) {
                    
                    const symbol = this.game.currentMap.layout[y | 0][x | 0];
                    const object = this.game.currentMap.objects[symbol];
                    
                    if (object && object.type === 'decoration') {
                        this.sprites.push({
                            x: x,
                            y: y,
                            texture: object.glyph,
                            distSq
                        });
                    }
                }
            }
        }

        // Sort sprites by distance
        this.sprites.sort((a, b) => b.distSq - a.distSq);

        // Pre-cache textures if needed
        for (const sprite of this.sprites) {
            if (!this.spriteCache.has(sprite.texture)) {
                const texture = this.getGlyphFromCache(sprite.texture, 32, true);
                const textureData = this.textureImageData.get(sprite.texture);
                this.spriteCache.set(sprite.texture, textureData);
            }
        }

        // Fill floor and ceiling
        const size = width * height * 4;

        // Pre-calculate ray directions for the leftmost and rightmost pixels
        const rayDirX0 = dirX - planeX;
        const rayDirY0 = dirY - planeY;
        const rayDirX1 = dirX + planeX;
        const rayDirY1 = dirY + planeY;

        // For each row
        for (let y = halfHeight; y < height; y++) {
            // Current y position compared to the center of the screen
            const p = y - halfHeight;
            const rowDistance = (height * 0.5) / p;

            // Calculate step for this row
            const floorStepX = rowDistance * (rayDirX1 - rayDirX0) * invWidth;
            const floorStepY = rowDistance * (rayDirY1 - rayDirY0) * invWidth;

            // Starting position for this row
            let floorX = posX + rowDistance * rayDirX0;
            let floorY = posY + rowDistance * rayDirY0;

            // Cache the row offset
            const rowOffset = y * width;
            const floorRowStart = rowOffset << 2;
            const ceilingRowStart = ((height - y - 1) * width) << 2;

            // Cache last checked coordinates and visibility status
            let lastMapX = -1, lastMapY = -1;
            let lastIsVisible = false, lastIsExplored = false;

            // Process row in blocks of 8 pixels
            for (let x = 0; x < width; x += 8) {
                const mapX = floorX | 0;
                const mapY = floorY | 0;

                // Check visibility only if coordinates changed
                if (mapX !== lastMapX || mapY !== lastMapY) {
                    lastMapX = mapX;
                    lastMapY = mapY;
                    lastIsVisible = visionSystem.isTileVisible(mapX, mapY);
                    lastIsExplored = visionSystem.isTileExplored(mapX, mapY);
                }

                // Fill 8 pixels at once
                for (let i = 0; i < 8 && x + i < width; i++) {
                    const pixelOffset = (x + i) << 2;
                    const floorIdx = floorRowStart + pixelOffset;
                    const ceilingIdx = ceilingRowStart + pixelOffset;

                    if (!lastIsExplored) {
                        // Unexplored - black for both floor and ceiling
                        this.fpBuffer[floorIdx] = this.fpBuffer[floorIdx + 1] = this.fpBuffer[floorIdx + 2] = 0;
                        this.fpBuffer[ceilingIdx] = this.fpBuffer[ceilingIdx + 1] = this.fpBuffer[ceilingIdx + 2] = 0;
                    } else {
                        // Get floor texture coordinates
                        const fx = ((floorX + i * floorStepX / 8) * 32) & 31;
                        const fy = (floorY * 32) & 31;
                        const floorTexIdx = ((fy << 5) + fx) << 2;

                        if (!lastIsVisible) {
                            // Explored but not visible - use pre-calculated fog colors
                            this.fpBuffer[floorIdx] = floorData.data[floorTexIdx] * 0.5;
                            this.fpBuffer[floorIdx + 1] = floorData.data[floorTexIdx + 1] * 0.5;
                            this.fpBuffer[floorIdx + 2] = floorData.data[floorTexIdx + 2] * 0.5;
                            
                            this.fpBuffer[ceilingIdx] = this.fogCeilingColor.r;
                            this.fpBuffer[ceilingIdx + 1] = this.fogCeilingColor.g;
                            this.fpBuffer[ceilingIdx + 2] = this.fogCeilingColor.b;
                        } else {
                            // Fully visible - use normal colors
                            this.fpBuffer[floorIdx] = floorData.data[floorTexIdx];
                            this.fpBuffer[floorIdx + 1] = floorData.data[floorTexIdx + 1];
                            this.fpBuffer[floorIdx + 2] = floorData.data[floorTexIdx + 2];
                            
                            this.fpBuffer[ceilingIdx] = this.ceilingColor.r;
                            this.fpBuffer[ceilingIdx + 1] = this.ceilingColor.g;
                            this.fpBuffer[ceilingIdx + 2] = this.ceilingColor.b;
                        }
                    }

                    // Set alpha
                    this.fpBuffer[floorIdx + 3] = this.fpBuffer[ceilingIdx + 3] = 255;
                }

                // Update position for next block
                floorX += floorStepX * 8;
                floorY += floorStepY * 8;
            }
        }

        // Ray casting
        for (let x = 0; x < width; x++) {
            const cameraX = (x - halfWidth) * invWidth * 2;
            const rayDirX = dirX + planeX * cameraX;
            const rayDirY = dirY + planeY * cameraX;

            let mapX = posX | 0;
            let mapY = posY | 0;

            const deltaDistX = Math.abs(1 / rayDirX);
            const deltaDistY = Math.abs(1 / rayDirY);

            const stepX = rayDirX < 0 ? -1 : 1;
            const stepY = rayDirY < 0 ? -1 : 1;

            let sideDistX = rayDirX < 0 ? (posX - mapX) * deltaDistX : (mapX + 1 - posX) * deltaDistX;
            let sideDistY = rayDirY < 0 ? (posY - mapY) * deltaDistY : (mapY + 1 - posY) * deltaDistY;

            let hit = false;
            let side = 0;
            let perpWallDist;

            while (!hit) {
                if (sideDistX < sideDistY) {
                    sideDistX += deltaDistX;
                    mapX += stepX;
                    side = 0;
                    perpWallDist = (mapX - posX + (1 - stepX) * 0.5) / rayDirX;
                } else {
                    sideDistY += deltaDistY;
                    mapY += stepY;
                    side = 1;
                    perpWallDist = (mapY - posY + (1 - stepY) * 0.5) / rayDirY;
                }

                if (mapX < 0 || mapX >= this.game.currentMap.width || 
                    mapY < 0 || mapY >= this.game.currentMap.height) {
                    break;
                }

                const symbol = this.game.currentMap.layout[mapY][mapX];
                const object = this.game.currentMap.objects[symbol];

                // Если это стена или дверь
                if (object && (object.type === 'wall' || object.type === 'door')) {
                    // Если это открытая дверь, проверяем прозрачность текстуры
                    if (object.type === 'door' && this.isDoorOpen(mapX, mapY)) {
                        const wallX = side === 0 ? 
                            posY + perpWallDist * rayDirY : 
                            posX + perpWallDist * rayDirX;
                        
                        let texX = ((wallX - (wallX | 0)) * 32) | 0;
                        if ((side === 0 && rayDirX > 0) || (side === 1 && rayDirY < 0)) {
                            texX = 31 - texX;
                        }

                        // Проверяем альфа-канал в середине текстуры
                        const texIdx = (16 * 32 + texX) << 2;
                        if (openedDoorData.data[texIdx + 3] <= 128) {
                            continue; // Пропускаем прозрачные части
                        }
                    }
                    
                    hit = true;
                    this.zBuffer[x] = perpWallDist;

                    const lineHeight = (height / perpWallDist) | 0;
                    let drawStart = (-lineHeight * 0.5 + halfHeight) | 0;
                    if (drawStart < 0) drawStart = 0;
                    let drawEnd = (lineHeight * 0.5 + halfHeight) | 0;
                    if (drawEnd >= height) drawEnd = height - 1;

                    const wallX = side === 0 ? 
                        posY + perpWallDist * rayDirY : 
                        posX + perpWallDist * rayDirX;
                    
                    let texX = ((wallX - (wallX | 0)) * 32) | 0;
                    if ((side === 0 && rayDirX > 0) || (side === 1 && rayDirY < 0)) {
                        texX = 31 - texX;
                    }

                    // Выбираем текстуру в зависимости от типа объекта
                    let textureData = object.type === 'wall' ? wallData : 
                        (object.type === 'door' && this.isDoorOpen(mapX, mapY)) ? openedDoorData : doorData;

                    if (!textureData) continue;

                    const isVisible = visionSystem.isTileVisible(mapX, mapY);
                    const isExplored = visionSystem.isTileExplored(mapX, mapY);
                    
                    if (!isExplored) {
                        // Неисследованная область - черная
                        for (let y = drawStart; y < drawEnd; y++) {
                            const idx = (y * width + x) << 2;
                            this.fpBuffer[idx] = 0;
                            this.fpBuffer[idx + 1] = 0;
                            this.fpBuffer[idx + 2] = 0;
                            this.fpBuffer[idx + 3] = 255;
                        }
                        continue;
                    }

                    const shade = side === 1 ? 0.7 : 1;
                    const fogShade = isVisible ? 1.0 : 0.5;
                    const step = 32 / lineHeight;
                    let texPos = (drawStart - halfHeight + lineHeight * 0.5) * step;

                    for (let y = drawStart; y < drawEnd; y++) {
                        const texY = (texPos | 0) & 31;
                        texPos += step;

                        const texIdx = (texY * 32 + texX) << 2;
                        const idx = (y * width + x) << 2;
                        
                        // Проверяем альфа-канал текстуры
                        if (textureData.data[texIdx + 3] > 128) {
                            this.fpBuffer[idx] = textureData.data[texIdx] * shade * fogShade;
                            this.fpBuffer[idx + 1] = textureData.data[texIdx + 1] * shade * fogShade;
                            this.fpBuffer[idx + 2] = textureData.data[texIdx + 2] * shade * fogShade;
                            this.fpBuffer[idx + 3] = 255;
                        }
                    }
                }
            }
        }

        // Render sprites
        const invDet = 1.0 / (planeX * dirY - dirX * planeY);
        
        for (const sprite of this.sprites) {
            const dx = sprite.x - posX;
            const dy = sprite.y - posY;
            
            const transformX = invDet * (dirY * dx - dirX * dy);
            const transformY = invDet * (-planeY * dx + planeX * dy);
            
            if (transformY <= 0.1) continue;

            // Проверяем видимость спрайта
            const spriteMapX = sprite.x | 0;
            const spriteMapY = sprite.y | 0;
            const isVisible = visionSystem.isTileVisible(spriteMapX, spriteMapY);
            const isExplored = visionSystem.isTileExplored(spriteMapX, spriteMapY);

            if (!isExplored) continue;

            // Используем сохраненную ссылку на врага вместо поиска
            const enemy = sprite.enemy;
            if (!isVisible && enemy) continue;

            const spriteScreenX = (halfWidth * (1 + transformX / transformY)) | 0;
            const spriteHeight = (height / transformY) | 0;
            if (spriteHeight < 4) continue;

            const drawStartY = Math.max(halfHeight - (spriteHeight >> 1), 0);
            const drawEndY = Math.min(halfHeight + (spriteHeight >> 1), height);
            const drawStartX = Math.max(spriteScreenX - (spriteHeight >> 1), 0);
            const drawEndX = Math.min(spriteScreenX + (spriteHeight >> 1), width);

            const texData = this.spriteCache.get(sprite.texture).data;
            const startOffset = -(spriteHeight >> 1) + spriteScreenX;
            const texStepX = (32 << 8) / spriteHeight;
            const texStepY = (32 << 8) / spriteHeight;
            const fogShade = isVisible ? 1.0 : 0.5;

            // Добавляем эффект урона для врагов
            let damageEffect = 0;
            let alpha = 1.0;
            if (enemy) {
                if (enemy.isDamageEffectActive()) {
                    damageEffect = 0.7;
                }
                if (enemy.health <= 0) {
                    alpha = 0.2;
                }
            }

            for (let x = drawStartX; x < drawEndX; x++) {
                if (transformY > this.zBuffer[x]) continue;

                const texX = ((((x - startOffset) * texStepX) >> 8) & 31);
                let texY = 0;
                let yStep = (texStepY * (drawEndY - drawStartY)) >> 8;

                for (let y = drawStartY; y < drawEndY; y++) {
                    texY = ((((y - drawStartY) * texStepY) >> 8) & 31);
                    const texIdx = (texY * 32 + texX) << 2;
                    const idx = (y * width + x) << 2;

                    // Проверяем альфа-канал текстуры
                    if (texData[texIdx + 3] > 128) {
                        // Применяем эффект урона и прозрачность
                        this.fpBuffer[idx] = Math.min(255, texData[texIdx] * fogShade + damageEffect * 255);
                        this.fpBuffer[idx + 1] = texData[texIdx + 1] * fogShade * (1 - damageEffect);
                        this.fpBuffer[idx + 2] = texData[texIdx + 2] * fogShade * (1 - damageEffect);
                        this.fpBuffer[idx + 3] = 255 * alpha;
                    }
                }
            }
        }

        // Put the image data on the canvas
        ctx.putImageData(this.fpImageData, 0, 0);

        // Отрисовка индикатора прицеливания в боевом режиме
        if (this.game.isCombatMode) {
            // Отрисовка индикатора
            const indicatorHeight = 20;
            const indicatorY = height - indicatorHeight - 10;
            const indicatorWidth = width * 0.8;
            const indicatorX = (width - indicatorWidth) / 2;
            
            // Рисуем фон индикатора
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(indicatorX, indicatorY, indicatorWidth, indicatorHeight);
            
            // Рисуем зону точности (30% от ширины индикатора)
            const accuracyZoneWidth = indicatorWidth * 0.3;
            const accuracyZoneX = indicatorX + (indicatorWidth - accuracyZoneWidth) / 2;
            ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
            ctx.fillRect(accuracyZoneX, indicatorY, accuracyZoneWidth, indicatorHeight);
            
            // Рисуем движущийся указатель
            const markerX = indicatorX + indicatorWidth * this.aimIndicatorPosition;
            ctx.fillStyle = 'white';
            ctx.fillRect(markerX - 2, indicatorY - 5, 4, indicatorHeight + 10);
        }

        // Копируем на основной canvas
        this.ctx.clearRect(0, 0, this.game.canvas.width, this.game.canvas.height);
        this.ctx.drawImage(canvas, 0, 0);
    }

    getTextureColor(imageData, x, width) {
        // Вычисляем средний цвет столбца текстуры
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let y = 0; y < imageData.height; y++) {
            const idx = (y * width + x) * 4;
            if (imageData.data[idx + 3] > 0) { // Если пиксель не прозрачный
                r += imageData.data[idx];
                g += imageData.data[idx + 1];
                b += imageData.data[idx + 2];
                count++;
            }
        }
        
        if (count === 0) return { r: 0, g: 0, b: 0 };
        
        return {
            r: Math.floor(r / count),
            g: Math.floor(g / count),
            b: Math.floor(b / count)
        };
    }

    castRay(startX, startY, angle, maxDepth) {
        const rayDirX = Math.cos(angle);
        const rayDirY = Math.sin(angle);

        // Текущая позиция в тайлах
        let mapX = Math.floor(startX);
        let mapY = Math.floor(startY);

        // Длина луча от текущей позиции до следующей стороны x или y
        let sideDistX;
        let sideDistY;

        // Длина луча от одной стороны x или y до следующей
        const deltaDistX = Math.abs(1 / rayDirX);
        const deltaDistY = Math.abs(1 / rayDirY);

        // В каком направлении шагать по x и y (-1 или 1)
        const stepX = rayDirX < 0 ? -1 : 1;
        const stepY = rayDirY < 0 ? -1 : 1;

        // Вычисляем начальные sideDistX и sideDistY
        if (rayDirX < 0) {
            sideDistX = (startX - mapX) * deltaDistX;
        } else {
            sideDistX = (mapX + 1.0 - startX) * deltaDistX;
        }
        if (rayDirY < 0) {
            sideDistY = (startY - mapY) * deltaDistY;
        } else {
            sideDistY = (mapY + 1.0 - startY) * deltaDistY;
        }

        let side; // 0 для x-стороны, 1 для y-стороны
        let distance = 0;
        let hit = false;
        let wallType = null;

        // DDA алгоритм
        while (!hit && distance < maxDepth) {
            // Переход к следующему тайлу
            if (sideDistX < sideDistY) {
                sideDistX += deltaDistX;
                mapX += stepX;
                side = 0;
                distance = sideDistX - deltaDistX;
            } else {
                sideDistY += deltaDistY;
                mapY += stepY;
                side = 1;
                distance = sideDistY - deltaDistY;
            }

            // Проверка на выход за пределы карты
            if (mapX < 0 || mapX >= this.game.currentMap.width ||
                mapY < 0 || mapY >= this.game.currentMap.height) {
                return {distance: null, wallType: null, hitX: null, hitY: null, side: null};
            }

            // Получаем тип объекта в текущей точке
            const symbol = this.game.currentMap.layout[mapY][mapX];
            const object = this.game.currentMap.objects[symbol];

            // Если это стена или дверь
            if (object && (object.type === 'wall' || object.type === 'door')) {
                hit = true;
                wallType = object.type;
            }
        }

        if (!hit) {
            return {distance: null, wallType: null, hitX: null, hitY: null, side: null};
        }

        return {
            distance: distance,
            wallType: wallType,
            hitX: mapX,
            hitY: mapY,
            side: side
        };
    }

    isDoorOpen(x, y) {
        const door = this.game.doors.find(d => d.x === x && d.y === y);
        return door ? door.isOpened : false;
    }

    // Сбор объектов для отрисовки
    collectRenderQueue(visibleArea) {
        const renderQueue = [];

        // Добавляем все объекты в очередь
        for (let y = visibleArea.startTileY; y < visibleArea.endTileY; y++) {
            for (let x = visibleArea.startTileX; x < visibleArea.endTileX; x++) {
                if (y >= 0 && y < this.game.currentMap.height && 
                    x >= 0 && x < this.game.currentMap.width) {
                    
                    if (!visionSystem.isTileExplored(x, y)) continue;

                    const symbol = this.game.currentMap.layout[y][x];
                    const object = this.game.currentMap.objects[symbol];
                    
                    if (!object) continue;

                    // Добавляем пол под объектом
                    const floorType = this.game.determineFloorType(x, y);
                    const floorObject = Object.values(this.game.currentMap.objects)
                        .find(obj => obj.type === 'floor' && obj.glyph === floorType);
                    
                    if (floorObject) {
                        renderQueue.push({ x, y, object: floorObject });
                    }

                    // Проверяем, является ли объект дверью
                    if (object.type === 'door') {
                        const door = this.game.doors.find(d => d.x === x && d.y === y);
                        if (door) {
                            renderQueue.push({ 
                                x, 
                                y, 
                                object: {
                                    ...object,
                                    glyph: door.isOpened ? 'openedDoor' : 'door'
                                }
                            });
                        }
                        continue;
                    }

                    renderQueue.push({ x, y, object: object });
                }
            }
        }

        // Добавляем противников
        this.game.enemySystem.enemies.forEach(enemy => {
            if (enemy.x >= visibleArea.startTileX && enemy.x < visibleArea.endTileX &&
                enemy.y >= visibleArea.startTileY && enemy.y < visibleArea.endTileY &&
                visionSystem.isTileVisible(enemy.x, enemy.y)) {
                renderQueue.push({
                    x: enemy.visualX,
                    y: enemy.visualY,
                    object: {
                        glyph: enemy.getGlyphName(),
                        type: 'enemy',
                        z_index: 2
                    }
                });

                // Добавляем индикатор состояния, если состояние изменилось на этом ходу
                if (enemy.lastStateChangeTime === this.game.lastMoveTime && 
                    (enemy.actionsPerTurn <= 0 || enemy.actionsLeft === enemy.actionsPerTurn)) {
                    renderQueue.push({
                        x: enemy.visualX,
                        y: enemy.visualY - 0.5,
                        object: {
                            glyph: enemy.state === 'chase' ? 'alert' : 'question',
                            z_index: 3
                        }
                    });
                }
            }
        });

        // Добавляем игрока, используя визуальную позицию
        const playerObject = Object.values(this.game.currentMap.objects)
            .find(obj => obj.type === 'player');
        
        renderQueue.push({
            x: this.game.visualX,
            y: this.game.visualY,
            object: playerObject
        });

        // Сортируем по z-index
        return renderQueue.sort((a, b) => (a.object.z_index || 0) - (b.object.z_index || 0));
    }

    // Отрисовка объектов
    renderObjects(renderQueue) {
        this.ctx.globalAlpha = 1.0;
        for (const item of renderQueue) {
            const cachedGlyph = this.getGlyphFromCache(
                item.object.glyph,
                this.camera.tileSize
            );
            const screenPos = this.camera.worldToScreen(item.x, item.y);
            this.ctx.drawImage(
                cachedGlyph,
                screenPos.x,
                screenPos.y
            );
        }
    }

    // Отрисовка тумана войны
    renderFogOfWar(visibleArea) {
        for (let y = visibleArea.startTileY; y < visibleArea.endTileY; y++) {
            for (let x = visibleArea.startTileX; x < visibleArea.endTileX; x++) {
                if (y >= 0 && y < this.game.currentMap.height && 
                    x >= 0 && x < this.game.currentMap.width) {
                    
                    const isVisible = visionSystem.isTileVisible(x, y);
                    const isExplored = visionSystem.isTileExplored(x, y);
                    
                    if (!isVisible) {
                        const screenPos = this.camera.worldToScreen(x, y);
                        this.ctx.fillStyle = isExplored ? 'rgba(0, 0, 0, 0.5)' : '#000000';
                        this.ctx.fillRect(
                            screenPos.x,
                            screenPos.y,
                            this.camera.tileSize,
                            this.camera.tileSize
                        );
                    }
                }
            }
        }
    }

    // Отрисовка путей врагов
    renderEnemyPaths() {
        this.game.enemySystem.enemies.forEach(enemy => {
            if (!enemy.path || enemy.path.length === 0) return;

            this.ctx.beginPath();
            this.ctx.strokeStyle = enemy.isChasing ? '#ff0000' : '#00ff00';
            this.ctx.lineWidth = 2;

            // Начинаем с текущей позиции врага
            const startPos = this.camera.worldToScreen(enemy.x, enemy.y);
            this.ctx.moveTo(startPos.x + this.camera.tileSize / 2, startPos.y + this.camera.tileSize / 2);

            // Рисуем путь к следующим точкам
            enemy.path.forEach(point => {
                const pos = this.camera.worldToScreen(point.x, point.y);
                this.ctx.lineTo(pos.x + this.camera.tileSize / 2, pos.y + this.camera.tileSize / 2);
            });

            this.ctx.stroke();

            // Если враг преследует игрока, рисуем последнюю известную позицию
            if (enemy.isChasing && enemy.lastKnownPlayerX !== null && enemy.lastKnownPlayerY !== null) {
                const lastPos = this.camera.worldToScreen(
                    enemy.lastKnownPlayerX,
                    enemy.lastKnownPlayerY
                );
                
                this.ctx.beginPath();
                this.ctx.strokeStyle = '#ff0000';
                this.ctx.lineWidth = 2;
                
                // Рисуем X
                const size = this.camera.tileSize / 4;
                this.ctx.moveTo(lastPos.x + this.camera.tileSize / 2 - size, lastPos.y + this.camera.tileSize / 2 - size);
                this.ctx.lineTo(lastPos.x + this.camera.tileSize / 2 + size, lastPos.y + this.camera.tileSize / 2 + size);
                this.ctx.moveTo(lastPos.x + this.camera.tileSize / 2 + size, lastPos.y + this.camera.tileSize / 2 - size);
                this.ctx.lineTo(lastPos.x + this.camera.tileSize / 2 - size, lastPos.y + this.camera.tileSize / 2 + size);
                
                this.ctx.stroke();
            }
        });
    }

    // Отрисовка поля зрения врагов
    renderEnemyVision(visibleArea) {
        // Создаем временный canvas для отрисовки видимых областей
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.game.canvas.width;
        tempCanvas.height = this.game.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        this.game.enemySystem.enemies.forEach(enemy => {
            // Сначала отрисовываем зону патрулирования
            this.renderPatrolArea(enemy, visibleArea, tempCtx);
            // Затем отрисовываем видимую область
            this.renderVisionFromPoint(enemy, enemy.x, enemy.y, visibleArea, tempCtx);
        });

        // Накладываем временный canvas на основной с нужной прозрачностью
        this.ctx.globalAlpha = 0.2;
        this.ctx.drawImage(tempCanvas, 0, 0);
        this.ctx.globalAlpha = 1.0;
    }

    renderVisionFromPoint(enemy, fromX, fromY, visibleArea, ctx) {
        const radius = enemy.viewDistance;
        
        // Проходим по всем точкам в квадрате вокруг точки обзора
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const x = fromX + dx;
                const y = fromY + dy;
                
                // Проверяем, что точка в пределах видимой области и карты
                if (x >= visibleArea.startTileX && x < visibleArea.endTileX &&
                    y >= visibleArea.startTileY && y < visibleArea.endTileY &&
                    x >= 0 && x < this.game.currentMap.width &&
                    y >= 0 && y < this.game.currentMap.height) {
                    
                    // Используем манхэттенское расстояние вместо евклидова
                    const distance = Math.abs(dx) + Math.abs(dy);
                    if (distance <= radius) {
                        // Проверяем линию видимости
                        if (visionSystem.hasLineOfSight(fromX, fromY, x, y, this.game.currentMap.layout)) {
                            const screenPos = this.camera.worldToScreen(x, y);
                            ctx.fillStyle = enemy.isChasing ? '#FF0000' : '#FFFF00';
                            ctx.fillRect(
                                screenPos.x,
                                screenPos.y,
                                this.camera.tileSize,
                                this.camera.tileSize
                            );
                        }
                    }
                }
            }
        }
    }

    renderPatrolArea(enemy, visibleArea, ctx) {
        const radius = enemy.patrolRadius;
        
        // Проходим по всем точкам в квадрате вокруг точки спавна
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const x = enemy.spawnX + dx;
                const y = enemy.spawnY + dy;
                
                // Проверяем, что точка в пределах видимой области и карты
                if (x >= visibleArea.startTileX && x < visibleArea.endTileX &&
                    y >= visibleArea.startTileY && y < visibleArea.endTileY &&
                    x >= 0 && x < this.game.currentMap.width &&
                    y >= 0 && y < this.game.currentMap.height) {
                    
                    // Проверяем расстояние до точки спавна
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance <= radius) {
                        const screenPos = this.camera.worldToScreen(x, y);
                        ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
                        ctx.fillRect(
                            screenPos.x,
                            screenPos.y,
                            this.camera.tileSize,
                            this.camera.tileSize
                        );
                    }
                }
            }
        }
    }

    // Метод для проверки точности попадания
    checkAimAccuracy() {
        if (!this.game.isCombatMode) return 0;
        
        // Определяем границы зоны точности (35-65% от всей шкалы)
        const accuracyZoneStart = 0.35;
        const accuracyZoneEnd = 0.65;
        
        // Если указатель находится в зоне точности
        if (this.aimIndicatorPosition >= accuracyZoneStart && this.aimIndicatorPosition <= accuracyZoneEnd) {
            // Вычисляем точность в процентах (0-100)
            const zoneCenter = (accuracyZoneEnd + accuracyZoneStart) / 2;
            const maxDistance = (accuracyZoneEnd - accuracyZoneStart) / 2;
            const distance = Math.abs(this.aimIndicatorPosition - zoneCenter);
            const accuracy = 100 * (1 - distance / maxDistance);
            return accuracy;
        }
        return 0; // Промах
    }
} 