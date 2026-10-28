import { Suspense } from "react";
import { GAMES } from "../data/games";
import { LibraryBrowser } from "../_components/library-browser";
import { getStoredGameIds } from "@/lib/games";
async function Library() {
  const ids = await getStoredGameIds();
  if (ids === null) {
    return (
      <LibraryMessage title="NO SE PUDO CARGAR LA BIBLIOTECA">
        Inténtalo de nuevo más tarde.
      </LibraryMessage>
    );
  }
  const games = GAMES.filter((g) => ids.includes(g.id));
  if (games.length === 0) {
    return (
      <LibraryMessage title="AÚN NO HAY JUEGOS EN EL VAULT">
        Vuelve pronto: estamos preparando nuevos juegos.
      </LibraryMessage>
    );
  }
  return <LibraryBrowser games={games} />;
}
function LibraryMessage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto mt-8 mb-20 max-w-330 px-8 max-[720px]:px-4">
      <div className="p-20 text-center text-ink-faint">
        <div className="mb-3 font-pixel text-sm text-magenta">{title}</div>
        <div>{children}</div>
      </div>
    </div>
  );
}
function LibrarySkeleton() {
  return (
    <div aria-hidden className="animate-pulse">
      <div className="mx-auto mt-8 flex max-w-330 flex-wrap gap-3 px-8 max-[720px]:px-4">
        <div className="h-12 min-w-55 flex-1 border border-line bg-bg-2" />
        <div className="h-12 w-72 border border-line bg-bg-2" />
      </div>
      <div className="mx-auto mt-8 mb-20 grid max-w-330 grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5.5 px-8 max-[720px]:px-4">
        <div className="h-96 border border-line bg-bg-2" />
      </div>
    </div>
  );
}
export default function BibliotecaPage() {
  return (
    <div className="fade-in">
      <section className="mx-auto max-w-330 px-8 pt-16 pb-8 text-center max-[720px]:px-4 max-[720px]:pt-9 max-[720px]:pb-4">
        <h1 className="flicker m-0 bg-[linear-gradient(180deg,#fff_0%,var(--cyan)_60%,var(--magenta)_110%)] bg-clip-text font-pixel text-[clamp(28px,6vw,64px)] tracking-[0.06em] text-transparent drop-shadow-[0_0_12px_rgba(0,245,255,0.4)]">
          ARCADE VAULT
        </h1>
        <div className="mt-4.5 font-pixel text-[clamp(10px,1.6vw,14px)] tracking-[0.2em] text-yellow">
          INSERTA UNA MONEDA PARA JUGAR <span className="blink">_</span>
        </div>
      </section>
      <Suspense fallback={<LibrarySkeleton />}>
        <Library />
      </Suspense>
    </div>
  );
}
