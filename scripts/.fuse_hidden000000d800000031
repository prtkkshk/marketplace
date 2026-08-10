import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('./.env.test');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match && match[1]) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    process.env[match[1]] = value;
  }
});

const client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
async function run() {
  const { error } = await client.auth.signUp({
    email: 'hacker@gmail.com',
    password: 'Password123!',
    options: { data: { full_name: 'Hacker' } }
  });
  console.log("Signup error:", error?.message);
}
run();
