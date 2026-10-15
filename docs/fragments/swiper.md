# Swiper — Client Extension

Documentacion de la client extension Swiper: modulos disponibles, como usarla desde fragments y configuracion.

---

## 1. Que expone

La client extension carga Swiper con sus modulos y los expone globalmente:

```js
window.Swiper        // constructor de Swiper
window.SwiperModules // objeto con todos los modulos disponibles
```

Tambien incluye los CSS base de Swiper (core, navigation, pagination) empaquetados en `swiperjs.css`.

---

## 2. Modulos disponibles

| Modulo | Para que |
|---|---|
| `Navigation` | Flechas prev/next |
| `Pagination` | Bullets, fraction, progressbar |
| `Scrollbar` | Barra de scroll |
| `Autoplay` | Avance automatico |
| `EffectFade` | Transicion fade entre slides |
| `EffectCube` | Transicion 3D tipo cubo |
| `EffectFlip` | Transicion 3D tipo flip |
| `EffectCoverflow` | Transicion tipo coverflow |
| `FreeMode` | Scroll libre sin snap |
| `Grid` | Layout en grid multi-fila |
| `Thumbs` | Galeria con thumbnails |
| `Zoom` | Zoom en imagenes |
| `Keyboard` | Navegacion por teclado |
| `Mousewheel` | Navegacion por scroll del mouse |
| `A11y` | Accesibilidad (aria labels automaticos) |

---

## 3. Uso desde un fragment

### HTML basico

```html
<div class="swiper mi-carrusel">
	<div class="swiper-wrapper">
		<div class="swiper-slide">Slide 1</div>
		<div class="swiper-slide">Slide 2</div>
		<div class="swiper-slide">Slide 3</div>
	</div>

	<div class="swiper-button-prev"></div>
	<div class="swiper-button-next"></div>
	<div class="swiper-pagination"></div>
</div>
```

### JavaScript del fragment (script.js)

```js
const container = fragmentElement.querySelector('.mi-carrusel');
if (!container || !window.Swiper) return;

const { Navigation, Pagination, Autoplay } = window.SwiperModules;

new Swiper(container, {
	modules: [Navigation, Pagination, Autoplay],
	slidesPerView: 1,
	spaceBetween: 24,
	loop: true,
	autoplay: {
		delay: 5000,
		disableOnInteraction: false,
	},
	pagination: {
		el: container.querySelector('.swiper-pagination'),
		clickable: true,
	},
	navigation: {
		prevEl: container.querySelector('.swiper-button-prev'),
		nextEl: container.querySelector('.swiper-button-next'),
	},
});
```

### Puntos importantes

- Usar `fragmentElement.querySelector()` para scope, nunca `document.querySelector()`
- Solo importar los modulos que se necesitan en el array `modules`
- Los selectores de navigation/pagination deben apuntar al elemento dentro del fragment

---

## 4. Configuracion comun

### Responsive con breakpoints

```js
new Swiper(container, {
	modules: [Navigation, Pagination],
	slidesPerView: 1,
	spaceBetween: 16,
	breakpoints: {
		768: {
			slidesPerView: 2,
			spaceBetween: 24,
		},
		1200: {
			slidesPerView: 3,
			spaceBetween: 32,
		},
	},
	navigation: {
		prevEl: container.querySelector('.swiper-button-prev'),
		nextEl: container.querySelector('.swiper-button-next'),
	},
});
```

### Con efecto fade

```js
const { EffectFade, Autoplay } = window.SwiperModules;

new Swiper(container, {
	modules: [EffectFade, Autoplay],
	effect: 'fade',
	fadeEffect: { crossFade: true },
	autoplay: { delay: 4000 },
});
```

### Con thumbnails

```js
const { Thumbs, FreeMode } = window.SwiperModules;

const thumbSwiper = new Swiper(
	fragmentElement.querySelector('.swiper-thumbs'),
	{
		modules: [FreeMode],
		slidesPerView: 4,
		spaceBetween: 8,
		freeMode: true,
		watchSlidesProgress: true,
	}
);

new Swiper(container, {
	modules: [Thumbs],
	thumbs: { swiper: thumbSwiper },
});
```

### Con teclado y mousewheel

```js
const { Keyboard, Mousewheel } = window.SwiperModules;

new Swiper(container, {
	modules: [Keyboard, Mousewheel],
	keyboard: { enabled: true },
	mousewheel: { forceToAxis: true },
});
```

---

## 5. Archivos generados

```
dist/builds/swiperjs/
	swiperjs.js    ← JS con Swiper + modulos (IIFE)
	swiperjs.css   ← CSS base (core + navigation + pagination)
```

Ambos archivos se suben a Liferay como Client Extensions separadas:
- `swiperjs.js` → Client Extension Global JS
- `swiperjs.css` → Client Extension Global CSS

---

## 6. CSS personalizado

Los estilos base de Swiper vienen incluidos en `swiperjs.css`. Para personalizar la apariencia del carrusel, escribir los estilos en el `index.css` del fragment:

```css
.mi-carrusel {
	.swiper-button-prev,
	.swiper-button-next {
		color: var(--brand-color-1);
	}

	.swiper-pagination-bullet-active {
		background: var(--brand-color-1);
	}
}
```

Usar las variables del Style Book para mantener consistencia con el tema de Liferay.
