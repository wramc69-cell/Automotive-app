const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://yzamfqtvmhnrqijxkldb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6YW1mcXR2bWhucnFpanhrbGRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjU2OTUzMiwiZXhwIjoyMDg4MTQ1NTMyfQ.9XDCfwU4HMXZOKJW2dGv1ZQtE-F5ejj155L8DDv_mcA');

async function check() {
    const { data, error } = await supabase
        .from('appointments')
        .select('id, status, request_id, service_requests(id, ticket_number, status)')
        .order('created_at', { ascending: false });

    if (error) {
        fs.writeFileSync('tmp/mismatch_result.txt', JSON.stringify(error));
    } else {
        const res = data.map(a => ({
            appointment_id: a.id,
            appointment_status: a.status,
            ticket: a.service_requests.ticket_number,
            request_status: a.service_requests.status
        }));
        fs.writeFileSync('tmp/mismatch_result.txt', JSON.stringify(res, null, 2));
    }
}
check();
