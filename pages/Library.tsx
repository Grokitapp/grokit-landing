import {
  useEffect,
  useMemo,
  useState,
  type SubmitEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router';
import { fetchUserAttributes } from 'aws-amplify/auth';
import {
  Bookmark,
  Calendar,
  Loader2,
  NotebookPen,
  Plus,
  Trash2,
} from 'lucide-react';

import { cacheKeys, useCachedQuery } from '../lib/cache';
import { listCourses } from '../lib/courseGeneration';
import { listPublicJourneys } from '../lib/explore';
import { getProfile } from '../lib/profile';
import {
  createNote,
  deleteNote,
  listNotes,
  listSavedJourneys,
  unsaveJourney,
  updateNote,
  type Note,
  type SavedJourney,
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

type TabId = 'journeys' | 'saved' | 'notes';

type CourseRecord = Awaited<ReturnType<typeof listCourses>>[number];

interface MyJourneysData {
  courses: CourseRecord[];
  publicCourseIds: Set<string>;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'journeys', label: 'My journeys' },
  { id: 'saved', label: 'Saved journeys' },
  { id: 'notes', label: 'Notes' },
];

const SEARCH_PLACEHOLDERS: Record<TabId, string> = {
  journeys: 'Search your journeys...',
  saved: 'Search saved journeys...',
  notes: 'Search your notes...',
};

const gridClasses =
  'mt-6 grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4';

function matches(query: string, ...fields: (string | null | undefined)[]) {
  const haystack = fields.join(' ').toLowerCase();

  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

function formatDate(value?: string | null) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function courseMeta(course: CourseRecord, author: string) {
  switch (course.status) {
    case 'GENERATING':
      return 'Generating...';
    case 'FAILED':
      return 'Generation failed';
    case 'DRAFT':
      return 'Draft';
    default: {
      const date = formatDate(course.createdAt);

      if (!date) return '';

      return `Created on ${date}`;
    }
  }
}

// Shown on its own line under the date, e.g. "by workbuddytwo".
function courseByline(course: CourseRecord, author: string) {
  if (!author) return '';
  if (course.status === 'GENERATING' || course.status === 'FAILED' || course.status === 'DRAFT') return '';
  if (!formatDate(course.createdAt)) return '';

  return `by ${author}`;
}

function savedMeta(journey: SavedJourney) {
  const lessons = journey.lessonCount ?? 0;

  return lessons > 0 ? `${lessons} ${lessons === 1 ? 'lesson' : 'lessons'}` : '';
}

// The signed-in learner's public name (username first, then account name).
function useAuthorName() {
  const [author, setAuthor] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      let name = '';

      try {
        const username = (await getProfile())?.username?.trim() || '';

        name = username ? `@${username}` : '';
      } catch {
        // Fall back to the account name below.
      }

      if (!name) {
        try {
          const attributes = await fetchUserAttributes();

          name =
            attributes.name ||
            attributes.preferred_username ||
            attributes.email?.split('@')[0] ||
            '';
        } catch {
          // The label is optional; leave it out if nothing loads.
        }
      }

      if (!cancelled) setAuthor(name);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return author;
}

// Tab data comes from the shared cache: a tab opened before shows its last
// result instantly and refreshes quietly in the background.
function useTabData<T>(key: string, active: boolean, loader: () => Promise<T>) {
  const query = useCachedQuery(key, loader, { enabled: active });

  return {
    data: query.data,
    setData: query.setData,
    error: query.error,
    retry: query.refetch,
    loading: query.loading,
  };
}

// -----------------------------------------------------------------------------
// Loaders (module-level so their identity is stable)
// -----------------------------------------------------------------------------

async function loadMyJourneys(): Promise<MyJourneysData> {
  const courses = (await listCourses()).filter(
    (course) => !(course as { archived?: boolean | null }).archived,
  );

  // The "Public" badge is a nicety; don't fail the tab if it can't load.
  let publicCourseIds = new Set<string>();

  try {
    const publicJourneys = await listPublicJourneys();
    const ownIds = new Set(courses.map((course) => course.id));

    publicCourseIds = new Set(
      publicJourneys
        .map((journey) => journey.courseId)
        .filter((courseId) => ownIds.has(courseId)),
    );
  } catch (publicError) {
    console.error('[Library] Failed to load public status:', publicError);
  }

  return { courses, publicCourseIds };
}

// -----------------------------------------------------------------------------
// Skeleton
// -----------------------------------------------------------------------------

function GridSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      className={`${gridClasses} animate-pulse`}
    >
      {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
        <TileSkeleton key={item} fluid />
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Note editor
// -----------------------------------------------------------------------------

function NoteEditor({
  note,
  onSave,
  onDelete,
  onClose,
}: {
  note: Note | null;
  onSave: (title: string, content: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSave = title.trim().length > 0 && busy === null;

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSave) return;

    setBusy('save');
    setError(null);

    try {
      await onSave(title.trim(), content.trim());
    } catch {
      setError('We couldn’t save this note. Please try again.');
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || busy) return;

    setBusy('delete');
    setError(null);

    try {
      await onDelete();
    } catch {
      setError('We couldn’t delete this note. Please try again.');
      setBusy(null);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-editor-title"
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !busy) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[560px] rounded-[26px] border border-[#34434A] bg-[#19272D] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:p-7"
      >
        <h2
          id="note-editor-title"
          className="font-display text-2xl font-extrabold tracking-[-0.02em] text-white"
        >
          {note ? 'Edit note' : 'New note'}
        </h2>

        <label
          htmlFor="note-title"
          className="mt-5 block text-sm font-semibold text-[#91A4AC]"
        >
          Title
        </label>

        <input
          id="note-title"
          type="text"
          autoFocus
          maxLength={120}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={busy !== null}
          className="mt-2 w-full rounded-2xl border border-[#344951] bg-[#131F24] px-4 py-3 text-base font-semibold text-white outline-none transition-colors placeholder:text-[#60757E] focus:border-orange disabled:opacity-60"
        />

        <label
          htmlFor="note-content"
          className="mt-4 block text-sm font-semibold text-[#91A4AC]"
        >
          Note
        </label>

        <textarea
          id="note-content"
          rows={8}
          maxLength={10000}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          disabled={busy !== null}
          className="mt-2 w-full resize-y rounded-2xl border border-[#344951] bg-[#131F24] px-4 py-3 text-base font-medium leading-6 text-white outline-none transition-colors placeholder:text-[#60757E] focus:border-orange disabled:opacity-60"
        />

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-3 py-2.5 text-xs font-medium text-red-200"
          >
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          {onDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy !== null}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl px-4 text-sm font-extrabold text-red-300 transition-colors hover:bg-red-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:pointer-events-none disabled:opacity-50"
            >
              {busy === 'delete' ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              )}
              Delete
            </button>
          ) : (
            <span />
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={busy !== null}
              className="min-h-[46px] rounded-2xl border border-[#344951] bg-[#1D3037] px-5 text-sm font-extrabold text-[#D7E0E3] transition-colors hover:bg-[#24383F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange disabled:pointer-events-none disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!canSave}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-orange px-5 text-sm font-extrabold text-white shadow-[0_4px_0_#C94713] transition-all hover:brightness-105 active:translate-y-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-[#19272D] disabled:pointer-events-none disabled:opacity-50"
            >
              {busy === 'save' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Saving...
                </>
              ) : (
                'Save note'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.body,
  );
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default function Library() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedTab = searchParams.get('tab');
  const tab: TabId = TABS.some((item) => item.id === requestedTab)
    ? (requestedTab as TabId)
    : 'journeys';

  const author = useAuthorName();
  const [query, setQuery] = useState('');
  const trimmedQuery = query.trim();

  const journeysTab = useTabData(cacheKeys.myJourneys, tab === 'journeys', loadMyJourneys);
  const savedTab = useTabData(cacheKeys.savedJourneys, tab === 'saved', listSavedJourneys);
  const notesTab = useTabData(cacheKeys.notes, tab === 'notes', listNotes);

  // null = closed, 'new' = blank editor, otherwise the note being edited
  const [editing, setEditing] = useState<Note | 'new' | null>(null);
  const [pendingUnsaves, setPendingUnsaves] = useState<Set<string>>(new Set());

  const changeTab = (next: TabId) => {
    setQuery('');
    setSearchParams(next === 'journeys' ? {} : { tab: next }, { replace: true });
  };

  // ---- My journeys ----------------------------------------------------------

  const visibleCourses = useMemo(
    () =>
      (journeysTab.data?.courses ?? []).filter((course) =>
        trimmedQuery
          ? matches(trimmedQuery, course.title, course.topic, course.description)
          : true,
      ),
    [journeysTab.data, trimmedQuery],
  );

  // ---- Saved ----------------------------------------------------------------

  const visibleSaved = useMemo(
    () =>
      (savedTab.data ?? []).filter((item) =>
        trimmedQuery
          ? matches(trimmedQuery, item.title, item.topic, item.category)
          : true,
      ),
    [savedTab.data, trimmedQuery],
  );

  const handleUnsave = async (item: SavedJourney) => {
    if (pendingUnsaves.has(item.id)) return;

    setPendingUnsaves((current) => new Set(current).add(item.id));

    try {
      await unsaveJourney(item.id);
      savedTab.setData((current) =>
        (current ?? []).filter((saved) => saved.id !== item.id),
      );
    } catch (unsaveError) {
      console.error('[Library] Failed to unsave journey:', unsaveError);
    } finally {
      setPendingUnsaves((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
    }
  };

  // Saved journeys start the create flow with the same topic.
  // Create.tsx reads `location.state.prefillTopic`.
  const openSaved = (item: SavedJourney) =>
    navigate('/create', { state: { prefillTopic: item.topic } });

  // ---- Notes ----------------------------------------------------------------

  const visibleNotes = useMemo(
    () =>
      (notesTab.data ?? []).filter((note) =>
        trimmedQuery
          ? matches(trimmedQuery, note.title, note.content, note.courseTitle)
          : true,
      ),
    [notesTab.data, trimmedQuery],
  );

  const handleSaveNote = async (title: string, content: string) => {
    if (editing === 'new') {
      const created = await createNote({ title, content });

      notesTab.setData((current) => [created, ...(current ?? [])]);
    } else if (editing) {
      const updated = await updateNote(editing.id, { title, content });

      notesTab.setData((current) =>
        [updated, ...(current ?? []).filter((note) => note.id !== updated.id)],
      );
    }

    setEditing(null);
  };

  const handleDeleteNote = async () => {
    if (!editing || editing === 'new') return;

    await deleteNote(editing.id);

    const deletedId = editing.id;

    notesTab.setData((current) =>
      (current ?? []).filter((note) => note.id !== deletedId),
    );
    setEditing(null);
  };

  // ---- Rendering ------------------------------------------------------------

  const active =
    tab === 'journeys' ? journeysTab : tab === 'saved' ? savedTab : notesTab;

  const renderContent = () => {
    if (active.loading) return <GridSkeleton />;

    if (active.error) {
      return (
        <MessageState
          title="Couldn’t load this tab"
          text="Something went wrong. Please try again."
          action={{ label: 'Try again', retry: true, onClick: active.retry }}
        />
      );
    }

    if (tab === 'journeys') {
      const total = journeysTab.data?.courses.length ?? 0;

      if (total === 0) {
        return (
          <MessageState
            title="No journeys yet"
            text="Journeys you create will show up here."
            action={{ label: 'Create a journey', onClick: () => navigate('/create') }}
          />
        );
      }

      if (visibleCourses.length === 0) {
        return (
          <MessageState
            title="No journeys found"
            text={`Nothing matches “${trimmedQuery}”.`}
            action={{ label: 'Clear search', onClick: () => setQuery('') }}
          />
        );
      }

      return (
        <div className={gridClasses}>
          {visibleCourses.map((course) => (
            <JourneyTile
              key={course.id}
              fluid
              title={course.title}
              imageUrl={course.heroImageUrl}
              badge={
                journeysTab.data?.publicCourseIds.has(course.id)
                  ? 'Public'
                  : null
              }
              meta={courseMeta(course, author)}
              byline={courseByline(course, author)}
              onOpen={() => navigate(`/learn/course/${course.id}`)}
            />
          ))}
        </div>
      );
    }

    if (tab === 'saved') {
      const total = savedTab.data?.length ?? 0;

      if (total === 0) {
        return (
          <MessageState
            title="No saved journeys"
            text="Tap the bookmark on any journey in Explore to keep it here."
            action={{ label: 'Browse Explore', onClick: () => navigate('/explore') }}
          />
        );
      }

      if (visibleSaved.length === 0) {
        return (
          <MessageState
            title="No journeys found"
            text={`Nothing matches “${trimmedQuery}”.`}
            action={{ label: 'Clear search', onClick: () => setQuery('') }}
          />
        );
      }

      return (
        <div className={gridClasses}>
          {visibleSaved.map((item) => (
            <JourneyTile
              key={item.id}
              fluid
              title={item.title}
              imageUrl={item.heroImageUrl}
              badge={item.category}
              meta={savedMeta(item)}
              byline={item.authorUsername ? `by @${item.authorUsername}` : undefined}
              onOpen={() => openSaved(item)}
              action={
                <TileMenu
                  label={item.title}
                  items={[
                    {
                      label: 'Remove from saved',
                      icon: (
                        <Bookmark
                          className="h-4 w-4"
                          fill="currentColor"
                          aria-hidden="true"
                        />
                      ),
                      disabled: pendingUnsaves.has(item.id),
                      onClick: () => void handleUnsave(item),
                    },
                  ]}
                />
              }
            />
          ))}
        </div>
      );
    }

    const total = notesTab.data?.length ?? 0;

    if (total === 0) {
      return (
        <MessageState
          icon={<NotebookPen className="h-7 w-7" aria-hidden="true" />}
          title="No notes yet"
          text="Write down ideas, summaries or anything you want to remember."
          action={{ label: 'Write a note', onClick: () => setEditing('new') }}
        />
      );
    }

    if (visibleNotes.length === 0) {
      return (
        <MessageState
          title="No notes found"
          text={`Nothing matches “${trimmedQuery}”.`}
          action={{ label: 'Clear search', onClick: () => setQuery('') }}
        />
      );
    }

    return (
      <div className={gridClasses}>
        {visibleNotes.map((note) => (
          <button
            key={note.id}
            type="button"
            onClick={() => setEditing(note)}
            aria-label={`Edit note ${note.title}`}
            className="flex min-h-[170px] flex-col rounded-2xl border border-[#2D4149] bg-[#17262C] p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-orange/50 hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
          >
            <h3 className="line-clamp-2 font-display text-base font-extrabold leading-snug text-white">
              {note.title}
            </h3>

            {note.content && (
              <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm leading-6 text-[#A9BAC0]">
                {note.content}
              </p>
            )}

            <p className="mt-auto flex items-center gap-2 pt-3 text-xs font-semibold text-[#78909A]">
              <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {formatDate(note.updatedAt ?? note.createdAt)}
                {note.courseTitle ? ` · ${note.courseTitle}` : ''}
              </span>
            </p>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="relative min-h-[100dvh]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(56,120,160,0.16),transparent_70%)]"
      />

      <div className="relative mx-auto w-full max-w-[1180px] px-4 pb-12 pt-6 sm:px-7 sm:pt-8 xl:px-9">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-extrabold tracking-[-0.02em] text-white sm:text-5xl">
              Library
            </h1>
            <p className="mt-2 text-sm font-medium text-[#A9BAC0] sm:text-base">
              Your journeys, saved journeys and notes in one place.
            </p>
          </div>

          {tab === 'notes' && notesTab.data !== null && !notesTab.error && (
            <button
              type="button"
              onClick={() => setEditing('new')}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange px-4 text-sm font-extrabold text-white shadow-[0_3px_0_#C94713] transition hover:brightness-110 active:translate-y-0.5 active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-[#131F24]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              New note
            </button>
          )}
        </header>

        <div
          role="tablist"
          aria-label="Library sections"
          className="mt-6 flex gap-1 overflow-x-auto rounded-2xl border border-[#2D4149] bg-[#17262C]/80 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:inline-flex"
        >
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => changeTab(item.id)}
              className={`min-h-10 shrink-0 rounded-xl px-4 text-sm font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange ${
                tab === item.id
                  ? 'bg-orange text-white'
                  : 'text-[#91A4AC] hover:bg-[#203138] hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-5">
          <SearchField
            value={query}
            onChange={setQuery}
            disabled={active.loading || active.error}
            placeholder={SEARCH_PLACEHOLDERS[tab]}
            label={SEARCH_PLACEHOLDERS[tab].replace('...', '')}
          />
        </div>

        <div role="tabpanel">{renderContent()}</div>
      </div>

      {editing && (
        <NoteEditor
          note={editing === 'new' ? null : editing}
          onSave={handleSaveNote}
          onDelete={editing === 'new' ? undefined : handleDeleteNote}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}