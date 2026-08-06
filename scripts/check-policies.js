import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mxvgzdmxdrevxcjiyvqt.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'REDACTED';

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkPolicies() {
  // Supabase Rest API can't query pg_policies easily unless exposed, but let's try.
  const { data, error } = await client.from('pg_policies').select('*').eq('tablename', 'listings');
  console.log(data, error);
}

checkPolicies();
