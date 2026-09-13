import { useState } from 'react';
import { Mail } from 'lucide-react';
import logoLockup from '../assets/grokit-logo-lockup.png';

const InstagramIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const XIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817-5.963 6.817H1.684l7.73-8.835L1.254 2.25H8.08l4.713 6.231L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
  </svg>
);

const LinkedinIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export function Footer() {
  const [logoFailed, setLogoFailed] = useState(false);

  const socials = [
    { icon: InstagramIcon, href: 'https://www.instagram.com/grokitapp', label: 'Instagram' },
    { icon: XIcon, href: 'https://x.com/GrokitApp', label: 'X' },
    { icon: LinkedinIcon, href: 'https://linkedin.com/company/grokit-app', label: 'LinkedIn' },
    { icon: Mail, href: 'mailto:usegrokit@gmail.com', label: 'Contact' }
  ];

  return (
    <footer className="bg-surface border-t border-line py-16">
      <div className="max-w-[1140px] mx-auto px-5 md:px-16 flex flex-col items-center text-center gap-7">
        {logoFailed ? (
          <span className="font-display font-extrabold text-orange text-5xl">grokit</span>
        ) : (
          <img
            src={logoLockup}
            alt="Grokit"
            onError={() => setLogoFailed(true)}
            className="h-20 md:h-28 w-auto object-contain"
          />
        )}

        <p className="text-lg md:text-xl font-sans font-bold text-body">
          Generative learning, grounded in real knowledge.
        </p>

        <div className="flex items-center gap-5">
          {socials.map(({ icon: Icon, href, label }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              className="w-11 h-11 rounded-full bg-peach flex items-center justify-center text-link hover:bg-orange hover:text-white transition-colors duration-300"
            >
              <Icon className="w-5 h-5" />
            </a>
          ))}
        </div>

        <p className="text-[15px] font-sans font-medium text-muted">
          © 2026 Grokit. All rights reserved.
        </p>
      </div>
    </footer>
  );
}