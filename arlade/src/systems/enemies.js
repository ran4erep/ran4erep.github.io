// Определения типов врагов
const ENEMY_TYPES = {
    'zombie': {
        glyph: 'zombie',
        flying: false,
        z_index: 3,
        description: 'Зомби',
        health: 20,
        armorClass: 8, // Медленный и неуклюжий
        patrolRadius: 5,
        viewDistance: 4,
        actionsPerTurn: -2,
        memoryDuration: 5,
        attacks: [
            { name: 'укусил', damage: '1d6' },
            { name: 'ударил', damage: '1d4' }
        ]
    },
    'bat': {
        glyph: 'bat',
        flying: true,
        z_index: 3,
        description: 'Летучая мышь',
        health: 8,
        armorClass: 12, // Маленькая и юркая
        patrolRadius: 2,
        viewDistance: 2,
        actionsPerTurn: 2,
        memoryDuration: 3,
        attacks: [
            { name: 'укусила', damage: '1d3' },
            { name: 'поцарапала', damage: '1d2' }
        ]
    }
};

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
        this.x = x;
        this.y = y;
        this.visualX = x;
        this.visualY = y;
        this.spawnX = x;
        this.spawnY = y;
        this.patrolPointX = x;  // Точка патруля, изначально равна точке спавна
        this.patrolPointY = y;
        
        // Тип врага и его характеристики
        this.type = type;
        const enemyData = ENEMY_TYPES[type];
        
        // Копируем все характеристики из определения типа
        this.flying = enemyData.flying;
        this.health = enemyData.health;
        this.patrolRadius = enemyData.patrolRadius;
        this.viewDistance = enemyData.viewDistance;
        this.actionsPerTurn = enemyData.actionsPerTurn;
        this.memoryDuration = enemyData.memoryDuration;
        
        // Состояние врага
        this.state = 'patrol';
        this.movesLeft = 0;
        this.patrolTarget = null;
        
        // Память о игроке
        this.lastKnownPlayerX = null;
        this.lastKnownPlayerY = null;
        this.turnsWithoutPlayer = 0;
        
        // Для летающих врагов добавляем время парения
        if (this.flying) {
            this.hoverTime = Math.random() * Math.PI * 2; // Случайная начальная фаза
        }

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

        // Глиф состояния (alert/question/null)
        this.statusGlyph = null;
    }

    updateVision(game) {
        const canSee = this.canSeePlayer(game);
        
        if (canSee) {
            // Если видим игрока - запоминаем позицию и переходим в chase
            this.lastKnownPlayerX = game.playerX;
            this.lastKnownPlayerY = game.playerY;
            
            if (this.state !== 'chase') {
                this.statusGlyph = 'alert';
                this.state = 'chase';
                this.isChasing = true;
            }
        } 
        else if (this.state === 'chase') {
            // Если потеряли игрока из виду - переходим в investigate
            this.statusGlyph = 'question';
            this.state = 'investigate';
            this.isChasing = false;
        }
    }

    update(game) {
        // Всегда проверяем видимость игрока и обновляем состояние
        this.updateVision(game);
        
        // Если нет очков действий или враг в процессе анимации, не двигаемся
        if (this.movesLeft <= 0 || this.isMoving || this.isAttacking) return;

        // Делаем одно действие за раз, независимо от скорости врага
        this.makeOneMove(game);
        this.movesLeft--;
    }

    makeOneMove(game) {
        // Если можем атаковать игрока, делаем это
        if (game.combatSystem.canEnemyAttack(this)) {
            game.combatSystem.enemyAttack(this);
            return;
        }

        // Двигаемся в зависимости от состояния
        switch (this.state) {
            case 'chase':
                this.chasePlayer(game);
                break;
            case 'investigate':
                this.investigateLastPosition(game);
                break;
            case 'patrol':
                this.patrol(game);
                break;
        }
    }

    chasePlayer(game) {
        // Пытаемся найти путь к игроку
        const pathfinder = new AStar(game);
        const path = pathfinder.findPath(
            this.x, this.y,
            game.playerX, game.playerY
        );

        // Сохраняем путь для отрисовки в дебаге
        this.path = path ? path.slice(1) : [];

        // Если путь не найден или мы уже рядом - пробуем двигаться напрямую
        if (!path || path.length <= 1) {
            const dx = Math.sign(game.playerX - this.x);
            const dy = Math.sign(game.playerY - this.y);
            this.tryMove(game, dx, dy);
            return;
        }

        // Делаем шаг по пути
        const nextStep = path[1];
        const dx = nextStep.x - this.x;
        const dy = nextStep.y - this.y;
        
        this.tryMove(game, dx, dy);
    }

    patrol(game) {
        // Если нет цели или достигли её - выбираем новую
        if (!this.patrolTarget || 
            (this.x === this.patrolTarget.x && this.y === this.patrolTarget.y)) {
            this.chooseNewPatrolTarget(game);
        }

        // Если есть цель - идём к ней
        if (this.patrolTarget) {
            const pathfinder = new AStar(game);
            const path = pathfinder.findPath(
                this.x, this.y,
                this.patrolTarget.x, this.patrolTarget.y
            );

            // Сохраняем путь для отрисовки в дебаге
            this.path = path ? path.slice(1) : [];

            // Если не можем дойти до цели - выбираем новую
            if (!path || path.length <= 1) {
                this.chooseNewPatrolTarget(game);
                return;
            }

            // Делаем шаг по пути
            const nextStep = path[1];
            const dx = nextStep.x - this.x;
            const dy = nextStep.y - this.y;
            this.tryMove(game, dx, dy);
        }
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
        let validTargets = [];

        // Систематически проверяем все точки в квадрате вокруг точки патруля
        for (let dy = -this.patrolRadius; dy <= this.patrolRadius; dy++) {
            for (let dx = -this.patrolRadius; dx <= this.patrolRadius; dx++) {
                const tx = Math.round(this.patrolPointX + dx);
                const ty = Math.round(this.patrolPointY + dy);

                // Проверяем что точка:
                // 1. В пределах карты
                // 2. В пределах радиуса патрулирования (круг, а не квадрат)
                // 3. Достижима
                if (tx >= 0 && tx < game.currentMap.width &&
                    ty >= 0 && ty < game.currentMap.height &&
                    Math.sqrt(dx * dx + dy * dy) <= this.patrolRadius &&
                    game.canMoveTo(tx, ty)) {
                    
                    validTargets.push({ x: tx, y: ty });
                }
            }
        }

        // Если нашли подходящие точки - выбираем случайную из них
        if (validTargets.length > 0) {
            // Исключаем текущую позицию из возможных целей
            validTargets = validTargets.filter(target => 
                target.x !== this.x || target.y !== this.y
            );

            // Если после фильтрации остались точки - выбираем из них
            if (validTargets.length > 0) {
                this.patrolTarget = validTargets[Math.floor(Math.random() * validTargets.length)];
                return;
            }
        }

        // Если не нашли точек или остались только в текущей позиции - 
        // ищем ближайшую проходимую точку
        for (let radius = 1; radius <= this.patrolRadius; radius++) {
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    // Проверяем только точки на текущем радиусе
                    if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
                        const tx = this.patrolPointX + dx;
                        const ty = this.patrolPointY + dy;
                        if (tx >= 0 && tx < game.currentMap.width &&
                            ty >= 0 && ty < game.currentMap.height &&
                            game.canMoveTo(tx, ty)) {
                            this.patrolTarget = { x: tx, y: ty };
                            return;
                        }
                    }
                }
            }
        }

        // Если совсем ничего не нашли, остаёмся на месте
        this.patrolTarget = { x: this.patrolPointX, y: this.patrolPointY };
    }

    canSeePlayer(game) {
        // Проверяем расстояние до игрока
        const dx = game.playerX - this.x;
        const dy = game.playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Если игрок дальше viewDistance - сразу нет
        if (distance > this.viewDistance) {
            return false;
        }

        // Проверяем видимость из позиции врага
        return visionSystem.hasLineOfSight(this.x, this.y, game.playerX, game.playerY, game.currentMap.layout);
    }

    resetMoves() {
        if (this.actionsPerTurn > 0) {
            // Для быстрых врагов - столько действий, сколько указано
            this.movesLeft = this.actionsPerTurn;
        } else if (this.actionsPerTurn === 0) {
            // Для врагов без очков действий
            this.movesLeft = 0;
        } else {
            // Для медленных врагов (отрицательные значения)
            if (!this.turnCounter) this.turnCounter = 0;
            
            // Увеличиваем счётчик при любом ходе игрока
            this.turnCounter++;
            
            if (this.turnCounter >= Math.abs(this.actionsPerTurn)) {
                this.movesLeft = 1;
                this.turnCounter = 0;
            } else {
                this.movesLeft = 0;
            }
        }
    }

    getGlyphName() {
        return ENEMY_TYPES[this.type].glyph;
    }

    investigateLastPosition(game) {
        // Если нет последней известной позиции - возвращаемся к патрулю
        if (!this.lastKnownPlayerX || !this.lastKnownPlayerY) {
            this.patrolPointX = this.x;
            this.patrolPointY = this.y;
            this.state = 'patrol';
            this.isChasing = false;
            this.path = [];
            this.chooseNewPatrolTarget(game); // Сразу выбираем новую цель
            return;
        }

        // Пытаемся дойти до последней известной позиции игрока
        const pathfinder = new AStar(game);
        const path = pathfinder.findPath(
            this.x, this.y,
            this.lastKnownPlayerX, this.lastKnownPlayerY
        );

        // Сохраняем путь для отрисовки в дебаге
        this.path = path ? path.slice(1) : [];

        // Если не можем найти путь - делаем текущую позицию новой точкой патруля
        if (!path || path.length <= 1) {
            this.patrolPointX = this.x;
            this.patrolPointY = this.y;
            this.state = 'patrol';
            this.isChasing = false;
            this.lastKnownPlayerX = null;
            this.lastKnownPlayerY = null;
            this.path = [];
            this.chooseNewPatrolTarget(game); // Сразу выбираем новую цель
            return;
        }

        // Если достигли последней известной позиции игрока
        if (this.x === this.lastKnownPlayerX && this.y === this.lastKnownPlayerY) {
            // Делаем эту точку новой точкой патруля
            this.patrolPointX = this.lastKnownPlayerX;
            this.patrolPointY = this.lastKnownPlayerY;
            this.state = 'patrol';
            this.isChasing = false;
            this.lastKnownPlayerX = null;
            this.lastKnownPlayerY = null;
            this.path = [];
            this.chooseNewPatrolTarget(game); // Сразу выбираем новую цель
            return;
        }

        // Делаем шаг по пути
        const nextStep = path[1];
        const dx = nextStep.x - this.x;
        const dy = nextStep.y - this.y;
        
        this.tryMove(game, dx, dy);
    }
}

