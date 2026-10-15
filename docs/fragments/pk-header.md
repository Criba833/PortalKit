# Header PortalKit — Liferay Fragment

## 1. Descripción

Fragment reutilizable para el Header principal del sitio PortalKit.

El Header está construido utilizando **Liferay Fragments**, **FreeMarker**, **JavaScript**, **CSS/CSS** y **Bootstrap Icons**.

El Fragment permite:

- Seleccionar dinámicamente un Navigation Menu de Liferay.
- Renderizar elementos y submenús automáticamente.
- Editar el logo desde el Page Editor.
- Configurar el enlace del logo desde el Page Editor.
- Editar el enlace del CTA desde el Page Editor.
- Mostrar u ocultar el CTA mediante configuración.
- Gestionar el menú responsive para dispositivos móviles.
- Mostrar una barra de progreso de scroll.
- Cambiar el estado visual del Header al hacer scroll.

---

# 2. Arquitectura del Fragment

El Fragment está dividido en cuatro capas:

| Capa | Responsabilidad |
|---|---|
| **HTML / FreeMarker** | Estructura y renderizado dinámico |
| **Liferay Editable Elements** | Contenido editable desde Page Editor |
| **Configuration** | Opciones configurables del Fragment |
| **JavaScript** | Interacciones y comportamiento |
| **CSS / CSS** | Diseño, estados y responsive |

La idea principal es **no utilizar `configuration.json` para contenidos que Liferay ya permite editar directamente mediante Editable Elements**.

---

# 3. HTML / FreeMarker

El Header está compuesto por:

```text
<header>
│
├── Scroll Progress
│
└── Container
    │
    ├── Logo
    │
    ├── Navigation
    │   └── Submenus
    │
    ├── CTA
    │
    └── Mobile Toggle
```

El HTML completo debe mantenerse en esta sección.

---

# 4. Editable Elements de Liferay

Los elementos editables utilizan:

```html
data-lfr-editable-id="..."
data-lfr-editable-type="..."
```

Estos elementos **no necesitan ser declarados en `configuration.json`**.

## 4.1 Logo — Image

```html
<img
	class="pk-header__logo-image"
	data-lfr-editable-id="logo"
	data-lfr-editable-type="image"
	src="..."
	alt="PortalKit"
>
```

Permite cambiar la imagen directamente desde el Page Editor.

---

## 4.2 Logo — Link

```html
<a
	class="pk-header__logo"
	data-lfr-editable-id="logo-link"
	data-lfr-editable-type="link"
	href="/"
>
```

Permite configurar el destino del logo desde el editor de Liferay.

Puede utilizar:

- Página de Liferay
- URL externa
- Nueva pestaña
- Mapping

---

## 4.3 CTA — Link

```html
<a
	class="pk-header__cta"
	data-lfr-editable-id="cta"
	data-lfr-editable-type="link"
	href=""
>
	<span>Qué hacemos</span>
	<span class="pk-header__cta-icon">↗</span>
</a>
```

El enlace se administra mediante el editor nativo de Liferay.

La única característica que se controla mediante configuración es su visibilidad:

```ftl
[#if configuration.showCta!true]
```

---

# 5. Configuration.json

La configuración del Fragment contiene únicamente las opciones que realmente necesitan configuración.

```json
{
	"fieldSets": [
		{
			"label": "Navigation",
			"fields": [
				{
					"name": "source",
					"label": "Navigation Menu",
					"type": "navigationMenuSelector"
				}
			]
		},
		{
			"label": "CTA",
			"fields": [
				{
					"name": "showCta",
					"label": "Mostrar CTA",
					"type": "checkbox",
					"defaultValue": true
				}
			]
		}
	]
}
```

## 5.1 Navigation Menu

```json
{
	"name": "source",
	"label": "Navigation Menu",
	"type": "navigationMenuSelector"
}
```

Permite seleccionar el menú de navegación que utilizará el Header.

El menú seleccionado se recibe mediante:

```ftl
sourceObject
```

---

## 5.2 Mostrar CTA

```json
{
	"name": "showCta",
	"label": "Mostrar CTA",
	"type": "checkbox",
	"defaultValue": true
}
```

Controla si el CTA se muestra o se oculta.

En FreeMarker:

```ftl
[#if configuration.showCta!true]
	...
[/#if]
```

---

# 6. Navegación dinámica

La navegación no está escrita manualmente.

Liferay proporciona el objeto:

