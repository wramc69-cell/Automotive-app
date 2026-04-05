# Denver Mobile Auto Care - MVP

Sistema de gestión para taller mecánico móvil.

## Requisitos
- Node.js (v18+)
- Supabase Account

## Instalación

1.  **Clonar y Dependencias:**
    ```bash
    npm install
    ```

2.  **Configurar Variables de Entorno:**
    Crea un archivo `.env` en la raíz con lo siguiente:
    ```env
    VITE_SUPABASE_URL=tu_url_de_supabase
    VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
    ```

3.  **Configurar Base de Datos:**
    - Ve a tu panel de Supabase SQL Editor.
    - Copia y pega el contenido de `supabase_schema.sql` y ejecútalo.
    - Opcional: Ejecuta scripts de migración adicionales si los hay.

4.  **Correr Aplicación:**
    ```bash
    npm run dev
    ```

## Usuarios Demo (Cuentas de Prueba)

### Cómo crear un usuario con rol específico:
Debido a que Supabase Auth es independiente de las tablas, para crear un ADMIN o TECH debes:
1.  Registrarte normalmente en la aplicación (serás 'CUSTOMER' por defecto).
2.  En el dashboard de Supabase (Tabla `profiles`), cambia manualmente el campo `role` del usuario creado a `TECH` o `ADMIN`.

**Recomendación para Demo:**
- **Customer:** Registra un usuario real (ej. `cliente@test.com`).
- **Tech:** Registra `tech@test.com` y cámbiale el rol a `TECH`.
- **Admin:** Registra `admin@test.com` y cámbiale el rol a `ADMIN`.

## Flujo del MVP
1.  **Cliente:** Crea una solicitud (Chatbot o Catálogo), agenda cita.
2.  **Admin:** Asigna técnico a la cita.
3.  **Técnico:** Inicia inspección, registra hallazgos, genera diagnóstico y envía cotización.
4.  **Cliente:** Revisa diagnóstico, firma autorización digitalmente.
5.  **Notificaciones:** Revisa el outbox en `/admin/notifications` para ver los mensajes encolados.

## Seguridad (Hardening)
- **RLS (Row Level Security):** Activado en todas las tablas. Los clientes solo ven sus propios datos.
- **Auditoría:** Los cambios de estatus críticos se registran automáticamente en la tabla `audit_logs`.
- **Validaciones:** Firmas digitales con IP/User-Agent tracker (simulado).
