import React from 'react';

/** WebP + JPEG — run `npm run compress-assets` after updating source photos */
export default function OptimizedPicture({
  src,
  alt = '',
  className = '',
  pictureClassName = '',
  loading,
  decoding = 'async',
  ...imgProps
}) {
  const webpSrc = String(src).replace(/\.jpe?g$/i, '.webp');

  return (
    <picture className={pictureClassName || undefined}>
      <source srcSet={webpSrc} type="image/webp" />
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        decoding={decoding}
        {...imgProps}
      />
    </picture>
  );
}
