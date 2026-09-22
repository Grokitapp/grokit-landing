/**
 * ROUTING RULES:
 * - Router is in main.tsx. Do NOT add another <BrowserRouter> here or anywhere.
 * - Use <Routes> + <Route> components ONLY. Do NOT use useRoutes().
 * - STATIC IMPORTS ONLY — no React.lazy() or dynamic import().
 * - Import from 'react-router' — NOT 'react-router-dom'.
 */

import { Routes, Route } from 'react-router';

import Index from './Index';
import Onboarding from './Onboarding';
import Learn from './Learn';
import Terms from './Terms';
import PrivacyPolicy from './Privacypolicy';
import Personalize from './learn/Personalize';
import Generating from './learn/Generating';
import CourseOverview from './learn/CourseOverview';
import PhaseDetail from './learn/PhaseDetail';

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
        path="/learn"
        element={<Learn />}
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
        path="/learn/personalize" 
        element={<Personalize />} 
      />

      <Route 
        path="/learn/generating" 
        element={<Generating />} 
      />

      <Route 
        path="/learn/course/:courseId" 
        element={<CourseOverview />} 
      />

      <Route 
        path="/learn/course/:courseId/phase/:phaseId" 
        element={<PhaseDetail />} 
      />
    </Routes>
  );
}