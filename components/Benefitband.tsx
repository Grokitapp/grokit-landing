import { motion } from 'framer-motion';
import { BookMarked, SlidersHorizontal, Sparkles } from 'lucide-react';

const items = [
  { word: 'Grounded', icon: BookMarked },
  { word: 'Personalized', icon: SlidersHorizontal },
  { word: 'Yours', icon: Sparkles },
];

export function BenefitBand() {
  return (
    <section className="bg-surface py-20 md:py-28">
      <div className="max-w-[1140px] mx-auto px-5 md:px-16 text-center">
        <motion.h2
          className="font-display text-[26px] sm:text-3xl md:text-[34px] leading-tight mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className="text-ink font-extrabold">Grounded. </span>
          <span className="text-orange font-extrabold">Personalized. </span>
          <span className="text-ink font-bold">Yours.</span>
        </motion.h2>

        <motion.p
          className="text-base md:text-lg text-body font-sans font-medium max-w-xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          Real knowledge, shaped around how you learn.
        </motion.p>

        <div className="flex justify-center gap-12 md:gap-20">
          {items.map(({ word, icon: Icon }, idx) => (
            <motion.div
              key={word}
              className="flex flex-col items-center gap-3"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 + idx * 0.1 }}
            >
              <div className="w-14 h-14 rounded-full bg-peach flex items-center justify-center">
                <Icon className="w-6 h-6 text-orange" />
              </div>
              <span className="text-sm font-sans font-bold text-muted">{word}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}