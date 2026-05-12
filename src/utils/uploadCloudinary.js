const CLOUD_NAME    = 'dnoxlv5kn';
const UPLOAD_PRESET = 'chocoadmin_upload';

/**
 * Sube un archivo al bucket de Cloudinary usando un upload preset unsigned.
 * @param {File} file  - Archivo seleccionado por el usuario
 * @returns {Promise<string>}  secure_url de la imagen subida
 */
export async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Error al subir imagen a Cloudinary');
  }

  const data = await res.json();
  return data.secure_url;
}
