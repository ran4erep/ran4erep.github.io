import React from 'react';
import { Position } from '../types';
import { TILE_SIZE } from '../constants';
import { EnemyIcon } from './icons/EnemyIcon';

interface EnemyProps {
  pos: Position;
}

const EnemyComponent: React.FC<EnemyProps> = ({ pos }) => {
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
      <EnemyIcon className="w-full h-full text-red-500" />
    </div>
  );
};

export default EnemyComponent;
