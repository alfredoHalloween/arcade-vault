"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "./session-provider";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/biblioteca", label: "Biblioteca" },
  { href: "/salon", label: "Salón de la Fama" },
  { href: "/acerca", label: "Acerca de" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/biblioteca") return pathname.startsWith("/biblioteca") || pathname.startsWith("/juegos");
  return pathname.startsWith(href);
}

export function Nav() {
  const pathname = usePathname();
  const { user, ready, signOut } = useSession();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <nav className="sticky top-0 z-50 flex items-center gap-6 border-b border-line bg-linear-to-b from-[rgba(10,10,15,0.92)] to-[rgba(10,10,15,0.78)] px-8 py-3.5 backdrop-blur-sm max-[840px]:px-4 max-[840px]:py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="size-7 border border-white/18 bg-[linear-gradient(45deg,var(--magenta)_0_50%,transparent_50%),linear-gradient(-45deg,var(--cyan)_0_50%,transparent_50%)] bg-blend-screen shadow-[0_0_12px_rgba(0,245,255,0.55),inset_0_0_6px_rgba(255,0,110,0.5)]" />
          <div className="neon-cyan font-pixel text-xs tracking-[0.12em]">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>

        <div className="ml-8 flex gap-1 max-[840px]:hidden">
          {LINKS.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`relative px-3.5 py-2.5 font-pixel text-[9px] tracking-[0.16em] transition-colors ${
                  active
                    ? "text-cyan [text-shadow:0_0_8px_rgba(0,245,255,0.65)] after:absolute after:inset-x-3.5 after:bottom-1 after:h-0.5 after:bg-cyan after:shadow-[0_0_8px_var(--cyan),0_0_16px_var(--cyan)]"
                    : "text-ink-dim hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2 font-pixel text-[9px] text-yellow max-[840px]:hidden">
          <span className="size-3.5 rounded-full bg-[radial-gradient(circle_at_35%_35%,#fff8b0,#f5ff00_60%,#b0b800)] shadow-[0_0_8px_var(--yellow)]" />
          <span>CRÉDITOS · 03</span>
        </div>

        {ready &&
          (user ? (
            <button type="button" className="btn btn-ghost ml-4" onClick={signOut}>
              {user.name} ▾
            </button>
          ) : (
            <Link href="/acceso" className="btn ml-4">
              Iniciar Sesión
            </Link>
          ))}

        <button
          type="button"
          className="btn btn-ghost hidden! max-[840px]:inline-flex!"
          onClick={() => setOpen(true)}
          aria-label="Menú"
        >
          ≡
        </button>
      </nav>

      <div
        className={`fixed inset-0 z-55 bg-black/60 transition-opacity duration-180 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={close}
      />
      <aside
        inert={!open}
        className={`fixed inset-y-0 right-0 z-60 flex w-[min(320px,86vw)] flex-col gap-2 border-l border-line bg-bg-2 px-5 py-6 transition-transform duration-220 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="neon-cyan mb-4 flex items-center justify-between font-pixel text-[11px]">
          MENÚ
          <button type="button" className="text-ink-dim" onClick={close} aria-label="Cerrar menú">
            ✕
          </button>
        </div>
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={close}
            className={`border-b border-dashed border-line-2 px-3 py-3.5 font-pixel text-[11px] ${
              isActive(pathname, l.href) ? "text-cyan" : "text-ink-dim"
            }`}
          >
            {l.label}
          </Link>
        ))}
        <Link
          href="/acceso"
          onClick={close}
          className={`border-b border-dashed border-line-2 px-3 py-3.5 font-pixel text-[11px] ${
            pathname.startsWith("/acceso") ? "text-cyan" : "text-ink-dim"
          }`}
        >
          {user ? "Cuenta" : "Iniciar Sesión"}
        </Link>
        <div className="flex-1" />
        <div className="font-pixel text-[9px] tracking-[0.16em] text-ink-faint">CRÉDITOS · 03</div>
      </aside>
    </>
  );
}
