import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
    const { data, error } = await supabase.from('profiles').select('*').eq('role', 'TECH');
    if (error) console.error(error);
    console.log(JSON.stringify(data, null, 2));
}

run();
