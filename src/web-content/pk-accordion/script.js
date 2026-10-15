(function () {
    'use strict';

    function initAccordion(container) {
        if (
            !container ||
            container.dataset.accordionInitialized === 'true'
        ) {
            return;
        }

        const items = Array.from(
            container.querySelectorAll(
                '[data-accordion-item]'
            )
        );

        if (!items.length) {
            return;
        }

        container.dataset.accordionInitialized = 'true';

        /* ------------------------------------------
           CLOSE
        ------------------------------------------ */

        function closeItem(item) {
            const toggle = item.querySelector(
                '[data-accordion-toggle]'
            );

            const panel = item.querySelector(
                '[data-accordion-panel]'
            );

            item.dataset.open = 'false';

            if (toggle) {
                toggle.setAttribute(
                    'aria-expanded',
                    'false'
                );

                toggle.setAttribute(
                    'aria-label',
                    'Abrir contenido'
                );
            }

            if (panel) {
                panel.setAttribute(
                    'aria-hidden',
                    'true'
                );
            }
        }

        /* ------------------------------------------
           OPEN
        ------------------------------------------ */

        function openItem(item) {
            // Cierra todos los demás del mismo Accordion
            items.forEach(function (currentItem) {
                if (currentItem !== item) {
                    closeItem(currentItem);
                }
            });

            const toggle = item.querySelector(
                '[data-accordion-toggle]'
            );

            const panel = item.querySelector(
                '[data-accordion-panel]'
            );

            item.dataset.open = 'true';

            if (toggle) {
                toggle.setAttribute(
                    'aria-expanded',
                    'true'
                );

                toggle.setAttribute(
                    'aria-label',
                    'Cerrar contenido'
                );
            }

            if (panel) {
                panel.setAttribute(
                    'aria-hidden',
                    'false'
                );
            }
        }

        /* ------------------------------------------
           TOGGLE
        ------------------------------------------ */

        function toggleItem(item) {
            const isOpen =
                item.dataset.open === 'true';

            if (isOpen) {
                closeItem(item);
            } else {
                openItem(item);
            }
        }

        /* ------------------------------------------
           CLICK
        ------------------------------------------ */

        container.addEventListener(
            'click',
            function (event) {
                const toggle = event.target.closest(
                    '[data-accordion-toggle]'
                );

                const title = event.target.closest(
                    '.pk-accordion-title'
                );

                // Click en botón
                if (toggle) {
                    event.preventDefault();

                    const item = toggle.closest(
                        '[data-accordion-item]'
                    );

                    if (item) {
                        toggleItem(item);
                    }

                    return;
                }

                // Click en título
                if (title) {
                    const item = title.closest(
                        '[data-accordion-item]'
                    );

                    if (item) {
                        toggleItem(item);
                    }
                }
            }
        );

        /* ------------------------------------------
           ESTADO INICIAL
        ------------------------------------------ */

        const activeItem = items.find(
            function (item) {
                return item.dataset.open === 'true';
            }
        );

        if (activeItem) {
            openItem(activeItem);
        } else {
            openItem(items[0]);
        }
    }

    /* ------------------------------------------
       INIT
    ------------------------------------------ */

    function initAllAccordions() {
        const accordions = document.querySelectorAll(
            '.pk-accordion'
        );

        accordions.forEach(function (container) {
            initAccordion(container);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener(
            'DOMContentLoaded',
            initAllAccordions
        );
    } else {
        initAllAccordions();
    }

})();
