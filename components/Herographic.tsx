import { motion } from 'framer-motion';
import heroMascot from '../assets/grokit-hero-mascot.png';

export function HeroGraphic() {
  return (
    <div className="relative w-full max-w-[520px] mx-auto md:mx-0">
      <motion.img
        src={heroMascot}
        alt="Grokit mascot"
        className="
          w-full
          max-w-[430px]
          sm:max-w-[470px]
          md:max-w-[500px]
          h-auto
          mx-auto
          object-contain
        "
        initial={{
          opacity: 0,
          scale: 0.92,
          y: 18,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: [0, -5, 0],
        }}
        transition={{
          opacity: {
            duration: 0.8,
            delay: 0.2,
            ease: [0.16, 1, 0.3, 1],
          },
          scale: {
            duration: 0.8,
            delay: 0.2,
            ease: [0.16, 1, 0.3, 1],
          },
          y: {
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          },
        }}
      />
    </div>
  );
}