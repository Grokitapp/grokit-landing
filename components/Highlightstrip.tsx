import {
  Brain, LineChart, TrendingUp, Cpu, Mic2, Rocket, BookOpen, Palette } from
'lucide-react';

const subjects = [
{ label: 'AI', icon: Brain },
{ label: 'Quant Trading', icon: TrendingUp },
{ label: 'Machine Learning', icon: Cpu },
{ label: 'Public Speaking', icon: Mic2 },
{ label: 'Startups', icon: Rocket },
{ label: 'Philosophy', icon: BookOpen },
{ label: 'Design', icon: Palette },
{ label: 'Investing', icon: LineChart }];


export function HighlightStrip() {
  return (
    <section className="relative py-4 bg-surface border-t border-line">
      <div className="max-w-[1200px] mx-auto px-6 flex flex-wrap items-center justify-center gap-2.5">
        {subjects.map(({ label, icon: Icon }) =>
        <div
          key={label}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-line bg-surface-alt">

            <Icon className="w-4 h-4 text-orange shrink-0" />
            <span className="text-sm font-sans font-bold text-body whitespace-nowrap">{label}</span>
          </div>
        )}
      </div>
    </section>
    );
}