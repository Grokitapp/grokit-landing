import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { GrokitLogo } from './Grokitlogo';

interface FinalCTAProps {
  onOpenWaitlist: () => void;
}

export function FinalCTA({ onOpenWaitlist }: FinalCTAProps) {
  return (
    <section className="relative py-12 md:py-20 bg-surface">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden rounded-[2.5rem] px-8 py-14 sm:px-12 sm:py-20 text-center"
          style={{ background: 'linear-gradient(135deg, var(--color-cobalt), var(--color-purple))' }}>

          {/* Watermark logo */}
          <GrokitLogo size={220} className="absolute -bottom-10 -right-10 opacity-10 pointer-events-none" />

          <div className="relative">
            <h2 className="font-display text-3xl sm:text-4xl md:text-6xl lg:text-7xl text-white font-extrabold mb-6 leading-tight">
              Curiosity is the beginning.
              <br />
              Understanding is the goal.
            </h2>

            <p className="text-lg sm:text-xl md:text-2xl text-white/85 font-sans font-medium mb-10">
              Start building the way you learn.
            </p>

            <button
              onClick={onOpenWaitlist}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-cobalt font-display font-bold px-10 py-5 text-lg shadow-lg hover:brightness-95 transition">

              Join the waitlist
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
    );
}