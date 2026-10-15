# Liferay — Client Extensions

Las Client Extensions son archivos JS o CSS externos que Liferay carga globalmente en todas las páginas. Se usan para exponer librerías como GSAP o Swiper que los fragments usan vía `window.*`.

---

## Qué generan

`npm run build:extensions` produce por cada extension en `src/client-extensions/`:

```
dist/builds/
  gsap/
    gsap.js
  swiperjs/
    swiperjs.js
    swiperjs.css
```

El JS empaqueta la librería en formato **IIFE** y la expone en `window`:

```js
// Después de cargar gsap.js en Liferay:
window.gsap          // instancia de GSAP
window.ScrollTrigger // plugin ScrollTrigger
```

---

## Cómo subir a Liferay

### Paso 1 — Subir el archivo a Documents & Media

1. Ir a **Documents & Media** en Liferay
2. Subir `dist/builds/[nombre]/[nombre].js`
3. Copiar la URL pública del archivo (clic derecho → copiar enlace)

Repetir para el `.css` si existe (ej. `swiperjs.css`).

### Paso 2 — Crear la Client Extension desde la UI

1. Ir a **Control Panel → Client Extensions**
2. Crear nueva Client Extension de tipo **Global JS** (o **Global CSS** para el CSS)
3. Pegar la URL copiada en el campo URL
4. Asignarle un nombre (ej. "GSAP", "Swiper JS", "Swiper CSS")
5. Guardar y publicar

### Paso 3 — Asignar al site

1. Ir a **Site Settings → Pages → Global JS/CSS**
2. Añadir la Client Extension recién creada
3. Publicar

A partir de aquí, `window.gsap` y `window.Swiper` están disponibles en todos los fragments del site.

---

## Usar la librería desde un fragment

Una vez cargada la Client Extension, el fragment accede a ella directamente desde `window`. Siempre verificar que exista antes de usarla — si la Client Extension no está asignada al site dará error silencioso:

```js
// src/fragments/mi-fragment/index.js
import './index.css'

document.addEventListener('DOMContentLoaded', () => {
  const gsap = window.gsap
  if (!gsap) return

  gsap.from(fragmentElement.querySelector('.titulo'), {
    y: 30,
    opacity: 0,
    duration: 0.8,
  })
})
```

No se importa el paquete npm en el fragment — solo se lee `window.*`.

---

## Orden de carga

Cuando una librería depende de otra (ej. TanStack Query necesita React), el orden en Site Settings importa. La dependencia debe ir **encima**:

1. Ir a **Site Settings → Pages → Global JS**
2. Arrastrar para reordenar — las de arriba cargan primero

```
1. react.js           ← primero
2. tanstack-query.js  ← después
```

Si el orden es incorrecto la librería dependiente fallará al inicializar porque su peer no estará disponible aún en `window`.

---

## Actualizar una client extension

Cuando se hace un nuevo build y el archivo cambia, la URL en Documents & Media puede cambiar si se sube como archivo nuevo. El proceso recomendado:

1. En **Documents & Media**, reemplazar el archivo existente subiendo la nueva versión en la misma ubicación — la URL se mantiene
2. Si se sube como archivo nuevo (URL diferente), actualizar la URL en **Control Panel → Client Extensions** editando la extension existente

No hace falta crear una nueva Client Extension ni reasignarla al site si la URL no cambia.

---

## Client Extensions CSS (fonts)

El archivo `src/styles/fonts.css` es una Client Extension de tipo **Global CSS**. No se buildea con Vite — se sube directamente a Liferay vía UI.

```
src/styles/
  fonts.css       ← sube este archivo a Liferay como CSS client extension
```

Proceso igual que para JS: subir a Documents & Media → copiar URL → crear Client Extension Global CSS.

---

## Documentacion tecnica por extension

| Extension | Doc |
|---|---|
| GSAP | [docs/fragments/gsap.md](../fragments/gsap.md) — funciones, clases CSS, atributos, configuracion |
| Swiper | [docs/fragments/swiper.md](../fragments/swiper.md) — modulos, uso desde fragments, ejemplos |

---

## Estructura de una client extension

```
src/client-extensions/[nombre]/
  index.js      ← importa la librería y la asigna a window.*
  config.json   ← { "name": "...", "type": "globalJS" }
```

Ver [Dependencias y librerías](../dependencias.md) para cómo añadir una nueva.
