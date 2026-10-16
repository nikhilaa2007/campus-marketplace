// Cloudinary resizes images through the URL, so cards load small files instead of full photos
export function thumb(url, w, h) {
  const size = `c_fill,w_${w}${h ? `,h_${h}` : ''},q_auto,f_auto`;
  return url.replace('/upload/', `/upload/${size}/`);
}

// Phone photos can be 8 MB+. Shrink them in the browser before uploading.
export async function shrinkImage(file, maxSide = 1600, quality = 0.85) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not read this image'))), 'image/jpeg', quality)
  );
}
