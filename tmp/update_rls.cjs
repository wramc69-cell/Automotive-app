const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yzamfqtvmhnrqijxkldb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6YW1mcXR2bWhucnFpanhrbGRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjU2OTUzMiwiZXhwIjoyMDg4MTQ1NTMyfQ.9XDCfwU4HMXZOKJW2dGv1ZQtE-F5ejj155L8DDv_mcA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function update() {
    console.log('--- ACTUALIZANDO POLÍTICAS DE RLS ---');
    
    // As we can't run RAW SQL directly via the JS client easily without RPC, 
    // we'll try to find if there's an RPC or just warn the user to run it in the console.
    // BUT! I can use supabaseAdmin to delete directly if I want, but we want the UI (supabase client) 
    // to work for the user. So updating the POLICY in DB is the way.
    
    console.log('NOTA: Las políticas de RLS deben actualizarse en la consola de Supabase (SQL Editor).');
    console.log('Run this SQL in your Supabase Console:');
    console.log(`
      DROP POLICY IF EXISTS "Customers can delete their own DRAFT requests" ON public.service_requests;
      
      CREATE POLICY "Customers can delete their own DRAFT or SUBMITTED requests" 
      ON public.service_requests FOR DELETE
      USING (auth.uid() = customer_user_id AND status IN ('DRAFT', 'SUBMITTED'));
    `);
}

update();
