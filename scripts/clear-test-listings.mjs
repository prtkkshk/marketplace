import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '../.env.test');
const envStr = fs.readFileSync(envPath, 'utf-8');
for (const line of envStr.split('\n')) {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.join('=').trim();
    }
  }
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearListings() {
  console.log('Clearing test listings to avoid RATE_LIMIT_EXCEEDED...');
  
  // Delete all listings with title "Test EXIF Stripping"
  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('title', 'Test EXIF Stripping');
    
  if (error) {
    console.error('Error deleting listings:', error);
  } else {
    console.log('Successfully cleared test listings.');
  }
}

clearListings();
