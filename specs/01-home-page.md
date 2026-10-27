# SPEC 01 — Home page y Nav global

> **Status:** Obsoleta (reemplazada por `02-home-page.md`)
> **Depends on:** Ninguna
> **Date:** 2026-10-26
> **Objective:** Implementar en Next.js la landing `/` y la barra de navegación global de Arcade Vault, fieles al template `references/templates/home-about/`, con datos mock tipados.

---

## Por qué existe este spec

El proyecto sigue siendo el scaffold de Create Next App. El diseño ya existe como prototipo React en `references/templates/home-about/` (`home.jsx`, `nav.jsx`, `styles.css`). Este spec lo traslada a App Router sin rediseñarlo. `app/layout.tsx` ya carga las fuentes (`--font-press-start`, `--font-jetbrains-mono`, `--font-courier-prime`) y los fondos `av-bg` / `av-noise`, y `app/globals.css` ya incluye las variables y los estilos base y de nav del template; solo faltan los estilos de la home.

---

## Scope

**In:**

- Reemplazar `app/page.tsx` por la home con las secciones del template: Hero (con siluetas flotantes), ¿Por qué Arcade Vault?, Juegos disponibles ahora, Stats, Actividad en vivo, Precios (con FAQ) y CTA final.
- Componente `Nav` global (links, contador de créditos, botón de sesión, menú móvil) montado en `app/layout.tsx`.
- Estilos de la home, copiados de `references/templates/home-about/styles.css` a `app/globals.css`, solo las reglas que falten (sin duplicar las existentes).
- Datos mock tipados en `lib/mock-data.ts`.
- Animación reveal-on-scroll (IntersectionObserver) y menú móvil como únicos client components.
- Links reales con `next/link` hacia rutas futuras: `/biblioteca`, `/biblioteca/[id]`, `/salon`, `/auth`, `/about`.

**Out of scope (para specs futuros):**

- Página `/about` y formulario de contacto (`about.jsx`).
- Páginas de destino: biblioteca, detalle de juego, salón de la fama, auth. Dan 404 hasta que existan sus specs.
- Autenticación y estado de sesión real.
- Juegos jugables, puntuaciones reales, ranking real y backend.
- Reescritura a utilidades Tailwind o CSS Modules.
- Tests automatizados (no hay test runner configurado).

---

## Data model

Datos mock en `lib/mock-data.ts`. Se reemplazan cuando existan los specs de juegos y puntuaciones.

```ts
export type CoverKind = "bricks" | "tetro" | "snake" | "glot" | "invaders" | "rocas";
export type NeonColor = "cyan" | "magenta" | "yellow" | "green";

export type Game = {
  id: string;        // slug usado en /biblioteca/[id]
  title: string;
  cat: string;       // categoría mostrada en la tarjeta
  cover: CoverKind;  // clase CSS: `cover-${cover}`
};

export type RecentScore = {
  player: string;
  game: string;
  score: number;
  ago: string;       // texto ya formateado, p. ej. "hace 2 min"
  color: NeonColor;
};

export type TopPlayer = { rank: number; player: string; score: number };
```

Valores iniciales:

- `GAMES` (6): `bloque-buster` Bloque Buster / Rompe-ladrillos / `bricks`; `caida` Caída / Puzzle / `tetro`; `serpentina` Serpentina / Clásico / `snake`; `gloton` Glotón / Laberinto / `glot`; `invasores` Invasores / Disparos / `invaders`; `rocas` Rocas / Espacio / `rocas`. Las categorías son propuestas (el template no incluye el array `GAMES`); se revisan al aprobar el spec.
- `RECENT_SCORES` (7) y `TOP_PLAYERS` (5): los mismos valores que `home.jsx`.

Convenciones:

- Los números se formatean con `toLocaleString("es-ES")`.
- Los textos de features, stats, precios y FAQ viven como constantes dentro de sus componentes (no cambian con datos).
- Contenido en español, igual que el template.

---

## Implementation plan

1. Crear `lib/mock-data.ts` con los tipos y las constantes `GAMES`, `RECENT_SCORES`, `TOP_PLAYERS`. Verificación: `npx tsc --noEmit` sin errores.
2. Copiar a `app/globals.css` las reglas de `styles.css` que falten (hero, `home-*`, `feature-card`, `mini-*`, `stats`, `activity`, `top-*`, `price-*`, `faq-*`, `home-final`, `reveal`, `fade-in`, `silo`, covers `cover-*`). Verificación: `npm run dev` arranca y la home actual sigue renderizando.
3. Crear `components/nav.tsx` (`"use client"`): links con `next/link`, estado activo con `usePathname`, contador "CRÉDITOS · 03" fijo, botón "Iniciar Sesión" fijo hacia `/auth`, menú móvil con backdrop. Montarlo en `app/layout.tsx` dentro de `#root`, antes de `children`. Verificación: el nav aparece en `/` y el menú móvil abre y cierra.
4. Crear `components/reveal.tsx` (`"use client"`): wrapper que aplica la clase `in` con IntersectionObserver (threshold 0.12) a su sección. Verificación: aislado, sin uso aún.
5. Crear `components/home/floating-silhouettes.tsx` y `components/home/feature-icon.tsx` (SVG de pixel art, Server Components) portados de `home.jsx`.
6. Crear `components/home/mini-card.tsx` (`Link` a `/biblioteca/${id}`) y `components/home/hero.tsx` con los CTAs hacia `/biblioteca` y `/auth`.
7. Crear las secciones `why-section.tsx`, `games-preview.tsx`, `stats-section.tsx`, `activity-section.tsx`, `pricing-section.tsx` y `final-cta.tsx` en `components/home/`, cada una envuelta en `Reveal` (excepto Hero).
8. Reemplazar `app/page.tsx` por la composición de todas las secciones y eliminar el contenido del scaffold. Verificación visual con Playwright (desktop y móvil) contra `references/templates/home-about/arcade-vault-standalone.html`.

