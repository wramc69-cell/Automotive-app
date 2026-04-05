const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://yzamfqtvmhnrqijxkldb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6YW1mcXR2bWhucnFpanhrbGRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjU2OTUzMiwiZXhwIjoyMDg4MTQ1NTMyfQ.9XDCfwU4HMXZOKJW2dGv1ZQtE-F5ejj155L8DDv_mcA');

async function check() {
    let output = '';
    const tables = ['checklist_templates', 'checklist_template_items', 'checklist_template_sections', 'service_template_rules', 'inspection_checklists', 'checklist_items'];
    for (const table of tables) {
        output += '\n --- ' + table + ' --- \n';
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            output += 'Error: ' + error.message + '\n';
        } else if (data && data.length > 0) {
            output += 'Columns: ' + JSON.stringify(Object.keys(data[0])) + '\n';
        } else {
            output += 'Table is empty or not found.\n';
        }
    }
    fs.writeFileSync('tmp/db_inspection_result.txt', output);
}
check();
