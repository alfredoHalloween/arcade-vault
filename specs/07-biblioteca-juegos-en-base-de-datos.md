# SPEC 07 — `/biblioteca` solo muestra los juegos almacenados en la base de datos

> **Estado:** Implementado
> **Depende de:** SPEC 01 (`01-mvp-pantallas-visuales.md`), SPEC 04 (`04-integracion-supabase.md`), SPEC 06 (`06-leaderboard-y-tabla-games.md`)
> **Fecha:** 2026-10-28
> **Objetivo:** Hacer que `/biblioteca` muestre únicamente los juegos del catálogo local (`app/data/games.ts`) cuyo `id` exista en la tabla `games` de Supabase, con estados de vacío y de error.

---

## Por qué existe esta spec

Desde la SPEC 06 la tabla `games` define qué juegos son reales (hoy solo `rocas`), pero `/biblioteca` sigue listando los ocho juegos del catálogo local, siete de ellos placeholders con puntuación simulada. Esta spec hace que la biblioteca refleje la base de datos sin tocar el esquema: la tabla decide **qué** juegos se muestran y el catálogo local sigue aportando **cómo** se pintan (descripción, categoría, portada, color), porque `games` solo tiene `id` y `title`.

---

## Alcance

**Dentro:**

- `lib/games.ts` (solo servidor) con `getStoredGameIds()`, que lee los `id` de `games` con el cliente de servidor existente.
- `/biblioteca` (`app/biblioteca/page.tsx`) pasa a leer `games` bajo `<Suspense>` con un esqueleto; el título y el subtítulo siguen siendo estáticos.
- `LibraryBrowser` recibe los juegos por prop (`games: Game[]`) en lugar de importar `GAMES`; el buscador y el filtro por categoría trabajan sobre esa lista.
- Un juego se muestra si y solo si su `id` está en `games` **y** existe en `app/data/games.ts`. Se mantiene el orden del catálogo local.
- Estado de vacío (la tabla no devuelve ninguna fila que exista en el catálogo local) y estado de error (la consulta falla), sin romper la página.
- Actualizar `CLAUDE.md`.

**Fuera de alcance (para futuras specs):**

- Mover el catálogo visual a la base (columnas `short`, `long`, `cat`, `cover`, `color` en `games`) y pintar las tarjetas desde Supabase.
- Cambiar la landing (`/`, `GAMES.slice(0, 6)`), `/juegos/[id]`, `/juegos/[id]/jugar` y `activity.ts`: siguen leyendo `app/data/games.ts` entero. Consecuencia aceptada: la landing y las URLs directas todavía muestran juegos que la biblioteca oculta.
- Sembrar en `games` los siete juegos placeholder (rompería la regla de la SPEC 06 de que `games` define qué juegos tienen ranking y crearía pestañas vacías en `/salon`).
- Estadísticas reales (`best`, `plays`), RLS, Auth, caché y Realtime.
- Corregir el error de consola «`params` accessed outside of `<Suspense>`» de `/juegos/[id]` y `/juegos/[id]/jugar`, y el desbordamiento de 7 px de la barra de navegación a 375 px.
- Pruebas automatizadas (no hay test runner).

---

## Modelo de datos

Esta spec no introduce tablas ni columnas nuevas. Reutiliza `games` (`id`, `title`, `created_at`) de la SPEC 06 y el tipo `Game` de `app/data/types.ts`.

```ts
// lib/games.ts (solo servidor)
// IDs de `games` ordenados por `created_at`; `null` si la consulta falla (el detalle va a console.error).
export async function getStoredGameIds(): Promise<string[] | null>;

// app/_components/library-browser.tsx
export function LibraryBrowser({ games }: { games: Game[] });
```

Convenciones:

- La lista mostrada es `GAMES.filter((g) => ids.includes(g.id))`: el orden y los datos visuales son los del catálogo local.
- Un `id` presente en `games` pero ausente de `app/data/games.ts` se ignora sin error (no hay con qué pintarlo).
- La lectura usa `lib/supabase/server.ts` (dinámica, `cookies()`), por lo que va dentro de `<Suspense>`. No hay `"use cache"`.
- No se añade ninguna variable de entorno.
- Textos: vacío → `AÚN NO HAY JUEGOS EN EL VAULT`; error → `NO SE PUDO CARGAR LA BIBLIOTECA` con una línea que invita a reintentarlo más tarde.

---

## Plan de implementación

Cada paso deja la app ejecutable (`npm run dev`) y se puede commitear solo.

1. Leer en `node_modules/next/dist/docs/` la guía de `<Suspense>` con `cacheComponents` y datos dinámicos. Sin cambios en el repo.
2. Crear `lib/games.ts` con `getStoredGameIds()`. Verificación: `npx tsc --noEmit` y `npx eslint lib`.
3. Cambiar `LibraryBrowser` para recibir `games: Game[]` y quitar su import de `GAMES` (conserva `CATEGORIES`). Mientras tanto `app/biblioteca/page.tsx` le pasa `GAMES` para no romper la app. Verificación: `/biblioteca` se ve igual que antes con los ocho juegos.
4. Convertir `app/biblioteca/page.tsx`: cabecera estática, y un componente async bajo `<Suspense>` con esqueleto que llama a `getStoredGameIds()`, filtra `GAMES` y renderiza `LibraryBrowser`, el mensaje de vacío o el de error. Verificación: `/biblioteca` muestra solo ROCAS.
5. Probar los casos límite con `execute_sql` y volver al estado inicial: insertar `serpentina` en `games` y ver que aparece; vaciar la tabla y ver el estado de vacío (se restaura `rocas` después). Verificación: ambos casos y el estado inicial restaurado (`games` con una sola fila, `rocas`).
6. Actualizar `CLAUDE.md` (cómo decide `/biblioteca` qué mostrar, qué pantallas siguen leyendo el catálogo local entero). Verificación: el documento refleja lo anterior.

