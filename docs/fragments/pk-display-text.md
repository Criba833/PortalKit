# PortalKit Display Text

**Documentación técnica del fragmento para Liferay DXP 7.4**


## 1. Descripción

`PortalKit Display Text` es un fragmento reutilizable de Liferay diseñado para mostrar textos tipográficos de gran tamaño, como titulares principales, mensajes destacados y encabezados visuales.

El componente permite configurar la etiqueta semántica HTML, el tamaño tipográfico fluido, el grosor de la fuente, el interlineado y el espaciado entre letras.

Está desarrollado con HTML, FreeMarker, CSS y la configuración nativa de fragmentos de Liferay. No necesita JavaScript propio para gestionar sus opciones tipográficas.

### Características principales

- Texto editable desde el editor de páginas de Liferay.
- Selección de etiqueta semántica: `H1`, `H2`, `H3`, `H4`, `H5`, `H6` o `P`.
- Tamaño tipográfico fluido mediante CSS `clamp()`.
- Configuración independiente del tamaño mínimo, fluido y máximo.
- Grosor tipográfico configurable.
- Interlineado independiente para escritorio y móvil.
- Espaciado entre letras independiente para escritorio y móvil, expresado en píxeles.
- Integración con clases de animación GSAP existentes.
- Sin JavaScript propio.

---

## 2. Estructura del fragmento

El fragmento contiene tres partes principales:

| Archivo | Responsabilidad |
|---|---|
| `index.html` | Estructura HTML, etiqueta semántica y variables CSS generadas desde FreeMarker. |
| `index.css` | Estilos tipográficos, diseño responsive y consumo de variables CSS. |
| `configuration.json` | Campos configurables desde el panel General de Liferay. |

El nombre del fragmento en Liferay es **PortalKit Display Text**.

---

## 3. HTML y FreeMarker

El HTML utiliza FreeMarker para generar dinámicamente la etiqueta semántica seleccionada en la configuración.

```ftl
<${configuration.textTag!"h1"}
	class="pk-display-text gsap-fade-up gsap-no-scroll"
	data-lfr-editable-id="display-text"
	data-lfr-editable-type="text"
	style="
		--pk-font-size-desktop: clamp(${configuration.fontSizeMin!'4rem'}, ${configuration.fontSizeFluid!'8vw + 1rem'}, ${configuration.fontSizeMax!'10.625rem'});
		--pk-font-weight: ${configuration.fontWeight!'800'};
		--pk-line-height-desktop: ${configuration.lineHeightDesktop!'0.85'};
		--pk-line-height-mobile: ${configuration.lineHeightMobile!'0.9'};
		--pk-letter-spacing-desktop: ${configuration.letterSpacingDesktop!'0px'};
		--pk-letter-spacing-mobile: ${configuration.letterSpacingMobile!'0px'};
	"
>
	NADASE<br>
	MUEVE
</${configuration.textTag!"h1"}>
```

### 3.1. Etiqueta semántica dinámica

La expresión:

```ftl
${configuration.textTag!"h1"}
```

obtiene la etiqueta seleccionada en la configuración. Si no existe un valor, utiliza `h1` como valor predeterminado.

Ejemplos de etiquetas generadas:

```html
<h1 class="pk-display-text">...</h1>
```

```html
<h2 class="pk-display-text">...</h2>
```

```html
<p class="pk-display-text">...</p>
```

El cambio de etiqueta se realiza mediante FreeMarker, sin JavaScript y sin duplicar el elemento editable.

**Importante:** la etiqueta semántica define la jerarquía del contenido; el CSS controla su apariencia. Selecciona el nivel que corresponda a la estructura real de la página.

### 3.2. Elemento editable

```html
data-lfr-editable-id="display-text"
data-lfr-editable-type="text"
```

- `data-lfr-editable-id`: identifica el contenido editable de manera única.
- `data-lfr-editable-type`: establece que el contenido es texto simple.

El fragmento contiene un solo elemento editable, aunque visualmente muestre dos líneas.

El contenido inicial es:

```text
NADASE
MUEVE
```

El salto de línea se genera mediante `<br>`. Ambos textos forman parte del mismo contenido editable.

### 3.3. Clases de animación

```html
gsap-fade-up gsap-no-scroll
```

Estas clases se conservan para integrarse con los estilos o mecanismos de animación existentes en el proyecto. El fragmento no implementa por sí mismo la animación GSAP.

### 3.4. Variables CSS

Los valores de configuración se insertan en el atributo `style` del elemento como propiedades personalizadas:

```css
--pk-font-size-desktop
--pk-font-weight
--pk-line-height-desktop
--pk-line-height-mobile
--pk-letter-spacing-desktop
--pk-letter-spacing-mobile
```

Esta técnica conecta los valores definidos en `configuration.json` con el CSS, sin escribir expresiones FreeMarker directamente en el archivo CSS.

