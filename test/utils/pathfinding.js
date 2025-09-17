import { TileType } from '../types';
import { MAP_WIDTH, MAP_HEIGHT } from '../constants';
function diagonalDistance(posA, posB) {
    return Math.max(Math.abs(posA.x - posB.x), Math.abs(posA.y - posB.y));
}
function isWalkable(pos, map) {
    if (pos.x < 0 || pos.x >= MAP_WIDTH || pos.y < 0 || pos.y >= MAP_HEIGHT) {
        return false;
    }
    return map[pos.y][pos.x] === TileType.FLOOR;
}
export function findPath(start, end, map) {
    const startNode = { pos: start, g: 0, h: diagonalDistance(start, end), f: diagonalDistance(start, end), parent: null };
    const endNode = { pos: end, g: 0, h: 0, f: 0, parent: null };
    if (!isWalkable(end, map))
        return null;
    const openList = [startNode];
    const closedList = new Set();
    while (openList.length > 0) {
        // Find the node with the lowest F score in the open list
        let currentNode = openList[0];
        let currentIndex = 0;
        for (let i = 1; i < openList.length; i++) {
            if (openList[i].f < currentNode.f) {
                currentNode = openList[i];
                currentIndex = i;
            }
        }
        // Move current node from open to closed list
        openList.splice(currentIndex, 1);
        closedList.add(`${currentNode.pos.x},${currentNode.pos.y}`);
        // Found the path
        if (currentNode.pos.x === endNode.pos.x && currentNode.pos.y === endNode.pos.y) {
            const path = [];
            let current = currentNode;
            while (current && current.parent) {
                path.push(current.pos);
                current = current.parent;
            }
            return path.reverse();
        }
        // Get neighbors (cardinal and diagonal)
        const neighbors = [];
        const { x, y } = currentNode.pos;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0)
                    continue;
                const neighborPos = { x: x + dx, y: y + dy };
                if (isWalkable(neighborPos, map)) {
                    // Check for corner cutting for diagonal moves
                    if (dx !== 0 && dy !== 0) { // It's a diagonal move
                        if (!isWalkable({ x: x + dx, y: y }, map) || !isWalkable({ x: x, y: y + dy }, map)) {
                            continue; // Blocked corner
                        }
                    }
                    neighbors.push(neighborPos);
                }
            }
        }
        for (const neighborPos of neighbors) {
            const neighborKey = `${neighborPos.x},${neighborPos.y}`;
            if (closedList.has(neighborKey)) {
                continue;
            }
            const gScore = currentNode.g + 1; // All moves cost 1
            const hScore = diagonalDistance(neighborPos, end);
            const fScore = gScore + hScore;
            let neighborNode = openList.find(node => node.pos.x === neighborPos.x && node.pos.y === neighborPos.y);
            if (!neighborNode) {
                neighborNode = { pos: neighborPos, g: gScore, h: hScore, f: fScore, parent: currentNode };
                openList.push(neighborNode);
            }
            else if (gScore < neighborNode.g) {
                neighborNode.parent = currentNode;
                neighborNode.g = gScore;
                neighborNode.f = fScore;
            }
        }
    }
    // No path found
    return null;
}
