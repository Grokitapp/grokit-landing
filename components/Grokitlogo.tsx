import { motion } from 'framer-motion';

interface GrokitLogoProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

/**
 * Vector recreation of the Grokit "G" mark — an open ring with an inward
 * crossbar (classic G letterform) and a diagonal cut for a dynamic, ribbon-like
 * feel. Uses currentColor so it inherits text color (e.g. text-ink normally,
 * text-white when placed on a colored background).
 */
export function GrokitLogo({ size = 32, className = '', animate = false }: GrokitLogoProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      initial={animate ? { opacity: 0, scale: 0.8 } : undefined}
      animate={animate ? { opacity: 1, scale: 1 } : undefined}
      transition={{ duration: 0.5 }}>

      {/* Outer G bracket, open on the right */}
      <path
        d="M76 28 A34 34 0 1 1 76 72"
        stroke="currentColor"
        strokeWidth="16"
        strokeLinecap="round"
        fill="none" />

      {/* Inward crossbar completing the G */}
      <path
        d="M79 50 L55 50"
        stroke="currentColor"
        strokeWidth="16"
        strokeLinecap="round" />

      {/* Diagonal cut for a dynamic ribbon feel — matches the page background */}
      <path
        d="M33 39 L58 65"
        stroke="var(--color-surface)"
        strokeWidth="9"
        strokeLinecap="round" />

    </motion.svg>
    );
}