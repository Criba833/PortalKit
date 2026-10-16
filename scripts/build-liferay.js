#!/usr/bin/env node
/**
 * scripts/build-liferay.js
 *
 * Punto de entrada del build de Liferay. Según el target, ejecuta el bundling
 * de Vite (una sola vez), ensambla los artefactos y, en el build global,
 * empaqueta también las Client Extensions.
 *
 *   node scripts/build-liferay.js all           # fragments + web-content + extensions
 *   node scripts/build-liferay.js fragments     # solo fragments
 *   node scripts/build-liferay.js web-content   # solo web-content
 *
 * El ENSAMBLADO (manifest de Vite → estructura que espera Liferay) vive en la
 * función reutilizable `assembleLiferay(types)`:
 *
 *   dist/fragments/[name]/
 *     [name].ftl          ← contenido del <body> sin tags de Vite
 *     index.css           ← CSS extraído y unificado
 *     index.js            ← JS bundleado (ya lo coloca Vite) o script.js
 *     configuration.json  ← copiado de src/ o default vacío
 *     info.md
 *
 *   dist/web-content/[name]/
 *     (misma estructura)
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync, readdirSync, rmSync } from 'node:fs'
import { resolve, join, dirname, relative }                                   from 'node:path'
import { fileURLToPath, pathToFileURL }                                        from 'node:url'
import { build }                                                               from 'vite'

import { buildExtensions } from './build-client-extensions.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT      = resolve(__dirname, '..')
const DIST      = join(ROOT, 'dist')
const SRC       = join(ROOT, 'src')
const MANIFEST  = join(DIST, '.vite', 'manifest.json')

// Categorías de artefacto que Vite compila y este script ensambla para Liferay.
const ASSEMBLE_TYPES = ['fragments', 'web-content']

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

/**
 * Devuelve los index.js ya ensamblados dentro de una categoría de dist/.
 * Se usan para decidir si dist/shared/ sigue en uso por CUALQUIER categoría,
 * de modo que un build parcial (p. ej. solo web-content) nunca borre chunks
 * que otra categoría (p. ej. fragments) todavía importa.
 */
function assembledIndexFiles (baseDir) {
  if (!existsSync(baseDir)) return []

  return readdirSync(baseDir)
    .map((name) => join(baseDir, name, 'index.js'))
    .filter((file) => existsSync(file))
}

/**
 * CSS que el catálogo de preview necesita de verdad. Se deriva de las hojas
 * que los HTML de preview emitidos por Vite referencian (p. ej.
 * dist/index.html, dist/views/index.html), no de patrones de nombre. Así se
 * conserva también el CSS compartido que Rollup extrae como `_preview-<hash>.css`
 * cuando el catálogo se compila como más de un entry HTML.
 *
 * Se excluyen las carpetas de artefactos Liferay: el CSS de cada componente ya
 * se unifica dentro de su index.css y no debe sobrevivir en dist/assets/.
 *
 * @param {string} distDir  raíz de la salida de Vite (dist/)
 * @returns {Set<string>}   rutas relativas a dist/ (p. ej. 'assets/index-abc.css')
 */
function collectPreviewCss (distDir) {
  const previewCss = new Set()
  const ARTIFACT_DIRS = new Set(['fragments', 'web-content', 'builds'])

  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)

      if (entry.isDirectory()) {
        if (ARTIFACT_DIRS.has(relative(distDir, full))) continue
        walk(full)
        continue
      }
      if (!entry.name.endsWith('.html')) continue

      const html = readFileSync(full, 'utf8')
      for (const tag of html.matchAll(/<link\b[^>]*>/gi)) {
        if (!/rel=["']stylesheet["']/i.test(tag[0])) continue
        const href = tag[0].match(/href=["']([^"']+)["']/i)?.[1]
        if (!href) continue

        const path = href.split('?')[0].replace(/^\//, '')
        if (path.startsWith('assets/') && path.endsWith('.css')) previewCss.add(path)
      }
    }
  }

  walk(distDir)
  return previewCss
}

// ─────────────────────────────────────────────────────────────────────────────
// ASSEMBLE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ensambla los artefactos Liferay de las categorías indicadas a partir del
 * manifest que Vite ya generó. Es idempotente respecto de las categorías no
 * incluidas en `types`: no las toca ni borra sus salidas.
 *
 * @param {string[]} types  subconjunto de ['fragments', 'web-content']
 * @returns {{ ok: number, errors: number }}
 */
