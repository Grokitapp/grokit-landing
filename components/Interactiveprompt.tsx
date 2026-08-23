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
  const [particles, setParticles] = useState<Array<{id: number;x: number;y: number;}>>([]);
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
    <section data-ev-id="ev_d5c4f19535"
    id="explore"
    className="relative py-32 md:py-48 bg-black overflow-hidden">

      {/* Background glow */}
      <div data-ev-id="ev_96a12af8a5"
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 60%)',
        filter: 'blur(60px)'
      }} />


      {/* Background particles */}
      <div data-ev-id="ev_d126733f30" className="absolute inset-0 pointer-events-none">
        <AnimatePresence>
          {particles.map((particle) =>
          <motion.div
            key={particle.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.6, scale: 1 }}
            exit={{ opacity: 0, scale: 0, y: -50 }}
            transition={{ duration: 1 }}
            className="absolute w-2 h-2 rounded-full bg-cobalt"
            style={{ left: `${particle.x}%`, top: `${particle.y}%` }} />

          )}
        </AnimatePresence>
      </div>

      <div data-ev-id="ev_dc38d0e458" className="relative max-w-4xl mx-auto px-6">
        {/* Headline */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}>

          <h2 data-ev-id="ev_e74cc4f28b" className="font-display text-4xl md:text-6xl lg:text-7xl text-white font-bold">
            What do you want to{' '}
            <span data-ev-id="ev_6fb66fc44d" className="bg-linear-to-r from-cobalt to-cyan bg-clip-text text-transparent">
              understand?
            </span>
          </h2>
        </motion.div>

        {/* Input box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="relative">

          <div data-ev-id="ev_7fc1c6c77a" className="relative bg-dark-elevated border border-dark-border rounded-3xl p-6 md:p-8 hover:border-cobalt/30 transition-colors duration-500">
            {/* Decorative element */}
            <div data-ev-id="ev_ce357f3bf0" className="absolute -top-3 left-8 px-3 py-1 bg-black border border-dark-border rounded-full">
              <Sparkles className="w-4 h-4 text-cobalt" />
            </div>

            <textarea data-ev-id="ev_47a8c6edbe"
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Ask anything..."
            className="w-full text-xl md:text-2xl text-white placeholder:text-gray resize-none bg-transparent outline-none min-h-25"
            disabled={isTyping} />


            <div data-ev-id="ev_19254d4d2d" className="flex items-center justify-between mt-6 pt-6 border-t border-dark-border">
              <p data-ev-id="ev_344bc1c0d6" className="text-sm text-gray hidden sm:block">
                Press Enter or click to start
              </p>
              <motion.button
                onClick={handleSubmit}
                className="group flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white"
                style={{
                  background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)'
                }}
                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(59, 130, 246, 0.4)' }}
                whileTap={{ scale: 0.98 }}>

                Create your learning path
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </motion.button>
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
            className="px-4 py-2 text-sm text-gray border border-dark-border rounded-full hover:border-cobalt hover:text-cobalt transition-colors duration-300"
            disabled={isTyping}>

              {prompt}
            </motion.button>
          )}
        </motion.div>
      </div>
    </section>
    );
}