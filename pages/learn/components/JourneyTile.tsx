import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Bookmark,
  Compass,
  MoreVertical,
  RefreshCw,
  Search,
} from 'lucide-react';

// -----------------------------------------------------------------------------
// Shared building blocks for the Explore and Library screens.
// -----------------------------------------------------------------------------

// Journeys without a cover image get a stable gradient picked from their title,
// so the same journey always looks the same.
const COVER_GRADIENTS = [
  'from-[#2F7A78] to-[#173B4B]',
  'from-[#3A7CA5] to-[#1B3350]',
  'from-[#4C8F6B] to-[#1C4040]',
  'from-[#5B6FB5] to-[#222F5B]',
  'from-[#8A5CA8] to-[#34244F]',
  'from-[#B0663E] to-[#4A2A2A]',
];

function gradientFor(seed: string) {
  let hash = 0;

  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return COVER_GRADIENTS[hash % COVER_GRADIENTS.length];
}

export function JourneyTile({
  title,
  imageUrl,
  badge,
  meta,
  byline,
  fluid = false,
  action,
  onOpen,
}: {
  title: string;
  imageUrl?: string | null;
  /** Pill pinned to the top-left of the cover. */
  badge?: string | null;
  /** Bottom-right text, e.g. "12 lessons". */
  meta?: string;
  /** Bottom-left text, e.g. "by @name". */
  byline?: string;
  /** Fill the available width (grids) instead of a fixed row-card width. */
  fluid?: boolean;
  /** Control pinned to the top-right corner (e.g. a TileMenu). */
  action?: ReactNode;
  onOpen: () => void;
}) {
  return (
    <div
      className={`group relative h-[200px] transition-transform duration-200 hover:-translate-y-0.5 ${
        fluid ? 'w-full' : 'w-[280px] shrink-0 snap-start sm:w-[300px]'
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${title}`}
        className="absolute inset-0 overflow-hidden rounded-2xl border border-[#2D4149] text-left transition duration-200 group-hover:border-orange/50 group-hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${gradientFor(title)}`}
          >
            <Compass
              className="absolute left-1/2 top-5 h-20 w-20 -translate-x-1/2 text-white/15"
              aria-hidden="true"
            />
          </div>
        )}

        {/* Keeps the title readable on any cover. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"
        />

        {badge && (
          <span className="absolute left-3 top-3 max-w-[calc(100%-4rem)] truncate rounded-full bg-black/45 px-3 py-1 text-xs font-bold text-white backdrop-blur">
            {badge}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="line-clamp-2 font-display text-lg font-extrabold leading-tight text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.45)]">
            {title}
          </h3>

          {(byline || meta) && (
            <div className="mt-2 flex items-center justify-between gap-3 text-xs font-semibold text-white/80">
              <span className="min-w-0 truncate">{byline}</span>
              {meta && <span className="shrink-0">{meta}</span>}
            </div>
          )}
        </div>
      </button>

      {action && <div className="absolute right-3 top-3 z-10">{action}</div>}
    </div>
  );
}

// -----------------------------------------------------------------------------
// The "⋮" menu on a card
// -----------------------------------------------------------------------------

export interface TileMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export function TileMenu({
  items,
  label,
}: {
  items: TileMenuItem[];
  /** The journey's title, used for the button's accessible name. */
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`More options for ${label}`}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
      >
        <MoreVertical className="h-4 w-4" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-10 min-w-[180px] rounded-xl border border-[#2D4149] bg-[#17262C] p-1 shadow-[0_12px_32px_rgba(0,0,0,0.5)]"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-bold text-[#D7E0E3] transition-colors hover:bg-[#223640] hover:text-white focus-visible:bg-[#223640] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function BookmarkButton({
  saved,
  busy,
  label,
  onToggle,
}: {
  saved: boolean;
  busy?: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${label} from saved` : `Save ${label}`}
      title={saved ? 'Saved' : 'Save for later'}
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-black/45 backdrop-blur transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange disabled:opacity-60 ${
        saved ? 'text-orange' : 'text-white'
      }`}
    >
      <Bookmark
        className="h-4 w-4"
        fill={saved ? 'currentColor' : 'none'}
        aria-hidden="true"
      />
    </button>
  );
}

export function TileSkeleton({ fluid = false }: { fluid?: boolean }) {
  return (
    <div
      className={`relative h-[200px] overflow-hidden rounded-2xl border border-[#243840] bg-[#1A2D34] ${
        fluid ? 'w-full' : 'w-[280px] shrink-0 sm:w-[300px]'
      }`}
    >
      <div className="absolute inset-x-0 bottom-0 space-y-3 p-4">
        <div className="h-4 w-4/5 rounded bg-[#26414B]" />
        <div className="flex justify-between">
          <div className="h-3 w-1/4 rounded bg-[#223840]" />
          <div className="h-3 w-1/5 rounded bg-[#223840]" />
        </div>
      </div>
    </div>
  );
}

export function SearchField({
  value,
  onChange,
  disabled,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder: string;
  label: string;
}) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#91A4AC]"
        aria-hidden="true"
      />

      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={label}
        className="h-14 w-full rounded-full border border-[#2D4149] bg-[#17262C]/80 pl-14 pr-6 text-base font-semibold text-white outline-none transition-colors placeholder:text-[#60757E] focus:border-orange disabled:opacity-60"
      />
    </div>
  );
}

export function MessageState({
  title,
  text,
  action,
  icon,
}: {
  title: string;
  text: string;
  action?: { label: string; onClick: () => void; retry?: boolean };
  icon?: ReactNode;
}) {
  return (
    <section className="mx-auto mt-16 flex max-w-md flex-col items-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#37464F] bg-[#202F35] text-orange">
        {icon ?? <Compass className="h-7 w-7" aria-hidden="true" />}
      </div>

      <h2 className="mt-6 font-display text-2xl font-extrabold text-white">
        {title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-[#91A4AC]">{text}</p>

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#37464F] px-4 py-2.5 text-sm font-bold text-[#C8D3DA] transition hover:border-[#536871] hover:bg-[#26373E] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
        >
          {action.retry && <RefreshCw className="h-4 w-4" aria-hidden="true" />}
          {action.label}
        </button>
      )}
    </section>
  );
}