import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import {
  NavLink,
  useLocation,
  useNavigate,
} from 'react-router';

import {
  ArrowRight,
  ChevronRight,
  Compass,
  Library,
  Loader2,
  LogOut,
  Menu,
  Plus,
  Settings,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';

import { fetchUserAttributes } from 'aws-amplify/auth';

import { GrokitLogo } from '../../components/Grokitlogo';
import { signOutUser } from '../auth/authService';

interface AppShellProps {
  children: ReactNode;
  courses?: { id: string; title: string }[];
  coursesLoading?: boolean;
  userName?: string;
}

const navItems = [
  { label: 'Create', icon: Sparkles, to: '/create' },
  { label: 'Explore', icon: Compass, to: '/explore' },
  { label: 'Library', icon: Library, to: '/library' },
];

export default function AppShell({
  children,
  courses = [],
  coursesLoading = false,
  userName: providedUserName,
}: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [userName, setUserName] = useState(providedUserName || 'You');

  const accountRef = useRef<HTMLDivElement>(null);

  const pathname = location.pathname.replace(/\/+$/, '').toLowerCase();
  const isCreateFlow =
    pathname === '/' ||
    pathname === '/create' ||
    pathname.startsWith('/learn/personalize') ||
    pathname.startsWith('/learn/generating');

  useEffect(() => {
    if (providedUserName) {
      setUserName(providedUserName);
      return;
    }

    let cancelled = false;

    async function loadUserName() {
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
    }

    void loadUserName();

    return () => {
      cancelled = true;
    };
  }, [providedUserName]);

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

  const renderNavigation = (mobile = false) => (
    <nav className="flex flex-col gap-1">
      {navItems.map(({ label, icon: Icon, to }) => (
        <NavLink
          key={label}
          to={to}
          end
          className={({ isActive }) => {
            const active = label === 'Create' ? isCreateFlow : isActive;

            return [
              'group relative flex items-center gap-3',
              'min-h-[48px] rounded-2xl px-4',
              'font-sans text-[15px] font-bold',
              'transition-all duration-150',
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
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-orange" />
                )}
                <Icon
                  className={[
                    'h-5 w-5 shrink-0',
                    active ? 'text-orange' : 'text-[#91A4AC]',
                  ].join(' ')}
                />
                <span>{label}</span>
              </>
            );
          }}
        </NavLink>
      ))}
    </nav>
  );

  const renderJourneys = () => (
    <div className="mt-9 flex min-h-0 flex-1 flex-col">
      <div className="mb-2 flex items-center justify-between px-3">
        <span className="font-sans text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#78909A]">
          My Journeys
        </span>

        <NavLink
          to="/create"
          aria-label="Create a new journey"
          className="flex h-7 w-7 items-center justify-center rounded-full text-[#91A4AC] transition-colors hover:bg-[#203138] hover:text-orange"
        >
          <Plus className="h-4 w-4" />
        </NavLink>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {coursesLoading ? (
          <div className="space-y-2 px-1 pt-1">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-12 animate-pulse rounded-2xl bg-[#1A292F]"
              />
            ))}
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
                    'flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-[#203138] text-white'
                      : 'text-[#91A4AC] hover:bg-[#1A292F] hover:text-white',
                  ].join(' ')
                }
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#203138] text-orange">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1 truncate">{course.title}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderAccount = (mobile = false) => (
    <div ref={accountRef} className="relative mt-auto border-t border-[#2D3C43] pt-4">
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
        <div className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-[#2D3C43] bg-[#131F24]/95 px-4 backdrop-blur-xl lg:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#D2DFE4] hover:bg-[#203138]"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="absolute left-1/2 -translate-x-1/2">
            <GrokitLogo className="h-[36px] w-[94px] object-contain" />
          </div>

          <div className="w-10" />
        </div>

        {/* Mobile navigation drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-[80] lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setMobileNavOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <aside className="absolute inset-y-0 left-0 flex w-[min(320px,88vw)] flex-col border-r border-[#2D3C43] bg-[#131F24] px-4 py-5 shadow-2xl">
              <div className="mb-7 flex min-h-[48px] items-center justify-between px-3">
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

              {renderNavigation(true)}
              {renderJourneys()}
              {renderAccount(true)}
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="min-w-0 flex-1 overflow-y-auto pt-16 lg:pt-0">
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
}: {
  userName: string;
  open: boolean;
  onClick: () => void;
}) {
  const initial = userName.trim().charAt(0).toUpperCase() || 'Y';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-haspopup="menu"
      className={[
        'flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-left transition-all duration-150',
        open
          ? 'border-[#2D3C43] bg-[#1A292F]'
          : 'hover:border-[#2D3C43] hover:bg-[#1A292F]',
      ].join(' ')}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8F3FB5] text-xs font-extrabold text-white">
        {initial}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-extrabold text-white">
          {userName}
        </span>
        <span className="mt-0.5 block text-[11px] font-medium text-[#60757E]">
          Account
        </span>
      </span>

      <ChevronRight
        className={[
          'h-4 w-4 shrink-0 text-[#60757E] transition-transform',
          open ? '-rotate-90' : '',
        ].join(' ')}
      />
    </button>
  );
}

function AccountMenu({
  onProfile,
  onSettings,
  onLogout,
  mobile = false,
}: {
  onProfile: () => void;
  onSettings: () => void;
  onLogout: () => void;
  mobile?: boolean;
}) {
  const itemClass =
    'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#E6EAEC] transition-colors hover:bg-white/[0.07]';

  return (
    <div
      role="menu"
      className={[
        'absolute bottom-[76px] left-0 z-[70] w-full rounded-[22px] border border-[#39464C] bg-[#292929]/95 p-2 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl',
        mobile ? 'max-w-full' : '',
      ].join(' ')}
    >
      <button type="button" role="menuitem" onClick={onProfile} className={itemClass}>
        <UserRound className="h-[18px] w-[18px] text-[#C5CFD3]" />
        <span>Profile</span>
      </button>

      <button type="button" role="menuitem" onClick={onSettings} className={itemClass}>
        <Settings className="h-[18px] w-[18px] text-[#C5CFD3]" />
        <span>Settings</span>
      </button>

      <button type="button" role="menuitem" onClick={onLogout} className={itemClass}>
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
      navigate('/', { replace: true });
    } catch (logoutError) {
      console.error('Failed to sign out:', logoutError);
      setError(
        logoutError instanceof Error
          ? logoutError.message
          : 'Unable to log out right now.',
      );
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
          <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-3 py-2.5 text-xs font-medium text-red-200">
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