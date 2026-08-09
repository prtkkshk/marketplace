/**
 * Shared e2e credentials, read from .env.test (loaded by playwright.config.ts).
 *
 * Specs previously hardcoded accounts like `teststudent1@kgpian.iitkgp.ac.in` and
 * `admin@kgpian.iitkgp.ac.in`, which do not exist — `npm run qa:bootstrap` provisions
 * `qa.student.a/b/banned` instead. Those specs therefore failed at sign-in on every browser,
 * and surfaced twenty seconds later as "input[id=full-name] not found", which sends you
 * looking at the profile form rather than at the login.
 *
 * Reading them from one place means a rotated password is a one-line change, and it keeps
 * credentials out of the repo.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. It comes from codebase/.env.test, which playwright.config.ts ` +
        `loads at startup. Run \`npm run qa:bootstrap\` if the QA identities are missing.`
    );
  }
  return value;
}

export const studentA = () => ({
  email: required('E2E_STUDENT_A_EMAIL'),
  password: required('E2E_STUDENT_PASSWORD'),
});

export const studentB = () => ({
  email: required('E2E_STUDENT_B_EMAIL'),
  password: required('E2E_STUDENT_PASSWORD'),
});

export const bannedStudent = () => ({
  email: required('E2E_BANNED_EMAIL'),
  password: required('E2E_STUDENT_PASSWORD'),
});

export const admin = () => ({
  email: required('E2E_ADMIN_EMAIL'),
  password: required('E2E_ADMIN_PASSWORD'),
});

/**
 * Signs in and asserts it worked.
 *
 * Without the assertion a failed login silently leaves you on /auth/signin, and the test
 * fails much later on a missing element — the single most common false lead in this suite.
 */
import { createClient } from '@supabase/supabase-js';

export async function signIn(
  page: import('@playwright/test').Page,
  who: { email: string; password: string }
): Promise<void> {
  await page.goto('/auth/signin');
  await page.fill('input[type="email"]', who.email);
  await page.fill('input[type="password"]', who.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/auth'), { timeout: 20000 });
}

export async function createThrowawayStudent(email: string, completeProfile: boolean = false) {
  const adminClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password: required('E2E_STUDENT_PASSWORD'),
    email_confirm: true
  });
  if (error) throw error;
  
  if (completeProfile) {
    await adminClient.from('profiles').update({
      full_name: 'Throwaway QA',
      roll_number: `22QA${Math.floor(10000 + Math.random() * 90000)}`,
      whatsapp_number: '+919999900000',
      is_profile_complete: true
    }).eq('id', data.user.id);
  }
  
  return {
    email,
    password: required('E2E_STUDENT_PASSWORD'),
    id: data.user.id
  };
}

export async function deleteThrowawayStudent(id: string) {
  const adminClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  await adminClient.auth.admin.deleteUser(id);
}
