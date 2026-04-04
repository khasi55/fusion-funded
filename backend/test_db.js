const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data, error } = await supabase
    .from('challenges')
    .select('challenge_type')
    .limit(10);
  
  if (error) {
    console.error('Error fetching challenges:', error);
    return;
  }
  
  console.log(JSON.stringify(data, null, 2));
}

test();
