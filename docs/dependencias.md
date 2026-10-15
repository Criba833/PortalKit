# Dependencias y librerías

Las librerías externas (GSAP, Swiper, React, Vue, Lit, etc.) se empaquetan como **Client Extensions** IIFE independientes. No van dentro de los fragments.

---

## Librerías incluidas

| Nombre | Paquete npm | Expone en `window` |
|---|---|---|
| GSAP + ScrollTrigger | `gsap` | `window.gsap`, `window.ScrollTrigger` |
| Swiper | `swiper` | `window.Swiper`, `window.SwiperModules` |

---

## Añadir una librería nueva

### 1. Instalar el paquete

```bash
npm install nombre-del-paquete
```

### 2. Crear la carpeta en `src/client-extensions/`

```
src/client-extensions/mi-libreria/
  index.js
  config.json
```

### 3. `index.js` — importar y exponer en `window`

```js
import MiLibreria from 'mi-libreria'

window.MiLibreria = MiLibreria
```

### 4. `config.json` — metadatos

```json
{
  "name": "Mi Librería",
  "type": "globalJS"
}
```

### 5. Buildear

```bash
npm run build:extension -- mi-libreria
```

Salida: `dist/builds/mi-libreria/mi-libreria.js`

---

## Ejemplos por tipo de librería

### React

```js
// src/client-extensions/react/index.js
import React from 'react'
import ReactDOM from 'react-dom/client'

window.React = React
window.ReactDOM = ReactDOM
```

```bash
npm install react react-dom
```

### Vue

```js
// src/client-extensions/vue/index.js
import { createApp, ref, reactive, computed, onMounted } from 'vue'

window.Vue = { createApp, ref, reactive, computed, onMounted }
```

```bash
npm install vue
```

### Lit

