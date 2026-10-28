import { Suspense } from "react";
import { HallOfFame } from "@/app/_components/hall-of-fame";
import { getBoards } from "@/lib/leaderboard";
async function Boards() {
  const boards = await getBoards();
  return <HallOfFame boards={boards} />;
}
function BoardsSkeleton() {
  return (
    <div aria-hidden className="animate-pulse">
      <div className="mb-5.5 flex justify-center gap-1.5">
        <div className="h-10 w-24 border border-line bg-bg-2" />
        <div className="h-10 w-24 border border-line bg-bg-2" />
      </div>
      <div className="h-80 border border-line bg-bg-2" />
    </div>
  );
}
export default function SalonPage() {
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
      <Suspense fallback={<BoardsSkeleton />}>
        <Boards />
      </Suspense>
    </div>
  );
}
