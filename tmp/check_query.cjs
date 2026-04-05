const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://yzamfqtvmhnrqijxkldb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6YW1mcXR2bWhucnFpanhrbGRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjU2OTUzMiwiZXhwIjoyMDg4MTQ1NTMyfQ.9XDCfwU4HMXZOKJW2dGv1ZQtE-F5ejj155L8DDv_mcA');

async function check() {
    console.log('Fetching service_requests with joins...');
    const { data, error } = await supabase
        .from('service_requests')
        .select('*, profiles(first_name, last_name, email), vehicles(make, model, year), appointments(assigned_tech_user_id, status, profiles(first_name, last_name))')
        .limit(5);

    if (error) {
        console.log('QUERY_ERROR:', JSON.stringify(error));
    } else {
        console.log('Results count:', data.length);
        if (data.length > 0) {
            console.log('First result ID:', data[0].id);
            console.log('Calculated profiles:', JSON.stringify(data[0].profiles));
            console.log('Calculated appointments:', JSON.stringify(data[0].appointments));
        }
    }
}

check();
