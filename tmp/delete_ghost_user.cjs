const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yzamfqtvmhnrqijxkldb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6YW1mcXR2bWhucnFpanhrbGRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjU2OTUzMiwiZXhwIjoyMDg4MTQ1NTMyfQ.9XDCfwU4HMXZOKJW2dGv1ZQtE-F5ejj155L8DDv_mcA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanUser() {
    const email = 'cramon@facex.com';
    console.log(`Buscando usuario: ${email}...`);

    // 1. Find user in Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) return console.error('Error listando usuarios:', listError);

    const targetUser = users.find(u => u.email === email);

    if (targetUser) {
        console.log(`Usuario encontrado con ID: ${targetUser.id}. Procediendo a eliminar...`);
        
        // Delete from Auth (this usually cascades to profiles if foreign keys are set, but we'll be sure)
        const { error: delError } = await supabase.auth.admin.deleteUser(targetUser.id);
        
        if (delError) {
            console.error('Error al borrar de Auth:', delError);
        } else {
            console.log('¡ÉXITO! El usuario ha sido eliminado completamente de Autenticación.');
        }
    } else {
        console.log('El usuario no existe en la tabla de Autenticación.');
    }
}

cleanUser();
