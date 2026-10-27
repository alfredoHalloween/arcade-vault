import Link from "next/link";
import { RECENT_SCORES, TOP_PLAYERS } from "@/app/data/activity";
import { GAMES } from "@/app/data/games";
import { Reveal } from "../reveal";
import { SECTION_CLASS, SectionHead } from "./section-head";

const RANK_STYLE = [
  "text-gold [text-shadow:0_0_6px_rgba(255,207,58,0.6)] before:bg-[linear-gradient(90deg,rgba(255,207,58,0.14),transparent)]",
  "text-silver before:bg-[linear-gradient(90deg,rgba(199,208,224,0.10),transparent)]",
  "text-bronze before:bg-[linear-gradient(90deg,rgba(217,122,58,0.10),transparent)]",
];
const DEFAULT_RANK_STYLE =
  "text-cyan [text-shadow:0_0_6px_rgba(0,245,255,0.4)] before:bg-[linear-gradient(90deg,rgba(0,245,255,0.06),transparent)]";

function gameTitle(id: string) {
  return GAMES.find((g) => g.id === id)?.title ?? id;
}

export function ActivitySection() {
  return (
    <Reveal className={SECTION_CLASS}>
      <SectionHead kicker="// 03" title="ACTIVIDAD EN VIVO" color="yellow" />
      <div className="grid grid-cols-[1.2fr_1fr] gap-4.5 max-[900px]:grid-cols-1">
        <div className="border border-line bg-bg-2">
          <div className="flex min-w-0 items-center justify-between gap-2.5 border-b border-line px-3.5 py-3">
            <div className="min-w-0 flex-1 truncate font-pixel text-[10px] tracking-[0.1em] text-cyan [text-shadow:0_0_8px_rgba(0,245,255,0.5)]">
              ▸ ÚLTIMAS PUNTUACIONES
            </div>
          </div>
          <div className="max-h-90 overflow-hidden py-1.5">
            {RECENT_SCORES.map((r, i) => (
              <div
                key={r.player}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-b border-line-2 px-4.5 py-2.75 text-[13px] opacity-0 [animation:tickin_360ms_ease-out_forwards] max-[520px]:grid-cols-[1fr_auto] max-[520px]:gap-y-1"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className={`font-pixel text-[10px] tracking-[0.06em] neon-${r.color}`}>{r.player}</span>
                <span className="text-xs text-ink-dim max-[520px]:col-span-full">▸ {gameTitle(r.gameId)}</span>
                <span className="font-pixel text-[11px] text-yellow [text-shadow:0_0_6px_rgba(245,255,0,0.5)]">
                  +{r.score.toLocaleString("es-ES")}
                </span>
                <span className="text-[11px] tracking-[0.08em] text-ink-faint max-[520px]:col-span-full">{r.ago}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-line bg-bg-2">
          <div className="flex min-w-0 items-center justify-between gap-2.5 border-b border-line px-3.5 py-3">
            <div className="neon-magenta min-w-0 flex-1 truncate font-pixel text-[10px] tracking-[0.1em]">
              ▸ TOP JUGADORES · HOY
            </div>
            <Link
              href="/salon"
              className="border border-line px-2.5 py-1.5 font-pixel text-[9px] tracking-[0.14em] text-ink-dim transition-colors hover:border-magenta hover:text-magenta hover:shadow-[0_0_8px_rgba(255,0,110,0.35)]"
            >
              VER SALÓN →
            </Link>
          </div>
          <div className="flex flex-col gap-2.5 px-4.5 pt-2.5 pb-4.5">
            {TOP_PLAYERS.map((r, i) => (
              <div
                key={r.player}
                className={`relative grid grid-cols-[36px_1fr_auto] items-center gap-2.5 py-2 before:pointer-events-none before:absolute before:inset-y-0 before:right-0 before:left-9 before:content-[''] ${RANK_STYLE[i] ?? DEFAULT_RANK_STYLE}`}
              >
                <span className="relative z-1 font-pixel text-[10px]">#{String(r.rank).padStart(2, "0")}</span>
                <span className="relative z-1 font-pixel text-[11px] tracking-[0.06em] text-ink">{r.player}</span>
                <span className="relative z-1 font-pixel text-[11px]">{r.score.toLocaleString("es-ES")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Reveal>
  );
}
