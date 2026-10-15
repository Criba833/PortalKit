/**
 * _header.js — Lógica del componente pk-header
 * Importar desde el entry del fragment:
 *   import { initHeader } from '../../shared/js/_header.js'
 */

export function initHeader () {
  const header = document.querySelector('.pk-header')
  if (!header) return

  // ── Modo del menú (única fuente: el CSS) ────────────────────────────────
  // El CSS publica --pk-menu-mode en .pk-header, así que el corte de 991px
  // no está duplicado en JavaScript. Si el CSS no estuviera aplicado la
  // propiedad llega vacía y se asume 'inline', que es el estado por defecto
  // del HTML y evita dejar el menú en off-canvas sin CSS que lo abra.
  const isMobileMenu = () => getComputedStyle(header)
    .getPropertyValue('--pk-menu-mode')
    .trim() === 'offcanvas'

  // ── Scroll progress ──────────────────────────────────────────────────────
  const scrollProgress = header.querySelector('.pk-header__scroll-progress')

  const updateScrollProgress = () => {
    const scrollTop = window.scrollY
    header.classList.toggle('is-scrolled', scrollTop > 0)
    if (!scrollProgress) return
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight
    if (documentHeight <= 0) { scrollProgress.style.width = '0%'; return }
    scrollProgress.style.width = `${(scrollTop / documentHeight) * 100}%`
  }

  window.addEventListener('scroll', updateScrollProgress, { passive: true })
  updateScrollProgress()

  // ── Mobile menu ──────────────────────────────────────────────────────────
  const toggle     = header.querySelector('.pk-header__toggle')
  const navigation = header.querySelector('.pk-header__navigation')
  if (!toggle || !navigation) return

  const toggleIcon = toggle.querySelector('i')

  const setMenuState = (isOpen) => {
    header.classList.toggle('is-menu-open', isOpen)
    toggle.setAttribute('aria-expanded', String(isOpen))
    toggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú')
    if (toggleIcon) {
      toggleIcon.classList.toggle('bi-list', !isOpen)
      toggleIcon.classList.toggle('bi-x-lg',  isOpen)
    }
    document.body.classList.toggle('pk-menu-open', isOpen)
  }

  toggle.addEventListener('click', () => {
    setMenuState(!header.classList.contains('is-menu-open'))
  })

  // ── Mobile submenus ──────────────────────────────────────────────────────
  const submenuItems = header.querySelectorAll('.pk-header__item.has-submenu')

  submenuItems.forEach((item) => {
    const link    = item.querySelector(':scope > .pk-header__link')
    const submenu = item.querySelector(':scope > .pk-header__submenu')
    if (!link || !submenu) return

    link.addEventListener('click', (event) => {
      if (!isMobileMenu()) return
      event.preventDefault()

      const isOpen = item.classList.contains('is-open')

      submenuItems.forEach((other) => {
        if (other !== item) {
          other.classList.remove('is-open')
          other.querySelector(':scope > .pk-header__link')
            ?.setAttribute('aria-expanded', 'false')
        }
      })

      item.classList.toggle('is-open', !isOpen)
      link.setAttribute('aria-expanded', String(!isOpen))
    })
  })

  // ── Cierra menú al hacer click en un enlace normal ────────────────────────
  header.querySelectorAll(
    '.pk-header__menu a:not(.pk-header__item.has-submenu > .pk-header__link)'
  ).forEach((link) => {
    link.addEventListener('click', () => {
      if (isMobileMenu()) setMenuState(false)
    })
  })

  // ── Reset al volver a desktop ─────────────────────────────────────────────
  window.addEventListener('resize', () => {
    if (!isMobileMenu()) {
      setMenuState(false)
      submenuItems.forEach((item) => {
        item.classList.remove('is-open')
        item.querySelector(':scope > .pk-header__link')
          ?.setAttribute('aria-expanded', 'false')
      })
    }
  })
}
