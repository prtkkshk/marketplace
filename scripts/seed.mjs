import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_PATH = join(ROOT, '.env.test');

function loadEnv(path) {
  if (!existsSync(path)) throw new Error('no .env.test');
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = loadEnv(ENV_PATH);
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) throw userError;
  const user = users.users[0];
  if (!user) throw new Error('No user found');

  console.log(`Seeding for user ${user.id}`);
  
  const categories = ['cycles', 'electronics', 'books', 'room_essentials', 'lab_gear', 'other'];
  const conditions = ['brand_new', 'like_new', 'good', 'fair'];
  const hall = user.user_metadata?.hall_of_residence || 'Azad';
  
  const listings = [];
  const wanted = [];
  
  for (let i = 0; i < 500; i++) {
    listings.push({
      user_id: user.id,
      title: `Listing ${i}`,
      description: `This is a test listing number ${i}.`,
      price: Math.floor(Math.random() * 5000),
      category: categories[i % categories.length],
      condition: conditions[i % conditions.length],
      is_negotiable: i % 2 === 0,
      photo_paths: [],
      hall_of_residence: hall,
      status: 'active'
    });
    
    if (i < 100) {
      wanted.push({
        user_id: user.id,
        title: `Wanted ${i}`,
        description: `Looking for item ${i}`,
        category: categories[i % categories.length],
        hall_of_residence: hall,
        max_budget: Math.floor(Math.random() * 5000)
      });
    }
  }

  // Insert in batches of 100
  for (let i = 0; i < listings.length; i += 100) {
    const batch = listings.slice(i, i + 100);
    const { error } = await supabase.from('listings').insert(batch);
    if (error) console.error(error);
    else console.log(`Inserted listings ${i} to ${i + 100}`);
  }
  
  for (let i = 0; i < wanted.length; i += 100) {
    const batch = wanted.slice(i, i + 100);
    const { error } = await supabase.from('wanted_requests').insert(batch);
    if (error) console.error(error);
    else console.log(`Inserted wanted ${i} to ${i + 100}`);
  }
}

seed().catch(console.error);
