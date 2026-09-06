import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';
import { HeroGraphic } from './Herographic';
import { ArrowRight } from 'lucide-react';

interface HeroProps {
  onOpenWaitlist: () => void;
}

const BUBBLES = [
{ left: '12%', size: 14, duration: 4.5, delay: 0 },
{ left: '30%', size: 20, duration: 5.2, delay: 0.8 },
{ left: '50%', size: 12, duration: 4, delay: 1.6 },
{ left: '68%', size: 18, duration: 5.6, delay: 0.4 },
{ left: '86%', size: 15, duration: 4.8, delay: 1.2 }];


export function Hero({ onOpenWaitlist }: HeroProps) {
  const navigate = useNavigate();

  return (
    <section className="relative pt-24 pb-10 md:pt-28 md:pb-14 bg-surface overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">

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

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-ink font-bold leading-[1.25] mb-8 tracking-tight">
              The smartest way to learn{' '}
              <span className="text-orange">anything</span> and actually
              understand it.
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

      <div className="absolute bottom-0 left-0 right-0 pointer-events-none h-20 overflow-hidden" aria-hidden="true">
        {BUBBLES.map((b, i) =>
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: b.left,
            bottom: 4,
            width: b.size,
            height: b.size,
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(255,138,61,0.4))',
            border: '1px solid rgba(255,107,0,0.35)',
            boxShadow: '0 1px 3px rgba(32,21,16,0.08)'
          }}
          animate={{ y: [0, -90, -170], opacity: [0, 0.9, 0] }}
          transition={{ duration: b.duration, repeat: Infinity, delay: b.delay, ease: 'easeOut' }} />

        )}
        <svg viewBox="0 0 1200 40" preserveAspectRatio="none" className="absolute bottom-0 w-full h-6 md:h-8 block">
          <path
            d="M0,20 C150,40 350,0 600,16 C850,32 1050,6 1200,20 L1200,40 L0,40 Z"
            fill="var(--color-surface-alt)" />

        </svg>
      </div>
    </section>
    );
}