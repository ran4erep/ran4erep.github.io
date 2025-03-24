class Node {
    constructor(x, y, g = 0, h = 0) {
        this.x = x;
        this.y = y;
        this.g = g; // Стоимость пути от старта до этой точки
        this.h = h; // Эвристическая оценка до цели (manhattan distance)
        this.f = g + h; // Полная стоимость
        this.parent = null; // Предыдущий узел в пути
    }
}

class AStar {
    constructor(game) {
        this.game = game;
    }

    // Manhattan distance heuristic
    heuristic(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }

    // Получение соседних узлов
    getNeighbors(node) {
        const neighbors = [];
        const directions = [
            {dx: 1, dy: 0}, {dx: -1, dy: 0}, {dx: 0, dy: 1}, {dx: 0, dy: -1},
            {dx: 1, dy: 1}, {dx: -1, dy: 1}, {dx: 1, dy: -1}, {dx: -1, dy: -1}
        ];

        for (const dir of directions) {
            const newX = node.x + dir.dx;
            const newY = node.y + dir.dy;

            // Проверяем, что точка в пределах карты и проходима
            if (newX >= 0 && newX < this.game.currentMap.width &&
                newY >= 0 && newY < this.game.currentMap.height &&
                this.game.canMoveTo(newX, newY)) {
                neighbors.push({x: newX, y: newY});
            }
        }

        return neighbors;
    }

    // Поиск пути от start до end
    findPath(startX, startY, endX, endY, maxIterations = 1000) {
        const openSet = new Set();
        const closedSet = new Set();
        
        const startNode = new Node(startX, startY);
        startNode.h = this.heuristic(startX, startY, endX, endY);
        openSet.add(startNode);

        let iterations = 0;

        while (openSet.size > 0 && iterations < maxIterations) {
            iterations++;

            // Находим узел с минимальной стоимостью f в открытом списке
            let current = null;
            let minF = Infinity;
            for (const node of openSet) {
                if (node.f < minF) {
                    minF = node.f;
                    current = node;
                }
            }

            // Если достигли цели
            if (current.x === endX && current.y === endY) {
                const path = [];
                let node = current;
                while (node) {
                    path.unshift({x: node.x, y: node.y});
                    node = node.parent;
                }
                return path;
            }

            // Перемещаем текущий узел из открытого в закрытый список
            openSet.delete(current);
            closedSet.add(current);

            // Проверяем соседей
            const neighbors = this.getNeighbors(current);
            for (const neighbor of neighbors) {
                // Создаем новый узел для соседа
                const newNode = new Node(
                    neighbor.x,
                    neighbor.y,
                    current.g + (
                        // Диагональное движение стоит дороже
                        neighbor.x !== current.x && neighbor.y !== current.y ? 1.4 : 1
                    )
                );
                newNode.h = this.heuristic(neighbor.x, neighbor.y, endX, endY);
                newNode.parent = current;

                // Пропускаем, если узел уже в закрытом списке
                if ([...closedSet].some(node => node.x === newNode.x && node.y === newNode.y)) {
                    continue;
                }

                // Проверяем, есть ли узел уже в открытом списке
                const existingNode = [...openSet].find(node => 
                    node.x === newNode.x && node.y === newNode.y
                );

                if (!existingNode) {
                    openSet.add(newNode);
                } else if (newNode.g < existingNode.g) {
                    // Если новый путь лучше, обновляем существующий узел
                    existingNode.g = newNode.g;
                    existingNode.f = existingNode.g + existingNode.h;
                    existingNode.parent = current;
                }
            }
        }

        // Если путь не найден, возвращаем null
        return null;
    }
}

class Enemy {
    constructor(x, y, type = 'zombie') {
        // Базовые параметры позиции
        this.x = x;
        this.y = y;
        this.visualX = x;
        this.visualY = y;
        this.spawnX = x;
        this.spawnY = y;
        
        // Тип врага и его характеристики
        this.type = type;
        switch(type) {
            case 'zombie':
                this.health = 100;
                this.patrolRadius = 5;
                this.viewDistance = 4;
                this.actionsPerTurn = -2; // Одно действие каждые 2 хода игрока
                this.memoryDuration = 5;
                break;
            case 'bat':
                this.health = 50;
                this.patrolRadius = 2;
                this.viewDistance = 2;
                this.actionsPerTurn = 2; // Два действия за ход игрока
                this.memoryDuration = 3;
                break;
            default:
                this.health = 75;
                this.patrolRadius = 3;
                this.viewDistance = 6;
                this.actionsPerTurn = 1;
                this.memoryDuration = 4;
        }

        // Состояние врага
        this.state = 'patrol';
        this.actionsLeft = 0;
        this.patrolTarget = null;
        
        // Память о игроке
        this.lastKnownPlayerX = null;
        this.lastKnownPlayerY = null;
        this.turnsWithoutPlayer = 0;

        // Путь для отладки и текущий путь
        this.path = [];
        this.currentPath = null;
        this.isChasing = false;

        // Счетчик для медленных врагов (с отрицательным actionsPerTurn)
        this.turnCounter = 0;

        this.lastStateChangeTime = 0;

        // Параметры анимации
        this.isMoving = false;
        this.moveStartTime = 0;
        this.moveDuration = 150; // 150ms на движение

        // Параметры эффекта урона
        this.damageEffectStart = 0;
        this.damageEffectDuration = 300; // 300ms для эффекта урона
        this.isShowingDamageEffect = false;
    }

