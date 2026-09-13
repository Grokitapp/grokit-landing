import { motion } from 'framer-motion';
import groundedIllustration from '../assets/grokit-grounded.png';

export function Credibility() {
  return (
    <section className="bg-peach py-14 md:py-20 overflow-hidden">
      <div className="max-w-[1140px] mx-auto px-5 md:px-16">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-10 lg:gap-14">

          {/* Left — Text */}
          <motion.div
            className="flex-1 w-full text-center md:text-left"
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-[32px] sm:text-4xl md:text-[48px]  text-ink font-extrabold leading-[1.1] tracking-[-0.02em] mb-6">
              Grounded in real
              <br className="hidden sm:block" />
              knowledge
            </h2>

            <p className="text-lg md:text-xl  text-body font-sans font-medium leading-relaxed max-w-[560px] mx-auto md:mx-0">
              Every course in our core domains is built from verified public
              sources, not just plausible-sounding AI text.
            </p>
          </motion.div>

          {/* Right — Complete illustration */}
          <motion.div className="flex-1 w-full flex justify-center md:justify-end"
            initial={{ opacity: 0, x: 24, scale: 0.96 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1],}}
          >
            <motion.img
              src={groundedIllustration}
              alt="Grokit mascot reading on top of research, papers and sources"
              className="w-[300px] sm:w-[360px] md:w-[420px] lg:w-[460px] h-auto object-contain"
              animate={{y: [0, -5, 0],}}
              transition={{duration: 4, repeat: Infinity, ease: 'easeInOut',}}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}