"use server";

import { Resend } from "resend";

export type ContactState =
  | { status: "idle" }
  | { status: "ok"; name: string }
  | { status: "error"; message: string };

const MAX_NAME = 80;
const MAX_EMAIL = 254;
const MAX_MSG = 2000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_FROM = "Arcade Vault <onboarding@resend.dev>";
const GENERIC_ERROR = "No se pudo enviar el mensaje. Inténtalo de nuevo en unos minutos.";

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function sendContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const name = field(formData, "name");

  // Honeypot: un bot rellena el campo oculto; respondemos éxito sin enviar nada.
  if (field(formData, "website")) return { status: "ok", name: name || "JUGADOR" };

  const email = field(formData, "email");
  const msg = field(formData, "msg");

  if (!name || !email || !msg) {
    return { status: "error", message: "Completa nombre, correo y mensaje." };
  }
  if (name.length > MAX_NAME || email.length > MAX_EMAIL || msg.length > MAX_MSG) {
    return {
      status: "error",
      message: `Límites: nombre ${MAX_NAME}, correo ${MAX_EMAIL} y mensaje ${MAX_MSG} caracteres.`,
    };
  }
  if (!EMAIL_RE.test(email)) {
    return { status: "error", message: "El correo no tiene un formato válido." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) {
    console.error("[contacto] Falta RESEND_API_KEY o CONTACT_TO_EMAIL en el entorno.");
    return { status: "error", message: GENERIC_ERROR };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM,
      to,
      replyTo: email,
      // Sin saltos de línea en el asunto para evitar inyección de cabeceras.
      subject: `[Arcade Vault] Mensaje de ${name.replace(/[\r\n]+/g, " ")}`,
      text: `Nombre: ${name}\nCorreo: ${email}\n\n${msg}`,
    });
    if (error) {
      console.error("[contacto] Resend rechazó el envío:", error);
      return { status: "error", message: GENERIC_ERROR };
    }
  } catch (err) {
    console.error("[contacto] Fallo al llamar a Resend:", err);
    return { status: "error", message: GENERIC_ERROR };
  }

  return { status: "ok", name };
}
