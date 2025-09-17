import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { EnemyState } from '../types';
import { TILE_SIZE } from '../constants';
import { ENEMY_SPRITE_BASE64 } from '../assets/actors';
const stateMap = {
    [EnemyState.PATROLLING]: 'P',
    [EnemyState.HUNTING]: 'H',
    [EnemyState.SEARCHING]: 'S',
};
const EnemyComponent = ({ enemy, debugOptions }) => {
    return (_jsxs("div", { className: "absolute transition-all duration-150 ease-in-out z-20", style: {
            left: enemy.pos.x * TILE_SIZE,
            top: enemy.pos.y * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE,
        }, children: [_jsx("img", { src: ENEMY_SPRITE_BASE64, alt: "Enemy", className: "w-full h-full", style: { imageRendering: 'pixelated' } }), debugOptions.showEnemyStates && (_jsx("div", { className: "absolute -top-4 left-1/2 -translate-x-1/2 text-white text-xs font-bold", style: { textShadow: '1px 1px 2px black' }, children: stateMap[enemy.state] }))] }));
};
export default EnemyComponent;
