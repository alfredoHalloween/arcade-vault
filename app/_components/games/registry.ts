import type { ComponentType } from "react";
import AsteroidsCanvas from "./asteroids/asteroids-canvas";
import TetrisCanvas from "./tetris/tetris-canvas";
import type { GameCanvasProps } from "./types";
/** Juegos con implementación real: `id` del catálogo → componente de canvas. */
export const PLAYABLE_GAMES: Record<string, ComponentType<GameCanvasProps>> = {
  rocas: AsteroidsCanvas,
  tetris: TetrisCanvas,
};
