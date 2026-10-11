import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';

import {
  Navigate,
  Outlet,
  Route,
  Routes,
} from 'react-router';

import Index from './Index';
import Onboarding from './Onboarding';
import AuthGuard from './auth/AuthGuard';

import Terms from './Terms';
import PrivacyPolicy from './Privacypolicy';

import AppShell from './learn/AppShell';

const Create = lazy(() => import('./Create'));

const Personalize = lazy(
  () => import('./learn/Personalize'),
);

const Generating = lazy(
  () => import('./learn/Generating'),
);

const CourseOverview = lazy(
  () => import('./learn/CourseOverview'),
);

const PhaseDetail = lazy(
  () => import('./learn/PhaseDetail'),
);

const LessonPlayer = lazy(
  () => import('./learn/LessonPlayer'),
);

function PageLoader() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#131F24]">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#304553] border-t-orange" />
    </div>
  );
}

function ProtectedLearningLayout() {
  return (
    <AuthGuard>
      <AppShell>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </AppShell>
    </AuthGuard>
  );
}

function ProtectedStandalonePage({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AuthGuard>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </AuthGuard>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />

      <Route path="/onboarding" element={<Onboarding />} />

      <Route path="/terms" element={<Terms />} />

      <Route path="/privacy" element={<PrivacyPolicy />} />

      <Route element={<ProtectedLearningLayout />}>
        <Route path="/create" element={<Create />} />
        <Route path="/learn/personalize" element={<Personalize />} />
        <Route path="/learn/generating" element={<Generating />} />
        <Route
          path="/learn/course/:courseId"
          element={<CourseOverview />}
        />
        <Route
          path="/learn/course/:courseId/phase/:phaseId"
          element={<PhaseDetail />}
        />
        <Route
          path="/learn/course/:courseId/lesson/:lessonId"
          element={<LessonPlayer />}
        />
      </Route>

      <Route
        path="/learn"
        element={<Navigate to="/create" replace />}
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}
