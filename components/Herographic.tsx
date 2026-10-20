import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { IMAGE_SIZES } from '../lib/imageMeta';

// Lives in /public so index.html can preload it by a fixed URL.
// If you change the image, rename it (e.g. hero-mascot-v2.webp) in both places.
const HERO_SRC = '/hero-mascot.webp';

const ease = [0.16, 1, 0.3, 1] as const;

export function HeroGraphic() {
  const ref = useRef<HTMLImageElement>(null);
  const [ready, setReady] = useState(false);

  // Cached / preloaded image may already be complete before React attaches onLoad.
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth > 0) setReady(true);
  }, []);

  return (
    <div className="relative w-full max-w-[520px] mx-auto md:mx-0">
      <motion.img
        ref={ref}
        src={HERO_SRC}
        alt="Grokit mascot"
        width={IMAGE_SIZES.hero.width}
        height={IMAGE_SIZES.hero.height}
        decoding="async"
        fetchPriority="high"
        onLoad={() => setReady(true)}
        className="w-full max-w-[430px] sm:max-w-[470px] md:max-w-[500px] h-auto mx-auto object-contain"
        initial={{ opacity: 0, scale: 0.92, y: 18 }}
        // Animation starts only once the pixels are there, so the mascot
        // never "pops in" halfway through its entrance.
        animate={
          ready
            ? { opacity: 1, scale: 1, y: [0, -5, 0] }
            : { opacity: 0, scale: 0.92, y: 18 }
        }
        transition={{
          opacity: { duration: 0.6, ease },
          scale: { duration: 0.6, ease },
          y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 },
        }}
      />
    </div>
  );
}