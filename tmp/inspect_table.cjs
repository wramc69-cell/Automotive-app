const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://yzamfqtvmhnrqijxkldb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6YW1mcXR2bWhucnFpanhrbGRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjU2OTUzMiwiZXhwIjoyMDg4MTQ1NTMyfQ.9XDCfwU4HMXZOKJW2dGv1ZQtE-F5ejj155L8DDv_mcA');

async function inspect() {
    console.log('Inspecting inspection_checklists table...');
    const { data: cols, error } = await supabase.rpc('inspect_table_columns', { table_name: 'inspection_checklists' });
    
    if (error) {
        console.log('Falling back to a query to guess columns...');
        const { data, error: qError } = await supabase.from('inspection_checklists').select('*').limit(1);
        if (qError) {
            console.error('Error fetching data:', qError);
        } else {
            console.log('First record keys:', Object.keys(data[0] || {}));
        }
    } else {
        console.log('Columns:', cols.map(c => c.column_name));
    }
}
inspect();
