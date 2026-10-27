export type GameCanvasProps = {
  /** true mientras el marco está en pausa o con el modal de fin abierto. */
  paused: boolean;
  onScore: (score: number) => void;
  onLives: (lives: number) => void;
  onLevel: (level: number) => void;
  /** Se llama una sola vez cuando el jugador se queda sin vidas. */
  onGameOver: (finalScore: number) => void;
};
