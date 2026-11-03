export type TetrisKey = "left" | "right" | "down" | "rotate" | "hardDrop";

const KEY_MAP: Record<string, TetrisKey> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowDown: "down",
  ArrowUp: "rotate",
  KeyX: "rotate",
  Space: "hardDrop",
};

/** Teclas cuyo comportamiento por defecto (scroll) se bloquea mientras se juega. */
const BLOCKED_CODES = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowDown",
  "ArrowUp",
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
 * Teclado de Tetris. Llama a `onKey` en cada `keydown`, incluida la repetición
 * nativa del navegador al mantener pulsada una tecla (como el original).
 * Solo reacciona (y solo hace `preventDefault`) si el juego está activo, o sea
 * no en pausa, y el foco no está en un campo editable. No hay P ni Esc.
 */
export function createInput(onKey: (key: TetrisKey) => void) {
  let active = true;

  const onKeyDown = (e: KeyboardEvent) => {
    if (!active || isEditable(e.target)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (BLOCKED_CODES.has(e.code)) e.preventDefault();
    const key = KEY_MAP[e.code];
    if (key) onKey(key);
  };

  // Espacio y flechas también hacen scroll/activan botones en keyup.
  const onKeyUp = (e: KeyboardEvent) => {
    if (active && !isEditable(e.target) && BLOCKED_CODES.has(e.code)) {
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
