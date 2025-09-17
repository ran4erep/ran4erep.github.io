import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameInput } from '../hooks/useGameInput';
import GameBoard from './GameBoard';
import PlayerComponent from './Player';
import EnemyComponent from './Enemy';
import StatusBar from './StatusBar';
import LogPanel from './LogPanel';
import DebugMenu from './DebugMenu';
import { TileType, Visibility, EnemyState } from '../types';
import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, PLAYER_INITIAL_HEALTH, PLAYER_ATTACK_POWER, PLAYER_VISION_RADIUS, ENEMY_VISION_RADIUS, ENEMY_PATROL_RADIUS } from '../constants';
import { computeFov } from '../utils/fov';
import { findPath } from '../utils/pathfinding';
import { hasLineOfSight } from '../utils/los';
const MAX_LOG_MESSAGES = 100;
const moveDeltas = {
    'UP': { dx: 0, dy: -1 },
    'DOWN': { dx: 0, dy: 1 },
    'LEFT': { dx: -1, dy: 0 },
    'RIGHT': { dx: 1, dy: 0 },
    'UP_LEFT': { dx: -1, dy: -1 },
    'UP_RIGHT': { dx: 1, dy: -1 },
    'DOWN_LEFT': { dx: -1, dy: 1 },
    'DOWN_RIGHT': { dx: 1, dy: 1 },
};
const Game = ({ onGameOver, dungeonData }) => {
    const { map, playerStart, enemiesStart } = dungeonData;
    const [player, setPlayer] = useState({ pos: playerStart, health: PLAYER_INITIAL_HEALTH });
    const [enemies, setEnemies] = useState(enemiesStart);
    const [log, setLog] = useState(['Добро пожаловать! Используйте стрелки/WASD для движения и QEZX для диагоналей.']);
    const [visibilityMap, setVisibilityMap] = useState(() => Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(Visibility.HIDDEN)));
    const [showDebugMenu, setShowDebugMenu] = useState(false);
    const [debugOptions, setDebugOptions] = useState({
        godMode: false,
        revealMap: false,
        showEnemyVision: false,
        showEnemyPaths: false,
        showEnemyStates: false,
    });
    const [enemyVisionTiles, setEnemyVisionTiles] = useState(new Set());
    const [turnCount, setTurnCount] = useState(1);
    const [touchStart, setTouchStart] = useState(null);
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    const gameAction = useGameInput();
    const gameAreaRef = useRef(null);
    const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
    useEffect(() => {
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        setIsTouchDevice(hasTouch);
    }, []);
    const handleDebugOptionChange = useCallback((option, value) => {
        setDebugOptions(prev => ({ ...prev, [option]: value }));
    }, []);
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Delete') {
                e.preventDefault();
                setShowDebugMenu(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    const addLogMessage = useCallback((message) => {
        setLog(prevLog => {
            const newLog = [...prevLog, message];
            if (newLog.length > MAX_LOG_MESSAGES) {
                return newLog.slice(newLog.length - MAX_LOG_MESSAGES);
            }
            return newLog;
        });
    }, []);
    const isWall = useCallback((pos) => {
        if (pos.y < 0 || pos.y >= MAP_HEIGHT || pos.x < 0 || pos.x >= MAP_WIDTH) {
            return true;
        }
        return map[pos.y][pos.x] === TileType.WALL;
    }, [map]);
    useEffect(() => {
        if (debugOptions.revealMap) {
            setVisibilityMap(Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(Visibility.VISIBLE)));
            return;
        }
        const isBlocking = (pos) => isWall(pos);
        const visibleTiles = computeFov(player.pos, PLAYER_VISION_RADIUS, isBlocking);
        setVisibilityMap(prevMap => {
            const newMap = prevMap.map(row => [...row]);
            // Mark previously visible tiles as explored
            for (let y = 0; y < MAP_HEIGHT; y++) {
                for (let x = 0; x < MAP_WIDTH; x++) {
                    if (newMap[y][x] === Visibility.VISIBLE) {
                        newMap[y][x] = Visibility.EXPLORED;
                    }
                }
            }
            // Mark new tiles as visible
            visibleTiles.forEach(key => {
                const [x, y] = key.split(',').map(Number);
                if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
                    newMap[y][x] = Visibility.VISIBLE;
                }
            });
            return newMap;
        });
    }, [player.pos, isWall, debugOptions.revealMap]);
    const findNewPatrolTarget = useCallback((center, radius, currentMap) => {
        for (let i = 0; i < 10; i++) { // Try 10 times to find a valid spot
            const angle = Math.random() * 2 * Math.PI;
            const r = Math.sqrt(Math.random()) * radius;
            const x = Math.round(center.x + r * Math.cos(angle));
            const y = Math.round(center.y + r * Math.sin(angle));
            if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT && currentMap[y][x] === TileType.FLOOR) {
                return { x, y };
            }
        }
        return null;
    }, []);
    const processTurn = useCallback((newPlayerPos, isWaitAction = false) => {
        if (!isWaitAction && isWall(newPlayerPos)) {
            return;
        }
        const turnLogMessages = [];
        let nextPlayerState = JSON.parse(JSON.stringify(player));
        let nextEnemiesState = JSON.parse(JSON.stringify(enemies));
        const playerActionTargetPos = isWaitAction ? player.pos : newPlayerPos;
        const targetEnemyIndex = nextEnemiesState.findIndex(e => e.pos.x === playerActionTargetPos.x && e.pos.y === playerActionTargetPos.y);
        if (targetEnemyIndex !== -1) {
            const targetEnemy = nextEnemiesState[targetEnemyIndex];
            targetEnemy.health -= PLAYER_ATTACK_POWER;
            turnLogMessages.push(`Вы нанесли врагу ${PLAYER_ATTACK_POWER} урона!`);
            if (targetEnemy.health <= 0) {
                turnLogMessages.push('Вы победили врага!');
                nextEnemiesState.splice(targetEnemyIndex, 1);
            }
        }
        else if (!isWaitAction) {
            nextPlayerState.pos = playerActionTargetPos;
        }
        else {
            turnLogMessages.push('Вы пропускаете ход.');
        }
        const playerPosForEnemies = targetEnemyIndex !== -1 ? player.pos : playerActionTargetPos;
        const allNewEnemyVision = new Set();
        const enemiesAfterProcessing = [];
        const isBlocking = (pos) => isWall(pos);
        nextEnemiesState.forEach((currentEnemy, index) => {
            let newEnemy = JSON.parse(JSON.stringify(currentEnemy));
            const enemyFov = computeFov(newEnemy.pos, ENEMY_VISION_RADIUS, isBlocking);
            if (debugOptions.showEnemyVision) {
                enemyFov.forEach(tileKey => allNewEnemyVision.add(tileKey));
            }
            const hasLosToPlayer = hasLineOfSight(newEnemy.pos, playerPosForEnemies, map);
            const isAdjacentForSight = Math.max(Math.abs(newEnemy.pos.x - playerPosForEnemies.x), Math.abs(newEnemy.pos.y - playerPosForEnemies.y)) === 1;
            const canSeePlayer = isAdjacentForSight || (enemyFov.has(`${playerPosForEnemies.x},${playerPosForEnemies.y}`) && hasLosToPlayer);
            if (canSeePlayer) {
                newEnemy.state = EnemyState.HUNTING;
                newEnemy.lastKnownPlayerPos = { ...playerPosForEnemies };
                newEnemy.path = findPath(newEnemy.pos, newEnemy.lastKnownPlayerPos, map);
                newEnemy.patrolTarget = null;
            }
            else {
                switch (newEnemy.state) {
                    case EnemyState.HUNTING:
                        newEnemy.state = EnemyState.SEARCHING;
                        if (newEnemy.lastKnownPlayerPos) {
                            newEnemy.path = findPath(newEnemy.pos, newEnemy.lastKnownPlayerPos, map);
                        }
                        break;
                    case EnemyState.SEARCHING:
                        const atDestination = newEnemy.lastKnownPlayerPos && newEnemy.pos.x === newEnemy.lastKnownPlayerPos.x && newEnemy.pos.y === newEnemy.lastKnownPlayerPos.y;
                        if (atDestination || !newEnemy.path || newEnemy.path.length === 0) {
                            newEnemy.state = EnemyState.PATROLLING;
                            newEnemy.patrolCenter = { ...newEnemy.pos };
                            newEnemy.lastKnownPlayerPos = null;
                            newEnemy.path = null;
                            newEnemy.patrolTarget = null;
                        }
                        break;
                    case EnemyState.PATROLLING:
                        const atPatrolTarget = newEnemy.patrolTarget && newEnemy.pos.x === newEnemy.patrolTarget.x && newEnemy.pos.y === newEnemy.patrolTarget.y;
                        if (atPatrolTarget || !newEnemy.path || newEnemy.path.length === 0) {
                            const newTarget = findNewPatrolTarget(newEnemy.patrolCenter, ENEMY_PATROL_RADIUS, map);
                            if (newTarget) {
                                newEnemy.patrolTarget = newTarget;
                                newEnemy.path = findPath(newEnemy.pos, newTarget, map);
                            }
                        }
                        break;
                }
            }
            const dx = playerPosForEnemies.x - newEnemy.pos.x;
            const dy = playerPosForEnemies.y - newEnemy.pos.y;
            const isAdjacentToPlayer = Math.max(Math.abs(dx), Math.abs(dy)) === 1;
            if (newEnemy.state === EnemyState.HUNTING && isAdjacentToPlayer) {
                if (debugOptions.godMode) {
                    turnLogMessages.push('Враг пытается вас атаковать, но вы неуязвимы!');
                }
                else {
                    nextPlayerState.health -= 10;
                    turnLogMessages.push('Враг нанес вам 10 урона!');
                }
            }
            else if (newEnemy.path && newEnemy.path.length > 0) {
                const nextStep = newEnemy.path[0];
                const isOccupiedByPlayer = nextStep.x === playerPosForEnemies.x && nextStep.y === playerPosForEnemies.y;
                const isOccupiedByMovedEnemy = enemiesAfterProcessing.some(e => e.pos.x === nextStep.x && e.pos.y === nextStep.y);
                const isOccupiedByUnmovedEnemy = nextEnemiesState.slice(index + 1).some(e => e.pos.x === nextStep.x && e.pos.y === nextStep.y);
                if (!isWall(nextStep) && !isOccupiedByPlayer && !isOccupiedByMovedEnemy && !isOccupiedByUnmovedEnemy) {
                    newEnemy.pos = nextStep;
                    newEnemy.path.shift();
                }
                else {
                    newEnemy.path = null;
                }
            }
            enemiesAfterProcessing.push(newEnemy);
        });
        const actionTaken = !isWaitAction && (player.pos.x !== newPlayerPos.x || player.pos.y !== newPlayerPos.y);
        if (turnLogMessages.length > 0) {
            addLogMessage(`$$SEP$$--- Ход ${turnCount} ---`);
            turnLogMessages.forEach(msg => addLogMessage(msg));
            setTurnCount(t => t + 1);
        }
        else if (actionTaken) {
            setTurnCount(t => t + 1);
        }
        setPlayer(nextPlayerState);
        setEnemies(enemiesAfterProcessing);
        if (debugOptions.showEnemyVision) {
            setEnemyVisionTiles(allNewEnemyVision);
        }
        else {
            setEnemyVisionTiles(new Set());
        }
    }, [player, enemies, isWall, addLogMessage, map, debugOptions, findNewPatrolTarget, turnCount]);
    useEffect(() => {
        if (gameAction) {
            if (gameAction === 'WAIT') {
                processTurn(player.pos, true);
            }
            else {
                const delta = moveDeltas[gameAction];
                if (delta) {
                    const newPos = {
                        x: player.pos.x + delta.dx,
                        y: player.pos.y + delta.dy
                    };
                    processTurn(newPos, false);
                }
            }
        }
    }, [gameAction, processTurn, player.pos]);
    useEffect(() => {
        if (player.health <= 0) {
            onGameOver();
        }
    }, [player.health, onGameOver]);
    useEffect(() => {
        const updateSize = () => {
            if (gameAreaRef.current) {
                setViewportSize({
                    width: gameAreaRef.current.clientWidth,
                    height: gameAreaRef.current.clientHeight,
                });
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);
    const handleTouchStart = useCallback((e) => {
        e.preventDefault(); // Prevents screen scrolling on touch
        const touch = e.touches[0];
        setTouchStart({ x: touch.clientX, y: touch.clientY });
    }, []);
    const handleTouchEnd = useCallback((e) => {
        if (!touchStart)
            return;
        const touchEnd = e.changedTouches[0];
        const deltaX = touchEnd.clientX - touchStart.x;
        const deltaY = touchEnd.clientY - touchStart.y;
        const swipeDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const MIN_SWIPE_DISTANCE = 40;
        if (swipeDistance < MIN_SWIPE_DISTANCE) {
            setTouchStart(null);
            return; // It's a tap, not a swipe
        }
        let dx = 0;
        let dy = 0;
        const angle = Math.atan2(deltaY, deltaX);
        const octant = Math.round(4 * angle / Math.PI + 8) % 8;
        switch (octant) {
            case 0:
                dx = 1;
                dy = 0;
                break; // Right
            case 1:
                dx = 1;
                dy = 1;
                break; // Down-Right
            case 2:
                dx = 0;
                dy = 1;
                break; // Down
            case 3:
                dx = -1;
                dy = 1;
                break; // Down-Left
            case 4:
                dx = -1;
                dy = 0;
                break; // Left
            case 5:
                dx = -1;
                dy = -1;
                break; // Up-Left
            case 6:
                dx = 0;
                dy = -1;
                break; // Up
            case 7:
                dx = 1;
                dy = -1;
                break; // Up-Right
        }
        if (dx !== 0 || dy !== 0) {
            const newPos = {
                x: player.pos.x + dx,
                y: player.pos.y + dy
            };
            processTurn(newPos, false);
        }
        setTouchStart(null);
    }, [touchStart, player.pos, processTurn]);
    const viewportX = viewportSize.width > 0 ? Math.max(0, Math.min(player.pos.x * TILE_SIZE - viewportSize.width / 2, MAP_WIDTH * TILE_SIZE - viewportSize.width)) : 0;
    const viewportY = viewportSize.height > 0 ? Math.max(0, Math.min(player.pos.y * TILE_SIZE - viewportSize.height / 2, MAP_HEIGHT * TILE_SIZE - viewportSize.height)) : 0;
    const viewport = {
        x: viewportX,
        y: viewportY,
        width: viewportSize.width,
        height: viewportSize.height,
    };
    const playerScreenX = player.pos.x * TILE_SIZE - viewport.x;
    // Move buttons to the left if the player is in the rightmost 25% of the viewport.
    const areButtonsOnLeft = viewport.width > 0 && playerScreenX > viewport.width * 0.75;
    return (_jsxs("div", { className: "flex flex-col h-full w-full bg-gray-900 text-white relative", children: [showDebugMenu && _jsx(DebugMenu, { options: debugOptions, onOptionChange: handleDebugOptionChange, onClose: () => setShowDebugMenu(false) }), _jsx(StatusBar, { playerHealth: player.health, maxHealth: PLAYER_INITIAL_HEALTH }), _jsxs("main", { className: "flex flex-row flex-grow overflow-hidden min-h-0", children: [_jsxs("div", { ref: gameAreaRef, className: "flex-grow h-full relative overflow-hidden bg-black touch-none", onTouchStart: handleTouchStart, onTouchEnd: handleTouchEnd, style: { touchAction: 'none' }, children: [isTouchDevice && (_jsxs("div", { className: `absolute bottom-4 z-30 flex flex-col gap-2 transition-all duration-300 ${areButtonsOnLeft ? 'left-4' : 'right-4'}`, children: [_jsx("button", { onClick: () => processTurn(player.pos, true), className: "px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-xs font-semibold transition-transform transform hover:scale-105 border-2 border-gray-500 shadow-lg", "aria-label": "\u041F\u0440\u043E\u043F\u0443\u0441\u0442\u0438\u0442\u044C \u0445\u043E\u0434", children: "\u041F\u0440\u043E\u043F\u0443\u0441\u043A" }), _jsx("button", { onClick: () => setShowDebugMenu(prev => !prev), className: "px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-xs font-semibold transition-transform transform hover:scale-105 border-2 border-blue-400 shadow-lg", "aria-label": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043C\u0435\u043D\u044E \u043E\u0442\u043B\u0430\u0434\u043A\u0438", children: "\u0414\u0435\u0431\u0430\u0433" })] })), _jsxs("div", { className: "absolute transition-transform duration-200 ease-in-out", style: { transform: `translate(${-Math.round(viewportX)}px, ${-Math.round(viewportY)}px)` }, children: [_jsx(GameBoard, { map: map, visibilityMap: visibilityMap, viewport: viewport, debugOptions: debugOptions, enemyVisionTiles: enemyVisionTiles, enemies: enemies }), _jsx(PlayerComponent, { pos: player.pos }), enemies.filter(enemy => {
                                        if (debugOptions.revealMap) {
                                            return true;
                                        }
                                        const isAdjacent = Math.max(Math.abs(player.pos.x - enemy.pos.x), Math.abs(player.pos.y - enemy.pos.y)) === 1;
                                        if (isAdjacent) {
                                            return true;
                                        }
                                        const tileVisibility = visibilityMap[enemy.pos.y]?.[enemy.pos.x];
                                        if (tileVisibility !== Visibility.VISIBLE) {
                                            return false;
                                        }
                                        return hasLineOfSight(player.pos, enemy.pos, map);
                                    }).map(enemy => (_jsx(EnemyComponent, { enemy: enemy, debugOptions: debugOptions }, enemy.id)))] })] }), _jsx("aside", { className: "w-96 flex-shrink-0 h-full bg-gray-800 border-l-2 border-gray-600", children: _jsx(LogPanel, { messages: log }) })] })] }));
};
export default Game;
