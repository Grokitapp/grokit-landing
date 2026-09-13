import { motion } from 'framer-motion';

function GroundedIllustration() {
  return (
    <svg viewBox="0 0 260 260" className="w-52 h-52 md:w-64 md:h-64" fill="none">
      {/* knowledge tree growing from the mascot's head */}
      <g stroke="#C1531E" strokeWidth={7} strokeLinecap="round">
        <path d="M130 148 V86" />
        <path d="M130 118 C112 112 100 100 94 84" />
        <path d="M130 104 C148 98 160 86 166 70" />
      </g>
      <circle cx="130" cy="72" r="9" fill="#F4611F" />
      <circle cx="88" cy="76" r="8" fill="#F4611F" />
      <circle cx="172" cy="62" r="8" fill="#F4611F" />
      <ellipse cx="106" cy="66" rx="9" ry="5" fill="#FFFFFF" opacity="0.85" transform="rotate(-30 106 66)" />
      <ellipse cx="152" cy="80" rx="9" ry="5" fill="#FFFFFF" opacity="0.85" transform="rotate(25 152 80)" />
      <path d="M196 96 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" fill="#FDB022" />
      <path d="M66 108 l2.4 5.4 5.4 2.4 -5.4 2.4 -2.4 5.4 -2.4 -5.4 -5.4 -2.4 5.4 -2.4 z" fill="#FDB022" />

      {/* tentacles as roots, drawn behind the body */}
      <g stroke="#E0501A" strokeWidth={9} strokeLinecap="round">
        <path d="M98 222 C78 232 62 232 48 244" />
        <path d="M114 228 C104 238 94 241 84 250" />
        <path d="M130 232 C130 243 129 249 130 256" />
        <path d="M146 228 C156 238 166 241 176 250" />
        <path d="M162 222 C182 232 198 232 212 244" />
      </g>

      {/* octopus mascot */}
      <ellipse cx="130" cy="188" rx="54" ry="46" fill="#F4611F" />
      <g fill="#E0501A">
        <circle cx="106" cy="158" r="2.6" />
        <circle cx="118" cy="152" r="2.6" />
        <circle cx="132" cy="150" r="2.6" />
        <circle cx="146" cy="153" r="2.6" />
        <circle cx="157" cy="160" r="2.6" />
      </g>
      <circle cx="116" cy="182" r="9.5" fill="#fff" />
      <circle cx="144" cy="182" r="9.5" fill="#fff" />
      <circle cx="117.5" cy="184" r="4.6" fill="#12142B" />
      <circle cx="145.5" cy="184" r="4.6" fill="#12142B" />
      <circle cx="115.5" cy="180" r="1.6" fill="#fff" />
      <circle cx="143.5" cy="180" r="1.6" fill="#fff" />
      <path d="M117 200 Q130 210 143 200" stroke="#fff" strokeWidth={5} strokeLinecap="round" />
    </svg>
  );
}

export function Credibility() {
  return (
    <section className="bg-peach py-20 md:py-[120px]">
      <div className="max-w-[1140px] mx-auto px-5 md:px-16 flex flex-col md:flex-row items-center gap-14 md:gap-20">
        <motion.div
          className="flex-1 text-center md:text-left"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
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

        <motion.div
          className="flex-1 flex justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <GroundedIllustration />
        </motion.div>
      </div>
    </section>
  );
}