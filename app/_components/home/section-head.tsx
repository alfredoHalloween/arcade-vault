export const SECTION_CLASS = "mx-auto my-20 max-w-330 px-8 max-[720px]:my-14 max-[720px]:px-4";

const KICKER_COLOR = {
  cyan: "neon-cyan",
  magenta: "neon-magenta",
  yellow: "neon-yellow",
  green: "neon-green",
} as const;

export function SectionHead({
  kicker,
  title,
  color,
}: {
  kicker: string;
  title: string;
  color: keyof typeof KICKER_COLOR;
}) {
  return (
    <div className="mb-9 flex items-center gap-4.5">
      <div className={`font-pixel text-[11px] tracking-[0.22em] ${KICKER_COLOR[color]}`}>{kicker}</div>
      <h2 className="m-0 font-pixel text-[clamp(18px,2.8vw,28px)] tracking-[0.06em] text-ink">{title}</h2>
      <div className="h-px flex-1 bg-linear-to-r from-line to-transparent" />
    </div>
  );
}
