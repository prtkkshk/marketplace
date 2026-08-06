import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mxvgzdmxdrevxcjiyvqt.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'REDACTED';

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkListings() {
  const { data, error } = await client.from('listings').select('*');
  console.log(data);
}

checkListings();
