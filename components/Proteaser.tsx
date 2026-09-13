import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface ProTeaserProps {
  onOpenWaitlist: () => void;
}

export function ProTeaser({ onOpenWaitlist }: ProTeaserProps) {
  return (
    <section className="bg-ink-deep py-20 md:py-28">
      <div className="max-w-[1140px] mx-auto px-5 md:px-16 text-center">
        <motion.span
          className="eyebrow block mb-5 !text-orange"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Coming with Grokit Pro
        </motion.span>

        <motion.h2
          className="font-display text-[26px] sm:text-3xl md:text-[34px] text-white font-extrabold leading-tight mb-5"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          Unlock deeper learning
        </motion.h2>

        <motion.p
          className="text-base md:text-lg text-white/60 font-sans font-medium max-w-xl mx-auto mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          Unlimited courses, AI tutoring, verified certificates.
        </motion.p>

        <motion.button
          onClick={onOpenWaitlist}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="inline-flex items-center gap-2 rounded-full border-2 border-white text-white font-display font-bold px-8 py-3.5 text-base sm:text-lg hover:bg-white/10 transition-colors duration-300"
        >
          Get notified
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </section>
  );
}