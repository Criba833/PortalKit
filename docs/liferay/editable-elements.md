# Liferay — Editable Elements

Los Editable Elements permiten al editor de Liferay modificar contenido de un fragment directamente desde la UI, sin tocar código.

Se declaran con los atributos `data-lfr-editable-id` y `data-lfr-editable-type` en el `.ftl`.

---

## Tipos disponibles

| Tipo | `data-lfr-editable-type` | Para qué sirve |
|---|---|---|
| **Text** | `text` | Texto simple (sin HTML) |
| **Rich Text** | `rich-text` | Texto con formato HTML |
| **Image** | `image` | Imágenes |
| **Link** | `link` | Enlaces, páginas, URLs externas, mapping |
| **HTML** | `html` | Editar contenido HTML libre |

---

## Text

```html
<h2
  data-lfr-editable-id="title"
  data-lfr-editable-type="text"
>
  Título por defecto
</h2>
```

Texto plano. El editor no puede aplicar formato HTML.

---

## Rich Text

```html
<p
  data-lfr-editable-id="description"
  data-lfr-editable-type="rich-text"
>
  Descripción <strong>importante</strong>
</p>
```

Permite formato enriquecido: negrita, cursiva, listas, etc.

---

## Image

```html
<img
  data-lfr-editable-id="image"
  data-lfr-editable-type="image"
  src="imagen.jpg"
  alt=""
>
```

Permite cambiar la imagen, el alt y sus propiedades desde el editor.

---

## Link

```html
<a
  data-lfr-editable-id="cta"
  data-lfr-editable-type="link"
  href="#"
>
  Ver más
</a>
```

Permite configurar el tipo de enlace, URL, target y mapping desde el editor. Soporta `mailto:` y `tel:`.

---

## HTML

```html
<div
  data-lfr-editable-id="content"
  data-lfr-editable-type="html"
>
  <h2>Contenido</h2>
  <p>Texto...</p>
</div>
```

Permite editar HTML directamente desde el editor.

---

## Regla importante: no anidar editables

Liferay **no soporta** anidar un Editable Element dentro de otro Editable Element.

```html
<!-- ❌ No soportado -->
<a data-lfr-editable-type="link">
  <img data-lfr-editable-type="image">
</a>
```

En su lugar, hacer editable solo uno de los dos o usar otro mecanismo:

```html
<!-- ✅ Solo el link es editable; la imagen no -->
<a
  class="pk-header__logo"
  data-lfr-editable-id="logo-link"
  data-lfr-editable-type="link"
  href="/"
>
  <img
    class="pk-header__logo-image"
    src="..."
    alt="PortalKit"
  >
</a>
```

---

## IDs únicos con `fragmentEntryLinkNamespace`

Cuando el fragment puede aparecer varias veces en la misma página, usar `fragmentEntryLinkNamespace` para garantizar que el `id` HTML sea único:

```html
<a
  data-lfr-editable-id="cta"
  data-lfr-editable-type="link"
  id="fragment-${fragmentEntryLinkNamespace}-cta"
  href="#"
>
  Ver más
</a>
```

---

## Sintaxis Pug — mixins disponibles

En desarrollo se usan los mixins de `src/views/mixins/liferay.pug` en lugar de escribir los atributos a mano. El build convierte el HTML generado en el `.ftl` de Liferay.

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

El segundo parámetro es la etiqueta HTML (`h1`, `h2`, `p`, `span`…). Por defecto `p`.

---

### Imagen editable

```pug
+editableImage('foto', '/img/placeholder.jpg', 'Alt del placeholder')
```

Genera:

```html
<img
  data-lfr-editable-id="foto"
  data-lfr-editable-type="image"
  src="/img/placeholder.jpg"
  alt="Alt del placeholder"
>
```

---

### Enlace editable

```pug
+editableLink('cta', '#')
  | Ver más
```

Genera:

```html
<a data-lfr-editable-id="cta" data-lfr-editable-type="link" href="#">
  Ver más
</a>
```

El contenido dentro del mixin puede ser texto, iconos o cualquier elemento Pug.

---

### Rich text editable

```pug
+editableRichText('descripcion')
  p Texto con <strong>negrita</strong>
```

Genera:

```html
<div data-lfr-editable-id="descripcion" data-lfr-editable-type="rich-text">
  <p>Texto con <strong>negrita</strong></p>
</div>
```

---

### Regla: importar los mixins en el Pug del fragment

Los mixins no están disponibles por defecto — hay que incluirlos al inicio del archivo:

```pug
extends /views/layouts/fragment.pug
include /views/mixins/liferay.pug

block content
  .mi-fragment
    +editableText('titulo', 'h2') Título
    +editableImage('imagen', '/img/placeholder.jpg', 'Alt')
    +editableLink('cta', '#') Ver más
```
