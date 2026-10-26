# SPEC 01 — MVP visual de Arcade Vault (todas las pantallas)

> **Estado:** Aprobado
> **Depende de:** ninguna
> **Fecha:** 2026-10-26
> **Objetivo:** Implementar en Next.js las cinco pantallas de `references/templates/` (biblioteca, detalle, reproductor, acceso y salón de la fama) con datos ficticios y sin ningún juego real.

---

## Por qué existe esta spec

El diseño ya existe como prototipo (React UMD + Babel, SPA con hash) en `references/templates/`. Esta spec lo traslada a la arquitectura real del proyecto (App Router, Tailwind v4, TypeScript) para tener una base visual sobre la que construir juegos, puntuaciones reales y cuentas en specs posteriores.

Los datos viven en `app/data/` como módulos aislados para poder sustituirlos más adelante por consultas a una base de datos sin tocar las pantallas.

---

## Alcance

**Dentro:**

- Cinco pantallas con rutas reales del App Router:
  - `/` — Biblioteca (hero, búsqueda por nombre, chips de categoría, rejilla de tarjetas, estado vacío).
  - `/juegos/[id]` — Detalle del juego (portada, etiquetas, descripción, estadísticas, tabla de mejores puntuaciones, botones).
  - `/juegos/[id]/jugar` — Reproductor placeholder (HUD, pausa, FIN, pantalla CRT decorativa, modal de fin de juego con guardado de puntuación).
  - `/acceso` — Iniciar sesión / crear cuenta / jugar como invitado.
  - `/salon` — Salón de la Fama (pestañas por juego, podio, tabla, "tu mejor marca" si hay sesión).
- Layout compartido: barra de navegación (logo, enlaces, contador de créditos, botón de sesión, menú móvil con panel lateral), fondo (cuadrícula en perspectiva, scanlines, viñeta) y pie de página.
- Datos ficticios en `app/data/` (juegos, categorías, jugadores y generador de puntuaciones sembrado).
- Sesión simulada en `localStorage` (`av_user`) y guardado simulado de puntuaciones (`av_scores`), igual que el prototipo.
- Tokens del tema (colores, fuentes) extraídos de `references/templates/styles.css` a `@theme` en `app/globals.css`; componentes con utilidades Tailwind.
- Efectos que Tailwind no cubre (portadas `cover-*`, scanlines, CRT, `keyframes`) como CSS en `app/globals.css`.
- Fuentes Press Start 2P y JetBrains Mono cargadas con `next/font/google`.
- Diseño responsive: el menú hamburguesa y las rejillas se adaptan como en el prototipo.
- Textos en español, como en el prototipo.

**Fuera de alcance (para futuras specs):**

- Cualquier juego real (lógica, canvas, controles). El reproductor es solo un placeholder con puntuación simulada.
- Autenticación real (contraseñas, OAuth con Google/GitHub, sesiones en servidor). Los botones sociales son decorativos.
- Base de datos, API o Server Actions. Los datos salen de módulos TypeScript.
- Puntuaciones reales compartidas entre usuarios. Lo guardado en `av_scores` no aparece en las tablas.
- Pruebas automatizadas (el proyecto no tiene test runner).
- Internacionalización, SEO avanzado, analítica, accesibilidad más allá de HTML semántico y `aria-label` básicos.
- Sistema de créditos funcional: "CRÉDITOS · 03" es texto fijo.

---

## Modelo de datos

Tipos en `app/data/types.ts`:

```ts
export type GameColor = "cyan" | "magenta" | "yellow" | "green";
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";

export type Game = {
  id: string;            // slug de la URL, p. ej. "bloque-buster"
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string;         // clase CSS de portada, p. ej. "cover-bricks"
  color: GameColor;      // color del botón JUGAR en la tarjeta
  best: number;          // mejor puntuación global
  plays: string;         // p. ej. "12.4K"
};

export type ScoreRow = {
  rank: number;
  name: string;
  score: number;
  date: string;          // "DD/MM/2026"
};

export type SessionUser = { name: string }; // máx. 10 caracteres, en mayúsculas

export type SavedScore = { game: string; score: number; name: string; at: number };
```

Archivos de datos:

- `app/data/types.ts` — tipos anteriores.
- `app/data/games.ts` — `GAMES` (los 8 juegos del prototipo, mismo contenido) y `CATEGORIES = ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"]`.
- `app/data/scores.ts` — `PLAYERS` y `seededScores(seed, count)`, portado sin cambios de comportamiento desde `data.jsx`.

Persistencia en `localStorage`:

- `av_user`: `SessionUser` serializado, o ausente si no hay sesión.
- `av_scores`: arreglo de `SavedScore`.

Convenciones:

- Los números se formatean con `toLocaleString("es-ES")`.
- La ruta del reproductor y del detalle usan `Game.id`; un `id` inexistente devuelve 404 (`notFound()`).
- La lectura de `localStorage` ocurre solo en el cliente y siempre dentro de `try/catch`.

---

## Plan de implementación

Cada paso deja la app ejecutable (`npm run dev`) y se puede commitear solo.