export function assembleLiferay (types = ASSEMBLE_TYPES) {
  if (!existsSync(MANIFEST)) {
    throw new Error('No se encontró dist/.vite/manifest.json; ejecuta el build de Vite primero.')
  }

  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'))

  // Solo procesamos entries de las categorías pedidas (no pages/preview).
  const ENTRY_RE = /^(fragments|web-content)\/[^/]+\/index\.(html|pug)$/

  const entries = Object.entries(manifest).filter(
    ([key]) => ENTRY_RE.test(key) && types.includes(key.split('/')[0]),
  )

  if (!entries.length) {
    console.warn(`\n⚠️  No hay entries (${types.join(', ')}) en el manifest.\n`)
    return { ok: 0, errors: 0 }
  }

  // CSS que el catálogo de preview necesita de verdad: es el único que debe
  // sobrevivir dentro de dist/assets/. El resto (CSS de componente ya unificado
  // en cada index.css, chunks compartidos, o restos de builds anteriores) son
  // intermedios obsoletos y se eliminan al final.
  const previewCss = new Set()

  // 1. CSS declarado por los entries no-componente del manifest (p. ej.
  //    `views/index.html` → assets/index-<hash>.css).
  for (const [key, entry] of Object.entries(manifest)) {
    if (key.startsWith('_')) continue          // chunk compartido, no es entrada
    if (ENTRY_RE.test(key)) continue           // es un componente, no el preview
    for (const f of (entry.css ?? [])) previewCss.add(f)
    if (entry.file?.endsWith('.css')) previewCss.add(entry.file)
  }

  // 2. CSS realmente referenciado por el HTML de preview emitido. Cubre el caso
  //    en que Rollup lo extrae a un chunk compartido `_preview-<hash>.css` y los
  //    entries HTML no aparecen en el manifest.
  for (const f of collectPreviewCss(DIST)) previewCss.add(f)

  console.log(`\n🎯  Ensamblando ${entries.length} entry/entries para Liferay (${types.join(', ')})...\n`)

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
      // ── 1. FTL ──────────────────────────────────────────────────────────
      // Prioridad: src/[type]/[name]/[name].ftl → cualquier *.ftl en src/
      //            → extrae el <body> del index.html generado por Vite
      const exactFtl = join(srcDir, `${name}.ftl`)
      const anyFtl   = readdirSync(srcDir).find(f => f.endsWith('.ftl'))
      const srcFtl   = existsSync(exactFtl) ? exactFtl
                     : anyFtl               ? join(srcDir, anyFtl)
                     : null
      const htmlFile = join(destDir, 'index.html')
      const destFtl  = join(destDir, `${name}.ftl`)

      if (srcFtl) {
        copyFileSync(srcFtl, destFtl)
        console.log(`       ✅  ${name}.ftl (desde src/)`)
      } else if (existsSync(htmlFile)) {
        const ftl = extractBody(readFileSync(htmlFile, 'utf8'))
        writeFileSync(destFtl, ftl + '\n')
        console.log(`       ✅  ${name}.ftl (extraído de index.html)`)
      } else if (existsSync(destFtl)) {
        // Reejecución del ensamblado sin un build de Vite previo: el
        // index.html de Vite es efímero, se conserva el .ftl ya extraído.
        console.log(`       ✅  ${name}.ftl (existente)`)
      } else {
        throw new Error(`index.html no encontrado en ${destDir}`)
      }

      // ── 2. CSS ──────────────────────────────────────────────────────────
      // Vite emite cada hoja como un asset con hash dentro de dist/assets/.
      // Aquí se recopilan (CSS propio del entry + chunks compartidos) y se
      // unifican en el index.css autocontenido de cada componente. Los assets
      // con hash se eliminan al final para no dejar copias huérfanas.
      //
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

      const destCss    = join(destDir, 'index.css')
      const available  = cssFiles.filter((f) => existsSync(join(DIST, f)))
      const cssContent = available
        .map((f) => readFileSync(join(DIST, f), 'utf8'))
        .join('\n')

      if (available.length) {
        writeFileSync(destCss, cssContent)
      } else if (!existsSync(destCss)) {
        writeFileSync(destCss, '')
      }
      // Sin fuentes disponibles pero con index.css ya ensamblado (reejecución
      // sin build de Vite): se conserva el archivo existente.

      const cssNote = available.length
        ? `(${available.length} archivo${available.length > 1 ? 's' : ''})`
        : cssFiles.length
          ? '(existente)'
          : '(vacío)'
      console.log(`       ✅  index.css ${cssNote}`)

      // ── 3. JS ───────────────────────────────────────────────────────────
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

      // ── 4. configuration.json ───────────────────────────────────────────
      const srcConfig  = join(srcDir,  'configuration.json')
      const destConfig = join(destDir, 'configuration.json')

      if (existsSync(srcConfig)) {
        copyFileSync(srcConfig, destConfig)
        console.log(`       ✅  configuration.json (desde src/)`)
      } else {
        writeFileSync(destConfig, JSON.stringify({ fieldSets: [] }, null, '\t') + '\n')
        console.log(`       ✅  configuration.json (default)`)
      }

      // ── 5. info.md ──────────────────────────────────────────────────────
      writeFileSync(join(destDir, 'info.md'), `# ${toTitle(name)}\n`)
      console.log(`       ✅  info.md`)

      ok++

    } catch (err) {
      errors++
      console.error(`       ❌  ${err.message}`)
    }

    console.log('')
  }

  // ── Limpieza de intermedios ─────────────────────────────────────────────
  //
  // 1. CSS: dentro de dist/assets/ debe quedar únicamente el CSS que el
  //    catálogo de preview referencia de verdad (previewCss). Cualquier otro
  //    .css es un intermedio de Vite (CSS de componente o chunk compartido ya
  //    unificado en cada index.css) o un resto obsoleto de builds anteriores,
  //    y se elimina. Los assets que no son CSS (imágenes, fuentes) no se tocan.
  // 2. index.html: son intermedios de Vite (rutas absolutas /assets/... y
  //    /vendor/... ajenas al artefacto Liferay). Se eliminan para que cada
  //    carpeta quede con el contrato exacto: [name].ftl, index.css, index.js,
  //    configuration.json, info.md. Solo se limpian los de este ensamblado.
  // 3. dist/shared/: se elimina solo si NINGÚN index.js ensamblado (en
  //    fragments o web-content) lo importa; así un build parcial no rompe a la
  //    otra categoría.

  const assetsDir = join(DIST, 'assets')
  if (existsSync(assetsDir)) {
    for (const file of readdirSync(assetsDir)) {
      if (!file.endsWith('.css')) continue
      if (previewCss.has(`assets/${file}`)) continue
      rmSync(join(assetsDir, file), { force: true })
    }

    // dist/assets/ solo se borra si queda vacío: puede conservar recursos
    // genuinamente compartidos (p. ej. el CSS del catálogo de preview).
    if (readdirSync(assetsDir).length === 0) {
      rmSync(assetsDir, { recursive: true, force: true })
    }
  }

  for (const [key] of entries) {
    const [type, name] = key.split('/')
    const htmlFile = join(DIST, type, name, 'index.html')
    if (existsSync(htmlFile)) rmSync(htmlFile, { force: true })
  }

  const sharedDir = join(DIST, 'shared')
  if (existsSync(sharedDir)) {
    const indexFiles = [
      ...assembledIndexFiles(join(DIST, 'fragments')),
      ...assembledIndexFiles(join(DIST, 'web-content')),
    ]
    const inUse = indexFiles.some(
      (file) => /^\s*import\s/m.test(readFileSync(file, 'utf8')),
    )

    if (!inUse) rmSync(sharedDir, { recursive: true, force: true })
  }

  // ── Resumen ─────────────────────────────────────────────────────────────

  const line = '─'.repeat(44)
  console.log(line)

  if (errors) {
    console.error(`❌  ${errors} entry/entries con error (${ok} completados)`)
  } else {
    console.log(`✅  ${ok} completados`)
  }

  return { ok, errors }
}

