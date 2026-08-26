import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export function TrustStrip() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start']
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const line1X = useTransform(scrollYProgress, [0.1, 0.4], ['-10%', '0%']);
  const line2X = useTransform(scrollYProgress, [0.2, 0.5], ['10%', '0%']);

  return (
    <section
      ref={containerRef}
      className="relative py-16 md:py-24 bg-black overflow-hidden">

      {/* Subtle grid background */}
      <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />


      <motion.div
        className="max-w-5xl mx-auto px-6 text-center"
        style={{ opacity }}>

        <div className="flex flex-col gap-4">
          <motion.p
            className="font-display text-3xl md:text-5xl lg:text-6xl text-gray font-extrabold"
            style={{ x: line1X }}>

            AI can give you information.
          </motion.p>
          <motion.p
            className="font-display text-3xl md:text-5xl lg:text-6xl text-white font-extrabold"
            style={{ x: line2X }}>

            Grokit helps you build{' '}
            <span className="bg-linear-to-r from-cobalt to-purple bg-clip-text text-transparent">
              understanding.
            </span>
          </motion.p>
        </div>
      </motion.div>
    </section>
    );
}