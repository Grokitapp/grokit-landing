import { Square, Volume2 } from 'lucide-react';

interface ReadAloudButtonProps {
  speaking: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

/** Sits in the lesson header, opposite the close button. */
export default function ReadAloudButton({ speaking, disabled = false, onToggle }: ReadAloudButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={speaking}
      aria-label={speaking ? 'Stop reading aloud' : 'Read aloud'}
      title={speaking ? 'Stop reading' : 'Read aloud'}
      className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4611F]/60 disabled:cursor-not-allowed disabled:opacity-40 ${
        speaking ? 'bg-[#F4611F] text-white' : 'text-[#91A4AC] hover:text-white'
      }`}
    >
      {speaking ? (
        <Square className="h-4 w-4 fill-current" aria-hidden="true" />
      ) : (
        <Volume2 className="h-6 w-6" aria-hidden="true" />
      )}
    </button>
  );
}