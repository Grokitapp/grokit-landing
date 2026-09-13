import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  error?: boolean;
  name?: string;
}

export default function PasswordField({
  value,
  onChange,
  placeholder = 'Password',
  autoComplete = 'current-password',
  disabled = false,
  error = false,
  name,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className={`
        relative
        w-full
        h-[58px]
        rounded-[14px]
        border
        bg-surface-alt
        transition-colors
        ${
          error
            ? 'border-red-500 focus-within:border-red-500'
            : 'border-line focus-within:border-orange'
        }
      `}
    >
      <input
        type={visible ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        data-lpignore="true"
        data-1p-ignore="true"
        data-bwignore="true"
        disabled={disabled}
        aria-invalid={error}
        className="
          w-full
          h-full
          px-[18px]
          pr-14
          bg-transparent
          outline-none
          text-ink
          font-sans
          text-base
          placeholder:text-muted
          disabled:opacity-50
        "
      />

      <button
        type="button"
        onClick={() =>
          setVisible((current) => !current)
        }
        disabled={disabled}
        aria-label={
          visible
            ? 'Hide password'
            : 'Show password'
        }
        className="
          absolute
          right-2
          top-1/2
          -translate-y-1/2
          w-10
          h-10
          rounded-full
          flex
          items-center
          justify-center
          text-muted
          hover:text-ink
          hover:bg-black/[0.04]
          transition-colors
          disabled:opacity-40
        "
      >
        {visible ? (
          <EyeOff className="w-[18px] h-[18px]" />
        ) : (
          <Eye className="w-[18px] h-[18px]" />
        )}
      </button>
    </div>
  );
}