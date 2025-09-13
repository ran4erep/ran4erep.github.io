export enum TileType {
  FLOOR,
  WALL,
}

export interface Position {
  x: number;
  y: number;
}

export interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Enemy {
  id: number;
  pos: Position;
  health: number;
}

export interface Player {
  pos: Position;
  health: number;
}
