import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface ProTeaserProps {
  onOpenWaitlist: () => void;
}

export function ProTeaser({ onOpenWaitlist }: ProTeaserProps) {
  return (
    <section className="bg-ink-deep py-24 md:py-32">
      <div className="max-w-[1140px] mx-auto px-5 md:px-16 text-center">
        <motion.span
          className="eyebrow block mb-6 !text-orange"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Coming with Grokit Pro
        </motion.span>

        <motion.h2
          className="font-display text-[32px] sm:text-4xl md:text-[48px] text-white font-extrabold leading-[1.1] mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          Unlock deeper learning
        </motion.h2>

        <motion.p
          className="text-lg md:text-xl text-white/60 font-sans font-medium max-w-xl mx-auto mb-12"
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
          className="inline-flex items-center gap-2 rounded-full border-2 border-white text-white font-display font-bold px-10 py-4 text-lg hover:bg-white/10 transition-colors duration-300"
        >
          Get notified
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </section>
  );
}