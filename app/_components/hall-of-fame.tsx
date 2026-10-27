"use client";

import Link from "next/link";
import { useState } from "react";
import { GAMES } from "@/app/data/games";
import { seededScores } from "@/app/data/scores";
import { useSession } from "./session-provider";

const COLS =
  "grid grid-cols-[70px_1fr_1fr_140px] items-center gap-2.5 px-4.5 py-3 text-[13px] max-[720px]:grid-cols-[50px_1fr_90px_90px] max-[720px]:px-3 max-[720px]:py-2.5 max-[720px]:text-xs";

const TOP_TEXT = [
  "text-gold [text-shadow:0_0_6px_rgba(255,207,58,0.6)]",
  "text-silver",
  "text-bronze",
];

const pad = (n: number) => String(n).padStart(2, "0");
const fmt = (n: number) => n.toLocaleString("es-ES");

export function HallOfFame() {
  const { user } = useSession();
  const [tab, setTab] = useState(GAMES[0].id);

  const game = GAMES.find((g) => g.id === tab) ?? GAMES[0];
  const rows = seededScores(tab.length * 23 + 7, 12);
  const youRank = 8 + (tab.length % 4);
  const youScore = rows[5].score - 2400;
  const [first, second, third] = rows;

  return (
    <div className="fade-in mx-auto mt-8 mb-20 max-w-300 px-8 max-[720px]:px-4">
      <div className="mb-7 text-center">
        <h1 className="m-0 bg-linear-to-b from-yellow to-magenta bg-clip-text font-pixel text-[clamp(24px,4.5vw,44px)] tracking-[0.08em] text-transparent drop-shadow-[0_0_14px_rgba(245,255,0,0.4)]">
          SALÓN DE LA FAMA
        </h1>
        <p className="mt-3 font-pixel text-[10px] tracking-[0.1em] text-ink-dim">
          LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA
        </p>
      </div>

      <div className="mb-5.5 flex flex-wrap justify-center gap-1.5">
        {GAMES.map((g) => (
          <button
            key={g.id}
            type="button"
            aria-pressed={tab === g.id}
            onClick={() => setTab(g.id)}
            className={`cursor-pointer border px-3.5 py-3 font-pixel text-[9px] tracking-[0.12em] ${
              tab === g.id
                ? "border-magenta text-magenta shadow-[0_0_10px_rgba(255,0,110,0.35)]"
                : "border-line bg-bg-2 text-ink-dim hover:text-ink"
            }`}
          >
            {g.title}
          </button>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-[1fr_1.2fr_1fr] items-end gap-3.5 max-[720px]:grid-cols-1">
        <PodiumSlot rank="02" row={second} border="border-silver" color="text-silver" />
        <PodiumSlot rank="01" row={first} border="border-gold shadow-[0_0_22px_rgba(255,207,58,0.35)]" color="text-gold" champion />
        <PodiumSlot rank="03" row={third} border="border-bronze" color="text-bronze" />
      </div>

      <div className="border border-line bg-bg-2">
        <div className={`${COLS} border-b border-line font-pixel text-[10px] tracking-[0.16em] text-ink-faint`}>
          <div>RANGO</div>
          <div>JUGADOR</div>
          <div>PUNTUACIÓN</div>
          <div>FECHA</div>
        </div>
        {rows.map((r, i) => (
          <div
            key={`${tab}-${r.rank}`}
            className={`${COLS} animate-[rise_360ms_ease-out_forwards] border-b border-line-2 opacity-0`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className={`font-pixel text-[11px] ${TOP_TEXT[i] ?? "text-ink-dim"}`}>#{pad(r.rank)}</div>
            <div className="text-ink">{r.name}</div>
            <div
              className={`font-pixel text-xs ${TOP_TEXT[i] ?? "text-cyan [text-shadow:0_0_6px_rgba(0,245,255,0.4)]"}`}
            >
              {fmt(r.score)}
            </div>
            <div className="text-ink-faint">{r.date}</div>
          </div>
        ))}
        {user && (
          <>
            <div className="border-b border-line-2 bg-[rgba(245,255,0,0.04)] px-4.5 py-2 font-pixel text-[9px] tracking-[0.16em] text-yellow">
              ▸ TU MEJOR MARCA EN {game.title}
            </div>
            <div
              key={`you-${tab}`}
              className={`${COLS} animate-[rise_360ms_ease-out_forwards] border-b border-l-3 border-line-2 border-l-yellow bg-[rgba(245,255,0,0.05)] pl-3.75 opacity-0`}
              style={{ animationDelay: `${rows.length * 50 + 50}ms` }}
            >
              <div className="font-pixel text-[11px] text-yellow">#{pad(youRank)}</div>
              <div className="text-yellow">{user.name}</div>
              <div className="font-pixel text-xs text-yellow [text-shadow:0_0_6px_rgba(245,255,0,0.5)]">
                {fmt(youScore || 9999)}
              </div>
              <div className="text-ink-faint">11/05/2026</div>
            </div>
          </>
        )}
      </div>

      <div className="mt-8 text-center">
        <Link href="/biblioteca" className="btn btn-lg">
          VOLVER A LA BIBLIOTECA
        </Link>
      </div>
    </div>
  );
}

function PodiumSlot({
  rank,
  row,
  border,
  color,
  champion = false,
}: {
  rank: string;
  row: { name: string; score: number; date: string };
  border: string;
  color: string;
  champion?: boolean;
}) {
  return (
    <div className={`relative border bg-bg-2 px-3.5 pt-4.5 pb-4 text-center ${border}`}>
      {champion && <div className="font-pixel text-[9px] tracking-[0.18em] text-gold">CAMPEÓN</div>}
      <div
        className={`font-pixel [text-shadow:0_0_12px_currentColor] ${color} ${
          champion ? "mt-1 text-4xl" : "text-[28px]"
        }`}
      >
        {rank}
      </div>
      <div className="mt-2 font-pixel text-xs tracking-[0.06em]">{row.name}</div>
      <div
        className={`mt-2 font-pixel text-cyan [text-shadow:0_0_8px_rgba(0,245,255,0.5)] ${
          champion ? "text-xl" : "text-base"
        }`}
      >
        {fmt(row.score)}
      </div>
      <div className="mt-1.5 text-[11px] tracking-[0.12em] text-ink-faint">{row.date}</div>
    </div>
  );
}
