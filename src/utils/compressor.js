/**
 * Comprime y redimensiona imágenes en el navegador antes de subirlas.
 *
 * Historia de por qué esto es más largo de lo que parece necesario:
 * la versión anterior hacía `canvas.toBlob(cb, 'image/webp', quality)` y
 * confiaba en el resultado. Cuando el navegador que sube las fotos no sabe
 * codificar WebP en canvas, la especificación dice que caiga a PNG **e ignore
 * el parámetro de calidad** — sin lanzar error y sin avisar. El archivo se
 * seguía llamando `.webp` y se subía con `contentType: image/webp`, así que
 * todo parecía correcto. En realidad eran PNG de 2.7 a 8.4 MB por foto.
 *
 * Por eso acá nunca se asume el formato: se verifica el blob que devuelve el
 * canvas y, si no es el que pedimos, se reintenta con JPEG (que sí codifica
 * cualquier navegador). PNG queda descartado explícitamente para fotos.
 */

/** Ancho máximo que se guarda. Alcanza para pantalla completa en retina. */
const MAX_WIDTH = 1600;

/** Tope duro por archivo. Si se pasa, se recomprime más agresivo. */
const MAX_BYTES = 400 * 1024;

/** Formatos de salida aceptables, en orden de preferencia. */
const FORMATS = ['image/webp', 'image/jpeg'];

/**
 * Envuelve toBlob en promesa y **verifica** que el tipo devuelto sea el pedido.
 * Devuelve null si el navegador entregó otra cosa: ese es exactamente el caso
 * que antes pasaba desapercibido.
 */
function encode(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return resolve(null);
        if (blob.type !== type) return resolve(null); // fallback silencioso del navegador
        resolve(blob);
      },
      type,
      quality
    );
  });
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen')); };
    img.src = url;
  });
}

function extensionFor(mime) {
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  return 'bin';
}

/**
 * @param {File} file
 * @param {number} [maxWidth]
 * @param {number} [quality] 0-1
 * @returns {Promise<File>} archivo comprimido, con la extensión y el MIME que
 *   realmente tiene. Si algo falla devuelve el original, nunca un archivo
 *   mal etiquetado.
 */
export async function compressImage(file, maxWidth = MAX_WIDTH, quality = 0.78) {
  if (!file || !file.type?.startsWith('image/')) return file;

  let img;
  try {
    img = await loadImage(file);
  } catch {
    return file;
  }

  const scale = img.width > maxWidth ? maxWidth / img.width : 1;
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return file;

  // Las fotos no tienen transparencia; un fondo blanco evita que un PNG con
  // canal alfa termine en JPEG con bordes negros.
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  // Primer formato que el navegador realmente sepa codificar.
  let blob = null;
  let mime = null;
  for (const candidate of FORMATS) {
    blob = await encode(canvas, candidate, quality);
    if (blob) { mime = candidate; break; }
  }

  if (!blob) {
    console.warn('[compressor] Ningún formato con pérdida disponible; se sube el original.');
    return file;
  }

  // Si aun así quedó pesado (fotos muy detalladas), se baja la calidad por
  // pasos antes de recurrir a reducir el ancho.
  let currentQuality = quality;
  while (blob.size > MAX_BYTES && currentQuality > 0.45) {
    currentQuality = Math.max(0.45, currentQuality - 0.12);
    const retry = await encode(canvas, mime, currentQuality);
    if (!retry) break;
    blob = retry;
  }

  if (blob.size >= file.size) {
    // Comprimir la empeoró (pasa con imágenes ya optimizadas o muy chicas).
    return file;
  }

  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const compressed = new File([blob], `${baseName}.${extensionFor(mime)}`, {
    type: mime,
    lastModified: Date.now()
  });

  if (import.meta?.env?.DEV) {
    const pct = Math.round((1 - compressed.size / file.size) * 100);
    console.info(
      `[compressor] ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)} MB → ` +
      `${(compressed.size / 1024).toFixed(0)} KB (${mime}, -${pct}%)`
    );
  }

  return compressed;
}
