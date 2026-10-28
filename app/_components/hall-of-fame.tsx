"use client";
import Link from "next/link";
import { useState } from "react";
import type { ScoreRow } from "@/app/data/types";
import type { Board } from "@/lib/leaderboard";
import { useSession } from "./session-provider";
const COLS =
  "grid grid-cols-[70px_1fr_1fr_140px] items-center gap-2.5 px-4.5 py-3 text-[13px] max-[720px]:grid-cols-[42px_minmax(0,1fr)_minmax(0,auto)_74px] max-[720px]:gap-1.5 max-[720px]:px-3 max-[720px]:py-2.5 max-[720px]:text-xs";
const TOP_TEXT = [
  "text-gold [text-shadow:0_0_6px_rgba(255,207,58,0.6)]",
  "text-silver",
  "text-bronze",
];
const pad = (n: number) => String(n).padStart(2, "0");
const fmt = (n: number) => n.toLocaleString("es-ES");
export function HallOfFame({ boards }: { boards: Board[] }) {
  const { user } = useSession();
  const [tab, setTab] = useState(boards[0]?.id ?? "global");
  const board = boards.find((b) => b.id === tab) ?? boards[0];
  const rows = board?.rows ?? [];
  const [first, second, third] = rows;
  const userName = user?.name.trim().toUpperCase();
  return (
    <>
      <div className="mb-5.5 flex flex-wrap justify-center gap-1.5">
        {boards.map((b) => (
          <button
            key={b.id}
            type="button"
            aria-pressed={board?.id === b.id}
            onClick={() => setTab(b.id)}
            className={`cursor-pointer border px-3.5 py-3 font-pixel text-[9px] tracking-[0.12em] ${
              board?.id === b.id
                ? "border-magenta text-magenta shadow-[0_0_10px_rgba(255,0,110,0.35)]"
                : "border-line bg-bg-2 text-ink-dim hover:text-ink"
            }`}
          >
            {b.title}
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <div className="border border-line bg-bg-2 px-6 py-14 text-center font-pixel text-xs tracking-[0.1em] text-ink-dim">
          Sé el primero en entrar al salón de la fama
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-[1fr_1.2fr_1fr] items-end gap-3.5 max-[720px]:grid-cols-1">
            <PodiumSlot
              rank="02"
              row={second}
              border="border-silver"
              color="text-silver"
            />
            <PodiumSlot
              rank="01"
              row={first}
              border="border-gold shadow-[0_0_22px_rgba(255,207,58,0.35)]"
              color="text-gold"
              champion
            />
            <PodiumSlot
              rank="03"
              row={third}
              border="border-bronze"
              color="text-bronze"
            />
          </div>
          <div className="border border-line bg-bg-2">
            <div
              className={`${COLS} border-b border-line font-pixel text-[10px] tracking-[0.16em] text-ink-faint max-[720px]:text-[8px] max-[720px]:tracking-normal`}
            >
              <div>RANGO</div>
              <div>JUGADOR</div>
              <div>PUNTUACIÓN</div>
              <div>FECHA</div>
            </div>
            {rows.map((r, i) => {
              const mine = r.name === userName;
              return (
                <div
                  key={`${board.id}-${r.rank}`}
                  className={`${COLS} animate-[rise_360ms_ease-out_forwards] border-b border-line-2 opacity-0 ${
                    mine
                      ? "border-l-3 border-l-yellow bg-[rgba(245,255,0,0.05)] pl-3.75"
                      : ""
                  }`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div
                    className={`font-pixel text-[11px] ${mine ? "text-yellow" : (TOP_TEXT[i] ?? "text-ink-dim")}`}
                  >
                    #{pad(r.rank)}
                  </div>
                  <div
                    className={`break-all ${mine ? "text-yellow" : "text-ink"}`}
                  >
                    {r.name}
                  </div>
                  <div
                    className={`font-pixel text-xs ${
                      mine
                        ? "text-yellow [text-shadow:0_0_6px_rgba(245,255,0,0.5)]"
                        : (TOP_TEXT[i] ??
                          "text-cyan [text-shadow:0_0_6px_rgba(0,245,255,0.4)]")
                    }`}
                  >
                    {fmt(r.score)}
                  </div>
                  <div className="text-ink-faint">{r.date}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
      <div className="mt-8 text-center">
        <Link href="/biblioteca" className="btn btn-lg">
          VOLVER A LA BIBLIOTECA
        </Link>
      </div>
    </>
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
  row?: ScoreRow;
  border: string;
  color: string;
  champion?: boolean;
}) {
  return (
    <div
      className={`relative border bg-bg-2 px-3.5 pt-4.5 pb-4 text-center ${border}`}
    >
      {champion && (
        <div className="font-pixel text-[9px] tracking-[0.18em] text-gold">
          CAMPEÓN
        </div>
      )}
      <div
        className={`font-pixel [text-shadow:0_0_12px_currentColor] ${color} ${
          champion ? "mt-1 text-4xl" : "text-[28px]"
        }`}
      >
        {rank}
      </div>
      <div className="mt-2 font-pixel text-xs tracking-[0.06em] break-all">
        {row ? row.name : "—"}
      </div>
      <div
        className={`mt-2 font-pixel text-cyan [text-shadow:0_0_8px_rgba(0,245,255,0.5)] ${
          champion ? "text-xl" : "text-base"
        }`}
      >
        {row ? fmt(row.score) : "—"}
      </div>
      <div className="mt-1.5 min-h-4 text-[11px] tracking-[0.12em] text-ink-faint">
        {row?.date}
      </div>
    </div>
  );
}
