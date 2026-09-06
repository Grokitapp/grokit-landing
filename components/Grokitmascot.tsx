import { useState } from 'react';
import { motion, type Transition } from 'framer-motion';
import octopusSvg from '../assets/grokit-octopus.svg';

export type MascotPose = 'idle' | 'wave' | 'thinking' | 'celebrate';

interface GrokitMascotProps {
  size?: number;
  className?: string;
  pose?: MascotPose;
}

export function GrokitMascot({ size = 140, className = '', pose = 'idle' }: GrokitMascotProps) {
  const [failed, setFailed] = useState(false);

  const animate =
    pose === 'wave' ?
      { y: [0, -6, 0], rotate: [0, -6, 6, -6, 0] } :
    pose === 'thinking' ?
      { y: [0, -4, 0], rotate: -6 } :
    pose === 'celebrate' ?
      { y: [0, -14, 0], rotate: [-4, 4, -4] } :
      { y: [0, -6, 0], rotate: [0, -2, 2, 0] };

  const transition: Transition =
    pose === 'wave' ?
      { duration: 1.2, repeat: 2 } :
    pose === 'thinking' ?
      { duration: 0.4 } :
    pose === 'celebrate' ?
      { duration: 0.7, repeat: Infinity, ease: 'easeInOut' } :
      { duration: 3.5, repeat: Infinity, ease: 'easeInOut' };

  return (
    <motion.div
      className={className}
      style={{ width: size, height: size }}
      animate={animate}
      transition={transition}>

      {failed ?
      <svg viewBox="0 0 100 100" width={size} height={size}>
          <circle cx="50" cy="52" r="40" fill="var(--color-orange)" />
          <circle cx="38" cy="46" r="7" fill="white" />
          <circle cx="38" cy="48" r="3.5" fill="var(--color-ink)" />
          <circle cx="62" cy="46" r="7" fill="white" />
          <circle cx="62" cy="48" r="3.5" fill="var(--color-ink)" />
          <path d="M38 64 Q50 74 62 64" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg> :

      <img
        src={octopusSvg}
        alt="Grokit"
        width={size}
        height={size}
        style={{ objectFit: 'contain', width: '100%', height: '100%' }}
        onError={() => setFailed(true)} />

      }
    </motion.div>
    );
}