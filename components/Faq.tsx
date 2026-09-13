import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'How is Grokit different from ChatGPT?',
    answer: 'Grokit builds a structured, trackable course, not a chat.',
  },
  {
    question: 'Is Grokit free?',
    answer: 'Yes. Core learning stays free, always.',
  },
  {
    question: 'Do I need background knowledge?',
    answer: 'No. Tell Grokit your level and it adjusts.',
  },
  {
    question: 'When do I get access?',
    answer: "We're opening spots weekly from the waitlist.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-surface py-16 md:py-[120px]">
      <div className="max-w-[720px] mx-auto px-5 md:px-8">
        <motion.div
          className="mb-14 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="eyebrow block mb-4">FAQ</span>
          <h2 className="font-display text-[32px] sm:text-4xl md:text-[48px] text-ink font-extrabold leading-[1.1]">
            Questions, answered.
          </h2>
        </motion.div>

        <div className="flex flex-col gap-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="rounded-2xl bg-surface-alt border border-line overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-display font-bold text-ink text-lg md:text-xl">
                    {faq.question}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0 text-muted"
                  >
                    <ChevronDown className="w-6 h-6" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <p className="px-6 pb-6 text-base md:text-lg text-body font-sans font-medium">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}