"use client";
import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_SKIN, isSkinId, type SkinId } from "./games/skins";
const SKIN_KEY = "av_skin";
const listeners = new Set<() => void>();
function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}
function getSnapshot(): SkinId {
  try {
    const raw = localStorage.getItem(SKIN_KEY);
    return isSkinId(raw) ? raw : DEFAULT_SKIN;
  } catch {
    return DEFAULT_SKIN;
  }
}
// `clasico` en el servidor y durante la hidratación: el primer render del cliente coincide.
function getServerSnapshot(): SkinId {
  return DEFAULT_SKIN;
}
/** Skin elegida por el jugador (`av_skin` en `localStorage`), común a todos los juegos con skins. */
export function useSkin(): [SkinId, (skin: SkinId) => void] {
  const skin = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setSkin = useCallback((next: SkinId) => {
    try {
      localStorage.setItem(SKIN_KEY, next);
    } catch {}
    listeners.forEach((l) => l());
  }, []);
  return [skin, setSkin];
}
