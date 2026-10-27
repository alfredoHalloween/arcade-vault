# SPEC 03 — Página "Acerca de" y envío del formulario de contacto con Resend

> **Estado:** Implementado
> **Depende de:** SPEC 01 (`01-mvp-pantallas-visuales.md`) y SPEC 02 (`02-home-page.md`)
> **Fecha:** 2026-10-26
> **Objetivo:** Implementar en `/acerca` la página de `references/templates/home-about/about.jsx` (Acerca de + Contacto) y hacer que su formulario envíe un correo real con Resend mediante una Server Action.

---

## Por qué existe esta spec

La SPEC 02 dejó fuera `/about`, el formulario de contacto y el enlace "Acerca de" del Nav. El template (`about.jsx`) solo simula el envío: `setSent(name)` y muestra la terminal de éxito. Esta spec convierte esa simulación en un envío real y fija cómo se configura Resend, algo que el template no cubre.

---

## Alcance

**Dentro:**

- Nueva ruta `app/acerca/page.tsx` con el contenido de `about.jsx`, sin cambiar textos, orden ni diseño:
  - Sección "ACERCA DE" (kicker, título, misión y 3 destacados con icono pixelado: corazón, navegador, planta).
  - Banner divisor con barras y 24 píxeles animados.
  - Sección "CONTACTO" (intro con 3 `tip-led` y formulario).
- Formulario como componente cliente con los mismos estados del template: campos nombre, correo y mensaje; *shake* de 400 ms si falta algún campo; terminal de éxito "VAULT-OS // TERMINAL" con el nombre en mayúsculas; botón "ENVIAR OTRO MENSAJE" que reinicia el formulario.
- Estados nuevos con el mismo estilo terminal: **enviando** (botón deshabilitado, texto "TRANSMITIENDO…") y **error** (líneas `[ERROR] …` y botón "REINTENTAR" que conserva lo escrito).
- Envío con Resend desde una Server Action (`app/acerca/actions.ts`), con:
  - Validación en servidor: los tres campos obligatorios tras `trim()`, formato de correo válido y límites de longitud (nombre ≤ 80, correo ≤ 254, mensaje ≤ 2000 caracteres).
  - `replyTo` con el correo del usuario, para responder desde la bandeja.
  - Honeypot: campo oculto `website`; si llega con valor, la acción responde éxito sin enviar nada.
- Destinatario `ja.garcia.gonzalez2014@gmail.com`, configurado por variable de entorno, nunca en el código.
- Nav: enlace "Acerca de" (`/acerca`) tras "Salón de la Fama", con estado activo; también en el menú móvil.
- Reutilizar `Reveal` (SPEC 02) para las clases `reveal` del template.
- Dependencia nueva: `resend`.
- Estilos con Tailwind y tokens existentes; en `app/globals.css` solo lo que Tailwind no expresa (animación del divisor, `tip-led`, terminal, `shake`, `caret`), tras comparar con `references/templates/home-about/styles.css`. Si algún selector ya existe en la copia sin capa de `globals.css`, reutilizarlo.
- Textos en español, como el template.

**Fuera de alcance (para futuras specs):**

- Correo de confirmación al usuario.
- Guardar los mensajes en base de datos o en `localStorage`.
- Límite de envíos por IP o CAPTCHA (solo honeypot).
- Dominio propio verificado en Resend (se usa el remitente de pruebas).
- Plantilla HTML elaborada del correo (se envía texto plano).
- Enlace a `/acerca` en el footer o en la landing.
- Pruebas automatizadas (no hay test runner).
- Copiar `styles.css` entero a `globals.css`.

---

## Modelo de datos

Esta feature no introduce datos persistentes. Solo define el contrato de la Server Action:

```ts
// app/acerca/actions.ts
export type ContactState =
  | { status: "idle" }
  | { status: "ok"; name: string }
  | { status: "error"; message: string };

// sendContact(prev: ContactState, formData: FormData): Promise<ContactState>
// campos de formData: name, email, msg, website (honeypot)
```

Variables de entorno (en `.env.local`, ya ignorado por `.gitignore`):

