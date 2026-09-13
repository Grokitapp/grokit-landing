import { motion } from 'framer-motion';
import octoPng from '../assets/grokit-octo.png';
import { Check, BookOpen, ShieldCheck } from 'lucide-react';

function GroundedIllustration() {
  return (
    <div className="relative w-full max-w-[520px] h-[380px] flex items-center justify-center">
      {/* Soft background glow */}
      <div
        className="absolute w-[320px] h-[320px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(244,97,31,0.10) 0%, transparent 68%)',
        }}
      />

      {/* Decorative spark */}
      <motion.div
        className="absolute top-12 right-[22%] text-[#FDB022]"
        animate={{
          rotate: [0, 8, -8, 0],
          scale: [1, 1.08, 1, 1.08, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
          <path
            d="M13 1L15.5 10.5L25 13L15.5 15.5L13 25L10.5 15.5L1 13L10.5 10.5L13 1Z"
            fill="currentColor"
          />
        </svg>
      </motion.div>

      {/* Small orange dot */}
      <div className="absolute top-[27%] left-[18%] w-3 h-3 rounded-full bg-orange" />

      {/* Source verification card */}
      <motion.div
        className="absolute top-5 right-[2%] sm:right-[6%] z-20"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.25, duration: 0.5 }}
      >
        <div className="bg-white rounded-2xl px-4 py-3 shadow-[0_8px_30px_rgba(18,20,43,0.08)] border border-white/80">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-6 h-6 rounded-full bg-[#DCFCE7] flex items-center justify-center">
              <Check className="w-4 h-4 text-[#16A34A]" strokeWidth={3} />
            </div>
            <span className="text-sm font-bold text-ink whitespace-nowrap">
              Verified sources
            </span>
          </div>

          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-6 h-6 rounded-full bg-[#DCFCE7] flex items-center justify-center">
              <Check className="w-4 h-4 text-[#16A34A]" strokeWidth={3} />
            </div>
            <span className="text-sm font-bold text-ink whitespace-nowrap">
              Evidence-backed
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-[#DCFCE7] flex items-center justify-center">
              <Check className="w-4 h-4 text-[#16A34A]" strokeWidth={3} />
            </div>
            <span className="text-sm font-bold text-ink whitespace-nowrap">
              Real knowledge
            </span>
          </div>
        </div>
      </motion.div>

      {/* Books / source stack */}
      <motion.div
        className="absolute bottom-[34px] left-1/2 -translate-x-1/2 w-[270px] sm:w-[300px]"
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.15, duration: 0.6 }}
      >
        {/* Bottom book */}
        <div className="relative h-[46px] bg-[#E7D8C8] rounded-xl border border-[#D8C6B3] shadow-sm">
          <div className="absolute left-0 top-0 bottom-0 w-[18px] bg-[#D1BBA5] rounded-l-xl" />

          <div className="h-full flex items-center justify-center">
            <span className="font-display text-sm sm:text-base font-extrabold tracking-wide text-[#756457]">
              SOURCES
            </span>
          </div>
        </div>

        {/* Middle book */}
        <div className="relative -mt-1 ml-[-8px] mr-[8px] h-[45px] bg-white rounded-xl border border-[#DED9D2] shadow-sm">
          <div className="absolute left-0 top-0 bottom-0 w-[18px] bg-[#E8E1D9] rounded-l-xl" />

          <div className="h-full flex items-center justify-center">
            <span className="font-display text-sm sm:text-base font-extrabold tracking-wide text-[#756457]">
              PAPERS
            </span>
          </div>
        </div>

        {/* Top book */}
        <div className="relative -mt-1 ml-[6px] mr-[-6px] h-[47px] bg-[#F7C56A] rounded-xl border border-[#E7AD48] shadow-sm">
          <div className="absolute left-0 top-0 bottom-0 w-[18px] bg-[#E7AD48] rounded-l-xl" />

          <div className="h-full flex items-center justify-center">
            <span className="font-display text-sm sm:text-base font-extrabold tracking-wide text-[#8A5B16]">
              RESEARCH
            </span>
          </div>
        </div>
      </motion.div>

      {/* Mascot */}
      <motion.img
        src={octoPng}
        alt="Grokit mascot"
        className="absolute z-10 w-[205px] sm:w-[225px] md:w-[245px] h-auto object-contain bottom-[75px] left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, scale: 0.88, y: 10 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{
          delay: 0.2,
          duration: 0.6,
          ease: [0.22, 1, 0.36, 1],
        }}
        animate={{
          y: [0, -5, 0],
        }}
      />

      {/* Ground shadow */}
      <div className="absolute bottom-[18px] left-1/2 -translate-x-1/2 w-[300px] h-[25px] rounded-[50%] bg-[#DCA87F]/20 blur-[2px]" />

      {/* Small floating shield/check icon */}
      <motion.div
        className="absolute bottom-[120px] left-[8%] sm:left-[12%] z-20"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <div className="w-11 h-11 rounded-2xl bg-white shadow-[0_8px_25px_rgba(18,20,43,0.08)] flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-orange" strokeWidth={2.2} />
        </div>
      </motion.div>

      {/* Small book icon */}
      <motion.div
        className="absolute bottom-[180px] right-[7%] sm:right-[12%] z-20"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <div className="w-10 h-10 rounded-2xl bg-white shadow-[0_8px_25px_rgba(18,20,43,0.08)] flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-[#C1531E]" strokeWidth={2.2} />
        </div>
      </motion.div>
    </div>
  );
}

export function Credibility() {
  return (
    <section className="bg-peach py-20 md:py-[120px] overflow-hidden">
      <div className="max-w-[1140px] mx-auto px-5 md:px-16 flex flex-col md:flex-row items-center gap-12 md:gap-16 lg:gap-20">

        {/* Text */}
        <motion.div
          className="flex-1 text-center md:text-left"
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-[32px] sm:text-4xl md:text-[48px] text-ink font-extrabold leading-[1.1] mb-6">
            Grounded in real knowledge
          </h2>

          <p className="text-lg md:text-xl text-body font-sans font-medium leading-relaxed max-w-lg mx-auto md:mx-0">
            Every course in our core domains is built from verified public
            sources, not just plausible-sounding AI text.
          </p>
        </motion.div>

        {/* Illustration */}
        <motion.div
          className="flex-1 w-full flex justify-center"
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <GroundedIllustration />
        </motion.div>

      </div>
    </section>
  );
}