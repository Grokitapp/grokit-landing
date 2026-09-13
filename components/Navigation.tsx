import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import logoLockup from '../assets/grokit-logo-lockup.png';

interface NavigationProps {
  onOpenWaitlist: () => void;
}

function Logo({ className }: { className: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <span className={`font-display font-extrabold text-orange ${className}`}>grokit</span>;
  }

  return (
    <img
      src={logoLockup}
      alt="Grokit"
      onError={() => setFailed(true)}
      className={`w-auto object-contain ${className}`}
    />
  );
}

export function Navigation({ onOpenWaitlist }: NavigationProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'py-3 bg-surface/80 backdrop-blur-xl border-b border-line'
          : 'py-4 bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="max-w-[1140px] mx-auto px-5 md:px-16 flex items-center justify-between">
        <a href="/" className="flex items-center group">
          <Logo className="h-12 md:h-14 transition-transform duration-300 group-hover:scale-105" />
        </a>

        {/* One action only — Duolingo nav discipline */}
        <button
          onClick={onOpenWaitlist}
          className="btn-duo px-5 py-2.5 text-sm"
        >
          Join Waitlist
        </button>
      </div>
    </motion.nav>
  );
}