| Variable | Obligatoria | Valor |
| -------- | ----------- | ----- |
| `RESEND_API_KEY` | Sí | API key de Resend |
| `CONTACT_TO_EMAIL` | Sí | `ja.garcia.gonzalez2014@gmail.com` |
| `CONTACT_FROM_EMAIL` | No | Por defecto `Arcade Vault <onboarding@resend.dev>` |

Convenciones:

- Asunto del correo: `[Arcade Vault] Mensaje de <nombre>`.
- Cuerpo en texto plano con nombre, correo y mensaje.
- Si falta `RESEND_API_KEY` o `CONTACT_TO_EMAIL`, la acción devuelve `error` con un mensaje genérico y registra la causa con `console.error` en servidor; nunca expone la clave ni el detalle al cliente.

---

## Plan de implementación

Cada paso deja la app ejecutable (`npm run dev`) y se puede commitear solo.

1. Leer en `node_modules/next/dist/docs/` las guías `01-app/02-guides/forms.md`, `environment-variables.md` y la de Server Actions con `cacheComponents`; leer también la documentación de Resend (`resend.emails.send`). Sin cambios en el repo.
2. Instalar la dependencia (`npm install resend`) y crear `.env.local` con `RESEND_API_KEY` (la pone el usuario) y `CONTACT_TO_EMAIL`. Verificación: `npx tsc --noEmit` sin errores y `.env.local` no aparece en `git status`.
3. Crear `app/acerca/actions.ts` con `sendContact`: honeypot, validación, envío con Resend (`replyTo`, asunto y texto plano) y manejo de errores. Verificación: `npx tsc --noEmit` sin errores.
4. Añadir a `app/globals.css` solo los estilos que falten (divisor, `tip-led`, terminal, `shake`, `caret`) tras comparar con `styles.css` del template. Verificación: la app compila.
5. Crear `app/_components/about/` con `highlight-icon.tsx` (3 iconos SVG, Server Component) y `contact-form.tsx` (cliente, `useActionState` con `sendContact`, estados idle, enviando, éxito y error, *shake* en cliente).
6. Crear `app/acerca/page.tsx` (Server Component) con la sección "Acerca de", el divisor y la sección "Contacto" envueltos en `Reveal`. Verificación: `/acerca` se ve igual que el template.
7. Añadir "Acerca de" a `LINKS` en `app/_components/nav.tsx` (el `isActive` genérico por prefijo ya sirve). Verificación: el enlace aparece en escritorio y menú móvil y se marca activo en `/acerca`.
8. Actualizar `CLAUDE.md` (rutas, Server Action de contacto, variables de entorno). Verificación: el documento refleja `/acerca` y las tres variables.

---

## Criterios de aceptación

- [X] `npx tsc --noEmit` y `npx eslint app` terminan sin errores.
- [X] `/acerca` responde 200 y muestra, en orden: "ACERCA DE ARCADE VAULT", los 3 destacados (corazón, navegador, planta), el divisor con 24 píxeles y la sección "CONTÁCTANOS" con 3 tips y el formulario.
- [X] Los textos coinciden literalmente con `about.jsx`.
- [X] El Nav muestra "Acerca de" tras "Salón de la Fama"; en `/acerca` solo ese enlace está activo, en escritorio y en el menú móvil.
- [X] Enviar con cualquier campo vacío (o solo espacios) activa el *shake* durante 400 ms y no llama a la Server Action.
- [X] Con datos válidos y `RESEND_API_KEY` correcta, llega un correo a `ja.garcia.gonzalez2014@gmail.com` con asunto `[Arcade Vault] Mensaje de <nombre>`, el mensaje en el cuerpo y `Reply-To` igual al correo escrito.
- [X] Tras el envío se muestra la terminal con "MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, <NOMBRE EN MAYÚSCULAS>."; "ENVIAR OTRO MENSAJE" vuelve al formulario vacío.
- [X] Mientras se envía, el botón está deshabilitado y dice "TRANSMITIENDO…".
- [X] Con una API key inválida o sin `RESEND_API_KEY`, se muestra el estado de error con "REINTENTAR", se conserva lo escrito y el mensaje no contiene la clave ni el detalle del proveedor.
- [X] Un correo sin formato válido, o un campo por encima del límite, es rechazado por el servidor aunque se salte la validación del cliente.
- [X] Con el campo oculto `website` relleno, la acción responde éxito y no se envía ningún correo (no aparece en el panel de Resend).
- [X] `RESEND_API_KEY` no aparece en el HTML, en los bundles del cliente ni en `git status`/`git diff`.
- [X] Solo `contact-form.tsx` (además de los componentes cliente previos) añade `"use client"`; `page.tsx` y `highlight-icon.tsx` no.
- [X] La consola del navegador no muestra errores ni avisos de hidratación en `/acerca`.
- [X] A 375 px no hay scroll horizontal en `/acerca`.
- [X] En capturas desktop y móvil, estructura, tipografías y colores neón coinciden con el template.
- [X] Ningún archivo bajo `app/` importa de `references/`.

