import { TileType, EnemyState } from '../types';
import { MAP_WIDTH, MAP_HEIGHT, MAX_ENEMIES, ENEMY_INITIAL_HEALTH, MIN_ROOMS, MAX_ROOMS, MIN_ROOM_SIZE, MAX_ROOM_SIZE, PLAYER_VISION_RADIUS } from '../constants';
// --- Helper Functions ---
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
// --- Main Generator Class ---
class DungeonGenerator {
    constructor() {
        this.rooms = [];
        this.WALL = TileType.WALL;
        this.FLOOR = TileType.FLOOR;
        this.map = Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(this.WALL));
    }
    _placeRooms() {
        for (let i = 0; i < 200 && this.rooms.length < randomInt(MIN_ROOMS, MAX_ROOMS); i++) {
            const width = randomInt(MIN_ROOM_SIZE, MAX_ROOM_SIZE);
            const height = randomInt(MIN_ROOM_SIZE, MAX_ROOM_SIZE);
            const x = randomInt(1, MAP_WIDTH - width - 2);
            const y = randomInt(1, MAP_HEIGHT - height - 2);
            const newRoom = { x, y, width, height };
            const overlaps = this.rooms.some(room => (newRoom.x < room.x + room.width + 1 &&
                newRoom.x + newRoom.width + 1 > room.x &&
                newRoom.y < room.y + room.height + 1 &&
                newRoom.y + newRoom.height + 1 > room.y));
            if (!overlaps) {
                this.rooms.push(newRoom);
            }
        }
    }
    _carveRoom(room) {
        for (let y = room.y; y < room.y + room.height; y++) {
            for (let x = room.x; x < room.x + room.width; x++) {
                this.map[y][x] = this.FLOOR;
            }
        }
    }
    _divideRoomRecursively(room) {
        if (room.width < 8 || room.height < 8)
            return; // Adjusted condition
        const splitHorizontally = room.height >= room.width && room.height >= 5;
        const splitVertically = room.width > room.height && room.width >= 5;
        if (splitHorizontally) {
            const splitY = randomInt(room.y + 2, room.y + room.height - 3);
            for (let x = room.x; x < room.x + room.width; x++)
                this.map[splitY][x] = this.WALL;
            const doorX = randomInt(room.x, room.x + room.width - 1);
            this.map[splitY][doorX] = this.FLOOR;
            const roomA = { x: room.x, y: room.y, width: room.width, height: splitY - room.y };
            const roomB = { x: room.x, y: splitY + 1, width: room.width, height: room.y + room.height - (splitY + 1) };
            this._divideRoomRecursively(roomA);
            this._divideRoomRecursively(roomB);
        }
        else if (splitVertically) {
            const splitX = randomInt(room.x + 2, room.x + room.width - 3);
            for (let y = room.y; y < room.y + room.height; y++)
                this.map[y][splitX] = this.WALL;
            const doorY = randomInt(room.y, room.y + room.height - 1);
            this.map[doorY][splitX] = this.FLOOR;
            const roomA = { x: room.x, y: room.y, width: splitX - room.x, height: room.height };
            const roomB = { x: splitX + 1, y: room.y, width: room.x + room.width - (splitX + 1), height: room.height };
            this._divideRoomRecursively(roomA);
            this._divideRoomRecursively(roomB);
        }
    }
    _runCellularAutomata() {
        // Initial noise
        for (let y = 1; y < MAP_HEIGHT - 1; y++) {
            for (let x = 1; x < MAP_WIDTH - 1; x++) {
                if (this.map[y][x] === this.WALL) {
                    this.map[y][x] = Math.random() < 0.45 ? this.FLOOR : this.WALL;
                }
            }
        }
        // Simulation steps
        for (let i = 0; i < 4; i++) {
            const newMap = this.map.map(row => [...row]);
            for (let y = 1; y < MAP_HEIGHT - 1; y++) {
                for (let x = 1; x < MAP_WIDTH - 1; x++) {
                    let neighbors = 0;
                    for (let ny = y - 1; ny <= y + 1; ny++) {
                        for (let nx = x - 1; nx <= x + 1; nx++) {
                            if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) {
                                neighbors++; // Count out-of-bounds as walls
                            }
                            else if (this.map[ny][nx] === this.WALL) {
                                neighbors++;
                            }
                        }
                    }
                    if (this.map[y][x] === this.WALL) {
                        if (neighbors < 4)
                            newMap[y][x] = this.FLOOR;
                    }
                    else {
                        if (neighbors > 5)
                            newMap[y][x] = this.WALL;
                    }
                }
            }
            this.map = newMap;
        }
    }
    _findRegions(tileType) {
        const regions = [];
        const visited = Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(false));
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (this.map[y][x] === tileType && !visited[y][x]) {
                    const newRegion = [];
                    const queue = [{ x, y }];
                    visited[y][x] = true;
                    while (queue.length > 0) {
                        const tile = queue.shift();
                        newRegion.push(tile);
                        const deltas = [{ dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }];
                        for (const { dx, dy } of deltas) {
                            const checkX = tile.x + dx;
                            const checkY = tile.y + dy;
                            if (checkX >= 0 && checkX < MAP_WIDTH && checkY >= 0 && checkY < MAP_HEIGHT &&
                                !visited[checkY][checkX] && this.map[checkY][checkX] === tileType) {
                                visited[checkY][checkX] = true;
                                queue.push({ x: checkX, y: checkY });
                            }
                        }
                    }
                    regions.push(newRegion);
                }
            }
        }
        return regions;
    }
    _connectRegions() {
        const regions = this._findRegions(this.FLOOR);
        if (regions.length <= 1)
            return;
        // Sort by size and remove small artifact regions
        const sortedRegions = regions.filter(r => r.length > 10).sort((a, b) => b.length - a.length);
        if (sortedRegions.length <= 1)
            return;
        const mainRegion = sortedRegions.shift();
        for (const region of sortedRegions) {
            let bestDist = Infinity;
            let bestPointA = { x: 0, y: 0 };
            let bestPointB = { x: 0, y: 0 };
            // Find closest points between the main region and the current one
            for (let j = 0; j < 100; j++) { // Check 100 random pairs
                const tileA = mainRegion[randomInt(0, mainRegion.length - 1)];
                const tileB = region[randomInt(0, region.length - 1)];
                const dist = Math.pow(tileA.x - tileB.x, 2) + Math.pow(tileA.y - tileB.y, 2);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestPointA = tileA;
                    bestPointB = tileB;
                }
            }
            this._carveTunnel(bestPointA, bestPointB);
            mainRegion.push(...region); // Merge the connected region into the main one
        }
    }
    _carveTunnel(start, end) {
        let x = start.x;
        let y = start.y;
        while (x !== end.x || y !== end.y) {
            if (x !== end.x && (y === end.y || Math.random() < 0.5)) {
                x += Math.sign(end.x - x);
            }
            else if (y !== end.y) {
                y += Math.sign(end.y - y);
            }
            if (this.map[y]?.[x] !== undefined)
                this.map[y][x] = this.FLOOR;
        }
    }
    _removeDiagonalPassages() {
        // Run this multiple times to catch all artifacts, including those created by a previous pass.
        for (let i = 0; i < 5; i++) {
            for (let y = 1; y < MAP_HEIGHT - 1; y++) {
                for (let x = 1; x < MAP_WIDTH - 1; x++) {
                    // Pattern: Top-left to bottom-right floor diagonal
                    // . W
                    // W .
                    if (this.map[y][x] === this.FLOOR && this.map[y + 1][x + 1] === this.FLOOR &&
                        this.map[y][x + 1] === this.WALL && this.map[y + 1][x] === this.WALL) {
                        // Randomly carve one of the walls to create a clear 1-tile wide path
                        if (Math.random() < 0.5) {
                            this.map[y][x + 1] = this.FLOOR;
                        }
                        else {
                            this.map[y + 1][x] = this.FLOOR;
                        }
                    }
                    // Pattern: Bottom-left to top-right floor diagonal
                    // W .
                    // . W
                    else if (this.map[y + 1][x] === this.FLOOR && this.map[y][x + 1] === this.FLOOR &&
                        this.map[y][x] === this.WALL && this.map[y + 1][x + 1] === this.WALL) {
                        // Randomly carve one of the walls to create a clear 1-tile wide path
                        if (Math.random() < 0.5) {
                            this.map[y][x] = this.FLOOR;
                        }
                        else {
                            this.map[y + 1][x + 1] = this.FLOOR;
                        }
                    }
                }
            }
        }
    }
    _placeEntities() {
        const floorRegions = this._findRegions(this.FLOOR);
        if (floorRegions.length === 0) {
            this.map[1][1] = this.FLOOR;
            return { playerStart: { x: 1, y: 1 }, enemiesStart: [] };
        }
        // Place entities only on the largest contiguous floor area
        const mainFloor = floorRegions.sort((a, b) => b.length - a.length)[0];
        if (mainFloor.length === 0) {
            this.map[1][1] = this.FLOOR;
            return { playerStart: { x: 1, y: 1 }, enemiesStart: [] };
        }
        const playerIndex = randomInt(0, mainFloor.length - 1);
        const playerStart = mainFloor.splice(playerIndex, 1)[0];
        const enemiesStart = [];
        let enemyIdCounter = 0;
        const validEnemyTiles = mainFloor.filter(pos => {
            const dist = Math.sqrt(Math.pow(pos.x - playerStart.x, 2) + Math.pow(pos.y - playerStart.y, 2));
            return dist > PLAYER_VISION_RADIUS + 2;
        });
        const numEnemies = Math.min(MAX_ENEMIES, validEnemyTiles.length);
        for (let i = 0; i < numEnemies; i++) {
            const enemyIndex = randomInt(0, validEnemyTiles.length - 1);
            const enemyPos = validEnemyTiles.splice(enemyIndex, 1)[0];
            enemiesStart.push({
                id: enemyIdCounter++,
                pos: enemyPos,
                health: ENEMY_INITIAL_HEALTH,
                state: EnemyState.PATROLLING,
                lastKnownPlayerPos: null, path: null,
                patrolCenter: { ...enemyPos }, patrolTarget: null,
            });
        }
        return { playerStart, enemiesStart };
    }
    async *generate() {
        yield { progress: 5, message: 'Планирование комнат...' };
        await tick();
        this._placeRooms();
        yield { progress: 15, message: 'Строительство комплексов...' };
        await tick();
        for (const room of this.rooms) {
            this._carveRoom(room);
            if (room.width >= 8 || room.height >= 8) {
                this._divideRoomRecursively(room);
            }
        }
        yield { progress: 30, message: 'Создание пещер...' };
        await tick();
        this._runCellularAutomata();
        yield { progress: 70, message: 'Соединение регионов...' };
        await tick();
        this._connectRegions();
        yield { progress: 90, message: 'Зачистка артефактов...' };
        await tick();
        this._removeDiagonalPassages();
        yield { progress: 95, message: 'Размещение обитателей...' };
        await tick();
        const { playerStart, enemiesStart } = this._placeEntities();
        const result = { map: this.map, playerStart, enemiesStart };
        yield { progress: 100, message: 'Готово!', result };
        return result;
    }
}
export async function* generateDungeon() {
    const generator = new DungeonGenerator();
    // FIX: Replaced `yield*` with a `for await...of` loop to resolve a TypeScript generator delegation error.
    for await (const progress of generator.generate()) {
        yield progress;
    }
}
