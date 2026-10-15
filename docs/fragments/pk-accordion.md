# PortalKit Accordion — Web Content Template

## 1. Objetivo

El componente `PortalKit Accordion` se implementa como **un único Web Content Template** que recibe un Web Content con un **Fields Group repetible** y genera automáticamente todos los acordeones.

La estructura final es:

```text
Web Content
└── Fields Group: accordionItems (Repeatable)
    ├── title
    ├── subtitle
    └── content
            ↓
Web Content Template: Accordion PortalKit Template
            ↓
<div class="pk-accordion">
    <article class="pk-accordion-item">...</article>
    <article class="pk-accordion-item">...</article>
    ...
</div>
```

El template actual recorre `accordionItems`, calcula el total y genera el índice de cada repetición directamente con FreeMarker.

---

## 2. Field References

Los `Field Reference` definidos para la estructura son:

| Elemento | Field Reference |
|---|---|
| Fields Group | `accordionItems` |
| Título | `title` |
| Subtítulo | `subtitle` |
| Contenido | `content` |

Es importante usar el **Field Reference exacto** en FreeMarker.

No usar las etiquetas visuales del editor si son diferentes al Field Reference.

Ejemplo:

```ftl
<#list accordionItems.getSiblings() as item>
    ${item.title.getData()}
    ${item.subtitle.getData()}
    ${item.content.getData()}
</#list>
```

---

## 3. Fields Group repetible

`accordionItems` es un **Fields Group con Repeatable activado**.

Esto permite tener:

```text
Item 1
Item 2
Item 3
Item 4
```

dentro de un único Web Content.

No es necesario crear un Web Content diferente para cada acordeón.

Para este proyecto, el Web Content puede contener:

```text
Lo que vemos
├── Accordion Item 1
├── Accordion Item 2
├── Accordion Item 3
└── Accordion Item 4
```

---

## 4. Web Content Template

El template debe recorrer el Fields Group:

```ftl
<#if accordionItems.getSiblings()?has_content>

    <#assign accordions = accordionItems.getSiblings()>
    <#assign total = accordions?size>
    <#assign formattedTotal = total?string("00")>

    <#list accordions as item>
        ...
    </#list>

</#if>
```

### Por qué se usa `getSiblings()`

`getSiblings()` obtiene las diferentes repeticiones del Fields Group.

Por ejemplo:

```text
accordionItems.getSiblings()
```

devuelve conceptualmente:

```text
[
    item 1,
    item 2,
    item 3,
    item 4
]
```

Por eso se puede recorrer con:

```ftl
<#list accordions as item>
```

---

## 5. Contador

El contador se genera **con FreeMarker**, no con JavaScript.

```ftl
${item?counter?string("00")} / ${formattedTotal}
```

Resultado:

```text
01 / 04
02 / 04
03 / 04
04 / 04
```

Esto es preferible porque el template ya conoce:

- el índice de la repetición;
- el número total de repeticiones.

### Importante

No volver a calcular el contador con JavaScript salvo que exista una necesidad específica.

Así se evita duplicar responsabilidades.

---

## 6. HTML generado

La estructura principal debe ser:

```html
<div class="pk-accordion">

    <article
        class="pk-accordion-item"
        data-accordion-item
        data-open="false"
    >

        <div class="pk-accordion-header">

            <span
                class="pk-accordion-counter"
                data-accordion-counter
                aria-hidden="true"
            >
                01 / 04
            </span>

            <h2 class="pk-accordion-title">
                Innovación y tecnología
            </h2>

            <button
                class="pk-accordion-toggle"
                type="button"
                data-accordion-toggle
                aria-expanded="false"
                aria-label="Abrir contenido"
            >
                <i
                    class="bi bi-x"
                    aria-hidden="true"
                ></i>
            </button>

        </div>

        <div
            class="pk-accordion-content"
            data-accordion-panel
            aria-hidden="true"
        >

            <h3 class="pk-accordion-subtitle">
                Subtítulo
            </h3>

            <div class="pk-accordion-description">
                Contenido
            </div>

        </div>

    </article>

</div>
```

Todos los `<article>` quedan dentro de **un único `.pk-accordion`**.

Esto convierte al `.pk-accordion` en el grupo lógico del componente.

---

## 7. No usar `data-lfr-editable-*`

En el Fragment original se utilizaban:

```html
data-lfr-editable-id="title"
data-lfr-editable-type="text"
```

y equivalentes para `subtitle` y `content`.

