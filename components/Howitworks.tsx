import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';

const steps = [
{
  number: '01',
  title: 'Tell Grokit what you want to learn',
  example: 'I want to understand quantitative trading from the ground up.'
},
{
  number: '02',
  title: 'Grokit builds your path',
  topics: ['Market Basics', 'Statistics', 'Probability', 'Market Microstructure', 'Strategy Research']
},
{
  number: '03',
  title: 'Learn. Connect. Understand.',
  description: 'Sources → Context → Understanding'
}];


export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start']
  });

  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (v) => {
      if (v < 0.35) setActiveStep(0);else
      if (v < 0.55) setActiveStep(1);else
      setActiveStep(2);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);

  return (
    <section data-ev-id="ev_3591000bfe"
    ref={containerRef}
    id="how-it-works"
    className="relative py-32 md:py-48 bg-black min-h-[150vh]">

      <motion.div className="sticky top-0 pt-24 pb-12" style={{ opacity }}>
        <div data-ev-id="ev_e1efa3ba9c" className="max-w-6xl mx-auto px-6">
          {/* Section header */}
          <motion.div
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}>

            <span data-ev-id="ev_06722a1bf6" className="text-sm font-mono text-cobalt uppercase tracking-wider">How it works</span>
          </motion.div>

          {/* Steps indicator */}
          <div data-ev-id="ev_86e67b8a8d" className="flex gap-8 mb-12">
            {steps.map((step, idx) =>
            <button data-ev-id="ev_7d1817b760"
            key={step.number}
            onClick={() => setActiveStep(idx)}
            className={`relative font-mono text-sm transition-colors duration-300 ${
            idx === activeStep ? 'text-white' : 'text-gray'}`
            }>

                {step.number}
                {idx === activeStep &&
              <motion.div
                layoutId="stepIndicator"
                className="absolute -bottom-2 left-0 right-0 h-0.5 bg-linear-to-r from-cobalt to-purple" />

              }
              </button>
            )}
          </div>

          {/* Content area */}
          <div data-ev-id="ev_97ecba7a91" className="relative min-h-100">
            <AnimatePresence mode="wait">
              {activeStep === 0 &&
              <motion.div
                key="step-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col gap-8">

                  <h3 data-ev-id="ev_a21db58134" className="font-display text-3xl md:text-5xl text-white font-bold">
                    {steps[0].title}
                  </h3>
                  
                  {/* AI Input mockup */}
                  <div data-ev-id="ev_3cb1bc80f6" className="max-w-2xl bg-dark-elevated border border-dark-border rounded-2xl p-6">
                    <div data-ev-id="ev_65303c180b" className="flex items-start gap-3">
                      <div data-ev-id="ev_7d850a1077" className="w-8 h-8 rounded-full bg-linear-to-br from-cobalt to-purple flex items-center justify-center">
                        <span data-ev-id="ev_43c5259b81" className="text-xs">✨</span>
                      </div>
                      <div data-ev-id="ev_5359c70373" className="flex-1">
                        <p data-ev-id="ev_549da57025" className="text-gray-light text-lg">
                          {steps[0].example}
                          <span data-ev-id="ev_61846fb1a5" className={`inline-block w-0.5 h-5 bg-cobalt ml-1 align-middle transition-opacity ${cursorVisible ? 'opacity-100' : 'opacity-0'}`} />
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              }

              {activeStep === 1 &&
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col gap-8">

                  <h3 data-ev-id="ev_0e07186447" className="font-display text-3xl md:text-5xl text-white font-bold">
                    {steps[1].title}
                  </h3>
                  
                  {/* Learning path visualization */}
                  <div data-ev-id="ev_8c03f4559c" className="flex flex-col gap-4">
                    {(steps[1].topics ?? []).map((topic, idx) =>
                  <motion.div
                    key={topic}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.15 }}
                    className="flex items-center gap-4">

                        <div data-ev-id="ev_31f6b48e3b" className="flex flex-col items-center">
                          <div data-ev-id="ev_9327811055" className={`w-3 h-3 rounded-full ${
                      idx === 0 ? 'bg-cobalt shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-gray'}`
                      } />
                          {idx < (steps[1].topics?.length ?? 0) - 1 &&
                      <div data-ev-id="ev_3bdd1b6381" className="w-0.5 h-8 bg-dark-border" />
                      }
                        </div>
                        <span data-ev-id="ev_5589ab362a" className={`font-medium ${
                    idx === 0 ? 'text-white text-lg' : 'text-gray'}`
                    }>
                          {topic}
                        </span>
                      </motion.div>
                  )}
                  </div>
                </motion.div>
              }

              {activeStep === 2 &&
              <motion.div
                key="step-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col gap-8">

                  <h3 data-ev-id="ev_6dde31f406" className="font-display text-3xl md:text-5xl text-white font-bold">
                    {steps[2].title}
                  </h3>
                  
                  {/* Sources to understanding flow */}
                  <div data-ev-id="ev_5e6331c838" className="flex flex-wrap items-center gap-6">
                    {['Sources', 'Context', 'Understanding'].map((item, idx) =>
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.2 }}
                    className="flex items-center gap-4">

                        <div data-ev-id="ev_77ef58f983" className={`px-6 py-3 rounded-xl border ${
                    idx === 2 ?
                    'bg-linear-to-r from-cobalt to-purple text-white border-transparent' :
                    'bg-dark-elevated border-dark-border text-white'}`
                    }>
                          {item}
                        </div>
                        {idx < 2 &&
                    <span data-ev-id="ev_f19e85a351" className="text-gray">→</span>
                    }
                      </motion.div>
                  )}
                  </div>
                  
                  <p data-ev-id="ev_a7dc2ba3c5" className="text-gray max-w-xl">
                    Learning built on real knowledge and sources — so understanding has something solid beneath it.
                  </p>
                </motion.div>
              }
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </section>);

}