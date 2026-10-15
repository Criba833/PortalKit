# PortalKit


Workflow de desarrollo front-end para **Liferay DXP** basado en Vite.

Permite construir Fragments, Web Content y Client Extensions de forma modular, con preview local, hot reload y build listo para subir a Liferay vía UI.

---

## Requisitos

- Node.js 20+
- npm 10+


---

## Stack

| Herramienta | Para qué |
|---|---|
| [Vite](https://vitejs.dev) | Bundler, dev server y HMR |
| [Pug](https://pugjs.org) | Templates HTML |
| [CSS](https://developer.mozilla.org/en-US/docs/Web/CSS) | Estilos |
| [GSAP](https://gsap.com) | Animaciones (Client Extension) |
| [Swiper](https://swiperjs.com) | Carruseles (Client Extension) |

Las librerías externas (React, Vue, Lit, Motion, TanStack, etc.) se añaden como Client Extensions. Ver [Dependencias y librerías](docs/dependencias.md).

---

## Objetivo

Usar un sistema automatizado que:

- Compila **Pug → HTML**, **CSS nativo** y **JS (ES modules)** por fragment
- Genera artefactos listos para Liferay: `.ftl`, `index.css`, `index.js`
- Empaqueta librerías externas como **Client Extensions** IIFE independientes
- Permite previsualizar cualquier fragment en el browser antes de subirlo

---

## Comandos rápidos

```bash
npm run dev                          # dev server en http://localhost:5173
npm run build:fragments              # build completo (fragments + web-content + client extensions)
npm run build:extension -- [nombre] # build de una client extension específica
```

---

## Índice de documentación

| Doc | Contenido |
|---|---|
| [Quick Start](docs/quick-start.md) | Instalación, comandos, flujo de desarrollo y deploy |
| [Estructura del proyecto](docs/estructura.md) | Carpetas, archivos fuente y salida del build |
| [Dependencias y librerías](docs/dependencias.md) | Añadir/quitar librerías, usar Vue/React/Lit desde fragments, TanStack, reemplazar GSAP o Swiper |
| [Liferay — Fragments](docs/liferay/fragments.md) | Pug, layouts, JS scoped, CSS, configuration.json, FTL, script.js |
| [Liferay — Client Extensions](docs/liferay/client-extensions.md) | Qué son, cómo crearlas y cómo subirlas a Liferay |
| [Liferay — Editable Elements](docs/liferay/editable-elements.md) | Tipos de editables, mixins Pug, reglas de anidación, IDs únicos |
| [Liferay — Tokens y Variables CSS](docs/liferay/tokens-variables-css.md) | Variables CSS del Style Book y cómo usarlas en fragments |
| [Scripts de build](docs/scripts.md) | Cómo funcionan `build-liferay.js`, `build-client-extensions.js` y `vite.config.js` |
| [Fragments — Docs técnicos](docs/fragments/) | Documentación técnica de cada fragment: PortalKit Display Text, PortalKit Header, PortalKit Accordion |
