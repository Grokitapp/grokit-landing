import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

const examplePrompts = [
  'Build a startup from zero',
  'Understand machine learning',
  'Learn quantitative finance',
  'Understand the universe',
  'Become better at public speaking'
];

interface InteractivePromptProps {
  onOpenWaitlist: () => void;
}

export function InteractivePrompt({ onOpenWaitlist }: InteractivePromptProps) {
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
      className="relative bg-surface py-16 md:py-[120px] overflow-hidden"
    >
      {/* Single soft glow — the only decoration */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(244,97,31,0.07) 0%, transparent 60%)',
        }}
      />

      <div className="relative max-w-[1000px] mx-auto px-5 md:px-10 text-center">
        <motion.h2
          className="font-display text-[26px] sm:text-3xl md:text-[34px] text-ink font-extrabold leading-tight mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          What do you want to{' '}
          <span className="text-orange">understand?</span>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <Sparkles
            className="absolute left-7 top-1/2 -translate-y-1/2 w-6 h-6 text-orange pointer-events-none"
          />

          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Ask anything…"
            disabled={isTyping}
            className="w-full h-20 sm:h-[84px] rounded-full bg-surface-alt border border-line pl-16 pr-40 sm:pr-52 text-ink font-sans font-medium text-lg sm:text-xl placeholder:text-muted outline-none focus:border-orange/40 transition-colors"
          />

          <button
            onClick={handleSubmit}
            className="btn-duo absolute right-2 top-1/2 -translate-y-1/2 px-5 sm:px-7 py-4 text-base sm:text-lg whitespace-nowrap"
          >
            Create your path
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 }}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          {examplePrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleExampleClick(prompt)}
              disabled={isTyping}
              className="px-4 py-2 text-sm font-sans font-bold text-body bg-peach rounded-full hover:text-orange transition-colors duration-300"
            >
              {prompt}
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}