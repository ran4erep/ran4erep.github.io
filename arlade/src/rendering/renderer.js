class Renderer {
    constructor(game, camera) {
        this.game = game;
        this.camera = camera;
        this.ctx = game.ctx;
        
        // Кэш для отрисованных глифов
        this.glyphCache = new Map();
        
        this.topDownCanvas = document.createElement('canvas');
        this.topDownCanvas.width = 1024;
        this.topDownCanvas.height = 1024;
        this.topDownCtx = this.topDownCanvas.getContext('2d', {
            alpha: true,
            willReadFrequently: true
        });
    }

    // Создание кэша для глифа
    createGlyphCache(glyphName, tileSize, isRed = false) {
        const canvas = document.createElement('canvas');
        canvas.width = tileSize;
        canvas.height = tileSize;
        const ctx = canvas.getContext('2d', { 
            alpha: true,
            willReadFrequently: true
        });
        
        // Очищаем canvas с прозрачностью
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Отключаем сглаживание
        ctx.imageSmoothingEnabled = false;
        
        // Устанавливаем режим смешивания для прозрачности
        ctx.globalCompositeOperation = 'source-over';
        
        // Если нужен красный глиф, временно заменяем цвета в системе глифов
        const glyph = glyphSystem.getGlyph(glyphName);
        if (isRed && glyph) {
            const originalColors = {...glyph.colors};
            // Заменяем все цвета на оттенки красного
            for (let key in glyph.colors) {
                if (glyph.colors[key] === '#000000') continue; // Не меняем чёрный цвет
                glyph.colors[key] = 'rgba(255, 0, 0, 0.2)'; // Красный с прозрачностью
            }
            // Рисуем красный глиф
            glyphSystem.drawGlyph(ctx, glyphName, 0, 0, tileSize);
            // Возвращаем оригинальные цвета
            glyph.colors = originalColors;
        } else {
            // Рисуем обычный глиф
            glyphSystem.drawGlyph(ctx, glyphName, 0, 0, tileSize);
        }
        
        return canvas;
    }

    // Получение глифа из кэша
    getGlyphFromCache(glyphName, tileSize, isRed = false) {
        const key = `${glyphName}_${tileSize}_${isRed ? 'red' : 'normal'}`;
        if (!this.glyphCache.has(key)) {
            this.glyphCache.set(key, this.createGlyphCache(glyphName, tileSize, isRed));
        }
        return this.glyphCache.get(key);
    }

    // Очистка кэша
    clearCache() {
        this.glyphCache.clear();
    }

    // Основной метод отрисовки
    render() {
        // Очищаем canvas
        this.ctx.clearRect(0, 0, this.game.canvas.width, this.game.canvas.height);
        
        // Получаем видимую область карты
        const visibleArea = this.game.camera.getVisibleArea();
        
        // Отрисовываем видимую область карты
        this.renderVisibleArea(visibleArea);
        
        // Отрисовываем рамку осмотра, если активен режим осмотра
        if (this.game.inputSystem.isLookMode) {
            this.renderLookFrame();
        }
        
        // Отрисовываем числа урона
        this.game.damageNumberSystem.render(this.ctx, this.camera);
        
        // Отрисовываем частицы
        this.game.particleSystem.render(this.ctx, this.camera);
        
        // Отрисовываем HUD поверх всего
        hud.render();
    }

    // Отрисовка видимой области
    renderVisibleArea(visibleArea) {
        // Обновляем видимость
        visionSystem.update(
            this.game.playerX,
            this.game.playerY,
            this.game.currentMap.layout,
            this.game.lookDirection
        );
        
        // Делаем тайл под игроком всегда видимым
        visionSystem.forceTileVisible(this.game.playerX, this.game.playerY);
        
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

        // Отрисовка трупов
        this.game.corpses.forEach(corpse => {
            // Проверяем видимость тайла
            if (visionSystem.visibilityMap[corpse.y][corpse.x] > 0 || this.game.debugMode?.noFog) {
                renderQueue.push({
                    x: corpse.x,
                    y: corpse.y,
                    glyph: corpse.glyph,
                    z_index: 4
                });
            }
        });
    }

    // Сбор объектов для отрисовки
    collectRenderQueue(visibleArea) {
        const renderQueue = [];

        // Добавляем все объекты в очередь
        for (let y = visibleArea.startTileY; y < visibleArea.endTileY; y++) {
            for (let x = visibleArea.startTileX; x < visibleArea.endTileX; x++) {
                if (x >= 0 && x < this.game.currentMap.width && 
                    y >= 0 && y < this.game.currentMap.height) {
                    
                    const symbol = this.game.currentMap.layout[y][x];
                    const object = this.game.currentMap.objects[symbol];
                    
                    if (object) {
                        // Добавляем пол под объектом
                        const floorType = this.game.determineFloorType(x, y);
                        const floorObject = Object.values(this.game.currentMap.objects)
                            .find(obj => obj.type === 'floor' && obj.glyph === floorType);
                        
                        if (floorObject) {
                            renderQueue.push({
                                x: x,
                                y: y,
                                type: 'floor',
                                glyph: floorObject.glyph,
                                z_index: 0  // Пол всегда снизу
                            });
                        }

                        // Проверяем, есть ли труп на этой клетке
                        const corpse = this.game.corpses.find(c => c.x === x && c.y === y);
                        if (corpse) {
                            // Проверяем видимость тайла
                            const visibility = visionSystem.visibilityMap[y][x];
                            if (this.game.debugMode?.noFog || visibility > 0) {
                                // Проверяем, есть ли на этой клетке дверь
                                const door = this.game.doors.find(d => d.x === x && d.y === y);
                                renderQueue.push({
                                    x: x,
                                    y: y,
                                    type: 'corpse',
                                    glyph: 'corpse',
                                    z_index: door && !door.isOpened ? 1 : 4  // Если есть закрытая дверь - труп под ней, иначе над полом
                                });
                            }
                        }

                        // Определяем z-index в зависимости от типа объекта
                        let objectZIndex;
                        switch (object.type) {
                            case 'wall':
                                objectZIndex = 2;  // Стены
                                break;
                            case 'door':
                                objectZIndex = 2;  // Двери на том же уровне что и стены
                                break;
                            case 'decoration':
                                objectZIndex = 3;  // Декорации (бочки и т.д.)
                                break;
                            default:
                                objectZIndex = 3;  // Все остальные объекты
                        }

                        // Специальная обработка для дверей
                        if (object.type === 'door') {
                            const door = this.game.doors.find(d => d.x === x && d.y === y);
                            if (door) {
                                renderQueue.push({
                                    x: x,
                                    y: y,
                                    type: 'door',
                                    glyph: door.isOpened ? 'openedDoor' : 'door',
                                    z_index: objectZIndex
                                });
                                continue;
                            }
                        }
                        
                        renderQueue.push({
                            x: x,
                            y: y,
                            type: object.type,
                            glyph: object.glyph,
                            z_index: objectZIndex
                        });
                    }
                }
            }
        }

        // Добавляем предметы на земле
        this.game.floorItems.forEach(item => {
            if (item.x >= visibleArea.startTileX && item.x < visibleArea.endTileX &&
                item.y >= visibleArea.startTileY && item.y < visibleArea.endTileY) {
                
                // Проверяем видимость тайла
                const visibility = visionSystem.visibilityMap[item.y][item.x];
                if (this.game.debugMode?.noFog || visibility > 0) {
                    renderQueue.push({
                        x: item.x,
                        y: item.y,
                        type: 'loot',
                        glyph: item.item.glyph || 'loot',
                        z_index: 3
                    });
                }
            }
        });

        // Добавляем врагов в очередь отрисовки
        for (const enemy of this.game.enemySystem.enemies) {
            if (enemy.x >= visibleArea.startTileX && enemy.x < visibleArea.endTileX &&
                enemy.y >= visibleArea.startTileY && enemy.y < visibleArea.endTileY) {
                
                // Если туман войны отключен или тайл видим - отрисовываем врага
                const visibility = visionSystem.visibilityMap[enemy.y][enemy.x];
                if (this.game.debugMode?.noFog || visibility === 2 || 
                    enemy.isAttacking || // Враг в процессе атаки
                    (this.game.attackTarget === enemy) || // Враг является целью атаки игрока
                    this.canEnemyAttack(enemy)) { // Враг находится рядом с игроком и может атаковать
                    renderQueue.push({
                        x: enemy.visualX,
                        y: enemy.visualY,
                        type: 'enemy',
                        glyph: enemy.getGlyphName(),
                        z_index: enemy.isAttacking ? 10 : 4 // Атакующий враг отображается поверх всего
                    });
                    
                    // Если у врага есть глиф состояния, добавляем его над врагом
                    if (enemy.statusGlyph) {
                        renderQueue.push({
                            x: enemy.visualX,
                            y: enemy.visualY - 0.8, // Размещаем глиф над врагом
                            type: 'status',
                            glyph: enemy.statusGlyph,
                            z_index: 11 // Отрисовываем над всем, даже над атакующими
                        });
                    }
                }
            }
        }

        // Добавляем игрока в очередь отрисовки
        const playerObject = Object.values(this.game.currentMap.objects)
            .find(obj => obj.type === 'player');
        
        if (playerObject && !this.game.isDead) {
            renderQueue.push({
                x: this.game.visualX,
                y: this.game.visualY,
                type: 'player',
                glyph: playerObject.glyph,
                z_index: this.game.isPlayerAttacking ? 10 : 4 // Атакующий игрок отображается поверх всего
            });
        }

        // Сортируем объекты по z-index
        return renderQueue.sort((a, b) => a.z_index - b.z_index);
    }

    // Отрисовка объектов
    renderObjects(renderQueue) {
        // Сохраняем текущие настройки контекста
        this.ctx.save();
        
        // Отключаем сглаживание
        this.ctx.imageSmoothingEnabled = false;
        
        // Устанавливаем режим смешивания для прозрачности
        this.ctx.globalCompositeOperation = 'source-over';
        
        // Время для расчета анимации атаки
        const currentTime = performance.now();
        
        for (const object of renderQueue) {
            const screenPos = this.camera.worldToScreen(object.x, object.y);
            
            // Проверяем, является ли объект целью атаки
            let isUnderAttack = false;
            let attackProgress = 0;
            let attackStartTime = 0;
            let attackDuration = 0; 

            // Если это враг и игрок атакует
            if (object.type === 'enemy' && this.game.isPlayerAttacking) {
                // Сравниваем координаты вместо объектов
                const enemy = this.game.enemySystem.enemies.find(e => 
                    Math.floor(e.x) === Math.floor(object.x) && 
                    Math.floor(e.y) === Math.floor(object.y)
                );
                isUnderAttack = Math.floor(object.x) === this.game.attackTarget.x && 
                               Math.floor(object.y) === this.game.attackTarget.y &&
                               enemy && enemy.wasHit; // Добавляем проверку на попадание
                if (isUnderAttack) {
                    attackStartTime = this.game.attackStartTime;
                    attackDuration = this.game.attackDuration;
                }
            }
            // Если это игрок и его атакует враг
            else if (object.type === 'player') {
                const attackingEnemy = this.game.enemySystem.enemies.find(e => 
                    e.isAttacking && this.canEnemyAttack(e) && 
                    e.pendingAttack && !e.pendingAttack.dodged // Добавляем проверку на попадание
                );
                isUnderAttack = !!attackingEnemy;
                if (isUnderAttack && attackingEnemy) {
                    attackStartTime = attackingEnemy.attackStartTime;
                    attackDuration = attackingEnemy.attackDuration;
                }
            }

            // Рассчитываем прогресс анимации атаки (от 0 до 1)
            if (isUnderAttack) {
                attackProgress = (currentTime - attackStartTime) / attackDuration;
                // Ограничиваем прогресс между 0 и 1
                attackProgress = Math.max(0, Math.min(1, attackProgress));
            }

            // Сначала рисуем обычный глиф
            const glyph = this.getGlyphFromCache(object.glyph, this.camera.tileSize);
            this.ctx.drawImage(glyph, 
                Math.floor(screenPos.x), 
                Math.floor(screenPos.y)
            );

            // Если объект атакуют, рисуем поверх красную маску с эффектом затухания
            if (isUnderAttack) {
                // Рассчитываем интенсивность эффекта с учетом затухания
                // Используем sin чтобы создать пульсацию в начале (интенсивность нарастает и затем затухает)
                const fadeIntensity = Math.sin(attackProgress * Math.PI) * 0.7;
                
                this.ctx.fillStyle = `rgba(255, 0, 0, ${fadeIntensity})`;
                this.ctx.globalCompositeOperation = 'multiply';
                this.ctx.fillRect(
                    Math.floor(screenPos.x),
                    Math.floor(screenPos.y),
                    this.camera.tileSize,
                    this.camera.tileSize
                );
                this.ctx.globalCompositeOperation = 'source-over';
            }
        }
        
        // Восстанавливаем настройки контекста
        this.ctx.restore();
    }

    // Отрисовка тумана войны
    renderFogOfWar(visibleArea) {
        for (let y = visibleArea.startTileY; y < visibleArea.endTileY; y++) {
            for (let x = visibleArea.startTileX; x < visibleArea.endTileX; x++) {
                if (x >= 0 && x < this.game.currentMap.width && 
                    y >= 0 && y < this.game.currentMap.height) {
                    
                    const visibility = visionSystem.visibilityMap[y][x];
                    if (visibility < 2) { // Если клетка не видна сейчас
                        const screenPos = this.camera.worldToScreen(x, y);
                        this.ctx.fillStyle = visibility === 0 ? 'rgba(0, 0, 0, 1)' : 'rgba(0, 0, 0, 0.5)';
                        this.ctx.fillRect(
                            Math.floor(screenPos.x), 
                            Math.floor(screenPos.y), 
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
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        this.ctx.lineWidth = 2;

        for (const enemy of this.game.enemySystem.enemies) {
            if (enemy.path && enemy.path.length > 0) {
                this.ctx.beginPath();
                
                // Начинаем с текущей позиции врага
                const startPos = this.camera.worldToScreen(enemy.x, enemy.y);
                this.ctx.moveTo(startPos.x + this.camera.tileSize / 2, startPos.y + this.camera.tileSize / 2);
                
                // Рисуем линии через все точки пути
                for (const point of enemy.path) {
                    const pos = this.camera.worldToScreen(point.x, point.y);
                    this.ctx.lineTo(pos.x + this.camera.tileSize / 2, pos.y + this.camera.tileSize / 2);
                }
                
                this.ctx.stroke();
            }
        }
        
        this.ctx.restore();
    }

    // Отрисовка поля зрения врагов
    renderEnemyVision(visibleArea) {
        this.ctx.save();
        
        for (const enemy of this.game.enemySystem.enemies) {
            if (enemy.x >= visibleArea.startTileX - enemy.viewDistance && 
                enemy.x < visibleArea.endTileX + enemy.viewDistance &&
                enemy.y >= visibleArea.startTileY - enemy.viewDistance && 
                enemy.y < visibleArea.endTileY + enemy.viewDistance) {
                
                // Собираем все точки, из которых враг может видеть
                const checkPoints = [];
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        if (i === 0 && j === 0) continue;
                        
                        const checkX = enemy.x + i;
                        const checkY = enemy.y + j;
                        
                        if (checkX >= 0 && checkX < this.game.currentMap.width &&
                            checkY >= 0 && checkY < this.game.currentMap.height) {
                            
                            const symbol = this.game.currentMap.layout[checkY][checkX];
                            const object = this.game.currentMap.objects[symbol];
                            
                            if (!object || object.type !== 'wall') {
                                if (object?.type === 'door') {
                                    const door = this.game.doors.find(d => d.x === checkX && d.y === checkY);
                                    if (door?.isOpened) {
                                        checkPoints.push({x: checkX, y: checkY});
                                    }
                                } else if (!object || !object.blocks_movement) {
                                    checkPoints.push({x: checkX, y: checkY});
                                }
                            }
                        }
                    }
                }
                // Добавляем позицию самого врага
                checkPoints.push({x: enemy.x, y: enemy.y});
                
                // Проходим по всем тайлам в радиусе видимости
                for (let dy = -enemy.viewDistance; dy <= enemy.viewDistance; dy++) {
                    for (let dx = -enemy.viewDistance; dx <= enemy.viewDistance; dx++) {
                        const x = enemy.x + dx;
                        const y = enemy.y + dy;
                        
                        if (x >= 0 && x < this.game.currentMap.width &&
                            y >= 0 && y < this.game.currentMap.height) {
                            
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            if (distance <= enemy.viewDistance) {
                                // Проверяем видимость из всех точек
                                let isVisible = false;
                                for (const point of checkPoints) {
                                    if (visionSystem.hasLineOfSight(point.x, point.y, x, y, this.game.currentMap.layout)) {
                                        isVisible = true;
                                        break;
                                    }
                                }
                                
                                if (isVisible) {
                                    const screenPos = this.camera.worldToScreen(x, y);
                                    // Цвет зоны видимости зависит от состояния врага
                                    let visionColor;
                                    switch (enemy.state) {
                                        case 'chase':
                                            visionColor = 'rgba(255, 0, 0, 0.2)'; // Красный для погони
                                            break;
                                        case 'investigate':
                                            visionColor = 'rgba(255, 165, 0, 0.2)'; // Оранжевый для исследования
                                            break;
                                        default:
                                            visionColor = 'rgba(255, 255, 0, 0.2)'; // Жёлтый для патруля
                                    }
                                    this.ctx.fillStyle = visionColor;
                                    this.ctx.fillRect(screenPos.x, screenPos.y, this.camera.tileSize, this.camera.tileSize);
                                }
                            }
                        }
                    }
                }
                
                // Отрисовываем состояние врага
                const enemyScreenPos = this.camera.worldToScreen(enemy.x, enemy.y);
                this.ctx.font = '12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.strokeStyle = 'black';
                this.ctx.lineWidth = 3;
                this.ctx.strokeText(enemy.state.toUpperCase(), 
                    enemyScreenPos.x + this.camera.tileSize/2, 
                    enemyScreenPos.y - 5
                );
                this.ctx.fillStyle = 'white';
                this.ctx.fillText(enemy.state.toUpperCase(), 
                    enemyScreenPos.x + this.camera.tileSize/2, 
                    enemyScreenPos.y - 5
                );

                // Отрисовываем точку патруля
                const patrolScreenPos = this.camera.worldToScreen(enemy.patrolPointX, enemy.patrolPointY);
                
                // Рисуем жёлтый круг в точке патруля
                this.ctx.beginPath();
                this.ctx.arc(
                    patrolScreenPos.x + this.camera.tileSize/2,
                    patrolScreenPos.y + this.camera.tileSize/2,
                    this.camera.tileSize/3,
                    0, Math.PI * 2
                );
                this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
                this.ctx.fill();
                this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
                this.ctx.stroke();

                // Рисуем круг радиуса патрулирования вокруг точки патруля
                this.ctx.beginPath();
                this.ctx.arc(
                    patrolScreenPos.x + this.camera.tileSize/2,
                    patrolScreenPos.y + this.camera.tileSize/2,
                    enemy.patrolRadius * this.camera.tileSize,
                    0, Math.PI * 2
                );
                this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.2)';
                this.ctx.stroke();

                // Отрисовываем последнюю известную позицию игрока
                if (enemy.lastKnownPlayerX !== null && enemy.lastKnownPlayerY !== null) {
                    const lastPosScreenPos = this.camera.worldToScreen(enemy.lastKnownPlayerX, enemy.lastKnownPlayerY);
                    
                    // Рисуем красный круг
                    this.ctx.beginPath();
                    this.ctx.arc(
                        lastPosScreenPos.x + this.camera.tileSize/2,
                        lastPosScreenPos.y + this.camera.tileSize/2,
                        this.camera.tileSize/3,
                        0, Math.PI * 2
                    );
                    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                    this.ctx.fill();
                    this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
                    this.ctx.stroke();
                }
            }
        }
        
        this.ctx.restore();
    }

    // Отрисовка рамки осмотра и описания
    renderLookFrame() {
        const { lookX, lookY } = this.game.inputSystem;
        
        // Получаем видимую область
        const visibleArea = this.camera.getVisibleArea();
        
        // Проверяем, находится ли точка осмотра в видимой области
        if (lookX < visibleArea.startTileX || lookX >= visibleArea.endTileX ||
            lookY < visibleArea.startTileY || lookY >= visibleArea.endTileY) {
            return; // Не отрисовываем рамку, если она вне видимой области
        }
        
        const screenPos = this.camera.worldToScreen(lookX, lookY);
        
        // Отрисовываем рамку
        const frameGlyph = this.getGlyphFromCache('frame', this.camera.tileSize);
        this.ctx.drawImage(frameGlyph, screenPos.x, screenPos.y);
        
        let description;
        
        // Проверяем видимость тайла
        const visibility = visionSystem.visibilityMap[lookY][lookX];
        if (visibility === 0) {
            description = 'Темнота';
        } else {
            // Проверяем, есть ли предметы на земле
            const itemsOnTile = this.game.floorItems.filter(item => item.x === lookX && item.y === lookY);
            if (itemsOnTile.length > 0) {
                if (itemsOnTile.length === 1) {
                    // Если один предмет, показываем его название
                    description = `Здесь лежит ${itemsOnTile[0].item.name}`;
                } else {
                    // Если несколько предметов, по-прежнему показываем общую надпись
                    description = 'Здесь лежат предметы';
                }
            } else {
                // Сначала проверяем, не игрок ли это
                if (lookX === this.game.playerX && lookY === this.game.playerY) {
                    const playerObject = Object.values(this.game.currentMap.objects)
                        .find(obj => obj.type === 'player');
                    description = playerObject ? playerObject.description : 'Вы';
                } else {
                    // Проверяем, есть ли труп на этой позиции
                    const corpse = this.game.corpses.find(c => c.x === lookX && c.y === lookY);
                    if (corpse) {
                        description = 'Груда костей';
                    } else {
                        // Затем проверяем, есть ли враг на этой позиции
                        const enemy = this.game.enemySystem.enemies.find(e => e.x === lookX && e.y === lookY);
                        
                        if (enemy) {
                            // Получаем описание врага из ENEMY_TYPES
                            description = ENEMY_TYPES[enemy.type].description;
                        } else {
                            // Если врага нет, проверяем объект на карте
                            const symbol = this.game.currentMap.layout[lookY][lookX];
                            const object = this.game.currentMap.objects[symbol];
                            
                            if (object) {
                                if (object.type === 'door') {
                                    const door = this.game.doors.find(d => d.x === lookX && d.y === lookY);
                                    description = object.description + (door && door.isOpened ? ' (открыта)' : ' (закрыта)');
                                } else {
                                    description = object.description;
                                }
                            } else {
                                description = 'Пустое место';
                            }
                        }
                    }
                }
            }
        }
        
        // Отрисовываем описание
        this.ctx.save();
        
        // Принудительно устанавливаем шрифт
        const fontSize = 10;
        this.ctx.font = `${fontSize}px "Press Start 2P"`;
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 2;
        this.ctx.textAlign = 'center';
        
        // Измеряем ширину текста и получаем метрики
        const textMetrics = this.ctx.measureText(description);
        const textWidth = textMetrics.width;
        const textHeight = fontSize; // Высота шрифта
        
        // Определяем позицию текста
        let textX = screenPos.x + this.camera.tileSize / 2;
        let textY = screenPos.y - fontSize;
        
        // Проверяем границы экрана
        const leftEdge = 0;
        const rightEdge = this.game.canvas.width;
        const topEdge = 0;
        
        // Если текст выходит за левый край
        if (textX - textWidth/2 < leftEdge) {
            this.ctx.textAlign = 'left';
            textX = leftEdge;
        }
        // Если текст выходит за правый край
        else if (textX + textWidth/2 > rightEdge) {
            this.ctx.textAlign = 'right';
            textX = rightEdge;
        }
        
        // Если рамка у верхнего края экрана
        if (screenPos.y <= topEdge + textHeight + 5) {
            textY = screenPos.y + this.camera.tileSize + textHeight;
        }
        
        // Отрисовываем обводку текста
        this.ctx.strokeText(description, textX, textY);
        // Отрисовываем сам текст
        this.ctx.fillText(description, textX, textY);
        
        this.ctx.restore();
    }

    // Проверяет, может ли враг атаковать игрока
    canEnemyAttack(enemy) {
        // Проверяем, находится ли игрок на соседней клетке (включая диагонали)
        const dx = Math.abs(enemy.x - this.game.playerX);
        const dy = Math.abs(enemy.y - this.game.playerY);
        return dx <= 1 && dy <= 1;
    }
} 