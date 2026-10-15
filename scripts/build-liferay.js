#!/usr/bin/env node
/**
 * scripts/build-liferay.js
 *
 * Post-build: lee dist/.vite/manifest.json y por cada fragment / web-content
 * ensambla la estructura que espera Liferay:
 *
 *   dist/fragments/[name]/
 *     [name].ftl          ← contenido del <body> sin tags de Vite
 *     index.css           ← CSS extraído y unificado
 *     index.js            ← JS bundleado (ya lo coloca Vite)
 *     configuration.json  ← copiado de src/ o default vacío
 *     info.md
 *
 *   dist/web-content/[name]/
 *     (misma estructura)
 *
 * Uso:
 *   node scripts/build-liferay.js
 *   npm run build && npm run liferay
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve, join, dirname }                                              from 'node:path'
import { fileURLToPath }                                                       from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT      = resolve(__dirname, '..')
const DIST      = join(ROOT, 'dist')
const SRC       = join(ROOT, 'src')
const MANIFEST  = join(DIST, '.vite', 'manifest.json')

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** 'pk-header' → 'PortalKit Header' */
const toTitle = (slug) =>
  slug.split('-').filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')

/**
 * Extrae el contenido del <body> del HTML que generó Vite y limpia:
 *  - <script> tags  (el JS va en index.js)
 *  - <link rel="stylesheet">  (el CSS va en index.css)
 *  - <link rel="modulepreload">  (meta de Vite, no aplica a Liferay)
 */
function extractBody (html) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  const raw       = bodyMatch ? bodyMatch[1] : html

  return raw
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,               '')
    .replace(/<link\b[^>]*rel=["']modulepreload["'][^>]*\/?>/gi,   '')
    .replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*\/?>/gi,      '')
    .replace(/\n{3,}/g, '\n\n')   // máximo dos líneas vacías seguidas
    .trim()
}

/**
 * Recorre el manifest recursivamente y devuelve todos los archivos .css
 * asociados a un entry (incluyendo los de sus imports / chunks compartidos).
 *
 * @param {Record<string, object>} manifest
 * @param {string}                 key       - clave del entry en el manifest
 * @param {Set<string>}            visited   - evita ciclos
 * @returns {string[]}  rutas relativas a dist/ (e.g. 'assets/index-abc.css')
 */
