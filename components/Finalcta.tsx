import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { GrokitMascot } from './Grokitmascot';

interface FinalCTAProps {
  onOpenWaitlist: () => void;
}

export function FinalCTA({ onOpenWaitlist }: FinalCTAProps) {
  return (
    <section className="relative py-12 md:py-20 bg-surface">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden rounded-[2.5rem] px-8 py-14 sm:px-14 sm:py-16 text-center"
          style={{ background: 'linear-gradient(135deg, var(--color-cobalt), var(--color-purple))' }}>

          {/* Dot texture for polish, contained within the card */}
          <div
            className="absolute inset-0 opacity-[0.12] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(white 1.5px, transparent 1.5px)',
              backgroundSize: '22px 22px'
            }} />

          <div className="relative flex flex-col items-center">
            <div className="mb-6 scale-75 sm:scale-90">
              <GrokitMascot size={100} />
            </div>

            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-white font-extrabold mb-4 leading-tight">
              Curiosity is the beginning.
              <br />
              Understanding is the goal.
            </h2>

            <p className="text-lg text-white/85 font-sans font-medium mb-9">
              Start building the way you learn.
            </p>

            <button
              onClick={onOpenWaitlist}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-cobalt font-display font-bold px-8 py-4 text-base sm:text-lg shadow-lg hover:brightness-95 transition">

              Join the waitlist
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
    );
}