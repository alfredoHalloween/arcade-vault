# SPEC 02 — Home page (landing) y biblioteca en `/biblioteca`

> **Estado:** Implementado
> **Depende de:** SPEC 01 (`01-mvp-pantallas-visuales.md`)
> **Reemplaza a:** `01-home-page.md` (obsoleta: asumía el scaffold de Create Next App)
> **Fecha:** 2026-10-26
> **Objetivo:** Implementar la landing de `references/templates/home-about/home.jsx` en `/` y mover la biblioteca actual a `/biblioteca`, con datos ficticios en `app/data/`.

---

## Por qué existe esta spec

La spec `01-home-page.md` se escribió cuando el proyecto era el scaffold de Create Next App. Ya no lo es: el MVP visual (`01-mvp-pantallas-visuales.md`) está implementado y hoy `/` es la biblioteca, el Nav vive en `app/_components/nav.tsx` con Tailwind y los datos en `app/data/`. Esta spec adapta la landing del template a ese estado real, en lugar de copiar `styles.css` o crear `lib/mock-data.ts`.

El template (`home.jsx`, `nav.jsx`) sitúa la landing en `/` y la biblioteca aparte; por eso la biblioteca actual pasa a `/biblioteca`.

---

## Alcance

**Dentro:**

- Nueva landing en `app/page.tsx` con las secciones del template, en este orden: Hero (con siluetas flotantes), ¿Por qué Arcade Vault?, Juegos disponibles ahora, Stats, Actividad en vivo, Precios (con FAQ) y CTA final.
- Mover la biblioteca actual (hero + `LibraryBrowser`) a `app/biblioteca/page.tsx`, sin cambiar su comportamiento.
- Nav: añadir el enlace "Inicio" (`/`) y apuntar "Biblioteca" a `/biblioteca`, con estados activos correctos.
- Actualizar los enlaces y redirecciones internas que hoy apuntan a `/` esperando la biblioteca (ver plan, paso 2).
- Datos ficticios nuevos en `app/data/activity.ts`; tipos añadidos a `app/data/types.ts`. Los 6 juegos salen de `GAMES` (`slice(0, 6)`).
- Animación reveal-on-scroll (`IntersectionObserver`) como componente cliente `app/_components/reveal.tsx`.
- Componentes de la home en `app/_components/home/`; Server Components salvo `Reveal`.
- Estilos con utilidades Tailwind (tokens ya existentes en `@theme`); en `app/globals.css` solo lo que Tailwind no expresa (siluetas flotantes, `keyframes` que falten, transición `reveal`).
- Textos en español, como el template.

**Fuera de alcance (para futuras specs):**

- Página `/about`, formulario de contacto y `about.jsx`. El enlace "Acerca de" **no** se añade al Nav hasta que exista esa spec.
- Autenticación real, créditos reales, puntuaciones o ranking reales, backend.
- Juegos jugables.
- Reescribir la biblioteca, el detalle, el reproductor, el acceso o el Salón más allá de cambiar sus enlaces a `/`.
- Copiar `references/templates/home-about/styles.css` a `globals.css`.
- Pruebas automatizadas (no hay test runner).

---

## Modelo de datos

Tipos añadidos a `app/data/types.ts`:

```ts
export type RecentScore = {
  player: string;
  gameId: string;     // Game.id; el título se resuelve contra GAMES
  score: number;
  ago: string;        // texto ya formateado, p. ej. "hace 2 min"
  color: GameColor;
};

export type TopPlayer = { rank: number; player: string; score: number };
```

Archivo nuevo `app/data/activity.ts`:

- `RECENT_SCORES: RecentScore[]` (7 filas) con los jugadores, puntuaciones, tiempos y colores de `home.jsx`; `gameId` mapea los nombres del template a ids existentes: Caída → `caida`, Glotón → `gloton`, Invasores → `invasores`, Rocas → `rocas`, Bloque Buster → `bloque-buster`, Serpentina → `serpentina`, Ranaria → `ranaria`.
- `TOP_PLAYERS: TopPlayer[]` (5 filas) con los valores de `home.jsx`.

Convenciones:

- Los números se formatean con `toLocaleString("es-ES")`.
- Los textos de features, stats, precios y FAQ viven como constantes dentro de su componente (no son datos que vayan a venir de BD).
- Nada se persiste; esta spec no toca `localStorage`.

---

## Plan de implementación

Cada paso deja la app ejecutable (`npm run dev`) y se puede commitear solo.

