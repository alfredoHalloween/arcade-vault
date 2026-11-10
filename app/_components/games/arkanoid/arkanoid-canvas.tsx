"use client";
import { useEffect, useRef } from "react";
import { DEFAULT_SKIN } from "../skins";
import type { GameCanvasProps } from "../types";
import { createArkanoidGame } from "./engine";
export default function ArkanoidCanvas({
  skin = DEFAULT_SKIN,
  paused,
  onScore,
  onLives,
  onLevel,
  onGameOver,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<ReturnType<typeof createArkanoidGame> | null>(null);
  const pausedRef = useRef(paused);
  const skinRef = useRef(skin);
  const callbacksRef = useRef({ onScore, onLives, onLevel, onGameOver });
  useEffect(() => {
    pausedRef.current = paused;
    skinRef.current = skin;
    callbacksRef.current = { onScore, onLives, onLevel, onGameOver };
  });
  // El motor se crea una sola vez; reiniciar es remontar el componente (key).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Coordenadas lógicas 800×600; solo cambia el tamaño en píxeles del búfer.
    const resize = () => {
      const { width } = canvas.getBoundingClientRect();
      if (width === 0) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(width * 0.75 * dpr);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const game = createArkanoidGame(
      canvas,
      {
        onScore: (v) => callbacksRef.current.onScore(v),
        onLives: (v) => callbacksRef.current.onLives?.(v),
        onLevel: (v) => callbacksRef.current.onLevel(v),
        onGameOver: (v) => callbacksRef.current.onGameOver(v),
      },
      skinRef.current,
    );
    game.setPaused(pausedRef.current);
    gameRef.current = game;
    return () => {
      observer.disconnect();
      game.destroy();
      gameRef.current = null;
    };
  }, []);
  useEffect(() => {
    gameRef.current?.setPaused(paused);
  }, [paused]);
  // Cambiar de skin solo cambia el render: no remonta ni reinicia la partida.
  useEffect(() => {
    gameRef.current?.setSkin(skin);
  }, [skin]);
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 block h-full w-full"
      aria-label="Juego ARKANOID"
    />
  );
}
