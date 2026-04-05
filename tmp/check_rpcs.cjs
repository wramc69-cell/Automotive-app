const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://yzamfqtvmhnrqijxkldb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6YW1mcXR2bWhucnFpanhrbGRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjU2OTUzMiwiZXhwIjoyMDg4MTQ1NTMyfQ.9XDCfwU4HMXZOKJW2dGv1ZQtE-F5ejj155L8DDv_mcA');

async function checkRPCs() {
    console.log('Checking available RPCs...');
    const { data, error } = await supabase.rpc('inspect_functions'); // This probably exists in some Supabase projects or I try it
    
    if (error) {
        console.log('inspect_functions failed, trying a simple select on pg_proc...');
        // I can't do raw SQL via client unless I use a special RPC
    }
}
checkRPCs();
