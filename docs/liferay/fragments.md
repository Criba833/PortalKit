# Liferay — Fragments

---

## Qué es un fragment

Un fragment es el componente básico de Liferay. Se compone de tres archivos:

| Archivo | Qué es |
|---|---|
| `[nombre].ftl` | Markup (FreeMarker Template) |
| `index.css` | Estilos |
| `index.js` | JavaScript |
| `configuration.json` | Variables configurables desde la UI de Liferay |

El workflow genera estos archivos automáticamente en `dist/fragments/[nombre]/` con `npm run build:fragments`.

---

## Pug — el sistema de templates

En desarrollo, el markup se escribe en **Pug** (no en FTL). Pug compila a HTML para el preview local. El build extrae el `<body>` de ese HTML y lo convierte en el `.ftl` de Liferay.

**Pug** es un lenguaje de templates con indentación significativa:

```pug
// Pug
.pk-hero
  h1.pk-hero__title Hola mundo
  p.pk-hero__text Subtítulo
```

Compila a:

```html
<div class="pk-hero">
  <h1 class="pk-hero__title">Hola mundo</h1>
  <p class="pk-hero__text">Subtítulo</p>
</div>
```

Puntos clave:
- La indentación define la jerarquía (no hay etiquetas de cierre)
- `div.clase` → `<div class="clase">` (sin nombre = `div`)
- `tag#id.clase` → `<tag id="id" class="clase">`
- `tag(attr="valor")` → atributos entre paréntesis
- Texto inline: `p Texto aquí`
- Texto multilínea: `p.` al inicio + indentación
- Comentarios: `//- comentario` (no aparece en el HTML)

---

## Layouts

Cada fragment extiende el layout base para tener el entorno de preview completo:

```pug
extends /views/layouts/fragment.pug

block vars
  - var title = 'Fragment: mi-fragment'

block content
  .mi-fragment
    h1 Contenido del fragment
```

El layout `fragment.pug` provee:
- Doctype y `<html>` con `lang="es"`
- Meta charset y viewport
- Google Fonts (Inter)
- Bootstrap Icons CDN
- Bootstrap CSS y JS (solo dev — no van a dist)
- `<script type="module" src="./index.js">` — carga el JS del fragment

El `block content` es donde va el markup del fragment. Solo ese bloque acaba en el `.ftl` de Liferay.

---

## Elementos editables

Los elementos editables permiten al editor de Liferay modificar contenido sin tocar código. Se definen con mixins del archivo `src/views/mixins/liferay.pug`.

### Texto editable

```pug
+editableText('titulo', 'h2') Texto por defecto
```

Genera:
```html
<h2 data-lfr-editable-id="titulo" data-lfr-editable-type="text">
  Texto por defecto
</h2>
```

### Imagen editable

```pug
+editableImage('foto', '/img/placeholder.jpg', 'Alt del placeholder')
```

### Enlace editable

```pug
+editableLink('cta', '#')
  | Ver más
```

### Rich text editable

```pug
+editableRichText('descripcion')
  p Texto enriquecido con <strong>negrita</strong>
```

**Regla:** el `id` de cada editable debe ser único dentro del fragment.

---

## JavaScript en fragments

### Regla fundamental: `fragmentElement`

En Liferay, pueden coexistir varios fragments del mismo tipo en la misma página. Por eso, **nunca** usar `document.querySelector` para buscar elementos del fragment — solo usa `fragmentElement`:

```js
// ✅ Correcto — scoped al fragment
const titulo = fragmentElement.querySelector('.mi-fragment__titulo')

// ❌ Incorrecto — puede afectar a otros fragments
const titulo = document.querySelector('.mi-fragment__titulo')
```

`fragmentElement` es la variable que Liferay inyecta automáticamente con el nodo raíz del fragment.

> **Importante:** `fragmentElement` solo existe en Liferay — **no está disponible en el preview local**. El layout de dev no lo inyecta. Ver el patrón `index.js` + `script.js` más abajo.

### Estructura del `index.js`

La primera línea **siempre** debe ser el import del CSS:

```js
import './index.css'

// Resto del código...
document.addEventListener('DOMContentLoaded', () => {
  const el = fragmentElement.querySelector('.mi-fragment')
  // lógica aquí
})
```

