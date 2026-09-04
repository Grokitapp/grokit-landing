import { motion } from 'framer-motion';

export type MascotPose = 'idle' | 'wave' | 'thinking' | 'celebrate';

interface GrokitMascotProps {
  size?: number;
  className?: string;
  pose?: MascotPose;
}

export function GrokitMascot({ size = 140, className = '', pose = 'idle' }: GrokitMascotProps) {
  const rightArmAnimate =
  pose === 'wave' ?
  { rotate: [0, -35, -10, -35, -10, 0] } :
  pose === 'thinking' ?
  { rotate: -70, x: -6, y: -10 } :
  pose === 'celebrate' ?
  { rotate: [-15, -35, -15], y: [0, -6, 0] } :
  { rotate: [0, 8, 0] };

  const rightArmTransition =
  pose === 'wave' ?
  { duration: 1.4, repeat: 2 } :
  pose === 'thinking' ?
  { duration: 0.4 } :
  pose === 'celebrate' ?
  { duration: 0.8, repeat: Infinity, ease: 'easeInOut' } :
  { duration: 3.5, repeat: Infinity, ease: 'easeInOut' };

  const leftArmAnimate =
  pose === 'celebrate' ?
  { rotate: [15, 35, 15], y: [0, -6, 0] } :
  { rotate: [0, -6, 0] };

  const leftArmTransition =
  pose === 'celebrate' ?
  { duration: 0.8, repeat: Infinity, ease: 'easeInOut' } :
  { duration: 3.8, repeat: Infinity, ease: 'easeInOut' };

  return (
    <motion.div
      className={className}
      style={{ width: size, height: size * 1.15 }}
      animate={{ y: pose === 'celebrate' ? [0, -8, 0] : [0, -6, 0] }}
      transition={{ duration: pose === 'celebrate' ? 0.8 : 3.5, repeat: Infinity, ease: 'easeInOut' }}>

      <svg viewBox="0 0 120 150" width={size} height={size * 1.15}>
        {/* Legs — continuous idle sway regardless of pose */}
        {[
        { d: 'M28 82 Q18 100 26 118', delay: 0 },
        { d: 'M46 90 Q40 110 48 128', delay: 0.3 },
        { d: 'M74 90 Q80 110 72 128', delay: 0.15 },
        { d: 'M92 82 Q102 100 94 118', delay: 0.45 }].
        map((leg, i) =>
        <motion.path
          key={i}
          d={leg.d}
          stroke="var(--color-orange)"
          strokeWidth="11"
          strokeLinecap="round"
          fill="none"
          animate={{ rotate: [0, i % 2 === 0 ? -6 : 6, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: leg.delay }}
          style={{ transformBox: 'view-box', transformOrigin: '60px 90px' }} />

        )}

        {/* Left arm */}
        <motion.path
          d="M20 60 Q6 76 14 96"
          stroke="var(--color-orange)"
          strokeWidth="11"
          strokeLinecap="round"
          fill="none"
          animate={leftArmAnimate}
          transition={leftArmTransition}
          style={{ transformBox: 'view-box', transformOrigin: '20px 60px' }} />

        {/* Right arm — the expressive one */}
        <motion.path
          d="M100 60 Q114 76 106 96"
          stroke="var(--color-orange)"
          strokeWidth="11"
          strokeLinecap="round"
          fill="none"
          animate={rightArmAnimate}
          transition={rightArmTransition}
          style={{ transformBox: 'view-box', transformOrigin: '100px 60px' }} />

        {/* Head / mantle */}
        <circle cx="60" cy="55" r="40" fill="var(--color-orange)" />

        {/* Eyes — blink via opacity */}
        <motion.g
          animate={{ opacity: [1, 1, 1, 0.15, 1, 1, 1, 1, 1] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: 'linear' }}>

          <circle cx="45" cy="50" r="9" fill="white" />
          <circle cx="45" cy="52" r="4.5" fill="var(--color-ink)" />
          <circle cx="75" cy="50" r="9" fill="white" />
          <circle cx="75" cy="52" r="4.5" fill="var(--color-ink)" />
        </motion.g>

        {/* Smile */}
        <path d="M45 72 Q60 84 75 72" stroke="white" strokeWidth="5" strokeLinecap="round" fill="none" />

        {/* Cheeks — gold, kept distinct from the orange body */}
        <circle cx="32" cy="64" r="4.5" fill="var(--color-amber)" opacity="0.6" />
        <circle cx="88" cy="64" r="4.5" fill="var(--color-amber)" opacity="0.6" />
      </svg>
    </motion.div>
    );
}