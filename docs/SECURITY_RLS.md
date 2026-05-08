# Seguridad y Políticas RLS (Row Level Security)

El sistema utiliza el motor de políticas de Supabase para garantizar que los datos estén aislados y protegidos según el rol del usuario autenticado.

## Resumen de Roles
El acceso se determina por la función `get_auth_role()`, que consulta el campo `role` en la tabla `public.profiles`. Los roles disponibles son:
1. `CUSTOMER`: Usuario final que solicita servicios.
2. `TECH`: Técnico cualificado que realiza los servicios.
3. `ADMIN`: Operador del sistema con control total.

## Políticas por Tabla (Selección Crítica)

### 1. Perfiles (`profiles`)
- **Visualización**: Un usuario solo puede ver su propio perfil. Los administradores pueden ver todos.
- **Inserción**: Solo permitida para el propio `user_id` del usuario autenticado durante el registro.

### 2. Solicitudes de Servicio (`service_requests`)
- **Clientes**: Pueden crear solicitudes y ver solo las suyas. Pueden editarlas solo si están en estatus `DRAFT`.
- **Técnicos**: Solo pueden ver solicitudes que tengan una cita asignada a su `user_id`. Esto evita que un técnico vea la base de datos completa de clientes.
- **Administradores**: Control total para gestionar el triaje y la asignación.

### 3. Citas (`appointments`)
- **Clientes**: Solo ven citas vinculadas a sus propios servicios.
- **Técnicos**: Solo ven y pueden actualizar citas asignadas a ellos directamente.
- **RLS Query Example**: `USING (assigned_tech_user_id = auth.uid())`

### 4. Inspecciones y Cotizaciones (`inspections`, `quotes`)
- **Técnicos**: Son los creadores (dueños) de estos registros.
- **Clientes**: Solo tienen permiso de lectura una vez que la solicitud les pertenece. No pueden modificar ítems de cotización, solo aprobar o rechazar a través de la tabla `quote_approvals`.

## Consideraciones de Seguridad
- **Service Role Key**: Los scripts administrativos en la raíz del proyecto utilizan la llave de servicio de Supabase (`SERVICE_ROLE_KEY`), la cual **salta todas las políticas RLS**. Esta llave debe mantenerse estrictamente privada en el archivo `.env`.
- **Funciones de Seguridad Definer**: Algunas funciones de base de datos están marcadas como `SECURITY DEFINER` para permitir que usuarios con privilegios limitados realicen acciones controladas que de otro modo estarían bloqueadas (ej. creación automática de perfil tras registro).

## Cómo Probar las Políticas
Para validar que el RLS funciona correctamente:
1. Inicia sesión como un usuario `CUSTOMER`.
2. Intenta acceder vía consola o API a una solicitud de otro usuario (`service_request_id` ajeno).
3. El sistema debe devolver un arreglo vacío o un error de permiso, incluso si el ID es válido.
