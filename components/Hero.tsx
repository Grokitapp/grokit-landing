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
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 bg-surface overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">

          {/* Illustration column */}
          <motion.div
            className="order-1 md:order-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}>

            <HeroGraphic />
          </motion.div>

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
    </section>
    );
}