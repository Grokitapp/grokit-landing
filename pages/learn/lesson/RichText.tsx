import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import type { KnowledgeCard } from '../../../amplify/functions/shared/lesson-content';

/**
 * Renders a lesson paragraph. Two inline marks are understood:
 *   **bold**        a key term, shown in bold
 *   [[glossary]]    a term with a definition; tap to read it
 * Everything else is plain text, so model output can never inject markup.
 */

const TOKEN = /(\*\*[^*]+\*\*|\[\[[^\]]+\]\])/g;

interface RichTextProps {
  text: string;
  glossary?: readonly KnowledgeCard[];
}

export default function RichText({ text, glossary = [] }: RichTextProps) {
  const parts = useMemo(() => text.split(TOKEN).filter((part) => part !== ''), [text]);

  const lookup = useMemo(() => {
    const map = new Map<string, KnowledgeCard>();
    glossary.forEach((card) => map.set(card.term.trim().toLowerCase(), card));
    return map;
  }, [glossary]);

  return (
    <>
      {parts.map((part, index): ReactNode => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return (
            <strong key={index} className="font-extrabold text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }

        if (part.startsWith('[[') && part.endsWith(']]') && part.length > 4) {
          const term = part.slice(2, -2).trim();
          const card = lookup.get(term.toLowerCase());

          return card ? (
            <GlossaryTerm key={index} label={term} card={card} />
          ) : (
            <strong key={index} className="font-extrabold text-white">
              {term}
            </strong>
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

interface PopoverPosition {
  left: number;
  top: number;
}

const POPOVER_WIDTH = 280;

function GlossaryTerm({ label, card }: { label: string; card: KnowledgeCard }) {
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!position) return;

    const close = () => setPosition(null);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    const onPointer = (event: PointerEvent) => {
      if (!buttonRef.current?.contains(event.target as Node)) close();
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [position]);

  const toggle = () => {
    if (position) {
      setPosition(null);
      return;
    }

    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const left = Math.min(
      Math.max(12, rect.left + rect.width / 2 - POPOVER_WIDTH / 2),
      window.innerWidth - POPOVER_WIDTH - 12,
    );

    setPosition({ left, top: rect.bottom + 8 });
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-expanded={Boolean(position)}
        className="cursor-pointer border-b-2 border-dotted border-[#8FA3AD] font-extrabold text-white transition-colors hover:border-[#F4611F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4611F]/60"
      >
        {label}
      </button>

      {position && (
        <span
          role="tooltip"
          className="fixed z-[60] block rounded-2xl border border-[#40535E] bg-[#233440] p-4 text-left shadow-2xl"
          style={{ left: position.left, top: position.top, width: POPOVER_WIDTH }}
        >
          <span className="block font-display text-base font-extrabold text-white">{card.term}</span>
          <span className="mt-1 block text-sm leading-6 text-[#D5DEE3]">{card.definition}</span>
          {card.example && (
            <span className="mt-2 block rounded-xl bg-[#18252C] px-3 py-2 text-[13px] leading-5 text-[#91A4AC]">
              <span className="font-extrabold uppercase tracking-wide text-[#F4611F]">Example </span>
              {card.example}
            </span>
          )}
        </span>
      )}
    </>
  );
}