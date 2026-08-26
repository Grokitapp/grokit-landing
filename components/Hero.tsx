import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { KnowledgeScene } from './Knowledgescene';
import { ArrowRight, Sparkles } from 'lucide-react';

interface HeroProps {
  onOpenWaitlist: () => void;
}

export function Hero({ onOpenWaitlist }: HeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start']
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 100]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (v) => {
      setScrollProgress(v);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden bg-black">

      {/* 3D Scene */}
      <KnowledgeScene scrollProgress={scrollProgress} />

      {/* Content */}
      <motion.div
        className="relative z-10 max-w-5xl mx-auto px-6 text-center"
        style={{ opacity, y, scale }}>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">

            <Sparkles className="w-4 h-4 text-cobalt" />
            <span className="text-sm text-white/80 font-sans font-semibold">AI-powered learning platform</span>
          </motion.div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-white font-extrabold leading-[1.05] mb-6 tracking-tight">
            Learn{' '}
            <span className="bg-linear-to-r from-cobalt via-purple to-cyan bg-clip-text text-transparent">
              anything.
            </span>
            <br />
            <span className="text-white/90">Understand it for real.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-light font-sans font-medium leading-relaxed mb-10">
            Grokit turns what you want to learn into a personalized learning journey — 
            generated for you and grounded in real knowledge.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Primary CTA */}
            <motion.button
              onClick={onOpenWaitlist}
              className="btn-duo px-8 py-4 text-lg"
              whileTap={{ scale: 0.98 }}>

              Start learning
              <ArrowRight className="w-5 h-5" />
            </motion.button>

            {/* Secondary CTA */}
            <motion.button
              onClick={onOpenWaitlist}
              className="btn-duo-outline px-8 py-4 text-lg"
              whileTap={{ scale: 0.98 }}>

              Join the waitlist
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </section>
    );
}