Si no se importa el CSS en `index.js`, Vite no lo procesa y no genera el `index.css`.

### Usar librerías (GSAP, Swiper)

Las librerías se cargan como Client Extensions y están disponibles en `window.*`:

```js
import './index.css'

document.addEventListener('DOMContentLoaded', () => {
  const gsap = window.gsap
  if (!gsap) return

  gsap.from(fragmentElement.querySelector('.titulo'), {
    y: 30, opacity: 0, duration: 0.8,
  })
})
```

---

### Patrón dev + Liferay con `src/js/`

Cuando un fragment necesita lógica JS real (no solo CSS), el patrón es separar el código en dos capas:

- **`index.js`** — entry de Vite para el preview local. Usa `document.querySelector` porque `fragmentElement` no existe en dev. Importa la lógica desde `src/js/`.
- **`script.js`** — JS para Liferay. Usa `fragmentElement`. Se copia tal cual al `dist/`.
- **`src/js/_nombre.js`** — módulo compartido con la lógica real, importado por `index.js`.

```js
// src/js/_mi-fragment.js  ← lógica compartida
export function initMiFragment(container) {
  const el = container.querySelector('.mi-fragment__titulo')
  el.classList.add('is-ready')
}
```

```js
// src/fragments/mi-fragment/index.js  ← para dev (usa document)
import './index.css'
import { initMiFragment } from '../../js/_mi-fragment.js'

document.addEventListener('DOMContentLoaded', () => {
  initMiFragment(document.querySelector('.mi-fragment'))
})
```

```js
// src/fragments/mi-fragment/script.js  ← para Liferay (usa fragmentElement)
;(() => {
  initMiFragment(fragmentElement)
})()
```

> **Nota:** en `script.js` la función debe estar disponible globalmente o inline — no puede usar `import` porque se copia sin bundling.

---

### `script.js` — JS sin bundling de Vite

Por defecto el build usa el `index.js` compilado por Vite. Si se crea un archivo `script.js` en la carpeta del fragment, el build lo copia tal cual como `index.js` en el `dist/` — sin procesar.

```
src/fragments/mi-fragment/
  index.js     ← Vite lo procesa (imports, CSS, bundling)
  script.js    ← se copia tal cual al dist/ si existe (tiene prioridad)
```

**Cuándo usar `script.js`:**
- El JS ya está escrito para ejecutarse directamente en Liferay y no necesita imports ni bundling
- Se quiere evitar que Vite transforme el código (ej. variables de FreeMarker dentro del JS)
- El fragment solo necesita CSS — `index.js` importa el CSS para que Vite lo procese, pero el JS de Liferay va aparte en `script.js`

**Ejemplo:** fragment que solo necesita CSS y un JS mínimo para Liferay:

```js
// src/fragments/mi-fragment/index.js  ← solo para que Vite procese el CSS
import './index.css'
```

```js
// src/fragments/mi-fragment/script.js  ← JS limpio que va a Liferay
document.addEventListener('DOMContentLoaded', () => {
  const el = fragmentElement.querySelector('.mi-fragment')
  el.classList.add('is-ready')
})
```

---

## CSS en fragments

El CSS de cada fragment debe ser **autocontenido**: sin dependencias de preprocesadores ni imports globales. Solo CSS y variables personalizadas (`var()`):

```css
// ✅ Correcto
.mi-fragment {
  font-size: var(--mi-font-size);
  color: var(--color-primary);
}

/* ❌ Incorrecto: importar una capa global dentro del fragment */
@import '../../styles/global.css';
```

Las variables CSS (`var()`) se definen globalmente en el site de Liferay (Design Tokens o CSS client extension).

---

## `configuration.json` — campos configurables

El `configuration.json` define los campos que el editor ve en el panel lateral de Liferay al seleccionar el fragment. Los valores se leen en el `.ftl` vía `configuration.*`.

### Estructura

```json
{
  "fieldSets": [
    {
      "label": "Nombre del grupo",
      "fields": [
        {
          "name": "miCampo",
          "label": "Etiqueta visible",
          "type": "text",
          "dataType": "string",
          "defaultValue": "Valor por defecto"
        }
      ]
    }
  ]
}
```

### Tipos de campo disponibles

