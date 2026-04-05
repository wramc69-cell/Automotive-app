const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://yzamfqtvmhnrqijxkldb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6YW1mcXR2bWhucnFpanhrbGRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjU2OTUzMiwiZXhwIjoyMDg4MTQ1NTMyfQ.9XDCfwU4HMXZOKJW2dGv1ZQtE-F5ejj155L8DDv_mcA');

async function check() {
    const { data: cols, error } = await supabase.rpc('get_column_names', { table_name: 'inspection_checklists' }); // If RPC exists
    // Fallback: query information_schema if possible or just try to insert different values
    console.log('Checking status column in inspection_checklists...');
    const { data, error: qError } = await supabase.from('inspection_checklists').select('status').limit(1);
    if (qError) {
        console.error('Error:', qError.message);
    } else {
        console.log('Current status values found:', data);
    }
}
check();
