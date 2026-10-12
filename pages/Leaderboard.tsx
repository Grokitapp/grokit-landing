import { Trophy } from 'lucide-react';

import { cardClasses } from './learn/components/GamificationCards';

export default function Leaderboard() {
  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[860px] px-4 py-6 sm:px-7 sm:py-10">
      <h1 className="font-display text-3xl font-extrabold text-white">
        Leaderboard
      </h1>

      <section
        className={`${cardClasses} mt-6 flex flex-col items-center px-5 py-14 text-center sm:px-8`}
      >
        <span
          aria-hidden="true"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-[#202F35] text-orange shadow-[0_4px_0_#0D161A]"
        >
          <Trophy className="h-7 w-7" />
        </span>

        <h2 className="mt-5 font-display text-xl font-extrabold text-white">
          Coming soon
        </h2>

        <p className="mt-2 max-w-md text-sm leading-6 text-[#91A4AC]">
          Soon you’ll level up as you learn, compete and earn XP, and see how
          you rank against other learners. Keep learning so you’re ready.
        </p>
      </section>
    </div>
  );
}