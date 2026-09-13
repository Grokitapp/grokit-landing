import { useState } from 'react';
import { motion, type TargetAndTransition, type Transition, } from 'framer-motion';
import octoPng from '../assets/grokit-octo.png';
import octopusSvg from '../assets/grokit-octopus.svg';

export type MascotPose = 'idle' | 'wave' | 'thinking' | 'celebrate';

interface GrokitMascotProps {
  size?: number;
  className?: string;
  pose?: MascotPose;
}

const poseConfig: Record<
  MascotPose,
  {
    animate: TargetAndTransition;
    transition: Transition;
  }
> = {
  idle: {
    animate: { y: [0, -6, 0], rotate: [0, -2, 2, 0] },
    transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
  },
  wave: {
    animate: { y: [0, -6, 0], rotate: [0, -6, 6, -6, 0] },
    transition: { duration: 1.2, repeat: 2 },
  },
  thinking: {
    animate: { y: [0, -4, 0], rotate: -6 },
    transition: { duration: 0.4 },
  },
  celebrate: {
    animate: { y: [0, -14, 0], rotate: [-4, 4, -4] },
    transition: { duration: 0.7, repeat: Infinity, ease: 'easeInOut' },
  },
};

const imgStyle = { objectFit: 'contain', width: '100%', height: '100%' } as const;

const FALLBACK_SVG = (
  <svg viewBox="0 0 100 100">
    <circle cx="50" cy="52" r="40" fill="var(--color-orange)" />
    <circle cx="38" cy="46" r="7" fill="white" />
    <circle cx="38" cy="48" r="3.5" fill="var(--color-ink)" />
    <circle cx="62" cy="46" r="7" fill="white" />
    <circle cx="62" cy="48" r="3.5" fill="var(--color-ink)" />
    <path d="M38 64 Q50 74 62 64" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" />
  </svg>
);

export function GrokitMascot({ size = 140, className = '', pose = 'idle' }: GrokitMascotProps) {
  const [pngFailed, setPngFailed] = useState(false);
  const [svgFailed, setSvgFailed] = useState(false);
  const { animate, transition } = poseConfig[pose];

  const src = !pngFailed ? octoPng : !svgFailed ? octopusSvg : null;

  return (
    <motion.div
      className={className}
      style={{ width: size, height: size }}
      animate={animate}
      transition={transition}
    >
      {src ? (
        <img
          src={src}
          alt="Grokit"
          width={size}
          height={size}
          style={imgStyle}
          onError={() => (pngFailed ? setSvgFailed(true) : setPngFailed(true))}
        />
      ) : (
        FALLBACK_SVG
      )}
    </motion.div>
  );
}