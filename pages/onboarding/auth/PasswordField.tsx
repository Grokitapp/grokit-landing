import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  error?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export default function PasswordField({
  value,
  onChange,
  placeholder = 'Password',
  autoComplete = 'current-password',
  disabled = false,
  error = false,
  onFocus,
  onBlur,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`relative rounded-xl border bg-surface-alt transition-colors ${
      error ? 'border-red-500 focus-within:border-red-500' : 'border-line focus-within:border-orange'
    }`}>
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        onFocus={onFocus}
        onBlur={onBlur}
        className="w-full px-4 py-3 pr-12 bg-transparent outline-none text-ink font-sans placeholder:text-muted disabled:opacity-50"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        disabled={disabled}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted hover:text-body transition-colors disabled:opacity-40"
      >
        {visible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  );
}
