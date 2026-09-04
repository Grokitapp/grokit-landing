import { motion } from 'framer-motion';
import { Brain, LineChart, Rocket, Mic2 } from 'lucide-react';
import { GrokitMascot } from './Grokitmascot';

interface Badge {
  label: string;
  icon: typeof Brain;
  className: string;
  delay: number;
}

const badges: Badge[] = [
{ label: 'Quant Trading', icon: LineChart, className: 'top-2 left-0', delay: 0 },
{ label: 'Machine Learning', icon: Brain, className: 'top-6 right-0', delay: 0.6 },
{ label: 'Startups', icon: Rocket, className: 'bottom-4 left-4', delay: 1.2 },
{ label: 'Public Speaking', icon: Mic2, className: 'bottom-0 right-2', delay: 0.3 }];


export function HeroGraphic() {
  return (
    <div className="relative w-full aspect-square max-w-sm mx-auto md:mx-0">
      {/* Soft color wash behind the mascot */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[85%] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(194,65,12,0.12) 0%, rgba(253,176,34,0.08) 55%, transparent 75%)',
          filter: 'blur(20px)'
        }} />

      {/* Mascot, centered */}
      <div className="absolute inset-0 flex items-center justify-center">
        <GrokitMascot size={150} />
      </div>

      {/* Floating topic badges around the mascot */}
      {badges.map(({ label, icon: Icon, className, delay }) =>
      <motion.div
        key={label}
        className={`absolute ${className} inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-surface border border-line shadow-sm`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: [0, -8, 0] }}
        transition={{
          opacity: { duration: 0.6, delay },
          y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay }
        }}>

          <Icon className="w-3.5 h-3.5 text-orange shrink-0" />
          <span className="text-xs font-sans font-bold text-body whitespace-nowrap">{label}</span>
        </motion.div>
      )}
    </div>
    );
}