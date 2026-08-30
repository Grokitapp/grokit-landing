import { motion } from 'framer-motion';

interface GrokitMascotProps {
  size?: number;
  className?: string;
}

/**
 * A small friendly character built from the brand's G mark — gives the site
 * a bit of Duolingo-style mascot personality without requiring custom
 * illustration. Idle bob + periodic blink, both cheap transform/opacity
 * animations (no per-frame JS loop).
 */
export function GrokitMascot({ size = 140, className = '' }: GrokitMascotProps) {
  return (
    <motion.div
      className={className}
      style={{ width: size, height: size }}
      animate={{ y: [0, -10, 0], rotate: [0, -2, 2, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>

      <svg viewBox="0 0 120 120" width={size} height={size}>
        {/* Body */}
        <circle cx="60" cy="60" r="52" fill="var(--color-cobalt)" />

        {/* Chest emblem — echoes the logo's ring motif */}
        <path
          d="M80 40 A22 22 0 1 1 80 80"
          stroke="white"
          strokeOpacity="0.25"
          strokeWidth="9"
          strokeLinecap="round"
          fill="none" />

        {/* Eyes — blink via opacity, safe against transform-origin quirks */}
        <motion.g
          animate={{ opacity: [1, 1, 1, 0.15, 1, 1, 1, 1, 1] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}>

          <circle cx="45" cy="55" r="9" fill="white" />
          <circle cx="45" cy="57" r="4.5" fill="var(--color-ink)" />
          <circle cx="75" cy="55" r="9" fill="white" />
          <circle cx="75" cy="57" r="4.5" fill="var(--color-ink)" />
        </motion.g>

        {/* Smile */}
        <path
          d="M45 76 Q60 89 75 76"
          stroke="white"
          strokeWidth="5.5"
          strokeLinecap="round"
          fill="none" />

        {/* Cheeks — warm accent touch */}
        <circle cx="34" cy="68" r="5" fill="var(--color-amber)" opacity="0.5" />
        <circle cx="86" cy="68" r="5" fill="var(--color-amber)" opacity="0.5" />
      </svg>
    </motion.div>
    );
}