import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router';
import {
  ArrowRight,
  ChevronRight,
  Compass,
  Library,
  Loader2,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Settings,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';
import { fetchUserAttributes } from 'aws-amplify/auth';

import { GrokitLogo } from '../../components/Grokitlogo';
import { signOutUser } from '../auth/authService';
import { listCourses } from '../../lib/courseGeneration';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface Journey {
  id: string;
  title: string;
}

interface AppShellProps {
  children: ReactNode;
  courses?: Journey[];
  coursesLoading?: boolean;
  userName?: string;
}

interface RouteState {
  refreshJourneys?: boolean;
  newlyCreatedJourneyId?: string;
  [key: string]: unknown;
}

const navItems = [
  { label: 'Create', icon: Sparkles, to: '/create' },
  { label: 'Explore', icon: Compass, to: '/explore' },
  { label: 'Library', icon: Library, to: '/library' },
];

// -----------------------------------------------------------------------------
// App shell
// -----------------------------------------------------------------------------

export default function AppShell({
  children,
  courses: providedCourses,
  coursesLoading: providedCoursesLoading,
  userName: providedUserName,
}: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [userName, setUserName] = useState(providedUserName || 'You');

  const [loadedCourses, setLoadedCourses] = useState<Journey[]>([]);
  const [loadedCoursesLoading, setLoadedCoursesLoading] = useState(
    providedCourses === undefined,
  );
  const [coursesError, setCoursesError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const accountRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef(0);
  const hasLoadedRef = useRef(false);
  const handledCreationRef = useRef<string | null>(null);

  const courses = providedCourses ?? loadedCourses;
  const coursesLoading =
    providedCoursesLoading ?? loadedCoursesLoading;

  const pathname = location.pathname
    .replace(/\/+$/, '')
    .toLowerCase();

  const isCreateFlow =
    pathname === '/' ||
    pathname === '/create' ||
    pathname.startsWith('/learn/personalize') ||
    pathname.startsWith('/learn/generating');

  const refreshJourneys = useCallback(() => {
    if (providedCourses !== undefined) return;
    setRefreshKey((current) => current + 1);
  }, [providedCourses]);

  // ---------------------------------------------------------------------------
  // Load journeys
  //
  // Intentionally does not depend on location.pathname. Ordinary navigation
  // must not reload the sidebar list.
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (providedCourses !== undefined) {
      setLoadedCoursesLoading(false);
      return;
    }

    let cancelled = false;
    const requestId = ++requestRef.current;

    const loadJourneys = async () => {
      // Only show skeletons on the first load, not during background refreshes.
      if (!hasLoadedRef.current) {
        setLoadedCoursesLoading(true);
      }

      setCoursesError(false);

      try {
        const records = await listCourses();

        if (cancelled || requestId !== requestRef.current) return;

        const journeys: Journey[] = records
          .filter(
            (record): record is typeof record & {
              id: string;
              title: string;
            } => Boolean(record.id && record.title),
          )
          .map((record) => ({
            id: record.id,
            title: record.title,
          }));

        setLoadedCourses(journeys);
        hasLoadedRef.current = true;
        setCoursesError(false);
      } catch (error) {
        if (cancelled || requestId !== requestRef.current) return;

        console.error(
          '[AppShell] Unable to load journeys for the sidebar:',
          error,
        );
        setCoursesError(true);
      } finally {
        if (!cancelled && requestId === requestRef.current) {
          setLoadedCoursesLoading(false);
        }
      }
    };

    void loadJourneys();

    return () => {
      cancelled = true;
    };
  }, [providedCourses, refreshKey]);

  // ---------------------------------------------------------------------------
  // Refresh once when generation navigates to a newly created journey.
  // Clear the one-time flag from route state to avoid repeated refreshes.
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (providedCourses !== undefined) return;

    const state = location.state as RouteState | null;
    if (!state?.refreshJourneys) return;

    const creationKey =
      state.newlyCreatedJourneyId ??
      `${location.pathname}:created`;

    if (handledCreationRef.current === creationKey) return;

    handledCreationRef.current = creationKey;
    refreshJourneys();

    const nextState: RouteState = { ...state };
    delete nextState.refreshJourneys;

    navigate(location.pathname + location.search + location.hash, {
      replace: true,
      state: nextState,
    });
  }, [
    location.pathname,
    location.search,
    location.hash,
    location.state,
    navigate,
    providedCourses,
    refreshJourneys,
  ]);

  // ---------------------------------------------------------------------------
  // Load account name
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (providedUserName) {
      setUserName(providedUserName);
      return;
    }

    let cancelled = false;

    const loadUserName = async () => {
      try {
        const attributes = await fetchUserAttributes();

        if (cancelled) return;

        setUserName(
          attributes.name ||
            attributes.preferred_username ||
            attributes.email?.split('@')[0] ||
            'You',
        );
      } catch {
        if (!cancelled) setUserName('You');
      }
    };

    void loadUserName();

    return () => {
      cancelled = true;
    };
  }, [providedUserName]);

  // ---------------------------------------------------------------------------
  // Close popovers and drawers
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (
        accountRef.current &&
        !accountRef.current.contains(event.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false);
        setLogoutConfirmOpen(false);
        setMobileNavOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
    setAccountMenuOpen(false);
  }, [location.pathname]);

  const openLogoutConfirmation = () => {
    setAccountMenuOpen(false);
    setLogoutConfirmOpen(true);
  };

  // ---------------------------------------------------------------------------
  // Primary navigation
  // ---------------------------------------------------------------------------

  const renderNavigation = () => (
    <nav aria-label="Main navigation" className="flex flex-col gap-1">
      {navItems.map(({ label, icon: Icon, to }) => (
        <NavLink
          key={label}
          to={to}
          end
          className={({ isActive }) => {
            const active = label === 'Create' ? isCreateFlow : isActive;

            return [
              'group relative flex min-h-[48px] items-center gap-3 rounded-2xl px-4',
              'font-sans text-[15px] font-bold transition-all duration-150',
              active
                ? 'bg-[#203138] !text-[#FF6B00]'
                : 'text-[#91A4AC] hover:bg-[#1A292F] hover:text-white',
            ].join(' ');
          }}
        >
          {({ isActive }) => {
            const active = label === 'Create' ? isCreateFlow : isActive;

            return (
              <>
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-orange"
                  />
                )}

                <Icon
                  aria-hidden="true"
                  className={`h-5 w-5 shrink-0 ${
                    active ? 'text-orange' : 'text-[#91A4AC]'
                  }`}
                />

                <span>{label}</span>
              </>
            );
          }}
        </NavLink>
      ))}
    </nav>
  );

  // ---------------------------------------------------------------------------
  // Journey list
  // ---------------------------------------------------------------------------

  const renderJourneys = () => (
    <section className="mt-9 flex min-h-0 flex-1 flex-col">
      <div className="mb-2 flex items-center justify-between px-3">
        <h2 className="font-sans text-xs font-extrabold uppercase tracking-[0.08em] text-[#78909A]">
          My Journeys
        </h2>

        <div className="flex items-center gap-1">
          {coursesError && (
            <button
              type="button"
              onClick={refreshJourneys}
              aria-label="Retry loading journeys"
              title="Retry loading journeys"
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#91A4AC] transition-colors hover:bg-[#203138] hover:text-orange"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}

          <NavLink
            to="/create"
            aria-label="Create a new journey"
            title="Create a new journey"
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#91A4AC] transition-colors hover:bg-[#203138] hover:text-orange"
          >
            <Plus className="h-4 w-4" />
          </NavLink>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {coursesLoading ? (
          <div
            aria-label="Loading journeys"
            aria-busy="true"
            className="space-y-2 px-1 pt-1"
          >
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-12 animate-pulse rounded-2xl bg-[#1A292F]"
              />
            ))}
          </div>
        ) : coursesError && courses.length === 0 ? (
          <div className="mx-1 mt-1 rounded-2xl border border-[#34474F] bg-[#19282E] p-3">
            <p className="text-sm font-bold text-[#D6E0E3]">
              Journeys unavailable
            </p>

            <p className="mt-1 text-xs leading-5 text-[#78909A]">
              We couldn’t load your journeys.
            </p>

            <button
              type="button"
              onClick={refreshJourneys}
              className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-orange hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try again
            </button>
          </div>
        ) : courses.length === 0 ? (
          <NavLink
            to="/create"
            className="group mx-1 mt-1 flex items-center gap-3 rounded-2xl border border-dashed border-[#34474F] px-3 py-3 transition-all hover:border-orange/40 hover:bg-[#1A292F]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange/10 text-orange">
              <Plus className="h-4 w-4" />
            </span>

            <span className="min-w-0">
              <span className="block truncate text-sm font-extrabold text-[#D6E0E3]">
                Create a journey
              </span>

              <span className="mt-0.5 block text-[11px] font-medium text-[#60757E]">
                Start with an idea
              </span>
            </span>
          </NavLink>
        ) : (
          <div className="flex flex-col gap-1">
            {courses.map((course) => (
              <NavLink
                key={course.id}
                to={`/learn/course/${course.id}`}
                className={({ isActive }) =>
                  [
                    'group flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-[#203138] text-white'
                      : 'text-[#91A4AC] hover:bg-[#1A292F] hover:text-white',
                  ].join(' ')
                }
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#203138] text-orange">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>

                <span className="min-w-0 flex-1 truncate">
                  {course.title}
                </span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </section>
  );

  // ---------------------------------------------------------------------------
  // Account controls
  // ---------------------------------------------------------------------------

  const renderAccount = (mobile = false) => (
    <div
      ref={accountRef}
      className="relative mt-auto border-t border-[#2D3C43] pt-4"
    >
      {accountMenuOpen && (
        <AccountMenu
          mobile={mobile}
          onProfile={() => {
            setAccountMenuOpen(false);
            navigate('/profile');
          }}
          onSettings={() => {
            setAccountMenuOpen(false);
            navigate('/settings');
          }}
          onLogout={openLogoutConfirmation}
        />
      )}

      <AccountButton
        userName={userName}
        open={accountMenuOpen}
        onClick={() => setAccountMenuOpen((value) => !value)}
      />
    </div>
  );

  // ---------------------------------------------------------------------------
  // Layout
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-[100dvh] bg-[#131F24] text-white">
      <div className="flex min-h-[100dvh]">
        {/* Desktop sidebar */}
        <aside className="hidden w-[270px] shrink-0 flex-col border-r border-[#2D3C43] bg-[#131F24] px-4 py-5 lg:flex xl:w-[292px]">
          <div className="mb-8 flex min-h-[48px] items-center px-3">
            <GrokitLogo className="h-[42px] w-[112px] shrink-0 object-contain object-left" />
          </div>

          {renderNavigation()}
          {renderJourneys()}
          {renderAccount()}
        </aside>

        {/* Mobile top bar */}
        <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-[#2D3C43] bg-[#131F24]/95 px-4 backdrop-blur-xl lg:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
            aria-expanded={mobileNavOpen}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#D2DFE4] hover:bg-[#203138]"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="absolute left-1/2 -translate-x-1/2">
            <GrokitLogo className="h-[36px] w-[94px] object-contain" />
          </div>

          <div className="w-10" />
        </header>

        {/* Mobile navigation backdrop */}
        {mobileNavOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}

        {/* Mobile drawer */}
        <aside
          aria-label="Mobile navigation"
          aria-hidden={!mobileNavOpen}
          className={[
            'fixed inset-y-0 left-0 z-[70] flex w-[min(86vw,320px)] flex-col border-r border-[#2D3C43] bg-[#131F24] px-4 py-5 transition-transform duration-200 lg:hidden',
            mobileNavOpen ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
        >
          <div className="mb-8 flex min-h-[48px] items-center justify-between px-3">
            <GrokitLogo className="h-[42px] w-[112px] shrink-0 object-contain object-left" />

            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[#91A4AC] hover:bg-[#203138] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {renderNavigation()}
          {renderJourneys()}
          {renderAccount(true)}
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1 pt-16 lg:pt-0">
          {children}
        </div>
      </div>

      {/* Logout confirmation */}
      {logoutConfirmOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setLogoutConfirmOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
            className="w-full max-w-sm rounded-[24px] border border-[#37464F] bg-[#19282E] p-6 shadow-2xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange/10 text-orange">
              <LogOut className="h-5 w-5" />
            </div>

            <h2
              id="logout-dialog-title"
              className="mt-5 font-display text-xl font-extrabold text-white"
            >
              Log out?
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#91A4AC]">
              You can sign back in whenever you’re ready. Your saved
              journeys will remain in your account.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(false)}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-[#37464F] px-4 text-sm font-bold text-[#C8D3DA] transition hover:bg-[#26373E]"
              >
                Stay logged in
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await signOutUser();
                  } catch (error) {
                    console.error('[AppShell] Sign-out failed:', error);
                  } finally {
                    setLogoutConfirmOpen(false);
                    navigate('/login', { replace: true });
                  }
                }}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-orange px-4 text-sm font-extrabold text-white transition hover:brightness-110"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Account button
// -----------------------------------------------------------------------------

function AccountButton({
  userName,
  open,
  onClick,
}: {
  userName: string;
  open: boolean;
  onClick: () => void;
}) {
  const initials = userName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-[#1A292F]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#3A505A] bg-[#203138] text-sm font-extrabold text-orange">
        {initials || 'Y'}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-extrabold text-white">
          {userName}
        </span>
        <span className="mt-0.5 block text-xs text-[#78909A]">
          Your account
        </span>
      </span>

      <ChevronRight
        className={`h-4 w-4 shrink-0 text-[#78909A] transition-transform ${
          open ? 'rotate-90' : ''
        }`}
      />
    </button>
  );
}

// -----------------------------------------------------------------------------
// Account menu
// -----------------------------------------------------------------------------

function AccountMenu({
  mobile,
  onProfile,
  onSettings,
  onLogout,
}: {
  mobile: boolean;
  onProfile: () => void;
  onSettings: () => void;
  onLogout: () => void;
}) {
  return (
    <div
      role="menu"
      className={[
        'z-[80] rounded-2xl border border-[#37464F] bg-[#19282E] p-2 shadow-2xl',
        mobile
          ? 'mb-3'
          : 'absolute bottom-full left-0 right-0 mb-3',
      ].join(' ')}
    >
      <button
        type="button"
        role="menuitem"
        onClick={onProfile}
        className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-[#C8D3DA] transition hover:bg-[#26373E] hover:text-white"
      >
        <UserRound className="h-4 w-4 text-[#91A4AC]" />
        Profile
        <ArrowRight className="ml-auto h-3.5 w-3.5 text-[#60757E]" />
      </button>

      <button
        type="button"
        role="menuitem"
        onClick={onSettings}
        className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-[#C8D3DA] transition hover:bg-[#26373E] hover:text-white"
      >
        <Settings className="h-4 w-4 text-[#91A4AC]" />
        Settings
        <ArrowRight className="ml-auto h-3.5 w-3.5 text-[#60757E]" />
      </button>

      <div className="my-2 border-t border-[#37464F]" />

      <button
        type="button"
        role="menuitem"
        onClick={onLogout}
        className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-[#FF9A7A] transition hover:bg-[#3A2826] hover:text-white"
      >
        <LogOut className="h-4 w-4" />
        Log out
      </button>
    </div>
  );
}
