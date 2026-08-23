import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { GrokitLogo } from './Grokitlogo';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FormState = 'default' | 'loading' | 'success' | 'error';

// Set VITE_FORMSPREE_ID in your .env file; falls back to the existing form id.
const FORMSPREE_ENDPOINT = `https://formspree.io/f/xdenvlno`;

export function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
  const [formState, setFormState] = useState<FormState>('default');
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    learnFirst: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('loading');

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          email: formData.email,
          learnFirst: formData.learnFirst || 'Not specified'
        })
      });

      if (response.ok) {
        setFormState('success');
      } else {
        setFormState('error');
      }
    } catch {
      setFormState('error');
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form after animation
    setTimeout(() => {
      setFormState('default');
      setFormData({ firstName: '', email: '', learnFirst: '' });
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen &&
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-200 flex items-center justify-center p-6">

          {/* Backdrop */}
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm" />


          {/* Modal */}
          <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-dark-elevated border border-dark-border rounded-3xl p-8 md:p-10 shadow-2xl">

            {/* Close button */}
            <button data-ev-id="ev_f6e8464e95"
          onClick={handleClose}
          className="absolute top-6 right-6 p-2 text-gray hover:text-white transition-colors">

              <X className="w-5 h-5" />
            </button>

            <AnimatePresence mode="wait">
              {(formState === 'default' || formState === 'loading') &&
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}>

                  <h2 data-ev-id="ev_51d0b11e75" className="font-display text-3xl md:text-4xl text-white font-bold mb-3">
                    Be among the first to learn with Grokit.
                  </h2>
                  <p data-ev-id="ev_4e525892ef" className="text-gray mb-8">
                    We're building a new way to learn anything. Join the early access list.
                  </p>

                  <form data-ev-id="ev_aeab2c6436" onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div data-ev-id="ev_ac6072e4c8">
                      <label data-ev-id="ev_34ce78e4a0" htmlFor="firstName" className="block text-sm font-medium text-white mb-2">
                        First name
                      </label>
                      <input data-ev-id="ev_8f541373e3"
                  type="text"
                  id="firstName"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-dark-border rounded-xl text-white placeholder:text-gray focus:outline-none focus:border-cobalt transition-colors"
                  placeholder="Your name" />

                    </div>

                    <div data-ev-id="ev_d1e725c5ea">
                      <label data-ev-id="ev_16af26d550" htmlFor="email" className="block text-sm font-medium text-white mb-2">
                        Email
                      </label>
                      <input data-ev-id="ev_e880124022"
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-dark-border rounded-xl text-white placeholder:text-gray focus:outline-none focus:border-cobalt transition-colors"
                  placeholder="you@example.com" />

                    </div>

                    <div data-ev-id="ev_cf303ac0b6">
                      <label data-ev-id="ev_d3ca7d4ace" htmlFor="learnFirst" className="block text-sm font-medium text-white mb-2">
                        What do you want to learn first? <span data-ev-id="ev_a37cd2a5ba" className="text-gray font-normal">(optional)</span>
                      </label>
                      <input data-ev-id="ev_3fbd5ede15"
                  type="text"
                  id="learnFirst"
                  value={formData.learnFirst}
                  onChange={(e) => setFormData({ ...formData, learnFirst: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-dark-border rounded-xl text-white placeholder:text-gray focus:outline-none focus:border-cobalt transition-colors"
                  placeholder="e.g., Machine learning, startups, investing..." />

                    </div>

                    <motion.button
                  type="submit"
                  disabled={formState === 'loading'}
                  className="group relative mt-4 px-8 py-4 rounded-full font-semibold text-lg overflow-hidden disabled:opacity-70 text-white"
                  style={{
                    background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)'
                  }}
                  whileHover={{ scale: formState === 'loading' ? 1 : 1.02 }}
                  whileTap={{ scale: formState === 'loading' ? 1 : 0.98 }}>

                      <span data-ev-id="ev_7bc419e8ea" className={`flex items-center justify-center gap-2 transition-opacity ${formState === 'loading' ? 'opacity-0' : 'opacity-100'}`}>
                        Request early access
                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                      </span>
                      
                      {formState === 'loading' &&
                  <div data-ev-id="ev_ce22f4798f" className="absolute inset-0 flex items-center justify-center">
                          <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />

                        </div>
                  }
                    </motion.button>
                  </form>
                </motion.div>
            }

              {formState === 'success' &&
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8">

                  <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-16 h-16 mx-auto mb-6 rounded-full bg-linear-to-br from-cobalt to-purple flex items-center justify-center">

                    <Check className="w-8 h-8 text-white" />
                  </motion.div>
                  <h2 data-ev-id="ev_a9eeedc85d" className="font-display text-3xl md:text-4xl text-white font-bold mb-3">
                    You're on the list.
                  </h2>
                  <p data-ev-id="ev_8ee2ba282d" className="text-gray mb-6">
                    We'll let you know when Grokit is ready for you.
                  </p>
                  <GrokitLogo size={48} className="mx-auto opacity-20" animate />
                </motion.div>
            }

              {formState === 'error' &&
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8">

                  <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">

                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </motion.div>
                  <h2 data-ev-id="ev_a8299d7c12" className="font-display text-2xl text-white font-bold mb-3">
                    Something went wrong.
                  </h2>
                  <p data-ev-id="ev_7bcd90e5a8" className="text-gray mb-6">
                    Please try again.
                  </p>
                  <button data-ev-id="ev_d2e2f58405"
              onClick={() => setFormState('default')}
              className="px-6 py-3 bg-white text-black rounded-full font-semibold">

                    Try again
                  </button>
                </motion.div>
            }
            </AnimatePresence>
          </motion.div>
        </motion.div>
      }
    </AnimatePresence>
    );
}