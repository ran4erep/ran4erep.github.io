import React from 'react';
import { TileType } from '../types';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../constants';

interface GameBoardProps {
  map: TileType[][];
}

const GameBoard: React.FC<GameBoardProps> = ({ map }) => {
  return (
    <div
      className="relative bg-black"
      style={{
        width: MAP_WIDTH * TILE_SIZE,
        height: MAP_HEIGHT * TILE_SIZE,
      }}
    >
      {map.map((row, y) =>
        row.map((tile, x) => {
          let tileClass = '';
          if (tile === TileType.FLOOR) {
            tileClass = 'bg-gray-700';
          } else if (tile === TileType.WALL) {
            tileClass = 'bg-gray-900 border-gray-800 border';
          }
          return (
            <div
              key={`${x}-${y}`}
              className={`absolute ${tileClass}`}
              style={{
                left: x * TILE_SIZE,
                top: y * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE,
              }}
            />
          );
        })
      )}
    </div>
  );
};

export default React.memo(GameBoard);
