"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Game } from "@/app/data/types";
import { PLAYABLE_GAMES } from "./games/registry";
import { submitScore } from "@/app/juegos/[id]/jugar/actions";
import { useSession } from "./session-provider";
import { usePlayerName } from "./use-player-name";
const INITIAL_LIVES = 3;
const MAX_NAME = 16;
const POINTS_PER_LEVEL = 2500;
function HudStat({
  label,
  value,
  className = "text-cyan [text-shadow:0_0_6px_rgba(0,245,255,0.5)]",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[10px] tracking-[0.14em] text-ink-faint uppercase">
        {label}
      </div>
      <div className={`font-pixel text-base ${className}`}>{value}</div>
    </div>
  );
}
export function GamePlayer({ game }: { game: Game }) {
  const { user, saveScore } = useSession();
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { rememberedName, rememberName } = usePlayerName();
  // `null` until the player edits it, so the remembered or session name shows up once it has loaded.
  const [typedName, setTypedName] = useState<string | null>(null);
  // Real games report lives and level themselves; changing `runKey` remounts the canvas.
  const [gameLives, setGameLives] = useState(INITIAL_LIVES);
  const [gameLevel, setGameLevel] = useState(1);
  const [runKey, setRunKey] = useState(0);
  const GameCanvas = PLAYABLE_GAMES[game.id];
  const name = typedName ?? rememberedName ?? user?.name ?? "INVITADO";
  const lives = GameCanvas ? gameLives : INITIAL_LIVES;
  const level = GameCanvas
    ? gameLevel
    : 1 + Math.floor(score / POINTS_PER_LEVEL);
  useEffect(() => {
    if (GameCanvas || over || paused) return;
    const t = setInterval(
      () => setScore((s) => s + Math.floor(10 + Math.random() * 90)),
      220,
    );
    return () => clearInterval(t);
  }, [GameCanvas, over, paused]);
  const handleGameOver = (finalScore: number) => {
    setScore(finalScore);
    setOver(true);
  };
  const restart = () => {
    setScore(0);
    setGameLives(INITIAL_LIVES);
    setGameLevel(1);
    setRunKey((k) => k + 1);
    setPaused(false);
    setOver(false);
    setSaved(false);
    setSaving(false);
    setSaveError(null);
  };
  const save = async () => {
    const finalName = name.trim().toUpperCase();
    if (!GameCanvas) {
      saveScore({ game: game.id, score, name });
      if (finalName) rememberName(finalName);
      setSaved(true);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const result = await submitScore(game.id, finalName, score);
      if (result.ok) {
        rememberName(finalName);
        setSaved(true);
      } else {
        setSaveError(result.error ?? "No se pudo guardar la puntuación.");
      }
    } catch {
      setSaveError("No se pudo guardar la puntuación. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="fade-in mx-auto my-8 max-w-275 px-6 pb-16 max-[720px]:px-4 max-[720px]:pb-8">
      <div className="mb-4.5 flex flex-wrap items-center justify-between gap-4 border border-line bg-bg-2 px-4.5 py-3.5">
        <div className="flex flex-wrap gap-6">
          <HudStat label="Jugador" value={name} className="text-ink" />
          <HudStat label="Puntuación" value={score.toLocaleString("es-ES")} />
          <HudStat
            label="Vidas"
            value={"♥ ".repeat(lives).trim() || "—"}
            className="text-magenta [text-shadow:0_0_6px_rgba(255,0,110,0.5)]"
          />
          <HudStat
            label="Nivel"
            value={String(level).padStart(2, "0")}
            className="text-yellow [text-shadow:0_0_6px_rgba(245,255,0,0.5)]"
          />
        </div>
        <div className="flex gap-2.5">
          <button
            type="button"
            className="btn btn-yellow"
            onClick={(e) => {
              // Un botón enfocado se activaría con Espacio, la tecla de disparo.
              e.currentTarget.blur();
              setPaused((p) => !p);
            }}
          >
            {paused ? "REANUDAR" : "PAUSA"}
          </button>
          <button
            type="button"
            className="btn btn-magenta"
            onClick={() => setOver(true)}
          >
            FIN
          </button>
          <Link href={`/juegos/${game.id}`} className="btn btn-ghost">
            SALIR
          </Link>
        </div>
      </div>
      <div className={GameCanvas ? "crt mx-auto max-w-212" : "crt"}>
        <div className="crt-screen">
          {GameCanvas ? (
            <GameCanvas
              key={runKey}
              paused={paused || over}
              onScore={setScore}
              onLives={setGameLives}
              onLevel={setGameLevel}
              onGameOver={handleGameOver}
            />
          ) : (
            <div className="game-arena">
              <div className="grid-floor" />
              <div className="enemy e1" />
              <div className="enemy e2" />
              <div className="enemy e3" />
              <div className="player-ship" />
            </div>
          )}
          {paused && (
            <div className="absolute inset-0 z-5 flex items-center justify-center bg-black/60 text-center">
              <div>
                <div className="neon-yellow font-pixel text-[22px]">
                  EN PAUSA
                </div>
                <div className="mt-2.5 text-[11px] tracking-[0.16em] text-ink-dim">
                  PULSA REANUDAR PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="mt-3.5 flex items-center justify-between px-2 font-pixel text-[8px] tracking-[0.16em] text-ink-faint">
          <span className="crt-led inline-flex items-center gap-1.5">
            SEÑAL OK
          </span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>
      {over && (
        <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/70 p-5">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="game-over-title"
            className="relative w-[min(480px,96vw)] border border-magenta bg-bg-2 p-8 text-center shadow-[0_0_30px_rgba(255,0,110,0.4),inset_0_0_16px_rgba(255,0,110,0.18)] before:pointer-events-none before:absolute before:inset-1 before:border before:border-dashed before:border-[rgba(255,0,110,0.4)] before:content-['']"
          >
            <h2
              id="game-over-title"
              className="m-0 mb-4.5 font-pixel text-[22px] tracking-[0.12em] text-magenta [text-shadow:0_0_12px_rgba(255,0,110,0.7)]"
            >
              FIN DEL JUEGO
            </h2>
            <div className="text-[11px] tracking-[0.2em] text-ink-faint uppercase">
              PUNTUACIÓN FINAL
            </div>
            <div className="mt-4 mb-1.5 font-pixel text-4xl text-yellow [text-shadow:0_0_16px_rgba(245,255,0,0.6)]">
              {score.toLocaleString("es-ES")}
            </div>
            {!saved ? (
              <>
                <div className="mt-5.5 mb-3 flex gap-2">
                  <input
                    value={name}
                    onChange={(e) =>
                      setTypedName(
                        e.target.value.toUpperCase().slice(0, MAX_NAME),
                      )
                    }
                    maxLength={MAX_NAME}
                    placeholder="TUS INICIALES"
                    aria-label="Tus iniciales"
                    className="h-11 min-w-0 flex-1 border border-line bg-bg px-3 outline-0 focus:border-cyan focus:shadow-[0_0_10px_rgba(0,245,255,0.35)]"
                  />
                  <button
                    type="button"
                    className="btn btn-yellow"
                    onClick={save}
                    disabled={saving}
                  >
                    {saving ? "GUARDANDO…" : "GUARDAR PUNTUACIÓN"}
                  </button>
                </div>
                {saveError && (
                  <div
                    role="alert"
                    className="mb-3 text-[11px] tracking-[0.1em] text-magenta"
                  >
                    {saveError}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="mt-3.5 inline-block w-0 animate-[typewriter_1.6s_steps(22)_forwards,caret_0.8s_steps(1)_infinite] overflow-hidden border-r-2 border-green font-pixel text-[11px] whitespace-nowrap text-green [text-shadow:0_0_8px_var(--green)]">
                  ▸ PUNTUACIÓN GUARDADA_
                </div>
                {GameCanvas && (
                  <div className="mt-3">
                    <Link href="/salon" className="btn btn-ghost">
                      VER SALÓN DE LA FAMA
                    </Link>
                  </div>
                )}
              </>
            )}
            <div className="mt-4.5 flex flex-wrap justify-center gap-2.5">
              <button type="button" className="btn" onClick={restart}>
                JUGAR DE NUEVO
              </button>
              <Link href="/biblioteca" className="btn btn-magenta">
                VOLVER AL VAULT
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
