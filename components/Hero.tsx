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
    <section data-ev-id="ev_f19911d583"
    ref={containerRef}
    className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black">

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
            <span data-ev-id="ev_f43c732ecd" className="text-sm text-white/80">AI-powered learning platform</span>
          </motion.div>

          <h1 data-ev-id="ev_315e7a5cc3" className="font-display text-5xl md:text-7xl lg:text-8xl text-white font-bold leading-[1.05] mb-6 tracking-tight">
            Learn{' '}
            <span data-ev-id="ev_4292a500cd" className="bg-linear-to-r from-cobalt via-purple to-cyan bg-clip-text text-transparent">
              anything.
            </span>
            <br data-ev-id="ev_743d46c2e5" />
            <span data-ev-id="ev_c5ed33a63a" className="text-white/90">Understand it for real.</span>
          </h1>
          
          <p data-ev-id="ev_38b7338851" className="max-w-2xl mx-auto text-lg md:text-xl text-gray-light font-sans leading-relaxed mb-12">
            Grokit turns what you want to learn into a personalized learning journey — 
            generated for you and grounded in real knowledge.
          </p>

          <div data-ev-id="ev_86457b5687" className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Primary CTA */}
            <motion.button
              onClick={onOpenWaitlist}
              className="group relative px-8 py-4 rounded-full font-semibold text-lg overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)'
              }}
              whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(59, 130, 246, 0.4)' }}
              whileTap={{ scale: 0.98 }}>

              {/* Shine effect */}
              <motion.div
                className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent -translate-x-full"
                animate={{ x: ['100%', '-100%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }} />

              <span data-ev-id="ev_b63f9aaf26" className="relative flex items-center gap-2 text-white">
                Start learning
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </span>
            </motion.button>

            {/* Secondary CTA */}
            <motion.button
              onClick={onOpenWaitlist}
              className="px-8 py-4 text-white border border-white/20 rounded-full font-semibold text-lg hover:bg-white/5 transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}>

              Join the waitlist
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        style={{ opacity }}>

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2">

          <motion.div className="w-1.5 h-1.5 bg-white/50 rounded-full" />
        </motion.div>
      </motion.div>
    </section>);

}