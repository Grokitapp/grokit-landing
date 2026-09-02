import { motion } from 'framer-motion';
import logoSrc from '../assets/grokit-logo.png';

interface GrokitLogoProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export function GrokitLogo({ size = 32, className = '', animate = false }: GrokitLogoProps) {
  return (
    <motion.img
      src={logoSrc}
      alt="Grokit"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
      initial={animate ? { opacity: 0, scale: 0.8 } : undefined}
      animate={animate ? { opacity: 1, scale: 1 } : undefined}
      transition={{ duration: 0.5 }}
    />
  );
}