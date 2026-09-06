import { motion } from 'framer-motion';
import { GrokitMascot } from './Grokitmascot';

const ORBIT_SUBJECTS = ['Quant Trading', 'Machine Learning', 'Public Speaking', 'Startups', 'Philosophy', 'Design', 'Investing', 'Physics'];
const ORBIT_RADIUS = 175;
const ORBIT_DURATION = 34;

export function HeroGraphic() {
  return (
    <div className="relative w-full aspect-square max-w-lg mx-auto md:mx-0">
      {/* Soft color wash behind everything */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[85%] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,107,0,0.12) 0%, rgba(253,176,34,0.08) 55%, transparent 75%)',
          filter: 'blur(20px)'
        }} />

      {/* Ripple rings — a small nod to the octopus living in water, kept
          subtle rather than a full ocean re-theme */}
      {[0, 1, 2].map((i) =>
      <motion.div
        key={i}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange/20 pointer-events-none"
        style={{ width: 130, height: 130 }}
        animate={{ scale: [1, 2.6], opacity: [0.5, 0] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeOut', delay: i * 1.2 }} />

      )}

      {/* Mascot, centered and larger */}
      <div className="absolute inset-0 flex items-center justify-center">
        <GrokitMascot size={230} />
      </div>

      {/* Orbiting subject badges — desktop only, satellite/counter-rotate
          technique: the ring rotates continuously, each badge counter-
          rotates at the same rate so its position orbits while the label
          itself stays upright and readable. */}
      <motion.div
        className="hidden md:block absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: ORBIT_DURATION, repeat: Infinity, ease: 'linear' }}>

        {ORBIT_SUBJECTS.map((label, i) => {
          const angle = 360 / ORBIT_SUBJECTS.length * i;
          return (
            <div
              key={label}
              className="absolute top-1/2 left-1/2"
              style={{ transform: `rotate(${angle}deg) translateX(${ORBIT_RADIUS}px)` }}>

              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: ORBIT_DURATION, repeat: Infinity, ease: 'linear' }}
                className="-translate-x-1/2 -translate-y-1/2 inline-flex items-center px-3.5 py-1.5 rounded-full bg-surface border border-line shadow-sm whitespace-nowrap">

                <span className="text-xs font-sans font-bold text-body">{label}</span>
              </motion.div>
            </div>);

        })}
      </motion.div>

      {/* Mobile fallback — orbit is too tight for small screens, so show a
          simple static row instead of hiding the subjects entirely */}
      <div className="md:hidden flex flex-wrap justify-center gap-2 mt-4">
        {ORBIT_SUBJECTS.slice(0, 4).map((label) =>
        <div key={label} className="px-3 py-1.5 rounded-full bg-surface border border-line">
            <span className="text-xs font-sans font-bold text-body">{label}</span>
          </div>
        )}
      </div>
    </div>
    );
}