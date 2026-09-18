import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { getProfile } from '../lib/profile';
import { HeroGraphic } from './Herographic';

interface HeroProps {
  onOpenWaitlist: () => void;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay: 0.1, ease: easeOut },
};

const fadeInRight = {
  initial: { opacity: 0, scale: 0.9, x: 20 },
  animate: { opacity: 1, scale: 1, x: 0 },
  transition: { duration: 0.8, delay: 0.2, ease: easeOut },
};

const buttonMotion = {
  whileHover: { y: -1 },
  whileTap: { scale: 0.98 },
};

const sectionClasses = 'relative pt-28 pb-14 sm:pt-32 sm:pb-16 md:pt-36 md:pb-20 bg-surface overflow-hidden';
const containerClasses = 'max-w-[1140px] mx-auto px-5 md:px-16';
const gridClasses = 'grid md:grid-cols-2 gap-10 md:gap-12 lg:gap-16 items-center';
const leftColumnClasses = 'order-2 md:order-1 text-center md:text-left';
const rightColumnClasses = 'order-1 md:order-2 w-full flex justify-center md:justify-end';
const headingClasses = 'font-display text-[36px] sm:text-5xl lg:text-[56px] text-ink font-extrabold leading-[1.08] tracking-tight mb-6';
const subtitleClasses = 'text-lg md:text-xl text-body font-sans font-medium leading-relaxed max-w-md mx-auto md:mx-0 mb-9 md:mb-10';
const buttonRowClasses = 'flex flex-col sm:flex-row items-center md:items-start justify-center md:justify-start gap-3 sm:gap-4';
const primaryButtonClasses = 'btn-duo w-full sm:w-auto px-9 py-4 text-lg justify-center';
const outlineButtonClasses = 'btn-duo-outline w-full sm:w-auto px-9 py-4 text-lg justify-center';

export function Hero({ onOpenWaitlist }: HeroProps) {
  const navigate = useNavigate();

  const handleStartLearning = async () => {
    try {
      const profile = await getProfile();
      // Returning users who completed onboarding go directly to learning
      if (profile?.onboardingCompleted) return navigate('/learn');
      // Authenticated but not onboarded
      navigate('/onboarding');
    } catch {
      // Not authenticated — onboarding handles auth
      navigate('/onboarding');
    }
  };

  return (
    <section className={sectionClasses}>
      <div className={containerClasses}>
        <div className={gridClasses}>
          {/* LEFT — Hero copy */}
          <motion.div className={leftColumnClasses} {...fadeUp}>
            <span className="eyebrow block mb-5 md:mb-6">Now building</span>

            <h1 className={headingClasses}>
              The smartest way to learn <span className="text-orange">anything</span>
            </h1>

            <p className={subtitleClasses}>
              Grounded in real knowledge. Built around you.
            </p>

            <div className={buttonRowClasses}>
              <motion.button
                type="button"
                onClick={handleStartLearning}
                className={primaryButtonClasses}
                {...buttonMotion}
              >
                Start learning
                <ArrowRight className="w-5 h-5" />
              </motion.button>

              <motion.button
                type="button"
                onClick={onOpenWaitlist}
                className={outlineButtonClasses}
                {...buttonMotion}
              >
                Join the waitlist
              </motion.button>
            </div>
          </motion.div>

          {/* RIGHT — Mascot illustration */}
          <motion.div className={rightColumnClasses} {...fadeInRight}>
            <HeroGraphic />
          </motion.div>
        </div>
      </div>
    </section>
  );
}