---

## Criterios de aceptación

- [X] `npx tsc --noEmit` y `npx eslint app lib` terminan sin errores.
- [X] Con `games` conteniendo solo `rocas`, `/biblioteca` muestra exactamente una tarjeta (ROCAS) y ninguno de los siete placeholders.
- [X] Tras insertar `serpentina` en `games`, `/biblioteca` muestra ROCAS y SERPENTINA en el orden del catálogo local, sin tocar código.
- [X] Un `id` insertado en `games` que no existe en `app/data/games.ts` no rompe la página ni aparece como tarjeta.
- [X] Con `games` vacía, `/biblioteca` muestra `AÚN NO HAY JUEGOS EN EL VAULT`, sin tarjetas y sin errores en la consola.
- [X] Si la consulta a Supabase falla (p. ej. URL de Supabase inválida), `/biblioteca` responde 200 y muestra `NO SE PUDO CARGAR LA BIBLIOTECA`; el detalle solo aparece en el log del servidor.
- [X] El buscador y el filtro por categoría siguen funcionando sobre los juegos mostrados; una búsqueda sin coincidencias sigue mostrando `NO HAY RESULTADOS`.
- [X] Mientras carga se ve el esqueleto bajo el título, que no desaparece ni parpadea.
- [X] `/`, `/juegos/serpentina`, `/juegos/serpentina/jugar`, `/salon` y `/acerca` siguen funcionando igual que antes.
- [X] `/biblioteca` responde 200 sin errores ni avisos de hidratación en la consola.
- [X] Al terminar las pruebas, `games` contiene exactamente una fila (`rocas`).
- [X] Ningún archivo importa `createClient` de `@supabase/supabase-js`.
- [X] `CLAUDE.md` documenta cómo decide `/biblioteca` qué juegos muestra.

---

## Decisiones

- **Sí:** filtrar el catálogo local por los `id` de `games` (decisión del usuario). Es el cambio mínimo y no toca el esquema. **No:** mover el catálogo a la base ahora; exige ampliar `games` con las columnas visuales y decidir qué hacer con `best`, `plays`, `generateStaticParams` y los placeholders, así que es otra spec.
- **Sí:** cambiar solo `/biblioteca` (decisión del usuario). **No:** la landing, el detalle ni el reproductor, aunque queden incoherentes con la biblioteca: se aborda cuando el catálogo viva en la base.
- **Sí:** no sembrar los placeholders en `games` (decisión del usuario). Mantiene la regla de la SPEC 06: `games` define qué juegos tienen ranking, y `/salon` solo muestra juegos reales y jugables. **No:** columna que distinga juegos jugables; amplía el esquema sin necesidad hoy.
- **Sí:** estado de vacío con mensaje y estado de error genérico con detalle en `console.error` (decisión del usuario). **No:** dejar que un fallo de Supabase tumbe la biblioteca.
- **Sí:** ignorar los `id` de `games` que no existen en el catálogo local. **No:** pintar tarjetas con solo `id` y `title`: faltaría portada, categoría y descripción.
- **Sí:** mantener el orden del catálogo local. **No:** ordenar por `created_at`; hoy no aporta nada y mezclaría dos fuentes de verdad para el orden.
- **Sí:** lectura dinámica bajo `<Suspense>`, sin `"use cache"`, igual que en la SPEC 06 (`cookies()` no se puede llamar dentro de `"use cache"`). **No:** caché con etiquetas e invalidación.
- **Sí:** probar los casos límite modificando `games` con `execute_sql` y restaurarla. **No:** dejar filas de prueba en la base.

---

## Riesgos

| Riesgo                                                                                                        | Mitigación                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| La biblioteca oculta juegos que la landing y las URLs directas siguen mostrando.                              | Aceptado y documentado en el alcance; se resuelve al mover el catálogo a la base.                                                        |
| Sin RLS, cualquiera con la clave publicable puede insertar o borrar filas de `games` y cambiar la biblioteca. | Aceptado temporalmente por la decisión de la SPEC 06; la spec de RLS debe ser la siguiente que toque la base.                            |
| Insertar en `games` un juego sin canvas real crea una pestaña vacía en `/salon`.                              | Las pruebas de esta spec restauran `games`; añadir un juego con ranking sigue siendo insertar la fila y registrarlo en `PLAYABLE_GAMES`. |
| Una consulta lenta o fallida deja la biblioteca en blanco o rota.                                             | Esqueleto bajo `<Suspense>` y estado de error propio con mensaje genérico.                                                               |

---

## Lo que **no** entra en esta spec

- Catálogo completo en la base de datos y tarjetas pintadas desde Supabase.
- Cambios en la landing, `/juegos/[id]`, `/juegos/[id]/jugar` y `activity.ts`.
- Sembrar los juegos placeholder en `games`.
- RLS, Auth, estadísticas reales, caché y Realtime.
- Arreglar el error de consola de `params` y el desbordamiento de la barra de navegación.
- Pruebas automatizadas.

Cada uno de estos puntos, si se aborda, va en su propia spec.
