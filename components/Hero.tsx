import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';
import { HeroGraphic } from './Herographic';
import { ArrowRight } from 'lucide-react';

interface HeroProps {
  onOpenWaitlist: () => void;
}

export function Hero({ onOpenWaitlist }: HeroProps) {
  const navigate = useNavigate();

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-surface overflow-hidden">
      {/* Narrower content column than before, closer to Duolingo's framed
          (not edge-to-edge) layout */}
      <div className="max-w-5xl mx-auto px-6 lg:px-10">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">

          {/* Illustration column */}
          <motion.div
            className="order-1 md:order-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}>

            <HeroGraphic />
          </motion.div>

          {/* Text column */}
          <motion.div
            className="order-2 md:order-1 text-center md:text-left"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-ink font-bold leading-[1.2] mb-8 tracking-tight">
              Learn <span className="text-orange">anything.</span>{' '}
              Understand it for real.
            </h1>

            <div className="flex flex-col sm:flex-row items-center md:items-start justify-center md:justify-start gap-3 sm:gap-4">
              <motion.button
                onClick={() => navigate('/onboarding')}
                className="btn-duo px-6 py-3 text-sm sm:px-8 sm:py-4 sm:text-lg"
                whileTap={{ scale: 0.98 }}>

                Start learning
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>

              <motion.button
                onClick={onOpenWaitlist}
                className="btn-duo-outline px-6 py-3 text-sm sm:px-8 sm:py-4 sm:text-lg"
                whileTap={{ scale: 0.98 }}>

                Join the waitlist
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 pointer-events-none" aria-hidden="true">
        <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className="w-full h-10 md:h-14 block">
          <path
            d="M0,40 C150,85 350,0 600,32 C850,64 1050,12 1200,40 L1200,80 L0,80 Z"
            fill="var(--color-surface-alt)" />

        </svg>
        {[0, 1, 2].map((i) =>
        <motion.div
          key={i}
          className="absolute rounded-full bg-orange/10"
          style={{ width: 8 + i * 4, height: 8 + i * 4, left: `${22 + i * 18}%`, bottom: 6 }}
          animate={{ y: [0, -70, -140], opacity: [0, 0.6, 0] }}
          transition={{ duration: 4.5 + i, repeat: Infinity, delay: i * 1.4, ease: 'easeOut' }} />

        )}
      </div>
    </section>
    );
}