---

## 4. CSS

El CSS define la apariencia del texto y adapta el interlineado y el espaciado entre letras a dispositivos móviles.

```css
.pk-display-text {
	width: 100%;
	margin: 0;
	overflow: hidden;
	font-family: inherit;

	font-size: var(--pk-font-size-desktop);
	font-weight: var(--pk-font-weight);
	line-height: var(--pk-line-height-desktop);
	letter-spacing: var(--pk-letter-spacing-desktop);
}

@media (max-width: 767px) {
	.pk-display-text {
		line-height: var(--pk-line-height-mobile);
		letter-spacing: var(--pk-letter-spacing-mobile);
	}
}
```

### 4.1. Propiedades principales

| Propiedad | Función |
|---|---|
| `width: 100%` | Ocupa el ancho disponible del contenedor. |
| `margin: 0` | Elimina el margen predeterminado del encabezado o párrafo. |
| `overflow: hidden` | Recorta el contenido que sobresale del contenedor. |
| `font-family: inherit` | Hereda la familia tipográfica del contexto. |
| `font-size` | Utiliza el tamaño fluido generado mediante `clamp()`. |
| `font-weight` | Controla el grosor de la fuente. |
| `line-height` | Controla la distancia vertical entre líneas. |
| `letter-spacing` | Controla la separación horizontal entre letras. |

### 4.2. Tamaño fluido con `clamp()`

La configuración genera esta propiedad:

```css
font-size: clamp(4rem, 8vw + 1rem, 10.625rem);
```

La función `clamp()` recibe tres valores:

```css
clamp(mínimo, valor-fluido, máximo)
```

- **Mínimo:** establece el límite inferior.
- **Fluido:** permite que el tamaño cambie según el ancho de la ventana.
- **Máximo:** establece el límite superior.

Con una raíz de `16px`, los valores predeterminados equivalen a:

| Parámetro | Valor | Equivalencia |
|---|---|---:|
| Tamaño mínimo | `4rem` | 64px |
| Tamaño fluido | `8vw + 1rem` | Depende del ancho de la ventana |
| Tamaño máximo | `10.625rem` | 170px |

El tamaño fluido se utiliza en todas las resoluciones. No existe un campo independiente para el tamaño móvil.

### 4.3. Comportamiento responsive

El breakpoint establecido es:

```css
@media (max-width: 767px)
```

En móvil se modifican estas propiedades:

- `line-height`
- `letter-spacing`

El tamaño sigue controlado por `clamp()`, y `font-weight` mantiene un valor común para todos los dispositivos.

---

## 5. Configuración: `configuration.json`

Esta configuración define las opciones disponibles en la pestaña General del fragmento.

```json
{
	"fieldSets": [
		{
			"label": "Tipografía",
			"fields": [
				{
					"name": "textTag",
					"label": "Etiqueta",
					"type": "select",
					"dataType": "string",
					"defaultValue": "h1",
					"typeOptions": {
						"validValues": [
							{ "label": "H1", "value": "h1" },
							{ "label": "H2", "value": "h2" },
							{ "label": "H3", "value": "h3" },
							{ "label": "H4", "value": "h4" },
							{ "label": "H5", "value": "h5" },
							{ "label": "H6", "value": "h6" },
							{ "label": "Párrafo", "value": "p" }
						]
					}
				},
				{
					"name": "fontSizeMin",
					"label": "Tamaño mínimo",
					"type": "text",
					"dataType": "string",
					"defaultValue": "4rem"
				},
				{
					"name": "fontSizeFluid",
					"label": "Tamaño fluido",
					"type": "text",
					"dataType": "string",
					"defaultValue": "8vw + 1rem"
				},
				{
					"name": "fontSizeMax",
					"label": "Tamaño máximo",
					"type": "text",
					"dataType": "string",
					"defaultValue": "10.625rem"
				},
				{
					"name": "fontWeight",
					"label": "Grosor",
					"type": "select",
					"dataType": "string",
					"defaultValue": "800",
					"typeOptions": {
						"validValues": [
							{ "label": "100 - Fino", "value": "100" },
							{ "label": "200 - Extra ligero", "value": "200" },
							{ "label": "300 - Ligero", "value": "300" },
							{ "label": "400 - Normal", "value": "400" },
							{ "label": "500 - Medio", "value": "500" },
							{ "label": "600 - Seminegrita", "value": "600" },
							{ "label": "700 - Negrita", "value": "700" },
							{ "label": "800 - Extranegrita", "value": "800" },
							{ "label": "900 - Negro", "value": "900" }
						]
					}
				},
				{
					"name": "lineHeightDesktop",
					"label": "Interlineado escritorio",
					"type": "text",
					"dataType": "string",
					"defaultValue": "0.85"
				},
				{
					"name": "lineHeightMobile",
					"label": "Interlineado móvil",
					"type": "text",
					"dataType": "string",
					"defaultValue": "0.9"
				},
				{
					"name": "letterSpacingDesktop",
					"label": "Espaciado escritorio (px)",
					"type": "text",
					"dataType": "string",
					"defaultValue": "0px"
				},
				{
					"name": "letterSpacingMobile",
					"label": "Espaciado móvil (px)",
					"type": "text",
					"dataType": "string",
					"defaultValue": "0px"
				}
			]
		}
	]
}
```

