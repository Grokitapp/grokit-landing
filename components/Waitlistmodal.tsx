import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { GrokitLogo } from './Grokitlogo';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FormState = 'default' | 'loading' | 'success' | 'error';
type FieldErrors = { firstName?: string; email?: string };

// Set VITE_FORMSPREE_ID in your .env file; falls back to the existing form id.
const FORMSPREE_ENDPOINT = `https://formspree.io/f/${import.meta.env.VITE_FORMSPREE_ID ?? 'xdenvlno'}`;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
  const [formState, setFormState] = useState<FormState>('default');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    learnFirst: ''
  });

  // Lock background scroll while the modal is open
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!formData.firstName.trim()) {
      next.firstName = 'Tell us what to call you.';
    }
    if (!formData.email.trim()) {
      next.email = "We'll need an email to add you to the list.";
    } else if (!EMAIL_PATTERN.test(formData.email.trim())) {
      next.email = "That doesn't look like a valid email. Mind double-checking it?";
    }
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

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
      setErrors({});
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
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">

          {/* Backdrop — kept as a dark scrim regardless of page theme */}
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-ink/60 backdrop-blur-sm" />


          {/* Modal */}
          <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="modal-scroll relative w-full max-w-lg max-h-[92dvh] overflow-y-auto bg-surface border border-line rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl">

            {/* Close button */}
            <button
          onClick={handleClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 text-muted hover:text-ink transition-colors">

              <X className="w-5 h-5" />
            </button>

            <AnimatePresence mode="wait">
              {(formState === 'default' || formState === 'loading') &&
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}>

                  <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-ink font-extrabold mb-2 sm:mb-3 pr-8">
                    Be among the first to learn with Grokit.
                  </h2>
                  <p className="text-sm sm:text-base text-body font-sans font-medium mb-6 sm:mb-8">
                    We're building a new way to learn anything. Join the early access list.
                  </p>

                  <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 sm:gap-5">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-sans font-bold text-ink mb-2">
                        First name
                      </label>
                      <input
                  type="text"
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => {
                    setFormData({ ...formData, firstName: e.target.value });
                    if (errors.firstName) setErrors({ ...errors, firstName: undefined });
                  }}
                  className={`w-full px-4 py-2.5 sm:py-3 bg-surface-alt border rounded-xl text-ink font-sans placeholder:text-muted focus:outline-none transition-colors ${
                  errors.firstName ? 'border-red-500 focus:border-red-500' : 'border-line focus:border-teal'}`}
                  placeholder="Your name" />

                      {errors.firstName &&
                  <p className="mt-2 text-sm text-red-600 font-sans font-semibold">{errors.firstName}</p>
                  }
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-sans font-bold text-ink mb-2">
                        Email
                      </label>
                      <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  className={`w-full px-4 py-2.5 sm:py-3 bg-surface-alt border rounded-xl text-ink font-sans placeholder:text-muted focus:outline-none transition-colors ${
                  errors.email ? 'border-red-500 focus:border-red-500' : 'border-line focus:border-teal'}`}
                  placeholder="you@example.com" />

                      {errors.email &&
                  <p className="mt-2 text-sm text-red-600 font-sans font-semibold">{errors.email}</p>
                  }
                    </div>

                    <div>
                      <label htmlFor="learnFirst" className="block text-sm font-sans font-bold text-ink mb-2">
                        What do you want to learn first? <span className="text-muted font-normal">(optional)</span>
                      </label>
                      <input
                  type="text"
                  id="learnFirst"
                  value={formData.learnFirst}
                  onChange={(e) => setFormData({ ...formData, learnFirst: e.target.value })}
                  className="w-full px-4 py-2.5 sm:py-3 bg-surface-alt border border-line rounded-xl text-ink font-sans placeholder:text-muted focus:outline-none focus:border-teal transition-colors"
                  placeholder="e.g., Machine learning, startups, investing..." />

                    </div>

                    <button
                  type="submit"
                  disabled={formState === 'loading'}
                  className="btn-duo relative mt-2 sm:mt-4 px-6 py-3.5 text-base sm:px-8 sm:py-4 sm:text-lg">

                      <span className={`flex items-center justify-center gap-2 transition-opacity ${formState === 'loading' ? 'opacity-0' : 'opacity-100'}`}>
                        Request early access
                        <ArrowRight className="w-5 h-5" />
                      </span>
                      
                      {formState === 'loading' &&
                  <div className="absolute inset-0 flex items-center justify-center">
                          <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />

                        </div>
                  }
                    </button>
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
                className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-teal to-teal-bright flex items-center justify-center">

                    <Check className="w-8 h-8 text-white" />
                  </motion.div>
                  <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-ink font-extrabold mb-3">
                    You're on the list.
                  </h2>
                  <p className="text-body font-sans font-medium mb-6">
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
                className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">

                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </motion.div>
                  <h2 className="font-display text-xl sm:text-2xl text-ink font-extrabold mb-3">
                    Something went wrong on our end.
                  </h2>
                  <p className="text-body font-sans font-medium mb-6">
                    Your details weren't lost. Just try submitting again in a moment.
                  </p>
                  <button
              onClick={() => setFormState('default')}
              className="btn-duo px-6 py-3 text-base">

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