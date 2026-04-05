const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yzamfqtvmhnrqijxkldb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6YW1mcXR2bWhucnFpanhrbGRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjU2OTUzMiwiZXhwIjoyMDg4MTQ1NTMyfQ.9XDCfwU4HMXZOKJW2dGv1ZQtE-F5ejj155L8DDv_mcA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
    
    if (error) {
        console.error(error);
        return;
    }
    
    console.log('--- ÚLTIMOS PERFILES CREADOS ---');
    console.log(JSON.stringify(data, null, 2));
}

check();
