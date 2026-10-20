import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Bookmark,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  Layers,
  Sparkles,
  User,
  X,
} from 'lucide-react';

import { cacheKeys, useCachedQuery } from '../lib/cache';
import {
  importJourney,
  listPublicJourneys,
  type PublicJourney,
} from '../lib/explore';
import {
  listSavedJourneys,
  saveJourney,
  unsaveJourney,
} from '../lib/library';
import { LimitReachedError } from '../lib/usageLimits';
import { SmartImage } from '../components/SmartImage';
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

const choiceClasses =
  'flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange disabled:cursor-not-allowed disabled:opacity-60';

// -----------------------------------------------------------------------------
// Row: title + arrows + horizontally scrolling cards
// -----------------------------------------------------------------------------

interface TileHandlers {
  /** Opens the details for a journey. */
  onOpen: (journey: PublicJourney) => void;
  /** Starts a personalised journey on the same topic. */
  onStart: (journey: PublicJourney) => void;
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
              label: 'Make it mine',
              icon: <Sparkles className="h-4 w-4" aria-hidden="true" />,
              onClick: () => handlers.onStart(journey),
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
// Details dialog (bottom sheet on phones, centred card on larger screens)
// -----------------------------------------------------------------------------

function JourneyDialog({
  journey,
  saved,
  savePending,
  importing,
  importError,
  onClose,
  onStart,
  onImport,
  onToggleSave,
}: {
  journey: PublicJourney;
  saved: boolean;
  savePending: boolean;
  importing: boolean;
  importError: string | null;
  onClose: () => void;
  onStart: () => void;
  onImport: () => void;
  onToggleSave: () => void;
}) {
  const startRef = useRef<HTMLButtonElement>(null);

  // Escape closes it, the page behind stops scrolling, and focus returns to
  // the card that opened it.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    startRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [onClose]);

  const lessons = journey.lessonCount ?? 0;
  const zones = journey.zoneCount ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="journey-dialog-title"
        onClick={(event) => event.stopPropagation()}
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-[#37464F] bg-[#19282E] shadow-[0_24px_80px_rgba(0,0,0,0.5)] sm:max-w-md sm:rounded-3xl"
      >
        <div className="relative h-40 overflow-hidden bg-gradient-to-br from-[#5B3A7A] to-[#1F1230] sm:h-44">
          {journey.heroImageUrl && (
            <SmartImage
              src={journey.heroImageUrl}
              alt=""
              priority
              className="h-full w-full object-cover"
              draggable={false}
            />
          )}

          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#19282E] via-transparent to-black/20"
          />

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="px-5 pb-6 pt-1 sm:px-6">
          {journey.category && (
            <span className="inline-block rounded-full bg-[#26373E] px-3 py-1 text-xs font-bold text-[#C8D3DA]">
              {journey.category}
            </span>
          )}

          <h2
            id="journey-dialog-title"
            className="mt-2 break-words font-display text-2xl font-extrabold leading-tight text-white"
          >
            {journey.title}
          </h2>

          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm font-semibold text-[#A9BAC0]">
            {lessons > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                {lessons} {lessons === 1 ? 'lesson' : 'lessons'}
              </span>
            )}
            {zones > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Layers className="h-4 w-4" aria-hidden="true" />
                {zones} {zones === 1 ? 'zone' : 'zones'}
              </span>
            )}
            {journey.authorUsername && (
              <span className="inline-flex items-center gap-1.5">
                <User className="h-4 w-4" aria-hidden="true" />@{journey.authorUsername}
              </span>
            )}
          </p>

          <p className="mt-5 text-sm font-bold text-white">
            How do you want to learn this?
          </p>

          <div className="mt-3 flex flex-col gap-3">
            <button
              ref={startRef}
              type="button"
              onClick={onStart}
              disabled={importing}
              className={`${choiceClasses} border-orange bg-[#253238] hover:brightness-110`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange/15 text-orange">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </span>

              <span className="min-w-0">
                <span className="block text-sm font-extrabold text-white">
                  Make it mine
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-[#91A4AC]">
                  Grokit builds a new journey on this topic, matched to your
                  level and goals.
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={onImport}
              disabled={importing}
              className={`${choiceClasses} border-[#37464F] bg-[#19262B] hover:border-[#536871]`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#26373E] text-[#C8D3DA]">
                <Download className="h-5 w-5" aria-hidden="true" />
              </span>

              <span className="min-w-0">
                <span className="block text-sm font-extrabold text-white">
                  {importing ? 'Importing…' : 'Import the original journey'}
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-[#91A4AC]">
                  {journey.authorUsername
                    ? `Get the exact zones and lessons @${journey.authorUsername} made. `
                    : 'Get the exact zones and lessons the author made. '}
                  Your progress stays your own.
                </span>
              </span>
            </button>
          </div>

          {importError && (
            <p role="alert" className="mt-3 text-sm leading-6 text-red-300">
              {importError}
            </p>
          )}

          <button
            type="button"
            onClick={onToggleSave}
            disabled={savePending || importing}
            aria-pressed={saved}
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-[#C8D3DA] transition hover:bg-[#26373E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange disabled:opacity-60"
          >
            <Bookmark
              className="h-4 w-4"
              fill={saved ? 'currentColor' : 'none'}
              aria-hidden="true"
            />
            {saved ? 'Saved for later' : 'Save for later'}
          </button>
        </div>
      </div>
    </div>
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
  const [selected, setSelected] = useState<PublicJourney | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const importingRef = useRef(false);

  // The details stay open while an import runs, so the learner lands in the
  // new journey instead of on a screen they had already closed.
  const closeDetails = useCallback(() => {
    if (importingRef.current) return;

    setSelected(null);
    setImportError(null);
  }, []);

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

  // Clicking a card opens its details. "Start this journey" begins the same
  // flow as Create (personalise, then generate) with the topic already filled
  // in, so nobody has to retype it.
  const openJourney = useCallback((journey: PublicJourney) => {
    setImportError(null);
    setSelected(journey);
  }, []);

  // "Import the original journey" copies the author's zones and finished
  // lessons into the learner's own journeys, then opens the copy.
  const importOriginal = useCallback(
    async (journey: PublicJourney) => {
      if (importingRef.current) return;

      importingRef.current = true;
      setImporting(true);
      setImportError(null);

      try {
        const course = await importJourney(journey.id);

        navigate(`/learn/course/${course.id}`, {
          state: { newlyCreatedJourneyId: course.id, refreshJourneys: true },
        });
      } catch (importErr) {
        console.error('[Explore] Failed to import journey:', importErr);

        setImportError(
          importErr instanceof LimitReachedError
            ? importErr.message
            : importErr instanceof Error && importErr.message === 'JOURNEY_UNAVAILABLE'
            ? 'The author has removed this journey, so it can’t be imported.'
            : 'We couldn’t import this journey. Please try again.',
        );
      } finally {
        importingRef.current = false;
        setImporting(false);
      }
    },
    [navigate],
  );

  const startJourney = useCallback(
    (journey: PublicJourney) => {
      navigate('/learn/personalize', {
        state: {
          prompt: journey.topic?.trim() || journey.title,
          attachmentName: null,
        },
      });
    },
    [navigate],
  );

  const handlers: TileHandlers = {
    onOpen: openJourney,
    onStart: startJourney,
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
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.02em] text-white sm:text-5xl">
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

      {selected && (
        <JourneyDialog
          journey={selected}
          saved={savedIds.has(selected.id)}
          savePending={pendingSaves.has(selected.id)}
          importing={importing}
          importError={importError}
          onClose={closeDetails}
          onStart={() => startJourney(selected)}
          onImport={() => void importOriginal(selected)}
          onToggleSave={() => void toggleSave(selected)}
        />
      )}
    </div>
  );
}