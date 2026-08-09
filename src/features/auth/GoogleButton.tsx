import React from 'react';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';

export const GoogleButton: React.FC<{ loading?: boolean }> = ({ loading = false }) => {
 const handleGoogleSignIn = async () => {
 try {
 const { error } = await supabase.auth.signInWithOAuth({
 provider: 'google',
 options: {
 queryParams: {
 hd: 'kgpian.iitkgp.ac.in',
 },
 redirectTo: `${window.location.origin}/`,
 },
 });

 if (error) {
 alert(`Google Sign-In failed: ${error.message}`);
 }
 } catch (err: unknown) {
 const msg = err instanceof Error ? err.message : 'Google sign in error';
 alert(msg);
 }
 };

 return (
 <Button
 type="button"
 variant="secondary"
 className="w-full font-medium"
 loading={loading}
 onClick={handleGoogleSignIn}
 
 >
 Sign in with Google Workspace
 </Button>
 );
};
