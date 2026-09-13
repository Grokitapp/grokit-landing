import { motion } from 'framer-motion';
import { ArrowRight, Check, Plus } from 'lucide-react';
import { GrokitMascot, type MascotPose } from '../../components/Grokitmascot';

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full px-6 pt-6 pb-2">
      <div className="max-w-3xl mx-auto h-2.5 rounded-full bg-surface-alt border border-line overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-orange to-amber"
          initial={false}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}

interface SelectableProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

const selectedClasses = 'bg-orange/10 border-orange text-ink';
const unselectedClasses = 'bg-surface-alt border-line text-body hover:border-orange/30';

export function OptionRow({ label, selected, onClick }: SelectableProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-5 py-4 rounded-2xl border-2 font-sans font-bold transition-colors ${
        selected ? selectedClasses : unselectedClasses
      }`}
    >
      <span className="flex items-center gap-3">
        <span className={`w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center ${
          selected ? 'bg-orange border-orange' : 'border-line'
        }`}>
          {selected && <Check className="w-3.5 h-3.5 text-white" />}
        </span>
        {label}
      </span>
    </button>
  );
}

export function PillOption({ label, selected, onClick }: SelectableProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-5 py-3 rounded-full border-2 font-sans font-bold text-sm sm:text-base transition-colors ${
        selected ? selectedClasses : unselectedClasses
      }`}
    >
      {selected && <Check className="w-4 h-4 text-orange" />}
      {label}
    </button>
  );
}

interface OtherInputProps {
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
  placeholder: string;
}

export function OtherInput({ value, onChange, onAdd, placeholder }: OtherInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      onAdd();
    }
  };

  return (
    <div className="flex items-center gap-2 px-5 py-3 rounded-full border-2 border-line bg-surface-alt focus-within:border-orange/40 transition-colors">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-ink font-sans placeholder:text-muted"
      />
      <button
        onClick={onAdd}
        disabled={!value.trim()}
        aria-label="Add"
        className="w-7 h-7 shrink-0 rounded-full bg-orange text-white flex items-center justify-center disabled:opacity-30 transition-opacity"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24 c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039 l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24 C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
  );
}

interface TransitionScreenProps {
  pose: MascotPose;
  heading: string;
  sub: string;
  note?: string;
  onContinue: () => void;
}

export function TransitionScreen({ pose, heading, sub, note, onContinue }: TransitionScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
      <GrokitMascot size={130} pose={pose} className="mb-8" />
      <h1 className="font-display text-2xl sm:text-3xl md:text-4xl text-ink font-extrabold mb-4 max-w-3xl">
        {heading}
      </h1>
      <p className="text-body font-sans font-medium max-w-2xl mb-2">{sub}</p>
      {note && <p className="text-muted font-sans text-sm max-w-2xl">{note}</p>}

      <div className="w-full max-w-2xl mt-10">
        <button onClick={onContinue} className="btn-duo w-full px-8 py-4 text-lg">
          Continue
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}