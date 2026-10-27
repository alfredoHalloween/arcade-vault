import Link from "next/link";
import { Reveal } from "../reveal";
import { SECTION_CLASS, SectionHead } from "./section-head";

const PERKS = [
  "Acceso a todos los juegos",
  "Ranking global y salón de la fama",
  "Sin anuncios entre partidas",
  "Guarda tus puntuaciones",
  "Nuevos juegos cada mes",
  "Funciona en cualquier navegador",
];

const FAQ = [
  {
    q: "¿REALMENTE ES GRATIS?",
    a: 'Sí. Arcade Vault es un proyecto sin fines de lucro hecho por amor a los clásicos. No hay versión "premium" escondida.',
    border: "border-l-cyan",
  },
  {
    q: "¿NECESITO CREAR CUENTA?",
    a: "No. Puedes jugar como invitado. Si quieres guardar tu puntuación y aparecer en el ranking, regístrate en 10 segundos.",
    border: "border-l-magenta",
  },
  {
    q: "¿CÓMO SOBREVIVEN SIN COBRAR?",
    a: "Es un proyecto comunitario. Si te gusta, compártelo. Esa es toda la moneda que aceptamos.",
    border: "border-l-yellow",
  },
];

export function PricingSection() {
  return (
    <Reveal className={SECTION_CLASS}>
      <SectionHead kicker="// 04" title="PRECIOS" color="green" />
      <div className="grid grid-cols-2 items-stretch gap-6 max-[900px]:grid-cols-1">
        <div className="relative flex flex-col gap-3.5 border border-green bg-linear-to-b from-bg-2 to-[#0a0e16] px-7 py-8 shadow-[0_0_28px_rgba(0,255,136,0.18),inset_0_0_14px_rgba(0,255,136,0.08)] before:pointer-events-none before:absolute before:inset-1 before:border before:border-dashed before:border-[rgba(0,255,136,0.3)] before:content-['']">
          <div className="font-pixel text-[9px] tracking-[0.22em] text-ink-dim">PLAN ÚNICO</div>
          <div className="font-pixel text-base tracking-[0.08em] text-green [text-shadow:0_0_10px_rgba(0,255,136,0.5)]">
            JUGADOR VAULT
          </div>
          <div className="mt-1.5 flex items-baseline gap-2.5">
            <span className="bg-linear-to-b from-white to-green bg-clip-text font-pixel text-[64px] tracking-[0.02em] text-transparent drop-shadow-[0_0_12px_rgba(0,255,136,0.5)]">
              $0
            </span>
            <span className="font-pixel text-[11px] tracking-[0.16em] text-ink-dim">/ SIEMPRE</span>
          </div>
          <div className="font-pixel text-[9px] tracking-[0.18em] text-yellow [text-shadow:0_0_6px_rgba(245,255,0,0.45)]">
            SIN TRUCOS · SIN LETRA PEQUEÑA
          </div>
          <ul className="mt-2.5 mb-1 flex list-none flex-col gap-2 p-0">
            {PERKS.map((p) => (
              <li key={p} className="text-[13px] tracking-[0.02em] text-ink first-letter:text-green">
                ✔ {p}
              </li>
            ))}
          </ul>
          <Link href="/acceso" className="btn xl pulse w-full">
            EMPEZAR GRATIS →
          </Link>
          <div className="mt-1 text-center text-[11px] tracking-[0.1em] text-ink-faint">
            No pedimos tarjeta. Nunca lo haremos.
          </div>
          <div className="absolute -top-4.5 -right-4.5 z-3 rotate-14 border-2 border-magenta bg-[rgba(10,10,15,0.85)] px-4.5 py-2.5 text-center font-pixel text-[13px] leading-[1.15] tracking-[0.16em] text-magenta [text-shadow:0_0_8px_rgba(255,0,110,0.6)] shadow-[0_0_14px_rgba(255,0,110,0.35),inset_0_0_8px_rgba(255,0,110,0.2)] max-[520px]:-right-1">
            FREE
            <br />
            PLAY
          </div>
        </div>

        <div className="flex flex-col justify-center gap-3.5">
          {FAQ.map((f) => (
            <div key={f.q} className={`border border-l-3 border-line bg-bg-2 px-5 py-4.5 ${f.border}`}>
              <div className="mb-2 font-pixel text-[10px] tracking-[0.12em] text-ink">{f.q}</div>
              <div className="text-[13px] leading-[1.6] text-ink-dim">{f.a}</div>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
