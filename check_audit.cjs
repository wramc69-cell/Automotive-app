const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yzamfqtvmhnrqijxkldb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6YW1mcXR2bWhucnFpanhrbGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1Njk1MzIsImV4cCI6MjA4ODE0NTUzMn0.Kxnha4aWO5gzdT2rYroNUi09QeGd7L92liTE9JsQcTM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
    
    if (error) {
        console.error(error);
        return;
    }
    
    console.log(JSON.stringify(data, null, 2));
}

check();