[Lit](https://lit.dev) — Web Components con reactividad y templates declarativos (~5 KB).

```js
// src/client-extensions/lit/index.js
import { LitElement, html, css } from 'lit'

window.LitElement = LitElement
window.litHtml = html
window.litCss = css
```

```bash
npm install lit
```

### Alpine.js

```js
// src/client-extensions/alpine/index.js
import Alpine from 'alpinejs'

window.Alpine = Alpine
Alpine.start()
```

```bash
npm install alpinejs
```

---

## Eliminar una librería

1. Borrar `src/client-extensions/[nombre]/`
2. Desinstalar el paquete:
   ```bash
   npm uninstall nombre-del-paquete
   ```
3. El próximo `npm run build:extensions` no la genera.

---

## Client Extensions CSS

Si la librería genera CSS (como Swiper), el build lo detecta automáticamente y genera un archivo `.css` adicional:

```
dist/builds/swiperjs/
  swiperjs.js
  swiperjs.css    ← generado automáticamente
```

Ambos archivos se suben a Liferay por separado como dos Client Extensions distintas (`globalJS` y `globalCSS`).

Ver [Liferay — Client Extensions](liferay/client-extensions.md) para el proceso de subida.

---

## Dependencias de desarrollo

Estas dependencias son internas del workflow y no se suben a Liferay:

| Paquete | Para qué |
|---|---|
| `vite` | Bundler y dev server |
| `CSS` | Compilación CSS |
| `pug` | Compilación de templates |
| `autoprefixer` | Prefijos CSS automáticos |
| `postcss` | Pipeline CSS |

---

## Usar un framework desde un fragment

Una vez expuesto el framework en `window`, se monta desde el `index.js` del fragment. Siempre sobre `fragmentElement`, nunca sobre `document`.

### Vue

```js
// src/fragments/mi-fragment/index.js
import './index.css'

document.addEventListener('DOMContentLoaded', () => {
  const { createApp, ref } = window.Vue ?? {}
  if (!createApp) return

  const app = createApp({
    setup() {
      const count = ref(0)
      return { count }
    },
    template: `<button @click="count++">Clics: {{ count }}</button>`
  })

  app.mount(fragmentElement.querySelector('.app'))
})
```

```pug
//- src/fragments/mi-fragment/index.pug
block content
  .mi-fragment
    .app
```

### React

```js
// src/fragments/mi-fragment/index.js
import './index.css'

document.addEventListener('DOMContentLoaded', () => {
  const { React, ReactDOM } = window
  if (!React || !ReactDOM) return

  function MiComponente() {
    const [count, setCount] = React.useState(0)
    return React.createElement('button', { onClick: () => setCount(c => c + 1) }, 'Clics: ' + count)
  }

  ReactDOM.createRoot(fragmentElement.querySelector('.app')).render(
    React.createElement(MiComponente)
  )
})
```

### Lit

[Lit](https://lit.dev) usa Web Components — el custom element se define una vez y se usa como tag en el Pug.

```js
// src/fragments/mi-fragment/index.js
import './index.css'

document.addEventListener('DOMContentLoaded', () => {
  const { LitElement, litHtml: html, litCss: css } = window
  if (!LitElement) return

  if (!customElements.get('mi-contador')) {
    class MiContador extends LitElement {
      static properties = { count: { type: Number } }
      static styles = css`.btn { font-size: 1rem; }`
      constructor() { super(); this.count = 0 }
      render() {
        return html`<button class="btn" @click=${() => this.count++}>Clics: ${this.count}</button>`
      }
    }
    customElements.define('mi-contador', MiContador)
  }
})
```

```pug
//- src/fragments/mi-fragment/index.pug
block content
  .mi-fragment
    mi-contador
```

> **Nota Lit:** usa Shadow DOM por defecto. Los estilos globales de Liferay no penetran en el shadow root.

---

## Librerías con dependencias entre sí

Algunas librerías necesitan un framework como peer dependency. Hay que crear una client extension por cada una y respetar el orden de carga en Liferay.

### TanStack Query con React

TanStack Query necesita React cargado primero.

**1. Instalar**

```bash
npm install @tanstack/react-query
```

**2. `src/client-extensions/tanstack-query/index.js`**

```js
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'

window.TanStackQuery = { QueryClient, QueryClientProvider, useQuery }
```

**3. Orden de carga en Liferay** — Site Settings → Global JS:

```
1. react.js           ← primero
2. tanstack-query.js  ← después
```

**4. Uso desde un fragment**

```js
import './index.css'

document.addEventListener('DOMContentLoaded', () => {
  const { React, ReactDOM } = window
  const { QueryClient, QueryClientProvider, useQuery } = window.TanStackQuery ?? {}
  if (!React || !QueryClient) return

  const queryClient = new QueryClient()

  function Posts() {
    const { data, isLoading } = useQuery({
      queryKey: ['posts'],
      queryFn: () =>
        fetch('/o/headless-delivery/v1.0/sites/1234/structured-contents').then(r => r.json())
    })
    if (isLoading) return React.createElement('p', null, 'Cargando...')
    return React.createElement('ul', null,
      data?.items?.map(p => React.createElement('li', { key: p.id }, p.title))
    )
  }

  function App() {
    return React.createElement(QueryClientProvider, { client: queryClient },
      React.createElement(Posts)
    )
  }

  ReactDOM.createRoot(fragmentElement.querySelector('.app')).render(React.createElement(App))
})
```

### TanStack Query con Vue

**1. Instalar**

```bash
npm install @tanstack/vue-query
```

**2. `src/client-extensions/tanstack-vue-query/index.js`**

```js
import { VueQueryPlugin, useQuery, QueryClient } from '@tanstack/vue-query'

window.TanStackVueQuery = { VueQueryPlugin, useQuery, QueryClient }
```

**3. Orden de carga en Liferay:**

```
1. vue.js
2. tanstack-vue-query.js
```

**4. Uso desde un fragment**

```js
import './index.css'

document.addEventListener('DOMContentLoaded', () => {
  const { createApp } = window.Vue ?? {}
  const { VueQueryPlugin, useQuery, QueryClient } = window.TanStackVueQuery ?? {}
  if (!createApp || !VueQueryPlugin) return

  const queryClient = new QueryClient()

  const app = createApp({
    setup() {
      const { data, isLoading } = useQuery({
        queryKey: ['posts'],
        queryFn: () =>
          fetch('/o/headless-delivery/v1.0/sites/1234/structured-contents').then(r => r.json())
      })
      return { data, isLoading }
    },
    template: `
      <p v-if="isLoading">Cargando...</p>
      <ul v-else>
        <li v-for="p in data?.items" :key="p.id">{{ p.title }}</li>
      </ul>
    `
  })

  app.use(VueQueryPlugin, { queryClient })
  app.mount(fragmentElement.querySelector('.app'))
})
```

---

## Reemplazar una librería existente

### GSAP → Motion

[Motion](https://motion.dev) es la alternativa moderna a GSAP.

**1. Intercambiar el paquete**

```bash
npm uninstall gsap
npm install motion
```

**2. `src/client-extensions/motion/index.js`**

```js
import { animate, spring, inView, scroll } from 'motion'

window.motion = { animate, spring, inView, scroll }
```

**3. Buildear y subir a Liferay**

```bash
npm run build:extension -- motion
```

En Liferay: eliminar la client extension de GSAP y añadir la de Motion.

**4. Cambio en los fragments**

```js
// Con GSAP (antes):
window.gsap.from(fragmentElement.querySelector('.titulo'), { y: 30, opacity: 0, duration: 0.8 })

// Con Motion (ahora):
const { animate, inView } = window.motion

inView(fragmentElement.querySelector('.titulo'), () => {
  animate(
    fragmentElement.querySelector('.titulo'),
    { opacity: [0, 1], y: [30, 0] },
    { duration: 0.8 }
  )
})
```

---

### Swiper → Splide

[Splide](https://splidejs.com) es más ligero y sin dependencias externas.

**1. Intercambiar el paquete**

```bash
npm uninstall swiper
npm install @splidejs/splide
```

**2. `src/client-extensions/splide/index.js`**

```js
import Splide from '@splidejs/splide'
import '@splidejs/splide/css'

window.Splide = Splide
```

**3. Buildear y subir a Liferay**

```bash
npm run build:extension -- splide
```

En Liferay: eliminar Swiper JS y Swiper CSS, añadir Splide JS y Splide CSS (el build genera ambos automáticamente porque el `index.js` importa el CSS).

**4. Cambio en los fragments**

```js
// Con Swiper (antes):
new window.Swiper(fragmentElement.querySelector('.swiper'), { loop: true })

// Con Splide (ahora):
const splide = new window.Splide(fragmentElement.querySelector('.splide'), { type: 'loop' })
splide.mount()
```

---

### Swiper → Embla Carousel

[Embla Carousel](https://www.embla-carousel.com) es headless — sin CSS propio, los estilos los defines tú.

**1. Instalar**

```bash
npm install embla-carousel
```

**2. `src/client-extensions/embla/index.js`**

```js
import EmblaCarousel from 'embla-carousel'

window.EmblaCarousel = EmblaCarousel
```

**3. Buildear y subir a Liferay**

```bash
npm run build:extension -- embla
```

**4. Uso desde un fragment**

```js
const embla = window.EmblaCarousel(
  fragmentElement.querySelector('.embla__viewport'),
  { loop: true }
)
```