1. Leer en `node_modules/next/dist/docs/` las guías de rutas dinámicas, `generateStaticParams`, `cacheComponents` y `next/font` antes de escribir código Next.js. Sin cambios en el repo.
2. Crear `app/data/types.ts`, `app/data/games.ts` y `app/data/scores.ts` portando `data.jsx` a TypeScript. Verificación: `npm run lint` y `npx tsc --noEmit` sin errores.
3. Migrar el tema: extraer variables de color y fuentes de `references/templates/styles.css` a `@theme inline` en `app/globals.css`; cargar Press Start 2P y JetBrains Mono con `next/font/google` en `app/layout.tsx`; fondo oscuro y `lang="es"`. Verificación: la página actual se ve con fondo `#0a0a0f` y texto claro.
4. Añadir a `app/globals.css` los efectos no cubiertos por Tailwind: fondo `av-bg` (cuadrícula, scanlines, viñeta), `keyframes` (`flicker`, `blink`, `pulse`, `gridscroll`, `bob`, `drift`, fade/slide-in), clases `cover-*` y estilos CRT. Verificación: lint y build sin errores.
5. Crear el proveedor de sesión cliente (`app/_components/session-provider.tsx`) con `user`, `login`, `signOut` y `saveScore`, leyendo y escribiendo `av_user` / `av_scores`. Montarlo en `app/layout.tsx`. Verificación: la app sigue renderizando.
6. Crear `app/_components/nav.tsx` (barra, enlaces activos según `usePathname`, contador de créditos, botón de sesión, panel móvil) y el pie de página; montarlos en `app/layout.tsx` con `<main>`. Sustituir el contenido de `app/page.tsx` por un título provisional. Verificación: la barra navega entre `/` y `/salon` (aún 404) y el menú móvil abre y cierra.
7. Implementar la biblioteca en `app/page.tsx`: hero, `app/_components/game-card.tsx` (efecto tilt al pasar el ratón), búsqueda y chips (componente cliente) y estado "NO HAY RESULTADOS". Verificación: filtrar por texto y categoría funciona; clic en tarjeta navega a `/juegos/[id]`.
8. Implementar `app/juegos/[id]/page.tsx` con `generateStaticParams`, `notFound()` y `app/_components/leaderboard.tsx`. Verificación: `/juegos/caida` muestra portada, estadísticas y 10 puntuaciones; `/juegos/xyz` da 404; "VOLVER AL VAULT" regresa a `/`.
9. Implementar `app/acceso/page.tsx` con pestañas, campo de correo solo en "crear cuenta", entrar, invitado y botones sociales decorativos. Verificación: entrar guarda `av_user`, redirige a `/` y la barra muestra el nombre; invitado redirige sin sesión.
10. Implementar `app/salon/page.tsx` con pestañas por juego, podio, tabla y fila "tu mejor marca" solo con sesión. Verificación: cambiar de pestaña cambia las filas; sin sesión no aparece "tu mejor marca".
11. Implementar `app/juegos/[id]/jugar/page.tsx` con HUD, pantalla CRT decorativa, puntuación simulada por intervalo, subida de nivel, pausa, FIN y modal de fin de juego (guardar puntuación, jugar de nuevo, volver al vault). Verificación: la puntuación sube sola, se detiene en pausa, FIN abre el modal y guardar escribe en `av_scores`.
12. Cerrar sesión desde el botón de la barra, retirar restos de Create Next App (`public/next.svg` si queda sin uso, metadatos del layout con título "Arcade Vault") y ajustar `README.md`/`CLAUDE.md` si describen el estado anterior.

---

## Criterios de aceptación

