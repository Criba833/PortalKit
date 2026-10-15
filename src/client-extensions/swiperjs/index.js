import Swiper from 'swiper';
import {
	Navigation,
	Pagination,
	Scrollbar,
	Autoplay,
	EffectFade,
	EffectCube,
	EffectFlip,
	EffectCoverflow,
	FreeMode,
	Grid,
	Thumbs,
	Zoom,
	Keyboard,
	Mousewheel,
	A11y,
} from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

window.Swiper = Swiper;
window.SwiperModules = {
	Navigation,
	Pagination,
	Scrollbar,
	Autoplay,
	EffectFade,
	EffectCube,
	EffectFlip,
	EffectCoverflow,
	FreeMode,
	Grid,
	Thumbs,
	Zoom,
	Keyboard,
	Mousewheel,
	A11y,
};
