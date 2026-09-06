import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
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
      className={`w-auto object-contain ${className}`} />

    );
}

export function Navigation({ onOpenWaitlist }: NavigationProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Explore', href: '#explore' },
  { label: 'About', href: '#about' },
  { label: 'FAQ', href: '#faq' }];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ?
        'py-3 bg-surface/80 backdrop-blur-xl border-b border-line' :
        'py-4 bg-transparent'}`
        }
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>

        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
          <a href="/" className="flex items-center group">
            <Logo className="h-14 md:h-16 transition-transform duration-300 group-hover:scale-105" />
          </a>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
            <a
            key={link.href}
            href={link.href}
            onClick={(e) => handleNavClick(e, link.href)}
            className="text-sm text-body hover:text-ink transition-colors duration-300 font-sans font-bold">

                {link.label}
              </a>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenWaitlist}
              className="btn-duo hidden md:inline-flex px-5 py-2.5 text-sm">

              Join Waitlist
            </button>
            
            <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 text-ink">

              <Menu size={24} />
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileMenuOpen &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-surface">

            <div className="p-6">
              <div className="flex justify-between items-center mb-12">
                <Logo className="h-12" />
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X size={24} className="text-ink" />
                </button>
              </div>
              <div className="flex flex-col gap-6">
                {navLinks.map((link, i) =>
              <motion.a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  handleNavClick(e, link.href);
                }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-3xl font-display text-ink font-bold">

                    {link.label}
                  </motion.a>
              )}
                <motion.button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenWaitlist();
                }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="btn-duo mt-6 px-8 py-4 text-lg w-fit">

                  Join Waitlist
                </motion.button>
              </div>
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </>
    );
}