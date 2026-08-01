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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Fetches a profile by user ID */
export async function fetchProfile(userId: string): Promise<StudentProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, roll_number, hall_of_residence, whatsapp_number, is_profile_complete, is_admin, is_banned, banned_reason, created_at, updated_at')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  return mapProfileRow(data);
}

/** Updates user profile fields */
export async function updateProfile(
  userId: string,
  updates: {
    fullName?: string;
    rollNumber?: string;
    hallOfResidence?: string;
    whatsappNumber?: string;
    isProfileComplete?: boolean;
  }
): Promise<StudentProfile> {
  const payload: Partial<ProfileRow> = {};

  if (updates.fullName !== undefined) payload.full_name = updates.fullName;
  if (updates.rollNumber !== undefined) payload.roll_number = updates.rollNumber.toUpperCase();
  if (updates.hallOfResidence !== undefined) payload.hall_of_residence = updates.hallOfResidence;
  if (updates.whatsappNumber !== undefined) payload.whatsapp_number = updates.whatsappNumber;
  if (updates.isProfileComplete !== undefined) payload.is_profile_complete = updates.isProfileComplete;

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select('id, email, full_name, roll_number, hall_of_residence, whatsapp_number, is_profile_complete, is_admin, is_banned, banned_reason, created_at, updated_at')
    .single();

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  return mapProfileRow(data);
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
