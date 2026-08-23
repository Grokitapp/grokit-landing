import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { GrokitLogo } from './Grokitlogo';

interface FinalCTAProps {
  onOpenWaitlist: () => void;
}

export function FinalCTA({ onOpenWaitlist }: FinalCTAProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end end']
  });

  const glowOpacity = useTransform(scrollYProgress, [0.5, 1], [0, 0.5]);

  return (
    <section data-ev-id="ev_2a325d1ec1"
    ref={containerRef}
    className="relative py-32 md:py-48 min-h-[80vh] flex items-center bg-black overflow-hidden">

      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0"
        style={{ opacity: glowOpacity }}>

        <div data-ev-id="ev_dc3840c808"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-250 h-250 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 40%, transparent 70%)',
          filter: 'blur(80px)'
        }} />

      </motion.div>

      <div data-ev-id="ev_d50f568238" className="relative max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}>

          <h2 data-ev-id="ev_003200fcdf" className="font-display text-4xl md:text-6xl lg:text-7xl text-white font-bold mb-6 leading-tight">
            Curiosity is the beginning.
            <br data-ev-id="ev_2c4ae49c44" />
            <span data-ev-id="ev_f32d6b9e1c" className="bg-linear-to-r from-cobalt via-purple to-cyan bg-clip-text text-transparent">
              Understanding
            </span>{' '}
            is the goal.
          </h2>
          
          <p data-ev-id="ev_407fd03624" className="text-xl md:text-2xl text-gray mb-12">
            Start building the way you learn.
          </p>

          <motion.button
            onClick={onOpenWaitlist}
            className="group relative px-10 py-5 rounded-full font-semibold text-lg overflow-hidden text-white"
            style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)'
            }}
            whileHover={{ scale: 1.02, boxShadow: '0 0 60px rgba(59, 130, 246, 0.5)' }}
            whileTap={{ scale: 0.98 }}>

            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent -translate-x-full"
              animate={{ x: ['100%', '-100%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }} />

            <span data-ev-id="ev_2761b1490d" className="relative flex items-center gap-2">
              Join the waitlist
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </span>
          </motion.button>
        </motion.div>

        {/* Logo mark */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-24">

          <GrokitLogo size={64} className="mx-auto opacity-10" />
        </motion.div>
      </div>
    </section>
    );
}