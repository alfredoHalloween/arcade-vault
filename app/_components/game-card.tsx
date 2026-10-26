"use client";

import Link from "next/link";
import { useRef } from "react";
import type { Game } from "@/app/data/types";

const BUTTON_VARIANT: Partial<Record<Game["color"], string>> = {
  magenta: "btn-magenta",
  yellow: "btn-yellow",
};

export function GameCard({ game }: { game: Game }) {
  const tiltRef = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = tiltRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `translateY(-6px) rotateX(${-py * 6}deg) rotateY(${px * 8}deg)`;
  };

  const onLeave = () => {
    if (tiltRef.current) tiltRef.current.style.transform = "";
  };

  const href = `/juegos/${game.id}`;

  return (
    <div
      ref={tiltRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="group relative flex flex-col gap-3.5 border border-line bg-linear-to-b from-bg-2 to-bg-3 p-3.5 transition-[transform,box-shadow,border-color] duration-200 transform-3d will-change-transform before:pointer-events-none before:absolute before:-inset-px before:bg-[linear-gradient(135deg,transparent_60%,rgba(0,245,255,0.4))] before:opacity-0 before:transition-opacity before:duration-200 hover:border-cyan hover:shadow-[0_18px_40px_-10px_rgba(0,245,255,0.4),0_0_0_1px_rgba(0,245,255,0.3)] hover:before:opacity-50"
    >
      <div className="relative aspect-4/3 overflow-hidden border border-line-2">
        <div className={`absolute inset-0 ${game.cover}`} />
        <div className="absolute bottom-2 left-2 z-2 border border-line bg-black/60 px-1.5 py-1 font-pixel text-[8px] text-cyan">
          {game.cat}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="font-pixel text-[13px] tracking-[0.06em] text-ink">
          <Link href={href} className="after:absolute after:inset-0 after:content-['']">
            {game.title}
          </Link>
        </h3>
        <p className="min-h-9 text-xs text-ink-dim">{game.short}</p>
        <div className="mt-1 flex items-center justify-between gap-2.5">
          <div className="flex flex-col text-[10px] tracking-[0.08em] text-ink-faint uppercase">
            <span>MEJOR PUNTUACIÓN</span>
            <b className="font-pixel text-xs font-bold tracking-[0.06em] text-yellow [text-shadow:0_0_6px_rgba(245,255,0,0.6)]">
              {game.best.toLocaleString("es-ES")}
            </b>
          </div>
          <Link
            href={href}
            className={`btn relative z-10 ${BUTTON_VARIANT[game.color] ?? ""}`}
            aria-label={`Jugar ${game.title}`}
          >
            JUGAR
          </Link>
        </div>
      </div>
    </div>
  );
}
