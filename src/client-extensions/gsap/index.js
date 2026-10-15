import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

window.gsap = gsap;
window.ScrollTrigger = ScrollTrigger;

// ─────────────────────────────────────────────────────────────────────────────
// GSAP Text Animations por clases
//
// Clases disponibles:
//   .gsap-fade-up       → fade up por letra al entrar en viewport
//   .gsap-word-reveal   → reveal por palabra desde abajo
//   .gsap-scale-rotate  → escala + rotación por letra
//   .gsap-clip-slide    → clip + desplazamiento horizontal por palabra
//   .gsap-bounce        → rebote por letra
//   .gsap-subtitle      → fade up sutil para subtítulos
//   .gsap-counter       → contador numérico animado
//
// Atributos de control por elemento:
//   data-gsap-start     → ScrollTrigger start   (default: 'top 75%')
//   data-gsap-toggle    → toggleActions          (default: 'play none none reverse')
//   data-gsap-duration  → duración en segundos
//   data-gsap-stagger   → stagger en segundos
//   data-gsap-delay     → delay en segundos
//   data-gsap-no-scroll → deshabilita ScrollTrigger
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const EFFECT_CLASSES = [
	'gsap-fade-up',
	'gsap-word-reveal',
	'gsap-scale-rotate',
	'gsap-clip-slide',
	'gsap-bounce',
	'o-t-hero__content-title p',
];

// ─── Text splitting ───────────────────────────────────────────────────────────

function splitText(element) {
	if (element.dataset.gsapSplit === 'true') return;
	element.dataset.gsapSplit = 'true';

	const lines = element.innerHTML.split('<br>');
	element.innerHTML = lines
		.map((line) => {
			const words = line.trim().split(/\s+/);
			const wrappedWords = words
				.map((word) => {
					const chars = word
						.split('')
						.map((char) => `<span class="char">${char}</span>`)
						.join('');
					return `<span class="word"><span class="char-wrap">${chars}</span></span>`;
				})
				.join(' ');
			return `<span class="line">${wrappedWords}</span>`;
		})
		.join('<br>');
}

function applyEffect(element) {
	const effectClass = EFFECT_CLASSES.find((cls) => element.classList.contains(cls));
	if (!effectClass) return;

	const isScroll = !element.classList.contains('gsap-no-scroll');
	const scrollTrigger = isScroll
		? {
			trigger: element,
			start: element.dataset.gsapStart || 'top 75%',
			toggleActions: element.dataset.gsapToggle || 'play none none reverse',
		}
		: undefined;

	const dur  = (d) => element.dataset.gsapDuration ? parseFloat(element.dataset.gsapDuration) : d;
	const stag = (s) => element.dataset.gsapStagger  ? parseFloat(element.dataset.gsapStagger)  : s;
	const del  = ()  => element.dataset.gsapDelay    ? parseFloat(element.dataset.gsapDelay)    : 0;

	const base = { immediateRender: false, scrollTrigger, delay: del() };

	switch (effectClass) {
		case 'gsap-fade-up':
			gsap.from(element.querySelectorAll('.char'), {
				y: 80, opacity: 0, duration: dur(1), ease: 'power3.out', stagger: stag(0.03), ...base,
			});
			break;
		case 'gsap-word-reveal':
			gsap.from(element.querySelectorAll('.word'), {
				yPercent: 120, opacity: 0, duration: dur(1.2), ease: 'power4.out', stagger: stag(0.1), ...base,
			});
			break;
		case 'gsap-scale-rotate':
			gsap.from(element.querySelectorAll('.char'), {
				scale: 0, rotationX: 90, opacity: 0, duration: dur(0.8), ease: 'back.out(1.7)', stagger: stag(0.02), ...base,
			});
			break;
		case 'gsap-clip-slide':
			gsap.from(element.querySelectorAll('.word'), {
				x: -60, clipPath: 'inset(0 100% 0 0)', opacity: 0, duration: dur(1.2), ease: 'power2.inOut', stagger: stag(0.08), ...base,
			});
			break;
		case 'gsap-bounce':
			gsap.from(element.querySelectorAll('.char'), {
				y: -100, opacity: 0, duration: dur(1), ease: 'bounce.out', stagger: stag(0.025), ...base,
			});
			break;
	}
}

