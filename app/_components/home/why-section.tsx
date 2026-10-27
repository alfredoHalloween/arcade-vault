import { Reveal } from "../reveal";
import { FeatureIcon, type FeatureIconKind } from "./feature-icon";
import { SECTION_CLASS, SectionHead } from "./section-head";

type Feature = { icon: FeatureIconKind; title: string; desc: string; color: string };

const FEATURES: Feature[] = [
  {
    icon: "GAMEPAD",
    title: "JUEGOS CLÁSICOS",
    desc: "Arkanoid, Tetris, Snake y muchos más. Los mejores arcades de todos los tiempos en un solo lugar.",
    color: "text-cyan",
  },
  {
    icon: "FREE",
    title: "100% GRATIS",
    desc: "Sin suscripciones, sin pagos ocultos. Todos los juegos disponibles de forma gratuita.",
    color: "text-yellow",
  },
  {
    icon: "TROPHY",
    title: "LADDER BOARDS",
    desc: "Compite con jugadores de todo el mundo. Escala el ranking y demuestra quién es el mejor.",
    color: "text-magenta",
  },
  {
    icon: "ROCKET",
    title: "SIEMPRE CRECIENDO",
    desc: "Agregamos nuevos juegos constantemente. Vuelve seguido, siempre habrá algo nuevo que jugar.",
    color: "text-green",
  },
];

export function WhySection() {
  return (
    <Reveal className={SECTION_CLASS}>
      <SectionHead kicker="// 01" title="¿POR QUÉ ARCADE VAULT?" color="magenta" />
      <div className="grid grid-cols-4 gap-4.5 max-[980px]:grid-cols-2 max-[520px]:grid-cols-1">
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            className={`flex flex-col gap-3.5 border border-line bg-linear-to-b from-bg-2 to-bg-3 px-5 py-6 transition-[transform,box-shadow,border-color] duration-220 hover:-translate-y-1.5 hover:border-current hover:shadow-[0_18px_40px_-16px_currentColor,0_0_0_1px_currentColor] ${f.color}`}
            style={{ transitionDelay: `${i * 80}ms` }}
          >
            <FeatureIcon kind={f.icon} />
            <div className="font-pixel text-xs tracking-[0.1em] [text-shadow:0_0_8px_currentColor]">{f.title}</div>
            <div className="text-[13px] leading-[1.6] text-ink-dim">{f.desc}</div>
          </div>
        ))}
      </div>
    </Reveal>
  );
}
