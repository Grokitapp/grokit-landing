import { Suspense } from 'react';
import { Outlet } from 'react-router';

import AuthGuard from '../auth/AuthGuard';
import AppShell from './AppShell';

function ContentLoader() {
  return (
    <div className="flex min-h-[60dvh] items-center justify-center">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#304553] border-t-orange" />
    </div>
  );
}

/**
 * Persistent shell for in-app screens that show the sidebar.
 * AppShell mounts once here, so the sidebar never reloads between pages.
 */
export default function LearnLayout() {
  return (
    <AuthGuard>
      <AppShell>
        <Suspense fallback={<ContentLoader />}>
          <Outlet />
        </Suspense>
      </AppShell>
    </AuthGuard>
  );
}