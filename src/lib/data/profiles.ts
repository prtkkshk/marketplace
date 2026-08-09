import { supabase } from '../supabase';
import type { Database } from '../database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export interface StudentProfile {
 id: string;
 email: string;
 fullName: string | null;
 rollNumber: string | null;
 hallOfResidence: string | null;
 whatsappNumber: string | null;
 isProfileComplete: boolean;
 isAdmin: boolean;
 isBanned: boolean;
 bannedReason: string | null;
 lastActiveAt: string;
 createdAt: string;
 updatedAt: string;
}

export function mapProfileRow(row: ProfileRow): StudentProfile {
 return {
 id: row.id,
 email: row.email,
 fullName: row.full_name,
 rollNumber: row.roll_number,
 hallOfResidence: row.hall_of_residence,
 whatsappNumber: row.whatsapp_number,
 isProfileComplete: row.is_profile_complete,
 isAdmin: row.is_admin,
 isBanned: row.is_banned,
 bannedReason: row.banned_reason,
 lastActiveAt: row.last_active_at,
 createdAt: row.created_at,
 updatedAt: row.updated_at,
 };
}

/**
 * Fetches the CALLER'S OWN profile.
 *
 * Takes no user id, by design. Since the SEC-05 fix, `whatsapp_number`, `roll_number`,
 * `email` and `banned_reason` are revoked from the `authenticated` role, and the only way
 * to read them is `get_my_profile()` — a SECURITY DEFINER function hard-scoped to
 * `auth.uid()`. There is deliberately no client path to fetch an arbitrary user's full
 * profile any more. Admins use `get_admin_user_list()` instead.
 *
 * A parameter the function cannot honour is a lie in the signature, so it is removed rather
 * than underscore-prefixed.
 */
export async function fetchProfile(): Promise<StudentProfile | null> {
 const { data, error } = await supabase
 .rpc('get_my_profile')
 .single();

 if (error) {
 if (error.code === 'PGRST116') {
 return null;
 }
 throw new Error(`Failed to fetch profile: ${error.message}`);
 }

 return data ? mapProfileRow(data) : null;
}

/** Updates or inserts user profile fields safely using upsert and maybeSingle */
export async function updateProfile(
 _userId: string,
 updates: {
 fullName?: string;
 rollNumber?: string;
 hallOfResidence?: string;
 whatsappNumber?: string;
 isProfileComplete?: boolean;
 email?: string;
 }
): Promise<StudentProfile> {
 const { data: userData } = await supabase.auth.getUser();
 const { data: sessionData } = await supabase.auth.getSession();
 const userEmail = updates.email || userData?.user?.email || sessionData?.session?.user?.email || '';

 const payload: Record<string, unknown> = {
 id: _userId,
 };

 if (userEmail) {
 payload.email = userEmail;
 }

 if (updates.fullName !== undefined) payload.full_name = updates.fullName;
 if (updates.rollNumber !== undefined) payload.roll_number = updates.rollNumber.toUpperCase();
 if (updates.hallOfResidence !== undefined) payload.hall_of_residence = updates.hallOfResidence;
 if (updates.whatsappNumber !== undefined) payload.whatsapp_number = updates.whatsappNumber;
 if (updates.isProfileComplete !== undefined) payload.is_profile_complete = updates.isProfileComplete;

 const { error } = await supabase.from('profiles')
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 .upsert(payload as any, { onConflict: 'id' });

 if (error) {
 throw new Error(`Failed to update profile: ${error.message}`);
 }

 const { data: updatedData, error: fetchError } = await supabase
 .rpc('get_my_profile')
 .single();

 if (fetchError) {
 throw new Error(`Failed to fetch updated profile: ${fetchError.message}`);
 }

 if (updatedData) {
 return mapProfileRow(updatedData);
 }

 const fetched = await fetchProfile();
 if (fetched) {
 return fetched;
 }

 return {
 id: _userId,
 email: userEmail,
 fullName: updates.fullName || null,
 rollNumber: updates.rollNumber || null,
 hallOfResidence: updates.hallOfResidence || null,
 whatsappNumber: updates.whatsappNumber || null,
 isProfileComplete: updates.isProfileComplete ?? true,
 isAdmin: false,
 isBanned: false,
 bannedReason: null,
 lastActiveAt: new Date().toISOString(),
 createdAt: new Date().toISOString(),
 updatedAt: new Date().toISOString(),
 };
}

/** Completes initial mandatory student profile setup */
export async function completeProfile(
 userId: string,
 data: {
 fullName: string;
 rollNumber: string;
 hallOfResidence: string;
 whatsappNumber: string;
 }
): Promise<StudentProfile> {
 return updateProfile(userId, {
 ...data,
 isProfileComplete: true,
 });
}

/** Permanently deletes a student account (cascades database rows) */
export async function deleteAccount(userId: string): Promise<void> {
 const { error } = await supabase.from('profiles').delete().eq('id', userId);

 if (error) {
 throw new Error(`Failed to delete account: ${error.message}`);
 }

 await supabase.auth.signOut();
}
