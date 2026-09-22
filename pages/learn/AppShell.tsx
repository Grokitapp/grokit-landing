import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { Home, Sparkles, Brain, Library, User, Plus, ChevronDown, Flame, Star } from 'lucide-react';
import { GrokitLogo } from '../../components/Grokitlogo';

// ─── Shared styles ────────────────────────────────────────────────────────────

const shellClasses = 'min-h-[100dvh] bg-[#131F24] text-white flex';
const sidebarClasses = 'w-[280px] shrink-0 border-r border-[#37464F] flex flex-col px-5 py-6';
const contentClasses = 'flex-1 min-w-0 overflow-y-auto';

const navItemBase = 'flex items-center gap-3 px-4 py-3 rounded-xl font-sans font-bold text-[15px] transition-colors';
const navItemActive = 'bg-[#202F35] text-orange';
const navItemInactive = 'text-[#91A4AC] hover:bg-[#1A282D] hover:text-white';

const coursesRowClasses = 'flex items-center justify-between px-2 mt-8 mb-2';
const coursesLabelClasses = 'flex items-center gap-1 text-[#91A4AC] font-sans font-semibold text-sm';
const addCourseButtonClasses = 'w-6 h-6 rounded-full flex items-center justify-center text-[#91A4AC] hover:bg-[#202F35] hover:text-white transition-colors';
const emptyCoursesClasses = 'px-2 text-[#60757E] font-sans text-sm';

const statsRowClasses = 'flex items-center gap-4 px-2 mt-auto pt-6 text-[#91A4AC] font-sans font-bold text-sm';
const statClasses = 'flex items-center gap-1.5';

const upgradeCardClasses = 'mt-4 p-4 rounded-2xl bg-orange/10 border border-orange/20 hover:bg-orange/15 transition-colors cursor-pointer';
const upgradeTitleClasses = 'font-display font-bold text-white text-sm mb-0.5';
const upgradeSubClasses = 'text-[#91A4AC] font-sans text-xs';

const profileRowClasses = 'flex items-center gap-3 px-2 mt-4 pt-4 border-t border-[#37464F] cursor-pointer';
const profileAvatarClasses = 'w-8 h-8 rounded-full bg-orange/20 text-orange font-display font-bold flex items-center justify-center text-sm shrink-0';
const profileNameClasses = 'flex-1 min-w-0 font-sans font-bold text-white text-sm truncate';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppShellProps {
  children: ReactNode;
  courses?: { id: string; title: string }[];
  coursesLoading?: boolean;
  userName?: string;
  streak?: number;
  stars?: number;
}

const navItems = [
  { label: 'Home', icon: Home, to: '/learn' },
  { label: 'Create', icon: Sparkles, to: '/learn/create' },
  { label: 'Canvas', icon: Brain, to: '/learn/canvas' },
  { label: 'Library', icon: Library, to: '/learn/library' },
  { label: 'Profile', icon: User, to: '/learn/profile' },
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
  return (
    <div className={shellClasses}>
      <aside className={sidebarClasses}>
        <div className="px-2 mb-8">
          <GrokitLogo />
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map(({ label, icon: Icon, to }) => (
            <NavLink
              key={label}
              to={to}
              end={to === '/learn'}
              className={({ isActive }) =>
                `${navItemBase} ${isActive ? navItemActive : navItemInactive}`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className={coursesRowClasses}>
          <span className={coursesLabelClasses}>
            Courses <ChevronDown className="w-3.5 h-3.5" />
          </span>
          <button type="button" aria-label="New course" className={addCourseButtonClasses}>
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {coursesLoading ? (
          <p className={emptyCoursesClasses}>Loading courses...</p>
        ) : courses.length === 0 ? (
          <p className={emptyCoursesClasses}>No courses yet</p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {courses.map((course) => (
              <NavLink
                key={course.id}
                to={`/learn/course/${course.id}`}
                className={({ isActive }) =>
                  `${navItemBase} ${isActive ? navItemActive : navItemInactive} text-sm`
                }
              >
                {course.title}
              </NavLink>
            ))}
          </div>
        )}

        <div className={statsRowClasses}>
          <span className={statClasses}>
            <Flame className="w-4 h-4 text-orange" /> {streak}
          </span>
          <span className={statClasses}>
            <Star className="w-4 h-4 text-amber" /> {stars}
          </span>
        </div>

        <div className={upgradeCardClasses}>
          <p className={upgradeTitleClasses}>Upgrade</p>
          <p className={upgradeSubClasses}>Learn without limits</p>
        </div>

        <div className={profileRowClasses}>
          <span className={profileAvatarClasses}>{userName.charAt(0).toUpperCase()}</span>
          <span className={profileNameClasses}>{userName}</span>
          <ChevronDown className="w-4 h-4 text-[#60757E] shrink-0" />
        </div>
      </aside>

      <div className={contentClasses}>{children}</div>
    </div>
  );
}