import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Bookmark, ChevronLeft, ChevronRight, Play } from 'lucide-react';

import { cacheKeys, useCachedQuery } from '../lib/cache';
import { listPublicJourneys, type PublicJourney } from '../lib/explore';
import {
  listSavedJourneys,
  saveJourney,
  unsaveJourney,
} from '../lib/library';
import {
  JourneyTile,
  MessageState,
  SearchField,
  TileMenu,
  TileSkeleton,
} from './learn/components/JourneyTile';

// -----------------------------------------------------------------------------
// Types & helpers
// -----------------------------------------------------------------------------

interface JourneyRowData {
  id: string;
  title: string;
  items: PublicJourney[];
}

const FOR_YOU_LIMIT = 12;

// The public catalogue changes slowly, so a copy under 5 minutes old is shown
// without re-checking. Publishing or unpublishing refreshes it right away.
const CATALOGUE_FRESH_MS = 5 * 60_000;

const NO_JOURNEYS: PublicJourney[] = [];

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
  const lessons = journey.lessonCount ?? 0;

  return lessons > 0 ? `${lessons} ${lessons === 1 ? 'lesson' : 'lessons'}` : '';
}

const hideScrollbar =
  '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

// -----------------------------------------------------------------------------
// Row: title + arrows + horizontally scrolling cards
// -----------------------------------------------------------------------------

interface TileHandlers {
  onOpen: (journey: PublicJourney) => void;
  isSaved: (journey: PublicJourney) => boolean;
  isSavePending: (journey: PublicJourney) => boolean;
  onToggleSave: (journey: PublicJourney) => void;
}

function renderTile(
  journey: PublicJourney,
  handlers: TileHandlers,
  fluid: boolean,
) {
  return (
    <JourneyTile
      key={journey.id}
      title={journey.title}
      imageUrl={journey.heroImageUrl}
      badge={journey.category}
      meta={formatMeta(journey)}
      byline={journey.authorUsername ? `by @${journey.authorUsername}` : undefined}
      fluid={fluid}
      onOpen={() => handlers.onOpen(journey)}
      action={
        <TileMenu
          label={journey.title}
          items={[
            {
              label: handlers.isSaved(journey) ? 'Remove from saved' : 'Save for later',
              icon: (
                <Bookmark
                  className="h-4 w-4"
                  fill={handlers.isSaved(journey) ? 'currentColor' : 'none'}
                  aria-hidden="true"
                />
              ),
              disabled: handlers.isSavePending(journey),
              onClick: () => handlers.onToggleSave(journey),
            },
            {
              label: 'Create from this',
              icon: <Play className="h-4 w-4" aria-hidden="true" />,
              onClick: () => handlers.onOpen(journey),
            },
          ]}
        />
      }
    />
  );
}

function JourneyRow({
  title,
  items,
  handlers,
}: {
  title: string;
  items: PublicJourney[];
  handlers: TileHandlers;
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
            ? 'grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4'
            : `flex snap-x gap-4 overflow-x-auto scroll-smooth ${hideScrollbar}`
        }`}
      >
        {items.map((journey) => renderTile(journey, handlers, expanded))}
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// States
// -----------------------------------------------------------------------------

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
              <TileSkeleton key={card} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default function Explore() {
  const navigate = useNavigate();

  // Both lists come from the shared cache, so Explore opens instantly after the
  // first visit and stays in step with Library's Saved tab.
  const journeysQuery = useCachedQuery(
    cacheKeys.publicJourneys,
    listPublicJourneys,
    { staleMs: CATALOGUE_FRESH_MS },
  );
  const savedQuery = useCachedQuery(cacheKeys.savedJourneys, listSavedJourneys);

  const journeys = journeysQuery.data ?? NO_JOURNEYS;
  const loading = journeysQuery.loading;
  const error = journeysQuery.error;

  const [query, setQuery] = useState('');

  // public journey id -> saved record id. (If the saved list can't load, the
  // bookmarks just look empty; browsing still works.)
  const savedIds = useMemo(
    () =>
      new Map(
        (savedQuery.data ?? []).map((item) => [item.publicJourneyId, item.id]),
      ),
    [savedQuery.data],
  );
  const [pendingSaves, setPendingSaves] = useState<Set<string>>(new Set());

  const toggleSave = useCallback(
    async (journey: PublicJourney) => {
      if (pendingSaves.has(journey.id)) return;

      const savedRecordId = savedIds.get(journey.id);

      setPendingSaves((current) => new Set(current).add(journey.id));

      try {
        if (savedRecordId) {
          await unsaveJourney(savedRecordId);
        } else {
          await saveJourney(journey);
        }
      } catch (saveError) {
        console.error('[Explore] Failed to update saved journey:', saveError);
      } finally {
        setPendingSaves((current) => {
          const next = new Set(current);
          next.delete(journey.id);
          return next;
        });
      }
    },
    [pendingSaves, savedIds],
  );

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

  const handlers: TileHandlers = {
    onOpen: openJourney,
    isSaved: (journey) => savedIds.has(journey.id),
    isSavePending: (journey) => pendingSaves.has(journey.id),
    onToggleSave: (journey) => void toggleSave(journey),
  };

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

        <div className="mt-6">
          <SearchField
            value={query}
            onChange={setQuery}
            disabled={loading || error}
            placeholder="Search topics, skills or anything you’re curious about..."
            label="Search journeys"
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
              retry: true,
              onClick: () => void journeysQuery.refetch(),
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

              <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
                {results.map((journey) => renderTile(journey, handlers, true))}
              </div>
            </section>
          )
        ) : (
          rows.map((row) => (
            <JourneyRow
              key={row.id}
              title={row.title}
              items={row.items}
              handlers={handlers}
            />
          ))
        )}
      </div>
    </div>
  );
}