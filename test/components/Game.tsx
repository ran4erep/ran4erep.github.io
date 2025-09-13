import React, { useState, useEffect, useCallback } from 'react';
import { useDungeonGenerator } from '../hooks/useDungeonGenerator';
import { useGameInput } from '../hooks/useGameInput';
import GameBoard from './GameBoard';
import PlayerComponent from './Player';
import EnemyComponent from './Enemy';
import { Player, Enemy, Position, TileType } from '../types';
import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, PLAYER_INITIAL_HEALTH, PLAYER_ATTACK_POWER } from '../constants';

interface GameProps {
  onGameOver: () => void;
}

const Game: React.FC<GameProps> = ({ onGameOver }) => {
  const { map, playerStart, enemiesStart } = useDungeonGenerator();
  const [player, setPlayer] = useState<Player>({ pos: playerStart, health: PLAYER_INITIAL_HEALTH });
  const [enemies, setEnemies] = useState<Enemy[]>(enemiesStart);
  const [message, setMessage] = useState('Use Arrow Keys or WASD to move.');
  
  const moveDirection = useGameInput();

  const isWall = useCallback((pos: Position) => {
    return map[pos.y][pos.x] === TileType.WALL;
  }, [map]);

  const processTurn = useCallback((newPlayerPos: Position) => {
    // Player action
    let playerAttacked = false;
    const targetEnemyIndex = enemies.findIndex(enemy => enemy.pos.x === newPlayerPos.x && enemy.pos.y === newPlayerPos.y);

    if (targetEnemyIndex !== -1) {
      const updatedEnemies = [...enemies];
      const targetEnemy = updatedEnemies[targetEnemyIndex];
      targetEnemy.health -= PLAYER_ATTACK_POWER;
      setMessage(`You hit an enemy for ${PLAYER_ATTACK_POWER} damage!`);
      playerAttacked = true;

      if (targetEnemy.health <= 0) {
        updatedEnemies.splice(targetEnemyIndex, 1);
        setMessage('You defeated an enemy!');
      }
      setEnemies(updatedEnemies);
    } else if (!isWall(newPlayerPos)) {
      setPlayer(p => ({ ...p, pos: newPlayerPos }));
    }

    if (isWall(newPlayerPos) && !playerAttacked) return;

    // Enemies action
    setEnemies(currentEnemies => {
        const nextPlayerPos = playerAttacked ? player.pos : newPlayerPos;
        const newEnemies = currentEnemies.map(enemy => {
            const dx = nextPlayerPos.x - enemy.pos.x;
            const dy = nextPlayerPos.y - enemy.pos.y;

            // Simple AI: move towards player if close, but don't move diagonally
            if (Math.abs(dx) + Math.abs(dy) < 10) {
                let newEnemyPos = { ...enemy.pos };
                if (Math.abs(dx) > Math.abs(dy)) {
                    newEnemyPos.x += Math.sign(dx);
                } else {
                    newEnemyPos.y += Math.sign(dy);
                }

                if (newEnemyPos.x === nextPlayerPos.x && newEnemyPos.y === nextPlayerPos.y) {
                    setPlayer(p => ({ ...p, health: p.health - 10 }));
                     setMessage('You were hit by an enemy!');
                    return enemy; // Don't move into player, just attack
                }

                const isOccupied = currentEnemies.some(e => e.id !== enemy.id && e.pos.x === newEnemyPos.x && e.pos.y === newEnemyPos.y);

                if (!isWall(newEnemyPos) && !isOccupied) {
                    return { ...enemy, pos: newEnemyPos };
                }
            }
            return enemy;
        });
        return newEnemies;
    });

  }, [enemies, player.pos, isWall, setMessage]);


  useEffect(() => {
    if (moveDirection) {
      const newPos = { ...player.pos };
      switch (moveDirection) {
        case 'ArrowUp':
        case 'w':
          newPos.y -= 1;
          break;
        case 'ArrowDown':
        case 's':
          newPos.y += 1;
          break;
        case 'ArrowLeft':
        case 'a':
          newPos.x -= 1;
          break;
        case 'ArrowRight':
        case 'd':
          newPos.x += 1;
          break;
      }
      processTurn(newPos);
    }
  }, [moveDirection, processTurn, player.pos]);

  useEffect(() => {
    if (player.health <= 0) {
      onGameOver();
    }
  }, [player.health, onGameOver]);

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const viewportX = Math.max(0, Math.min(player.pos.x * TILE_SIZE - viewportWidth / 2, MAP_WIDTH * TILE_SIZE - viewportWidth));
  const viewportY = Math.max(0, Math.min(player.pos.y * TILE_SIZE - viewportHeight / 2, MAP_HEIGHT * TILE_SIZE - viewportHeight));

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <div className="absolute transition-transform duration-200 ease-in-out" style={{ transform: `translate(${-viewportX}px, ${-viewportY}px)` }}>
        <GameBoard map={map} />
        <PlayerComponent pos={player.pos} />
        {enemies.map(enemy => (
          <EnemyComponent key={enemy.id} pos={enemy.pos} />
        ))}
      </div>
      <div className="absolute top-0 left-0 p-4 bg-black bg-opacity-50 rounded-br-lg text-white font-mono">
        <p>Health: {player.health} / {PLAYER_INITIAL_HEALTH}</p>
        <p>Enemies: {enemies.length}</p>
        <p className="mt-2 text-yellow-300">{message}</p>
      </div>
    </div>
  );
};

export default Game;