En el **Web Content Template no son necesarios**.

El contenido ahora viene directamente desde FreeMarker:

```ftl
${item.title.getData()}
${item.subtitle.getData()}
${item.content.getData()}
```

Por eso el template no debe depender de:

```html
data-lfr-editable-id
data-lfr-editable-type
```

---

## 8. CSS

Todos los estilos deben estar encapsulados bajo:

```css
.pk-accordion {
    ...
}
```

La estructura recomendada es:

```text
.pk-accordion
└── .pk-accordion-item
    ├── .pk-accordion-header
    ├── .pk-accordion-counter
    ├── .pk-accordion-title
    ├── .pk-accordion-toggle
    ├── .pk-accordion-content
    ├── .pk-accordion-subtitle
    └── .pk-accordion-description
```

Esto evita que estilos del Accordion se apliquen accidentalmente a otros componentes de la página.

### Estado abierto

El estado visual se controla con:

```html
data-open="true"
```

y:

```css
.pk-accordion-item[data-open="true"] {
    ...
}
```

El JavaScript solo cambia este estado.

---

## 9. JavaScript

El JavaScript tiene una responsabilidad específica:

```text
Abrir
Cerrar
Cerrar los demás
Actualizar aria-expanded
Actualizar aria-hidden
Definir estado inicial
```

No debe volver a calcular el contador.

### Regla importante

El JS debe trabajar sobre el padre:

```js
.pk-accordion
```

y obtener sus items:

```js
const items = Array.from(
    container.querySelectorAll('[data-accordion-item]')
);
```

De esta manera:

```text
.pk-accordion
├── item 1
├── item 2
├── item 3
└── item 4
```

se considera un único grupo.

---

## 10. Protección contra doble inicialización

El template actual utiliza:

```js
if (
    !container ||
    container.dataset.accordionInitialized === 'true'
) {
    return;
}
```

y después:

```js
container.dataset.accordionInitialized = 'true';
```

Esto evita que el mismo contenedor registre varias veces el listener.

Es especialmente útil cuando el contenido se vuelve a procesar o inicializar nuevamente.

---

## 11. Event delegation

El click se registra en el padre:

```js
container.addEventListener('click', function (event) {
    ...
});
```

y después se identifica:

```js
event.target.closest('[data-accordion-toggle]')
```

o:

```js
event.target.closest('.pk-accordion-title')
```

Esto es preferible a registrar manualmente un listener independiente para cada botón.

---

## 12. Estado inicial

Actualmente el primer item se abre cuando ninguno tiene:

```html
data-open="true"
```

La lógica es:

```js
const activeItem = items.find(function (item) {
    return item.dataset.open === 'true';
});

if (activeItem) {
    openItem(activeItem);
} else {
    openItem(items[0]);
}
```

Resultado inicial:

```text
01 / 04 → abierto
02 / 04 → cerrado
03 / 04 → cerrado
04 / 04 → cerrado
```

---

## 13. Accesibilidad

El estado visual debe mantenerse sincronizado con los atributos ARIA.

### Cerrado

```html
<button
    aria-expanded="false"
    aria-label="Abrir contenido"
>
```

```html
<div
    aria-hidden="true"
>
```

### Abierto

```html
<button
    aria-expanded="true"
    aria-label="Cerrar contenido"
>
```

```html
<div
    aria-hidden="false"
>
```

Cuando el JS abre o cierra un item, debe actualizar ambos estados.

---

## 14. Problema que se evitó

### Implementación anterior

Cuando `PortalKit Accordion` era un Fragment repetido:

```text
Fragment 1 → JS
Fragment 2 → JS
Fragment 3 → JS
Fragment 4 → JS
```

cada instancia podía ejecutar su propio JavaScript.

Esto provocaba problemas como:

```text
- listeners duplicados;
- acordeones que no respondían;
- cada instancia creyendo que era un grupo independiente;
- contadores 01 / 01;
- comportamiento inconsistente en el editor y publicado.
```

### Implementación actual

Ahora:

```text
1 Web Content
      ↓
1 Web Content Template
      ↓
1 .pk-accordion
      ↓
N .pk-accordion-item
```

El template genera todos los items y un solo JS controla el grupo.

---

## 15. Problema importante con FreeMarker + JavaScript

Un Web Content Template se procesa con FreeMarker.

Por eso hay que tener cuidado con expresiones JavaScript como:

```js
`${current} / ${formattedTotal}`
```

