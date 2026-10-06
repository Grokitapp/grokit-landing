import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router';

import AuthGuard from './auth/AuthGuard';
import { GrokitMascot } from '../components/Grokitmascot';

// Keep the lightweight/public entry points eager.
import Index from './Index';
import Terms from './Terms';
import PrivacyPolicy from './Privacypolicy';
import NotFound from './NotFound';

// Load heavier application pages only when their route is visited.
const Onboarding = lazy(() => import('./Onboarding'));
const Learn = lazy(() => import('./Learn'));
const Personalize = lazy(() => import('./learn/Personalize'));
const Generating = lazy(() => import('./learn/Generating'));
const CourseOverview = lazy(() => import('./learn/CourseOverview'));
const PhaseDetail = lazy(() => import('./learn/PhaseDetail'));

function RouteLoading() {
  return (
    <div className="min-h-screen bg-[#131F24] flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <GrokitMascot pose="thinking" size={96} />

        <p className="text-[#91A4AC] font-semibold">
          Loading...
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        {/* ================================================================
            PUBLIC ROUTES
            ================================================================ */}

        <Route path="/" element={<Index />} />

        <Route path="/onboarding" element={<Onboarding />} />

        <Route path="/terms" element={<Terms />} />

        <Route path="/privacy" element={<PrivacyPolicy />} />

        {/* ================================================================
            AUTHENTICATED LEARNING ROUTES
            ================================================================ */}

        <Route
          path="/learn"
          element={
            <AuthGuard>
              <Learn />
            </AuthGuard>
          }
        />

        <Route
          path="/learn/personalize"
          element={
            <AuthGuard>
              <Personalize />
            </AuthGuard>
          }
        />

        <Route
          path="/learn/generating"
          element={
            <AuthGuard>
              <Generating />
            </AuthGuard>
          }
        />

        <Route
          path="/learn/course/:courseId"
          element={
            <AuthGuard>
              <CourseOverview />
            </AuthGuard>
          }
        />

        <Route
          path="/learn/course/:courseId/phase/:phaseId"
          element={
            <AuthGuard>
              <PhaseDetail />
            </AuthGuard>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}