    update(game) {
        // Проверяем видимость игрока и обновляем состояние независимо от возможности действий
        this.updateState(game);

        // Если нет очков действий, не делаем ничего
        while (this.actionsLeft > 0) {
            // Проверяем, можем ли атаковать
            if (this.isAdjacentToPlayer(game)) {
                // Если рядом с игроком - атакуем
                this.attackPlayer(game);
                this.actionsLeft--;
            } else {
                // Пытаемся выполнить движение в зависимости от состояния
                let moved = false;
                switch (this.state) {
                    case 'chase':
                        moved = this.chasePlayer(game);
                        break;
                    case 'investigate':
                        moved = this.investigateLastPosition(game);
                        break;
                    case 'patrol':
                        moved = this.patrol(game);
                        break;
                }

                if (moved) {
                    this.actionsLeft--;
                } else {
                    // Если не можем двигаться, заканчиваем ход
                    break;
                }
            }
        }
    }

    updateState(game) {
        // Проверяем только состояние погони
        if (this.state === 'chase') {
            // Если не видим игрока и он не в радиусе патруля
            if (!this.canSeePlayer(game) && 
                Math.sqrt(Math.pow(game.playerX - this.spawnX, 2) + Math.pow(game.playerY - this.spawnY, 2)) > this.patrolRadius) {
                
                this.turnsWithoutPlayer++;
                if (this.turnsWithoutPlayer > this.memoryDuration) {
                    this.lastStateChangeTime = game.lastMoveTime;
                    this.state = 'patrol';
                    this.lastKnownPlayerX = null;
                    this.lastKnownPlayerY = null;
                    this.isChasing = false;
                } else {
                    if (this.state !== 'investigate') {
                        this.lastStateChangeTime = game.lastMoveTime;
                        this.state = 'investigate';
                    }
                }
            }
        }
    }

    isAdjacentToPlayer(game) {
        return Math.abs(this.x - game.playerX) <= 1 && Math.abs(this.y - game.playerY) <= 1;
    }

    attackPlayer(game) {
        game.handleEnemyAttack(this);
    }

    chasePlayer(game) {
        const targetX = game.playerX;
        const targetY = game.playerY;
        
        // Если нет текущего пути или цель переместилась, ищем новый путь
        if (!this.currentPath || 
            (this.currentPath.length > 0 && 
             (this.currentPath[this.currentPath.length - 1].x !== targetX || 
              this.currentPath[this.currentPath.length - 1].y !== targetY))) {
            
            const pathfinder = new AStar(game);
            this.currentPath = pathfinder.findPath(this.x, this.y, targetX, targetY);
            
            // Если путь не найден, пробуем двигаться напрямую
            if (!this.currentPath || this.currentPath.length <= 1) {
                const dx = Math.sign(targetX - this.x);
                const dy = Math.sign(targetY - this.y);
                return this.tryMove(game, dx, dy);
            }
        }

        // Если есть путь, следуем по нему
        if (this.currentPath && this.currentPath.length > 1) {
            const nextStep = this.currentPath[1]; // 0 - текущая позиция
            const dx = nextStep.x - this.x;
            const dy = nextStep.y - this.y;
            
            if (this.tryMove(game, dx, dy)) {
                // Удаляем пройденный шаг
                this.currentPath.shift();
                return true;
            } else {
                // Если не можем сделать шаг, пересчитываем путь
                this.currentPath = null;
                return false;
            }
        }

        return false;
    }

