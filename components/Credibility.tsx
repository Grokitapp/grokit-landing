import { motion } from 'framer-motion';

function RootBranchIcon() {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      className="w-28 h-28 text-link"
    >
      {/* trunk */}
      <path d="M60 108 V58" />
      {/* left branch */}
      <path d="M60 82 C46 76 38 66 34 54" />
      <circle cx="32" cy="48" r="5" fill="currentColor" stroke="none" />
      {/* right branch */}
      <path d="M60 70 C74 64 82 54 86 42" />
      <circle cx="88" cy="36" r="5" fill="currentColor" stroke="none" />
      {/* top */}
      <path d="M60 58 V38" />
      <circle cx="60" cy="30" r="5" fill="currentColor" stroke="none" />
      {/* roots */}
      <path d="M60 108 C52 110 46 112 42 116" />
      <path d="M60 108 C68 110 74 112 78 116" />
    </svg>
  );
}

export function Credibility() {
  return (
    <section className="bg-peach py-16 md:py-[120px]">
      <div className="max-w-[1140px] mx-auto px-5 md:px-16 flex flex-col md:flex-row items-center gap-12 md:gap-20">
        <motion.div
          className="flex-1 text-center md:text-left"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-[26px] sm:text-3xl md:text-[34px] text-ink font-extrabold leading-tight mb-6">
            Grounded in real knowledge
          </h2>
          <p className="text-base md:text-lg text-body font-sans font-medium leading-relaxed max-w-md mx-auto md:mx-0">
            Every course in our core domains is built from verified public
            sources — not just plausible-sounding AI text.
          </p>
        </motion.div>

        <motion.div
          className="flex-1 flex justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <RootBranchIcon />
        </motion.div>
      </div>
    </section>
  );
}