1. Leer en `node_modules/next/dist/docs/` las guías de `cacheComponents`, `next/link` y `usePathname` antes de escribir código Next.js. Sin cambios en el repo.
2. Mover la biblioteca: crear `app/biblioteca/page.tsx` con el contenido actual de `app/page.tsx`; en `app/page.tsx` dejar un título provisional. Actualizar `app/_components/nav.tsx` (`LINKS`: Inicio `/`, Biblioteca `/biblioteca`, Salón `/salon`; `isActive` para que Inicio solo coincida con `/` y Biblioteca con `/biblioteca` y `/juegos*`), y los enlaces a la biblioteca en `hall-of-fame.tsx`, `game-player.tsx`, `app/juegos/[id]/page.tsx` y las redirecciones de `auth-form.tsx` (pasan de `/` a `/biblioteca`). El logo sigue apuntando a `/`. Verificación: `/biblioteca` muestra la biblioteca con filtros; "VOLVER AL VAULT" y el login llevan a `/biblioteca`; el Nav marca el enlace correcto en cada ruta.
3. Añadir `RecentScore` y `TopPlayer` a `app/data/types.ts` y crear `app/data/activity.ts`. Verificación: `npx tsc --noEmit` sin errores.
4. Añadir a `app/globals.css` solo lo que falte tras comparar con `references/templates/home-about/styles.css`: estilos de `.silo` (flotante), `keyframes` `float` y `bounce` si no existen, y la transición `.reveal` / `.reveal.in`. Comprobar que `.cover-bg` y `cover-*` ya existen. Verificación: `npm run dev` arranca y las pantallas actuales no cambian.
5. Crear `app/_components/reveal.tsx` (`"use client"`): wrapper que añade la clase `in` con `IntersectionObserver` (threshold 0.12) y desobserva tras activarse. Verificación: aislado, sin uso aún.
6. Crear `app/_components/home/floating-silhouettes.tsx` y `feature-icon.tsx` (SVG pixel art portados de `home.jsx`).
7. Crear `app/_components/home/hero.tsx` (eyebrow, título de tres líneas, subtítulo, CTAs a `/biblioteca` y `/acceso`, indicador "DESLIZA") y `mini-card.tsx` (`Link` a `/juegos/${id}` con portada `cover-bg`).
8. Crear `why-section.tsx`, `games-preview.tsx`, `stats-section.tsx`, `activity-section.tsx` (últimas puntuaciones y top jugadores con barras), `pricing-section.tsx` y `final-cta.tsx`, cada una envuelta en `Reveal` y con la cabecera de sección `// 0N` del template.
9. Sustituir `app/page.tsx` por la composición completa. Verificación visual con Playwright (desktop y 375 px) contra `references/templates/home-about/arcade-vault-standalone.html`, guardando capturas en `.playwright-screenshots/`.
10. Actualizar `CLAUDE.md` (rutas: `/` landing, `/biblioteca` biblioteca) y marcar `specs/01-home-page.md` como "Obsoleta (reemplazada por 02-home-page.md)".

---

## Criterios de aceptación

- [ ] `npm run build` termina sin errores.
- [ ] `npx eslint app` termina sin errores (`npm run lint` sigue fallando solo por `references/`, ya conocido).
- [ ] `/` responde 200 y muestra las 7 secciones en este orden: Hero, ¿Por qué Arcade Vault?, Juegos disponibles ahora, Stats, Actividad en vivo, Precios, CTA final.
- [ ] `/biblioteca` responde 200 y se comporta como la antigua `/`: 8 juegos, buscador, chips de categoría y estado "NO HAY RESULTADOS".
- [ ] La sección "Juegos disponibles ahora" muestra exactamente 6 tarjetas (los 6 primeros de `GAMES`), cada una enlazando a `/juegos/<id>` con su portada `cover-*`.
- [ ] "Últimas puntuaciones" muestra 7 filas y "Top jugadores · hoy" 5, con puntuaciones en formato `es-ES` y la fila #1–#3 con el estilo destacado del template.
- [ ] Todas las filas de actividad muestran un título de juego existente en `GAMES`.
- [ ] El Nav muestra Inicio, Biblioteca y Salón de la Fama (sin "Acerca de"); en `/` solo Inicio está activo, en `/biblioteca` y `/juegos/<id>` solo Biblioteca.
- [ ] Los CTAs "Explorar juegos", "Ver todos los juegos" e "Insertar moneda" enlazan a `/biblioteca`; "Crear cuenta" y "Empezar gratis" a `/acceso`; "Ver salón" a `/salon`.
- [ ] Ningún enlace interno de la app apunta a `/` esperando la biblioteca: "VOLVER AL VAULT", "VOLVER A LA BIBLIOTECA" y las redirecciones tras login/invitado llevan a `/biblioteca`.
- [ ] Las secciones con `Reveal` se renderizan sin la clase `in` y la reciben al entrar en el viewport.
- [ ] Solo `reveal.tsx` (además de los componentes cliente previos) añade `"use client"`; ningún archivo de `app/_components/home/` lo contiene.
- [ ] La consola del navegador no muestra errores ni avisos de hidratación en `/` ni en `/biblioteca`.
- [ ] A 375 px no hay scroll horizontal en `/` y el menú móvil sigue abriendo y cerrando.
- [ ] En capturas desktop y móvil, la estructura, tipografías, colores neón y orden de secciones coinciden con el template.
- [ ] Ningún archivo bajo `app/` importa de `references/`.

