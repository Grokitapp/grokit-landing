import { useRef } from 'react';
import {
  ChevronLeft, ChevronRight, Brain, LineChart, TrendingUp,
  Cpu, Mic2, Rocket, BookOpen, Palette, Atom, Lightbulb } from
'lucide-react';

const subjects = [
{ label: 'AI', icon: Brain },
{ label: 'Finance', icon: LineChart },
{ label: 'Quant Trading', icon: TrendingUp },
{ label: 'Machine Learning', icon: Cpu },
{ label: 'Public Speaking', icon: Mic2 },
{ label: 'Startups', icon: Rocket },
{ label: 'Philosophy', icon: BookOpen },
{ label: 'Design', icon: Palette },
{ label: 'Physics', icon: Atom },
{ label: 'Psychology', icon: Lightbulb }];


export function HighlightStrip() {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: direction * 260, behavior: 'smooth' });
  };

  return (
    <section className="relative py-4 bg-surface border-y border-line">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-2">
        <button
          onClick={() => scroll(-1)}
          aria-label="Scroll left"
          className="hidden sm:flex shrink-0 w-8 h-8 items-center justify-center rounded-full text-muted hover:text-ink hover:bg-surface-alt transition-colors">

          <ChevronLeft className="w-5 h-5" />
        </button>

        <div
          ref={scrollerRef}
          className="flex-1 flex items-center gap-3 overflow-x-auto scroll-smooth py-1"
          style={{ scrollbarWidth: 'none' }}>

          {subjects.map(({ label, icon: Icon }) =>
          <div
            key={label}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-line bg-surface-alt">

              <Icon className="w-4 h-4 text-orange shrink-0" />
              <span className="text-sm font-sans font-bold text-body whitespace-nowrap">{label}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => scroll(1)}
          aria-label="Scroll right"
          className="hidden sm:flex shrink-0 w-8 h-8 items-center justify-center rounded-full text-muted hover:text-ink hover:bg-surface-alt transition-colors">

          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
    );
}