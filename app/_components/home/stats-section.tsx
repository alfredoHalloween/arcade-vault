import { Reveal } from "../reveal";

const STATS = [
  { n: "12+", u: "JUEGOS", s: "Y CONTANDO" },
  { n: "MILES", u: "DE PARTIDAS", s: "JUGADAS CADA DÍA" },
  { n: "GLOBAL", u: "RANKING", s: "COMPITE CON EL MUNDO" },
];

export function StatsSection() {
  return (
    <Reveal className="relative my-20 overflow-hidden border-y border-line bg-linear-to-b from-[#06060a] to-[#0c0c14] px-8 py-15 before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(80%_60%_at_50%_50%,rgba(245,255,0,0.06),transparent_70%)] before:content-[''] max-[720px]:my-14 max-[720px]:px-4">
      <div className="relative mx-auto grid max-w-300 grid-cols-3 gap-8 max-[720px]:grid-cols-1">
        {STATS.map((st, i) => (
          <div
            key={st.n}
            className="border-l border-line p-5 text-center first:border-l-0 max-[720px]:border-t max-[720px]:border-l-0 max-[720px]:first:border-t-0"
            style={{ transitionDelay: `${i * 90}ms` }}
          >
            <div className="neon-yellow font-pixel text-[clamp(32px,5vw,56px)] tracking-[0.04em]">{st.n}</div>
            <div className="mt-2.5 font-pixel text-[13px] tracking-[0.18em] text-ink">{st.u}</div>
            <div className="mt-2 text-[11px] tracking-[0.16em] text-ink-faint uppercase">{st.s}</div>
          </div>
        ))}
      </div>
    </Reveal>
  );
}
