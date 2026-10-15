# Scripts de build

Los scripts en `scripts/` se encargan del post-procesamiento tras el build de Vite.

---

## Cadena de comandos

`npm run build:fragments` ejecuta tres pasos en secuencia:

```
npm run build:fragments
  ├── npm run build            ← Vite compila Pug → HTML, CSS → CSS, JS → bundle
  ├── npm run liferay          ← build-liferay.js ensambla dist/fragments/ y dist/web-content/
  └── npm run build:extensions ← build-client-extensions.js empaqueta dist/builds/
```

Cada paso puede ejecutarse por separado:

```bash
npm run build            # solo Vite
npm run liferay          # solo ensamblado de fragments (requiere que Vite ya haya corrido)
npm run build:extensions # solo client extensions
```

---

## `scripts/build-liferay.js`

Ensambla los artefactos que Liferay necesita para cada fragment y web-content.

**Cuándo corre:** automáticamente como parte de `npm run build:fragments` (`npm run build && npm run liferay && npm run build:extensions`). También puede ejecutarse solo:

```bash
node scripts/build-liferay.js
```

### Qué hace

Lee `dist/.vite/manifest.json` (generado por Vite) y por cada entry de `fragments/` y `web-content/` produce esta estructura en `dist/`:

```
dist/fragments/[nombre]/
  [nombre].ftl
  index.css
  index.js
  configuration.json
  info.md
```

### Paso a paso

#### 1. FTL — markup para Liferay

Prioridad:

1. Si existe `src/[tipo]/[nombre]/[nombre].ftl` → lo copia tal cual. **Nunca lo sobreescribe.**
2. Si no existe → extrae el contenido del `<body>` del `index.html` generado por Vite y lo guarda como `.ftl`.

Al extraer el body limpia automáticamente:
- `<script>` tags (el JS va en `index.js`)
- `<link rel="stylesheet">` (el CSS va en `index.css`)
- `<link rel="modulepreload">` (meta interna de Vite)

#### 2. CSS — `index.css`

Recorre el manifest recursivamente para recopilar **todos** los archivos `.css` asociados al entry, incluyendo chunks compartidos. Los concatena en un solo `index.css`.

#### 3. JS — `index.js`

Prioridad:

1. Si existe `src/[tipo]/[nombre]/script.js` → lo copia como `index.js`. Este archivo es el JS de Liferay (usa `fragmentElement`, no `document.querySelector`).
2. Si no existe → usa el `index.js` que ya generó Vite en `dist/`.
3. Si no hay ninguno → avisa con `⚠️` (normal en fragments que solo tienen CSS).

#### 4. `configuration.json`

Si existe en `src/` → lo copia. Si no → genera un `{ "fieldSets": [] }` vacío.

#### 5. `info.md`

Genera un archivo con el nombre del fragment: `# PortalKit Header`.

---

## `scripts/build-client-extensions.js`

Empaqueta cada client extension de `src/client-extensions/` como un bundle IIFE independiente.

**Cuándo corre:** automáticamente como parte de `npm run build:fragments`. También puede ejecutarse solo:

```bash
# Buildear todas
npm run build:extensions

# Buildear solo una
npm run build:extension -- gsap
npm run build:extension -- swiperjs
```

### Qué hace

Para cada carpeta en `src/client-extensions/` que tenga un `index.js`:

1. Llama a Vite programáticamente en modo **lib IIFE**
2. El nombre IIFE se deriva del nombre de la carpeta en camelCase (`swiperjs` → `swiperjs`, `gsap-animations` → `gsapAnimations`)
3. Genera `dist/builds/[nombre]/[nombre].js`
4. Si la librería produce CSS (ej. Swiper), también genera `dist/builds/[nombre]/[nombre].css`

### Salida

```
dist/builds/
  gsap/
    gsap.js
  swiperjs/
    swiperjs.js
    swiperjs.css
```

### Manejo de errores

Si una extension falla, el script registra el error y continúa con las demás. Al final sale con código `1` si alguna falló. Esto evita que un error en una extensión bloquee el build de las otras.

---

## `vite.config.js`

Aunque no está en `scripts/`, también contiene lógica de build relevante:

### `compilePugEntries()`

Corre **antes** de que Vite resuelva los inputs. Compila todos los `index.pug` a `index.html` usando `renderFile(pugFile, { basedir: SRC, pretty: true })`.

- `basedir: SRC` permite usar rutas absolutas en Pug (`/views/layouts/fragment.pug`)
- `pretty: true` genera HTML con indentación legible
- Los `.html` generados son efímeros (gitignored) — la fuente real es el `.pug`

> **Debe correr antes de `discoverComponents()`** — el auto-discovery busca `index.html`, que no existen hasta que Pug los genera.

### Auto-discovery

`discoverComponents()` escanea `src/fragments/` y `src/web-content/` y registra automáticamente cada carpeta con `index.html` como entry de Rollup. No hace falta declarar manualmente los entries — solo crear la carpeta.

Depende de que `compilePugEntries()` ya haya generado los `.html` a partir de los `.pug`.

### `pugHmr()` plugin

En desarrollo, observa todos los `**/*.pug`. Cuando cambia cualquier `.pug` (incluyendo layouts y mixins), recompila todos los entries y fuerza un `full-reload` en el browser.

Se recompilan **todos** porque un cambio en un layout o mixin afecta a múltiples fragments.

### `removeVendorFromDist()` plugin

Después del build (`closeBundle` hook), elimina `dist/vendor/`. Esto evita que los archivos de `public/vendor/` (Bootstrap CSS y JS, solo para dev) acaben en el paquete de producción.
