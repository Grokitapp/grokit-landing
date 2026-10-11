import { Suspense } from 'react';
import { Outlet } from 'react-router';

import AuthGuard from '../auth/AuthGuard';

function PageLoader() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#131F24]">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#304553] border-t-orange" />
    </div>
  );
}

/**
 * Full-screen, no-sidebar flow screens (Personalize, Generating).
 * Same auth guard as the shell, without the sidebar.
 */
export default function FocusLayout() {
  return (
    <AuthGuard>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </AuthGuard>
  );
}