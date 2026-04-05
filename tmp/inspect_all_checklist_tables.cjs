const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://yzamfqtvmhnrqijxkldb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6YW1mcXR2bWhucnFpanhrbGRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjU2OTUzMiwiZXhwIjoyMDg4MTQ1NTMyfQ.9XDCfwU4HMXZOKJW2dGv1ZQtE-F5ejj155L8DDv_mcA');

async function inspectTable(table) {
    try {
        console.log('Inspecting ' + table + '...');
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.error('Error on ' + table + ': ' + error.message);
        } else if (data && data.length > 0) {
            console.log(table + ' columns: ' + JSON.stringify(Object.keys(data[0])));
        } else {
            console.log(table + ' is empty.');
        }
    } catch (e) {
        console.error('Failed to inspect ' + table + ': ' + e.message);
    }
}

async function start() {
    await inspectTable('checklist_templates');
    await inspectTable('checklist_template_items');
    await inspectTable('checklist_template_sections');
    await inspectTable('service_template_rules');
    await inspectTable('inspection_checklists');
    await inspectTable('checklist_items');
}

start();
