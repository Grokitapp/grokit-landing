import { Link, useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { GrokitLogo } from '../components/Grokitlogo';
import notFoundMascot from '../assets/grokit-404-mascot.png';

export default function NotFound() {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <div
      className="
        relative isolate
        min-h-[100dvh]
        overflow-hidden
        bg-[#03131E]
        text-white
      "
    >
      {/* ================================================================
          BACKGROUND
          ================================================================ */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          fixed inset-0 -z-10
          bg-[radial-gradient(
            ellipse_at_50%_35%,
            #082B40_0%,
            #041C2B_42%,
            #03131E_82%
          )]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          fixed
          left-1/2
          top-[38%]
          h-[330px]
          w-[460px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-[#0A5577]/10
          blur-[110px]
        "
      />

      {/* ================================================================
          HEADER
          ================================================================ */}

      <header
        className="
          absolute
          inset-x-0
          top-0
          z-50
          px-5
          pt-5
          sm:px-6
          sm:pt-6
          md:px-7
          md:pt-7
          lg:px-8
          lg:pt-8
        "
      >
        <div className="flex items-center gap-2">
          {/* Back */}
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-full
              text-[#71858E]
              transition-colors
              hover:bg-white/[0.04]
              hover:text-white
              active:scale-95
              focus-visible:outline-2
              focus-visible:outline-offset-2
              focus-visible:outline-[#FF6B00]
            "
          >
            <ArrowLeft
              className="h-[22px] w-[22px]"
              strokeWidth={1.8}
            />
          </button>

          {/* Grokit logo */}
          <Link
            to="/"
            aria-label="Grokit home"
            className="
              flex
              h-[42px]
              w-[112px]
              shrink-0
              items-center
              overflow-hidden
            "
          >
            <GrokitLogo
              size={112}
              className="
                !h-auto
                !w-[112px]
                !max-w-none
                object-contain
              "
            />
          </Link>
        </div>
      </header>

      {/* ================================================================
          MAIN CONTENT
          ================================================================ */}

      <main
        className="
          flex
          min-h-[100dvh]
          w-full
          items-center
          justify-center
          px-5
          pb-8
          pt-[86px]
          sm:px-6
          sm:pb-10
          sm:pt-[92px]
        "
      >
        <div
          className="
            flex
            w-full
            max-w-[800px]
            flex-col
            items-center
            justify-center
            text-center
          "
        >
          {/* ============================================================
              MASCOT
              ============================================================ */}

          <div
            className="
              flex
              w-full
              items-center
              justify-center
            "
          >
            <img
              src={notFoundMascot}
              alt="Confused Grokit octopus"
              width={275}
              height={238}
              className="
                block
                h-auto
                w-[225px]
                max-w-[78vw]
                object-contain
                drop-shadow-[0_16px_30px_rgba(0,0,0,0.24)]
                sm:w-[250px]
                md:w-[275px]
              "
            />
          </div>

          {/* ============================================================
              ERROR LABEL + HEADING
              ============================================================ */}

          <div
            className="
              mt-7
              flex
              flex-col
              items-center
            "
          >
            <p
              className="
                font-sans
                text-[11px]
                font-extrabold
                uppercase
                tracking-[0.16em]
                text-[#71858E]
                sm:text-[12px]
              "
            >
              404 · Page not found
            </p>

            <h1
              className="
                mt-2.5
                font-display
                text-[34px]
                font-extrabold
                leading-[1.08]
                tracking-[-0.025em]
                text-white
                sm:text-[40px]
                md:text-[46px]
              "
            >
              This page drifted away
            </h1>

            <p
              className="
                mt-3
                font-sans
                text-[16px]
                leading-relaxed
                text-[#9DB1BC]
                sm:text-[17px]
                md:text-[18px]
              "
            >
              Let’s get you back to your path.
            </p>
          </div>

          {/* ============================================================
              BUTTONS
              ============================================================ */}

          <div
            className="
              mt-8
              flex
              w-full
              flex-col
              items-center
              justify-center
              gap-3
              sm:mt-9
              sm:w-auto
              sm:flex-row
              sm:gap-4
            "
          >
            {/* Back to Learn */}
            <Link
              to="/learn"
              className="
                group
                flex
                h-[54px]
                w-full
                max-w-[250px]
                items-center
                justify-center
                gap-3
                rounded-full
                bg-[#FF6B00]
                px-7
                font-sans
                text-[15px]
                font-extrabold
                text-white
                shadow-[0_4px_0_#C94713]
                transition-all
                duration-150
                hover:brightness-110
                active:translate-y-[2px]
                active:shadow-[0_2px_0_#C94713]
                focus-visible:outline-2
                focus-visible:outline-offset-4
                focus-visible:outline-[#FF8A3D]
                sm:w-[245px]
              "
            >
              <span>Back to Learn</span>

              <ArrowRight
                className="
                  h-[18px]
                  w-[18px]
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
                h-[54px]
                w-full
                max-w-[150px]
                items-center
                justify-center
                rounded-full
                border
                border-[#345066]
                bg-transparent
                px-7
                font-sans
                text-[15px]
                font-bold
                text-[#C7D4DC]
                transition-all
                duration-200
                hover:border-[#587182]
                hover:bg-white/[0.035]
                hover:text-white
                active:scale-[0.98]
                focus-visible:outline-2
                focus-visible:outline-offset-4
                focus-visible:outline-[#FF8A3D]
                sm:w-[145px]
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