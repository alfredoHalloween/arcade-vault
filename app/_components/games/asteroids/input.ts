const GAME_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Space",
]);
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
 * Teclado del juego. `isActive` indica si el juego recibe teclas (no en pausa);
 * mientras no lo esté, no se registran teclas ni se bloquea el comportamiento
 * por defecto del navegador.
 */
export function createInput(isActive: () => boolean) {
  const keys: Record<string, boolean> = {};
  const justPressed: Record<string, boolean> = {};
  const onKeyDown = (e: KeyboardEvent) => {
    if (!isActive() || isEditable(e.target)) return;
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    if (!keys[e.code]) justPressed[e.code] = true;
    keys[e.code] = true;
  };
  const onKeyUp = (e: KeyboardEvent) => {
    keys[e.code] = false;
    if (isActive() && !isEditable(e.target) && GAME_KEYS.has(e.code)) {
      e.preventDefault();
    }
  };
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  return {
    keys,
    /** true una sola vez por pulsación. */
    pressed(code: string) {
      const val = justPressed[code];
      justPressed[code] = false;
      return !!val;
    },
    /** Olvida todas las teclas (al pausar, para que no queden pulsadas). */
    clear() {
      for (const k of Object.keys(keys)) keys[k] = false;
      for (const k of Object.keys(justPressed)) justPressed[k] = false;
    },
    destroy() {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    },
  };
}
export type Input = ReturnType<typeof createInput>;
