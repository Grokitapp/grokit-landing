import { type ChangeEvent, type SubmitEvent, useEffect, useRef, useState } from 'react';
import { ArrowRight, FileText, Mic, Paperclip, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import createJourneyMascot from '../assets/grokit-create-journey-mascot.png';
import AppShell from './learn/AppShell';
import { getProfile } from '../lib/profile';
import { listCourses } from '../lib/course';

type Course = Awaited<ReturnType<typeof listCourses>>[number];

type SpeechAlternative = {
  transcript: string;
};

type SpeechResult = {
  0: SpeechAlternative;
  isFinal: boolean;
};

type SpeechResultEvent = {
  resultIndex: number;
  results: ArrayLike<SpeechResult>;
};

type SpeechErrorEvent = {
  error: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const PLACEHOLDER =
  'e.g. Explain how a four-stroke engine works, starting from basics...';

export default function Create() {
  const navigate = useNavigate();
  const location = useLocation();

  const [prompt, setPrompt] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const promptBeforeListeningRef = useRef('');

  useEffect(() => {
    const state = location.state as { prompt?: string } | null;

    if (typeof state?.prompt === 'string' && state.prompt.trim()) {
      setPrompt(state.prompt);
    }
  }, [location.state]);

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      try {
        const profile = await getProfile();

        if (cancelled) return;

        if (!profile?.onboardingCompleted) {
          navigate('/onboarding', { replace: true });
          return;
        }

        const existingCourses = await listCourses();

        if (!cancelled) {
          setCourses(existingCourses);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to prepare Create page:', error);
        }
      } finally {
        if (!cancelled) {
          setCoursesLoading(false);
        }
      }
    }

    void loadPage();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0] ?? null);
  };

  const removeFile = () => {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleVoiceInput = () => {
    setVoiceError(null);

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const speechWindow = window as SpeechWindow;
    const Recognition =
      speechWindow.SpeechRecognition ??
      speechWindow.webkitSpeechRecognition;

    if (!Recognition) {
      setVoiceError(
        'Voice input is not supported in this browser. Try Chrome or type your idea instead.',
      );
      return;
    }

    try {
      const recognition = new Recognition();

      recognition.lang = navigator.language || 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;

      promptBeforeListeningRef.current = prompt.trim();

      recognition.onresult = (event) => {
        let transcript = '';

        for (
          let index = event.resultIndex;
          index < event.results.length;
          index += 1
        ) {
          transcript += `${event.results[index][0].transcript} `;
        }

        const base = promptBeforeListeningRef.current;
        const spokenText = transcript.trim();

        setPrompt([base, spokenText].filter(Boolean).join(' '));
      };

      recognition.onerror = (event) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceError(
            'Microphone access was denied. Allow microphone access in your browser settings and try again.',
          );
        } else if (event.error === 'no-speech') {
          setVoiceError('No speech was detected. Please try speaking again.');
        } else if (event.error !== 'aborted') {
          setVoiceError(
            'Voice input stopped unexpectedly. Please try again.',
          );
        }

        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      setIsListening(true);
      recognition.start();
    } catch (error) {
      console.error('Unable to start voice input:', error);
      recognitionRef.current = null;
      setIsListening(false);
      setVoiceError(
        'Unable to start the microphone. Check your browser permissions and try again.',
      );
    }
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) return;

    if (isListening) {
      recognitionRef.current?.stop();
    }

    navigate('/learn/personalize', {
      state: {
        prompt: trimmedPrompt,
        attachmentName: selectedFile?.name ?? null,
      },
    });
  };

  const canCreate = prompt.trim().length > 0;

  return (
    <AppShell
      courses={courses.map((course) => ({
        id: course.id,
        title: course.title,
      }))}
      coursesLoading={coursesLoading}
    >
      <main className="relative min-h-[100dvh] overflow-hidden bg-[#08151F]">
        <div className="pointer-events-none absolute left-1/2 top-[8%] h-[420px] w-[620px] -translate-x-1/2 rounded-full bg-orange/[0.07] blur-[120px]" />

        <div className="pointer-events-none absolute bottom-[-180px] left-1/2 h-[420px] w-[700px] -translate-x-1/2 rounded-full bg-[#0D4960]/20 blur-[120px]" />

        <div className="relative flex min-h-[100dvh] w-full items-center justify-center px-4 pb-10 pt-20 sm:px-6 sm:pt-16 lg:px-10 lg:pt-10">
          <div className="flex w-full max-w-[920px] flex-col items-center">
            <div className="relative flex h-[180px] w-[280px] items-center justify-center sm:h-[205px] sm:w-[320px]">
              <div className="pointer-events-none absolute inset-0 rounded-full bg-orange/[0.08] blur-[45px]" />

              <img
                src={createJourneyMascot}
                alt="Grokit mascot holding a compass"
                draggable={false}
                className="relative h-full w-full object-contain drop-shadow-[0_12px_30px_rgba(255,107,0,0.16)]"
              />
            </div>

            <div className="mt-1 text-center sm:mt-2">
              <h1 className="font-display text-[32px] font-extrabold leading-[1.08] tracking-[-0.035em] text-white sm:text-[44px] lg:text-[50px]">
                What do you want to{' '}
                <span className="text-orange">learn?</span>
              </h1>

              <p className="mt-3 font-sans text-[15px] font-medium text-[#9BAEB7] sm:text-[17px]">
                Be as specific or as broad as you like.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-7 w-full max-w-[780px] sm:mt-8"
            >
              <div className="relative min-h-[210px] rounded-[24px] border border-[#38515E] bg-[#102331] shadow-[0_20px_70px_rgba(0,0,0,0.24)] transition-all focus-within:border-[#547181] focus-within:shadow-[0_20px_80px_rgba(0,0,0,0.32)]">
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder={PLACEHOLDER}
                  aria-label="What do you want to learn?"
                  className="min-h-[145px] w-full resize-none bg-transparent px-6 pb-20 pt-6 font-sans text-[16px] font-medium leading-7 text-white outline-none placeholder:text-[#718995] sm:min-h-[155px] sm:px-7 sm:pt-7"
                  autoFocus
                />

                {selectedFile && (
                  <div className="absolute bottom-[68px] left-5 right-5 flex items-center gap-2 sm:left-6 sm:right-6">
                    <div className="flex max-w-[300px] items-center gap-2 rounded-xl border border-[#344B57] bg-[#182D38] px-3 py-2 text-xs font-semibold text-[#C8D5DA]">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-orange" />

                      <span className="min-w-0 truncate">
                        {selectedFile.name}
                      </span>

                      <button
                        type="button"
                        onClick={removeFile}
                        aria-label="Remove attachment"
                        className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[#78909A] hover:bg-white/10 hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-4 pb-4 sm:px-5 sm:pb-5">
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Attach a file"
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#2D4653] bg-[#1A3040] text-[#D2DFE4] transition-all hover:border-[#486474] hover:bg-[#203A4A] hover:text-white"
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                      aria-pressed={isListening}
                      title={isListening ? 'Stop listening' : 'Speak your idea'}
                      className={[
                        'relative flex h-12 w-12 items-center justify-center rounded-2xl border transition-all',
                        isListening
                          ? 'border-orange bg-orange/15 text-orange'
                          : 'border-[#2D4653] bg-[#1A3040] text-[#D2DFE4] hover:border-[#486474] hover:bg-[#203A4A] hover:text-white',
                      ].join(' ')}
                    >
                      {isListening && (
                        <span className="absolute inset-0 animate-ping rounded-2xl border border-orange/40" />
                      )}
                      <Mic className="relative h-5 w-5" />
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!canCreate}
                    className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-orange px-6 font-sans text-sm font-extrabold text-white shadow-[0_4px_0_#C94713] transition-all hover:brightness-105 active:translate-y-[2px] active:shadow-none disabled:pointer-events-none disabled:opacity-40 sm:min-w-[210px] sm:px-7"
                  >
                    Create journey
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {voiceError && (
                <p role="status" className="mt-3 text-sm leading-6 text-[#E8A58D]">
                  {voiceError}
                </p>
              )}
            </form>

            <p className="mt-5 max-w-[620px] text-center text-xs font-medium leading-5 text-[#60757E]">
              One idea is enough. Grokit will help you turn it into a
              structured learning journey.
            </p>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
