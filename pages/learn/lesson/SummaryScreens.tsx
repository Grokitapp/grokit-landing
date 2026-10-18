import { useEffect, useState } from 'react';
import { animate, motion, useReducedMotion } from 'framer-motion';
import { Check, Flame, Target, Zap } from 'lucide-react';

import { GrokitMascot } from '../../../components/Grokitmascot';
import { useGamification } from '../../../lib/gamification';
import { playSound } from '../../../lib/sounds';
import { primaryButton, secondaryButton } from './lessonTheme';

// ─── Count-up number ──────────────────────────────────────────────────────────

function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(reduceMotion ? to : 0);

  useEffect(() => {
    if (reduceMotion) {
      setValue(to);
      return;
    }

    const controls = animate(0, to, {
      duration: 0.9,
      delay: 0.35,
      ease: 'easeOut',
      onUpdate: (latest) => setValue(Math.round(latest)),
    });

    return () => controls.stop();
  }, [to, reduceMotion]);

  return (
    <>
      {value}
      {suffix}
    </>
  );
}

// ─── Lesson complete ──────────────────────────────────────────────────────────

interface CompleteScreenProps {
  lessonTitle: string;
  xp: number;
  correct: number;
  total: number;
  alreadyCompleted: boolean;
  onContinue: () => void;
  onReview: () => void;
}

function accuracyLabel(percent: number): string {
  if (percent === 100) return 'Perfect';
  if (percent >= 80) return 'Great';
  if (percent >= 60) return 'Good';

  return 'Keep going';
}

export function CompleteScreen({
  lessonTitle,
  xp,
  correct,
  total,
  alreadyCompleted,
  onContinue,
  onReview,
}: CompleteScreenProps) {
  const reduceMotion = useReducedMotion();
  const percent = total > 0 ? Math.round((correct / total) * 100) : null;

  // A little fanfare, only when XP was actually earned.
  useEffect(() => {
    if (!alreadyCompleted) playSound('complete');
  }, [alreadyCompleted]);

  return (
    <div className="mx-auto flex min-h-[88dvh] w-full max-w-[560px] flex-col items-center justify-center px-5 py-10 text-center">
      <motion.div
        initial={reduceMotion ? false : { scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 16 }}
      >
        <GrokitMascot pose="celebrate" size={130} />
      </motion.div>

      <h1 className="mt-6 font-display text-4xl font-extrabold text-[#FFB020]">
        {alreadyCompleted ? 'Already completed' : 'Lesson complete!'}
      </h1>

      <p className="mt-2 max-w-md text-base leading-7 text-[#91A4AC]">
        {alreadyCompleted ? (
          <>
            You’d already finished <span className="font-bold text-white">{lessonTitle}</span>, so no new XP this time.
          </>
        ) : (
          <>
            Nice work. You just finished <span className="font-bold text-white">{lessonTitle}</span>.
          </>
        )}
      </p>

      {!alreadyCompleted && (
        <div className="mt-8 grid w-full max-w-[420px] grid-cols-2 gap-3">
          <div className="overflow-hidden rounded-2xl border-2 border-[#FFB020] bg-[#2D2920]">
            <p className="bg-[#FFB020] py-1 text-xs font-extrabold uppercase tracking-wider text-[#2D2920]">
              Total XP
            </p>
            <p className="flex items-center justify-center gap-1.5 py-4 font-display text-3xl font-extrabold text-[#FFB020]">
              <Zap className="h-6 w-6 fill-[#FFB020]" aria-hidden="true" />
              <CountUp to={xp} />
            </p>
          </div>

          {percent !== null && (
            <div className="overflow-hidden rounded-2xl border-2 border-[#3DDC84] bg-[#1C3027]">
              <p className="bg-[#3DDC84] py-1 text-xs font-extrabold uppercase tracking-wider text-[#0E2418]">
                {accuracyLabel(percent)}
              </p>
              <p className="flex items-center justify-center gap-1.5 py-4 font-display text-3xl font-extrabold text-[#3DDC84]">
                <Target className="h-6 w-6" aria-hidden="true" />
                <CountUp to={percent} suffix="%" />
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-10 flex w-full max-w-[420px] flex-col-reverse gap-3 sm:flex-row">
        <button type="button" onClick={onReview} className={`${secondaryButton} flex-1`}>
          Review lesson
        </button>
        <button type="button" onClick={onContinue} className={`${primaryButton} flex-1`} autoFocus>
          Continue
        </button>
      </div>
    </div>
  );
}

// ─── Streak ───────────────────────────────────────────────────────────────────

const FALLBACK_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function StreakScreen({ onContinue }: { onContinue: () => void }) {
  const reduceMotion = useReducedMotion();
  const { stats } = useGamification();

  // The lesson was just completed, so today always counts, even if the
  // progress list has not caught up yet.
  const streak = Math.max(stats?.currentStreak ?? 0, 1);

  const week =
    stats?.week.map((day) => ({
      key: day.key,
      label: day.label,
      active: day.isToday ? true : day.active,
      isToday: day.isToday,
    })) ??
    FALLBACK_WEEK.map((label) => ({ key: label, label, active: false, isToday: false }));

  return (
    <div className="mx-auto flex min-h-[88dvh] w-full max-w-[560px] flex-col items-center justify-center px-5 py-10 text-center">
      <motion.div
        initial={reduceMotion ? false : { scale: 0.5, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
      >
        <Flame className="h-28 w-28 fill-[#F4611F] text-[#FFB020]" aria-hidden="true" />
      </motion.div>

      <p className="mt-4 font-display text-7xl font-extrabold leading-none text-[#FFB020]">
        <CountUp to={streak} />
      </p>
      <p className="mt-2 font-display text-2xl font-extrabold text-[#FFB020]">
        day streak
      </p>

      <div className="mt-8 w-full max-w-[400px] rounded-2xl border-2 border-[#2C3E4A] bg-[#18252C] p-4">
        <ul className="flex justify-between" aria-label="This week">
          {week.map((day) => (
            <li key={day.key} className="flex flex-col items-center gap-2">
              <span className={`text-xs font-extrabold ${day.isToday ? 'text-[#FFB020]' : 'text-[#687D87]'}`}>
                {day.label.slice(0, 2)}
              </span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  day.active ? 'bg-[#FFB020]' : 'bg-[#263640]'
                }`}
              >
                {day.active && <Check className="h-4 w-4 text-[#2D2920]" strokeWidth={3.5} aria-label="Done" />}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-4 border-t border-[#2C3E4A] pt-4 text-sm font-semibold leading-6 text-[#D5DEE3]">
          {streak > 1
            ? 'You’re on a roll. Finish a lesson tomorrow to keep it going.'
            : 'Your streak has started. Finish a lesson tomorrow to keep it going.'}
        </p>
      </div>

      <button type="button" onClick={onContinue} className={`${primaryButton} mt-10 w-full max-w-[400px]`} autoFocus>
        Continue
      </button>
    </div>
  );
}