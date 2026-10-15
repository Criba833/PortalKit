# GSAP — Client Extension

Documentación de la client extension GSAP: funciones disponibles, clases CSS, atributos de configuración y uso desde fragments.

---

## 1. Qué expone

La client extension carga GSAP + ScrollTrigger y los expone globalmente:

```js
window.gsap          // instancia de GSAP
window.ScrollTrigger // plugin ScrollTrigger
window.initGSAPEffects // función para re-inicializar manualmente
```

Además registra automáticamente todas las animaciones al cargar la página y en navegación SPA de Liferay (`endNavigate`).

---

## 2. Animaciones de texto por clase CSS

Añadir una clase CSS a cualquier elemento para activar la animación. El texto se divide automáticamente en letras/palabras y se anima al entrar en el viewport.

| Clase | Efecto | Anima por |
|---|---|---|
| `.gsap-fade-up` | Sube desde abajo con fade | Letra |
| `.gsap-word-reveal` | Aparece desde abajo | Palabra |
| `.gsap-scale-rotate` | Escala desde 0 + rotación X | Letra |
| `.gsap-clip-slide` | Clip horizontal + deslizamiento | Palabra |
| `.gsap-bounce` | Cae desde arriba con rebote | Letra |
| `.gsap-subtitle` | Fade up sutil (sin split) | Elemento completo |

### Uso en HTML/FTL

```html
<h1 class="gsap-fade-up">Texto animado</h1>
```

```html
<p class="gsap-subtitle">Subtítulo con fade sutil</p>
```

### Desactivar ScrollTrigger

Por defecto la animación se activa al hacer scroll. Para que se ejecute inmediatamente (sin scroll):

```html
<h1 class="gsap-fade-up gsap-no-scroll">Anima al cargar</h1>
```

---

## 3. Atributos de configuración por elemento

Todos los atributos son opcionales. Se aplican como `data-*` en el elemento HTML.

| Atributo | Qué controla | Default |
|---|---|---|
| `data-gsap-start` | Posición de inicio del ScrollTrigger | `top 75%` |
| `data-gsap-toggle` | toggleActions del ScrollTrigger | `play none none reverse` |
| `data-gsap-duration` | Duración de la animación (segundos) | Varía por efecto |
| `data-gsap-stagger` | Delay entre cada letra/palabra (segundos) | Varía por efecto |
| `data-gsap-delay` | Delay inicial antes de animar (segundos) | `0` |

### Ejemplo con atributos personalizados

```html
<h2
	class="gsap-fade-up"
	data-gsap-start="top 90%"
	data-gsap-duration="1.5"
	data-gsap-stagger="0.05"
	data-gsap-delay="0.3"
>
	Texto con timing personalizado
</h2>
```

---

## 4. Valores por defecto de cada efecto

| Efecto | Duration | Stagger | Ease |
|---|---|---|---|
| `gsap-fade-up` | 1s | 0.03s | `power3.out` |
| `gsap-word-reveal` | 1.2s | 0.1s | `power4.out` |
| `gsap-scale-rotate` | 0.8s | 0.02s | `back.out(1.7)` |
| `gsap-clip-slide` | 1.2s | 0.08s | `power2.inOut` |
| `gsap-bounce` | 1s | 0.025s | `bounce.out` |
| `gsap-subtitle` | 0.8s | — | `power2.out` |

---

## 5. Contador animado

Anima un numero desde 0 hasta el valor objetivo al entrar en el viewport.

### Uso

```html
<span
	class="gsap-counter"
	data-target="1500"
	data-prefix="+"
	data-suffix=" clientes"
	data-decimals="0"
>
	0
</span>
```

### Atributos del contador

| Atributo | Qué hace | Default |
|---|---|---|
| `data-target` | Valor final del contador | `0` |
| `data-prefix` | Texto antes del numero | (vacio) |
| `data-suffix` | Texto despues del numero | (vacio) |
| `data-decimals` | Cantidad de decimales | Sin decimales |
| `data-gsap-duration` | Duracion de la animacion | `2` |
| `data-gsap-delay` | Delay antes de iniciar | `0` |
| `data-gsap-start` | Posicion del ScrollTrigger | `top 80%` |

El formato incluye separador de miles automatico (ej. `1,500`).

---

## 6. Cards Stack

Anima un grupo de cards que aparecen apiladas con scroll scrub.

### HTML requerido

```html
<section class="section-cards">
	<div class="cards-stack">
		<div class="card-img">...</div>
		<div class="card-img">...</div>
		<div class="card-img">...</div>
	</div>
</section>
```

Tambien acepta la clase `.card-section` como contenedor.

### Atributos opcionales

| Atributo | Qué controla | Default |
|---|---|---|
| `data-gsap-pin` | Activar/desactivar pin | `true` |
| `data-gsap-start` | Posicion de inicio | `top top` (con pin) / `top 75%` (sin pin) |
| `data-gsap-end` | Posicion de fin | `+=350%` |

