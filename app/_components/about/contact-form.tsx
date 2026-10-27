"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { sendContact, type ContactState } from "@/app/acerca/actions";

const EMPTY = { name: "", email: "", msg: "" };
const IDLE: ContactState = { status: "idle" };

export function ContactForm() {
  const [state, formAction, pending] = useActionState(sendContact, IDLE);
  const [form, setForm] = useState(EMPTY);
  const [shake, setShake] = useState(false);
  // Resultado ya descartado por el usuario ("enviar otro" / "reintentar"). Cada envío devuelve un objeto nuevo.
  const [dismissed, setDismissed] = useState<ContactState | null>(null);
  const shakeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(shakeTimer.current), []);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (form.name.trim() && form.email.trim() && form.msg.trim()) return;
    e.preventDefault();
    setShake(true);
    clearTimeout(shakeTimer.current);
    shakeTimer.current = setTimeout(() => setShake(false), 400);
  };

  const showResult = state.status !== "idle" && dismissed !== state;

  return (
    <form
      action={formAction}
      onSubmit={onSubmit}
      className={
        "contact-form relative border border-line bg-bg-2 p-7 transition-transform duration-80 before:pointer-events-none before:absolute before:inset-1 before:border before:border-dashed before:border-cyan/15 before:content-['']" +
        (shake ? " shake" : "")
      }
    >
      {!showResult ? (
        <>
          <div className="field">
            <label htmlFor="contact-name">NOMBRE</label>
            <input
              id="contact-name"
              name="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="px_kai"
              className="placeholder:text-ink-faint"
            />
          </div>
          <div className="field">
            <label htmlFor="contact-email">CORREO ELECTRÓNICO</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="jugador@vault.gg"
              className="placeholder:text-ink-faint"
            />
          </div>
          <div className="field">
            <label htmlFor="contact-msg">MENSAJE</label>
            <textarea
              id="contact-msg"
              name="msg"
              rows={5}
              value={form.msg}
              onChange={(e) => setForm({ ...form, msg: e.target.value })}
              placeholder="Cuéntanos qué tienes en mente…"
              className="min-h-27.5 w-full resize-y border border-line bg-bg p-3 font-mono text-ink outline-0 transition-[border-color,box-shadow] duration-140 placeholder:text-ink-faint focus:border-cyan focus:shadow-[0_0_12px_rgba(0,245,255,0.35)]"
            />
          </div>
          {/* Honeypot: los bots lo rellenan, las personas no lo ven ni lo alcanzan con el teclado. */}
          <div aria-hidden="true" className="absolute -left-2500 h-0 w-0 overflow-hidden">
            <label htmlFor="contact-website">No rellenar</label>
            <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
          </div>
          <button
            className="btn xl w-full! active:translate-y-0.75! active:scale-99!"
            type="submit"
            disabled={pending}
          >
            {pending ? "▶  TRANSMITIENDO…" : "▶  ENVIAR MENSAJE"}
          </button>
        </>
      ) : state.status === "ok" ? (
        <div className="terminal-success" role="status">
          <TermBar />
          <div className="term-body">
            <Command />
            <div className="line dim">[OK] Conectando con servidor…</div>
            <div className="line dim">[OK] Validando contenido…</div>
            <div className="line dim">[OK] Transmitiendo paquete…</div>
            <div className="line success">
              &gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {state.name.toUpperCase()}.
              <span className="caret">_</span>
            </div>
            <div className="mt-4.5">
              <button
                className="btn ghost"
                type="button"
                onClick={() => {
                  setDismissed(state);
                  setForm(EMPTY);
                }}
              >
                ENVIAR OTRO MENSAJE
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="terminal-success error" role="alert">
          <TermBar />
          <div className="term-body">
            <Command />
            <div className="line dim">[OK] Conectando con servidor…</div>
            <div className="line err">[ERROR] Transmisión interrumpida.</div>
            <div className="line err">[ERROR] {state.status === "error" ? state.message : ""}</div>
            <div className="mt-4.5">
              <button className="btn ghost" type="button" onClick={() => setDismissed(state)}>
                REINTENTAR
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

function TermBar() {
  return (
    <div className="term-bar">
      <span className="dot r"></span>
      <span className="dot y"></span>
      <span className="dot g"></span>
      <span className="term-title">VAULT-OS // TERMINAL</span>
    </div>
  );
}

function Command() {
  return (
    <div className="line">
      <span className="prompt">vault@arcade:~$</span> ./send_message --to=team
    </div>
  );
}
