# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arcade Vault: a platform to play games online and compete for the highest score. The project follows a spec-driven workflow (`/spec` and `/spec-impl`) using the skills from https://github.com/Klerith/fernando-skills (installed via `npx skills@latest add Klerith/fernando-skills`). Spec 01 (`specs/01-mvp-pantallas-visuales.md`) built the visual MVP: five screens with mock data and a placeholder player. Spec 02 (`specs/02-home-page.md`) added the landing page at `/` and moved the library to `/biblioteca` (it supersedes the obsolete `specs/01-home-page.md`). Spec 03 (`specs/03-about-page-contacto.md`) added the About page at `/acerca` with a contact form that sends real email through Resend. No real game, auth, database or shared scoring exists yet.

No test runner is configured.

## Next.js version warning

Next.js 16.4.2 with React 19.3 — newer than typical training data. `AGENTS.md` requires reading the relevant guide in `node_modules/next/dist/docs/` (`01-app`, `02-pages`, `03-architecture`, `04-community`) before writing Next.js code, and heeding deprecation notices.

## Skills
Usa siempre /frontend-design para diseñar la interfaz de usuario

## Architecture

- App Router only (`app/`); path alias `@/*` maps to the repo root.
- `next.config.ts` enables `cacheComponents`, `partialPrefetching` and `experimental.agentFeedback`. `cacheComponents` changes data-fetching/caching semantics, so check the docs before writing server components or fetches.
- Tailwind CSS v4 is wired through Turbopack: a `*.css` rule in `next.config.ts` uses the `@tailwindcss/turbopack` loader (no `tailwind.config`; theme tokens live in `@theme inline` in `app/globals.css`, with light/dark CSS variables via `prefers-color-scheme`).
- `app/layout.tsx` uses the globally typed `LayoutProps<"/">` helper (no import) and loads Press Start 2P / JetBrains Mono through `next/font/google` (`--font-press-start`, `--font-jetbrains`, exposed as `font-pixel` / `font-mono`). It mounts the background, `SessionProvider`, `Nav`, `<main>` and `Footer`.
- Routes: `/` (landing), `/biblioteca` (library), `/juegos/[id]` (detail), `/juegos/[id]/jugar` (placeholder player), `/acceso` (login), `/salon` (hall of fame), `/acerca` (about + contact form). Dynamic routes use `generateStaticParams` over `GAMES`; with `cacheComponents` an unknown `id` renders the 404 UI via `notFound()` but with HTTP 200 (`dynamicParams` is not supported).
- Mock data lives in `app/data/` (`types.ts`, `games.ts`, `scores.ts` with the seeded score generator, `activity.ts` with the landing's recent scores and top players). Shared client components are in `app/_components/`; the landing sections are Server Components in `app/_components/home/`, wrapped in the client `Reveal` (`app/_components/reveal.tsx`, reveal-on-scroll).
- Contact form: `app/acerca/page.tsx` is a Server Component; the only client piece is `app/_components/about/contact-form.tsx` (`useActionState` + client-side shake), which calls the Server Action `sendContact(prev, formData)` in `app/acerca/actions.ts`. The action runs a honeypot (`website`), server-side validation (name ≤ 80, email ≤ 254, message ≤ 2000, valid email format) and sends plain-text email with `resend` (`replyTo` = the user's email, subject `[Arcade Vault] Mensaje de <name>`). Missing config or provider errors are logged with `console.error` and the client only gets a generic message. Environment variables (in `.env.local`, git-ignored, server-only): `RESEND_API_KEY` (required), `CONTACT_TO_EMAIL` (required, recipient) and `CONTACT_FROM_EMAIL` (optional, defaults to `Arcade Vault <onboarding@resend.dev>`; in Resend test mode mail is only delivered to the account owner's address). Without `RESEND_API_KEY` the form shows its error state.
- Session and saved scores are simulated in `localStorage` (`av_user`, `av_scores`) through `SessionProvider` / `useSession()` (`useSyncExternalStore`, so the first client render matches the server).
- Theme tokens (`--bg`, `--cyan`, …) are in `app/globals.css` and mapped in `@theme inline`. Effects Tailwind can't express (`av-bg`, `cover-*`, CRT, keyframes, `.btn`) are plain CSS there; `.btn` is in `@layer components` so utilities can override it. Caveat: `app/globals.css` also contains an unlayered copy of the template CSS (a second `.btn`, `.btn.xl`, `.btn.lg`, `.btn.magenta`, `av-bg`, keyframes…) that beats both the layered rules and Tailwind utilities. So `btn-xl`/`btn-lg`/`btn-magenta` have no effect; use the template modifiers (`btn xl`, `btn lg`, `btn magenta`) and the `!` important suffix (`hidden!`, `px-11!`) when overriding `.btn`.
- `references/templates/` is the original React-UMD prototype, kept only as a design reference (never import from it; `npm run lint` still reports errors there).
