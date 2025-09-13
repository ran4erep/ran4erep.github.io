import React from 'react';
import { Position } from '../types';
import { TILE_SIZE } from '../constants';
import { PlayerIcon } from './icons/PlayerIcon';

interface PlayerProps {
  pos: Position;
}

const PlayerComponent: React.FC<PlayerProps> = ({ pos }) => {
  return (
    <div
      className="absolute transition-all duration-150 ease-in-out flex items-center justify-center"
      style={{
        left: pos.x * TILE_SIZE,
        top: pos.y * TILE_SIZE,
        width: TILE_SIZE,
        height: TILE_SIZE,
      }}
    >
      <PlayerIcon className="w-full h-full text-blue-400" />
    </div>
  );
};

export default PlayerComponent;
