import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { GrokitMascot } from './Grokitmascot';

interface FinalCTAProps {
  onOpenWaitlist: () => void;
}

export function FinalCTA({ onOpenWaitlist }: FinalCTAProps) {
  return (
    <section
      className="py-20 md:py-28 text-center"
      style={{ background: 'linear-gradient(135deg, #F4611F 0%, #E0501A 100%)' }}
    >
      <div className="max-w-[1140px] mx-auto px-5 md:px-16 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <GrokitMascot size={90} />
        </motion.div>

        <motion.h2
          className="font-display text-[26px] sm:text-3xl md:text-[34px] text-white font-extrabold leading-tight mt-6 mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Curiosity is the beginning.
          <br />
          Understanding is the goal.
        </motion.h2>

        <motion.button
          onClick={onOpenWaitlist}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="btn-duo-white px-10 py-4 text-lg"
        >
          Join the waitlist
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </section>
  );
}