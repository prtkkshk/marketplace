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
 const p = await fetchProfile();
 setProfile(p);
 // Bump DAU activity timestamp
 supabase.from('profiles').update({ last_active_at: new Date().toISOString() }).eq('id', userId).then();
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
 // supabase-js v2 fires INITIAL_SESSION synchronously on subscribe, with the same
 // session initAuth() above just fetched via getSession(). Without this guard both
 // paths call loadUserProfile() concurrently for the same user on every page load —
 // confirmed in a throttled network trace as two near-simultaneous get_my_profile RPC
 // calls plus two last_active_at updates, competing for bandwidth on the same
 // connection the feed's own data fetch needs. initAuth() already handles this exact
 // case, so INITIAL_SESSION here is redundant work, not a second real event.
 if (event === 'INITIAL_SESSION') return;

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
