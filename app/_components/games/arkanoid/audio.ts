import { SOUND_BOUNCE, SOUND_BREAK } from "./constants";
/**
 * Efectos de sonido de Arkanoid. Cada disparo reproduce un clon del audio
 * cargado para que los solapes no se corten. Un fallo de `play()` (autoplay
 * bloqueado, archivo que no carga) se ignora: el juego no depende del sonido.
 */
export function createSfx() {
  const bounce = new Audio(SOUND_BOUNCE);
  const breakBlock = new Audio(SOUND_BREAK);
  bounce.preload = "auto";
  breakBlock.preload = "auto";
  const playing = new Set<HTMLAudioElement>();
  let disposed = false;
  const stopAll = () => {
    for (const el of playing) el.pause();
    playing.clear();
  };
  const fire = (base: HTMLAudioElement) => {
    if (disposed) return;
    const el = base.cloneNode() as HTMLAudioElement;
    playing.add(el);
    el.addEventListener("ended", () => playing.delete(el), { once: true });
    try {
      el.play()?.catch(() => playing.delete(el));
    } catch {
      playing.delete(el);
    }
  };
  return {
    bounce: () => fire(bounce),
    breakBlock: () => fire(breakBlock),
    /** Detiene y descarta los efectos en curso (al pausar). */
    pause: stopAll,
    /** Libera todo; después no suena nada. */
    destroy() {
      disposed = true;
      stopAll();
      bounce.removeAttribute("src");
      breakBlock.removeAttribute("src");
      bounce.load();
      breakBlock.load();
    },
  };
}
export type Sfx = ReturnType<typeof createSfx>;
