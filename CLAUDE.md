# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arcade Vault: a platform to play games online and compete for the highest score. The project follows a spec-driven workflow (`/spec` and `/spec-impl`) using the skills from https://github.com/Klerith/fernando-skills (installed via `npx skills@latest add Klerith/fernando-skills`). The codebase is still the freshly scaffolded Create Next App; no game or scoring features exist yet.

## Commands

- `npm run dev` — dev server (http://localhost:3000)
- `npm run build` / `npm start` — production build / serve
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`, `eslint-config-next`)

No test runner is configured.

## Next.js version warning

Next.js 16.4.2 with React 19.3 — newer than typical training data. `AGENTS.md` requires reading the relevant guide in `node_modules/next/dist/docs/` (`01-app`, `02-pages`, `03-architecture`, `04-community`) before writing Next.js code, and heeding deprecation notices.

## Architecture

- App Router only (`app/`); path alias `@/*` maps to the repo root.
- `next.config.ts` enables `cacheComponents`, `partialPrefetching` and `experimental.agentFeedback`. `cacheComponents` changes data-fetching/caching semantics, so check the docs before writing server components or fetches.
- Tailwind CSS v4 is wired through Turbopack: a `*.css` rule in `next.config.ts` uses the `@tailwindcss/turbopack` loader (no `tailwind.config`; theme tokens live in `@theme inline` in `app/globals.css`, with light/dark CSS variables via `prefers-color-scheme`).
- `app/layout.tsx` uses the globally typed `LayoutProps<"/">` helper (no import) and loads Geist / Geist Mono through `next/font/google`.
