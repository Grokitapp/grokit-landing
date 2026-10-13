import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import {
  ArrowRight,
  ChevronRight,
  Compass,
  Flame,
  Library,
  Loader2,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  Settings,
  Sparkles,
  Trophy,
  UserRound,
  X,
  Zap,
} from 'lucide-react';
import { fetchUserAttributes } from 'aws-amplify/auth';

import { GrokitLogo } from '../../components/Grokitlogo';
import { signOutUser } from '../auth/authService';
import { listCourses } from '../../lib/courseGeneration';
import { USERNAME_CHANGED_EVENT, getProfile } from '../../lib/profile';
import {
  JOURNEY_CHANGED_EVENT,
  type JourneyChange,
} from '../../lib/courseActions';
import JourneyMenu from './components/JourneyMenu';
import { StatChip } from './components/GamificationCards';
import { resetGamification, useGamification } from '../../lib/gamification';

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

interface JourneyRouteState {
  newlyCreatedJourneyId?: string;
  refreshJourneys?: boolean;
  [key: string]: unknown;
}

const navItems = [
  { label: 'Create', icon: Sparkles, to: '/create' },
  { label: 'Explore', icon: Compass, to: '/explore' },
  { label: 'Library', icon: Library, to: '/library' },
  { label: 'Leaderboard', icon: Trophy, to: '/leaderboard' },
];

// Module-level caches survive remounts (e.g. Create -> Personalize -> back), so the
// sidebar never flashes skeletons for data we already have. Cleared on logout.
let cachedJourneys: Journey[] | null = null;
let cachedUserName: string | null = null;

const SIDEBAR_COLLAPSED_KEY = 'grokit:sidebar-collapsed';

