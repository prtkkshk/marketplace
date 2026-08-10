import { z } from 'zod';

const envSchema = z.object({
 VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL'),
 // Despite the name, this must hold a PUBLISHABLE key (sb_publishable_...), not the
 // legacy anon JWT. Legacy JWT-based API keys were disabled on this Supabase project on
 // 8 Aug 2026 after a service_role key leak; a legacy key now fails at the first request
 // with "Legacy API keys are disabled", which is meaningless to a student staring at the
 // sign-in screen. This has already caused two production incidents — both times the
 // Vercel env var held a stale value while the local .env was correct. Fail loudly here
 // instead. The variable name is kept for now to avoid churn; renaming is tracked
 // separately.
 VITE_SUPABASE_ANON_KEY: z
 .string()
 .min(1, 'VITE_SUPABASE_ANON_KEY is required')
 .refine((k) => !k.startsWith('eyJ'), {
 message:
 'looks like a legacy JWT key, which this project has disabled. Use the publishable ' +
 'key (sb_publishable_...) from Supabase → Settings → API Keys. If this fired on a ' +
 'deploy, the Vercel environment variable is stale — update it and redeploy WITHOUT ' +
 'the build cache, since Vite inlines env vars at build time.',
 }),
 VITE_APP_URL: z.string().url('VITE_APP_URL must be a valid URL'),
});

const parseEnv = () => {
 const result = envSchema.safeParse({
 VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
 VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
 VITE_APP_URL: import.meta.env.VITE_APP_URL,
 });

 if (!result.success) {
 const formattedErrors = result.error.errors
 .map((err) => ` - ${err.path.join('.')}: ${err.message}`)
 .join('\n');
 throw new Error(
 `Invalid or missing environment variables:\n${formattedErrors}\nPlease check your .env file against .env.example.`
 );
 }

 return result.data;
};

export const env = parseEnv();
