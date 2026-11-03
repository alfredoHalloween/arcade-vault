import { W } from "./constants";
/** Teclas cuyo comportamiento por defecto (scroll) se bloquea mientras se juega. */
const BLOCKED_CODES = new Set(["ArrowLeft", "ArrowRight"]);
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
 * Entrada de Arkanoid: ← → (estado retenido) y `mousemove` sobre el canvas
 * (posición convertida a coordenadas lógicas, 0–800). Solo reacciona, y solo
 * hace `preventDefault`, si el juego está activo (no en pausa ni con el modal)
 * y el foco no está en un campo editable. No hay P ni Esc.
 */
export function createInput(
  canvas: HTMLCanvasElement,
  onPointer: (logicalX: number) => void,
) {
  let active = true;
  let left = false;
  let right = false;
  const release = () => {
    left = false;
    right = false;
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (!active || isEditable(e.target)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (BLOCKED_CODES.has(e.code)) e.preventDefault();
    if (e.code === "ArrowLeft") left = true;
    if (e.code === "ArrowRight") right = true;
  };
  // Soltar siempre se registra, aunque el juego esté en pausa, para no dejar
  // la paleta "pegada"; solo se bloquea el comportamiento por defecto si está activo.
  const onKeyUp = (e: KeyboardEvent) => {
    if (e.code === "ArrowLeft") left = false;
    if (e.code === "ArrowRight") right = false;
    if (active && !isEditable(e.target) && BLOCKED_CODES.has(e.code)) {
      e.preventDefault();
    }
  };
  const onMouseMove = (e: MouseEvent) => {
    if (!active) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;
    onPointer(((e.clientX - rect.left) * W) / rect.width);
  };
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", release);
  canvas.addEventListener("mousemove", onMouseMove);
  return {
    /** false en pausa o con el modal abierto: ignora entrada y suelta las teclas. */
    setActive(value: boolean) {
      active = value;
      if (!value) release();
    },
    /** −1 izquierda, 0 quieta, 1 derecha (si se pulsan ambas, se anulan). */
    getAxis(): -1 | 0 | 1 {
      return left === right ? 0 : left ? -1 : 1;
    },
    destroy() {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", release);
      canvas.removeEventListener("mousemove", onMouseMove);
    },
  };
}
export type Input = ReturnType<typeof createInput>;
