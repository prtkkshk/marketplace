import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mxvgzdmxdrevxcjiyvqt.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'REDACTED';

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: listings } = await client.from('listings').select('id, user_id, title');
  const { data: profiles } = await client.from('profiles').select('id, email, is_admin, is_banned');
  console.log('Listings:', listings);
  console.log('Profiles:', profiles);
}

check();
