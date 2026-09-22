import { useEffect, useState } from 'react';
import { X, Headphones, Radio } from 'lucide-react';
import grokitMascot from '../../../assets/grokit-hero-mascot.png';

// ─── Shared styles ────────────────────────────────────────────────────────────

const overlayClasses = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-5';
const modalClasses = 'w-full max-w-[540px] bg-[#FDF9EC] rounded-3xl p-7 sm:p-8 relative text-[#131F24]';
const closeButtonClasses = 'absolute top-5 right-5 text-[#60757E] hover:text-[#131F24] transition-colors';
const titleClasses = 'font-display text-2xl sm:text-[28px] font-extrabold mb-3';
const bodyClasses = 'text-[#5A4A3A] font-sans text-[15px] sm:text-base leading-relaxed mb-8';

const generatingWrapClasses = 'flex flex-col items-center py-6';
const generatingMascotClasses = 'w-16 h-16 object-contain mb-5';
const generatingLabelClasses = 'font-sans font-semibold text-[15px] mb-1';
const generatingSubClasses = 'text-[#8A7A6A] font-sans text-sm text-center';

const buttonBaseClasses = 'w-full min-h-[52px] rounded-full font-sans font-extrabold text-[15px] flex items-center justify-center gap-2 transition-all mb-3';
const primaryButtonClasses = `${buttonBaseClasses} bg-[#87CEFA] text-[#131F24] shadow-[0_4px_0_#5FA8D3] hover:brightness-105 active:translate-y-[2px] active:shadow-none`;
const secondaryButtonClasses = `${buttonBaseClasses} bg-white border border-[#E5DCC8] text-[#131F24] hover:border-[#131F24]/30`;
const disabledButtonClasses = `${buttonBaseClasses} bg-[#E5DCC8] text-[#8A7A6A] cursor-not-allowed`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LessonMeta {
  id: string;
  title: string;
  hook: string;
  hasContent: boolean; // false = needs generation on open (lazy generation)
}

interface LessonGenerateModalProps {
  lesson: LessonMeta;
  onClose: () => void;
  onStart: (lessonId: string) => void;
  onPodcast: (lessonId: string) => void;
  onLiveChallenge: (lessonId: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LessonGenerateModal({
  lesson,
  onClose,
  onStart,
  onPodcast,
  onLiveChallenge,
}: LessonGenerateModalProps) {
  const [ready, setReady] = useState(lesson.hasContent);

  useEffect(() => {
    if (lesson.hasContent) return;

    // Mock generation delay — replace with the real per-lesson generation
    // Lambda call here. On success, set ready(true).
    const timer = setTimeout(() => setReady(true), 2200);
    return () => clearTimeout(timer);
  }, [lesson.hasContent]);

  return (
    <div className={overlayClasses}>
      <div className={modalClasses}>
        <button type="button" onClick={onClose} aria-label="Close" className={closeButtonClasses}>
          <X className="w-5 h-5" />
        </button>

        <h2 className={titleClasses}>{lesson.title}</h2>
        <p className={bodyClasses}>{lesson.hook}</p>

        {!ready ? (
          <div className={generatingWrapClasses}>
            <img src={grokitMascot} alt="" className={generatingMascotClasses} />
            <p className={generatingLabelClasses}>Generating your lesson...</p>
            <p className={generatingSubClasses}>Using our most capable models. This may take a little longer.</p>
            <div className={`${disabledButtonClasses} mt-6`}>Generating</div>
          </div>
        ) : (
          <>
            <button type="button" onClick={() => onStart(lesson.id)} className={primaryButtonClasses}>
              Start first 3 minute lesson
            </button>
            <button type="button" onClick={() => onPodcast(lesson.id)} className={secondaryButtonClasses}>
              <Headphones className="w-4 h-4" /> Podcast
            </button>
            <button type="button" onClick={() => onLiveChallenge(lesson.id)} className={secondaryButtonClasses}>
              <Radio className="w-4 h-4" /> Live Challenge
            </button>
          </>
        )}
      </div>
    </div>
  );
}