import { Check } from 'lucide-react';
import { getPasswordChecks } from './password';

export default function PasswordRequirements({ password }: { password: string }) {
  const checks = getPasswordChecks(password);
  const items = [
    ['minLength', 'At least 8 characters'],
    ['uppercase', 'One uppercase letter'],
    ['lowercase', 'One lowercase letter'],
    ['number', 'One number'],
    ['special', 'One special character'],
  ] as const;

  return (
    <div className="mt-3 px-1">
      <p className="text-xs font-bold text-muted font-sans mb-2">Password must contain:</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
        {items.map(([key, label]) => (
          <div
            key={key}
            className={`flex items-center gap-2 text-xs font-sans font-semibold transition-colors ${
              checks[key] ? 'text-green-600' : 'text-muted'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                checks[key] ? 'bg-green-600 border-green-600 text-white' : 'border-line'
              }`}
            >
              {checks[key] && <Check className="w-2.5 h-2.5" />}
            </span>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
