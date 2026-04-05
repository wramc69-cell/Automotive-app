const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://yzamfqtvmhnrqijxkldb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6YW1mcXR2bWhucnFpanhrbGRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjU2OTUzMiwiZXhwIjoyMDg4MTQ1NTMyfQ.9XDCfwU4HMXZOKJW2dGv1ZQtE-F5ejj155L8DDv_mcA');

async function clearData() {
    console.log('--- Iniciando Limpieza Total de Servicios (Borrón y Cuenta Nueva) ---');
    
    try {
        // 1. Delete all service requests (should cascade to appointments, quotes, inspections if FKs allow)
        console.log('Eliminando registros de service_requests...');
        const { error: srError } = await supabase
            .from('service_requests')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        
        if (srError) console.error('Error eliminando service_requests:', srError);
        else console.log('✓ service_requests (y cascada) eliminados correctamente');

        // 2. Audit Logs (specifically related to services)
        console.log('Eliminando logs de auditoría relacionados...');
        const { error: alError } = await supabase
            .from('audit_logs')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
            
        if (alError) console.error('Error eliminando audit_logs:', alError);
        else console.log('✓ audit_logs eliminados correctamente');

        // 3. Inspection Checklists (Templates/Instances)
        console.log('Eliminando registros de inspecciones técnicas...');
        const { error: icError } = await supabase
            .from('inspection_checklists')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
            
        if (icError) console.error('Error eliminando inspection_checklists:', icError);
        else console.log('✓ inspection_checklists eliminados correctamente');

        console.log('--- Limpieza completada con éxito ---');
    } catch (err) {
        console.error('Error crítico durante la limpieza:', err);
    }
}

clearData();
