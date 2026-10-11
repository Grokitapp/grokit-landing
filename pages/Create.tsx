import {
  useEffect,
  useRef,
  useState,
} from 'react';
import type {
  ChangeEvent,
  FormEvent,
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
import createJourneyMascot from '../assets/grokit-create-journey-mascot.png';
import { getProfile } from '../lib/profile';

const PLACEHOLDER =
  'e.g. Explain how a four-stroke engine works, starting from basics...';

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  0: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionErrorEventLike = {
  error: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructorLike = new () => SpeechRecognitionLike;

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructorLike;
  webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
};

export default function Create() {
  const navigate = useNavigate();
  const location = useLocation();

  const [prompt, setPrompt] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [profileChecking, setProfileChecking] = useState(true);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const promptBeforeListeningRef = useRef('');
  const finalTranscriptRef = useRef('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore a prompt passed back from another page.
  useEffect(() => {
    const state = location.state as
      | { prompt?: string }
      | null;

    if (typeof state?.prompt === 'string' && state.prompt) {
      setPrompt(state.prompt);
    }
  }, [location.state]);

  // Verify onboarding without fetching journeys here.
  // AppShell owns the sidebar journey list.
  useEffect(() => {
    let cancelled = false;

    const verifyProfile = async () => {
      try {
        const profile = await getProfile();

        if (cancelled) return;

        if (!profile?.onboardingCompleted) {
          navigate('/onboarding', { replace: true });
        }
      } catch (error) {
        if (cancelled) return;

        console.error('Failed to verify onboarding:', error);
        navigate('/onboarding', { replace: true });
      } finally {
        if (!cancelled) {
          setProfileChecking(false);
        }
      }
    };

    void verifyProfile();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
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
        'Voice input is not supported in this browser. Try Chrome or enter your idea by typing.',
      );
      return;
    }

    try {
      const recognition = new Recognition();

      recognition.lang = navigator.language || 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;

      promptBeforeListeningRef.current = prompt.trim();
      finalTranscriptRef.current = '';

      recognition.onresult = (event) => {
        let interimTranscript = '';

        for (
          let index = event.resultIndex;
          index < event.results.length;
          index += 1
        ) {
          const result = event.results[index];

          if (result.isFinal) {
            finalTranscriptRef.current +=
              `${result[0].transcript} `;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const spokenText =
          `${finalTranscriptRef.current}${interimTranscript}`.trim();

        const base = promptBeforeListeningRef.current;

        setPrompt(
          [base, spokenText].filter(Boolean).join(' '),
        );
      };

      recognition.onerror = (event) => {
        if (
          event.error === 'not-allowed' ||
          event.error === 'service-not-allowed'
        ) {
          setVoiceError(
            'Microphone access was denied. Allow microphone access in your browser settings and try again.',
          );
        } else if (event.error === 'no-speech') {
          setVoiceError(
            'No speech was detected. Please try speaking again.',
          );
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
        'Unable to start the microphone. Check browser permissions and try again.',
      );
    }
  };

  useEffect(
    () => () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    },
    [],
  );

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || profileChecking) return;

    navigate('/learn/personalize', {
      state: {
        prompt: trimmedPrompt,
        attachmentName: selectedFile?.name ?? null,
      },
    });
  };

  const removeFile = () => {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const canCreate = prompt.trim().length > 0 && !profileChecking;

  return (
    <AppShell>
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
                src={createJourneyMascot}
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
                <span className="text-orange">learn?</span>
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
              className="mt-7 w-full max-w-[780px] sm:mt-8"
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
                  onChange={(event) => setPrompt(event.target.value)}
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
                      <FileText className="h-4 w-4 shrink-0" />

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
                    bottom-5
                    left-5
                    right-5
                    flex
                    items-center
                    justify-between
                    gap-3
                    sm:left-6
                    sm:right-6
                  "
                >
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      aria-label="Attach a file"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Attach a file"
                      className="
                        flex
                        h-14
                        w-14
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        border
                        border-[#2F4653]
                        bg-[#1A3443]
                        text-[#C4D2D9]
                        transition-colors
                        hover:border-[#526F7D]
                        hover:bg-[#234354]
                      "
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      aria-label={
                        isListening
                          ? 'Stop voice input'
                          : 'Start voice input'
                      }
                      aria-pressed={isListening}
                      className={`
                        flex
                        h-14
                        w-14
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        border
                        transition-colors
                        ${
                          isListening
                            ? 'border-orange bg-orange/15 text-orange'
                            : 'border-[#2F4653] bg-[#1A3443] text-[#C4D2D9] hover:border-[#526F7D] hover:bg-[#234354]'
                        }
                      `}
                    >
                      <Mic className="h-5 w-5" />
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!canCreate}
                    className="
                      inline-flex
                      min-h-[60px]
                      items-center
                      justify-center
                      gap-3
                      rounded-[22px]
                      bg-orange
                      px-6
                      text-sm
                      font-extrabold
                      text-white
                      shadow-[0_4px_0_#C94713]
                      transition-all
                      hover:brightness-105
                      active:translate-y-[2px]
                      active:shadow-none
                      disabled:cursor-not-allowed
                      disabled:opacity-45
                      sm:px-7
                    "
                  >
                    {profileChecking ? 'Loading...' : 'Create journey'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {voiceError && (
                <p
                  role="alert"
                  className="mt-3 text-sm leading-6 text-amber-200"
                >
                  {voiceError}
                </p>
              )}

              <p
                className="
                  mt-6
                  text-center
                  font-sans
                  text-xs
                  font-medium
                  leading-5
                  text-[#536E7D]
                  sm:text-[13px]
                "
              >
                One idea is enough. Grokit will help you turn it into a
                structured learning journey.
              </p>
            </form>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
