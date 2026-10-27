import Link from "next/link";
import { GAMES } from "@/app/data/games";
import { Reveal } from "../reveal";
import { MiniCard } from "./mini-card";
import { SECTION_CLASS, SectionHead } from "./section-head";

export function GamesPreview() {
  return (
    <Reveal className={SECTION_CLASS}>
      <SectionHead kicker="// 02" title="JUEGOS DISPONIBLES AHORA" color="cyan" />
      <div className="grid grid-cols-6 gap-4 max-[1100px]:grid-cols-3 max-[600px]:grid-cols-2">
        {GAMES.slice(0, 6).map((g) => (
          <MiniCard key={g.id} game={g} />
        ))}
      </div>
      <div className="mt-6 text-center">
        <Link href="/biblioteca" className="btn btn-lg">
          VER TODOS LOS JUEGOS →
        </Link>
      </div>
    </Reveal>
  );
}
