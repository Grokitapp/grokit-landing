import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import grokitMascot from '../../assets/grokit-hero-mascot.png';

// ─── Shared styles ────────────────────────────────────────────────────────────

const pageClasses = 'min-h-[100dvh] bg-[#131F24] text-white flex flex-col items-center justify-center px-5 relative';
const backButtonClasses = 'absolute top-6 left-6 w-9 h-9 rounded-full flex items-center justify-center text-[#91A4AC] hover:bg-[#202F35] hover:text-white transition-colors';

const eyebrowClasses = 'text-[#91A4AC] font-sans font-semibold text-xs tracking-[0.15em] uppercase mb-3';
const headingClasses = 'font-display text-[28px] sm:text-[34px] font-extrabold text-white text-center mb-8';
const mascotClasses = 'w-36 h-36 sm:w-44 sm:h-44 object-contain mb-6';
const captionClasses = 'text-[#91A4AC] font-sans text-sm text-center mb-10';

const titleClasses = 'font-display text-[28px] sm:text-[34px] font-extrabold text-white mb-6 max-w-[600px]';
const statusRowClasses = 'flex items-center gap-3 mb-8';
const statusIconClasses = 'w-8 h-8 shrink-0 object-contain';
const statusTextClasses = 'text-[#91A4AC] font-sans text-[15px]';
const heroPlaceholderClasses = 'w-full max-w-[900px] h-[300px] sm:h-[380px] rounded-3xl bg-gradient-to-r from-[#202F35] via-[#26383F] to-[#202F35] bg-[length:200%_100%] animate-pulse mb-8';
const heroImageClasses = 'w-full max-w-[900px] h-[300px] sm:h-[380px] rounded-3xl object-cover mb-8';
const bodyClasses = 'text-[#91A4AC] font-sans text-[15px] sm:text-base leading-relaxed max-w-[600px] mb-8';

const actionButtonClasses = `
  w-full max-w-[900px] min-h-[52px] rounded-full font-sans font-extrabold text-[15px]
  flex items-center justify-center gap-2 transition-all
`;
const actionButtonDisabledClasses = 'bg-[#202F35]/60 text-[#60757E] cursor-not-allowed';
const actionButtonReadyClasses = `
  bg-orange text-white shadow-[0_4px_0_#C94713] hover:brightness-105
  active:translate-y-[2px] active:shadow-none
`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocationState {
  prompt?: string;
  personalized?: boolean;
}

type Stage = 'building' | 'streaming' | 'ready';

const STATUS_MESSAGES = [
  'Calling course curation fairy...',
  'Mapping out your learning path...',
  'Sketching the first lessons...',
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Generating() {
  const navigate = useNavigate();
  const location = useLocation();
  const { prompt } = (location.state as LocationState) ?? {};

  const [stage, setStage] = useState<Stage>('building');
  const [typedTitle, setTypedTitle] = useState('');
  const [statusIndex, setStatusIndex] = useState(0);

  // Mock generated data — replace with real API response once wired
  const fullTitle = useRef(deriveTitle(prompt)).current;
  const courseId = useRef('mock-course-id').current;

  const goBack = () => navigate(-1);

  // Stage 1 → 2: after a short "building" beat, start streaming the title
  useEffect(() => {
    const timer = setTimeout(() => setStage('streaming'), 1400);
    return () => clearTimeout(timer);
  }, []);

  // Stage 2: type out the title character by character
  useEffect(() => {
    if (stage !== 'streaming') return;

    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setTypedTitle(fullTitle.slice(0, i));
      if (i >= fullTitle.length) {
        clearInterval(interval);
        setTimeout(() => setStage('ready'), 900);
      }
    }, 35);

    return () => clearInterval(interval);
  }, [stage, fullTitle]);

  // Rotate status message while streaming
  useEffect(() => {
    if (stage !== 'streaming') return;
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 1600);
    return () => clearInterval(interval);
  }, [stage]);

  const handleGoToCourse = () => {
    if (stage !== 'ready') return;
    navigate(`/learn/course/${courseId}`);
  };

  if (stage === 'building') {
    return (
      <div className={pageClasses}>
        <button type="button" onClick={goBack} aria-label="Go back" className={backButtonClasses}>
          <ChevronLeft className="w-5 h-5" />
        </button>

        <p className={eyebrowClasses}>Generating lesson plan</p>
        <h1 className={headingClasses}>Building your course</h1>
        <img src={grokitMascot} alt="" className={mascotClasses} />
        <p className={captionClasses}>This usually takes a few seconds.</p>
      </div>
    );
  }

  return (
    <div className={`${pageClasses} justify-center`}>
      <div className="w-full flex flex-col items-center">
        <h1 className={titleClasses}>
          {typedTitle}
          {stage === 'streaming' && <span className="animate-pulse">|</span>}
        </h1>

        {stage === 'streaming' ? (
          <>
            <div className={statusRowClasses}>
              <img src={grokitMascot} alt="" className={statusIconClasses} />
              <span className={statusTextClasses}>{STATUS_MESSAGES[statusIndex]}</span>
            </div>
            <div className={heroPlaceholderClasses} />
          </>
        ) : (
          <>
            <p className={bodyClasses}>
              Welcome! Together, we will explore this topic step by step, building real
              understanding from the ground up.
            </p>
            {/* Swap for the real generated hero image once the API is wired */}
            <div className={`${heroImageClasses} bg-gradient-to-br from-teal-700 to-emerald-800`} />
          </>
        )}

        <button
          type="button"
          onClick={handleGoToCourse}
          disabled={stage !== 'ready'}
          className={`${actionButtonClasses} ${stage === 'ready' ? actionButtonReadyClasses : actionButtonDisabledClasses}`}
        >
          {stage === 'ready' ? 'Go to your course' : 'Creating your course...'}
        </button>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveTitle(prompt?: string): string {
  if (!prompt) return 'Your New Course';
  const cleaned = prompt.replace(/^i want to learn about\s*/i, '').trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}