/**
 * Transforma una URL de Cloudinary para recortar y optimizar la imagen.
 * c_fill: rellena el contenedor recortando inteligentemente
 * g_auto: detecta el sujeto principal para centrar el recorte
 * q_auto: calidad automática (optimiza tamaño)
 * f_auto: formato automático (WebP en navegadores compatibles)
 */
export const imgCl = (url, w = 400, h = 400) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/w_${w},h_${h},c_fill,g_auto,q_auto,f_auto/`);
};
