import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Very simple env parser since process.loadEnvFile might not be stable
const envPath = join(__dirname, '../.env.test');
const envContent = fs.readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  }
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const studentAEmail = process.env.E2E_STUDENT_A_EMAIL;

if (!supabaseUrl || !supabaseKey || !studentAEmail) {
  console.error('Missing required env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inject() {
  console.log('Fetching user A ID...');
  const { data: users, error: userErr } = await supabase.auth.admin.listUsers();
  if (userErr) throw userErr;
  
  const user = users.users.find(u => u.email === studentAEmail);
  if (!user) throw new Error('User A not found');

  const xssTitle = '<img src=x onerror=alert(1)>';
  const xssDesc = '"><script>alert(1)</script> javascript:alert(1) {{7*7}} ${7*7} \n ? & #';
  const xssFullName = '<svg/onload=alert(1)>';
  
  console.log('Injecting profile full_name...');
  const { error: profileErr } = await supabase
    .from('profiles')
    .update({ full_name: xssFullName })
    .eq('id', user.id);
  if (profileErr) throw profileErr;

  console.log('Injecting listing...');
  const { data: listing, error: listingErr } = await supabase
    .from('listings')
    .insert({
      id: randomUUID(),
      user_id: user.id,
      title: xssTitle,
      description: xssDesc,
      price: 1337,
      category: 'cycles',
      condition: 'good',
      is_negotiable: true,
      hall_of_residence: 'Patel',
      status: 'active',
      photo_paths: []
    })
    .select()
    .single();
  if (listingErr) throw listingErr;
  
  console.log('Injecting wanted request...');
  const { error: wantedErr } = await supabase
    .from('wanted_requests')
    .insert({
      id: randomUUID(),
      user_id: user.id,
      title: xssTitle,
      description: xssDesc,
      category: 'cycles',
      max_budget: 2000,
      hall_of_residence: 'Patel',
      status: 'open'
    });
  if (wantedErr) throw wantedErr;

  console.log(`Injected successfully. Listing ID: ${listing.id}`);
  process.exit(0);
}

inject().catch(console.error);
