import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { fetchProfile, type StudentProfile } from '../../lib/data/profiles';
import { ALLOWED_EMAIL_DOMAIN } from '../../lib/constants';

interface AuthContextType {
  session: Session | null;
  profile: StudentProfile | null;
  isAdmin: boolean;
  loading: boolean;
  domainError: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearDomainError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [domainError, setDomainError] = useState<string | null>(null);

  const loadUserProfile = async (userId: string) => {
    try {
      const p = await fetchProfile(userId);
      setProfile(p);
    } catch (err) {
      console.error('Failed to load user profile:', err);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (session?.user.id) {
      await loadUserProfile(session.user.id);
    }
  };

  const clearDomainError = () => setDomainError(null);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const currentSession = data.session;

        if (currentSession?.user) {
          const userEmail = currentSession.user.email ?? '';
          if (!userEmail.endsWith(ALLOWED_EMAIL_DOMAIN)) {
            await supabase.auth.signOut();
            if (isMounted) {
              setDomainError(`Account (${userEmail}) rejected. Only ${ALLOWED_EMAIL_DOMAIN} emails are allowed.`);
              setSession(null);
              setProfile(null);
            }
          } else {
            if (isMounted) {
              setSession(currentSession);
              await loadUserProfile(currentSession.user.id);
            }
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (newSession?.user) {
        const userEmail = newSession.user.email ?? '';
        if (!userEmail.endsWith(ALLOWED_EMAIL_DOMAIN)) {
          await supabase.auth.signOut();
          setDomainError(`Account (${userEmail}) rejected. Only ${ALLOWED_EMAIL_DOMAIN} emails are allowed.`);
          setSession(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setSession(newSession);
        await loadUserProfile(newSession.user.id);
      } else {
        setSession(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    session,
    profile,
    isAdmin: !!profile?.isAdmin,
    loading,
    domainError,
    signOut: handleSignOut,
    refreshProfile,
    clearDomainError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
