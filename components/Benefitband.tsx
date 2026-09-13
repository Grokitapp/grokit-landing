import { motion } from 'framer-motion';
import { BookMarked, SlidersHorizontal, Sparkles } from 'lucide-react';

const items = [
  { word: 'Grounded', icon: BookMarked },
  { word: 'Personalized', icon: SlidersHorizontal },
  { word: 'Yours', icon: Sparkles },
];

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

export function BenefitBand() {
  return (
    <section className="bg-surface py-24 md:py-32">
      <div className="max-w-[1140px] mx-auto px-5 md:px-16 text-center">
        <motion.h2
          className="font-display text-[32px] sm:text-4xl md:text-[48px] leading-[1.1] mb-6"
          {...fadeUp}
          transition={{ duration: 0.7 }}
        >
          <span className="text-ink font-extrabold">Grounded. </span>
          <span className="text-orange font-extrabold">Personalized. </span>
          <span className="text-ink font-bold">Yours.</span>
        </motion.h2>

        <motion.p
          className="text-lg md:text-xl text-body font-sans font-medium max-w-xl mx-auto mb-14"
          {...fadeUp}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          Real knowledge, shaped around how you learn.
        </motion.p>

        <div className="flex justify-center gap-14 md:gap-24">
          {items.map(({ word, icon: Icon }, idx) => (
            <motion.div
              key={word}
              className="flex flex-col items-center gap-4"
              {...fadeUp}
              initial={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.5, delay: 0.2 + idx * 0.1 }}
            >
              <div className="w-16 h-16 rounded-full bg-peach flex items-center justify-center">
                <Icon className="w-7 h-7 text-orange" />
              </div>
              <span className="text-base font-sans font-bold text-muted">{word}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}