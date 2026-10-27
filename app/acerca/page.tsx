import { ContactForm } from "@/app/_components/about/contact-form";
import { HighlightIcon, type HighlightIconKind } from "@/app/_components/about/highlight-icon";
import { Reveal } from "@/app/_components/reveal";

const HIGHLIGHTS: { icon: HighlightIconKind; text: string; color: string }[] = [
  { icon: "HEART", text: "HECHO CON ❤️ PARA JUGADORES", color: "text-magenta" },
  { icon: "BROWSER", text: "JUEGOS EN HTML — CORREN EN CUALQUIER NAVEGADOR", color: "text-cyan" },
  { icon: "PLANT", text: "PROYECTO EN CONSTANTE CRECIMIENTO", color: "text-green" },
];

const TIPS = [
  { text: "RESPUESTA EN 24-48H", led: "" },
  { text: "SUGERENCIAS BIENVENIDAS", led: " y" },
  { text: "SIN SPAM, JAMÁS", led: " m" },
];

export default function AcercaPage() {
  return (
    <div className="fade-in relative">
      <section className="mx-auto max-w-275 px-8 pt-20 pb-10 text-center">
        <div className="font-pixel neon-yellow mb-4.5 text-[11px] tracking-[0.24em]">▸ ACERCA DE</div>
        <h1 className="m-0 bg-linear-to-b from-white to-cyan to-80% bg-clip-text font-pixel text-[clamp(26px,5vw,52px)] tracking-[0.06em] text-transparent drop-shadow-[0_0_14px_rgba(0,245,255,0.4)]">
          ACERCA DE ARCADE VAULT
        </h1>
        <p className="mx-auto mt-7 max-w-180 text-[15px] leading-[1.8] tracking-[0.03em] text-ink-dim">
          ARCADE VAULT nació del amor por los videojuegos clásicos. Nuestra misión es preservar y celebrar los
          arcades que definieron una generación, haciéndolos accesibles para todos, en cualquier lugar y sin costo.
        </p>

        <div className="mt-13 grid grid-cols-3 gap-4.5 max-[820px]:grid-cols-1">
          {HIGHLIGHTS.map((h, i) => (
            <div
              key={h.icon}
              className={`flex items-center gap-4 border border-line bg-bg-2 px-5 py-4.5 text-left transition-[transform,border-color,box-shadow] duration-220 hover:-translate-y-0.75 hover:border-current hover:shadow-[0_12px_28px_-14px_currentColor] ${h.color}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <HighlightIcon kind={h.icon} />
              <div className="font-pixel text-[10px] leading-normal tracking-[0.1em] text-ink">{h.text}</div>
            </div>
          ))}
        </div>
      </section>

      <Reveal className="mx-auto my-15 flex max-w-300 items-center gap-4 px-8">
        <div aria-hidden="true" className="contents">
          <div className="h-px flex-1 bg-linear-to-r from-transparent via-magenta to-transparent" />
          <div className="div-pixels">
            {Array.from({ length: 24 }, (_, i) => (
              <span key={i} style={{ animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
          <div className="h-px flex-1 bg-linear-to-r from-transparent via-magenta to-transparent" />
        </div>
      </Reveal>

      <Reveal className="mx-auto mb-20 max-w-300 px-8">
        <div className="grid grid-cols-[1fr_1.2fr] items-start gap-10 max-[900px]:grid-cols-1 max-[900px]:gap-6">
          <div>
            <div className="font-pixel neon-cyan mb-3.5 text-[11px] tracking-[0.24em]">▸ CONTACTO</div>
            <h2 className="m-0 font-pixel text-[clamp(22px,3.5vw,36px)] tracking-[0.06em] text-cyan [text-shadow:0_0_12px_rgba(0,245,255,0.4)]">
              CONTÁCTANOS
            </h2>
            <p className="mt-4.5 mb-6 text-sm leading-[1.7] text-ink-dim">
              ¿Tienes alguna sugerencia, quieres proponer un juego, o simplemente quieres saludar? Escríbenos.
            </p>
            <div className="flex flex-col gap-2.5">
              {TIPS.map((t) => (
                <div key={t.text} className="flex items-center gap-2.5 font-pixel text-[9px] tracking-[0.14em] text-ink-dim">
                  <span className={`tip-led${t.led}`} />
                  {t.text}
                </div>
              ))}
            </div>
          </div>
          <ContactForm />
        </div>
      </Reveal>
    </div>
  );
}
