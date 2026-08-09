import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Read .env.test manually
const envPath = path.resolve(process.cwd(), '.env.test');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2];
});

const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('listings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Cleared all listings:', error ? error : 'Success');
  
  const { data: d2, error: e2 } = await supabase.from('wanted_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Cleared all wanted requests:', e2 ? e2 : 'Success');
  
  const { data: d3, error: e3 } = await supabase.from('reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('Cleared all reports:', e3 ? e3 : 'Success');
}

main();