// ─── Counters ─────────────────────────────────────────────────────────────────

function formatNumber(value, decimals) {
	const fixed = decimals !== undefined ? parseFloat(value).toFixed(decimals) : Math.round(value).toString();
	const parts = fixed.split('.');
	parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	return parts.join('.');
}

function initCounters() {
	document.querySelectorAll('.gsap-counter').forEach((counter) => {
		if (counter.dataset.gsapCounterInitialized === 'true') return;

		const target   = parseFloat(counter.dataset.target || '0');
		const prefix   = counter.dataset.prefix   || '';
		const suffix   = counter.dataset.suffix   || '';
		const decimals = counter.dataset.decimals !== undefined ? parseInt(counter.dataset.decimals, 10) : undefined;
		const duration = counter.dataset.gsapDuration ? parseFloat(counter.dataset.gsapDuration) : 2;
		const delay    = counter.dataset.gsapDelay    ? parseFloat(counter.dataset.gsapDelay)    : 0;

		const obj = { value: 0 };
		gsap.to(obj, {
			value: target, duration, delay, ease: 'power2.out',
			scrollTrigger: {
				trigger: counter,
				start: counter.dataset.gsapStart || 'top 80%',
				toggleActions: 'play none none reverse',
			},
			onUpdate: () => {
				counter.textContent = prefix + formatNumber(obj.value, decimals) + suffix;
			},
		});

		counter.dataset.gsapCounterInitialized = 'true';
	});
}

// ─── Cards stack ──────────────────────────────────────────────────────────────

function initCardsAnimation() {
	document.querySelectorAll('.section-cards, .card-section').forEach((section) => {
		if (section.dataset.gsapCardsInitialized === 'true') return;

		const cards = section.querySelectorAll('.cards-stack .card-img, .card-img');
		if (!cards.length) return;

		const isLiferayEdit =
			document.body.classList.contains('has-edit-mode-menu') ||
			document.body.classList.contains('lfr-has-sidebar') ||
			document.querySelector('.lfr-layout-structure-item-toolbar');

		if (isLiferayEdit) {
			gsap.set(cards, { opacity: 1, '--y-offset': (i) => (i * -90) + 120 + 'px' });
			cards.forEach((card, i) => card.style.zIndex = 10 - i);
			section.dataset.gsapCardsInitialized = 'true';
			return;
		}

		const usePin  = section.dataset.gsapPin !== 'false';
		const startPos = section.dataset.gsapStart || (usePin ? 'top top' : 'top 75%');
		const endPos   = section.dataset.gsapEnd   || '+=350%';

		gsap.set(cards, { opacity: 0, '--y-offset': (i) => 400 + (i * 150) + 'px' });
		gsap.set(cards, { clearProps: 'transform' });

		const tl = gsap.timeline({
			scrollTrigger: {
				trigger: section, start: startPos, end: endPos,
				pin: usePin, scrub: 1.5, anticipatePin: 1,
			},
		});

		cards.forEach((card, i) => {
			card.style.zIndex = 10 - i;
			tl.to(card, {
				'--y-offset': (i * -40) + 60 + 'px',
				opacity: 1, duration: 0.35, ease: 'none',
			}, i * 0.15);
		});

		tl.to({}, { duration: 0.1 });
		section.dataset.gsapCardsInitialized = 'true';
	});
}

// ─── Horizontal scroll ────────────────────────────────────────────────────────

function initHorizontalScroll() {
	document.querySelectorAll('[data-gsap-horizontal]').forEach((section) => {
		if (section.dataset.gsapHorizontalInitialized === 'true') return;

		const track = section.querySelector('[data-gsap-horizontal-track]');
		if (!track) return;

		const isLiferayEdit =
			document.body.classList.contains('has-edit-mode-menu') ||
			document.body.classList.contains('lfr-has-sidebar') ||
			document.querySelector('.lfr-layout-structure-item-toolbar');

		if (isLiferayEdit) {
			gsap.set(track, { clearProps: 'transform' });
			section.dataset.gsapHorizontalInitialized = 'true';
			return;
		}

		const getDistance = () => Math.max(0, track.scrollWidth - section.clientWidth);

		gsap.to(track, {
			x: () => -getDistance(),
			ease: 'none',
			scrollTrigger: {
				trigger: section,
				start: section.dataset.gsapStart || 'top top',
				end: () => `+=${Math.max(1, getDistance())}`,
				pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
			},
		});

		section.dataset.gsapHorizontalInitialized = 'true';
	});
}

