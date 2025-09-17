import { TileType } from '../types';
/**
 * Checks for a clear line of sight between two points using a grid traversal algorithm.
 * Based on "A Fast Voxel Traversal Algorithm for Ray Tracing" by Amanatides and Woo.
 * This method is more accurate for grid-based worlds than Bresenham's, as it
 * correctly identifies all cells a ray passes through, preventing LOS through corners.
 * @param start The starting position.
 * @param end The ending position.
 * @param map The game map containing tile data.
 * @returns {boolean} True if there is a clear line of sight, false otherwise.
 */
export function hasLineOfSight(start, end, map) {
    // Start from the center of the tiles for more accurate raycasting
    let x0 = start.x + 0.5;
    let y0 = start.y + 0.5;
    const x1 = end.x + 0.5;
    const y1 = end.y + 0.5;
    let dx = x1 - x0;
    let dy = y1 - y0;
    if (dx === 0 && dy === 0) {
        return true;
    }
    // Current grid cell coordinates
    let currentX = start.x;
    let currentY = start.y;
    // Direction of movement (1, -1, or 0)
    const stepX = Math.sign(dx);
    const stepY = Math.sign(dy);
    // How far we have to move in X and Y to cross a grid cell boundary
    // This is the distance along the ray to the next vertical/horizontal grid line
    const tDeltaX = dx === 0 ? Infinity : Math.abs(1 / dx);
    const tDeltaY = dy === 0 ? Infinity : Math.abs(1 / dy);
    // How far along the ray we are to the *next* grid line crossing
    // Initial calculation
    let tMaxX;
    if (stepX > 0) {
        tMaxX = (1.0 - (x0 - Math.floor(x0))) * tDeltaX;
    }
    else {
        tMaxX = (x0 - Math.floor(x0)) * tDeltaX;
    }
    let tMaxY;
    if (stepY > 0) {
        tMaxY = (1.0 - (y0 - Math.floor(y0))) * tDeltaY;
    }
    else {
        tMaxY = (y0 - Math.floor(y0)) * tDeltaY;
    }
    // Traverse the grid along the ray's path
    while (currentX !== end.x || currentY !== end.y) {
        // Step to the next cell in the direction of the smallest tMax
        if (tMaxX < tMaxY) {
            tMaxX += tDeltaX;
            currentX += stepX;
        }
        else {
            tMaxY += tDeltaY;
            currentY += stepY;
        }
        // Check the new cell for a wall, but not the very last one (the target)
        if (currentX !== end.x || currentY !== end.y) {
            if (map[currentY]?.[currentX] === TileType.WALL) {
                return false;
            }
        }
    }
    return true;
}
