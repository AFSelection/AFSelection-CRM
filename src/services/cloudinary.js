import { compressImage } from '../utils/compressor';

const CLOUD_NAME = 'jm1u0v8b';
const UPLOAD_PRESET = 'afselect_unsigned';

/** Límites estrictos de seguridad para prevenir archivos pesados */
const MAX_ORIGINAL_IMAGE_MB = 35; // Límite para el archivo crudo seleccionado
const MAX_COMPRESSED_IMAGE_MB = 1.5; // Límite máximo para la imagen una vez comprimida (1.5 MB)
const MAX_VIDEO_MB = 25; // Límite máximo para archivos de video MP4

/**
 * Sube un archivo a Cloudinary aplicando prevención y compresión automática.
 *
 * @param {File} file
 * @param {string} folder
 * @param {function} [onProgress] Callback opcional para mostrar progreso/info al usuario
 */
export async function uploadToCloudinary(file, folder = 'listings', onProgress) {
  if (!file) return null;

  const isImage = file.type?.startsWith('image/');
  const isVideo = file.type?.startsWith('video/');

  // 1. Validación inicial de tamaño original
  const rawSizeMB = file.size / 1024 / 1024;

  if (isImage && rawSizeMB > MAX_ORIGINAL_IMAGE_MB) {
    throw new Error(`La imagen "${file.name}" es demasiado grande (${rawSizeMB.toFixed(1)} MB). El límite máximo por archivo es de ${MAX_ORIGINAL_IMAGE_MB} MB.`);
  }

  if (isVideo && rawSizeMB > MAX_VIDEO_MB) {
    throw new Error(`El video "${file.name}" supera el límite permitido de ${MAX_VIDEO_MB} MB (pesa ${rawSizeMB.toFixed(1)} MB).`);
  }

  // 2. Compresión automática para imágenes
  let fileToUpload = file;
  if (isImage) {
    if (onProgress) onProgress(`Comprimiendo ${file.name}... (${rawSizeMB.toFixed(1)} MB)`);
    fileToUpload = await compressImage(file);
    const compressedSizeMB = fileToUpload.size / 1024 / 1024;

    // 3. Validación de límite máximo después de comprimir
    if (compressedSizeMB > MAX_COMPRESSED_IMAGE_MB) {
      throw new Error(
        `La imagen "${file.name}" no pudo reducirse por debajo del límite de ${MAX_COMPRESSED_IMAGE_MB} MB ` +
        `(pesa ${compressedSizeMB.toFixed(2)} MB). Por favor, reduce sus dimensiones o guárdala en menor resolución.`
      );
    }

    if (onProgress) {
      const pct = Math.round((1 - fileToUpload.size / file.size) * 100);
      onProgress(`Subiendo ${file.name}... (${(fileToUpload.size / 1024).toFixed(0)} KB, -${pct}%)`);
    }
  }

  // 4. Envío a Cloudinary
  const formData = new FormData();
  formData.append('file', fileToUpload);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', `afselect/${folder}`);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Cloudinary Upload Error:', errText);
    throw new Error(`Error al subir a Cloudinary (HTTP ${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.secure_url;
}
