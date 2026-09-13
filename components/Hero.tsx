import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';
import { HeroGraphic } from './Herographic';
import { ArrowRight } from 'lucide-react';

interface HeroProps {
  onOpenWaitlist: () => void;
}

export function Hero({ onOpenWaitlist }: HeroProps) {
  const navigate = useNavigate();

  return (
    <section
      className="
        relative
        pt-28
        pb-14
        sm:pt-32
        sm:pb-16
        md:pt-36
        md:pb-20
        bg-surface
        overflow-hidden
      "
    >
      <div className="max-w-[1140px] mx-auto px-5 md:px-16">
        <div
          className="
            grid
            md:grid-cols-2
            gap-10
            md:gap-12
            lg:gap-16
            items-center
          "
        >
          {/* LEFT — Hero copy */}
          <motion.div
            className="
              order-2
              md:order-1
              text-center
              md:text-left
            "
            initial={{
              opacity: 0,
              y: 30,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.8,
              delay: 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {/* Eyebrow */}
            <span className="eyebrow block mb-5 md:mb-6">
              Now building
            </span>

            {/* Heading */}
            <h1
              className="
                font-display
                text-[36px]
                sm:text-5xl
                lg:text-[56px]
                text-ink
                font-extrabold
                leading-[1.08]
                tracking-tight
                mb-6
              "
            >
              The smartest way to learn{' '}
              <span className="text-orange">
                anything
              </span>
            </h1>

            {/* Description */}
            <p
              className="
                text-lg
                md:text-xl
                text-body
                font-sans
                font-medium
                leading-relaxed
                max-w-md
                mx-auto
                md:mx-0
                mb-9
                md:mb-10
              "
            >
              Grounded in real knowledge. Built around you.
            </p>

            {/* Buttons */}
            <div
              className="
                flex
                flex-col
                sm:flex-row
                items-center
                md:items-start
                justify-center
                md:justify-start
                gap-3
                sm:gap-4
              "
            >
              {/* Start learning */}
              <motion.button
                type="button"
                onClick={() => navigate('/onboarding')}
                className="
                  btn-duo
                  w-full
                  sm:w-auto
                  px-9
                  py-4
                  text-lg
                  justify-center
                "
                whileHover={{
                  y: -1,
                }}
                whileTap={{
                  scale: 0.98,
                }}
              >
                Start learning

                <ArrowRight className="w-5 h-5" />
              </motion.button>

              {/* Waitlist */}
              <motion.button
                type="button"
                onClick={onOpenWaitlist}
                className="
                  btn-duo-outline
                  w-full
                  sm:w-auto
                  px-9
                  py-4
                  text-lg
                  justify-center
                "
                whileHover={{
                  y: -1,
                }}
                whileTap={{
                  scale: 0.98,
                }}
              >
                Join the waitlist
              </motion.button>
            </div>
          </motion.div>

          {/* RIGHT — Mascot illustration */}
          <motion.div
            className="
              order-1
              md:order-2
              w-full
              flex
              justify-center
              md:justify-end
            "
            initial={{
              opacity: 0,
              scale: 0.9,
              x: 20,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              x: 0,
            }}
            transition={{
              duration: 0.8,
              delay: 0.2,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <HeroGraphic />
          </motion.div>
        </div>
      </div>
    </section>
  );
}