// ─── Story scroll ─────────────────────────────────────────────────────────────

function initStoryScroll() {
	document.querySelectorAll('[data-story-scroll]').forEach((story) => {
		if (story.dataset.gsapStoryInitialized === 'true') return;

		const stage = story.querySelector('.story__stage');
		const beats = [...story.querySelectorAll('.story__beat')];
		const steps = [...story.querySelectorAll('[data-story-step]')];
		const meter = story.querySelector('.story__meter');
		if (!stage || !beats.length) return;

		if (beats.length <= 1) {
			beats.forEach((beat) => {
				beat.classList.add('is-active');
				beat.setAttribute('aria-hidden', 'false');
				gsap.set(beat, { autoAlpha: 1, y: 0 });
			});
			if (meter) meter.style.display = 'none';
			story.style.minHeight = 'auto';
			stage.style.minHeight = 'auto';
			story.dataset.gsapStoryInitialized = 'true';
			return;
		}

		const setBeat = (index, animate = true) => {
			const activeIndex = Math.max(0, Math.min(index, beats.length - 1));
			beats.forEach((beat, i) => {
				const isActive = i === activeIndex;
				beat.classList.toggle('is-active', isActive);
				beat.setAttribute('aria-hidden', String(!isActive));
				gsap.to(beat, {
					autoAlpha: isActive ? 1 : 0,
					y: isActive ? 0 : 24,
					duration: animate ? 0.45 : 0,
					ease: 'power3.out',
					overwrite: true,
				});
			});
			steps.forEach((step, i) => {
				const isActive = i === activeIndex;
				step.classList.toggle('is-active', isActive);
				step.setAttribute('aria-pressed', String(isActive));
			});
			stage.dataset.phase = String(activeIndex);
		};

		setBeat(0, false);

		const isLiferayEdit =
			document.body.classList.contains('has-edit-mode-menu') ||
			document.body.classList.contains('lfr-has-sidebar') ||
			document.querySelector('.lfr-layout-structure-item-toolbar');

		if (isLiferayEdit) {
			story.dataset.gsapStoryInitialized = 'true';
			return;
		}

		steps.forEach((step) => {
			step.addEventListener('click', () => {
				setBeat(parseInt(step.dataset.storyStep || '0', 10));
			});
		});

		const state = { progress: 0 };
		gsap.to(state, {
			progress: beats.length - 1,
			ease: 'none',
			scrollTrigger: {
				trigger: story,
				start: story.dataset.gsapStart || 'top top',
				end: story.dataset.gsapEnd || 'bottom bottom',
				pin: stage, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true,
				onUpdate: (self) => {
					setBeat(Math.round(self.progress * (beats.length - 1)));
					stage.style.setProperty('--story-rotation', `${Math.round(self.progress * 90)}deg`);
				},
			},
		});

		story.dataset.gsapStoryInitialized = 'true';
	});
}

// ─── Accordion ────────────────────────────────────────────────────────────────

