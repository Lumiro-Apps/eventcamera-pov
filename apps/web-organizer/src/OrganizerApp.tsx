'use client';

import { Loader2 } from 'lucide-react';

import { AuthProvider, useAuth } from './auth/AuthProvider';
import { OrganizerShell } from './auth/OrganizerShell';
import { SignInForm } from './auth/SignInForm';

function AuthGate() {
  const { isLoading, session } = useAuth();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading session...</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <SignInForm />
      </main>
    );
  }

  return <OrganizerShell />;
}

export function OrganizerApp() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
