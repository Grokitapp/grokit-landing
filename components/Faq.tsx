import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
{
  question: 'How is Grokit different from just asking ChatGPT, or any other LLM?',
  answer: 'While modern AI models have persistent memory, they still operate on a prompt-by-prompt basis. Grokit builds a structured, step-by-step path: it breaks topics into ordered modules, tracks your mastery over time, and grounds each step in verified sources rather than generating floating conversational answers. You get a complete course, not just a customized chat.'
},
{
  question: 'What can I actually learn with Grokit?',
  answer: 'Almost anything you want to master, from technical fields like machine learning or quantitative finance to broader topics like history, public speaking, or launching a startup. Simply specify your goal, and Grokit maps out a structured path tailored to your starting level and objectives.'
},
{
  question: 'Is Grokit free?',
  answer: 'We haven\'t finalized pricing yet. Everyone who joins the waitlist gets early access and will be the first to know about pricing plans before anything takes effect, so there won\'t be any surprises.'
},
{
  question: 'Do I need any background knowledge to start?',
  answer: 'No. Just tell Grokit where you\'re starting from, even if you\'re a complete beginner — and your learning path automatically adjusts to your level. It adapts to where you are today rather than assuming prior expertise.'
},
{
  question: 'When do I get access?',
  answer: 'We\'re rolling out access in batches, starting with early waitlist members. Joining now locks in your spot in line, and we\'ll send you an email the moment your access is ready.'
}];


export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
    id="faq"
    className="relative py-12 md:py-20 bg-surface">

      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          className="mb-10 md:mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}>

          <span className="text-sm font-mono text-cobalt uppercase tracking-wider font-bold">FAQ</span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-ink font-extrabold mt-3">
            Questions, answered.
          </h2>
        </motion.div>

        <div className="flex flex-col gap-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                className="rounded-2xl bg-surface-alt border border-line overflow-hidden">

                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5 text-left">

                  <span className="font-display font-bold text-ink text-base sm:text-lg">
                    {faq.question}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0 text-muted">

                    <ChevronDown className="w-5 h-5" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen &&
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}>

                      <p className="px-5 pb-4 sm:px-6 sm:pb-5 text-body font-sans font-medium leading-relaxed">
                        {faq.answer}
                      </p>
                    </motion.div>
                  }
                </AnimatePresence>
              </motion.div>);

          })}
        </div>
      </div>
    </section>
    );
}