import { LibraryBrowser } from "./_components/library-browser";

export default function Home() {
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
      <LibraryBrowser />
    </div>
  );
}