| `type` | Descripción |
|---|---|
| `text` | Campo de texto libre |
| `select` | Lista desplegable (requiere `typeOptions.validValues`) |
| `checkbox` | Casilla de verificación (`defaultValue`: `true`/`false`) |
| `navigationMenuSelector` | Selector de menú de navegación de Liferay |
| `colorPalette` | Selector de color |
| `itemSelector` | Selector de contenido de Liferay |

### Ejemplo con select y checkbox

```json
{
  "fieldSets": [
    {
      "label": "Tipografía",
      "fields": [
        {
          "name": "textTag",
          "label": "Etiqueta HTML",
          "type": "select",
          "dataType": "string",
          "defaultValue": "h2",
          "typeOptions": {
            "validValues": [
              { "label": "H1", "value": "h1" },
              { "label": "H2", "value": "h2" },
              { "label": "Párrafo", "value": "p" }
            ]
          }
        },
        {
          "name": "showCta",
          "label": "Mostrar botón CTA",
          "type": "checkbox",
          "defaultValue": true
        }
      ]
    }
  ]
}
```

### Usar los valores en el FTL

Los valores del `configuration.json` se leen en el `.ftl` con `configuration.nombreCampo`. El operador `!` provee un valor por defecto si el campo es nulo:

```freemarker
<${configuration.textTag!"h2"} class="mi-fragment__titulo">
  Texto del título
</${configuration.textTag!"h2"}>

[#if configuration.showCta!true]
  <a class="mi-fragment__cta" href="#">Ver más</a>
[/#if]
```

### `fragmentEntryLinkNamespace` — IDs únicos

Cuando un elemento editable necesita un `id` único en la página (requerido por algunos tipos de editables), se usa `fragmentEntryLinkNamespace` que Liferay inyecta automáticamente:

```html
<a
  data-lfr-editable-id="logo-link"
  data-lfr-editable-type="link"
  id="fragment-${fragmentEntryLinkNamespace}-logo-link"
  href="/">
  Logo
</a>
```

Esto garantiza que si hay dos instancias del mismo fragment en la página, cada `id` sea único.

### FreeMarker — directivas básicas

El FTL usa la sintaxis de FreeMarker (`[#...]` en vez de `<#...>`):

```freemarker
[#-- Condicional --]
[#if configuration.showCta!true]
  ...
[/#if]

[#-- Lista de items --]
[#list sourceObject.navItems as navItem]
  <li>${navItem.getName()}</li>
[/#list]

[#-- Verificar si una variable existe --]
[#if sourceObject??]
  ...
[/#if]
```

---

## FTL — markup de Liferay

El archivo `.ftl` (FreeMarker Template) es el que se sube a Liferay. El workflow lo gestiona así:

- **Si existe `src/fragments/[nombre]/[nombre].ftl`** → se copia tal cual al dist. **Nunca se sobreescribe.**
- **Si no existe** → el build extrae el `<body>` del HTML compilado por Pug y genera el `.ftl` automáticamente.

Cuando se crea un fragment nuevo, el `.ftl` se genera a partir del Pug. Si se necesita FreeMarker real (condicionales, variables de Liferay), se crea el `.ftl` manualmente en `src/` y el build lo respeta.

---

## Web Content

Los web-content siguen exactamente la misma estructura y reglas que los fragments. La única diferencia es su ubicación:

```
src/web-content/[nombre]/
  index.pug
  index.css
  index.js
  [nombre].ftl   ← opcional
  configuration.json
```

Y se suben a Liferay en **Web Content → Structures** en lugar de **Fragments**.

---

## Estructura de un fragment completo

```
src/fragments/mi-fragment/
  index.pug          ← markup para preview local (usa el layout)
  index.css         ← estilos autocontenidos
  index.js           ← JS procesado por Vite (primera línea: import './index.css')
  script.js          ← opcional: JS para Liferay con fragmentElement (tiene prioridad)
  mi-fragment.ftl    ← opcional: FTL manual para Liferay
  configuration.json ← variables configurables desde la UI
```

Tras `npm run build:fragments`:

```
dist/fragments/mi-fragment/
  mi-fragment.ftl    ← markup listo para Liferay
  index.css          ← estilos compilados
  index.js           ← JS compilado
  configuration.json ← copiado tal cual
  info.md            ← metadatos generados por el build
```
