# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static landing page for **Media Vuelta**, a Chilean creative agency. No build tools, no frameworks, no package.json — pure HTML/CSS/JS served as-is.

## Architecture

```
web/
├── index.html              ← Home page
├── css/style.css           ← All styles (single file, ~2255 lines)
├── js/script.js            ← All JavaScript (single file, ~85 lines)
├── assets/                 ← Shared: fonts, logo, global SVGs
├── quienes-somos/          ← About Us page
├── que-hacemos/            ← What We Do page
├── por-que-elegirnos/      ← Why Choose Us page
├── proyectos/              ← Projects page
└── contacto/               ← Contact page
```

Each subpage is a self-contained folder with its own `index.html` and `assets/` directory for page-specific SVGs and images.

## CSS Conventions

**Single file** — all styles live in `css/style.css`. BEM-like naming with page-specific prefixes:
- `.qs-*` → quienes-somos
- `.qh-*` → que-hacemos
- `.pe-*` → por-que-elegirnos
- `.pr-*` → proyectos
- `.ct-*` → contacto

**Color tokens** (CSS custom properties):
- `--verde`: #4FC983
- `--negro`: #1F1F1F
- `--claro`: #F6F6F6
- `--blanco`: #FFFFFF

**Font tokens**: `--f-archivo` (headlines), `--f-mulish` (body). Both are local variable fonts loaded from `assets/`.

**Responsive breakpoints**: `1024px` (tablet), `768px` (mobile).

## JavaScript

`js/script.js` handles three concerns:
1. Mobile menu toggle (hamburger + ARIA)
2. Infinite carousel (`initCarousel(el)`) — clones items for seamless looping, applied to services and projects carousels
3. Navbar shadow on scroll (activates past 40px)

## SVG Asset Pattern

Each subpage uses two categories of decorative SVGs in its `assets/` folder:
- `TEXTO_*.svg` — colored highlight shapes placed behind text
- `FONDO_*.svg` — large background wave shapes

Fill colors differ per page — see the `project_badge_colors.md` memory entry for the exact mapping.

## Development

Open any `index.html` directly in a browser or serve with any static server (e.g. `python -m http.server`). No build step needed.
