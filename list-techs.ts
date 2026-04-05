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
    // 1. Get profiles
    const { data: profiles, error: pError } = await supabaseAdmin.from('profiles').select('*').eq('role', 'TECH');
    if (pError) {
        console.error('Error fetching profiles', pError);
        return;
    }
    
    // 2. Map emails from auth to show which is which
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) {
        console.error('Error fetching auth users', authError);
        return;
    }

    const techProfiles = profiles.map(p => {
        const authUser = authData.users.find(u => u.id === p.user_id);
        return {
            ...p,
            email: authUser?.email
        };
    });

    console.log("ALL TECH PROFILES:");
    console.log(JSON.stringify(techProfiles, null, 2));
}

run();
