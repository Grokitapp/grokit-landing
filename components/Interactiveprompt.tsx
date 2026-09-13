import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

const examplePrompts = [
  'Build a startup from zero',
  'Understand machine learning',
  'Learn quantitative finance',
  'Understand the universe',
  'Become better at public speaking',
];

interface InteractivePromptProps {
  onOpenWaitlist: () => void;
}

export function InteractivePrompt({
  onOpenWaitlist,
}: InteractivePromptProps) {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleExampleClick = (example: string) => {
    setInputValue('');
    setIsTyping(true);
    inputRef.current?.focus();

    let i = 0;

    const typeInterval = setInterval(() => {
      if (i <= example.length) {
        setInputValue(example.slice(0, i));
        i++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
      }
    }, 40);
  };

  const handleSubmit = () => {
    onOpenWaitlist();
  };

  return (
    <section
      id="explore"
      className="
        relative
        bg-surface
        py-14
        sm:py-16
        md:py-24
        overflow-hidden
      "
    >
      {/* Soft background glow */}
      <div
        className="
          absolute
          top-1/2
          left-1/2
          -translate-x-1/2
          -translate-y-1/2
          w-[650px]
          h-[650px]
          sm:w-[700px]
          sm:h-[700px]
          rounded-full
          pointer-events-none
        "
        style={{
          background:
            'radial-gradient(circle, rgba(244,97,31,0.07) 0%, transparent 60%)',
        }}
      />

      <div
        className="
          relative
          w-full
          max-w-[900px]
          mx-auto
          px-5
          sm:px-8
          md:px-10
          text-center
        "
      >
        {/* ------------------------------------------------
            Heading
           ------------------------------------------------ */}
        <motion.h2
          className="
            font-display
            text-[28px]
            sm:text-[32px]
            md:text-[34px]
            text-ink
            font-extrabold
            leading-[1.12]
            tracking-tight
            mb-8
            sm:mb-9
            md:mb-10
          "
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
        >
          What do you want to{' '}
          <span className="text-orange">
            understand?
          </span>
        </motion.h2>

        {/* ------------------------------------------------
            Prompt + CTA
           
            Desktop:
            input and CTA share one row.

            Mobile:
            input and CTA become two separate controls.
           ------------------------------------------------ */}
        <motion.div
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
            delay: 0.1,
          }}
          className="w-full"
        >
          <div
            className="
              flex
              flex-col
              sm:flex-row
              gap-2.5
              sm:gap-0
              w-full
            "
          >
            {/* Input */}
            <div
              className="
                relative
                w-full
                sm:flex-1
              "
            >
              <Sparkles
                className="
                  absolute
                  left-5
                  sm:left-6
                  top-1/2
                  -translate-y-1/2
                  w-[21px]
                  h-[21px]
                  sm:w-[22px]
                  sm:h-[22px]
                  text-orange
                  pointer-events-none
                  z-[1]
                "
              />

              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) =>
                  setInputValue(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit();
                  }
                }}
                placeholder="Ask anything…"
                disabled={isTyping}
                className="
                  w-full
                  h-[60px]
                  sm:h-[68px]
                  md:h-[72px]

                  rounded-full

                  bg-surface-alt
                  border
                  border-line

                  pl-[54px]
                  sm:pl-[58px]

                  pr-5
                  sm:pr-6

                  text-ink
                  font-sans
                  font-medium

                  text-base
                  sm:text-lg

                  placeholder:text-muted

                  outline-none

                  focus:border-orange/40

                  transition-colors

                  disabled:opacity-70
                "
              />
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={handleSubmit}
              className="
                btn-duo

                w-full
                sm:w-auto

                h-[60px]
                sm:h-[68px]
                md:h-[72px]

                sm:-ml-[170px]

                px-6
                sm:px-6
                md:px-7

                justify-center

                text-base
                sm:text-base
                md:text-lg

                whitespace-nowrap

                z-[2]
              "
            >
              Create your path

              <ArrowRight
                className="
                  w-[19px]
                  h-[19px]
                  sm:w-5
                  sm:h-5
                "
              />
            </button>
          </div>
        </motion.div>

        {/* ------------------------------------------------
            Example prompts
           ------------------------------------------------ */}
        <motion.div
          initial={{
            opacity: 0,
          }}
          whileInView={{
            opacity: 1,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            delay: 0.25,
          }}
          className="
            mt-6
            sm:mt-7
            md:mt-8

            flex
            flex-col
            sm:flex-row
            sm:flex-wrap

            items-center
            justify-center

            gap-2.5
            sm:gap-3
          "
        >
          {examplePrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() =>
                handleExampleClick(prompt)
              }
              disabled={isTyping}
              className="
                w-fit
                max-w-full

                px-4
                sm:px-4.5

                py-2.5
                sm:py-2

                text-[14px]
                sm:text-sm

                leading-tight

                font-sans
                font-bold
                text-body

                bg-peach

                rounded-full

                hover:text-orange

                transition-colors
                duration-300

                disabled:opacity-50
              "
            >
              {prompt}
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}