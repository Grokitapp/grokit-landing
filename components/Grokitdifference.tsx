import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const principles = [
{
  title: 'Personalized',
  description: 'Your learning journey adapts to where you are and where you want to go.',
  icon: '◈'
},
{
  title: 'Structured',
  description: 'Complex topics become connected, progressive learning paths instead of disconnected answers.',
  icon: '◇'
},
{
  title: 'Grounded',
  description: 'Learning is built around real knowledge and sources — so understanding has something solid beneath it.',
  icon: '○'
}];


export function GrokitDifference() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start']
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <section data-ev-id="ev_38fb24f578"
    ref={containerRef}
    id="about"
    className="relative py-32 md:py-48 bg-black">

      {/* Gradient orb */}
      <div data-ev-id="ev_aea0478956"
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full opacity-20"
      style={{
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
        filter: 'blur(80px)'
      }} />


      <motion.div
        className="relative max-w-6xl mx-auto px-6"
        style={{ opacity }}>

        {/* Headline */}
        <div data-ev-id="ev_a9bb794b96" className="mb-20 md:mb-32">
          <motion.h2
            className="font-display text-4xl md:text-6xl lg:text-7xl text-white font-bold mb-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}>

            Not another AI answer.
          </motion.h2>
          <motion.p
            className="text-xl md:text-2xl text-gray max-w-2xl leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}>

            Learning isn't about generating more information.
            <br data-ev-id="ev_182ce6d304" />
            It's about finding the right path through it.
          </motion.p>
        </div>

        {/* Principles */}
        <div data-ev-id="ev_4e9151bc3f" className="grid md:grid-cols-3 gap-8">
          {principles.map((principle, idx) =>
          <motion.div
            key={principle.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: idx * 0.15 }}
            className="relative p-8 rounded-2xl bg-dark-elevated border border-dark-border group hover:border-cobalt/30 transition-colors duration-500">

              {/* Glow on hover */}
              <div data-ev-id="ev_53d1254957" className="absolute inset-0 rounded-2xl bg-linear-to-br from-cobalt/5 to-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div data-ev-id="ev_9adff58f46" className="relative">
                <span data-ev-id="ev_098819df10" className="text-2xl text-cobalt mb-4 block">{principle.icon}</span>
                <h3 data-ev-id="ev_f261a0b7fd" className="font-display text-2xl text-white font-semibold mb-4">
                  {principle.title}
                </h3>
                <p data-ev-id="ev_7442c82432" className="text-gray leading-relaxed">
                  {principle.description}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </section>);

}