// ─────────────────────────────────────────────────────────────────────────────
// ORQUESTACIÓN
// ─────────────────────────────────────────────────────────────────────────────

/** Ejecuta el build de Vite para el target indicado (ver vite.config.js). */
async function runVite (target) {
  process.env.PK_BUILD_TARGET = target
  await build()
}

async function main () {
  const target = process.argv[2] ?? 'all'

  // Vite y vite.config.js resuelven rutas contra el cwd; fijarlo a la raíz del
  // proyecto para que el comando funcione igual desde cualquier directorio.
  process.chdir(ROOT)

  switch (target) {
    case 'fragments':
      await runVite('fragments')
      if (assembleLiferay(['fragments']).errors) process.exitCode = 1
      break

    case 'web-content':
      await runVite('web-content')
      if (assembleLiferay(['web-content']).errors) process.exitCode = 1
      break

    case 'all': {
      await runVite('all')
      const { errors } = assembleLiferay(['fragments', 'web-content'])
      // El build global incluye las Client Extensions (reutiliza el mismo
      // empaquetado que `npm run build:extensions`).
      await buildExtensions()
      if (errors) process.exitCode = 1
      break
    }

    default:
      console.error(`\n❌  Target desconocido: "${target}". Usa: all, fragments, web-content\n`)
      process.exit(1)
  }
}

// Auto-ejecución solo cuando el archivo se invoca directamente.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`\n❌  build falló: ${err?.message ?? err}\n`)
    process.exit(1)
  })
}
