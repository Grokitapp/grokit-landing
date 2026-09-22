import { useNavigate, useLocation } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import grokitOcto from '../../assets/grokit-octo.png';

// ─── Shared styles ────────────────────────────────────────────────────────────

const pageClasses = 'min-h-[100dvh] bg-[#131F24] text-white flex flex-col items-center justify-center px-5 relative';
const backButtonClasses = 'absolute top-6 left-6 w-9 h-9 rounded-full flex items-center justify-center text-[#91A4AC] hover:bg-[#202F35] hover:text-white transition-colors';
const mascotClasses = 'w-40 h-40 sm:w-48 sm:h-48 object-contain mb-8';
const headingClasses = 'font-display text-[28px] sm:text-[34px] font-extrabold text-white text-center mb-4';
const bodyClasses = 'text-[#91A4AC] font-sans text-[15px] sm:text-base text-center max-w-[480px] leading-relaxed mb-2';
const jumpInClasses = 'text-[#91A4AC] font-sans text-[15px] sm:text-base text-center max-w-[480px] leading-relaxed mb-10';
const buttonGroupClasses = 'w-full max-w-[420px] flex flex-col gap-3';
const primaryButtonClasses = `
  w-full min-h-[52px] rounded-full bg-orange text-white font-sans font-extrabold text-[15px]
  shadow-[0_4px_0_#C94713] hover:brightness-105 active:translate-y-[2px] active:shadow-none transition-all
`;
const secondaryButtonClasses = `
  w-full min-h-[52px] rounded-full bg-[#202F35] border border-[#37464F] text-white font-sans font-extrabold text-[15px]
  hover:border-orange/40 active:translate-y-[1px] transition-all
`;
const noteClasses = 'text-[#60757E] font-sans text-xs text-center mt-6';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocationState {
  prompt?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Personalize() {
  const navigate = useNavigate();
  const location = useLocation();
  const { prompt } = (location.state as LocationState) ?? {};

  const goBack = () => navigate(-1);

  const handlePersonalizeFirst = () => {
    // Later: route to a short 3–4 question stepper before generating
    navigate('/learn/generating', { state: { prompt, personalized: true } });
  };

  const handleCreateDirectly = () => {
    navigate('/learn/generating', { state: { prompt, personalized: false } });
  };

  return (
    <div className={pageClasses}>
      <button type="button" onClick={goBack} aria-label="Go back" className={backButtonClasses}>
        <ChevronLeft className="w-5 h-5" />
      </button>

      <img src={grokitOcto} alt="" className={mascotClasses} />

      <h1 className={headingClasses}>Personalize your course?</h1>

      <p className={bodyClasses}>
        Tell us a bit about your experience with this topic so we can tailor the course to you.
      </p>
      <p className={jumpInClasses}>Or jump straight in by creating the course directly.</p>

      <div className={buttonGroupClasses}>
        <button type="button" onClick={handlePersonalizeFirst} className={primaryButtonClasses}>
          Personalize my course first
        </button>
        <button type="button" onClick={handleCreateDirectly} className={secondaryButtonClasses}>
          Create course directly
        </button>
      </div>

      <p className={noteClasses}>You can always personalize later in course settings</p>
    </div>
  );
}