import { jsx as _jsx } from "react/jsx-runtime";
import React, { useEffect, useRef } from 'react';
import { TileType, Visibility } from '../types';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../constants';
import { WALL_TILES_BASE64, FLOOR_TILE_BASE64 } from '../assets/environment';
// Memoize image objects outside the component to ensure they are created only once.
const floorTileImage = new Image();
floorTileImage.src = FLOOR_TILE_BASE64;
const wallTileImages = WALL_TILES_BASE64.map(src => {
    const img = new Image();
    img.src = src;
    return img;
});
const GameBoard = ({ map, visibilityMap, viewport, debugOptions, enemies, enemyVisionTiles }) => {
    const canvasRef = useRef(null);
    // We need to redraw when images are loaded, use a state for that.
    const [imagesLoaded, setImagesLoaded] = React.useState(false);
    useEffect(() => {
        const images = [floorTileImage, ...wallTileImages];
        let loadedCount = 0;
        const totalImages = images.length;
        const handleLoad = () => {
            loadedCount++;
            if (loadedCount === totalImages) {
                setImagesLoaded(true);
            }
        };
        images.forEach(img => {
            if (img.complete) {
                handleLoad();
            }
            else {
                img.addEventListener('load', handleLoad, { once: true });
            }
        });
        return () => {
            images.forEach(img => img.removeEventListener('load', handleLoad));
        };
    }, []);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !imagesLoaded) {
            return;
        }
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        // Disable anti-aliasing for crisp pixel art
        ctx.imageSmoothingEnabled = false;
        // Fill the background, in case any tiles are not drawn
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Calculate the visible tile range based on the viewport
        const startX = Math.max(0, Math.floor(viewport.x / TILE_SIZE));
        const startY = Math.max(0, Math.floor(viewport.y / TILE_SIZE));
        const endX = Math.min(MAP_WIDTH, Math.ceil((viewport.x + viewport.width) / TILE_SIZE));
        const endY = Math.min(MAP_HEIGHT, Math.ceil((viewport.y + viewport.height) / TILE_SIZE));
        const isWall = (x, y) => {
            if (y < 0 || y >= MAP_HEIGHT || x < 0 || x >= MAP_WIDTH) {
                return true; // Treat borders as walls for seamless tiling
            }
            return map[y][x] === TileType.WALL;
        };
        // Draw the visible tiles
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                let visibility = visibilityMap[y]?.[x];
                if (debugOptions.revealMap)
                    visibility = Visibility.VISIBLE;
                if (visibility === undefined || visibility === Visibility.HIDDEN)
                    continue;
                if (map[y][x] === TileType.WALL) {
                    let index = 0;
                    // The bitmask is based on which neighbors are ALSO walls.
                    if (isWall(x, y - 1))
                        index |= 1; // North
                    if (isWall(x, y + 1))
                        index |= 2; // South
                    if (isWall(x + 1, y))
                        index |= 4; // East
                    if (isWall(x - 1, y))
                        index |= 8; // West
                    const tileImage = wallTileImages[index];
                    if (tileImage?.complete) {
                        ctx.drawImage(tileImage, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    }
                }
                else {
                    ctx.drawImage(floorTileImage, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
                // Draw visibility overlay
                if (visibility === Visibility.EXPLORED) {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
                // Draw debug overlays
                if (debugOptions.showEnemyVision && enemyVisionTiles.has(`${x},${y}`)) {
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }
        }
        // Draw debug paths on top of the tiles
        if (debugOptions.showEnemyPaths) {
            ctx.fillStyle = 'rgba(59, 130, 246, 0.4)'; // blue-500 with opacity
            for (const enemy of enemies) {
                if (enemy.path) {
                    for (const pos of enemy.path) {
                        if (pos.x >= startX && pos.x <= endX && pos.y >= startY && pos.y <= endY) {
                            ctx.beginPath();
                            ctx.arc(pos.x * TILE_SIZE + TILE_SIZE / 2, pos.y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 4, 0, 2 * Math.PI);
                            ctx.fill();
                        }
                    }
                }
            }
        }
    }, [map, visibilityMap, viewport, debugOptions, enemies, enemyVisionTiles, imagesLoaded]);
    return (_jsx("canvas", { ref: canvasRef, width: MAP_WIDTH * TILE_SIZE, height: MAP_HEIGHT * TILE_SIZE, className: "absolute top-0 left-0", style: { imageRendering: 'pixelated' } }));
};
export default React.memo(GameBoard);
