import { MAP_WIDTH, MAP_HEIGHT } from '../constants';
// Recursive shadowcasting FOV algorithm
// Based on http://www.adammil.net/blog/v125_roguelike_vision_algorithms.html#shadowcasting
export function computeFov(origin, radius, isBlocking) {
    const visible = new Set();
    visible.add(`${origin.x},${origin.y}`);
    for (let i = 0; i < 8; i++) {
        scanOctant(1, octantTransforms[i], 1.0, 0.0);
    }
    function scanOctant(depth, transform, startSlope, endSlope) {
        if (startSlope < endSlope) {
            return;
        }
        if (depth > radius) {
            return;
        }
        let prevWasWall = null;
        const minJ = Math.round(depth * endSlope);
        const maxJ = Math.round(depth * startSlope);
        for (let j = maxJ; j >= minJ; j--) {
            const relativePos = { x: j, y: depth };
            const pos = transform.transform(origin, relativePos);
            if (pos.x < 0 || pos.x >= MAP_WIDTH || pos.y < 0 || pos.y >= MAP_HEIGHT) {
                continue;
            }
            const inRadius = Math.sqrt(j * j + depth * depth) <= radius;
            if (inRadius) {
                visible.add(`${pos.x},${pos.y}`);
            }
            const currentIsWall = isBlocking(pos);
            // If we're moving from floor to wall, we've found the end of a contiguous floor section.
            // We need to recursively scan the next row for this section.
            if (prevWasWall === false && currentIsWall === true) {
                const nextEndSlope = (j + 0.5) / (depth - 0.5);
                scanOctant(depth + 1, transform, startSlope, nextEndSlope);
            }
            // If we're moving from wall to floor, we've found the start of a new floor section.
            // We update the start slope for the rest of this row's scan.
            if (prevWasWall === true && currentIsWall === false) {
                startSlope = (j + 0.5) / (depth + 0.5);
            }
            prevWasWall = currentIsWall;
        }
        // If the last tile in the row was floor, we need to scan the next row for the last segment.
        if (prevWasWall === false) {
            scanOctant(depth + 1, transform, startSlope, endSlope);
        }
    }
    return visible;
}
const octantTransforms = [
    // N
    { transform: (origin, point) => ({ x: origin.x + point.x, y: origin.y - point.y }) },
    // NE
    { transform: (origin, point) => ({ x: origin.x + point.y, y: origin.y - point.x }) },
    // E
    { transform: (origin, point) => ({ x: origin.x + point.y, y: origin.y + point.x }) },
    // SE
    { transform: (origin, point) => ({ x: origin.x + point.x, y: origin.y + point.y }) },
    // S
    { transform: (origin, point) => ({ x: origin.x - point.x, y: origin.y + point.y }) },
    // SW
    { transform: (origin, point) => ({ x: origin.x - point.y, y: origin.y + point.x }) },
    // W
    { transform: (origin, point) => ({ x: origin.x - point.y, y: origin.y - point.x }) },
    // NW
    { transform: (origin, point) => ({ x: origin.x - point.x, y: origin.y - point.y }) },
];
