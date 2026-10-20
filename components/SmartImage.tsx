import { useEffect, useRef, useState, type ImgHTMLAttributes } from 'react';

interface SmartImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  src: string;
  alt: string;
  /** Above-the-fold image: load immediately with high priority. */
  priority?: boolean;
}

/**
 * Drop-in <img> replacement:
 * - fades in once loaded (the parent's background acts as the placeholder)
 * - shows instantly if the image is already in the browser cache
 * - renders nothing on error, so the placeholder/gradient behind stays visible
 * - lazy-loads and decodes off the main thread unless `priority` is set
 *
 * Give the parent a background colour or gradient so there is something to
 * see while the image loads.
 */
export function SmartImage({
  src,
  alt,
  priority = false,
  className = '',
  ...rest
}: SmartImageProps) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    const img = ref.current;
    // Already cached: show immediately instead of fading in from nothing.
    setLoaded(Boolean(img?.complete && img.naturalWidth > 0));
  }, [src]);

  if (failed) return null;

  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      decoding="async"
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={`transition-[opacity,transform] duration-500 ${
        loaded ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      {...rest}
    />
  );
}