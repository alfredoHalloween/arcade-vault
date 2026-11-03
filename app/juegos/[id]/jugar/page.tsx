import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GamePlayer } from "@/app/_components/game-player";
import { GAMES } from "@/app/data/games";

export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}

// `params` se lee dentro de <Suspense> para que el App Shell no dependa de la URL.
export default function PlayPage({ params }: PageProps<"/juegos/[id]/jugar">) {
  return (
    <Suspense fallback={<PlayerSkeleton />}>
      <Player params={params} />
    </Suspense>
  );
}

function PlayerSkeleton() {
  return (
    <div aria-hidden className="mx-auto my-8 max-w-275 animate-pulse px-6 max-[720px]:px-4">
      <div className="mb-4.5 h-18 border border-line bg-bg-2" />
      <div className="aspect-4/3 border border-line bg-bg-2" />
    </div>
  );
}

async function Player({ params }: { params: PageProps<"/juegos/[id]/jugar">["params"] }) {
  const { id } = await params;
  const game = GAMES.find((g) => g.id === id);
  if (!game) notFound();

  return <GamePlayer game={game} />;
}
