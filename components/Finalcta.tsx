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
    <section
    ref={containerRef}
    className="relative py-12 md:py-20 min-h-[60vh] flex items-center bg-black overflow-hidden">

      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0"
        style={{ opacity: glowOpacity }}>

        <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 40%, transparent 70%)',
          filter: 'blur(80px)'
        }} />

      </motion.div>

      <div className="relative max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}>

          <h2 className="font-display text-3xl sm:text-4xl md:text-6xl lg:text-7xl text-white font-extrabold mb-6 leading-tight">
            Curiosity is the beginning.
            <br />
            <span className="bg-gradient-to-r from-cobalt via-purple to-cyan bg-clip-text text-transparent">
              Understanding
            </span>{' '}
            is the goal.
          </h2>
          
          <p className="text-lg sm:text-xl md:text-2xl text-gray font-sans font-medium mb-10">
            Start building the way you learn.
          </p>

          <button
            onClick={onOpenWaitlist}
            className="btn-duo px-10 py-5 text-lg">

            Join the waitlist
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Logo mark */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16">

          <GrokitLogo size={64} className="mx-auto opacity-10" />
        </motion.div>
      </div>
    </section>
    );
}