    patrol(game) {
        // Проверяем расстояние до точки спавна
        const distanceToSpawn = Math.sqrt(
            Math.pow(this.x - this.spawnX, 2) + 
            Math.pow(this.y - this.spawnY, 2)
        );

        // Если ушли слишком далеко - возвращаемся к точке спавна
        if (distanceToSpawn > this.patrolRadius) {
            if (!this.currentPath) {
                const pathfinder = new AStar(game);
                this.currentPath = pathfinder.findPath(this.x, this.y, this.spawnX, this.spawnY);
                if (this.currentPath) {
                    this.path = this.currentPath.slice(1);
                }
            }
            
            if (this.currentPath && this.currentPath.length > 1) {
                const nextStep = this.currentPath[1];
                const dx = nextStep.x - this.x;
                const dy = nextStep.y - this.y;
                
                if (this.tryMove(game, dx, dy)) {
                    this.currentPath.shift();
                    this.path = this.currentPath.slice(1);
                    return true;
                } else {
                    this.currentPath = null;
                    this.path = [];
                }
            }
        }

        // Если нет цели, или достигли её, или не можем до неё добраться
        if (!this.patrolTarget || 
            (this.x === this.patrolTarget.x && this.y === this.patrolTarget.y) ||
            !game.canMoveTo(this.patrolTarget.x, this.patrolTarget.y)) {
            this.chooseNewPatrolTarget(game);
            this.currentPath = null;
            this.path = [];
        }

        if (this.patrolTarget) {
            if (!this.currentPath) {
                const pathfinder = new AStar(game);
                this.currentPath = pathfinder.findPath(
                    this.x, this.y,
                    this.patrolTarget.x, this.patrolTarget.y
                );
                if (this.currentPath) {
                    this.path = this.currentPath.slice(1);
                }
            }

            if (this.currentPath && this.currentPath.length > 1) {
                const nextStep = this.currentPath[1];
                const dx = nextStep.x - this.x;
                const dy = nextStep.y - this.y;
                
                if (this.tryMove(game, dx, dy)) {
                    this.currentPath.shift();
                    this.path = this.currentPath.slice(1);
                    return true;
                } else {
                    this.currentPath = null;
                    this.path = [];
                    this.chooseNewPatrolTarget(game);
                }
            }
        }

        // Если не можем найти путь, выбираем случайное направление
        // и устанавливаем его как временную цель
        const moved = this.moveInRandomDirection(game);
        if (moved) {
            // Создаем временный путь из одной точки в направлении движения
            this.path = [{x: this.x + (this.x - this.lastX), y: this.y + (this.y - this.lastY)}];
        }
        return moved;
    }

    moveInRandomDirection(game) {
        // Сохраняем текущую позицию перед движением
        this.lastX = this.x;
        this.lastY = this.y;
        
        // Пробуем все возможные направления в случайном порядке
        const directions = [
            {dx: 1, dy: 0},
            {dx: -1, dy: 0},
            {dx: 0, dy: 1},
            {dx: 0, dy: -1},
            {dx: 1, dy: 1},
            {dx: -1, dy: 1},
            {dx: 1, dy: -1},
            {dx: -1, dy: -1}
        ];
        
        // Перемешиваем массив направлений
        for (let i = directions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [directions[i], directions[j]] = [directions[j], directions[i]];
        }
        
        // Пробуем двигаться в случайном направлении
        for (const dir of directions) {
            if (this.tryMove(game, dir.dx, dir.dy)) {
                return true;
            }
        }
        
        return false;
    }

    tryMove(game, dx, dy) {
        const newX = this.x + dx;
        const newY = this.y + dy;

        if (this.canMoveTo(game, newX, newY)) {
            this.x = newX;
            this.y = newY;
            // Начинаем анимацию движения
            this.isMoving = true;
            this.moveStartTime = performance.now();

            // Проверяем видимость игрока после перемещения
            const distanceToPlayer = Math.sqrt(
                Math.pow(game.playerX - this.spawnX, 2) + 
                Math.pow(game.playerY - this.spawnY, 2)
            );

            // Если игрок в радиусе патруля или враг видит игрока
            if (distanceToPlayer <= this.patrolRadius || this.canSeePlayer(game)) {
                if (this.state !== 'chase') {
                    this.lastStateChangeTime = game.lastMoveTime;
                    this.state = 'chase';
                    this.isChasing = true;
                }
                this.lastKnownPlayerX = game.playerX;
                this.lastKnownPlayerY = game.playerY;
                this.turnsWithoutPlayer = 0;
            }

            return true;
        }

        return false;
    }

    canMoveTo(game, newX, newY) {
        // Проверяем границы карты и проходимость
        if (!game.canMoveTo(newX, newY)) {
            return false;
        }
        
        // Проверяем коллизию с игроком
        if (newX === game.playerX && newY === game.playerY) {
            return false;
        }
        
        // Проверяем коллизии с другими врагами
        return !game.enemySystem.isEnemyAt(newX, newY, this);
    }

