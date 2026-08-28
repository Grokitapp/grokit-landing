import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { GrokitLogo } from './Grokitlogo';

interface NavigationProps {
  onOpenWaitlist: () => void;
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

  // Smooth-scrolls to the target section without ever writing #hash into the URL bar.
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
        'py-3 bg-black/70 backdrop-blur-xl border-b border-white/5' :
        'py-5 bg-transparent'}`
        }
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>

        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 group">
            <GrokitLogo size={36} className="transition-transform duration-300 group-hover:scale-105" />
            <span className="font-display text-xl text-white font-extrabold tracking-tight">
              Grokit
            </span>
          </a>

          {/* Center Nav - Desktop */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
            <a
            key={link.href}
            href={link.href}
            onClick={(e) => handleNavClick(e, link.href)}
            className="text-sm text-gray-light hover:text-white transition-colors duration-300 font-sans font-bold">

                {link.label}
              </a>
            )}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenWaitlist}
              className="btn-duo hidden md:inline-flex px-5 py-2.5 text-sm">

              Join Waitlist
            </button>
            
            {/* Mobile Menu Button */}
            <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 text-white">

              <Menu size={24} />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black">

            <div className="p-6">
              <div className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-3">
                  <GrokitLogo size={32} />
                  <span className="font-display text-xl text-white font-extrabold">Grokit</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X size={24} className="text-white" />
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
                className="text-3xl font-display text-white font-bold">

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