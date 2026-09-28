/**
 * Encuadre de imágenes: qué parte de cada foto se ve en el sitio.
 *
 * Se guarda pegado a la URL como fragmento: `https://.../foto.webp#encuadre=50,30,1.2`
 * (x %, y %, zoom). El navegador nunca manda el fragmento al servidor, así que
 * la foto se descarga igual; y como viaja dentro del mismo string, al reordenar
 * o borrar fotos el encuadre se mueve con la suya sin tocar la base de datos.
 *
 * Debe coincidir con af-selection-client/src/utils/imageFraming.js.
 */

const KEY = 'encuadre';
const FRAGMENT_RE = new RegExp(`#${KEY}=([^#]*)$`);

export const DEFAULT_FRAMING = { x: 50, y: 50, zoom: 1 };
export const MAX_ZOOM = 3;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export function parseFraming(url) {
  if (!url || typeof url !== 'string') return { src: url, framing: null };
  const match = url.match(FRAGMENT_RE);
  if (!match) return { src: url, framing: null };

  const [x, y, zoom] = match[1].split(',').map(Number);
  const framing = {
    x: Number.isFinite(x) ? clamp(x, 0, 100) : 50,
    y: Number.isFinite(y) ? clamp(y, 0, 100) : 50,
    zoom: Number.isFinite(zoom) ? clamp(zoom, 1, 4) : 1
  };
  return { src: url.slice(0, match.index), framing };
}

export function stripFraming(url) {
  return parseFraming(url).src;
}

/** Devuelve la URL con el encuadre nuevo. El encuadre por defecto no se escribe. */
export function withFraming(url, framing) {
  const src = stripFraming(url);
  if (!src || !framing) return src;

  const x = Math.round(clamp(framing.x, 0, 100) * 10) / 10;
  const y = Math.round(clamp(framing.y, 0, 100) * 10) / 10;
  const zoom = Math.round(clamp(framing.zoom, 1, MAX_ZOOM) * 100) / 100;
  if (x === 50 && y === 50 && zoom === 1) return src;

  return `${src}#${KEY}=${x},${y},${zoom}`;
}

/**
 * Estilos para un `<img>` con `object-fit: cover`. Son exactamente los mismos
 * que aplica el sitio, así que las vistas previas del CRM muestran lo mismo.
 */
export function framingStyle(url, { allowZoom = true } = {}) {
  const { framing } = parseFraming(url);
  if (!framing) return undefined;

  const position = `${framing.x}% ${framing.y}%`;
  const style = { objectPosition: position };
  if (allowZoom && framing.zoom > 1) {
    style.scale = String(framing.zoom);
    style.transformOrigin = position;
  }
  return style;
}

/**
 * Qué porción de la foto (en fracciones de 0 a 1) queda visible en un recuadro
 * de relación `frameAspect` (ancho / alto), con `object-fit: cover`,
 * `object-position: x% y%` y el zoom aplicado desde ese mismo punto.
 */
export function visibleRegion(imageAspect, frameAspect, { x, y, zoom }) {
  const w = (frameAspect > imageAspect ? 1 : frameAspect / imageAspect) / zoom;
  const h = (frameAspect > imageAspect ? imageAspect / frameAspect : 1) / zoom;
  return {
    left: (x / 100) * (1 - w),
    top: (y / 100) * (1 - h),
    width: w,
    height: h
  };
}

/* ------------------------------------------------------------------------- *
 * Recuadros del sitio
 *
 * Medidas de cada lugar donde aparece una foto, en px de pantalla, medidas en
 * el sitio (PC ~1500 px, celular 390 px). Lo que importa es la proporción: es
 * la que decide qué parte se recorta. Si cambia el diseño del sitio, hay que
 * actualizarlas acá.
 * ------------------------------------------------------------------------- */

const LISTING_CARD = [
  { id: 'card', label: 'Tarjeta del catálogo', device: 'PC', w: 358, h: 313 },
  { id: 'card-m', label: 'Tarjeta del catálogo', device: 'Celular', w: 300, h: 313 }
];

const LISTING_DETAIL = [
  { id: 'detail', label: 'Ficha del producto', device: 'PC', w: 880, h: 520 },
  { id: 'detail-m', label: 'Ficha del producto', device: 'Celular', w: 323, h: 232 }
];

const LISTING_OFFER = [
  { id: 'offer', label: 'Bajó de precio', device: 'PC', w: 280, h: 160 }
];

/** Recuadros de una foto de publicación según su lugar en la galería. */
export function listingFrames(index) {
  if (index === 0) return [...LISTING_CARD, ...LISTING_DETAIL, ...LISTING_OFFER];
  // La segunda aparece en la tarjeta al pasar el mouse.
  if (index === 1) return [LISTING_CARD[0], ...LISTING_DETAIL];
  return LISTING_DETAIL;
}

export const HERO_FRAMES = [
  { id: 'hero', label: 'Portada del inicio', device: 'PC', w: 1536, h: 771 },
  { id: 'hero-m', label: 'Portada del inicio', device: 'Celular', w: 387, h: 639 }
];

/** Tarjetas destacadas del inicio: en celular la tercera ocupa todo el ancho. */
export function staggeredFrames(index) {
  return [
    { id: 'staggered', label: 'Tarjeta destacada', device: 'PC', w: 300, h: 360 },
    index === 2
      ? { id: 'staggered-m', label: 'Tarjeta destacada', device: 'Celular', w: 355, h: 220 }
      : { id: 'staggered-m', label: 'Tarjeta destacada', device: 'Celular', w: 169, h: 190 }
  ];
}

export const TESTIMONIAL_FRAMES = [
  { id: 'testimonial', label: 'Foto de la reseña', device: 'PC', w: 279, h: 190 },
  { id: 'testimonial-m', label: 'Foto de la reseña', device: 'Celular', w: 353, h: 190 }
];
