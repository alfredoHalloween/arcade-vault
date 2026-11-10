import type { SkinId } from "./skins";
export type GameCanvasProps = {
  /**
   * Skin visual (opcional, por defecto `clasico`). Solo cambia el render; los juegos
   * que no están en `SKINNED_GAMES` la ignoran.
   */
  skin?: SkinId;
  /** true mientras el marco está en pausa o con el modal de fin abierto. */
  paused: boolean;
  onScore: (score: number) => void;
  /** Opcional: los juegos sin vidas (Tetris) no lo llaman y el HUD muestra "—". */
  onLives?: (lives: number) => void;
  onLevel: (level: number) => void;
  /** Se llama una sola vez cuando el jugador se queda sin vidas. */
  onGameOver: (finalScore: number) => void;
};