### Modo editor de Liferay

En el editor de Liferay las cards se muestran estaticas sin animacion para facilitar la edicion.

---

## 7. Horizontal Scroll

Seccion con scroll horizontal controlado por scroll vertical (pin + scrub).

### HTML requerido

```html
<section data-gsap-horizontal>
	<div data-gsap-horizontal-track>
		<div class="gsap-horizontal-panel">Panel 1</div>
		<div class="gsap-horizontal-panel">Panel 2</div>
		<div class="gsap-horizontal-panel">Panel 3</div>
	</div>
</section>
```

### Atributos opcionales

| Atributo | Qué controla | Default |
|---|---|---|
| `data-gsap-start` | Posicion de inicio | `top top` |

La distancia de scroll se calcula automaticamente segun el ancho total del track.

---

## 8. Story Scroll

Seccion tipo "storytelling" donde los beats (slides) cambian al scrollear. Solo un beat es visible a la vez.

### HTML requerido

```html
<section data-story-scroll>
	<div class="story__stage">
		<div class="story__beat">Beat 1</div>
		<div class="story__beat">Beat 2</div>
		<div class="story__beat">Beat 3</div>
	</div>

	<div class="story__meter">
		<button data-story-step="0">1</button>
		<button data-story-step="1">2</button>
		<button data-story-step="2">3</button>
	</div>
</section>
```

### Atributos opcionales

| Atributo | Qué controla | Default |
|---|---|---|
| `data-gsap-start` | Posicion de inicio | `top top` |
| `data-gsap-end` | Posicion de fin | `bottom bottom` |

### Comportamiento

- El stage se fija con pin mientras se scrollea
- Los beats hacen fade in/out automaticamente segun el progreso del scroll
- Los botones del meter permiten navegar manualmente por click
- Se genera una CSS variable `--story-rotation` que rota de 0 a 90deg segun el progreso

---

## 9. Accordion con imagenes

Accordion con animacion GSAP que puede mostrar imagenes asociadas a cada item.

### HTML requerido

```html
<section class="gsap-accordion-section">
	<div class="accordion-item active" data-target="img-1">
		<div class="accordion-header">Titulo</div>
		<div class="accordion-content">Contenido</div>
	</div>
	<div class="accordion-item" data-target="img-2">
		<div class="accordion-header">Titulo 2</div>
		<div class="accordion-content">Contenido 2</div>
	</div>

	<img class="accordion-img active" id="img-1" src="..." />
	<img class="accordion-img" id="img-2" src="..." />
</section>
```

### Comportamiento

- Solo un item abierto a la vez
- Al abrir un item, su imagen asociada aparece con fade + scale
- Las demas imagenes se ocultan
- El contenido se anima con `height: auto` / `height: 0`
- Soporta SVG animate con `data-accordion-animate="expand"` y `data-accordion-animate="collapse"`

---

## 10. Top Bars y Popups

### Top Bar

```html
<div class="top-bar-prehome-container">
	<button class="close-topbar">X</button>
	Contenido de la barra
</div>
```

Al hacer click en `.close-topbar` se agrega la clase `is-hidden`.

### Popup

```html
<div class="kubo-popup-overlay" data-popup-storage-key="miPopup">
	<div class="kubo-popup">
		<button class="kubo-popup-close">X</button>
		Contenido
	</div>
</div>
```

- Click en `.kubo-popup-close` o en el overlay cierra el popup (quita `is-visible`)
- Guarda el cierre en `sessionStorage` con la key configurada

---

## 11. Proteccion contra doble inicializacion

Todas las funciones usan un `data-*-initialized` para evitar registrar listeners duplicados:

```js
if (section.dataset.gsapCardsInitialized === 'true') return;
// ... inicializar ...
section.dataset.gsapCardsInitialized = 'true';
```

Esto permite que `init()` se llame multiples veces (ej. en navegacion SPA) sin efectos secundarios.

---

## 12. Modo editor de Liferay

Las funciones de Cards, Horizontal Scroll y Story Scroll detectan el modo edicion de Liferay:

```js
const isLiferayEdit =
	document.body.classList.contains('has-edit-mode-menu') ||
	document.body.classList.contains('lfr-has-sidebar') ||
	document.querySelector('.lfr-layout-structure-item-toolbar');
```

Cuando estan en modo edicion, muestran el contenido estatico sin animaciones de scroll para facilitar la edicion visual.

---

## 13. Ciclo de vida

```
DOMContentLoaded → init()
Liferay endNavigate → init()
Manual → window.initGSAPEffects()
```

El orden de inicializacion dentro de `init()`:

1. `initTopBars()`
2. `initPopups()`
3. `initCardsAnimation()`
4. `initHorizontalScroll()`
5. `initStoryScroll()`
6. `initAccordionAnimation()`
7. `ScrollTrigger.refresh()`
8. Animaciones de texto (split + apply)
9. `initCounters()`
10. Animaciones de subtitulos