    chooseNewPatrolTarget(game) {
        const maxAttempts = 10;
        let bestTarget = null;
        let bestDistance = 0;

        // Пробуем несколько случайных точек и выбираем лучшую
        for (let attempts = 0; attempts < maxAttempts; attempts++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.patrolRadius;
            const tx = Math.round(this.spawnX + Math.cos(angle) * distance);
            const ty = Math.round(this.spawnY + Math.sin(angle) * distance);

            // Проверяем, что точка в пределах карты и достижима
            if (tx >= 0 && tx < game.currentMap.width &&
                ty >= 0 && ty < game.currentMap.height &&
                game.canMoveTo(tx, ty)) {
                
                // Вычисляем расстояние от текущей позиции до точки
                const targetDistance = Math.sqrt(
                    Math.pow(tx - this.x, 2) + 
                    Math.pow(ty - this.y, 2)
                );

                // Выбираем точку, которая дальше от текущей позиции
                if (!bestTarget || targetDistance > bestDistance) {
                    bestTarget = { x: tx, y: ty };
                    bestDistance = targetDistance;
                }
            }
        }

        // Если нашли подходящую точку, используем её
        if (bestTarget) {
            this.patrolTarget = bestTarget;
        } else {
            // Если не нашли, пробуем использовать ближайшую проходимую точку
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const tx = this.x + dx;
                    const ty = this.y + dy;
                    if (tx >= 0 && tx < game.currentMap.width &&
                        ty >= 0 && ty < game.currentMap.height &&
                        game.canMoveTo(tx, ty)) {
                        this.patrolTarget = { x: tx, y: ty };
                        return;
                    }
                }
            }
            // Если совсем ничего не нашли, остаёмся на месте
            this.patrolTarget = { x: this.x, y: this.y };
        }
    }

    canSeePlayer(game) {
        // Проверяем расстояние до игрока
        const dx = game.playerX - this.x;
        const dy = game.playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Проверяем, что игрок находится в круге видимости
        if (distance > this.viewDistance) {
            return false;
        }

        // Проверяем все точки вокруг врага для определения видимости за углами
        const checkPoints = [];
        
        // Добавляем точки по бокам от врага
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue; // Пропускаем центральную точку
                
                const checkX = this.x + i;
                const checkY = this.y + j;
                
                // Проверяем, что точка в пределах карты
                if (checkX >= 0 && checkX < game.currentMap.width &&
                    checkY >= 0 && checkY < game.currentMap.height) {
                    
                    const symbol = game.currentMap.layout[checkY][checkX];
                    const object = game.currentMap.objects[symbol];
                    
                    // Если точка проходима или это открытая дверь, добавляем её для проверки
                    if (!object || object.type !== 'wall') {
                        if (object?.type === 'door') {
                            const door = game.doors.find(d => d.x === checkX && d.y === checkY);
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
        
        // Добавляем текущую позицию врага
        checkPoints.push({x: this.x, y: this.y});
        
        // Проверяем видимость из каждой точки
        for (const point of checkPoints) {
            if (visionSystem.hasLineOfSight(
                point.x, point.y,
                game.playerX, game.playerY,
                game.currentMap.layout
            )) {
                // Если из какой-то точки видно игрока, враг его видит
                return true;
            }
        }
        
        return false;
    }

    resetMoves() {
        if (this.actionsPerTurn > 0) {
            // Для быстрых врагов - столько действий, сколько указано
            this.actionsLeft = this.actionsPerTurn;
        } else if (this.actionsPerTurn === 0) {
            // Для врагов без очков действий
            this.actionsLeft = 0;
        } else {
            // Для медленных врагов (отрицательные значения)
            this.turnCounter++;
            if (this.turnCounter >= Math.abs(this.actionsPerTurn)) {
                this.actionsLeft = 1;
                this.turnCounter = 0;
            } else {
                this.actionsLeft = 0;
            }
        }
    }

    getGlyphName() {
        return this.type === 'bat' ? 'bat' : this.type === 'slime' ? 'slime' : 'zombie';
    }

    investigateLastPosition(game) {
        if (this.lastKnownPlayerX === null || this.lastKnownPlayerY === null) {
            return false;
        }

        // Если достигли последней известной позиции, делаем её новой точкой патруля
        if (this.x === this.lastKnownPlayerX && this.y === this.lastKnownPlayerY) {
            this.state = 'patrol';
            // Обновляем точку спавна на текущую позицию
            this.spawnX = this.x;
            this.spawnY = this.y;
            this.lastKnownPlayerX = null;
            this.lastKnownPlayerY = null;
            this.isChasing = false;
            this.currentPath = null;
            // Сбрасываем цель патруля, чтобы выбрать новую от текущей позиции
            this.patrolTarget = null;
            return false;
        }

        // Если нет текущего пути, ищем путь к последней известной позиции
        if (!this.currentPath) {
            const pathfinder = new AStar(game);
            this.currentPath = pathfinder.findPath(
                this.x, this.y,
                this.lastKnownPlayerX, this.lastKnownPlayerY
            );
        }

        // Если есть путь, следуем по нему
        if (this.currentPath && this.currentPath.length > 1) {
            const nextStep = this.currentPath[1];
            const dx = nextStep.x - this.x;
            const dy = nextStep.y - this.y;
            
            if (this.tryMove(game, dx, dy)) {
                this.currentPath.shift();
                return true;
            } else {
                this.currentPath = null;
            }
        }

        // Если не можем найти путь, пробуем двигаться напрямую
        const dx = Math.sign(this.lastKnownPlayerX - this.x);
        const dy = Math.sign(this.lastKnownPlayerY - this.y);
        return this.tryMove(game, dx, dy);
    }

    updateAnimation() {
        if (!this.isMoving) return;

        const currentTime = performance.now();
        const elapsedTime = currentTime - this.moveStartTime;
        const progress = Math.min(elapsedTime / this.moveDuration, 1);

        if (progress >= 1) {
            // Анимация закончилась
            this.isMoving = false;
            this.visualX = this.x;
            this.visualY = this.y;
        } else {
            // Интерполируем позицию
            this.visualX = this.x - (this.x - this.visualX) * (1 - progress);
            this.visualY = this.y - (this.y - this.visualY) * (1 - progress);
        }
    }

    // Метод для активации эффекта урона
    showDamageEffect() {
        this.isShowingDamageEffect = true;
        this.damageEffectStart = performance.now();
    }

    // Метод для проверки, активен ли эффект урона
    isDamageEffectActive() {
        if (!this.isShowingDamageEffect) return false;
        const now = performance.now();
        const elapsed = now - this.damageEffectStart;
        if (elapsed >= this.damageEffectDuration) {
            this.isShowingDamageEffect = false;
            return false;
        }
        return true;
    }
}

class EnemySystem {
    constructor(game) {
        this.game = game;
        this.enemies = [];
    }

    addEnemy(x, y, type = 'zombie') {
        const enemy = new Enemy(x, y, type);
        this.enemies.push(enemy);
        return enemy;
    }

    isEnemyAt(x, y, excludeEnemy = null) {
        return this.enemies.some(enemy => 
            enemy !== excludeEnemy && 
            enemy.x === x && enemy.y === y
        );
    }

    // Метод для проверки видимости игрока всеми врагами
    checkPlayerVisibility() {
        this.enemies.forEach(enemy => {
            // Проверяем, находится ли игрок в радиусе патруля
            const distanceToPlayer = Math.sqrt(
                Math.pow(this.game.playerX - enemy.spawnX, 2) + 
                Math.pow(this.game.playerY - enemy.spawnY, 2)
            );

            // Если игрок в радиусе патруля или враг видит игрока
            if (distanceToPlayer <= enemy.patrolRadius || enemy.canSeePlayer(this.game)) {
                if (enemy.state !== 'chase') {
                    enemy.lastStateChangeTime = this.game.lastMoveTime;
                    enemy.state = 'chase';
                    enemy.isChasing = true;
                }
                enemy.lastKnownPlayerX = this.game.playerX;
                enemy.lastKnownPlayerY = this.game.playerY;
                enemy.turnsWithoutPlayer = 0;
            }

            // Обновляем состояние врага
            enemy.update(this.game);
        });
    }

    update() {
        this.enemies.forEach(enemy => {
            // Если враг не в процессе анимации движения
            if (!enemy.isMoving) {
                // Сбрасываем ходы для врага
                enemy.resetMoves();
                
                // Обновляем движение врага
                enemy.update(this.game);
            }
        });
    }

    removeEnemy(enemy) {
        const index = this.enemies.indexOf(enemy);
        if (index !== -1) {
            this.enemies.splice(index, 1);
        }
    }

    hasVisibleMovingEnemies() {
        return this.enemies.some(enemy => 
            enemy.isMoving && visionSystem.isTileVisible(enemy.x, enemy.y)
        );
    }
} 