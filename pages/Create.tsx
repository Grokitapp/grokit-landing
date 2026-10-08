import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ArrowRight,
  FileText,
  Mic,
  Paperclip,
  X,
} from 'lucide-react';

import {
  useLocation,
  useNavigate,
} from 'react-router';

import AppShell from './learn/AppShell';

import { getProfile } from '../lib/profile';
import { listCourses } from '../lib/course';



// ─── Types ────────────────────────────────────────────────────────────────────

type Course = Awaited<
  ReturnType<typeof listCourses>
>[number];



// ─── Constants ────────────────────────────────────────────────────────────────

const PLACEHOLDER =
  'e.g. Explain how a four-stroke engine works, starting from basics...';



// ─── Component ────────────────────────────────────────────────────────────────

export default function Create() {
  const navigate = useNavigate();

  const location = useLocation();

  const [prompt, setPrompt] =
    useState('');

  const [courses, setCourses] =
    useState<Course[]>([]);

  const [coursesLoading, setCoursesLoading] =
    useState(true);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  useEffect(() => {
    const state = location.state as
      | {
          prompt?: string;
        }
      | null;

    if (
      state?.prompt &&
      typeof state.prompt === 'string'
    ) {
      setPrompt(state.prompt);
    }
  }, [location.state]);


  useEffect(() => {
    let cancelled = false;

    const loadPage = async () => {
      try {
        const profile = await getProfile();

        if (cancelled) return;

        if (!profile?.onboardingCompleted) {
          navigate('/onboarding', {
            replace: true,
          });

          return;
        }

        const existingCourses =
          await listCourses();

        if (!cancelled) {
          setCourses(existingCourses);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            'Failed to prepare Create page:',
            error,
          );
        }
      } finally {
        if (!cancelled) {
          setCoursesLoading(false);
        }
      }
    };

    void loadPage();

    return () => {
      cancelled = true;
    };
  }, [navigate]);


  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0] ?? null;

    setSelectedFile(file);
  };


  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const trimmedPrompt =
      prompt.trim();

    if (!trimmedPrompt) return;

    navigate('/learn/personalize', {
      state: {
        prompt: trimmedPrompt,
        attachmentName:
          selectedFile?.name ?? null,
      },
    });
  };


  const removeFile = () => {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  const canCreate =
    prompt.trim().length > 0;


  return (
    <AppShell
      courses={courses.map((course) => ({
        id: course.id,
        title: course.title,
      }))}
      coursesLoading={coursesLoading}
    >
      <main
        className="
          relative
          min-h-[100dvh]
          overflow-hidden
          bg-[#08151F]
        "
      >

        {/* Ambient background */}

        <div
          className="
            pointer-events-none
            absolute
            left-1/2
            top-[8%]
            h-[420px]
            w-[620px]
            -translate-x-1/2
            rounded-full
            bg-orange/[0.07]
            blur-[120px]
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            bottom-[-180px]
            left-1/2
            h-[420px]
            w-[700px]
            -translate-x-1/2
            rounded-full
            bg-[#0D4960]/20
            blur-[120px]
          "
        />


        <div
          className="
            relative
            flex
            min-h-[100dvh]
            w-full
            items-center
            justify-center
            px-4
            pb-10
            pt-20
            sm:px-6
            sm:pt-16
            lg:px-10
            lg:pt-10
          "
        >

          <div
            className="
              flex
              w-full
              max-w-[920px]
              flex-col
              items-center
            "
          >

            {/* Mascot */}

            <div
              className="
                relative
                flex
                h-[150px]
                w-[240px]
                items-center
                justify-center
                sm:h-[175px]
                sm:w-[280px]
              "
            >
              <div
                className="
                  pointer-events-none
                  absolute
                  inset-0
                  rounded-full
                  bg-orange/[0.08]
                  blur-[45px]
                "
              />

              <img
                src="/assets/grokit-create-journey-mascot.png"
                alt="Grokit mascot holding a compass"
                className="
                  relative
                  h-full
                  w-full
                  object-contain
                "
              />
            </div>


            {/* Heading */}

            <div className="mt-1 text-center sm:mt-2">
              <h1
                className="
                  font-display
                  text-[32px]
                  font-extrabold
                  leading-[1.08]
                  tracking-[-0.035em]
                  text-white
                  sm:text-[44px]
                  lg:text-[50px]
                "
              >
                What do you want to{' '}
                <span className="text-orange">
                  learn?
                </span>
              </h1>

              <p
                className="
                  mt-3
                  font-sans
                  text-[15px]
                  font-medium
                  text-[#9BAEB7]
                  sm:text-[17px]
                "
              >
                Be as specific or as broad as you like.
              </p>
            </div>


            {/* Prompt */}

            <form
              onSubmit={handleSubmit}
              className="
                mt-7
                w-full
                max-w-[780px]
                sm:mt-8
              "
            >
              <div
                className="
                  relative
                  min-h-[210px]
                  rounded-[24px]
                  border
                  border-[#38515E]
                  bg-[#102331]
                  shadow-[0_20px_70px_rgba(0,0,0,0.24)]
                  transition-all
                  focus-within:border-[#547181]
                  focus-within:shadow-[0_20px_80px_rgba(0,0,0,0.32)]
                "
              >

                <textarea
                  value={prompt}
                  onChange={(event) =>
                    setPrompt(
                      event.target.value,
                    )
                  }
                  placeholder={PLACEHOLDER}
                  aria-label="What do you want to learn?"
                  className="
                    min-h-[145px]
                    w-full
                    resize-none
                    bg-transparent
                    px-6
                    pb-20
                    pt-6
                    font-sans
                    text-[16px]
                    font-medium
                    leading-7
                    text-white
                    outline-none
                    placeholder:text-[#718995]
                    sm:min-h-[155px]
                    sm:px-7
                    sm:pt-7
                  "
                  autoFocus
                />


                {/* Selected attachment */}

                {selectedFile && (
                  <div
                    className="
                      absolute
                      bottom-[68px]
                      left-5
                      right-5
                      flex
                      items-center
                      gap-2
                      sm:left-6
                      sm:right-6
                    "
                  >
                    <div
                      className="
                        flex
                        max-w-[300px]
                        items-center
                        gap-2
                        rounded-xl
                        border
                        border-[#344B57]
                        bg-[#182D38]
                        px-3
                        py-2
                        text-xs
                        font-semibold
                        text-[#C8D5DA]
                      "
                    >
                      <FileIcon />

                      <span className="min-w-0 truncate">
                        {selectedFile.name}
                      </span>

                      <button
                        type="button"
                        onClick={removeFile}
                        aria-label="Remove attachment"
                        className="
                          ml-1
                          flex
                          h-5
                          w-5
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          text-[#78909A]
                          hover:bg-white/10
                          hover:text-white
                        "
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}


                {/* Bottom controls */}

                <div
                  className="
                    absolute
                    inset-x-0
                    bottom-0
                    flex
                    items-center
                    justify-between
                    gap-3
                    px-4
                    pb-4
                    sm:px-5
                    sm:pb-5
                  "
                >

                  <div className="flex items-center gap-2">

                    {/* Attachment */}

                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      aria-label="Attach a file"
                      className="
                        flex
                        h-12
                        w-12
                        items-center
                        justify-center
                        rounded-2xl
                        border
                        border-[#2D4653]
                        bg-[#1A3040]
                        text-[#D2DFE4]
                        transition-all
                        hover:border-[#486474]
                        hover:bg-[#203A4A]
                        hover:text-white
                      "
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>


                    {/* Voice */}

                    <button
                      type="button"
                      aria-label="Voice input"
                      title="Voice input"
                      className="
                        flex
                        h-12
                        w-12
                        items-center
                        justify-center
                        rounded-2xl
                        border
                        border-[#2D4653]
                        bg-[#1A3040]
                        text-[#D2DFE4]
                        transition-all
                        hover:border-[#486474]
                        hover:bg-[#203A4A]
                        hover:text-white
                      "
                    >
                      <Mic className="h-5 w-5" />
                    </button>

                  </div>


                  {/* Create */}

                  <button
                    type="submit"
                    disabled={!canCreate}
                    className="
                      inline-flex
                      min-h-[54px]
                      items-center
                      justify-center
                      gap-2
                      rounded-2xl
                      bg-orange
                      px-6
                      font-sans
                      text-sm
                      font-extrabold
                      text-white
                      shadow-[0_4px_0_#C94713]
                      transition-all
                      hover:brightness-105
                      active:translate-y-[2px]
                      active:shadow-none
                      disabled:pointer-events-none
                      disabled:opacity-40
                      sm:min-w-[210px]
                      sm:px-7
                    "
                  >
                    Create journey

                    <ArrowRight className="h-4 w-4" />
                  </button>

                </div>
              </div>
            </form>


            {/* Small supporting line */}

            <p
              className="
                mt-5
                max-w-[620px]
                text-center
                text-xs
                font-medium
                leading-5
                text-[#60757E]
              "
            >
              One idea is enough. Grokit will help you
              turn it into a structured learning journey.
            </p>

          </div>
        </div>
      </main>
    </AppShell>
  );
}


// ─── File icon ────────────────────────────────────────────────────────────────

function FileIcon() {
  return (
    <FileText
      className="
        h-3.5
        w-3.5
        shrink-0
        text-orange
      "
    />
  );
}