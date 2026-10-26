"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import type { SavedScore, SessionUser } from "@/app/data/types";

const USER_KEY = "av_user";
const SCORES_KEY = "av_scores";

type SessionContextValue = {
  user: SessionUser | null;
  ready: boolean;
  login: (user: SessionUser) => void;
  signOut: () => void;
  saveScore: (entry: Omit<SavedScore, "at">) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function notify() {
  listeners.forEach((l) => l());
}

// `undefined` on the server and during hydration, so the first client render matches the server.
function getRawUser(): string | null {
  try {
    return localStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
}

function getServerRawUser(): undefined {
  return undefined;
}

function parseUser(raw: string | null): SessionUser | null {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === "object" && typeof (parsed as SessionUser).name === "string") {
      return { name: (parsed as SessionUser).name };
    }
  } catch {}
  return null;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore<string | null | undefined>(subscribe, getRawUser, getServerRawUser);
  const ready = raw !== undefined;
  const user = useMemo(() => parseUser(raw ?? null), [raw]);

  const login = useCallback((next: SessionUser) => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(next));
    } catch {}
    notify();
  }, []);

  const signOut = useCallback(() => {
    try {
      localStorage.removeItem(USER_KEY);
    } catch {}
    notify();
  }, []);

  const saveScore = useCallback((entry: Omit<SavedScore, "at">) => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(SCORES_KEY) || "[]");
      const all: SavedScore[] = Array.isArray(parsed) ? parsed : [];
      all.push({ ...entry, at: Date.now() });
      localStorage.setItem(SCORES_KEY, JSON.stringify(all));
    } catch {}
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, signOut, saveScore }),
    [user, ready, login, signOut, saveScore],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession debe usarse dentro de <SessionProvider>");
  return ctx;
}
