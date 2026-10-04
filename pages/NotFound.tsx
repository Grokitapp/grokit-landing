import { Link, useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { GrokitLogo } from '../components/Grokitlogo';
import notFoundMascot from '../assets/grokit-404-mascot.png';

export default function NotFound() {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/learn', { replace: true });
    }
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#03131E] text-white">
      {/* ================================================================
          BACKGROUND
          ================================================================ */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        {/* Main background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(8,61,88,0.42)_0%,rgba(3,28,42,0.22)_38%,#03131E_82%)]" />

        {/* Soft top light */}
        <div className="absolute left-1/2 top-[-180px] h-[420px] w-[650px] -translate-x-1/2 rounded-full bg-[#0A6B9C]/15 blur-[110px]" />

        {/* Subtle orange glow behind mascot */}
        <div className="absolute left-1/2 top-[36%] h-[260px] w-[360px] -translate-x-1/2 rounded-full bg-[#FF6B00]/8 blur-[100px]" />

        {/* Bottom atmospheric glow */}
        <div className="absolute bottom-[-180px] left-1/2 h-[350px] w-[800px] -translate-x-1/2 rounded-full bg-[#06334B]/25 blur-[110px]" />

        {/* Subtle underwater particles */}
        <span className="absolute left-[28%] top-[24%] h-1 w-1 rounded-full bg-[#7EC5E2]/25" />
        <span className="absolute left-[54%] top-[14%] h-1.5 w-1.5 rounded-full bg-[#7EC5E2]/20" />
        <span className="absolute right-[29%] top-[28%] h-1 w-1 rounded-full bg-[#7EC5E2]/20" />
        <span className="absolute left-[19%] top-[60%] h-1 w-1 rounded-full bg-[#7EC5E2]/15" />
        <span className="absolute right-[18%] top-[55%] h-1 w-1 rounded-full bg-[#7EC5E2]/15" />
        <span className="absolute right-[32%] bottom-[17%] h-1 w-1 rounded-full bg-[#7EC5E2]/15" />

        {/* Small bubbles */}
        <span className="absolute left-[38%] top-[21%] h-5 w-5 rounded-full border border-[#4E9AC0]/35 bg-[#1C7195]/8" />

        <span className="absolute left-[57%] top-[30%] h-2.5 w-2.5 rounded-full border border-[#4E9AC0]/25" />

        <span className="absolute right-[27%] top-[38%] h-3 w-3 rounded-full border border-[#4E9AC0]/25" />
      </div>

      {/* ================================================================
          FIXED HEADER
          
          Same visual position as the Terms / Privacy pages.
          ================================================================ */}

      <header className="fixed inset-x-0 top-0 z-50">
        {/* Very subtle top blur */}
        <div
          aria-hidden="true"
          className="
            absolute
            inset-x-0
            top-0
            h-[105px]
            bg-[#03131E]/30
            backdrop-blur-[6px]
          "
        />

        <div
          className="
            relative
            flex
            items-center
            gap-4
            px-6
            pt-6
            sm:px-8
            sm:pt-8
          "
        >
          {/* Back button */}
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="
              flex
              h-[54px]
              w-[54px]
              shrink-0
              items-center
              justify-center
              rounded-full
              border
              border-[#294454]
              bg-[#071A27]/55
              text-[#A7B8C2]
              backdrop-blur-sm
              transition-all
              duration-200
              hover:border-[#536C7C]
              hover:bg-[#0A2232]/75
              hover:text-white
              active:scale-95
              focus:outline-none
              focus-visible:border-[#FF6B00]
              focus-visible:text-white
            "
          >
            <ArrowLeft
              className="h-[23px] w-[23px]"
              strokeWidth={1.8}
            />
          </button>

          {/* Grokit logo */}
          <Link
            to="/"
            aria-label="Go to Grokit home"
            className="
              flex
              shrink-0
              items-center
              transition-opacity
              duration-200
              hover:opacity-90
            "
          >
            <GrokitLogo
              size={88}
              className="h-auto w-auto"
            />
          </Link>
        </div>
      </header>

      {/* ================================================================
          MAIN CONTENT
          ================================================================ */}

      <main
        className="
          relative
          z-10
          flex
          min-h-[100dvh]
          items-center
          justify-center
          px-5
          pb-10
          pt-[110px]
          sm:px-8
          sm:pt-[120px]
        "
      >
        <div
          className="
            flex
            w-full
            max-w-[900px]
            flex-col
            items-center
            text-center
          "
        >
          {/* ============================================================
              MASCOT
              ============================================================ */}

          <div
            className="
              relative
              flex
              h-[270px]
              w-full
              items-center
              justify-center
              sm:h-[330px]
              md:h-[360px]
            "
          >
            {/* Soft glow */}
            <div
              aria-hidden="true"
              className="
                absolute
                left-1/2
                top-1/2
                h-[210px]
                w-[280px]
                -translate-x-1/2
                -translate-y-1/2
                rounded-full
                bg-[#FF6B00]/10
                blur-[80px]
              "
            />

            <img
              src={notFoundMascot}
              alt="Grokit octopus looking confused"
              className="
                relative
                z-10
                h-auto
                w-[250px]
                max-w-[80vw]
                object-contain
                drop-shadow-[0_22px_35px_rgba(0,0,0,0.35)]
                sm:w-[310px]
                md:w-[350px]
              "
            />
          </div>

          {/* ============================================================
              TEXT
              ============================================================ */}

          <div className="-mt-2 sm:-mt-5">
            <h1
              className="
                font-display
                text-[38px]
                font-extrabold
                leading-[1.05]
                tracking-[-0.035em]
                text-white
                sm:text-[48px]
                md:text-[54px]
              "
            >
              This page drifted away
            </h1>

            <p
              className="
                mt-4
                font-sans
                text-[17px]
                leading-relaxed
                text-[#AABDCB]
                sm:text-[19px]
                md:text-[21px]
              "
            >
              Let’s get you back to your path.
            </p>
          </div>

          {/* ============================================================
              ACTIONS
              ============================================================ */}

          <div
            className="
              mt-8
              flex
              w-full
              flex-col
              items-center
              justify-center
              gap-4
              sm:mt-9
              sm:w-auto
              sm:flex-row
              sm:gap-7
            "
          >
            {/* Back to Learn */}
            <Link
              to="/learn"
              className="
                group
                flex
                h-[62px]
                w-full
                max-w-[300px]
                items-center
                justify-center
                gap-4
                rounded-full
                bg-[#FF6B00]
                px-8
                font-display
                text-[18px]
                font-extrabold
                text-white
                shadow-[0_7px_0_#C94713,0_0_30px_rgba(255,107,0,0.28)]
                transition-all
                duration-200
                hover:brightness-110
                hover:shadow-[0_7px_0_#C94713,0_0_40px_rgba(255,107,0,0.38)]
                active:translate-y-[3px]
                active:shadow-[0_3px_0_#C94713]
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-[#FF8A3D]
                focus-visible:ring-offset-2
                focus-visible:ring-offset-[#03131E]
                sm:w-[300px]
              "
            >
              <span>Back to Learn</span>

              <ArrowRight
                className="
                  h-5
                  w-5
                  transition-transform
                  duration-200
                  group-hover:translate-x-1
                "
                strokeWidth={2}
              />
            </Link>

            {/* Home */}
            <Link
              to="/"
              className="
                flex
                h-[62px]
                w-full
                max-w-[190px]
                items-center
                justify-center
                rounded-full
                border
                border-[#345066]
                bg-[#071925]/30
                px-8
                font-sans
                text-[17px]
                font-semibold
                text-[#D0DCE5]
                backdrop-blur-sm
                transition-all
                duration-200
                hover:border-[#5A7488]
                hover:bg-[#0A2231]/60
                hover:text-white
                active:scale-[0.98]
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-[#FF8A3D]
                focus-visible:ring-offset-2
                focus-visible:ring-offset-[#03131E]
                sm:w-[170px]
              "
            >
              Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}