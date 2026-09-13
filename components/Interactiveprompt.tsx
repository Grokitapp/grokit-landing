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

const glowStyle = {
  background:
    'radial-gradient(circle, rgba(244,97,31,0.07) 0%, transparent 60%)',
};

const viewport = { once: true };

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport,
  transition: { delay, duration: 0.5 },
});

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport,
  transition: { delay, duration: 0.5 },
});

interface InteractivePromptProps {
  onOpenWaitlist: () => void;
}

export function InteractivePrompt({ onOpenWaitlist }: InteractivePromptProps) {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      onOpenWaitlist();
    }
  };

  return (
    <section id="explore" className="relative bg-surface py-14 sm:py-16 md:py-20 overflow-hidden">
      {/* Soft background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] sm:w-[750px] sm:h-[750px] rounded-full pointer-events-none"
        style={glowStyle}
      />

      <div className="relative w-full max-w-[960px] mx-auto px-5 sm:px-8 md:px-10 text-center">
        {/* Heading */}
        <motion.h2
          className="font-display text-[28px] sm:text-[32px] md:text-[34px] text-ink font-extrabold leading-[1.12] tracking-tight mb-8 sm:mb-9 md:mb-10"
          {...fadeUp()}
        >
          What do you want to{' '}
          <span className="text-orange">understand?</span>
        </motion.h2>

        {/* Learning prompt */}
        <motion.div {...fadeUp(0.1)}>
          <div
            className="
              relative w-full h-[175px] sm:h-[185px] md:h-[190px]
              rounded-[24px] sm:rounded-[26px] md:rounded-[28px]
              bg-surface-alt border border-line
              transition-all duration-200
              focus-within:border-orange/40
              focus-within:shadow-[0_0_0_4px_rgba(244,97,31,0.05)]
            "
          >
            {/* Sparkle */}
            <Sparkles className="absolute left-5 top-5 sm:left-6 sm:top-6 w-[22px] h-[22px] sm:w-6 sm:h-6 text-orange pointer-events-none" />

            {/* Textarea — generous internal padding keeps text clear of the CTA */}
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              disabled={isTyping}
              rows={4}
              aria-label="What do you want to understand?"
              className="
                w-full h-full resize-none bg-transparent
                border-none outline-none
                rounded-[24px] sm:rounded-[26px] md:rounded-[28px]
                pt-[18px] sm:pt-5 pl-[58px] sm:pl-[66px] pr-5 sm:pr-6 pb-[76px] sm:pb-[80px]
                text-ink font-sans font-medium
                text-base sm:text-lg leading-relaxed
                placeholder:text-muted disabled:opacity-70
              "
            />

            {/* CTA — bottom right inside the prompt box */}
            <button
              type="button"
              onClick={onOpenWaitlist}
              disabled={isTyping}
              className="
                btn-duo absolute right-3 bottom-3 sm:right-4 sm:bottom-4
                h-[48px] sm:h-[52px] md:h-[56px]
                px-5 sm:px-6 md:px-7
                text-sm sm:text-base md:text-lg
                whitespace-nowrap justify-center
                disabled:opacity-40 disabled:pointer-events-none
              "
            >
              Create your path
              <ArrowRight className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Keyboard hint — desktop only */}
          <p className="hidden md:block text-[11px] text-muted font-sans text-right mt-2 mr-2">
            Press ⌘ Enter to continue
          </p>
        </motion.div>

        {/* Example prompts */}
        <motion.div
          {...fadeIn(0.25)}
          className="mt-6 sm:mt-7 md:mt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 px-1"
        >
          {examplePrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleExampleClick(prompt)}
              disabled={isTyping}
              className="
                px-4 sm:px-[18px] py-2.5
                text-[13px] sm:text-sm leading-tight
                font-sans font-bold text-body
                bg-peach rounded-full
                hover:text-orange
                transition-colors duration-300
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