- [ ] `npm run lint` termina sin errores.
- [ ] `npm run build` termina sin errores.
- [ ] Existen las rutas `/`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/acceso` y `/salon`.
- [ ] La consola del navegador no muestra errores ni avisos de hidratación en ninguna de las cinco pantallas.
- [ ] La biblioteca muestra los 8 juegos del prototipo.
- [ ] Escribir "caí" en el buscador deja solo la tarjeta CAÍDA, y escribir "zzz" muestra "NO HAY RESULTADOS".
- [ ] Pulsar el chip "SHOOTER" muestra solo INVASORES y ROCAS; "TODOS" vuelve a mostrar los 8.
- [ ] Pulsar una tarjeta o su botón JUGAR navega a `/juegos/<id>` con ese juego.
- [ ] `/juegos/inexistente` y `/juegos/inexistente/jugar` devuelven 404.
- [ ] El detalle muestra portada, 4 etiquetas, descripción, 3 estadísticas y 10 filas de puntuaciones con las tres primeras destacadas.
- [ ] "JUGAR AHORA" navega a `/juegos/<id>/jugar` y "VOLVER AL VAULT" navega a `/`.
- [ ] En el reproductor la puntuación aumenta sola, "PAUSA" la detiene y muestra "EN PAUSA", y "REANUDAR" la retoma.
- [ ] "FIN" abre el modal con la puntuación final; "GUARDAR PUNTUACIÓN" añade una entrada a `av_scores` y muestra "PUNTUACIÓN GUARDADA"; "JUGAR DE NUEVO" reinicia puntuación, vidas y nivel.
- [ ] En el reproductor, "SALIR" navega a `/juegos/<id>`.
- [ ] En `/acceso`, la pestaña "CREAR CUENTA" muestra el campo de correo y "INICIAR SESIÓN" lo oculta.
- [ ] Enviar el formulario con usuario "px_kai" guarda `av_user` con `{"name":"PX_KAI"}`, redirige a `/` y la barra muestra "PX_KAI".
- [ ] "JUGAR COMO INVITADO" redirige a `/` sin crear `av_user`.
- [ ] Tras recargar la página con sesión iniciada, la barra sigue mostrando el nombre.
- [ ] Pulsar el nombre en la barra cierra la sesión y vuelve a mostrar "Iniciar Sesión".
- [ ] El Salón de la Fama muestra podio (2º, 1º, 3º), 12 filas y una pestaña por cada uno de los 8 juegos.
- [ ] En el Salón, la fila "tu mejor marca" aparece solo con sesión iniciada.
- [ ] A 375 px de ancho los enlaces de la barra se ocultan, aparece el botón "≡" y el panel móvil abre y cierra; no hay scroll horizontal.
- [ ] Las tarjetas, chips, botones y tablas usan el estilo del prototipo (colores neón y tipografías Press Start 2P / JetBrains Mono) al compararlas con `references/templates/Arcade Vault.html`.
- [ ] Ningún archivo bajo `app/` importa de `references/`.

---

## Decisiones

- **Sí:** rutas reales del App Router en lugar de SPA con hash. URLs compartibles y aprovecha Next.js.
- **No:** replicar el router por hash de `app.jsx`. Desperdicia el framework y rompe el botón atrás.
- **Sí:** rutas con nombres en español (`/juegos`, `/acceso`, `/salon`), coherentes con el idioma de la interfaz.
- **Sí:** tokens del tema a `@theme` y componentes con Tailwind. Es el enfoque idiomático del proyecto (Tailwind v4 vía Turbopack).
- **No:** portar `styles.css` entero a `globals.css`. Duplicaría el sistema de estilos. Solo se conserva como CSS lo que Tailwind no expresa bien (portadas, CRT, scanlines, `keyframes`).
- **Sí:** el `globals.css` actual es el de Create Next App y no tiene los estilos del diseño, por lo que se migran en esta spec (decisión tomada tras comprobarlo con el usuario).
- **Sí:** datos ficticios en la carpeta `app/data/` (`types.ts`, `games.ts`, `scores.ts`), separados por responsabilidad. Cada uno se podrá reemplazar por consultas a BD.
- **No:** un único `app/data.ts`. Mezcla tipos, juegos y generador.
- **Sí:** sesión y puntuaciones simuladas con `localStorage` (`av_user`, `av_scores`) como en el prototipo. Mantiene la navegación creíble sin backend.
- **No:** autenticación o persistencia reales. Pertenecen a otra spec.
- **Sí:** reproductor con puntuación simulada, pausa y modal de fin, igual que el prototipo.
- **No:** reproductor solo con marco estático. No permitiría revisar el modal ni el flujo de guardar.
- **Sí:** estado de pestañas del Salón y filtros de la biblioteca como estado local de cliente, no en la URL. Evita `useSearchParams` y sus implicaciones con `cacheComponents` en un MVP visual.
- **Sí:** `generateStaticParams` para `/juegos/[id]` y `/juegos/[id]/jugar`, porque los juegos son una lista cerrada en módulo.

---

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| `cacheComponents` en Next.js 16.4 cambia la semántica de datos y rutas dinámicas; el código puede fallar en build con APIs dinámicas. | Paso 1 obliga a leer las guías en `node_modules/next/dist/docs/`. Las pantallas son estáticas, con datos en módulos. |
| Leer `localStorage` durante el render provoca error de hidratación. | El proveedor inicializa `user` en `null` y lo carga en un efecto. La barra no renderiza el nombre hasta tener el estado. |
| `localStorage` bloqueado o con JSON inválido. | Todo acceso va dentro de `try/catch`; ante fallo se trata como "sin sesión". |
| `seededScores` produce nombres repetidos (el prototipo usa `r.name` como `key`). | Usar `rank` o `name + index` como `key` en las listas. |
| Las portadas `cover-*` dependen de pseudo-elementos complejos que no se traducen a Tailwind. | Se conservan como CSS en `globals.css`, con los mismos nombres de clase que en `Game.cover`. |
| Las fuentes de Google rompen el build sin conexión. | Se acepta para el MVP; `next/font/google` ya se usa en el proyecto con Geist. |

---

## Lo que **no** entra en esta spec

- Ningún juego jugable (ni Bloque Buster ni los otros siete).
- Autenticación real, OAuth, cuentas de usuario en servidor.
- Base de datos, API, Server Actions o puntuaciones compartidas entre usuarios.
- Mostrar en las tablas las puntuaciones guardadas en `av_scores`.
- Sistema de créditos funcional.
- Tests automatizados.
- Internacionalización.

Cada uno de estos puntos, si se aborda, va en su propia spec.
