import { jsx as _jsx } from "react/jsx-runtime";
import { TILE_SIZE } from '../constants';
import { PLAYER_SPRITE_BASE64 } from '../assets/actors';
const PlayerComponent = ({ pos }) => {
    return (_jsx("div", { className: "absolute transition-all duration-150 ease-in-out", style: {
            left: pos.x * TILE_SIZE,
            top: pos.y * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE,
        }, children: _jsx("img", { src: PLAYER_SPRITE_BASE64, alt: "Player", className: "w-full h-full", style: { imageRendering: 'pixelated' } }) }));
};
export default PlayerComponent;
