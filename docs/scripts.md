# Scripts de build

Los scripts en `scripts/` orquestan el build de Vite y ensamblan los artefactos
que se suben a Liferay.

---

## Arquitectura de build

Hay un build global (`build:liferay`) y builds independientes por tipo de
artefacto. Cada comando compila con Vite lo que necesita y ensambla sus propios
artefactos; ninguno depende de que se haya ejecutado otro antes.

```
npm run build:liferay        ← build completo de Liferay
  ├── Vite (PK_BUILD_TARGET=all)                ← fragments + web-content en un solo pase
  ├── assembleLiferay(fragments, web-content)   ← dist/fragments/ + dist/web-content/
  └── buildExtensions()                         ← dist/builds/

npm run build:fragments      ← Vite (solo fragments) + ensamblado de fragments
npm run build:web-content    ← Vite (solo web-content) + ensamblado de web content
npm run build:extensions     ← solo client extensions (dist/builds/)
```

`build:liferay` produce el entregable completo de Liferay (fragments, web content
y client extensions); `build:fragments` y `build:web-content` generan solo su
categoría. Los comandos de build ejecutan Vite, que emite el catálogo de preview
(`dist/index.html`), de modo que `npm run preview` sirve el catálogo en `/`. Como
parte del contrato de 5 archivos, el ensamblado elimina el `index.html` intermedio
de cada componente, así que para previsualizar un componente concreto se usa
`npm run dev`.

Todos comparten las mismas implementaciones (`assembleLiferay` y
`buildExtensions`); el build global no duplica la lógica ni repite el bundling:
compila fragments y web-content en **un único** build de Vite.

Puedes invocar el orquestador Liferay directamente:

```bash
node scripts/build-liferay.js all           # fragments + web-content + extensions
node scripts/build-liferay.js fragments     # solo fragments
node scripts/build-liferay.js web-content   # solo web-content
```

---

## `scripts/build-liferay.js`

Punto de entrada del build de Liferay. Ejecuta el bundling de Vite (una sola vez)
y ensambla los artefactos que Liferay necesita para cada fragment y web-content.
Con el target `all` también empaqueta las client extensions reutilizando
`build-client-extensions.js`.

**Cuándo corre:** lo invocan `npm run build:liferay`, `npm run build:fragments` y
`npm run build:web-content`. También puede ejecutarse solo:

```bash
node scripts/build-liferay.js all
```

El target determina qué categorías se compilan y ensamblan (`fragments`,
`web-content` o ambas). El ensamblado es idempotente respecto de las categorías
que no se piden: nunca toca ni borra la salida de la otra categoría.

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

Recorre el manifest recursivamente para recopilar **todos** los archivos `.css` asociados al entry, incluyendo chunks compartidos. Los concatena en un solo `index.css` autocontenido.

Los assets con hash que Vite dejó en `dist/assets/` se eliminan al terminar de ensamblar (su contenido ya está dentro de cada `index.css`), de modo que no queden copias huérfanas. `dist/assets/` solo se conserva si aún contiene recursos genuinamente compartidos (p. ej. el CSS del catálogo de preview).

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

**Cuándo corre:** lo invoca `npm run build:extensions` (o el target `all` de
`build-liferay.js`). También puede ejecutarse solo:

```bash
# Buildear todas
npm run build:extensions

# Buildear solo una
npm run build:extensions -- gsap
npm run build:extensions -- swiperjs
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

### Build por target (`PK_BUILD_TARGET`)

`vite.config.js` lee `process.env.PK_BUILD_TARGET` para limitar los entries:

- `all` (por defecto) → fragments + web-content
- `fragments` → solo fragments
- `web-content` → solo web-content

`scripts/build-liferay.js` define la variable antes de llamar a Vite. Con un
target parcial (`emptyOutDir: false`) Vite **no** vacía `dist/`, así que los
artefactos de la otra categoría se conservan; el target `all` parte de `dist/`
limpio (`emptyOutDir: true`).

### `pugHmr()` plugin

En desarrollo, observa todos los `**/*.pug`. Cuando cambia cualquier `.pug` (incluyendo layouts y mixins), recompila todos los entries y fuerza un `full-reload` en el browser.

Se recompilan **todos** porque un cambio en un layout o mixin afecta a múltiples fragments.

### `removeVendorFromDist()` plugin

Después del build (`closeBundle` hook), elimina `dist/vendor/`. Esto evita que los archivos de `public/vendor/` (Bootstrap CSS y JS, solo para dev) acaben en el paquete de producción.
