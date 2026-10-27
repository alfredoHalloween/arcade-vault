import Link from "next/link";
import { FloatingSilhouettes } from "./floating-silhouettes";

export function Hero() {
  return (
    <section className="relative flex min-h-[calc(100vh-60px)] items-center justify-center overflow-hidden px-8 pt-20 pb-15 max-[720px]:px-4 max-[720px]:pt-14 max-[720px]:pb-16">
      <FloatingSilhouettes />
      <div className="relative z-3 max-w-275 text-center">
        <div className="neon-yellow mb-6 font-pixel text-[11px] tracking-[0.24em]">
          ▸ INSERTA UNA MONEDA<span className="blink">_</span>
        </div>
        <h1 className="m-0 flex flex-col gap-2 font-pixel text-[clamp(32px,7vw,88px)] leading-[1.05] tracking-[0.04em]">
          <span className="text-white [text-shadow:0_0_14px_rgba(255,255,255,0.4)]">EL ARCADE</span>
          <span className="bg-linear-to-b from-cyan to-[#4dd0e1] bg-clip-text text-transparent drop-shadow-[0_0_14px_rgba(0,245,255,0.45)]">
            CLÁSICO ESTÁ
          </span>
          <span className="bg-linear-to-b from-magenta to-[#ff6b9e] bg-clip-text text-transparent drop-shadow-[0_0_14px_rgba(255,0,110,0.45)]">
            DE VUELTA
          </span>
        </h1>
        <p className="mx-auto mt-7 mb-9 max-w-160 text-[15px] leading-[1.7] tracking-[0.04em] text-ink-dim">
          Juega los mejores clásicos directamente en tu navegador.
          <br />
          Sin descargas. Sin costo. Solo diversión.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/biblioteca" className="btn btn-xl pulse">
            ▶&nbsp; EXPLORAR JUEGOS
          </Link>
          <Link href="/acceso" className="btn btn-xl btn-magenta">
            ✦&nbsp; CREAR CUENTA
          </Link>
        </div>
        <div
          className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 font-pixel text-[9px] tracking-[0.2em] text-ink-faint max-[720px]:hidden"
          aria-hidden="true"
        >
          <span>DESLIZA</span>
          <span className="text-cyan [animation:bounce_1.6s_ease-in-out_infinite]">▼</span>
        </div>
      </div>
    </section>
  );
}
