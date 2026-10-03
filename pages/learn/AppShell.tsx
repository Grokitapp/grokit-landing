import { useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router';
import {
  Home,
  Sparkles,
  Brain,
  Library,
  User,
  Plus,
  ChevronDown,
  Flame,
  Star,
  LogOut,
  PanelLeft,
  ArrowRight,
} from 'lucide-react';

import { GrokitLogo } from '../../components/Grokitlogo';
import { signOutUser } from '../auth/authService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppShellProps {
  children: ReactNode;
  courses?: { id: string; title: string }[];
  coursesLoading?: boolean;
  userName?: string;
  streak?: number;
  stars?: number;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

const navItems = [
  {
    label: 'Home',
    icon: Home,
    to: '/learn',
  },
  {
    label: 'Create',
    icon: Sparkles,
    to: '/learn/create',
  },
  {
    label: 'Canvas',
    icon: Brain,
    to: '/learn/canvas',
  },
  {
    label: 'Library',
    icon: Library,
    to: '/learn/library',
  },
  {
    label: 'Profile',
    icon: User,
    to: '/learn/profile',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AppShell({
  children,
  courses = [],
  coursesLoading = false,
  userName = 'You',
  streak = 0,
  stars = 0,
}: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-[#131F24] text-white">
      <div className="flex min-h-[100dvh]">

        {/* ──────────────────────────────────────────────────────────────── */}
        {/* Desktop sidebar                                                   */}
        {/* ──────────────────────────────────────────────────────────────── */}

        <aside className="hidden lg:flex w-[270px] xl:w-[292px] shrink-0 flex-col border-r border-[#2D3C43] bg-[#131F24] px-4 py-5">

          {/* Logo */}
          <div className="flex items-center px-3 mb-7">
            <GrokitLogo />
          </div>

          {/* Primary navigation */}
          <nav className="flex flex-col gap-1">
            {navItems.map(({ label, icon: Icon, to }) => (
              <NavLink
                key={label}
                to={to}
                end={to === '/learn'}
                className={({ isActive }) =>
                  [
                    'group relative flex items-center gap-3',
                    'min-h-[48px] px-4 rounded-2xl',
                    'font-sans font-bold text-[15px]',
                    'transition-all duration-150',
                    isActive
                      ? 'bg-[#203138] text-orange'
                      : 'text-[#91A4AC] hover:bg-[#1A292F] hover:text-white',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-orange" />
                    )}

                    <Icon
                      className={[
                        'h-[20px] w-[20px] shrink-0 transition-transform',
                        isActive
                          ? 'text-orange'
                          : 'group-hover:scale-105',
                      ].join(' ')}
                    />

                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Courses */}
          <div className="mt-8 flex min-h-0 flex-1 flex-col">

            <div className="flex items-center justify-between px-3 mb-2">
              <button
                type="button"
                className="flex items-center gap-1.5 text-[#91A4AC] hover:text-white transition-colors"
              >
                <span className="font-sans text-[12px] font-extrabold uppercase tracking-[0.08em]">
                  Courses
                </span>

                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              <NavLink
                to="/learn/create"
                aria-label="Create a new course"
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#91A4AC] hover:bg-[#203138] hover:text-orange transition-colors"
              >
                <Plus className="h-4 w-4" />
              </NavLink>
            </div>

            <div className="min-h-0 overflow-y-auto pr-1 scrollbar-thin">

              {coursesLoading ? (
                <div className="space-y-2 px-2 pt-1">
                  <div className="h-11 animate-pulse rounded-xl bg-[#1A292F]" />
                  <div className="h-11 animate-pulse rounded-xl bg-[#1A292F]" />
                </div>
              ) : courses.length === 0 ? (
                <NavLink
                  to="/learn/create"
                  className="group mx-1 mt-1 flex items-center gap-3 rounded-2xl border border-dashed border-[#34474F] px-3 py-3 hover:border-orange/40 hover:bg-[#1A292F] transition-all"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange/10 text-orange">
                    <Plus className="h-4 w-4" />
                  </span>

                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-[#D6E0E3]">
                      Create your first course
                    </span>

                    <span className="block mt-0.5 text-[11px] font-medium text-[#60757E]">
                      Learn anything with AI
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
                          'group flex items-center gap-3',
                          'rounded-xl px-3 py-2.5',
                          'font-sans text-[13px] font-bold',
                          'transition-all duration-150',
                          isActive
                            ? 'bg-[#202F35] text-white'
                            : 'text-[#81949C] hover:bg-[#1A292F] hover:text-white',
                        ].join(' ')
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={[
                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                              'text-[11px] font-extrabold',
                              isActive
                                ? 'bg-orange/15 text-orange'
                                : 'bg-[#1D2B30] text-[#71858D]',
                            ].join(' ')}
                          >
                            {course.title
                              .split(' ')
                              .slice(0, 2)
                              .map((word) => word[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>

                          <span className="min-w-0 flex-1 truncate">
                            {course.title}
                          </span>

                          {isActive && (
                            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-orange" />
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom stats */}
          <div className="mt-4 rounded-2xl border border-[#2D3C43] bg-[#18262B] p-3">

            <div className="grid grid-cols-2 gap-2">

              <div className="rounded-xl bg-[#202F35] px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-orange" />
                  <span className="text-lg font-extrabold text-white">
                    {streak}
                  </span>
                </div>

                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-[#60757E]">
                  Day streak
                </p>
              </div>

              <div className="rounded-xl bg-[#202F35] px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-amber" />
                  <span className="text-lg font-extrabold text-white">
                    {stars}
                  </span>
                </div>

                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-[#60757E]">
                  Stars
                </p>
              </div>

            </div>
          </div>

          {/* Upgrade */}
          <button
            type="button"
            className="group mt-3 flex w-full items-center gap-3 rounded-2xl border border-orange/20 bg-orange/[0.07] px-4 py-3 text-left transition-all hover:border-orange/35 hover:bg-orange/10"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange/15 text-orange">
              <Sparkles className="h-4 w-4" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold text-white">
                Upgrade
              </span>

              <span className="block mt-0.5 text-[11px] font-medium text-[#91A4AC]">
                Learn without limits
              </span>
            </span>

            <ArrowRight className="h-4 w-4 text-[#60757E] transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* Profile / sign out */}
          <SignOutButton userName={userName} />
        </aside>

        {/* ──────────────────────────────────────────────────────────────── */}
        {/* Mobile top bar                                                   */}
        {/* ──────────────────────────────────────────────────────────────── */}

        <div className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-[#2D3C43] bg-[#131F24]/95 px-4 backdrop-blur-xl lg:hidden">

          <button
            type="button"
            onClick={() => setMobileNavOpen((value) => !value)}
            aria-label="Toggle navigation"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#91A4AC] hover:bg-[#202F35] hover:text-white"
          >
            <PanelLeft className="h-5 w-5" />
          </button>

          <div className="absolute left-1/2 -translate-x-1/2 scale-90">
            <GrokitLogo />
          </div>

          <div className="flex items-center gap-3 text-sm font-bold">
            <span className="flex items-center gap-1 text-orange">
              <Flame className="h-4 w-4" />
              {streak}
            </span>

            <span className="flex items-center gap-1 text-amber">
              <Star className="h-4 w-4" />
              {stars}
            </span>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────────── */}
        {/* Mobile navigation drawer                                          */}
        {/* ──────────────────────────────────────────────────────────────── */}

        {mobileNavOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">

            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setMobileNavOpen(false)}
              className="absolute inset-0 bg-black/45"
            />

            <aside className="relative flex h-full w-[290px] flex-col border-r border-[#2D3C43] bg-[#131F24] px-4 py-5 pt-20 shadow-2xl">

              <nav className="flex flex-col gap-1">
                {navItems.map(({ label, icon: Icon, to }) => (
                  <NavLink
                    key={label}
                    to={to}
                    end={to === '/learn'}
                    onClick={() => setMobileNavOpen(false)}
                    className={({ isActive }) =>
                      [
                        'flex min-h-[48px] items-center gap-3 rounded-2xl px-4',
                        'font-sans text-[15px] font-bold',
                        isActive
                          ? 'bg-[#203138] text-orange'
                          : 'text-[#91A4AC] hover:bg-[#1A292F] hover:text-white',
                      ].join(' ')
                    }
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </NavLink>
                ))}
              </nav>

              <div className="mt-8">
                <div className="mb-2 flex items-center justify-between px-3">
                  <span className="text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#91A4AC]">
                    Courses
                  </span>

                  <NavLink
                    to="/learn/create"
                    onClick={() => setMobileNavOpen(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[#91A4AC] hover:bg-[#202F35] hover:text-orange"
                  >
                    <Plus className="h-4 w-4" />
                  </NavLink>
                </div>

                {courses.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {courses.map((course) => (
                      <NavLink
                        key={course.id}
                        to={`/learn/course/${course.id}`}
                        onClick={() => setMobileNavOpen(false)}
                        className="rounded-xl px-3 py-3 text-sm font-bold text-[#91A4AC] hover:bg-[#202F35] hover:text-white"
                      >
                        {course.title}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-auto">
                <SignOutButton userName={userName} />
              </div>
            </aside>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────────── */}
        {/* Main content                                                      */}
        {/* ──────────────────────────────────────────────────────────────── */}

        <main className="min-w-0 flex-1 overflow-y-auto pt-16 lg:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}

// ─── Sign out ─────────────────────────────────────────────────────────────────

function SignOutButton({
  userName,
}: {
  userName: string;
}) {
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);

    try {
      await signOutUser();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Failed to sign out:', error);
      setIsSigningOut(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isSigningOut}
      aria-label="Sign out"
      className={[
        'mt-3 flex w-full items-center gap-3 rounded-2xl',
        'border border-transparent px-3 py-3',
        'text-left transition-all',
        'hover:border-[#2D3C43] hover:bg-[#1A292F]',
        'disabled:pointer-events-none disabled:opacity-60',
      ].join(' ')}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange/15 text-sm font-extrabold text-orange">
        {userName.charAt(0).toUpperCase()}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-extrabold text-white">
          {isSigningOut ? 'Signing out...' : userName}
        </span>

        {!isSigningOut && (
          <span className="block mt-0.5 text-[11px] font-medium text-[#60757E]">
            Account
          </span>
        )}
      </span>

      <LogOut className="h-4 w-4 shrink-0 text-[#60757E]" />
    </button>
  );
}