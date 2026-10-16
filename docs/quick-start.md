# Quick Start

## Requisitos

- Node.js 20+
- npm 10+

## Instalación

```bash
npm install
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor local con HMR en `http://localhost:5173` |
| `npm run build:liferay` | Build completo de Liferay: fragments + web-content + client extensions |
| `npm run build:fragments` | Solo fragments (Vite + ensamblado Liferay) |
| `npm run build:web-content` | Solo web content (Vite + ensamblado Liferay) |
| `npm run build:extensions` | Solo client extensions (gsap, swiperjs, etc.) |
| `npm run build:extensions -- gsap` | Solo la client extension indicada |
| `npm run preview` | Sirve `dist/` (catálogo en `/`) |
| `npm run clean` | Borra `dist/` |

Cada comando de build es autónomo: compila con Vite lo que necesita y ensambla sus
artefactos. No hace falta ejecutar otro comando antes.

## Flujo de desarrollo

```
1. npm run dev
2. Abre http://localhost:5173/views/index.html   ← preview general
3. Navega a /fragments/[nombre]/                 ← preview de un fragment
4. Navega a /web-content/[nombre]/              ← preview de un web content
5. Edita .pug / .css / .js → el browser recarga automáticamente
```

## Flujo de build y deploy

```
1. npm run build:liferay
2. Sube dist/fragments/[nombre]/      → Liferay: Site Builder → Fragments
3. Sube dist/web-content/[nombre]/   → Liferay: Content → Web Content → Templates
4. Sube dist/builds/[nombre]/[nombre].js → Liferay: Documents & Media
   → copia la URL → Control Panel → Client Extensions → nueva Global JS
```

Ver [Liferay — Client Extensions](liferay/client-extensions.md) para el proceso detallado de subida.

## Añadir un fragment nuevo

1. Crear la carpeta `src/fragments/mi-fragment/`
2. Crear los archivos:

```
src/fragments/mi-fragment/
  index.pug              ← markup
  index.css             ← estilos
  index.js               ← JS (debe importar ./index.css en la primera línea)
  configuration.json     ← opcional: campos configurables desde la UI de Liferay
  mi-fragment.ftl        ← opcional: FTL manual si se necesita FreeMarker
```

3. Listo — Vite lo detecta automáticamente. Disponible en `/fragments/mi-fragment/`

## Añadir un web content nuevo

Igual que un fragment pero en `src/web-content/`:

```
src/web-content/mi-content/
  index.pug
  index.css
  index.js
  configuration.json     ← opcional
  mi-content.ftl         ← opcional
```

## Añadir una client extension nueva

1. Crear la carpeta `src/client-extensions/mi-libreria/`
2. Crear los archivos:

```
src/client-extensions/mi-libreria/
  index.js       ← importa la librería y la expone en window.*
  config.json    ← { "name": "Mi Librería", "type": "globalJS" }
```

3. Instalar el paquete npm si hace falta:

```bash
npm install mi-libreria
```

4. Buildear:

```bash
npm run build:extensions -- mi-libreria
```

Salida: `dist/builds/mi-libreria/mi-libreria.js`

Ver [Dependencias y librerías](../dependencias.md) para ejemplos por tipo de librería.

## Personalizar la página de preview

La preview page (`http://localhost:5173/views/index.html`) tiene su propio estilo en `src/styles/preview.css`. Al inicio del archivo hay una sección de variables para cambiar fondo, texto y tipografía sin tocar el resto:

```css
$bg:   #07122f;   // ← color de fondo de la página
$text: #ffffff;   // ← color de texto principal
$font: system-ui, -apple-system, sans-serif;   // ← tipografía base

$text-muted:    #8898aa;   // ← subtítulo y textos apagados
$section-label: #4a5568;   // ← etiquetas "Fragments" / "Web Content"
```

Ejemplo — fondo claro con fuente Inter:

```css
$bg:   #f5f5f5;
$text: #1c1c24;
$font: 'Inter', sans-serif;   // Inter ya está cargada en el layout
```

Este archivo **no va a producción** — solo afecta al entorno de desarrollo local.

## Archivos generados (no editar)

- `src/fragments/*/index.html` — generado del .pug en cada arranque
- `src/web-content/*/index.html` — ídem
- `src/views/index.html` — ídem
- `dist/` — salida del build
