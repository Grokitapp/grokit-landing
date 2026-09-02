import { motion } from 'framer-motion';
import { Sparkles, BookOpen, Route } from 'lucide-react';

const highlights = [
{ icon: Sparkles, label: 'Free to join the waitlist' },
{ icon: Route, label: 'Built around your goals' },
{ icon: BookOpen, label: 'Grounded in real sources' }];


export function HighlightStrip() {
  return (
    <section className="relative py-6 md:py-8 bg-surface border-y border-line">
      <motion.div
        className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}>

        {highlights.map(({ icon: Icon, label }) =>
        <div key={label} className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-teal shrink-0" />
            <span className="text-xs sm:text-sm font-sans font-bold text-body whitespace-nowrap">
              {label}
            </span>
          </div>
        )}
      </motion.div>
    </section>
    );
}