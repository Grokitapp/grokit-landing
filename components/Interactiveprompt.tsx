import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

const examplePrompts = [
'Build a startup from zero',
'Understand machine learning',
'Learn quantitative finance',
'Understand the universe',
'Become better at public speaking'];


interface InteractivePromptProps {
  onOpenWaitlist: () => void;
}

export function InteractivePrompt({ onOpenWaitlist }: InteractivePromptProps) {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleExampleClick = (example: string) => {
    setInputValue('');
    setIsTyping(true);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);

    // Create particle effect
    if (e.target.value.length > inputValue.length) {
      const newParticle = {
        id: Date.now(),
        x: Math.random() * 100,
        y: Math.random() * 100
      };
      setParticles((prev) => [...prev.slice(-10), newParticle]);
    }
  };

  // Clean up particles
  useEffect(() => {
    if (particles.length > 0) {
      const timeout = setTimeout(() => {
        setParticles((prev) => prev.slice(1));
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [particles]);

  const handleSubmit = () => {
    onOpenWaitlist();
  };

  return (
    <section
    id="explore"
    className="relative py-12 md:py-20 bg-surface overflow-hidden">

      {/* Background glow */}
      <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(13,148,136,0.08) 0%, transparent 60%)',
        filter: 'blur(60px)'
      }} />


      {/* Background particles */}
      <div className="absolute inset-0 pointer-events-none">
        <AnimatePresence>
          {particles.map((particle) =>
          <motion.div
            key={particle.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.6, scale: 1 }}
            exit={{ opacity: 0, scale: 0, y: -50 }}
            transition={{ duration: 1 }}
            className="absolute w-2 h-2 rounded-full bg-teal"
            style={{ left: `${particle.x}%`, top: `${particle.y}%` }} />

          )}
        </AnimatePresence>
      </div>

      <div className="relative max-w-4xl mx-auto px-6 lg:px-12">
        {/* Headline */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}>

          <h2 className="font-display text-3xl sm:text-4xl md:text-6xl lg:text-7xl text-ink font-extrabold">
            What do you want to <span className="text-teal">understand?</span>
          </h2>
        </motion.div>

        {/* Input box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="relative">

          <div className="relative bg-surface-alt border border-line rounded-3xl p-6 md:p-8 hover:border-teal/30 transition-colors duration-500">
            {/* Decorative element */}
            <div className="absolute -top-3 left-8 px-3 py-1 bg-surface border border-line rounded-full">
              <Sparkles className="w-4 h-4 text-teal" />
            </div>

            <textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Ask anything..."
            className="w-full text-lg sm:text-xl md:text-2xl text-ink font-sans placeholder:text-muted resize-none bg-transparent outline-none min-h-[100px]"
            disabled={isTyping} />


            <div className="flex items-center justify-between mt-6 pt-6 border-t border-line">
              <p className="text-sm text-muted font-sans font-semibold hidden sm:block">
                Press Enter or click to start
              </p>
              <button
                onClick={handleSubmit}
                className="btn-duo px-6 py-3 text-base">

                Create your learning path
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Example prompts */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex flex-wrap justify-center gap-3">

          {examplePrompts.map((prompt, idx) =>
          <motion.button
            key={prompt}
            onClick={() => handleExampleClick(prompt)}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 + idx * 0.1 }}
            className="px-4 py-2 text-sm font-sans font-bold text-body border border-line rounded-full hover:border-teal hover:text-teal transition-colors duration-300"
            disabled={isTyping}>

              {prompt}
            </motion.button>
          )}
        </motion.div>
      </div>
    </section>
    );
}