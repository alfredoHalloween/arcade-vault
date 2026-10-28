"use client";
import { useCallback, useSyncExternalStore } from "react";
const NAME_KEY = "av_player_name";
const MAX_NAME = 16;
const listeners = new Set<() => void>();
function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}
function getSnapshot(): string | null {
  try {
    const raw = localStorage
      .getItem(NAME_KEY)
      ?.trim()
      .toUpperCase()
      .slice(0, MAX_NAME);
    return raw || null;
  } catch {
    return null;
  }
}
// `null` on the server and during hydration, so the first client render matches the server.
function getServerSnapshot(): null {
  return null;
}
/** Last name saved successfully (`av_player_name`), or `null` if there is none. */
export function usePlayerName(): {
  rememberedName: string | null;
  rememberName: (name: string) => void;
} {
  const rememberedName = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const rememberName = useCallback((name: string) => {
    try {
      localStorage.setItem(NAME_KEY, name);
    } catch {}
    listeners.forEach((l) => l());
  }, []);
  return { rememberedName, rememberName };
}
