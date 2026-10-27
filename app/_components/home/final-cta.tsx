import Link from "next/link";
import { Reveal } from "../reveal";

export function FinalCta() {
  return (
    <Reveal className="relative mx-auto max-w-225 px-8 pt-25 pb-30 text-center before:absolute before:top-7.5 before:left-1/2 before:h-px before:w-3/5 before:-translate-x-1/2 before:bg-linear-to-r before:from-transparent before:via-cyan before:to-transparent before:opacity-50 before:content-[''] after:absolute after:bottom-7.5 after:left-1/2 after:h-px after:w-3/5 after:-translate-x-1/2 after:bg-linear-to-r after:from-transparent after:via-cyan after:to-transparent after:opacity-50 after:content-[''] max-[720px]:px-4 max-[720px]:pt-20 max-[720px]:pb-24">
      <h2 className="mb-9 bg-linear-to-b from-white to-yellow bg-clip-text font-pixel text-[clamp(22px,4vw,40px)] tracking-[0.08em] text-transparent drop-shadow-[0_0_12px_rgba(245,255,0,0.4)]">
        ¿LISTO PARA JUGAR?
      </h2>
      <Link href="/biblioteca" className="btn xl pulse px-11! py-6!">
        INSERTAR MONEDA →
      </Link>
      <div className="mt-7 text-[13px] tracking-[0.06em] text-ink-dim">
        Gratis. Sin registro obligatorio. Empieza en segundos.
      </div>
    </Reveal>
  );
}
