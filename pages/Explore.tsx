import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Compass,
  RefreshCw,
  Search,
} from 'lucide-react';

import { listPublicJourneys, type PublicJourney } from '../lib/explore';

// -----------------------------------------------------------------------------
// Types & helpers
// -----------------------------------------------------------------------------

interface JourneyRowData {
  id: string;
  title: string;
  items: PublicJourney[];
}

const FOR_YOU_LIMIT = 12;

function buildRows(journeys: PublicJourney[]): JourneyRowData[] {
  if (journeys.length === 0) return [];

  const rows: JourneyRowData[] = [
    { id: 'for-you', title: 'For you', items: journeys.slice(0, FOR_YOU_LIMIT) },
  ];

  const byCategory = new Map<string, PublicJourney[]>();

  for (const journey of journeys) {
    const category = journey.category?.trim();

    if (!category) continue;

    const items = byCategory.get(category) ?? [];
    items.push(journey);
    byCategory.set(category, items);
  }

  [...byCategory.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([category, items]) => {
      rows.push({ id: `category-${category}`, title: category, items });
    });

  return rows;
}

function matchesQuery(journey: PublicJourney, query: string) {
  const haystack = `${journey.title} ${journey.topic} ${
    journey.category ?? ''
  }`.toLowerCase();

  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

function formatMeta(journey: PublicJourney) {
  const parts: string[] = [];
  const zones = journey.zoneCount ?? 0;
  const lessons = journey.lessonCount ?? 0;

  if (zones > 0) parts.push(`${zones} ${zones === 1 ? 'zone' : 'zones'}`);
  if (lessons > 0) {
    parts.push(`${lessons} ${lessons === 1 ? 'lesson' : 'lessons'}`);
  }

  return parts.join(' · ');
}

const hideScrollbar =
  '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

// -----------------------------------------------------------------------------
// Journey card (the whole card is the button)
// -----------------------------------------------------------------------------

function JourneyCard({
  journey,
  fluid = false,
  onOpen,
}: {
  journey: PublicJourney;
  fluid?: boolean;
  onOpen: (journey: PublicJourney) => void;
}) {
  const meta = formatMeta(journey);

  return (
    <button
      type="button"
      onClick={() => onOpen(journey)}
      aria-label={`Open ${journey.title}`}
      className={`group flex flex-col overflow-hidden rounded-2xl border border-[#2D4149] bg-[#17262C] text-left transition duration-200 hover:-translate-y-0.5 hover:border-orange/50 hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange ${
        fluid ? 'w-full' : 'w-[240px] shrink-0 snap-start sm:w-[250px]'
      }`}
    >
      <div className="relative h-[130px] w-full overflow-hidden bg-[#1D3037]">
        {journey.heroImageUrl ? (
          <img
            src={journey.heroImageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#223A43] to-[#14232A]">
            <Compass className="h-9 w-9 text-orange/70" aria-hidden="true" />
          </div>
        )}

        {journey.category && (
          <span className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-black/55 px-3 py-1 text-xs font-bold text-white backdrop-blur">
            {journey.category}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 min-h-[2.75rem] font-display text-base font-extrabold leading-snug text-white">
          {journey.title}
        </h3>

        {meta && (
          <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#91A4AC]">
            <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{meta}</span>
          </p>
        )}
      </div>
    </button>
  );
}

// -----------------------------------------------------------------------------
// Row: title + arrows + horizontally scrolling cards
// -----------------------------------------------------------------------------

function JourneyRow({
  title,
  items,
  onOpen,
}: {
  title: string;
  items: PublicJourney[];
  onOpen: (journey: PublicJourney) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [edges, setEdges] = useState({ start: true, end: true });

  const updateEdges = useCallback(() => {
    const element = scrollerRef.current;

    if (!element) return;

    setEdges({
      start: element.scrollLeft <= 4,
      end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    updateEdges();

    const element = scrollerRef.current;

    if (!element) return;

    const observer = new ResizeObserver(updateEdges);
    observer.observe(element);

    return () => observer.disconnect();
  }, [updateEdges, items.length, expanded]);

  const scrollByPage = (direction: 1 | -1) => {
    const element = scrollerRef.current;

    if (!element) return;

    element.scrollBy({
      left: direction * element.clientWidth * 0.85,
      behavior: 'smooth',
    });
  };

  const hasOverflow = !(edges.start && edges.end);

  const arrowClasses =
    'flex h-9 w-9 items-center justify-center rounded-full border border-[#2D4149] bg-[#1A2A31] text-white transition hover:border-[#4C626B] hover:bg-[#223640] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange disabled:pointer-events-none disabled:text-[#4E636B] disabled:opacity-60';

  return (
    <section aria-label={title} className="mt-8">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="flex min-w-0 items-center gap-2 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
        >
          <h2 className="truncate font-display text-xl font-extrabold text-white sm:text-2xl">
            {title}
          </h2>
          <ChevronRight
            className={`h-5 w-5 shrink-0 text-[#91A4AC] transition-transform ${
              expanded ? 'rotate-90' : ''
            }`}
            aria-hidden="true"
          />
        </button>

        {!expanded && hasOverflow && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label={`Scroll ${title} left`}
              disabled={edges.start}
              onClick={() => scrollByPage(-1)}
              className={arrowClasses}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              aria-label={`Scroll ${title} right`}
              disabled={edges.end}
              onClick={() => scrollByPage(1)}
              className={arrowClasses}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      <div
        ref={scrollerRef}
        onScroll={updateEdges}
        className={`-mx-1 -mb-2 mt-2 px-1 py-2 ${
          expanded
            ? 'grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4'
            : `flex snap-x gap-4 overflow-x-auto scroll-smooth ${hideScrollbar}`
        }`}
      >
        {items.map((journey) => (
          <JourneyCard
            key={journey.id}
            journey={journey}
            fluid={expanded}
            onOpen={onOpen}
          />
        ))}
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// States
// -----------------------------------------------------------------------------

function CardSkeleton() {
  return (
    <div className="w-[240px] shrink-0 overflow-hidden rounded-2xl border border-[#243840] bg-[#15242A] sm:w-[250px]">
      <div className="h-[130px] bg-[#1F333B]" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-4/5 rounded bg-[#233A43]" />
        <div className="h-3 w-2/5 rounded bg-[#1F333B]" />
      </div>
    </div>
  );
}

function ExploreSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading journeys" className="animate-pulse">
      {[0, 1].map((row) => (
        <div key={row} className="mt-8">
          <div className="flex items-center justify-between">
            <div className="h-7 w-36 rounded-lg bg-[#233A43]" />
            <div className="flex gap-2">
              <div className="h-9 w-9 rounded-full bg-[#1F333B]" />
              <div className="h-9 w-9 rounded-full bg-[#233A43]" />
            </div>
          </div>

          <div className="mt-4 flex gap-4 overflow-hidden">
            {[0, 1, 2, 3, 4].map((card) => (
              <CardSkeleton key={card} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MessageState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: { label: string; onClick: () => void; icon?: 'retry' };
}) {
  return (
    <section className="mx-auto mt-16 flex max-w-md flex-col items-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#37464F] bg-[#202F35] text-orange">
        <Compass className="h-7 w-7" aria-hidden="true" />
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
          {action.icon === 'retry' && (
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          )}
          {action.label}
        </button>
      )}
    </section>
  );
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default function Explore() {
  const navigate = useNavigate();

  const [journeys, setJourneys] = useState<PublicJourney[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(false);

      try {
        const result = await listPublicJourneys();

        if (!cancelled) setJourneys(result);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const trimmedQuery = query.trim();

  const rows = useMemo(() => buildRows(journeys), [journeys]);

  const results = useMemo(
    () =>
      trimmedQuery
        ? journeys.filter((journey) => matchesQuery(journey, trimmedQuery))
        : [],
    [journeys, trimmedQuery],
  );

  // Clicking a journey starts the create flow with that topic pre-filled.
  // Create.tsx reads `location.state.prefillTopic`.
  const openJourney = useCallback(
    (journey: PublicJourney) => {
      navigate('/create', { state: { prefillTopic: journey.topic } });
    },
    [navigate],
  );

  return (
    <div className="relative min-h-[100dvh]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(56,120,160,0.16),transparent_70%)]"
      />

      <div className="relative mx-auto w-full max-w-[1180px] px-4 pb-12 pt-6 sm:px-7 sm:pt-8 xl:px-9">
        <header>
          <h1 className="font-display text-4xl font-extrabold tracking-[-0.02em] text-white sm:text-5xl">
            Explore
          </h1>
          <p className="mt-2 text-sm font-medium text-[#A9BAC0] sm:text-base">
            Discover new journeys and ideas to grow your knowledge.
          </p>
        </header>

        <div className="relative mt-6">
          <Search
            className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#91A4AC]"
            aria-hidden="true"
          />

          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            disabled={loading || error}
            placeholder="Search topics, skills or anything you’re curious about..."
            aria-label="Search journeys"
            className="h-14 w-full rounded-full border border-[#2D4149] bg-[#17262C]/80 pl-14 pr-6 text-base font-semibold text-white outline-none transition-colors placeholder:text-[#60757E] focus:border-orange disabled:opacity-60"
          />
        </div>

        {loading ? (
          <ExploreSkeleton />
        ) : error ? (
          <MessageState
            title="Couldn’t load journeys"
            text="Something went wrong while loading Explore. Please try again."
            action={{
              label: 'Try again',
              icon: 'retry',
              onClick: () => setReloadKey((value) => value + 1),
            }}
          />
        ) : journeys.length === 0 ? (
          <MessageState
            title="No journeys"
            text="There are no public journeys yet. Check back soon, or create your own."
            action={{ label: 'Create a journey', onClick: () => navigate('/create') }}
          />
        ) : trimmedQuery ? (
          results.length === 0 ? (
            <MessageState
              title="No journeys found"
              text={`Nothing matches “${trimmedQuery}”. Try a different word.`}
              action={{ label: 'Clear search', onClick: () => setQuery('') }}
            />
          ) : (
            <section aria-label="Search results" className="mt-8">
              <h2 className="font-display text-xl font-extrabold text-white sm:text-2xl">
                Results
              </h2>

              <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
                {results.map((journey) => (
                  <JourneyCard
                    key={journey.id}
                    journey={journey}
                    fluid
                    onOpen={openJourney}
                  />
                ))}
              </div>
            </section>
          )
        ) : (
          rows.map((row) => (
            <JourneyRow
              key={row.id}
              title={row.title}
              items={row.items}
              onOpen={openJourney}
            />
          ))
        )}
      </div>
    </div>
  );
}