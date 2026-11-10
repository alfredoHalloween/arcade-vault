/** Skins visuales de los juegos. Solo cambian el render, nunca reglas ni puntuación. */
export type SkinId = "clasico" | "neon" | "retro";
export const SKINS: readonly { id: SkinId; label: string }[] = [
  { id: "clasico", label: "CLÁSICO" },
  { id: "neon", label: "NEON" },
  { id: "retro", label: "RETRO" },
];
export const DEFAULT_SKIN: SkinId = "clasico";
export function isSkinId(value: unknown): value is SkinId {
  return value === "clasico" || value === "neon" || value === "retro";
}
/** Ids del catálogo cuyos juegos ya definen las 3 skins (el selector solo aparece en ellos). */
export const SKINNED_GAMES: ReadonlySet<string> = new Set([
  "rocas",
  "snake",
  "arkanoid",
]);
