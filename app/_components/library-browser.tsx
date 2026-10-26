"use client";

import { useState } from "react";
import { CATEGORIES, GAMES } from "@/app/data/games";
import { GameCard } from "./game-card";

export function LibraryBrowser() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("TODOS");

  const query = q.toLowerCase();
  const filtered = GAMES.filter(
    (g) => (cat === "TODOS" || g.cat === cat) && g.title.toLowerCase().includes(query),
  );

  return (
    <>
      <div className="mx-auto mt-8 flex max-w-330 flex-wrap gap-3 px-8 max-[720px]:px-4">
        <label className="flex h-12 min-w-55 flex-1 items-center gap-2.5 border border-line bg-bg-2 px-4 focus-within:border-cyan focus-within:shadow-[0_0_12px_rgba(0,245,255,0.35)]">
          <span aria-hidden className="font-pixel text-[11px] text-cyan">⌕</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar un juego por nombre…"
            aria-label="Buscar un juego por nombre"
            className="flex-1 border-0 bg-transparent px-0.5 py-px text-[13px] tracking-[0.04em] text-ink outline-0 placeholder:text-ink-faint"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={cat === c}
              onClick={() => setCat(c)}
              className={`cursor-pointer border px-3.5 py-3 font-pixel text-[9px] tracking-[0.12em] ${
                cat === c
                  ? "border-magenta text-magenta shadow-[0_0_10px_rgba(255,0,110,0.35)]"
                  : "border-line bg-bg-2 text-ink-dim hover:text-ink"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-8 mb-20 grid max-w-330 grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5.5 px-8 max-[720px]:px-4">
        {filtered.map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full p-20 text-center text-ink-faint">
            <div className="mb-3 font-pixel text-sm text-magenta">NO HAY RESULTADOS</div>
            <div>Intenta otra búsqueda o categoría.</div>
          </div>
        )}
      </div>
    </>
  );
}
