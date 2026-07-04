import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);

async function checkTables() {
  console.log('Checking Supabase tables connection...');
  
  const tables = [
    'resume_submissions',
    'offer_letter_submissions',
    'certifications',
    'certifications_staging',
    'market_jobs',
    'market_jobs_staging',
    'feedback_messages',
    'contact_submissions',
    'feature_flags',
    'audit_log'
  ];

  for (const table of tables) {
    const { data, error, count } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`❌ Table [${table}]: Error (${error.message}) - table might not exist in Supabase yet.`);
    } else {
      console.log(`✅ Table [${table}]: Online (${count || 0} rows found in database).`);
    }
  }
}

checkTables();
