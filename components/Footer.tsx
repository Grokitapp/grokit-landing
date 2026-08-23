import { Mail } from 'lucide-react';
import { GrokitLogo } from './Grokitlogo';

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
  const socialLinks = [
    { icon: InstagramIcon, href: 'https://www.instagram.com/grokitapp', label: 'Instagram' },
    { icon: XIcon, href: 'https://x.com/GrokitApp', label: 'X' },
    { icon: LinkedinIcon, href: 'https://linkedin.com/company/grokit-app', label: 'LinkedIn' },
    { icon: Mail, href: 'mailto:usegrokit@gmail.com', label: 'Contact' }
  ];

  return (
    <footer data-ev-id="ev_717b8ef5ec" className="bg-black border-t border-dark-border py-12 md:py-16">
      <div data-ev-id="ev_16b0bd2298" className="max-w-6xl mx-auto px-6">
        <div data-ev-id="ev_3c3986113d" className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          {/* Left */}
          <div data-ev-id="ev_92f32aacd1">
            <div data-ev-id="ev_be705d4f00" className="flex items-center gap-3 mb-3">
              <GrokitLogo size={28} />
              <span data-ev-id="ev_8c3b3c393f" className="font-display text-lg text-white font-semibold">Grokit</span>
            </div>
            <p data-ev-id="ev_be78d677d9" className="text-gray text-sm max-w-xs">
              Generative learning, grounded in real knowledge.
            </p>
          </div>

          {/* Right - Social */}
          <div data-ev-id="ev_dba2cb1e4b" className="flex items-center gap-4">
            {socialLinks.map(({ icon: Icon, href, label }) => (
              <a data-ev-id="ev_28f8d06744"
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray hover:text-white transition-colors"
                aria-label={label}
              >
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div data-ev-id="ev_685098a9dc" className="mt-12 pt-8 border-t border-dark-border">
          <p data-ev-id="ev_6f94801a2c" className="text-gray/60 text-sm">
            © {new Date().getFullYear()} Grokit. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}