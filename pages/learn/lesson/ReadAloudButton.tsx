import { Loader2, Pause, Play, Volume2 } from 'lucide-react';

import type { ReadAloudStatus } from '../../../lib/readAloud';

interface ReadAloudButtonProps {
  status: ReadAloudStatus;
  disabled?: boolean;
  /**
   * idle → start reading, speaking → pause, paused → resume, loading → cancel.
   * The parent decides what each one does.
   */
  onToggle: () => void;
}

const LABELS: Record<ReadAloudStatus, string> = {
  idle: 'Read aloud',
  loading: 'Loading voice, tap to cancel',
  speaking: 'Pause reading',
  paused: 'Resume reading',
};

/** Sits in the lesson header, opposite the close button. */
export default function ReadAloudButton({ status, disabled = false, onToggle }: ReadAloudButtonProps) {
  const active = status !== 'idle';

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={status === 'speaking'}
      aria-label={LABELS[status]}
      title={LABELS[status]}
      className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4611F]/60 disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? 'bg-[#F4611F] text-white' : 'text-[#91A4AC] hover:text-white'
      }`}
    >
      {status === 'loading' ? (
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      ) : status === 'speaking' ? (
        <Pause className="h-4 w-4 fill-current" aria-hidden="true" />
      ) : status === 'paused' ? (
        <Play className="h-4 w-4 fill-current" aria-hidden="true" />
      ) : (
        <Volume2 className="h-6 w-6" aria-hidden="true" />
      )}
    </button>
  );
}