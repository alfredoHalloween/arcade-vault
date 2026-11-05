import type { ComponentType } from "react";
import ArkanoidCanvas from "./arkanoid/arkanoid-canvas";
import AsteroidsCanvas from "./asteroids/asteroids-canvas";
import SnakeCanvas from "./snake/snake-canvas";
import TetrisCanvas from "./tetris/tetris-canvas";
import type { GameCanvasProps } from "./types";
/** Juegos con implementación real: `id` del catálogo → componente de canvas. */
export const PLAYABLE_GAMES: Record<string, ComponentType<GameCanvasProps>> = {
  rocas: AsteroidsCanvas,
  tetris: TetrisCanvas,
  arkanoid: ArkanoidCanvas,
  snake: SnakeCanvas,
};