---

## Decisiones

- **Sí:** ruta `/acerca`, coherente con `/biblioteca`, `/acceso` y `/salon`. **No:** `/about`, que rompe la convención en español aunque coincida con el template.
- **Sí:** Server Action con `useActionState`. La API key queda solo en servidor y no hay endpoint público que mantener. **No:** Route Handler `/api/contacto`, que añade fetch manual y un endpoint abierto sin necesitarlo.
- **Sí:** destinatario y remitente por variables de entorno. Cambiar de correo o de dominio no toca el código ni expone el correo personal en el repositorio.
- **Sí:** remitente por defecto `onboarding@resend.dev`. El usuario no indicó dominio propio; en modo pruebas Resend solo entrega al correo de la cuenta, así que la cuenta de Resend debe estar registrada con `ja.garcia.gonzalez2014@gmail.com`. Decisión por defecto, a revisar si se verifica un dominio.
- **Sí:** `Reply-To` con el correo del usuario. **No:** usarlo como `from`, porque Resend solo permite remitentes verificados.
- **Sí:** validación en servidor además del *shake* en cliente. El cliente es solo experiencia; el servidor es la barrera real.
- **Sí:** honeypot. Frena bots simples sin dependencias ni fricción. **No:** CAPTCHA ni límite por IP, que merecen su propia spec si aparece spam.
- **No:** correo de confirmación al usuario. Duplica el uso de cuota y abre la puerta a usar el formulario para enviar correo a terceros.
- **Sí:** estados "enviando" y "error" con estilo terminal. Son necesarios para un envío real y no existen en el template; se diseñan con `/frontend-design` sin alterar el resto del diseño.
- **Sí:** texto plano en el correo. **No:** plantilla HTML o React Email, innecesaria para un aviso interno.
- **Sí:** página como Server Component y solo el formulario como cliente.
- **Sí:** el enlace "Acerca de" entra al Nav en esta spec, como anticipó la SPEC 02.

---

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| En modo pruebas Resend rechaza destinatarios distintos al correo de la cuenta. | Registrar la cuenta con `ja.garcia.gonzalez2014@gmail.com` o verificar un dominio y definir `CONTACT_FROM_EMAIL`; el error se registra en servidor. |
| El correo cae en spam con el remitente `onboarding@resend.dev`. | Aceptado para el MVP; revisar la carpeta de spam al verificar. Dominio propio en otra spec. |
| Formulario público sin límite de envíos: abuso de la cuota gratuita. | Honeypot y límites de longitud ahora; límite por IP o CAPTCHA en otra spec si hace falta. |
| `cacheComponents` puede afectar a la página o a `useActionState`. | El paso 1 obliga a leer las guías; la página es estática y toda la lógica dinámica vive en la Server Action. |
| `RESEND_API_KEY` ausente en un entorno nuevo. | Respuesta de error genérica y `console.error` en servidor; documentada en `CLAUDE.md` (paso 8). |

---

## Lo que **no** entra en esta spec

- Correo de confirmación al usuario.
- Persistencia de mensajes (base de datos o `localStorage`).
- CAPTCHA o límite de envíos por IP.
- Dominio propio verificado en Resend.
- Plantillas HTML del correo.
- Autenticación, backend o juegos reales.
- Pruebas automatizadas.

Cada uno de estos puntos, si se aborda, va en su propia spec.
