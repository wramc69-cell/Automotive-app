const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yzamfqtvmhnrqijxkldb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6YW1mcXR2bWhucnFpanhrbGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1Njk1MzIsImV4cCI6MjA4ODE0NTUzMn0.Kxnha4aWO5gzdT2rYroNUi09QeGd7L92liTE9JsQcTM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: cols, error: colError } = await supabase
        .rpc('get_column_names', { table_name: 'notifications_outbox' }); // May not exist
    
    // Better way: select 1 row and check keys
    const { data, error } = await supabase.from('notifications_outbox').select('*').limit(1);
    
    if (error) {
        console.error(error);
        return;
    }
    
    if (data.length > 0) {
        console.log("Existing columns in notifications_outbox:", Object.keys(data[0]));
    } else {
        console.log("No data found to check columns. I'll check via profiling or creating a dummy.");
    }
}

check();
