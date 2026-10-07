import { useState } from 'react';

import type { ReactNode } from 'react';

import {
  Compass,
  Library,
  LogOut,
  PanelLeft,
  Plus,
  Sparkles,
  User,
  BookOpen,
} from 'lucide-react';

import { NavLink, useNavigate } from 'react-router';

import { GrokitLogo } from '../../components/Grokitlogo';

import { signOutUser } from '../auth/authService';

interface AppShellProps {
  children: ReactNode;
  courses?: {
    id: string;
    title: string;
  }[];
  coursesLoading?: boolean;
  userName?: string;
}

const navItems = [
  {
    label: 'Learn',
    icon: BookOpen,
    to: '/learn',
  },
  {
    label: 'Create',
    icon: Sparkles,
    to: '/learn/personalize',
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
] as const;

export default function AppShell({
  children,
  courses = [],
  coursesLoading = false,
  userName = 'You',
}: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-[#131F24] text-white">
      <div className="flex min-h-[100dvh]">
        {/* ─────────────────────────────────────────────────────────────
            Desktop sidebar
        ───────────────────────────────────────────────────────────── */}

        <aside className="hidden w-[270px] shrink-0 flex-col border-r border-[#2D3C43] bg-[#131F24] px-4 py-5 lg:flex xl:w-[292px]">
          {/* Logo */}
          <div className="mb-8 flex items-center px-3">
            <GrokitLogo />
          </div>

          {/* Main navigation */}
          <nav className="flex flex-col gap-1">
            {navItems.map(({ label, icon: Icon, to }) => (
              <NavLink
                key={label}
                to={to}
                end={to === '/learn'}
                className={({ isActive }) =>
                  [
                    'group relative flex min-h-[50px] items-center gap-3',
                    'rounded-2xl px-4',
                    'font-sans text-[15px] font-bold',
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
                      <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-orange" />
                    )}

                    <Icon
                      className={[
                        'h-[20px] w-[20px] shrink-0',
                        isActive
                          ? 'text-orange'
                          : 'transition-transform group-hover:scale-105',
                      ].join(' ')}
                    />

                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}

            {/* Explore — intentionally not a fake route yet */}
            <div className="group relative flex min-h-[50px] cursor-not-allowed items-center gap-3 rounded-2xl px-4 text-[#52666E]">
              <Compass className="h-[20px] w-[20px] shrink-0" />

              <span className="font-sans text-[15px] font-bold">
                Explore
              </span>

              <span className="ml-auto rounded-full border border-[#2D3C43] px-2 py-0.5 font-sans text-[9px] font-extrabold uppercase tracking-wide text-[#60757E]">
                Soon
              </span>
            </div>
          </nav>

          {/* Journeys */}
          <div className="mt-9 flex min-h-0 flex-1 flex-col">
            <div className="mb-3 flex items-center justify-between px-3">
              <span className="font-sans text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#71868F]">
                Your journeys
              </span>

              <NavLink
                to="/learn/personalize"
                aria-label="Create a new journey"
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#71868F] transition-colors hover:bg-[#203138] hover:text-orange"
              >
                <Plus className="h-4 w-4" />
              </NavLink>
            </div>

            <div className="min-h-0 overflow-y-auto pr-1 scrollbar-thin">
              {coursesLoading ? (
                <div className="space-y-2 px-1">
                  <div className="h-12 animate-pulse rounded-2xl bg-[#1A292F]" />
                  <div className="h-12 animate-pulse rounded-2xl bg-[#1A292F]" />
                </div>
              ) : courses.length === 0 ? (
                <NavLink
                  to="/learn/personalize"
                  className="group mx-1 flex items-center gap-3 rounded-2xl border border-dashed border-[#34474F] px-3 py-3.5 transition-all hover:border-orange/40 hover:bg-[#1A292F]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange/10 text-orange">
                    <Plus className="h-4 w-4" />
                  </span>

                  <span className="min-w-0">
                    <span className="block font-sans text-sm font-bold text-[#D6E0E3]">
                      Start your first journey
                    </span>

                    <span className="mt-0.5 block font-sans text-[11px] font-medium text-[#60757E]">
                      Begin with something curious.
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
                          'group flex items-center gap-3 rounded-xl px-3 py-2.5',
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
                              'text-[10px] font-extrabold',
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
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Account */}
          <div className="mt-5">
            <SignOutButton userName={userName} />
          </div>
        </aside>

        {/* ─────────────────────────────────────────────────────────────
            Mobile top bar
        ───────────────────────────────────────────────────────────── */}

        <div className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-[#2D3C43] bg-[#131F24]/95 px-4 backdrop-blur-xl lg:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen((value) => !value)}
            aria-label="Toggle navigation"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#91A4AC] transition-colors hover:bg-[#202F35] hover:text-white"
          >
            <PanelLeft className="h-5 w-5" />
          </button>

          <div className="absolute left-1/2 -translate-x-1/2 scale-90">
            <GrokitLogo />
          </div>

          <NavLink
            to="/learn/personalize"
            aria-label="Create a new journey"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange/10 text-orange"
          >
            <Plus className="h-5 w-5" />
          </NavLink>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            Mobile navigation
        ───────────────────────────────────────────────────────────── */}

        {mobileNavOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setMobileNavOpen(false)}
              className="absolute inset-0 bg-black/50"
            />

            <aside className="relative flex h-full w-[292px] flex-col border-r border-[#2D3C43] bg-[#131F24] px-4 py-5 pt-20 shadow-2xl">
              <div className="mb-7 px-3">
                <GrokitLogo />
              </div>

              <nav className="flex flex-col gap-1">
                {navItems.map(({ label, icon: Icon, to }) => (
                  <NavLink
                    key={label}
                    to={to}
                    end={to === '/learn'}
                    onClick={() => setMobileNavOpen(false)}
                    className={({ isActive }) =>
                      [
                        'flex min-h-[50px] items-center gap-3 rounded-2xl px-4',
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

                <div className="flex min-h-[50px] cursor-not-allowed items-center gap-3 rounded-2xl px-4 text-[#52666E]">
                  <Compass className="h-5 w-5" />

                  <span className="font-sans text-[15px] font-bold">
                    Explore
                  </span>

                  <span className="ml-auto rounded-full border border-[#2D3C43] px-2 py-0.5 font-sans text-[9px] font-extrabold uppercase tracking-wide text-[#60757E]">
                    Soon
                  </span>
                </div>
              </nav>

              <div className="mt-8">
                <div className="mb-3 flex items-center justify-between px-3">
                  <span className="font-sans text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#71868F]">
                    Your journeys
                  </span>

                  <NavLink
                    to="/learn/personalize"
                    onClick={() => setMobileNavOpen(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[#71868F] hover:bg-[#202F35] hover:text-orange"
                  >
                    <Plus className="h-4 w-4" />
                  </NavLink>
                </div>

                {courses.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {courses.map((course) => (
                      <NavLink
                        key={course.id}
                        to={`/learn/course/${course.id}`}
                        onClick={() => setMobileNavOpen(false)}
                        className="rounded-xl px-3 py-3 font-sans text-sm font-bold text-[#91A4AC] hover:bg-[#202F35] hover:text-white"
                      >
                        {course.title}
                      </NavLink>
                    ))}
                  </div>
                ) : (
                  <NavLink
                    to="/learn/personalize"
                    onClick={() => setMobileNavOpen(false)}
                    className="mx-1 flex items-center gap-3 rounded-2xl border border-dashed border-[#34474F] px-3 py-3"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange/10 text-orange">
                      <Plus className="h-4 w-4" />
                    </span>

                    <span>
                      <span className="block font-sans text-sm font-bold text-[#D6E0E3]">
                        Start your first journey
                      </span>

                      <span className="mt-0.5 block font-sans text-[11px] text-[#60757E]">
                        Begin with something curious.
                      </span>
                    </span>
                  </NavLink>
                )}
              </div>

              <div className="mt-auto">
                <SignOutButton userName={userName} />
              </div>
            </aside>
          </div>
        )}

        {/* Main */}
        <main className="min-w-0 flex-1 overflow-y-auto pt-16 lg:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}

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

      navigate('/', {
        replace: true,
      });
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
      className={[
        'flex w-full items-center gap-3 rounded-2xl',
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
        <span className="block truncate font-sans text-sm font-extrabold text-white">
          {isSigningOut ? 'Signing out...' : userName}
        </span>

        {!isSigningOut && (
          <span className="mt-0.5 block font-sans text-[11px] font-medium text-[#60757E]">
            Account
          </span>
        )}
      </span>

      <LogOut className="h-4 w-4 shrink-0 text-[#60757E]" />
    </button>
  );
}