function initAccordionAnimation() {
	document.querySelectorAll('.gsap-accordion-section').forEach((section) => {
		if (section.dataset.gsapAccordionInitialized === 'true') return;

		const accordionItems = section.querySelectorAll('.accordion-item');
		const images = section.querySelectorAll('.accordion-img');

		accordionItems.forEach((item) => {
			const header  = item.querySelector('.accordion-header');
			const content = item.querySelector('.accordion-content');
			const targetImage = Array.from(images).find((img) => img.id === item.dataset.target);

			if (item.classList.contains('active')) {
				gsap.set(content, { height: 'auto', opacity: 1 });
				item.querySelector('[data-accordion-animate="expand"]')?.beginElement();
			} else {
				gsap.set(content, { height: 0, opacity: 0 });
			}

			if (!header || !content) return;

			header.addEventListener('click', () => {
				const isActive = item.classList.contains('active');

				if (isActive) {
					item.classList.remove('active');
					item.querySelector('[data-accordion-animate="collapse"]')?.beginElement();
					gsap.to(content, {
						height: 0, opacity: 0, duration: 0.4, ease: 'power2.inOut',
						onComplete: () => ScrollTrigger.refresh(),
					});
				} else {
					accordionItems.forEach((other) => {
						if (other.classList.contains('active')) {
							other.classList.remove('active');
							other.querySelector('[data-accordion-animate="collapse"]')?.beginElement();
							gsap.to(other.querySelector('.accordion-content'), {
								height: 0, opacity: 0, duration: 0.4, ease: 'power2.inOut',
							});
						}
					});

					item.classList.add('active');
					item.querySelector('[data-accordion-animate="expand"]')?.beginElement();
					gsap.to(content, {
						height: 'auto', opacity: 1, duration: 0.4, ease: 'power2.inOut',
						onComplete: () => ScrollTrigger.refresh(),
					});

					if (targetImage) {
						images.forEach((img) => {
							if (img === targetImage) {
								img.classList.add('active');
								gsap.fromTo(img,
									{ opacity: 0, scale: 0.95, y: 15 },
									{ opacity: 1, scale: 1,    y: 0,  duration: 0.6, ease: 'power2.out' }
								);
							} else {
								img.classList.remove('active');
								gsap.to(img, { opacity: 0, scale: 1.05, duration: 0.4, ease: 'power2.in' });
							}
						});
					}
				}
			});
		});

		section.dataset.gsapAccordionInitialized = 'true';
	});
}

// ─── Top bars ─────────────────────────────────────────────────────────────────

function initTopBars() {
	document.querySelectorAll('.top-bar-prehome-container').forEach((topBar) => {
		if (topBar.dataset.gsapTopbarInitialized === 'true') return;
		topBar.querySelector('.close-topbar')?.addEventListener('click', () => {
			topBar.classList.add('is-hidden');
		});
		topBar.dataset.gsapTopbarInitialized = 'true';
	});
}

// ─── Popups ───────────────────────────────────────────────────────────────────

function initPopups() {
	document.querySelectorAll('.kubo-popup-overlay').forEach((popup) => {
		if (popup.dataset.gsapPopupInitialized === 'true') return;

		const storageKey = popup.dataset.popupStorageKey || 'kuboPopupClosed';
		popup.querySelector('.kubo-popup-close')?.addEventListener('click', () => {
			popup.classList.remove('is-visible');
		});
		popup.addEventListener('click', (e) => {
			if (e.target === popup) {
				popup.classList.remove('is-visible');
				sessionStorage.setItem(storageKey, 'true');
			}
		});

		popup.dataset.gsapPopupInitialized = 'true';
	});
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function init() {
	initTopBars();
	initPopups();
	initCardsAnimation();
	initHorizontalScroll();
	initStoryScroll();
	initAccordionAnimation();

	requestAnimationFrame(() => {
		ScrollTrigger.refresh();

		const selector = EFFECT_CLASSES.map((cls) => `.${cls}`).join(', ');
		document.querySelectorAll(selector).forEach((element) => {
			if (element.dataset.gsapInitialized === 'true') return;
			splitText(element);
			gsap.set(element.querySelectorAll('.char'), { display: 'inline-block' });
			applyEffect(element);
			element.dataset.gsapInitialized = 'true';
		});

		initCounters();

		document.querySelectorAll('.gsap-subtitle').forEach((subtitle) => {
			if (subtitle.dataset.gsapSubtitleInitialized === 'true') return;
			const isScroll = !subtitle.classList.contains('gsap-no-scroll');
			gsap.from(subtitle, {
				y: 20, opacity: 0,
				duration: subtitle.dataset.gsapDuration ? parseFloat(subtitle.dataset.gsapDuration) : 0.8,
				ease: 'power2.out',
				delay: subtitle.dataset.gsapDelay ? parseFloat(subtitle.dataset.gsapDelay) : 0,
				scrollTrigger: isScroll
					? {
						trigger: subtitle,
						start: subtitle.dataset.gsapStart || 'top 80%',
						toggleActions: subtitle.dataset.gsapToggle || 'play none none reverse',
					}
					: undefined,
			});
			subtitle.dataset.gsapSubtitleInitialized = 'true';
		});
	});
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

window.initGSAPEffects = init;

if (window.Liferay && typeof window.Liferay.on === 'function') {
	window.Liferay.on('endNavigate', init);
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}