---

## Acceptance criteria

- [ ] `npm run build` termina sin errores de TypeScript ni de lint.
- [ ] `/` responde 200 y no queda contenido del scaffold de Create Next App (logo de Next.js, "To get started").
- [ ] La home muestra las 7 secciones en este orden: Hero, ¿Por qué Arcade Vault?, Juegos disponibles ahora, Stats, Actividad en vivo, Precios, CTA final.
- [ ] La sección de juegos muestra exactamente 6 tarjetas con las portadas `cover-*` correspondientes.
- [ ] "Últimas puntuaciones" muestra 7 filas y "Top jugadores · hoy" muestra 5, con puntuaciones formateadas en `es-ES`.
- [ ] El Nav aparece en `/` con los links Inicio, Biblioteca, Salón de la Fama y Acerca de; "Inicio" está marcado como activo.
- [ ] En ancho ≤ 768 px los links del Nav se ocultan, aparece el botón `≡` y al pulsarlo se abre el panel móvil; pulsar el backdrop lo cierra.
- [ ] Los CTAs "Explorar juegos", "Crear cuenta", "Ver todos los juegos", "Empezar gratis" e "Insertar moneda" son enlaces `<a>` con `href` a `/biblioteca` o `/auth`.
- [ ] Cada tarjeta de juego enlaza a `/biblioteca/<id>` del juego.
- [ ] Las secciones con `Reveal` empiezan sin la clase `in` y la reciben al entrar en el viewport.
- [ ] Solo `nav.tsx` y `reveal.tsx` contienen `"use client"`.
- [ ] La consola del navegador no muestra errores ni warnings de hidratación en `/`.
- [ ] En capturas desktop y móvil, el layout coincide con el template (misma estructura, tipografías, colores neón y orden de secciones).

---

## Decisions

- **Sí:** alcance solo Home + Nav. `/about` va en su propio spec para mantener una sola idea por spec.
- **No:** incluir `/about` ni formulario de contacto aquí.
- **Sí:** CSS del template copiado a `globals.css`. Garantiza fidelidad visual y reutiliza las variables ya definidas.
- **No:** reescribir a utilidades Tailwind. Alto riesgo de divergir del diseño y mucho más trabajo.
- **No:** CSS Modules. Habría que reescribir selectores y variables compartidas con el nav y los covers.
- **Sí:** Home como Server Component; solo `Nav` y `Reveal` son client. El resto es contenido estático.
- **No:** todo client component como en el prototipo. Pierde los beneficios de RSC sin necesidad.
- **Sí:** datos en `lib/mock-data.ts` con tipos. Facilita reemplazarlos por datos reales después.
- **No:** arrays inline por componente ni route handler con JSON. Lo primero dificulta el reemplazo; lo segundo es sobreingeniería sin backend.
- **Sí:** links reales (`next/link`) a rutas aún inexistentes. La estructura de navegación queda lista; el 404 es temporal y aceptado.
- **No:** href `#` o páginas placeholder (amplía el alcance a más archivos).
- **Sí:** Nav con "Iniciar Sesión" y "CRÉDITOS · 03" estáticos. No hay auth ni créditos reales; el estado de sesión va en el spec de auth.
- **Sí:** los 6 juegos y sus categorías se derivan de los covers del CSS y de los nombres de la actividad, porque `GAMES` no está en el template. Las categorías son propuestas pendientes de revisión.
- **Sí:** antes de escribir código Next.js, leer las guías relevantes en `node_modules/next/dist/docs/` (`AGENTS.md`), en especial `cacheComponents`, `next/link` y `usePathname`.
- **Sí:** el diseño de UI usa `/frontend-design` (CLAUDE.md), sin alterar el diseño del template.

---

## Risks

| Riesgo | Mitigación |
| ------ | ---------- |
| Reglas CSS duplicadas o conflictivas al fusionar `styles.css` con `globals.css` | Comparar selector por selector y copiar solo los que falten; verificar visualmente el nav y el fondo tras el paso 2. |
| `cacheComponents` exige envolver en `<Suspense>` APIs dinámicas como `usePathname` | Leer la guía de `cacheComponents`; si `Nav` lo requiere, envolverlo en `<Suspense>` en el layout. |
| Mismatch de hidratación por formato de números o por la clase `in` del reveal | Formatear números siempre con locale fijo `es-ES`; aplicar `in` solo en `useEffect`. |
| Categorías de los juegos inventadas | Quedan explícitas en este spec; se corrigen al aprobar. |

---

## What is **not** in this spec

- Página `/about` y formulario de contacto.
- Biblioteca, detalle de juego, salón de la fama y auth.
- Autenticación, sesión real y contador de créditos real.
- Juegos jugables, puntuaciones y ranking reales, y backend.
- Tests automatizados.

Cada uno de estos puntos, si se hace, va en su propio spec.
