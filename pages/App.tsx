import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router';

import Index from './Index';
import Onboarding from './Onboarding';
import Terms from './Terms';
import PrivacyPolicy from './Privacypolicy';
import LearnLayout from './learn/LearnLayout';
import FocusLayout from './learn/FocusLayout';

const Create = lazy(() => import('./Create'));
const Personalize = lazy(() => import('./learn/Personalize'));
const Generating = lazy(() => import('./learn/Generating'));
const CourseOverview = lazy(() => import('./learn/CourseOverview'));
const PhaseDetail = lazy(() => import('./learn/PhaseDetail'));
const LessonPlayer = lazy(() => import('./learn/LessonPlayer'));
const Profile = lazy(() => import('./Profile'));

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />

      {/* Screens with the persistent sidebar */}
      <Route element={<LearnLayout />}>
        <Route path="/create" element={<Create />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/learn/course/:courseId" element={<CourseOverview />} />
        <Route
          path="/learn/course/:courseId/phase/:phaseId"
          element={<PhaseDetail />}
        />
        <Route
          path="/learn/course/:courseId/lesson/:lessonId"
          element={<LessonPlayer />}
        />
      </Route>

      {/* Full-screen flow screens (no sidebar) */}
      <Route element={<FocusLayout />}>
        <Route path="/learn/personalize" element={<Personalize />} />
        <Route path="/learn/generating" element={<Generating />} />
      </Route>

      <Route path="/learn" element={<Navigate to="/create" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}