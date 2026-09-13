import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

function StepInputMockup({ cursorVisible }: { cursorVisible: boolean }) {
  return (
    <div className="bg-surface-alt border border-line rounded-3xl p-6 md:p-7 w-full max-w-md">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-orange flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>

        <p className="text-body font-sans font-medium text-base md:text-lg leading-relaxed">
          I want to understand quantitative trading from the ground up.
          <span
            className={`inline-block w-0.5 h-5 bg-orange ml-1 align-middle transition-opacity ${
              cursorVisible ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </p>
      </div>
    </div>
  );
}

function StepPathMockup() {
  const topics = [
    'Market Basics',
    'Statistics',
    'Probability',
    'Market Microstructure',
    'Strategy Research',
  ];

  return (
    <div className="bg-surface-alt border border-line rounded-3xl p-6 md:p-7 w-full max-w-md">
      {topics.map((topic, idx) => (
        <motion.div
          key={topic}
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{
            delay: idx * 0.1,
            duration: 0.4,
          }}
        >
          <div className="flex flex-col items-center">
            <div
              className={`w-3 h-3 rounded-full ${
                idx === 0 ? 'bg-orange' : 'bg-muted/50'
              }`}
            />

            {idx < topics.length - 1 && (
              <div className="w-0.5 h-7 bg-line" />
            )}
          </div>

          <span
            className={`font-sans font-bold text-sm md:text-base ${
              idx === 0 ? 'text-ink' : 'text-muted'
            }`}
          >
            {topic}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function StepLessonMockup() {
  return (
    <div className="bg-surface-alt border border-line rounded-3xl p-6 md:p-7 w-full max-w-md">
      <span className="eyebrow block mb-2">
        Lesson 3 of 12
      </span>

      <p className="font-display font-extrabold text-ink text-lg md:text-xl mb-5">
        Order types and market microstructure
      </p>

      <div className="h-3 rounded-full bg-line overflow-hidden mb-2">
        <motion.div
          className="h-full rounded-full bg-orange"
          initial={{ width: 0 }}
          whileInView={{ width: '65%' }}
          viewport={{ once: true }}
          transition={{
            duration: 0.9,
            ease: 'easeOut',
          }}
        />
      </div>

      <p className="text-xs font-sans font-bold text-muted mb-5">
        65% complete
      </p>

      <span className="inline-flex items-center gap-2 rounded-full bg-orange text-white font-display font-bold text-sm px-5 py-2.5">
        Continue
        <ArrowRight className="w-4 h-4" />
      </span>
    </div>
  );
}

const steps = [
  {
    title: 'Say what you want to learn',
    mockup: 'input' as const,
  },
  {
    title: 'Grokit builds your path',
    mockup: 'path' as const,
  },
  {
    title: 'Learn a little, every day',
    mockup: 'lesson' as const,
  },
];

export function HowItWorks() {
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(
      () => setCursorVisible((v) => !v),
      530
    );

    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="how-it-works"
      className="bg-surface py-12 sm:py-14 md:py-16 overflow-hidden"
    >
      <div className="max-w-[1140px] mx-auto px-5 md:px-16">

        {/* Section label */}
        <motion.span
          className="eyebrow block mb-10 md:mb-12"
          initial={{
            opacity: 0,
            y: 12,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
        >
          How it works
        </motion.span>

        {/* Steps */}
        <div className="flex flex-col gap-12 md:gap-16">
          {steps.map((step, idx) => {
            const reversed = idx % 2 === 1;

            return (
              <div
                key={step.title}
                className={`
                  flex
                  flex-col
                  ${
                    reversed
                      ? 'md:flex-row-reverse'
                      : 'md:flex-row'
                  }
                  items-center
                  gap-7
                  md:gap-12
                  lg:gap-16
                `}
              >
                {/* Step title */}
                <motion.div
                  className="flex-1 w-full text-center md:text-left"
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                  }}
                  transition={{
                    duration: 0.5,
                  }}
                >
                  <span className="font-mono text-sm font-bold text-muted block mb-3">
                    0{idx + 1}
                  </span>

                  <h3
                    className="
                      font-display
                      text-[22px]
                      md:text-[28px]
                      text-ink
                      font-extrabold
                      leading-snug
                      max-w-sm
                      mx-auto
                      md:mx-0
                    "
                  >
                    {step.title}
                  </h3>
                </motion.div>

                {/* Step mockup */}
                <motion.div
                  className="flex-1 flex justify-center w-full"
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                  }}
                  transition={{
                    duration: 0.5,
                    delay: 0.08,
                  }}
                >
                  {step.mockup === 'input' && (
                    <StepInputMockup
                      cursorVisible={cursorVisible}
                    />
                  )}

                  {step.mockup === 'path' && (
                    <StepPathMockup />
                  )}

                  {step.mockup === 'lesson' && (
                    <StepLessonMockup />
                  )}
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}