/**
 * _accordion.js — Lógica del componente pk-accordion
 * Importar desde el entry del web-content:
 *   import { initAllAccordions } from '../../shared/js/_accordion.js'
 *
 * Recibe el nodo raíz desde el que resolver sus elementos. En la preview
 * local es `document`; en Liferay el script.js equivalente resuelve desde
 * `fragmentElement`. Así la lógica no queda atada a una selección global.
 */

export function initAccordion (container) {
  if (!container || container.dataset.accordionInitialized === 'true') return

  const items = Array.from(container.querySelectorAll('[data-accordion-item]'))
  if (!items.length) return

  container.dataset.accordionInitialized = 'true'

  // ── Close ────────────────────────────────────────────────────────────────
  function closeItem (item) {
    const toggle = item.querySelector('[data-accordion-toggle]')
    const panel  = item.querySelector('[data-accordion-panel]')
    item.dataset.open = 'false'
    toggle?.setAttribute('aria-expanded', 'false')
    toggle?.setAttribute('aria-label', 'Abrir contenido')
    panel?.setAttribute('aria-hidden', 'true')
  }

  // ── Open ─────────────────────────────────────────────────────────────────
  function openItem (item) {
    items.forEach((other) => { if (other !== item) closeItem(other) })
    const toggle = item.querySelector('[data-accordion-toggle]')
    const panel  = item.querySelector('[data-accordion-panel]')
    item.dataset.open = 'true'
    toggle?.setAttribute('aria-expanded', 'true')
    toggle?.setAttribute('aria-label', 'Cerrar contenido')
    panel?.setAttribute('aria-hidden', 'false')
  }

  // ── Toggle ───────────────────────────────────────────────────────────────
  function toggleItem (item) {
    item.dataset.open === 'true' ? closeItem(item) : openItem(item)
  }

  // ── Click delegation ─────────────────────────────────────────────────────
  container.addEventListener('click', (event) => {
    const toggle = event.target.closest('[data-accordion-toggle]')
    const title  = event.target.closest('.pk-accordion-title')

    if (toggle) {
      event.preventDefault()
      const item = toggle.closest('[data-accordion-item]')
      if (item) toggleItem(item)
      return
    }

    if (title) {
      const item = title.closest('[data-accordion-item]')
      if (item) toggleItem(item)
    }
  })

  // ── Estado inicial ───────────────────────────────────────────────────────
  const active = items.find((item) => item.dataset.open === 'true')
  openItem(active ?? items[0])
}

export function initAllAccordions (root) {
  if (!root) return
  root.querySelectorAll('.pk-accordion').forEach(initAccordion)
}
