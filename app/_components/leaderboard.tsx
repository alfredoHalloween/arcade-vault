import type { ScoreRow } from "@/app/data/types";

const TOP_STYLES = [
  "text-gold [text-shadow:0_0_6px_rgba(255,207,58,0.6)]",
  "text-silver [text-shadow:0_0_6px_rgba(199,208,224,0.5)]",
  "text-bronze [text-shadow:0_0_6px_rgba(217,122,58,0.5)]",
];

export function Leaderboard({ scores }: { scores: ScoreRow[] }) {
  return (
    <div className="border border-line bg-bg-2">
      <h3 className="m-0 border-b border-line px-4 py-3.5 font-pixel text-[11px] tracking-[0.14em] text-magenta [text-shadow:0_0_8px_rgba(255,0,110,0.5)]">
        MEJORES PUNTUACIONES
      </h3>
      {scores.map((r, i) => {
        const top = TOP_STYLES[i];
        return (
          <div
            key={r.rank}
            className="grid grid-cols-[36px_1fr_110px] items-center gap-2.5 border-b border-line-2 px-4 py-2.5 text-[13px]"
          >
            <div className={`font-pixel text-[11px] ${top ?? "text-ink-faint"}`}>
              #{String(r.rank).padStart(2, "0")}
            </div>
            <div className="text-ink">
              {r.name}
              <div className="text-[10px] tracking-widest text-ink-faint">{r.date}</div>
            </div>
            <div className={`text-right font-pixel text-xs ${top ?? "text-cyan"}`}>
              {r.score.toLocaleString("es-ES")}
            </div>
          </div>
        );
      })}
    </div>
  );
}
