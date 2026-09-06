import { motion } from 'framer-motion';
import { GrokitMascot } from './Grokitmascot';

const BADGES: { label: string; className: string; delay: number }[] = [
{ label: 'Startups', className: 'top-0 left-1/2 -translate-x-1/2', delay: 0 },
{ label: 'Philosophy', className: 'top-[12%] right-0', delay: 0.5 },
{ label: 'Investing', className: 'top-1/2 -right-2 -translate-y-1/2', delay: 1.0 },
{ label: 'Design', className: 'bottom-[15%] right-0', delay: 0.3 },
{ label: 'Physics', className: 'bottom-0 left-1/2 -translate-x-1/2', delay: 0.8 },
{ label: 'Quant Trading', className: 'bottom-[15%] left-0', delay: 1.3 },
{ label: 'Machine Learning', className: 'top-1/2 -left-2 -translate-y-1/2', delay: 0.15 },
{ label: 'Public Speaking', className: 'top-[12%] left-0', delay: 1.6 }];


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

      {/* Ripple rings */}
      {[0, 1, 2].map((i) =>
      <motion.div
        key={i}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange/25 pointer-events-none"
        style={{ width: 130, height: 130 }}
        animate={{ scale: [1, 2.6], opacity: [0.6, 0] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeOut', delay: i * 1.2 }} />

      )}

      {/* Mascot, centered */}
      <div className="absolute inset-0 flex items-center justify-center">
        <GrokitMascot size={230} />
      </div>

      {/* Floating subject badges — desktop only, static positions + gentle bob */}
      <div className="hidden md:block">
        {BADGES.map(({ label, className, delay }) =>
        <motion.div
          key={label}
          className={`absolute ${className} inline-flex items-center px-3.5 py-1.5 rounded-full bg-surface border border-line shadow-sm whitespace-nowrap`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: [0, -8, 0] }}
          transition={{
            opacity: { duration: 0.6, delay },
            y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay }
          }}>

            <span className="text-xs font-sans font-bold text-body">{label}</span>
          </motion.div>
        )}
      </div>

      {/* Mobile — small static row instead of scattering badges around a
          cramped illustration */}
      <div className="md:hidden flex flex-wrap justify-center gap-2 mt-4">
        {BADGES.slice(0, 4).map(({ label }) =>
        <div key={label} className="px-3 py-1.5 rounded-full bg-surface border border-line">
            <span className="text-xs font-sans font-bold text-body">{label}</span>
          </div>
        )}
      </div>
    </div>
    );
}