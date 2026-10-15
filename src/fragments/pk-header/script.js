(() => {

	const header = fragmentElement.querySelector('.pk-header');

	if (!header) {
		return;
	}

	/*
	 * ----------------------------------------
	 * Modo del menú (única fuente: el CSS)
	 * ----------------------------------------
	 *
	 * El CSS publica --pk-menu-mode en .pk-header, de modo que el corte
	 * de 991px no queda escrito a mano en JavaScript. Si el CSS no estuviera
	 * aplicado la propiedad llega vacía y se asume 'inline', que es el estado
	 * por defecto del HTML.
	 */

	const isMobileMenu = () =>
		getComputedStyle(header)
			.getPropertyValue('--pk-menu-mode')
			.trim() === 'offcanvas';


	/*
	 * ----------------------------------------
	 * Scroll Progress
	 * ----------------------------------------
	 */

	const scrollProgress = header.querySelector(
		'.pk-header__scroll-progress'
	);

	const updateScrollProgress = () => {

		const scrollTop = window.scrollY;

		// Header
		header.classList.toggle(
			'is-scrolled',
			scrollTop > 0
		);

		// Scroll progress
		if (!scrollProgress) {
			return;
		}

		const documentHeight =
			document.documentElement.scrollHeight - window.innerHeight;

		if (documentHeight <= 0) {
			scrollProgress.style.width = '0%';
			return;
		}

		const progress =
			(scrollTop / documentHeight) * 100;

		scrollProgress.style.width = `${progress}%`;
	};

	window.addEventListener(
		'scroll',
		updateScrollProgress,
		{ passive: true }
	);

	updateScrollProgress();


	/*
	 * ----------------------------------------
	 * Mobile Menu
	 * ----------------------------------------
	 */

	const toggle = header.querySelector(
		'.pk-header__toggle'
	);

	const navigation = header.querySelector(
		'.pk-header__navigation'
	);

	if (!toggle || !navigation) {
		return;
	}

	const toggleIcon = toggle.querySelector('i');

	const setMenuState = (isOpen) => {

		header.classList.toggle(
			'is-menu-open',
			isOpen
		);

		toggle.setAttribute(
			'aria-expanded',
			String(isOpen)
		);

		toggle.setAttribute(
			'aria-label',
			isOpen
				? 'Cerrar menú'
				: 'Abrir menú'
		);

		if (toggleIcon) {

			toggleIcon.classList.toggle(
				'bi-list',
				!isOpen
			);

			toggleIcon.classList.toggle(
				'bi-x-lg',
				isOpen
			);
		}

		document.body.classList.toggle(
			'pk-menu-open',
			isOpen
		);
	};

	toggle.addEventListener('click', () => {

		const isOpen =
			!header.classList.contains('is-menu-open');

		setMenuState(isOpen);

	});


	/*
	 * ----------------------------------------
	 * Mobile Submenus
	 * ----------------------------------------
	 */

	const submenuItems = header.querySelectorAll(
		'.pk-header__item.has-submenu'
	);

	submenuItems.forEach((item) => {

		const link = item.querySelector(
			':scope > .pk-header__link'
		);

		const submenu = item.querySelector(
			':scope > .pk-header__submenu'
		);

		if (!link || !submenu) {
			return;
		}

		link.addEventListener('click', (event) => {

			if (!isMobileMenu()) {
				return;
			}

			event.preventDefault();

			const isOpen =
				item.classList.contains('is-open');


			// Cierra los demás submenús
			submenuItems.forEach((otherItem) => {

				if (otherItem !== item) {

					otherItem.classList.remove(
						'is-open'
					);

					const otherLink =
						otherItem.querySelector(
							':scope > .pk-header__link'
						);

					if (otherLink) {
						otherLink.setAttribute(
							'aria-expanded',
							'false'
						);
					}
				}
			});


			// Toggle submenu actual
			item.classList.toggle(
				'is-open',
				!isOpen
			);

			link.setAttribute(
				'aria-expanded',
				String(!isOpen)
			);

		});

	});


	/*
	 * ----------------------------------------
	 * Close menu when clicking a normal link
	 * ----------------------------------------
	 */

	const menuLinks = header.querySelectorAll(
		'.pk-header__menu a:not(.pk-header__item.has-submenu > .pk-header__link)'
	);

	menuLinks.forEach((link) => {

		link.addEventListener('click', () => {

			if (isMobileMenu()) {
				setMenuState(false);
			}

		});

	});


	/*
	 * ----------------------------------------
	 * Reset when returning to desktop
	 * ----------------------------------------
	 */

	window.addEventListener('resize', () => {

		if (!isMobileMenu()) {

			setMenuState(false);

			submenuItems.forEach((item) => {

				item.classList.remove(
					'is-open'
				);

				const link =
					item.querySelector(
						':scope > .pk-header__link'
					);

				if (link) {
					link.setAttribute(
						'aria-expanded',
						'false'
					);
				}

			});
		}

	});

})();