```ftl
sourceObject
```

El Header recorre:

```ftl
[#list sourceObject.navItems as navItem]
```

Cada elemento proporciona:

```ftl
navItem.getName()
navItem.getURL()
navItem.hasChildren()
```

Cuando existen hijos:

```ftl
navItem.getChildren()
```

se genera automáticamente el submenu.

Esto permite que el Header se adapte al Navigation Menu seleccionado sin modificar el código.

---

# 7. JavaScript

## 7.1 Fragment Element

El JavaScript utiliza:

```javascript
const header = fragmentElement.querySelector('.pk-header');
```

`fragmentElement` representa **la instancia actual del Fragment**.

Por eso se utiliza:

```javascript
fragmentElement.querySelector(...)
```

en lugar de:

```javascript
document.querySelector(...)
```

Esto evita afectar otros elementos o instancias del mismo Fragment presentes en la página. La documentación actual ya identifica este punto como una característica importante de la implementación. Markdown pegado

---

## 7.2 Scroll

El evento `scroll` controla el estado visual del Header.

Cuando:

```javascript
window.scrollY > 0
```

se agrega:

```text
is-scrolled
```

al Header.

CSS utiliza esta clase para modificar su apariencia.

---

## 7.3 Scroll Progress

La barra:

```html
<div class="pk-header__scroll-progress"></div>
```

representa visualmente el porcentaje de scroll de la página.

JavaScript calcula:

```javascript
const progress =
	(scrollTop / documentHeight) * 100;
```

y actualiza:

```javascript
scrollProgress.style.width = `${progress}%`;
```

---

## 7.4 Mobile Menu

El botón:

```html
<button class="pk-header__toggle">
```

abre y cierra la navegación móvil.

El estado se controla mediante:

```text
is-menu-open
```

Además, se actualizan:

```html
aria-expanded
aria-label
```

para mantener el comportamiento accesible.

---

## 7.5 Bootstrap Icons

El botón utiliza:

```html
<i class="bi bi-list"></i>
```

cuando el menú está cerrado.

Cuando se abre:

```html
<i class="bi bi-x-lg"></i>
```

El cambio se realiza mediante JavaScript.

Los submenús utilizan:

```html
<i class="bi bi-chevron-down"></i>
```

---

## 7.6 Mobile Submenus

Los elementos que tienen hijos reciben:

```text
has-submenu
```

En Desktop, la apertura se controla mediante CSS.

En Mobile, JavaScript utiliza:

```text
is-open
```

para abrir y cerrar el submenu.

Solo un submenu puede permanecer abierto al mismo tiempo.

---

## 7.7 Reset Responsive

Cuando el viewport vuelve a Desktop:

```javascript
window.innerWidth > 991
```

JavaScript:

1. Cierra el menú móvil.
2. Cierra los submenús.
3. Restablece `aria-expanded`.
4. Elimina los estados móviles.

---

# 8. Responsabilidad de cada tecnología

| Tecnología | Responsabilidad |
|---|---|
| **HTML** | Estructura semántica |
| **FreeMarker** | Renderizado dinámico de Liferay |
| **Liferay Editable Elements** | Edición de contenido |
| **configuration.json** | Configuración del Fragment |
| **JavaScript** | Interacciones |
| **CSS / CSS** | Diseño y responsive |
| **Bootstrap Icons** | Iconografía |

---

# 9. Resumen de implementación

| Elemento | Implementación |
|---|---|
| Logo | Liferay Editable Image |
| Link del logo | Liferay Editable Link |
| Navigation | `navigationMenuSelector` |
| Items | `sourceObject.navItems` |
| Submenús | `navItem.getChildren()` |
| Chevron | Bootstrap Icons |
| CTA | Liferay Editable Link |
| Mostrar CTA | `configuration.showCta` |
| Mobile menu | JavaScript |
| Scroll | JavaScript |
| Scroll progress | JavaScript |
| Responsive | CSS/CSS + JavaScript |

## 10. Regla principal de arquitectura

La documentación debería cerrar con esta idea:

> **Usar `configuration.json` para opciones de configuración del componente y utilizar `data-lfr-editable-*` para contenidos que el editor debe modificar directamente desde el Page Editor.**

De esta forma el Header permanece **reutilizable, configurable y mantenible**, sin agregar configuración innecesaria. Esta separación ya está implícita en el documento original, pero aquí queda mucho más clara. Markdown pegado