---

## Decisiones

- **Sí:** nueva spec 02 que reemplaza a `01-home-page.md`. La anterior parte de supuestos falsos (scaffold, `lib/mock-data.ts`, CSS copiado) y el repo ya tiene dos specs con número 01.
- **No:** sobrescribir o conservar como válida la `01-home-page.md`.
- **Sí:** mover la biblioteca a `/biblioteca` y poner la landing en `/`, como el template. Consecuencia aceptada: tocar el Nav y cinco enlaces/redirecciones.
- **No:** landing en `/inicio` ni sustituir la biblioteca. Se aparta del template o pierde la pantalla.
- **Sí:** las redirecciones tras login e invitado van a `/biblioteca`, para conservar el comportamiento actual (el usuario aterriza en los juegos). Esto cambia el criterio de la SPEC 01 ("redirige a `/`"), que queda superado por esta spec.
- **Sí:** reutilizar `GAMES` para la vista previa y `gameId` en la actividad. Los nombres del template (incluido "Ranaria") existen en `GAMES`. Diferencia visible aceptada: los títulos salen en mayúsculas ("CAÍDA"), como en el resto de la app.
- **No:** copiar los datos del template como cadenas sueltas (se desincronizan de `GAMES`).
- **Sí:** datos nuevos en `app/data/activity.ts`, junto a `games.ts` y `scores.ts`, siguiendo la convención de la SPEC 01.
- **No:** `lib/mock-data.ts` (carpeta nueva sin precedente en el repo).
- **Sí:** Tailwind para la home y CSS en `globals.css` solo para efectos, como pide `CLAUDE.md` y se hizo en la SPEC 01.
- **No:** copiar `styles.css` entero: mezclaría dos sistemas de estilos.
- **Sí:** `/about` y contacto en otra spec; el Nav no enlaza a una ruta inexistente.
- **No:** añadir "Acerca de" al Nav con un 404 temporal.
- **Sí:** Home como Server Component; `Reveal` es el único componente cliente nuevo.
- **No:** convertir toda la home a cliente como el prototipo.
- **Sí:** el diseño de UI usa `/frontend-design` (CLAUDE.md) sin alterar el diseño del template.

---

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| Quedan enlaces a `/` que esperaban la biblioteca. | Paso 2 los lista; criterio de aceptación explícito y `grep` de `href="/"` y `push("/")` al terminar. |
| Mismatch de hidratación por formato de números o por la clase `in` del reveal. | Locale fijo `es-ES`; `Reveal` añade `in` solo dentro de un efecto. |
| `cacheComponents` exige cuidado con `usePathname` y APIs dinámicas al reorganizar rutas. | Paso 1 obliga a leer la guía; el Nav ya funciona hoy con `usePathname`, no se cambia su estructura. |
| Estilos del template ya parcialmente en `globals.css` (clases `neon-*`, `btn`, `cover-*`) y reglas duplicadas. | Paso 4 compara selector por selector y añade solo lo que falta. |
| El contenido de `reveal` oculto (`opacity: 0`) hace que capturas y SEO vean secciones vacías sin JS. | Aceptado para el MVP visual; verificar en Playwright haciendo scroll antes de capturar. |

---

## Lo que **no** entra en esta spec

- Página `/about` y formulario de contacto.
- Autenticación real, créditos reales, puntuaciones y ranking reales, backend.
- Juegos jugables.
- Rediseño de las pantallas existentes.
- Tests automatizados.

Cada uno de estos puntos, si se aborda, va en su propia spec.
