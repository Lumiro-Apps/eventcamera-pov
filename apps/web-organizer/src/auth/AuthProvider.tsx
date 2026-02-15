'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';

import {
  clearOrganizerApiSession,
  createOrganizerApiSession,
  getOrganizerApiSession
} from '../lib/organizer-api';
import { supabase } from '../lib/supabase';

interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function ensureApiSession(nextSession: Session, forceCreate = false): Promise<void> {
      if (forceCreate) {
        await createOrganizerApiSession(nextSession.access_token);
        return;
      }

      try {
        await getOrganizerApiSession();
      } catch {
        await createOrganizerApiSession(nextSession.access_token);
      }
    }

    async function applySession(nextSession: Session | null, forceCreate = false): Promise<void> {
      if (!mounted) return;

      if (!nextSession) {
        setSession(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        await ensureApiSession(nextSession, forceCreate);
        if (!mounted) return;
        setSession(nextSession);
      } catch (error) {
        console.error('Failed to establish organizer API session', error);
        if (!mounted) return;
        setSession(null);
        await supabase.auth.signOut();
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      await applySession(data.session ?? null);
    }

    void loadSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      const forceCreate = event === 'SIGNED_IN';
      void applySession(nextSession ?? null, forceCreate);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      signOut: async () => {
        await clearOrganizerApiSession();
        await supabase.auth.signOut();
      }
    }),
    [session, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
