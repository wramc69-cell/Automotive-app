const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://yzamfqtvmhnrqijxkldb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6YW1mcXR2bWhucnFpanhrbGRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjU2OTUzMiwiZXhwIjoyMDg4MTQ1NTMyfQ.9XDCfwU4HMXZOKJW2dGv1ZQtE-F5ejj155L8DDv_mcA');

async function inspect() {
    console.log('Inspecting checklist_items table...');
    const { data, error: qError } = await supabase.from('checklist_items').select('*').limit(1);
    if (qError) {
        console.error('Error fetching data:', qError);
    } else {
        console.log('First record keys:', Object.keys(data[0] || {}));
    }
}
inspect();
