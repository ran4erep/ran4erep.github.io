class CollisionSystem {
    constructor(game) {
        this.game = game;
    }

    // Проверка возможности движения
    tryMove(dx, dy) {
        const newX = this.game.playerX + dx;
        const newY = this.game.playerY + dy;
        
        // Проверка столкновений с картой
        const symbol = this.game.currentMap.layout[newY]?.[newX];
        const object = this.game.currentMap.objects[symbol];
        
        // Проверяем, можно ли пройти
        if (object) {
            // Для дверей проверяем состояние открытия
            if (object.type === 'door' && !object.isOpened) {
                return false;
            }
            // Для остальных объектов - стандартная проверка
            if (object.blocks_movement && object.type !== 'door') {
                return false;
            }
        }

        // Если проверки пройдены, разрешаем движение
        return true;
    }

    // Проверка возможности взаимодействия с дверью
    canInteractWithDoor(x, y) {
        // Проверяем все соседние клетки вокруг позиции
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const checkX = x + dx;
                const checkY = y + dy;
                
                if (checkX >= 0 && checkX < this.game.currentMap.width && 
                    checkY >= 0 && checkY < this.game.currentMap.height) {
                    
                    const symbol = this.game.currentMap.layout[checkY][checkX];
                    const object = this.game.currentMap.objects[symbol];
                    
                    if (object && object.type === 'door') {
                        return { x: checkX, y: checkY };
                    }
                }
            }
        }
        return null;
    }
} 