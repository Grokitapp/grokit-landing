import type { ReactNode } from 'react';
import { Bookmark, BookOpen, Compass, RefreshCw, Search } from 'lucide-react';

// -----------------------------------------------------------------------------
// Shared building blocks for the Explore and Library screens.
// -----------------------------------------------------------------------------

export function JourneyTile({
  title,
  imageUrl,
  badge,
  meta,
  metaIcon,
  fluid = false,
  action,
  onOpen,
}: {
  title: string;
  imageUrl?: string | null;
  badge?: string | null;
  meta?: string;
  metaIcon?: ReactNode;
  /** Fill the available width (grids) instead of a fixed row-card width. */
  fluid?: boolean;
  /** Small control pinned to the image's top-right corner (e.g. bookmark). */
  action?: ReactNode;
  onOpen: () => void;
}) {
  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-[#2D4149] bg-[#17262C] transition duration-200 hover:-translate-y-0.5 hover:border-orange/50 hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)] focus-within:border-orange/50 ${
        fluid ? 'w-full' : 'w-[240px] shrink-0 snap-start sm:w-[250px]'
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${title}`}
        className="flex flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange"
      >
        <div className="relative h-[130px] w-full overflow-hidden bg-[#1D3037]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#223A43] to-[#14232A]">
              <Compass className="h-9 w-9 text-orange/70" aria-hidden="true" />
            </div>
          )}

          {badge && (
            <span className="absolute left-3 top-3 max-w-[calc(100%-4rem)] truncate rounded-full bg-black/55 px-3 py-1 text-xs font-bold text-white backdrop-blur">
              {badge}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="line-clamp-2 min-h-[2.75rem] font-display text-base font-extrabold leading-snug text-white">
            {title}
          </h3>

          {meta && (
            <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#91A4AC]">
              {metaIcon ?? (
                <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              )}
              <span className="truncate">{meta}</span>
            </p>
          )}
        </div>
      </button>

      {action && <div className="absolute right-3 top-3">{action}</div>}
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
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-black/55 backdrop-blur transition hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange disabled:opacity-60 ${
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
      className={`overflow-hidden rounded-2xl border border-[#243840] bg-[#15242A] ${
        fluid ? 'w-full' : 'w-[240px] shrink-0 sm:w-[250px]'
      }`}
    >
      <div className="h-[130px] bg-[#1F333B]" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-4/5 rounded bg-[#233A43]" />
        <div className="h-3 w-2/5 rounded bg-[#1F333B]" />
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