function readSidebarCollapsed() {
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

export default function AppShell({
  children,
  courses: providedCourses,
  coursesLoading: providedCoursesLoading,
  userName: providedUserName,
}: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Streak + XP for the sidebar chips; refetched whenever the route changes so
  // finishing a lesson is reflected as soon as the learner navigates back.
  const { stats: game } = useGamification(location.pathname);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readSidebarCollapsed);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [userName, setUserName] = useState(
    providedUserName || cachedUserName || 'You',
  );

  const [loadedCourses, setLoadedCourses] = useState<Journey[]>(
    cachedJourneys ?? [],
  );
  const [loadedCoursesLoading, setLoadedCoursesLoading] = useState(
    providedCourses === undefined && cachedJourneys === null,
  );
  const [coursesError, setCoursesError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const accountRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef(0);
  const hasLoadedJourneysRef = useRef(cachedJourneys !== null);
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

  // Load the journey list on mount and when explicitly refreshed.
  // Route changes alone do not trigger another request.
  useEffect(() => {
    if (providedCourses !== undefined) {
      setLoadedCoursesLoading(false);
      return;
    }

    let cancelled = false;
    const requestId = ++requestRef.current;

    const routeState = location.state as JourneyRouteState | null;
    const journeyIdFromRoute =
      location.pathname.match(/\/learn\/course\/([^/?#]+)/i)?.[1];

    const newlyCreatedJourneyId =
      routeState?.refreshJourneys && routeState?.newlyCreatedJourneyId
        ? routeState.newlyCreatedJourneyId
        : null;

    const wait = (milliseconds: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, milliseconds);
      });

    const loadJourneys = async () => {
      // Don't flash skeletons over an already-populated sidebar.
      if (!hasLoadedJourneysRef.current) {
        setLoadedCoursesLoading(true);
      }

      setCoursesError(false);

      // Newly created records may take a moment to become visible to list().
      const retryDelays =
        newlyCreatedJourneyId || !hasLoadedJourneysRef.current
          ? [0, 500, 1000, 2000, 3500]
          : [0];

      try {
        for (let attempt = 0; attempt < retryDelays.length; attempt += 1) {
          if (retryDelays[attempt] > 0) {
            await wait(retryDelays[attempt]);
          }

          if (cancelled || requestId !== requestRef.current) return;

          const records = await listCourses();

          if (cancelled || requestId !== requestRef.current) return;

          const journeys: Journey[] = records
            .filter(
              (record) => !(record as { archived?: boolean | null }).archived,
            )
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
          cachedJourneys = journeys;
          hasLoadedJourneysRef.current = true;

          const targetJourneyId =
            newlyCreatedJourneyId ?? journeyIdFromRoute;

          const targetJourneyFound =
            !targetJourneyId ||
            journeys.some((journey) => journey.id === targetJourneyId);

          if (targetJourneyFound || attempt === retryDelays.length - 1) {
            setCoursesError(false);
            break;
          }
        }
      } catch (error) {
        if (cancelled || requestId !== requestRef.current) return;

        console.error('Unable to load journeys for the sidebar', error);
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
    // Intentionally exclude pathname: normal navigation must not reload the list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providedCourses, refreshKey]);

  // Refresh exactly once when the generation flow navigates to a new journey.
  useEffect(() => {
    const routeState = location.state as JourneyRouteState | null;

    if (
      !routeState?.refreshJourneys ||
      !routeState.newlyCreatedJourneyId ||
      providedCourses !== undefined
    ) {
      return;
    }

    const creationKey = routeState.newlyCreatedJourneyId;

    if (handledCreationRef.current === creationKey) return;

    handledCreationRef.current = creationKey;
    refreshJourneys();

    // Clear the one-time flag so navigating elsewhere won't retrigger it.
    const nextState = { ...routeState };
    delete nextState.refreshJourneys;
    delete nextState.newlyCreatedJourneyId;

    navigate(
      {
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
      },
      {
        replace: true,
        state: nextState,
      },
    );
  }, [
    location.pathname,
    location.search,
    location.hash,
    location.state,
    navigate,
    providedCourses,
    refreshJourneys,
  ]);

  // Apply rename / archive / delete from any JourneyMenu instantly.
  useEffect(() => {
    if (providedCourses !== undefined) return;

    const handleJourneyChange = (event: Event) => {
      const change = (event as CustomEvent<JourneyChange>).detail;

      if (!change) return;

      setLoadedCourses((current) => {
        const next =
          change.action === 'rename'
            ? current.map((journey) =>
                journey.id === change.id
                  ? { ...journey, title: change.title }
                  : journey,
              )
            : current.filter((journey) => journey.id !== change.id);

        cachedJourneys = next;
        return next;
      });

      // Leave the page of a journey that no longer appears in the list.
      if (
        change.action !== 'rename' &&
        location.pathname.includes(`/learn/course/${change.id}`)
      ) {
        navigate('/create', { replace: true });
      }
    };

    window.addEventListener(JOURNEY_CHANGED_EVENT, handleJourneyChange);

    return () =>
      window.removeEventListener(JOURNEY_CHANGED_EVENT, handleJourneyChange);
  }, [providedCourses, location.pathname, navigate]);

  // Load account name.
  useEffect(() => {
    if (providedUserName) {
      setUserName(providedUserName);
      return;
    }

    let cancelled = false;

    const loadUserName = async () => {
      try {
        const attributes = await fetchUserAttributes();

        // The username (when the learner has set one) wins over the email prefix.
        const username = await getProfile()
          .then((profile) => profile?.username?.trim() || '')
          .catch(() => '');

        if (cancelled) return;

        const resolvedName =
          username ||
          attributes.name ||
          attributes.preferred_username ||
          attributes.email?.split('@')[0] ||
          'You';

        cachedUserName = resolvedName;
        setUserName(resolvedName);
      } catch {
        if (!cancelled) setUserName('You');
      }
    };

    void loadUserName();

    return () => {
      cancelled = true;
    };
  }, [providedUserName]);

  // Reflect a username change from the profile screen right away.
  useEffect(() => {
    const handleUsernameChanged = (event: Event) => {
      const next = (event as CustomEvent<string>).detail;

      if (!next) return;

      cachedUserName = next;
      setUserName(next);
    };

    window.addEventListener(USERNAME_CHANGED_EVENT, handleUsernameChanged);

    return () =>
      window.removeEventListener(USERNAME_CHANGED_EVENT, handleUsernameChanged);
  }, []);

  // Close menus when clicking outside or pressing Escape.
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

  const toggleSidebar = useCallback(() => {
    setAccountMenuOpen(false);
    setCollapsed((current) => {
      const next = !current;

      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      } catch {
        // Preference just won't persist.
      }

      return next;
    });
  }, []);

  const openLogoutConfirmation = () => {
    setAccountMenuOpen(false);
    setLogoutConfirmOpen(true);
  };

  const renderNavigation = (compact = false) => (
    <nav aria-label="Main navigation" className="flex flex-col gap-1">
      {navItems.map(({ label, icon: Icon, to }) => (
        <NavLink
          key={label}
          to={to}
          end
          title={compact ? label : undefined}
          aria-label={compact ? label : undefined}
          className={({ isActive }) => {
            const active = label === 'Create' ? isCreateFlow : isActive;

            return [
              'group relative flex min-h-[48px] items-center rounded-2xl',
              compact ? 'justify-center px-0' : 'gap-3 px-4',
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
                <Icon
                  aria-hidden="true"
                  className={`h-5 w-5 shrink-0 ${
                    active ? 'text-orange' : 'text-[#91A4AC]'
                  }`}
                />

                {!compact && <span>{label}</span>}
              </>
            );
          }}
        </NavLink>
      ))}
    </nav>
  );

  const renderJourneys = () => (
    <section className="mt-9 flex min-h-0 flex-1 flex-col">
      <div className="mb-2 flex shrink-0 items-center justify-between px-3">
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

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
        {coursesLoading && courses.length === 0 ? (
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
              <div key={course.id} className="group/journey relative">
                <NavLink
                  to={`/learn/course/${course.id}`}
                  className={({ isActive }) =>
                    [
                      'group flex min-h-[44px] items-center gap-3 rounded-xl pl-3 pr-11 text-sm font-semibold transition-colors',
                      isActive
                        ? 'bg-[#203138] text-white'
                        : 'text-[#91A4AC] hover:bg-[#1A292F] hover:text-white',
                    ].join(' ')
                  }
                >
                  <span className="min-w-0 flex-1 truncate">
                    {course.title}
                  </span>
                </NavLink>

                <JourneyMenu
                  journey={course}
                  buttonClassName="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/journey:opacity-100 group-focus-within/journey:opacity-100 pointer-coarse:opacity-100 aria-expanded:opacity-100"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );

  const renderAccount = (mobile = false, compact = false) => (
    <div
      ref={accountRef}
      className="relative mt-auto shrink-0 border-t border-[#2D3C43] pt-4"
    >
      {game && compact && (
        <Link
          to="/profile"
          aria-label={`Open your profile. ${game.currentStreak} day streak, ${game.totalXp} XP`}
          className="mb-3 flex flex-col gap-2 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
        >
          <span
            title="Day streak"
            className="flex h-9 items-center justify-center gap-1 rounded-xl border border-[#2D3C43] bg-[#17262C] text-xs font-extrabold text-white"
          >
            <Flame
              className={`h-3.5 w-3.5 ${
                game.currentStreak > 0 ? 'text-orange' : 'text-[#60757E]'
              }`}
              aria-hidden="true"
            />
            {game.currentStreak}
          </span>

          <span
            title="Total XP"
            className="flex h-9 items-center justify-center gap-1 rounded-xl border border-[#2D3C43] bg-[#17262C] text-xs font-extrabold text-white"
          >
            <Zap className="h-3.5 w-3.5 text-orange" aria-hidden="true" />
            {game.totalXp}
          </span>
        </Link>
      )}

      {game && !compact && (
        <Link
          to="/profile"
          aria-label="Open your profile"
          className="mb-3 flex gap-2 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
        >
          <StatChip
            kind="streak"
            value={game.currentStreak}
            active={game.currentStreak > 0}
            className="flex-1 justify-center"
          />
          <StatChip
            kind="xp"
            value={game.totalXp}
            className="flex-1 justify-center"
          />
        </Link>
      )}

      {accountMenuOpen && (
        <AccountMenu
          mobile={mobile}
          compact={compact}
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
        compact={compact}
        open={accountMenuOpen}
        onClick={() => setAccountMenuOpen((value) => !value)}
      />
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-[#131F24] text-white">
      <div className="min-h-[100dvh]">
        {/* Desktop sidebar: fixed to the viewport and never page-scrolls. */}
        <aside
          aria-label="Sidebar"
          className={`fixed inset-y-0 left-0 z-40 hidden h-[100dvh] flex-col border-r border-[#2D3C43] bg-[#131F24] py-5 transition-[width] duration-200 lg:flex ${
            collapsed
              ? 'w-[76px] px-2'
              : 'w-[270px] overflow-hidden px-4 xl:w-[292px]'
          }`}
        >
          <div
            className={`mb-8 flex shrink-0 items-center ${
              collapsed ? 'justify-center' : 'justify-between px-3'
            }`}
          >
            {!collapsed && (
              <GrokitLogo className="h-[42px] w-[112px] shrink-0 object-contain object-left" />
            )}

            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={collapsed ? 'Show sidebar' : 'Hide sidebar'}
              aria-expanded={!collapsed}
              title={collapsed ? 'Show sidebar' : 'Hide sidebar'}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#91A4AC] transition-colors hover:bg-[#203138] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
            >
              {collapsed ? (
                <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
              ) : (
                <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>

          <div className="shrink-0">{renderNavigation(collapsed)}</div>
          {!collapsed && renderJourneys()}
          {renderAccount(false, collapsed)}
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

        {/* Mobile navigation drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-[80] lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setMobileNavOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <aside
              aria-label="Mobile navigation"
              className="absolute inset-y-0 left-0 flex w-[min(320px,88vw)] flex-col overflow-hidden border-r border-[#2D3C43] bg-[#131F24] px-4 py-5 shadow-2xl"
            >
              <div className="mb-7 flex shrink-0 items-center justify-between px-3">
                <GrokitLogo className="h-[42px] w-[112px] object-contain object-left" />

                <button
                  type="button"
                  aria-label="Close navigation"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-[#91A4AC] hover:bg-[#203138] hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="shrink-0">{renderNavigation()}</div>
              {renderJourneys()}
              {renderAccount(true)}
            </aside>
          </div>
        )}

        {/* Main content scrolls independently of the desktop sidebar. */}
        <main
          className={`min-h-[100dvh] min-w-0 overflow-x-clip pt-16 transition-[margin] duration-200 lg:pt-0 ${
            collapsed ? 'lg:ml-[76px]' : 'lg:ml-[270px] xl:ml-[292px]'
          }`}
        >
          {children}
        </main>
      </div>

      {logoutConfirmOpen && (
        <LogoutConfirmation onCancel={() => setLogoutConfirmOpen(false)} />
      )}
    </div>
  );
}

function AccountButton({
  userName,
  open,
  onClick,
  compact = false,
}: {
  userName: string;
  open: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  const initial = userName.trim().charAt(0).toUpperCase() || 'Y';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-haspopup="menu"
      aria-label={compact ? `Account: ${userName}` : undefined}
      title={compact ? userName : undefined}
      className={[
        'flex w-full items-center rounded-2xl border border-transparent py-3 text-left transition-all duration-150',
        compact ? 'justify-center px-0' : 'gap-3 px-3',
        open
          ? 'border-[#2D3C43] bg-[#1A292F]'
          : 'hover:border-[#2D3C43] hover:bg-[#1A292F]',
      ].join(' ')}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8F3FB5] text-xs font-extrabold text-white">
        {initial}
      </span>

      {!compact && (
        <>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-extrabold text-white">
              {userName}
            </span>

            <span className="mt-0.5 block text-[11px] font-medium text-[#60757E]">
              Account
            </span>
          </span>

          <ChevronRight
            className={`h-4 w-4 shrink-0 text-[#60757E] transition-transform ${
              open ? '-rotate-90' : ''
            }`}
          />
        </>
      )}
    </button>
  );
}

function AccountMenu({
  onProfile,
  onSettings,
  onLogout,
  mobile = false,
  compact = false,
}: {
  onProfile: () => void;
  onSettings: () => void;
  onLogout: () => void;
  mobile?: boolean;
  compact?: boolean;
}) {
  const itemClass =
    'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#E6EAEC] transition-colors hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange';

  return (
    <div
      role="menu"
      className={[
        'absolute bottom-[76px] left-0 z-[70] rounded-[22px] border border-[#39464C] bg-[#202F35]/95 p-2 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl',
        compact ? 'w-56' : 'w-full',
        mobile ? 'max-w-full' : '',
      ].join(' ')}
    >
      <button
        type="button"
        role="menuitem"
        onClick={onProfile}
        className={itemClass}
      >
        <UserRound className="h-[18px] w-[18px] text-[#C5CFD3]" />
        <span>Profile</span>
      </button>

      <button
        type="button"
        role="menuitem"
        onClick={onSettings}
        className={itemClass}
      >
        <Settings className="h-[18px] w-[18px] text-[#C5CFD3]" />
        <span>Settings</span>
      </button>

      <button
        type="button"
        role="menuitem"
        onClick={onLogout}
        className={itemClass}
      >
        <LogOut className="h-[18px] w-[18px] text-[#C5CFD3]" />
        <span>Log out</span>
      </button>
    </div>
  );
}

function LogoutConfirmation({ onCancel }: { onCancel: () => void }) {
  const navigate = useNavigate();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    setError(null);

    try {
      await signOutUser();
      cachedJourneys = null;
      cachedUserName = null;
      resetGamification();
      navigate('/', { replace: true });
    } catch (logoutError) {
      console.error('Failed to sign out', logoutError);
      setError('Unable to log out right now. Please try again.');
      setIsSigningOut(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-title"
    >
      <div className="w-full max-w-[420px] rounded-[26px] border border-[#34434A] bg-[#19272D] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:p-7">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange/10 text-orange">
          <LogOut className="h-5 w-5" />
        </div>

        <h2
          id="logout-title"
          className="mt-5 font-display text-2xl font-extrabold tracking-[-0.02em] text-white"
        >
          Are you sure you want to log out?
        </h2>

        <p className="mt-2 text-sm leading-6 text-[#91A4AC]">
          You&apos;ll need to sign in again to continue learning with Grokit.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-3 py-2.5 text-xs font-medium text-red-200"
          >
            {error}
          </div>
        )}

        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSigningOut}
            className="min-h-[46px] rounded-2xl border border-[#344951] bg-[#1D3037] px-5 text-sm font-extrabold text-[#D7E0E3] transition-colors hover:bg-[#24383F] disabled:pointer-events-none disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isSigningOut}
            className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-orange px-5 text-sm font-extrabold text-white shadow-[0_4px_0_#C94713] transition-all hover:brightness-105 active:translate-y-[2px] active:shadow-none disabled:pointer-events-none disabled:opacity-60"
          >
            {isSigningOut ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Logging out...
              </>
            ) : (
              <>
                Log out
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}