const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://yzamfqtvmhnrqijxkldb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6YW1mcXR2bWhucnFpanhrbGRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjU2OTUzMiwiZXhwIjoyMDg4MTQ1NTMyfQ.9XDCfwU4HMXZOKJW2dGv1ZQtE-F5ejj155L8DDv_mcA');

async function check() {
    console.log('Checking foreign key references for inspection_checklists...');
    // We can't query information_schema.key_column_usage directly via Supabase client usually
    // But we can try to test by inserting a NULL if allowed or a known existing/non-existing ID
    const { data: tmps } = await supabase.from('checklist_templates').select('id, name').limit(1);
    if (tmps && tmps.length > 0) {
        console.log('Sample Template ID:', tmps[0].id, '(', tmps[0].name, ')');
    } else {
        console.error('No templates found in checklist_templates!');
    }
}
check();
