import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            process.env[match[1].trim()] = match[2].trim();
        }
    });
}

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) return;

    // Emails to delete
    const targets = ['wramc69@icloud.com', 'tecnico2@icloud.com'];

    for (const u of authData.users) {
        if (targets.includes(u.email || '')) {
            console.log(`Deleting ${u.email} (ID: ${u.id})`);
            await supabaseAdmin.auth.admin.deleteUser(u.id);
        }
    }
    console.log("Done");
}

run();