FreeMarker puede interpretar:

```text
${current}
```

como una expresión FreeMarker.

Eso produjo el error:

```text
The following has evaluated to null or missing:
==> current
```

### Solución

No utilizar template literals de JavaScript cuando contengan `${...}` dentro del Web Content Template.

En su lugar:

```js
counter.textContent = current + ' / ' + formattedTotal;
```

En este componente la mejor solución fue todavía más sencilla:

**eliminar del JS toda la lógica del contador**, porque FreeMarker ya lo genera.

---

## 16. Qué debe quedar en cada capa

### Web Content

Solo contiene datos:

```text
accordionItems
├── title
├── subtitle
└── content
```

### Web Content Template

Se encarga de:

```text
- recorrer las repeticiones;
- generar el HTML;
- imprimir los datos;
- generar el contador.
```

### CSS / CSS

Se encarga de:

```text
- layout;
- tipografía;
- bordes;
- responsive;
- animación visual;
- estado abierto/cerrado.
```

### JavaScript

Se encarga de:

```text
- interacción;
- abrir;
- cerrar;
- cerrar los demás;
- ARIA;
- estado inicial.
```

---

## 17. Checklist para futuros cambios

Antes de modificar el componente, comprobar:

- [ ] El Fields Group sigue siendo `Repeatable`.
- [ ] `accordionItems` sigue siendo el Field Reference del grupo.
- [ ] `title`, `subtitle` y `content` siguen siendo los Field References internos.
- [ ] Todos los items se generan dentro de `.pk-accordion`.
- [ ] El contador se genera con FreeMarker.
- [ ] JavaScript no contiene `${...}` de template literals.
- [ ] El JS no vuelve a calcular el contador.
- [ ] `data-open` controla el estado visual.
- [ ] `aria-expanded` y `aria-hidden` se actualizan al abrir/cerrar.
- [ ] El listener se registra sobre `.pk-accordion`.
- [ ] No se vuelve a introducir un JS independiente por cada `<article>`.
- [ ] Los estilos permanecen encapsulados bajo `.pk-accordion`.

---

## 18. Template base actual

La parte FreeMarker principal del template queda así:

```ftl
<div class="pk-accordion">

    <#if accordionItems.getSiblings()?has_content>

        <#assign accordions = accordionItems.getSiblings()>
        <#assign total = accordions?size>
        <#assign formattedTotal = total?string("00")>

        <#list accordions as item>

            <article
                class="pk-accordion-item"
                data-accordion-item
                data-open="false"
            >

                <div class="pk-accordion-header">

                    <span
                        class="pk-accordion-counter"
                        aria-hidden="true"
                    >
                        ${item?counter?string("00")} / ${formattedTotal}
                    </span>

                    <h2 class="pk-accordion-title">
                        ${item.title.getData()}
                    </h2>

                    <button
                        class="pk-accordion-toggle"
                        type="button"
                        data-accordion-toggle
                        aria-expanded="false"
                        aria-label="Abrir contenido"
                    >
                        <i
                            class="bi bi-x"
                            aria-hidden="true"
                        ></i>
                    </button>

                </div>

                <div
                    class="pk-accordion-content"
                    data-accordion-panel
                    aria-hidden="true"
                >

                    <#if item.subtitle.getData()?has_content>
                        <h3 class="pk-accordion-subtitle">
                            ${item.subtitle.getData()}
                        </h3>
                    </#if>

                    <#if item.content.getData()?has_content>
                        <div class="pk-accordion-description">
                            ${item.content.getData()}
                        </div>
                    </#if>

                </div>

            </article>

        </#list>

    </#if>

</div>
```

---

## 19. Referencia final de arquitectura

```text
PortalKit Accordion
│
├── Structure
│   └── Accordion Items (Repeatable)
│       ├── title
│       ├── subtitle
│       └── content
│
├── Web Content
│   └── Lo que vemos
│       └── N accordion items
│
└── Web Content Template
    ├── FreeMarker
    │   ├── getSiblings()
    │   ├── loop
    │   ├── counter
    │   └── field values
    │
    ├── CSS
    │   └── .pk-accordion
    │
    └── JavaScript
        └── accordion behavior
```

## Regla principal

**Un Web Content + un Fields Group Repeatable + un Web Content Template = N acordeones dentro de un único `.pk-accordion`.**

No volver a duplicar el Fragment para representar cada repetición cuando el contenido ya está modelado como un Fields Group repetible.
