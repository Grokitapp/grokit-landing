import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import welcomeMascot from '../../assets/grokit-welcome-mascot.png';

interface WelcomeProps {
  onContinue: () => void;
  discordInviteUrl: string;
}

export default function Welcome({
  onContinue,
  discordInviteUrl: _discordInviteUrl,
}: WelcomeProps) {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#131F24] text-white">
      {/* ------------------------------------------------------------------ */}
      {/* Background glow */}
      {/* ------------------------------------------------------------------ */}

      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-[16%]
          h-[320px]
          w-[320px]
          -translate-x-1/2
          rounded-full
          bg-orange/20
          blur-[110px]
          sm:top-[15%]
          sm:h-[390px]
          sm:w-[390px]
          sm:bg-orange/20
        "
        aria-hidden="true"
      />

      {/* ------------------------------------------------------------------ */}
      {/* Progress */}
      {/* ------------------------------------------------------------------ */}

      <div
        className="
          absolute
          left-1/2
          top-7
          z-10
          flex
          -translate-x-1/2
          items-center
          gap-4
          sm:top-8
          sm:gap-5
        "
        aria-label="Onboarding progress: step 1 of 5"
      >
        {/* Active step */}
        <span
          className="
            h-[12px]
            w-[32px]
            rounded-full
            bg-orange
          "
        />

        {/* Remaining steps */}
        <span className="h-[12px] w-[12px] rounded-full bg-[#304553]" />
        <span className="h-[12px] w-[12px] rounded-full bg-[#304553]" />
        <span className="h-[12px] w-[12px] rounded-full bg-[#304553]" />
        <span className="h-[12px] w-[12px] rounded-full bg-[#304553]" />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Main content */}
      {/* ------------------------------------------------------------------ */}

      <motion.main
        className="
          relative
          flex
          min-h-[100dvh]
          items-center
          justify-center
          px-5
          pb-8
          pt-24
          sm:px-8
          sm:pb-10
          sm:pt-28
        "
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          ease: 'easeOut',
        }}
      >
        <div
          className="
            flex
            w-full
            max-w-[620px]
            flex-col
            items-center
            text-center
          "
        >
          {/* ---------------------------------------------------------------- */}
          {/* Mascot */}
          {/* ---------------------------------------------------------------- */}

          <motion.div
            className="
              relative
              flex
              h-[210px]
              w-[210px]
              items-center
              justify-center
              sm:h-[250px]
              sm:w-[250px]
              md:h-[270px]
              md:w-[270px]
            "
            initial={{
              opacity: 0,
              scale: 0.9,
              y: 12,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            transition={{
              delay: 0.08,
              duration: 0.45,
              ease: 'easeOut',
            }}
          >
            {/* Glow behind mascot */}
            <div
              className="
                pointer-events-none
                absolute
                left-1/2
                top-1/2
                h-[150px]
                w-[150px]
                -translate-x-1/2
                -translate-y-1/2
                rounded-full
                bg-orange/25
                blur-[65px]
                sm:h-[180px]
                sm:w-[180px]
                sm:bg-orange/30
              "
              aria-hidden="true"
            />

            <img
              src={welcomeMascot}
              alt="Grokit mascot"
              className="
                relative
                z-[1]
                h-auto
                w-[190px]
                max-w-none
                object-contain
                drop-shadow-[0_18px_28px_rgba(0,0,0,0.24)]
                sm:w-[230px]
                md:w-[250px]
              "
              draggable={false}
            />
          </motion.div>

          {/* ---------------------------------------------------------------- */}
          {/* Heading */}
          {/* ---------------------------------------------------------------- */}

          <motion.h1
            className="
              mt-1
              font-display
              text-[30px]
              font-extrabold
              leading-[1.08]
              tracking-tight
              text-white
              sm:mt-2
              sm:text-[40px]
              md:text-[44px]
            "
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.18,
              duration: 0.35,
              ease: 'easeOut',
            }}
          >
            Let&apos;s plan your{' '}
            <span className="text-orange">
              first dive.
            </span>
          </motion.h1>

          {/* ---------------------------------------------------------------- */}
          {/* Description */}
          {/* ---------------------------------------------------------------- */}

          <motion.p
            className="
              mt-4
              max-w-[500px]
              font-sans
              text-[15px]
              font-medium
              leading-[1.55]
              text-[#B6C7D7]
              sm:mt-5
              sm:text-[18px]
              sm:leading-[1.55]
            "
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.24,
              duration: 0.35,
              ease: 'easeOut',
            }}
          >
            Tell Grokit what you&apos;re curious about.
            <br />
            It builds the path.
          </motion.p>

          {/* ---------------------------------------------------------------- */}
          {/* CTA */}
          {/* ---------------------------------------------------------------- */}

          <motion.button
            type="button"
            onClick={onContinue}
            className="
              mt-8
              flex
              h-[56px]
              w-full
              max-w-[565px]
              items-center
              justify-center
              gap-3
              rounded-full
              bg-orange
              px-6
              font-sans
              text-[16px]
              font-extrabold
              text-white
              shadow-[0_4px_0_#C94713]
              transition-all
              duration-150
              hover:brightness-105
              active:translate-y-[2px]
              active:shadow-none
              sm:mt-9
              sm:h-[58px]
              sm:text-[17px]
            "
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.3,
              duration: 0.35,
              ease: 'easeOut',
            }}
            whileTap={{
              scale: 0.985,
            }}
          >
            <span>Let&apos;s go</span>

            <ArrowRight
              className="
                h-[19px]
                w-[19px]
                sm:h-5
                sm:w-5
              "
            />
          </motion.button>

          {/* ---------------------------------------------------------------- */}
          {/* Supporting text */}
          {/* ---------------------------------------------------------------- */}

          <motion.p
            className="
              mt-6
              font-sans
              text-[13px]
              font-medium
              text-[#91A4AC]
              sm:mt-7
              sm:text-[15px]
            "
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              delay: 0.36,
              duration: 0.35,
            }}
          >
            Takes about a minute.
          </motion.p>
        </div>
      </motion.main>
    </div>
  );
}