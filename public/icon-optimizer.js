/* Icons use their own small, transparent encoding; product photos keep their existing pipeline. */
(function () {
  window.VFM_OPTIMIZE_ICON = async function (file) {
    if (!file || file.type === 'image/svg+xml' || /\.svg$/i.test(file.name || '')) return file;
    if (file.type === 'image/gif' || /\.gif$/i.test(file.name || '')) return file;
    let bitmap;
    try {
      bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 192 / bitmap.width, 192 / bitmap.height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas.getContext('2d', { alpha: true }).drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.9));
      if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) return file;
      return new File([blob], (file.name || 'icone').replace(/\.[^.]+$/, '') + '-icon192.webp', { type: 'image/webp', lastModified: Date.now() });
    } catch (error) {
      throw new Error('Não foi possível preparar o ícone. Escolha uma imagem PNG, JPEG ou WebP válida.');
    } finally {
      bitmap?.close();
    }
  };
})();
