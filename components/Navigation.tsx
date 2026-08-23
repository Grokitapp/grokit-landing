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
  { label: 'About', href: '#about' }];


  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ?
        'py-3 bg-black/70 backdrop-blur-xl border-b border-white/5' :
        'py-6 bg-transparent'}`
        }
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>

        <div data-ev-id="ev_d6df49f0de" className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <a data-ev-id="ev_8239e08230" href="/" className="flex items-center gap-3 group">
            <GrokitLogo size={36} className="text-white transition-transform duration-300 group-hover:scale-105" />
            <span data-ev-id="ev_70433f0704" className="font-display text-xl text-white font-semibold tracking-tight">
              Grokit
            </span>
          </a>

          {/* Center Nav - Desktop */}
          <div data-ev-id="ev_f60cfa7142" className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
            <a data-ev-id="ev_a43a1d32e1"
            key={link.href}
            href={link.href}
            className="text-sm text-gray-light hover:text-white transition-colors duration-300 font-medium">

                {link.label}
              </a>
            )}
          </div>

          {/* CTA */}
          <div data-ev-id="ev_d2f08950d7" className="flex items-center gap-4">
            <motion.button
              onClick={onOpenWaitlist}
              className="hidden md:block px-5 py-2.5 text-sm font-medium text-white border border-white/20 rounded-full hover:bg-white hover:text-black transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}>

              Join Waitlist
            </motion.button>
            
            {/* Mobile Menu Button */}
            <button data-ev-id="ev_1f7dfb9dff"
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
          className="fixed inset-0 z-100 bg-black">

            <div data-ev-id="ev_1c2b2461af" className="p-6">
              <div data-ev-id="ev_b77589ca8c" className="flex justify-between items-center mb-12">
                <div data-ev-id="ev_40812c36b2" className="flex items-center gap-3">
                  <GrokitLogo size={32} className="text-white" />
                  <span data-ev-id="ev_0471f84746" className="font-display text-xl text-white font-semibold">Grokit</span>
                </div>
                <button data-ev-id="ev_86fbb622d3" onClick={() => setMobileMenuOpen(false)}>
                  <X size={24} className="text-white" />
                </button>
              </div>
              <div data-ev-id="ev_7872eb2c57" className="flex flex-col gap-6">
                {navLinks.map((link, i) =>
              <motion.a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-3xl font-display text-white font-medium">

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
                className="mt-6 px-8 py-4 bg-white text-black rounded-full font-semibold text-lg">

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