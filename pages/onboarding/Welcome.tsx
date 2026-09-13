import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { GrokitMascot } from '../../components/Grokitmascot';

interface WelcomeProps {
  onContinue: () => void;
  discordInviteUrl: string;
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
      <path
        fill="currentColor"
        d="M19.54 0c1.02 1.82 1.77 3.8 2.19 5.88A18.3 18.3 0 0 0 16.16 4l-.5 1.01a16.7 16.7 0 0 0-7.32 0L7.84 4a18.3 18.3 0 0 0-5.57 1.88C.77 10.2.5 14.4 1.01 18.55A18.7 18.7 0 0 0 6.6 21.4l1.36-1.84a11.4 11.4 0 0 1-2.15-1.03l.53-.41c4.15 1.94 8.65 1.94 12.75 0l.53.41c-.7.41-1.42.75-2.16 1.03l1.36 1.84a18.7 18.7 0 0 0 5.59-2.85C24.5 12.4 23.2 4.65 19.54 0ZM8.02 15.27c-1.23 0-2.24-1.13-2.24-2.51s1-2.51 2.24-2.51 2.25 1.13 2.24 2.51c0 1.38-1 2.51-2.24 2.51Zm7.96 0c-1.23 0-2.24-1.13-2.24-2.51s1-2.51 2.24-2.51 2.25 1.13 2.24 2.51c0 1.38-1 2.51-2.24 2.51Z"
      />
    </svg>
  );
}

export default function Welcome({ onContinue, discordInviteUrl }: WelcomeProps) {
  return (
    <div className="relative flex-1 min-h-[100dvh] overflow-hidden bg-[#131F24] text-white">
      <div
        className="pointer-events-none absolute left-1/2 top-[13%] h-64 w-64 -translate-x-1/2 rounded-full bg-orange/10 blur-[90px]"
        aria-hidden="true"
      />

      <motion.main
        className="relative flex min-h-[100dvh] flex-col items-center justify-center px-5 py-10 sm:px-8 sm:py-12"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div className="w-full max-w-[820px] text-center">
          <motion.div
            className="mb-5 inline-flex items-center rounded-full border border-[#3A4D55] bg-[#202F35] px-4 py-2 text-sm font-extrabold text-orange shadow-[0_2px_0_#0B1519]"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05, duration: 0.25 }}
          >
            Welcome to Grokit
          </motion.div>

          <motion.div
            className="mb-5 flex justify-center"
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35, ease: 'easeOut' }}
          >
            <GrokitMascot
              size={128}
              pose="wave"
              className="drop-shadow-[0_12px_20px_rgba(0,0,0,0.22)]"
            />
          </motion.div>

          <h1 className="mx-auto max-w-[700px] font-display text-[34px] font-extrabold leading-[1.08] tracking-tight text-white sm:text-[42px] md:text-[48px]">
            Let&apos;s make learning fit <span className="text-orange">your life.</span>
          </h1>

          <p className="mx-auto mt-4 max-w-[560px] font-sans text-[15px] font-medium leading-6 text-[#91A4AC] sm:text-base">
            A few quick choices to personalize your learning experience.
          </p>

          <div className="mx-auto mt-7 grid w-full max-w-[760px] grid-cols-1 gap-3 sm:grid-cols-2">
            <motion.button
              type="button"
              onClick={onContinue}
              className="flex h-[56px] w-full items-center justify-center gap-2 rounded-full bg-orange px-6 font-sans text-[15px] font-extrabold text-white shadow-[0_4px_0_#C94713] transition-all duration-150 hover:brightness-105 active:translate-y-[2px] active:shadow-none"
              whileTap={{ scale: 0.985 }}
            >
              Personalize my Grokit
              <ArrowRight className="h-[18px] w-[18px]" />
            </motion.button>

            <a
              href={discordInviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-[56px] w-full items-center justify-center gap-2.5 rounded-full border border-[#3A4D55] bg-[#202F35] px-6 font-sans text-[15px] font-extrabold text-white shadow-[0_3px_0_#0B1519] transition-all duration-150 hover:border-[#4A5F68] hover:bg-[#26383F] active:translate-y-[2px] active:shadow-none"
            >
              <span className="text-[#9B8CFF]">
                <DiscordIcon />
              </span>
              Join our Discord
            </a>
          </div>

          <p className="mt-6 font-sans text-xs font-medium text-[#647A83] sm:text-sm">
            Your answers help us make Grokit better for you.
          </p>
        </div>
      </motion.main>
    </div>
  );
}