function collectCss (manifest, key, visited = new Set()) {
  if (visited.has(key) || !manifest[key]) return []
  visited.add(key)

  const entry = manifest[key]
  const css   = [...(entry.css ?? [])]

  for (const imp of (entry.imports ?? [])) {
    css.push(...collectCss(manifest, imp, visited))
  }

  return [...new Set(css)]
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

if (!existsSync(MANIFEST)) {
  console.error('\n❌  No se encontró dist/.vite/manifest.json')
  console.error('    Ejecuta primero:  npm run build\n')
  process.exit(1)
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'))

// Solo procesamos entries de fragments y web-content (no pages)
const ENTRY_RE = /^(fragments|web-content)\/[^/]+\/index\.(html|pug)$/

const entries = Object.entries(manifest).filter(([key]) => ENTRY_RE.test(key))

if (!entries.length) {
  console.warn('\n⚠️  No hay entries de fragments ni web-content en el manifest.\n')
  process.exit(0)
}

console.log(`\n🎯  Ensamblando ${entries.length} entry/entries para Liferay...\n`)

let ok     = 0
let errors = 0

for (const [key] of entries) {
  const parts   = key.split('/')           // ['fragments', 'pk-header', 'index.html']
  const type    = parts[0]                 // 'fragments' | 'web-content'
  const name    = parts[1]                 // 'pk-header'
  const destDir = join(DIST, type, name)
  const srcDir  = join(SRC,  type, name)

  console.log(`  📦  ${type}/${name}`)

  try {
    // ── 1. FTL ────────────────────────────────────────────────────────────
    // Prioridad: src/[type]/[name]/[name].ftl → cualquier *.ftl en src/
    //            → extrae el <body> del index.html generado por Vite
    const exactFtl = join(srcDir, `${name}.ftl`)
    const anyFtl   = readdirSync(srcDir).find(f => f.endsWith('.ftl'))
    const srcFtl   = existsSync(exactFtl) ? exactFtl
                   : anyFtl               ? join(srcDir, anyFtl)
                   : null
    const htmlFile = join(destDir, 'index.html')

    if (srcFtl) {
      copyFileSync(srcFtl, join(destDir, `${name}.ftl`))
      console.log(`       ✅  ${name}.ftl (desde src/)`)
    } else {
      if (!existsSync(htmlFile)) {
        throw new Error(`index.html no encontrado en ${destDir}`)
      }
      const ftl = extractBody(readFileSync(htmlFile, 'utf8'))
      writeFileSync(join(destDir, `${name}.ftl`), ftl + '\n')
      console.log(`       ✅  ${name}.ftl (extraído de index.html)`)
    }

    // ── 2. CSS ────────────────────────────────────────────────────────────
    // Fragments con JS: css[] cuelga de la entrada del JS en el manifest
    // Fragments solo-CSS: la entrada del HTML tiene file → 'assets/name.css'
    const jsKey   = `${type}/${name}/index.js`
    let cssFiles  = collectCss(manifest, jsKey)

    if (!cssFiles.length) {
      const htmlEntry = manifest[key]
      if (htmlEntry?.css?.length) {
        cssFiles = htmlEntry.css
      } else if (htmlEntry?.file?.endsWith('.css')) {
        cssFiles = [htmlEntry.file]
      }
    }

    const cssContent = cssFiles.length
      ? cssFiles.map((f) => readFileSync(join(DIST, f), 'utf8')).join('\n')
      : ''

    writeFileSync(join(destDir, 'index.css'), cssContent)

    const cssNote = cssFiles.length
      ? `(${cssFiles.length} archivo${cssFiles.length > 1 ? 's' : ''})`
      : '(vacío)'
    console.log(`       ✅  index.css ${cssNote}`)

    // ── 3. JS ─────────────────────────────────────────────────────────────
    // Prioridad: src/[type]/[name]/script.js  (script Liferay listo, con fragmentElement)
    //            → dist/[type]/[name]/index.js (bundleado por Vite)
    const srcScript = join(srcDir, 'script.js')
    const jsFile    = join(destDir, 'index.js')

    if (existsSync(srcScript)) {
      copyFileSync(srcScript, jsFile)
      console.log(`       ✅  index.js (desde script.js)`)
    } else if (existsSync(jsFile)) {
      console.log(`       ✅  index.js`)
    } else {
      writeFileSync(jsFile, '// CSS-only fragment\n')
      console.log(`       ✅  index.js (CSS-only, generado vacío)`)
    }

    // ── 4. configuration.json ─────────────────────────────────────────────
    const srcConfig  = join(srcDir,  'configuration.json')
    const destConfig = join(destDir, 'configuration.json')

    if (existsSync(srcConfig)) {
      copyFileSync(srcConfig, destConfig)
      console.log(`       ✅  configuration.json (desde src/)`)
    } else {
      writeFileSync(destConfig, JSON.stringify({ fieldSets: [] }, null, '\t') + '\n')
      console.log(`       ✅  configuration.json (default)`)
    }

    // ── 5. info.md ────────────────────────────────────────────────────────
    writeFileSync(join(destDir, 'info.md'), `# ${toTitle(name)}\n`)
    console.log(`       ✅  info.md`)

    ok++

  } catch (err) {
    errors++
    console.error(`       ❌  ${err.message}`)
  }

  console.log('')
}

// ── Resumen ───────────────────────────────────────────────────────────────

const line = '─'.repeat(44)
console.log(line)

if (errors) {
  console.log(`✅  ${ok} completados    ❌  ${errors} con error`)
  process.exit(1)
} else {
  console.log(`✅  ${ok} completados`)
}

console.log(`\n📁  dist/`)
console.log(`    fragments/       → subir a Liferay`)
console.log(`    web-content/     → subir a Liferay\n`)
