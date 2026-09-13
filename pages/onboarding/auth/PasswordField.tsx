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
        h-[56px]

        rounded-full

        border

        bg-[#202F35]

        transition-colors

        ${
          error
            ? 'border-red-500 focus-within:border-red-500'
            : 'border-[#3A4D55] focus-within:border-orange'
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

          px-5
          pr-14

          bg-transparent

          outline-none

          text-white

          font-sans
          text-[15px]

          placeholder:text-[#91A4AC]

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

          text-[#71858E]

          hover:text-white
          hover:bg-white/[0.05]

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