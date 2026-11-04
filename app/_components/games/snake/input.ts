import type { Dir } from "./entities";
const KEY_MAP: Record<string, Dir> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  KeyW: "up",
  KeyS: "down",
  KeyA: "left",
  KeyD: "right",
};
function isEditable(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}
/**
 * Teclado de Snake: ← ↑ → ↓ y W A S D. Llama a `onDir` en cada `keydown` con la
 * dirección pedida; el motor decide si el giro es válido. Solo reacciona (y solo
 * hace `preventDefault` de esas teclas) si el juego está activo, o sea no en
 * pausa, y el foco no está en un campo editable. No hay P ni Esc.
 */
export function createInput(onDir: (dir: Dir) => void) {
  let active = true;
  const onKeyDown = (e: KeyboardEvent) => {
    if (!active || isEditable(e.target)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const dir = KEY_MAP[e.code];
    if (!dir) return;
    e.preventDefault();
    // La repetición nativa no añade giros: cada pulsación cuenta una vez.
    if (!e.repeat) onDir(dir);
  };
  // Las flechas también hacen scroll en keyup si el foco está en un botón.
  const onKeyUp = (e: KeyboardEvent) => {
    if (active && !isEditable(e.target) && KEY_MAP[e.code]) {
      e.preventDefault();
    }
  };
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  return {
    /** false en pausa o con el modal abierto: ignora teclas y no las bloquea. */
    setActive(value: boolean) {
      active = value;
    },
    destroy() {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    },
  };
}
export type Input = ReturnType<typeof createInput>;
