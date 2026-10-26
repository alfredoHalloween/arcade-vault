import Link from "next/link";
import { notFound } from "next/navigation";
import { Leaderboard } from "@/app/_components/leaderboard";
import { GAMES } from "@/app/data/games";
import { seededScores } from "@/app/data/scores";

export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}

export default async function GameDetailPage({ params }: PageProps<"/juegos/[id]">) {
  const { id } = await params;
  const game = GAMES.find((g) => g.id === id);
  if (!game) notFound();

  const scores = seededScores(id.length * 17 + 3, 10);
  const tags = [game.cat, "1 JUGADOR", "TECLADO / TÁCTIL", "RETRO 1985"];

  return (
    <div className="fade-in mx-auto my-12 grid max-w-330 grid-cols-[1.4fr_1fr] gap-8 px-8 max-[900px]:grid-cols-1 max-[720px]:my-6 max-[720px]:px-4">
      <div>
        <div className="relative aspect-16/10 overflow-hidden border border-line">
          <div className={`absolute inset-0 ${game.cover}`} />
        </div>
        <div className="mt-5 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <span
                key={t}
                className="border border-line px-2.5 py-1.5 font-pixel text-[9px] tracking-[0.12em] text-ink-dim"
              >
                {t}
              </span>
            ))}
          </div>
          <h1 className="neon-cyan m-0 font-pixel text-[clamp(20px,3vw,32px)] tracking-[0.06em]">
            {game.title}
          </h1>
          <p className="m-0 text-sm leading-[1.7] text-ink-dim">{game.long}</p>
          <div className="mt-2 grid grid-cols-3 gap-px border border-line bg-line">
            <Stat label="Partidas" value={game.plays} />
            <Stat
              label="Mejor global"
              value={game.best.toLocaleString("es-ES")}
              className="text-magenta [text-shadow:0_0_6px_rgba(255,0,110,0.5)]"
            />
            <Stat
              label="Dificultad"
              value="★ ★ ★ ☆ ☆"
              className="text-yellow [text-shadow:0_0_6px_rgba(245,255,0,0.5)]"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={`/juegos/${game.id}/jugar`} className="btn btn-xl pulse">
              ▶&nbsp; JUGAR AHORA
            </Link>
            <Link href="/" className="btn btn-ghost btn-lg">
              VOLVER AL VAULT
            </Link>
          </div>
        </div>
      </div>

      <aside>
        <Leaderboard scores={scores} />
      </aside>
    </div>
  );
}

function Stat({ label, value, className = "text-cyan [text-shadow:0_0_6px_rgba(0,245,255,0.5)]" }: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="bg-bg-2 p-3.5">
      <div className="text-[10px] tracking-[0.12em] text-ink-faint uppercase">{label}</div>
      <div className={`mt-1.5 font-pixel text-base ${className}`}>{value}</div>
    </div>
  );
}
