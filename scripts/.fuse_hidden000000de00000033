import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import * as url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const envPath = path.resolve(__dirname, '../.env.test');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { auth: { persistSession: false } });

async function testGap() {
  const { data: auth, error: authErr } = await client.auth.signInWithPassword({
    email: env.E2E_STUDENT_A_EMAIL,
    password: env.E2E_STUDENT_PASSWORD
  });
  
  if (authErr) throw authErr;
  
  const { data, error } = await client.from('profiles').update({
    full_name: null,
    roll_number: null,
    hall_of_residence: null,
    whatsapp_number: null,
    is_profile_complete: true
  }).eq('id', auth.user.id).select();
  
  console.log('Update result:', data, error);
}

testGap();
