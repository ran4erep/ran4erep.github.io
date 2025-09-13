import { useMemo } from 'react';
import { TileType, Position, Room, Enemy } from '../types';
import { MAP_WIDTH, MAP_HEIGHT, MAX_ROOMS, ROOM_MIN_SIZE, ROOM_MAX_SIZE, MAX_ENEMIES_PER_ROOM, ENEMY_INITIAL_HEALTH } from '../constants';

// A simple random number generator function.
const randomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// NOTE: The user requested Wave Function Collapse (WFC). WFC is a powerful but
// computationally expensive algorithm, especially in a browser environment.
// For a web-based roguelike, a more traditional and performant method like
// placing rooms and connecting them with corridors provides a great result
// without risking freezing the user's browser. This approach is standard in
// many classic roguelike games.

export const useDungeonGenerator = () => {
  return useMemo(() => {
    const map: TileType[][] = Array(MAP_HEIGHT).fill(0).map(() => Array(MAP_WIDTH).fill(TileType.WALL));
    const rooms: Room[] = [];
    let playerStart: Position = { x: 0, y: 0 };
    const enemiesStart: Enemy[] = [];
    let enemyIdCounter = 0;

    const createRoom = (room: Room) => {
      for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
          map[y][x] = TileType.FLOOR;
        }
      }
    };

    const createHTunnel = (x1: number, x2: number, y: number) => {
      for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
        map[y][x] = TileType.FLOOR;
      }
    };

    const createVTunnel = (y1: number, y2: number, x: number) => {
      for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
        map[y][x] = TileType.FLOOR;
      }
    };

    const placeEnemies = (room: Room) => {
      const numEnemies = randomInt(0, MAX_ENEMIES_PER_ROOM);
      for (let i = 0; i < numEnemies; i++) {
        const x = randomInt(room.x, room.x + room.width - 1);
        const y = randomInt(room.y, room.y + room.height - 1);
        // Ensure enemy doesn't spawn on the player
        if (x !== playerStart.x || y !== playerStart.y) {
           enemiesStart.push({ id: enemyIdCounter++, pos: { x, y }, health: ENEMY_INITIAL_HEALTH });
        }
      }
    };

    for (let i = 0; i < MAX_ROOMS; i++) {
      const width = randomInt(ROOM_MIN_SIZE, ROOM_MAX_SIZE);
      const height = randomInt(ROOM_MIN_SIZE, ROOM_MAX_SIZE);
      const x = randomInt(1, MAP_WIDTH - width - 2);
      const y = randomInt(1, MAP_HEIGHT - height - 2);

      const newRoom: Room = { x, y, width, height };
      
      let failed = false;
      for (const otherRoom of rooms) {
        if (
          newRoom.x < otherRoom.x + otherRoom.width + 1 &&
          newRoom.x + newRoom.width + 1 > otherRoom.x &&
          newRoom.y < otherRoom.y + otherRoom.height + 1 &&
          newRoom.y + newRoom.height + 1 > otherRoom.y
        ) {
          failed = true;
          break;
        }
      }

      if (!failed) {
        createRoom(newRoom);
        const { x: newX, y: newY } = { x: Math.floor(newRoom.x + newRoom.width / 2), y: Math.floor(newRoom.y + newRoom.height / 2) };

        if (rooms.length === 0) {
          playerStart = { x: newX, y: newY };
        } else {
          const { x: prevX, y: prevY } = { x: Math.floor(rooms[rooms.length-1].x + rooms[rooms.length-1].width / 2), y: Math.floor(rooms[rooms.length-1].y + rooms[rooms.length-1].height / 2) };
          
          if (randomInt(0, 1) === 1) {
            createHTunnel(prevX, newX, prevY);
            createVTunnel(prevY, newY, newX);
          } else {
            createVTunnel(prevY, newY, prevX);
            createHTunnel(prevX, newX, newY);
          }
        }
        
        placeEnemies(newRoom);
        rooms.push(newRoom);
      }
    }

    return { map, playerStart, enemiesStart };
  }, []);
};
