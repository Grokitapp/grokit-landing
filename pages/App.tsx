import { lazy, Suspense } from 'react';

import {
  Navigate,
  Route,
  Routes,
} from 'react-router';

import Index from './Index';
import Onboarding from './Onboarding';
import AuthGuard from './auth/AuthGuard';

import Terms from './Terms';
import PrivacyPolicy from './Privacypolicy';

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

export default function App() {
  return (
    <Routes>

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

      <Route
        path="/create"
        element={
          <ProtectedLearningPage>
            <Create />
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

      <Route
        path="/learn/course/:courseId/lesson/:lessonId"
        element={
          <ProtectedLearningPage>
            <LessonPlayer />
          </ProtectedLearningPage>
        }
      />

      <Route
        path="/learn"
        element={
          <Navigate
            to="/create"
            replace
          />
        }
      />

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