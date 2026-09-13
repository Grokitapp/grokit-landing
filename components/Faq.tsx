import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'How is Grokit different from ChatGPT?',
    answer: 'Grokit builds a structured, trackable learning path around what you want to understand — not just a conversation.',
  },
  {
    question: 'What can I learn with Grokit?',
    answer: 'You can explore almost any subject, from machine learning and startups to finance, science, design, and public speaking.',
  },
  {
    question: 'How does Grokit build my learning path?',
    answer: 'Tell Grokit what you want to understand, and it turns your goal into a structured sequence of concepts and lessons.',
  },
  {
    question: 'Does Grokit adapt to my level?',
    answer: 'Yes. Tell Grokit what you already know, and it adjusts the depth and starting point of your learning path.',
  },
  {
    question: 'Is the content based on real sources?',
    answer: 'Yes. Courses in Grokit’s core domains are built from verified public sources rather than relying only on plausible-sounding AI-generated text.',
  },
  {
    question: 'Do I need background knowledge?',
    answer: 'No. Grokit can start from the fundamentals and build your understanding step by step.',
  },
  {
    question: 'Is Grokit free?',
    answer: 'Yes — core learning stays free, with additional capabilities planned for Grokit Pro.',
  },
  {
    question: 'When do I get access?',
    answer: "We're opening spots gradually, and people on the waitlist will get access as new spots become available.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <section
      id="faq"
      className="bg-surface py-16 md:py-[120px]"
    >
      <div className="max-w-[820px] mx-auto px-5 md:px-8">

        {/* Header */}
        <motion.div
          className="mb-12 md:mb-14 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="eyebrow block mb-4">
            FAQ
          </span>

          <h2
            className="
              font-display
              text-[32px]
              sm:text-4xl
              md:text-[48px]
              text-ink
              font-extrabold
              leading-[1.1]
              tracking-[-0.02em]
            "
          >
            Questions, answered.
          </h2>
        </motion.div>

        {/* FAQ List */}
        <div className="flex flex-col gap-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.04,
                }}
                className={`
                  rounded-2xl
                  bg-surface-alt
                  border
                  overflow-hidden
                  transition-all
                  duration-200
                  ${
                    isOpen
                      ? 'border-orange/20'
                      : 'border-line hover:border-orange/20'
                  }
                `}
              >
                {/* Question */}
                <button
                  type="button"
                  onClick={() => toggleFAQ(index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  className="
                    w-full
                    flex
                    items-center
                    justify-between
                    gap-5
                    px-6
                    py-5
                    md:px-7
                    md:py-6
                    text-left
                    cursor-pointer
                    group
                  "
                >
                  <span
                    className="
                      font-display
                      font-bold
                      text-ink
                      text-[17px]
                      md:text-xl
                      leading-snug
                      transition-colors
                      duration-200
                      group-hover:text-orange
                    "
                  >
                    {faq.question}
                  </span>

                  <motion.span
                    animate={{
                      rotate: isOpen ? 180 : 0,
                    }}
                    transition={{
                      duration: 0.2,
                      ease: 'easeOut',
                    }}
                    className="
                      shrink-0
                      text-muted
                      group-hover:text-orange
                      transition-colors
                      duration-200
                    "
                  >
                    <ChevronDown
                      className="w-5 h-5 md:w-6 md:h-6"
                      strokeWidth={2.2}
                    />
                  </motion.span>
                </button>

                {/* Answer */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-answer-${index}`}
                      initial={{
                        height: 0,
                        opacity: 0,
                      }}
                      animate={{
                        height: 'auto',
                        opacity: 1,
                      }}
                      exit={{
                        height: 0,
                        opacity: 0,
                      }}
                      transition={{
                        height: {
                          duration: 0.25,
                          ease: 'easeInOut',
                        },
                        opacity: {
                          duration: 0.2,
                        },
                      }}
                    >
                      <div className="px-6 pb-6 md:px-7 md:pb-7">
                        <p
                          className="
                            max-w-[700px]
                            text-base
                            md:text-lg
                            text-body
                            font-sans
                            font-medium
                            leading-[1.6]
                          "
                        >
                          {faq.answer}
                        </p>
                      </div>
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