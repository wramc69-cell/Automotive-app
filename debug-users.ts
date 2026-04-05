import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envConfig = fs.readFileSync(envPath, 'utf8');
envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
});

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
    console.log("--- PROFILES Table ---");
    const { data: profiles } = await supabaseAdmin.from('profiles').select('*');
    if (profiles) {
        profiles.forEach(p => console.log(`Profile: ${p.first_name} ${p.last_name} | Role: ${p.role} | Status: ${p.status} | ID: ${p.user_id}`));
    }

    console.log("\n--- AUTH.USERS ---");
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
    if (authData?.users) {
        authData.users.forEach(u => console.log(`User: ${u.email} | ID: ${u.id}`));
    }
}
run();
