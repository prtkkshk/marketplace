import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
// We should use the ANON KEY to simulate a student upload to test RLS and bucket permissions.
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const studentAEmail = process.env.E2E_STUDENT_A_EMAIL;
const studentPassword = process.env.E2E_STUDENT_PASSWORD;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUploads() {
  console.log('Logging in as student A...');
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: studentAEmail,
    password: studentPassword
  });
  
  if (authErr) throw authErr;

  const userId = authData.user.id;
  const timestamp = Date.now();

  console.log('1. Uploading SVG with script...');
  const svgContent = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert("XSS")</script></svg>';
  const { data: svgData, error: svgErr } = await supabase.storage
    .from('listing-photos')
    .upload(`${userId}/${timestamp}-xss.svg`, svgContent, {
      contentType: 'image/svg+xml'
    });

  if (svgErr) {
    console.log('SVG Upload Blocked (Good):', svgErr.message);
  } else {
    console.log('SVG Upload Succeeded (Stored XSS Risk!):', svgData);
    const { data } = supabase.storage.from('listing-photos').getPublicUrl(`${userId}/${timestamp}-xss.svg`);
    console.log('URL:', data.publicUrl);
  }

  console.log('2. Uploading .txt renamed to .jpg...');
  const txtContent = 'This is a text file pretending to be a JPG';
  const { data: txtData, error: txtErr } = await supabase.storage
    .from('listing-photos')
    .upload(`${userId}/${timestamp}-fake.jpg`, txtContent, {
      contentType: 'image/jpeg'
    });

  if (txtErr) {
    console.log('Fake JPG Upload Blocked (Good):', txtErr.message);
  } else {
    console.log('Fake JPG Upload Succeeded (MIME Risk!):', txtData);
  }

  process.exit(0);
}

testUploads().catch(console.error);
