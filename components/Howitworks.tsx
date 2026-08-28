import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Step {
  number: string;
  title: string;
  example?: string;
  topics?: string[];
  description?: string;
}

const steps: Step[] = [
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
  const [activeStep, setActiveStep] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
    id="how-it-works"
    className="relative py-16 md:py-24 bg-black">

      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}>

          <span className="text-sm font-mono text-cobalt uppercase tracking-wider font-bold">How it works</span>
        </motion.div>

        {/* Steps indicator */}
        <div className="flex gap-8 mb-12">
          {steps.map((step, idx) =>
          <button
          key={step.number}
          onClick={() => setActiveStep(idx)}
          className={`relative font-mono text-sm font-bold transition-colors duration-300 ${
          idx === activeStep ? 'text-white' : 'text-gray'}`
          }>

              {step.number}
              {idx === activeStep &&
            <motion.div
              layoutId="stepIndicator"
              className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-cobalt to-purple" />

            }
            </button>
          )}
        </div>

        {/* Content area */}
        <div className="relative min-h-[320px]">
          <AnimatePresence mode="wait">
            {activeStep === 0 &&
            <motion.div
              key="step-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-8">

                <h3 className="font-display text-2xl sm:text-3xl md:text-5xl text-white font-extrabold">
                  {steps[0].title}
                </h3>
                
                {/* AI Input mockup */}
                <div className="max-w-2xl bg-dark-elevated border border-dark-border rounded-3xl p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cobalt to-purple flex items-center justify-center">
                      <span className="text-xs">✨</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-light font-sans font-medium text-lg">
                        {steps[0].example}
                        <span className={`inline-block w-0.5 h-5 bg-cobalt ml-1 align-middle transition-opacity ${cursorVisible ? 'opacity-100' : 'opacity-0'}`} />
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

                <h3 className="font-display text-2xl sm:text-3xl md:text-5xl text-white font-extrabold">
                  {steps[1].title}
                </h3>
                
                {/* Learning path visualization */}
                <div className="flex flex-col gap-4">
                  {(steps[1].topics ?? []).map((topic, idx) =>
                <motion.div
                  key={topic}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.15 }}
                  className="flex items-center gap-4">

                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${
                    idx === 0 ? 'bg-cobalt shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-gray'}`
                    } />
                        {idx < (steps[1].topics?.length ?? 0) - 1 &&
                    <div className="w-0.5 h-8 bg-dark-border" />
                    }
                      </div>
                      <span className={`font-sans font-bold ${
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

                <h3 className="font-display text-2xl sm:text-3xl md:text-5xl text-white font-extrabold">
                  {steps[2].title}
                </h3>
                
                {/* Sources to understanding flow */}
                <div className="flex flex-wrap items-center gap-6">
                  {['Sources', 'Context', 'Understanding'].map((item, idx) =>
                <motion.div
                  key={item}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.2 }}
                  className="flex items-center gap-4">

                      <div className={`px-6 py-3 rounded-2xl border font-sans font-bold ${
                  idx === 2 ?
                  'bg-gradient-to-r from-cobalt to-purple text-white border-transparent' :
                  'bg-dark-elevated border-dark-border text-white'}`
                  }>
                        {item}
                      </div>
                      {idx < 2 &&
                  <span className="text-gray">→</span>
                  }
                    </motion.div>
                )}
                </div>
                
                <p className="text-gray font-sans font-medium max-w-xl">
                  Learning built on real knowledge and sources, so understanding has something solid beneath it.
                </p>
              </motion.div>
            }
          </AnimatePresence>
        </div>
      </div>
    </section>);

}