"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "./session-provider";

const INPUT_CLASS =
  "h-11 border border-line bg-bg px-3 outline-0 transition-[border-color,box-shadow] duration-150 focus:border-cyan focus:shadow-[0_0_12px_rgba(0,245,255,0.35)]";

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`mb-3 flex flex-col gap-1.5 ${className}`}>
      <span className="text-[10px] tracking-[0.16em] text-ink-faint uppercase">{label}</span>
      {children}
    </label>
  );
}

export function AuthForm() {
  const router = useRouter();
  const { login, signOut } = useSession();
  const [tab, setTab] = useState<"in" | "up">("in");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ name: (username || "PLAYER1").toUpperCase().slice(0, 10) });
    router.push("/biblioteca");
  };

  const guest = () => {
    signOut();
    router.push("/biblioteca");
  };

  return (
    <div className="relative w-[min(440px,100%)] border border-line bg-bg-2 p-7 shadow-[0_0_30px_rgba(0,245,255,0.18)] before:pointer-events-none before:absolute before:inset-1 before:border before:border-dashed before:border-[rgba(0,245,255,0.18)] before:content-['']">
      <div className="mb-4.5 text-center">
        <div className="mx-auto mb-3 size-14 border border-white/18 bg-[linear-gradient(45deg,var(--magenta)_0_50%,transparent_50%),linear-gradient(-45deg,var(--cyan)_0_50%,transparent_50%)] bg-blend-screen shadow-[0_0_16px_rgba(0,245,255,0.55),inset_0_0_8px_rgba(255,0,110,0.5)]" />
        <h1 className="neon-cyan m-0 mt-1 font-pixel text-base tracking-[0.1em]">ARCADE VAULT</h1>
        <div className="mt-1.5 text-[11px] tracking-[0.16em] text-ink-faint">ACCESO AL SISTEMA · v2.6</div>
      </div>

      <div className="my-4.5 grid grid-cols-2 border border-line">
        {(
          [
            ["in", "INICIAR SESIÓN"],
            ["up", "CREAR CUENTA"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
            className={`cursor-pointer p-3 font-pixel text-[9px] tracking-[0.14em] ${
              tab === id
                ? "bg-[rgba(0,245,255,0.08)] text-cyan [text-shadow:0_0_6px_rgba(0,245,255,0.5)]"
                : "text-ink-dim"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={submit}>
        <Field label="Usuario">
          <input
            className={INPUT_CLASS}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="px_kai"
            autoComplete="username"
          />
        </Field>
        {tab === "up" && (
          <Field label="Correo electrónico" className="slide-in">
            <input
              className={INPUT_CLASS}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jugador@vault.gg"
              autoComplete="email"
            />
          </Field>
        )}
        <Field label="Contraseña">
          <input
            className={INPUT_CLASS}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={tab === "in" ? "current-password" : "new-password"}
          />
        </Field>

        <button type="submit" className="btn btn-lg mt-2 w-full">
          {tab === "in" ? "ENTRAR AL VAULT" : "CREAR Y JUGAR"}
        </button>
      </form>

      <button type="button" className="btn btn-ghost mt-2.5 w-full" onClick={guest}>
        JUGAR COMO INVITADO
      </button>

      <div className="my-4 flex items-center gap-3 font-pixel text-[8px] tracking-[0.16em] text-ink-faint before:h-px before:flex-1 before:bg-line before:content-[''] after:h-px after:flex-1 after:bg-line after:content-['']">
        O CONTINÚA CON
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <button type="button" className="btn btn-ghost p-3 text-[9px]">◆&nbsp; GOOGLE</button>
        <button type="button" className="btn btn-ghost p-3 text-[9px]">▣&nbsp; GITHUB</button>
      </div>

      <div className="mt-4.5 text-center text-[11px] tracking-widest text-ink-faint">
        AL ENTRAR ACEPTAS LOS TÉRMINOS DEL SALÓN ARCADE
      </div>
    </div>
  );
}