### 5.1. Opciones disponibles

| Campo | Valores predeterminados | Uso |
|---|---|---|
| Etiqueta | `h1` | Define el elemento HTML. |
| Tamaño mínimo | `4rem` | Límite inferior del tamaño. |
| Tamaño fluido | `8vw + 1rem` | Expresión que determina el crecimiento fluido. |
| Tamaño máximo | `10.625rem` | Límite superior del tamaño. |
| Grosor | `800` | Grosor tipográfico común a todos los dispositivos. |
| Interlineado escritorio | `0.85` | Interlineado para escritorio y pantallas mayores de 767px. |
| Interlineado móvil | `0.9` | Interlineado para pantallas de hasta 767px. |
| Espaciado escritorio | `0px` | Separación entre letras en escritorio. |
| Espaciado móvil | `0px` | Separación entre letras en móvil. |

### 5.2. Cómo se genera el tamaño

Los tres campos de tamaño se combinan en el HTML mediante FreeMarker:

```ftl
clamp(
	${configuration.fontSizeMin!'4rem'},
	${configuration.fontSizeFluid!'8vw + 1rem'},
	${configuration.fontSizeMax!'10.625rem'}
)
```

El resultado equivale a:

```css
font-size: clamp(4rem, 8vw + 1rem, 10.625rem);
```

Los valores predeterminados del JSON se utilizan cuando no hay otro valor configurado para el campo.

**Importante:** si modificas `defaultValue` después de haber configurado una instancia del fragmento, es posible que el valor guardado anteriormente continúe vigente. En ese caso, actualízalo desde el panel de configuración de la instancia.

---

## 6. Uso en Liferay

1. Inserta el fragmento **PortalKit Display Text** en una página.
2. Abre la configuración del fragmento.
3. Selecciona la etiqueta semántica correspondiente.
4. Define el tamaño mínimo, fluido y máximo.
5. Selecciona el grosor tipográfico.
6. Ajusta el interlineado para escritorio y móvil.
7. Ajusta el espaciado entre letras para cada dispositivo.
8. Edita el contenido desde el editor de texto de Liferay.
9. Guarda los cambios y publica la página cuando corresponda.

### Ejemplo de configuración

```text
Etiqueta: H1

Tamaño mínimo: 4rem
Tamaño fluido: 8vw + 1rem
Tamaño máximo: 10.625rem

Grosor: 800

Interlineado escritorio: 0.85
Interlineado móvil: 0.9

Espaciado escritorio: 0px
Espaciado móvil: 0px
```

---

## 7. Consideraciones técnicas

### Identificador editable único

El fragmento utiliza un único identificador:

```html
data-lfr-editable-id="display-text"
```

No se debe repetir el mismo ID en diferentes ramas condicionales del HTML. La etiqueta dinámica evita duplicar el elemento editable.

### Etiqueta semántica y apariencia

Seleccionar `H1`, `H2`, `H3`, `H4`, `H5`, `H6` o `P` cambia la semántica del elemento. No cambia automáticamente el tamaño visual, ya que este se define mediante CSS.

### Un solo campo de texto

El contenido completo es un solo editable. El salto de línea se representa mediante `<br>`, por lo que el usuario edita ambas líneas dentro del mismo campo.

### Compatibilidad con estilos de Liferay

El color, la alineación y otras propiedades pueden gestionarse mediante los estilos nativos de Liferay cuando estos estén disponibles y correctamente aplicados al elemento. El fragmento no fija un color explícito en su CSS, lo que evita bloquear la herencia del color.

### Integración con GSAP

Las clases `gsap-fade-up` y `gsap-no-scroll` se mantienen para integrarse con las convenciones de animación del proyecto. La animación depende de la implementación existente en el sitio.

---

## 8. Resumen

**PortalKit Display Text** es un fragmento tipográfico configurable que combina:

- HTML semántico dinámico mediante FreeMarker.
- Un único campo editable de texto.
- Configuración nativa mediante `configuration.json`.
- Tamaño fluido mediante `clamp()`.
- Parámetros tipográficos editables desde Liferay.
- Interlineado y espaciado responsive.
- Compatibilidad con las clases de animación existentes.

La separación entre configuración, estructura y estilos permite reutilizar el componente en distintas páginas sin duplicar el código HTML ni recurrir a JavaScript para cambiar la etiqueta semántica.