class EnemySystem {
    constructor(game) {
        this.game = game;
        this.enemies = [];
    }

    addEnemy(x, y, type = 'zombie') {
        // Получаем оригинальный объект врага из maps.json
        const symbol = this.game.currentMap.layout[y][x];
        const enemyObject = this.game.currentMap.objects[symbol];
        
        const enemy = new Enemy(x, y, type);
        // Сохраняем свойства из maps.json
        enemy.flying = enemyObject.flying || false;
        
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
            // Проверяем, видит ли враг игрока
            const canSee = enemy.canSeePlayer(this.game);
            
            if (canSee) {
                // Если видит - запоминаем позицию и переходим в chase
                enemy.lastKnownPlayerX = this.game.playerX;
                enemy.lastKnownPlayerY = this.game.playerY;
                
                if (enemy.state !== 'chase') {
                    enemy.statusGlyph = 'alert';
                    enemy.state = 'chase';
                    enemy.isChasing = true;
                }
            }
        });
    }

    update() {
        this.enemies.forEach(enemy => {
            // Обновляем состояние врага даже если он не может двигаться
            enemy.updateVision(this.game);
            
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
        return this.enemies.some(enemy => {
            const isVisible = visionSystem.isTileVisible(enemy.x, enemy.y);
            // Проверяем только реальное движение (атака или перемещение)
            // Игнорируем эффект полёта
            return isVisible && (enemy.isMoving || enemy.isAttacking);
        });
    }
} 