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
    console.log("Fetching REJECTED profiles...");
    const { data: rejected } = await supabaseAdmin.from('profiles').select('*').eq('status', 'REJECTED');
    if (!rejected || rejected.length === 0) {
        console.log("No rejected profiles found.");
        return;
    }
    
    for (const p of rejected) {
        console.log(`Deleting REJECTED user ${p.first_name} ${p.last_name} (ID: ${p.user_id})...`);
        const { error: rpcErr } = await supabaseAdmin.rpc('admin_delete_user', { target_user_id: p.user_id });
        if (rpcErr) {
            console.error("RPC Error:", rpcErr);
            // Fallback to manual
            await supabaseAdmin.from('notifications_outbox').delete().eq('recipient_user_id', p.user_id);
            await supabaseAdmin.from('profiles').delete().eq('user_id', p.user_id);
            await supabaseAdmin.auth.admin.deleteUser(p.user_id);
        } else {
            console.log("Successfully deleted via RPC.");
        }
    }
    console.log("Finished.");
}
run();
