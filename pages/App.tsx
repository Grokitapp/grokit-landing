import { Routes, Route } from 'react-router';

import Index from './Index';
import Onboarding from './Onboarding';
import Learn from './Learn';
import Terms from './Terms';
import PrivacyPolicy from './Privacypolicy';
import NotFound from './NotFound';

import Personalize from './learn/Personalize';
import Generating from './learn/Generating';
import CourseOverview from './learn/CourseOverview';
import PhaseDetail from './learn/PhaseDetail';

import AuthGuard from './auth/AuthGuard';

export default function App() {
  return (
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
  );
}