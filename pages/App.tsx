import { lazy, Suspense } from 'react';

import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import Index from './Index';
import Onboarding from './Onboarding';
import AuthGuard from './auth/AuthGuard';

import Terms from './Terms';
import PrivacyPolicy from './Privacypolicy';

// ─── Lazy-loaded learning pages ─────────────────────────────────────────────

const Learn = lazy(
  () => import('./Learn'),
);

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

// ─── Loading fallback ───────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#131F24]">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#304553] border-t-orange" />
    </div>
  );
}

// ─── Protected learning route ──────────────────────────────────────────────

function ProtectedLearningPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </AuthGuard>
  );
}

// ─── App ────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <Routes>
      {/* ──────────────────────────────────────────────────────────────── */}
      {/* Public routes                                                     */}
      {/* ──────────────────────────────────────────────────────────────── */}

      <Route
        path="/"
        element={<Index />}
      />

      <Route
        path="/onboarding"
        element={<Onboarding />}
      />

      <Route
        path="/terms"
        element={<Terms />}
      />

      <Route
        path="/privacy"
        element={<PrivacyPolicy />}
      />

      {/* ──────────────────────────────────────────────────────────────── */}
      {/* Protected learning routes                                        */}
      {/* ──────────────────────────────────────────────────────────────── */}

      <Route
        path="/learn"
        element={
          <ProtectedLearningPage>
            <Learn />
          </ProtectedLearningPage>
        }
      />

      <Route
        path="/learn/personalize"
        element={
          <ProtectedLearningPage>
            <Personalize />
          </ProtectedLearningPage>
        }
      />

      <Route
        path="/learn/generating"
        element={
          <ProtectedLearningPage>
            <Generating />
          </ProtectedLearningPage>
        }
      />

      <Route
        path="/learn/course/:courseId"
        element={
          <ProtectedLearningPage>
            <CourseOverview />
          </ProtectedLearningPage>
        }
      />

      <Route
        path="/learn/course/:courseId/phase/:phaseId"
        element={
          <ProtectedLearningPage>
            <PhaseDetail />
          </ProtectedLearningPage>
        }
      />

      {/* ──────────────────────────────────────────────────────────────── */}
      {/* Lesson Player                                                     */}
      {/* ──────────────────────────────────────────────────────────────── */}

      <Route
        path="/learn/course/:courseId/lesson/:lessonId"
        element={
          <ProtectedLearningPage>
            <LessonPlayer />
          </ProtectedLearningPage>
        }
      />

      {/* ──────────────────────────────────────────────────────────────── */}
      {/* Fallback                                                          */}
      {/* ──────────────────────────────────────────────────────────────── */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}