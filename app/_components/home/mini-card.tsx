import Link from "next/link";
import type { Game } from "@/app/data/types";

export function MiniCard({ game }: { game: Game }) {
  return (
    <Link
      href={`/juegos/${game.id}`}
      className="block border border-line bg-bg-2 transition-[transform,border-color] duration-180 hover:-translate-y-1 hover:border-cyan"
    >
      <div className="relative aspect-square overflow-hidden">
        <div className={`cover-bg ${game.cover}`} />
      </div>
      <div className="px-3 py-2.5">
        <div className="font-pixel text-[10px] tracking-[0.06em]">{game.title}</div>
        <div className="mt-1 text-[10px] tracking-[0.14em] text-ink-faint">{game.cat}</div>
      </div>
    </Link>
  );
}
