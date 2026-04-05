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

const targets = ['wcasti69@hotmail.com', 'wramc69@icloud.com'];

async function run() {
    console.log("Fetching users...");
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
    
    for (const u of authData.users) {
        if (targets.includes(u.email || '')) {
            console.log(`Deleting ${u.email} (ID: ${u.id})...`);
            
            // 1. Delete notifications
            await supabaseAdmin.from('notifications_outbox').delete().eq('recipient_user_id', u.id);
            // 2. Delete profile
            await supabaseAdmin.from('profiles').delete().eq('user_id', u.id);
            // 3. Delete auth
            const { error } = await supabaseAdmin.auth.admin.deleteUser(u.id);
            
            if (error) console.error("Error formatting auth user:", error);
            else console.log(`Deleted ${u.email} successfully.`);
        }
    }
    console.log("Finished.");
}
run();
