/**
 * Pide una vez cada versión redimensionada de una foto recién subida.
 *
 * Supabase genera cada tamaño la primera vez que alguien lo pide, abriendo el
 * original y redimensionándolo: esa primera vez tarda un par de segundos. Si no
 * se hace acá, se la come el primer visitante que abra la publicación.
 * Haciéndolo al subir, para cuando la publicación esté online el CDN ya
 * responde en milisegundos.
 *
 * Es intencionalmente "fire and forget": si falla, la foto igual funciona,
 * sólo que el primer visitante espera un poco más. Nunca debe frenar ni hacer
 * fallar la carga de una publicación.
 */

const OBJECT_PATH = '/storage/v1/object/public/';
const RENDER_PATH = '/storage/v1/render/image/public/';

/**
 * Debe coincidir con WIDTH_LADDER / QUALITY_LADDER del cliente
 * (af-selection-client/src/utils/imageUrl.js). Si allá cambian los tamaños,
 * hay que actualizar esta lista o se estarían calentando URLs que nadie pide.
 */
/*
 * Un mismo componente pide anchos distintos según el devicePixelRatio del
 * visitante: una tarjeta de 640 px lógicos se resuelve a 640, 960 o 1280 según
 * la pantalla. Hay que calentar las tres, o quien entre desde un celular con
 * pantalla densa igual espera a que se genere la suya.
 */
const VARIANTS = [
  { width: 200, quality: 65 },   // miniatura 1x
  { width: 400, quality: 65 },   // miniatura 2x
  { width: 640, quality: 72 },   // tarjeta 1x
  { width: 960, quality: 72 },   // tarjeta 1.5x
  { width: 1280, quality: 72 },  // tarjeta 2x
  { width: 1280, quality: 80 },  // ficha 1x
  { width: 1600, quality: 80 }   // ficha en pantalla densa / lightbox
];

export function warmImageVariants(publicUrl) {
  if (!publicUrl || !publicUrl.includes(OBJECT_PATH)) return;

  const base = publicUrl.split('?')[0].replace(OBJECT_PATH, RENDER_PATH);

  for (const { width, quality } of VARIANTS) {
    // `no-store` para que el navegador del CRM no se llene con estas imágenes:
    // lo que nos interesa es que quede caliente el CDN, no esta máquina.
    fetch(`${base}?width=${width}&quality=${quality}`, {
      headers: { Accept: 'image/webp,image/avif,image/*,*/*' },
      cache: 'no-store'
    }).catch(() => {});
  }
}
