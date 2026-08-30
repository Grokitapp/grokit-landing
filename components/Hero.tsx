import { motion } from 'framer-motion';
import { KnowledgeScene } from './Knowledgescene';
import { ArrowRight, Sparkles } from 'lucide-react';

interface HeroProps {
  onOpenWaitlist: () => void;
}

export function Hero({ onOpenWaitlist }: HeroProps) {
  return (
    <section
      className="relative min-h-[100dvh] sm:min-h-[min(90vh,800px)] flex flex-col items-center justify-center pt-24 pb-12 bg-black">

      {/* 3D Scene (self-contained overflow clipping, safe to keep here) */}
      <KnowledgeScene scrollProgress={1} />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 mb-6 sm:mb-8 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">

            <motion.span
              animate={{ rotate: [0, -15, 15, -8, 0], scale: [1, 1.15, 1.15, 1.05, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}>

              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cobalt" />
            </motion.span>
            <span className="text-xs sm:text-sm text-white/80 font-sans font-semibold">AI-powered learning platform</span>
          </motion.div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-white font-extrabold leading-[1.1] sm:leading-[1.05] mb-4 sm:mb-6 tracking-tight">
            Learn{' '}
            <span className="bg-gradient-to-r from-cobalt via-purple to-cyan bg-clip-text text-transparent">
              anything.
            </span>
            <br />
            <span className="text-white/90">Understand it for real.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-sm sm:text-lg md:text-xl text-gray-light font-sans font-medium leading-relaxed mb-8 sm:mb-10 px-2 sm:px-0">
            A personalized learning path, built just for you. Grounded in real knowledge.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            {/* Primary CTA */}
            <motion.button
              onClick={onOpenWaitlist}
              className="btn-duo px-6 py-3 text-sm sm:px-8 sm:py-4 sm:text-lg"
              whileTap={{ scale: 0.98 }}>

              Start learning
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>

            {/* Secondary CTA */}
            <motion.button
              onClick={onOpenWaitlist}
              className="btn-duo-outline px-6 py-3 text-sm sm:px-8 sm:py-4 sm:text-lg"
              whileTap={{ scale: 0.98 }}>

              Join the waitlist
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
    );
}