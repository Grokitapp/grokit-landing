import { motion } from 'framer-motion';
import { Brain, LineChart, Rocket, Mic2, Atom } from 'lucide-react';

interface Badge {
  label: string;
  icon: typeof Brain;
  className: string; // positioning, per-badge
  delay: number;
}

const badges: Badge[] = [
{ label: 'Quant Trading', icon: LineChart, className: 'top-[14%] left-[6%]', delay: 0 },
{ label: 'Machine Learning', icon: Brain, className: 'top-[8%] right-[8%]', delay: 0.6 },
{ label: 'Startups', icon: Rocket, className: 'bottom-[18%] left-[10%]', delay: 1.2 },
{ label: 'Public Speaking', icon: Mic2, className: 'bottom-[10%] right-[6%]', delay: 0.3 },
{ label: 'Physics', icon: Atom, className: 'top-[45%] right-[2%]', delay: 0.9 }];


export function HeroGraphic() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Soft color wash, single element, no animation loop */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(47,111,237,0.10) 0%, rgba(124,92,252,0.06) 45%, transparent 70%)',
          filter: 'blur(40px)'
        }} />

      {/* Floating topic badges — desktop only, GPU-cheap transform animation */}
      <div className="hidden md:block">
        {badges.map(({ label, icon: Icon, className, delay }) =>
        <motion.div
          key={label}
          className={`absolute ${className} inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-line shadow-sm`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: [0, -10, 0] }}
          transition={{
            opacity: { duration: 0.6, delay },
            y: { duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay }
          }}>

            <Icon className="w-3.5 h-3.5 text-cobalt shrink-0" />
            <span className="text-xs font-sans font-bold text-body whitespace-nowrap">{label}</span>
          </motion.div>
        )}
      </div>
    </div>
    );
}