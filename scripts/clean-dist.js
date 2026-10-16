#!/usr/bin/env node
/**
 * scripts/clean-dist.js
 *
 * Elimina el directorio de salida generado (dist/) antes de un build fresco,
 * de modo que ningún artefacto obsoleto de builds anteriores sobreviva.
 *
 * Salvaguardas: solo actúa si el directorio resuelto es exactamente el
 * `dist/` de ESTE proyecto (package.json con name "portalkit", dentro del
 * repo). Nunca borra la raíz del repo, el home ni la raíz del sistema.
 *
 * Uso:
 *   node scripts/clean-dist.js
 *   npm run clean
 */

import { rmSync, existsSync, readFileSync } from 'node:fs'
import { resolve, dirname, join, relative, isAbsolute, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const DIST = resolve(ROOT, 'dist')

const fail = (msg) => {
  console.error(`\n❌  clean-dist: ${msg}\n`)
  process.exit(1)
}

// ── Salvaguardas ──────────────────────────────────────────────────────────
// 1. El repo esperado: package.json legible y con el nombre del proyecto.
const pkgPath = join(ROOT, 'package.json')
if (!existsSync(pkgPath)) fail(`no se encontró package.json en ${ROOT}`)

let pkg
try {
  pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
} catch {
  fail('package.json ilegible')
}
if (pkg.name !== 'portalkit') {
  fail(`package.json inesperado (name="${pkg.name}"); no es el repo PortalKit`)
}

// 2. dist/ debe estar estrictamente dentro del repo y llamarse "dist".
const rel = relative(ROOT, DIST)
if (!rel || isAbsolute(rel) || rel.startsWith('..')) {
  fail(`el destino queda fuera del repo: ${DIST}`)
}
if (basename(DIST) !== 'dist') fail(`el destino no se llama dist: ${DIST}`)
if (DIST === ROOT || DIST === resolve(ROOT, '..') || DIST === resolve('/')) {
  fail(`destino inseguro: ${DIST}`)
}

// ── Limpieza ──────────────────────────────────────────────────────────────
if (!existsSync(DIST)) {
  console.log('🧹  dist/ no existe; nada que limpiar.')
  process.exit(0)
}

rmSync(DIST, { recursive: true, force: true })
console.log('🧹  dist/ eliminado para un build limpio.')
