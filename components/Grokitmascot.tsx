import { motion } from 'framer-motion';
import octopusSvg from '../assets/grokit-octopus.svg';

export type MascotPose = 'idle' | 'wave' | 'thinking' | 'celebrate';

interface GrokitMascotProps {
  size?: number;
  className?: string;
  pose?: MascotPose;
}

export function GrokitMascot({ size = 140, className = '', pose = 'idle' }: GrokitMascotProps) {
  const animate =
  pose === 'wave' ?
  { y: [0, -6, 0], rotate: [0, -6, 6, -6, 0] } :
  pose === 'thinking' ?
  { y: [0, -4, 0], rotate: -6 } :
  pose === 'celebrate' ?
  { y: [0, -14, 0], rotate: [-4, 4, -4] } :
  { y: [0, -6, 0], rotate: [0, -2, 2, 0] };

  const transition =
  pose === 'wave' ?
  { duration: 1.2, repeat: 2 } :
  pose === 'thinking' ?
  { duration: 0.4 } :
  pose === 'celebrate' ?
  { duration: 0.7, repeat: Infinity, ease: 'easeInOut' as const } :
  { duration: 3.5, repeat: Infinity, ease: 'easeInOut' as const };

  return (
    <motion.img
      src={octopusSvg}
      alt="Grokit"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
      animate={animate}
      transition={transition} />

    );
}