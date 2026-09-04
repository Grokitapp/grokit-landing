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
  description: 'Learning is built around real knowledge and sources, so understanding has something solid beneath it.',
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
    <section
      ref={containerRef}
      id="about"
      className="relative py-12 md:py-20 bg-surface overflow-hidden">

      {/* Gradient orb */}
      <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10"
      style={{
        background: 'radial-gradient(circle, rgba(194,65,12,0.3) 0%, transparent 70%)',
        filter: 'blur(80px)'
      }} />


      <motion.div
        className="relative max-w-6xl mx-auto px-6"
        style={{ opacity }}>

        {/* Headline */}
        <div className="mb-12 md:mb-16">
          <motion.h2
            className="font-display text-3xl sm:text-4xl md:text-6xl lg:text-7xl text-ink font-extrabold mb-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}>

            Not another AI answer.
          </motion.h2>
          <motion.p
            className="text-lg sm:text-xl md:text-2xl text-body font-sans font-medium max-w-2xl leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}>

            Learning isn't about generating more information.
            <br />
            It's about finding the right path through it.
          </motion.p>
        </div>

        {/* Principles */}
        <div className="grid md:grid-cols-3 gap-6">
          {principles.map((principle, idx) =>
          <motion.div
            key={principle.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: idx * 0.15 }}
            className="relative p-8 rounded-3xl bg-surface-alt border border-line group hover:border-orange/30 transition-colors duration-500">

              {/* Glow on hover */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-orange/6 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative">
                <span className="text-2xl text-orange mb-4 block">{principle.icon}</span>
                <h3 className="font-display text-2xl text-ink font-extrabold mb-3">
                  {principle.title}
                </h3>
                <p className="text-body font-sans font-medium leading-relaxed">
                  {principle.description}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </section>
    );
}