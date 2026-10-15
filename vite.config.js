
import { defineConfig } from 'vite'
import { resolve, join } from 'node:path'
import { readdirSync, existsSync, writeFileSync, rmSync } from 'node:fs'
import { exec } from 'node:child_process'
import { renderFile } from 'pug'

// ─────────────────────────────────────────────────────────────────────────────
// PATHS
// ─────────────────────────────────────────────────────────────────────────────

const SRC = resolve('src')

// ─────────────────────────────────────────────────────────────────────────────
// PUG PRE-COMPILATION
//
// Compila index.pug → index.html antes de que Vite resuelva los inputs.
// El HTML generado es efímero (gitignore); la fuente real es el .pug.
// ─────────────────────────────────────────────────────────────────────────────

function compilePugEntries() {
  // Preview page: src/views/index.pug → src/views/index.html
  const previewPug = join(SRC, 'views', 'index.pug')

  if (existsSync(previewPug)) {
    compile(previewPug, join(SRC, 'views', 'index.html'))

    // El mismo catálogo también en la raíz de Vite (root = src), que es lo
    // que el dev server sirve en http://localhost:5173/ . Sin esto el home
    // devuelve 404, porque Vite resuelve '/' contra <root>/index.html y ese
    // archivo no existía.
    //
    // Se genera desde el MISMO index.pug: una sola fuente de verdad, sin
    // enlaces inventados ni una copia que se pueda desincronizar. Pug sigue
    // siendo el mecanismo del proyecto y el pugHmr lo regenera al editarlo.
    //
    // No se declara en rollupOptions.input, así que no entra en el build ni
    // en los artefactos que ensambla scripts/build-liferay.js.
    compile(previewPug, join(SRC, 'index.html'))
  }

  // Fragments y web-content: subcarpetas con index.pug
  for (const dir of [
    join(SRC, 'fragments'),
    join(SRC, 'web-content'),
  ]) {
    if (!existsSync(dir)) continue

    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue

      const pugFile = join(dir, entry.name, 'index.pug')
      const htmlFile = join(dir, entry.name, 'index.html')

      if (existsSync(pugFile)) {
        compile(pugFile, htmlFile)
      }
    }
  }
}

function compile(pugFile, htmlFile) {
  try {
    writeFileSync(
      htmlFile,
      renderFile(pugFile, {
        basedir: SRC,
        pretty: true,
      }),
    )
  } catch (err) {
    console.error(`\n[pug] Error en ${pugFile}:\n  ${err.message}\n`)
  }
}

// Ejecuta la compilación inicial antes de descubrir los componentes.
compilePugEntries()

// ─────────────────────────────────────────────────────────────────────────────
// REMOVE VENDOR FROM DIST
// ─────────────────────────────────────────────────────────────────────────────

function removeVendorFromDist() {
  return {
    name: 'remove-vendor-from-dist',

    closeBundle() {
      const vendorDist = join(resolve('dist'), 'vendor')

      if (existsSync(vendorDist)) {
        rmSync(vendorDist, {
          recursive: true,
          force: true,
        })
      }
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUG HMR
//
// Observa los archivos .pug y recompila las entradas al modificarlos.
// ─────────────────────────────────────────────────────────────────────────────

function pugHmr() {
  return {
    name: 'pug-hmr',

    configureServer(server) {
      server.watcher.add(join(SRC, '**/*.pug'))

      server.watcher.on('change', (file) => {
        if (!file.endsWith('.pug')) return

        compilePugEntries()

        server.ws.send({
          type: 'full-reload',
        })
      })
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-DISCOVERY
//
// src/{type}/[name]/index.html
// → { 'fragments/pk-header': '/.../src/fragments/pk-header/index.html' }
// ─────────────────────────────────────────────────────────────────────────────

function discoverComponents(dir, type) {
  const entries = {}

  if (!existsSync(dir)) return entries

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue

    const html = resolve(dir, entry.name, 'index.html')

    if (existsSync(html)) {
      entries[`${type}/${entry.name}`] = html
    }
  }

  return entries
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-OPEN PREVIEW
//
// Abre el catálogo cuando Vite está escuchando.
// Se utiliza el comando nativo de Windows para evitar el error spawn UNKNOWN
// que aparece con la apertura automática de Vite en este entorno.
// ─────────────────────────────────────────────────────────────────────────────

function openPreviewOnReady() {
  return {
    name: 'open-preview-on-ready',

    configureServer(server) {
      server.httpServer?.once('listening', () => {
        if (process.platform !== 'win32') return

        const port = server.config.server.port || 5173
        const host = server.config.server.host
        const hostname =
          typeof host === 'string' && host !== '0.0.0.0'
            ? host
            : 'localhost'

        const url = `http://${hostname}:${port}/views/index.html`

        exec(`start "" "${url}"`, (error) => {
          if (error) {
            console.error(
              '[preview] No se pudo abrir el navegador:',
              error.message,
            )
          }
        })
      })
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL THEME IN PREVIEW
//
// Los componentes consumen los tokens de Liferay sin emitir valores globales.
// Para la preview local se inyecta el tema seleccionado como stylesheet propio.
//
// apply: 'serve'  → el plugin solo existe en el dev server. El build no lo
// ejecuta, así que el tema no entra en ningún index.css de fragment ni en los
// artefactos que genera scripts/build-liferay.js.
//
// La URL es la ruta real del archivo CSS servido por Vite.
// ─────────────────────────────────────────────────────────────────────────────

const THEME_URL = '/styles/themes/theme.css'

function localThemeInPreview() {
  return {
    name: 'local-theme-in-preview',
    apply: 'serve',

    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: 'link',
            attrs: { rel: 'stylesheet', href: THEME_URL },
            injectTo: 'head',
          },
        ],
      }
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

export default defineConfig({
  plugins: [
    pugHmr(),
    removeVendorFromDist(),
    openPreviewOnReady(),
    localThemeInPreview(),
  ],

  // Raíz de los sources.
  root: SRC,

  // Archivos estáticos: imágenes, fuentes, favicon, etc.
  publicDir: resolve('public'),

  // ── DEV SERVER ────────────────────────────────────────────────────────────
  server: {
    port: 5173,
    open: false,
  },

  // ── BUILD ─────────────────────────────────────────────────────────────────
  build: {
    outDir: resolve('dist'),
    emptyOutDir: true,

    minify: false,
    cssMinify: false,

    // Cada entrada genera su CSS independiente.
    cssCodeSplit: true,

    // Lo consume scripts/build-liferay.js.
    manifest: true,

    rollupOptions: {
      input: {
        'preview/index': resolve('src/views/index.html'),

        ...discoverComponents(
          resolve('src/fragments'),
          'fragments',
        ),

        ...discoverComponents(
          resolve('src/web-content'),
          'web-content',
        ),
      },

      output: {
        // JS de cada entrada.
        entryFileNames: '[name]/index.js',

        // Chunks compartidos.
        chunkFileNames: 'shared/[name]-[hash].js',

        // CSS, fuentes e imágenes.
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
})
