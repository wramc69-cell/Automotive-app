# Herramientas de Administración y Scripts de Utilidad

El proyecto incluye una serie de scripts de terminal diseñados para gestionar la base de datos y los usuarios fuera de la interfaz web, especialmente útiles para depuración y mantenimiento.

## Configuración de Ejecución
La mayoría de estos scripts requieren la variable `VITE_SUPABASE_SERVICE_ROLE_KEY` en el archivo `.env` para tener permisos de superusuario (bypassing RLS).

Para ejecutarlos, se recomienda usar `tsx` o `node`:
```bash
npx tsx script-name.ts
```

## Listado de Scripts Principales

### 1. Gestión de Usuarios
- **`list-techs.ts`**: Lista todos los perfiles con rol `TECH`, cruzando la información con la tabla de autenticación para mostrar sus correos electrónicos.
- **`debug-users.ts`**: Muestra una comparativa rápida entre la tabla `profiles` y `auth.users`, permitiendo identificar inconsistencias o IDs huérfanos.
- **`delete-techs.ts`**: Permite eliminar perfiles de técnicos de forma masiva (usar con precaución).

### 2. Mantenimiento de Datos
- **`clean-rejected.ts`**: Limpia solicitudes o registros marcados como rechazados para mantener la base de datos ligera.
- **`strict-delete.ts`**: Realiza una eliminación forzada de tablas o registros específicos garantizando que no se violen restricciones de llaves foráneas.
- **`clear_all_services.cjs`**: (Ubicado en `/tmp/`) Limpia el catálogo de servicios para reinicio de datos maestros.

### 3. Diagnóstico de Salud
- **`check_profiles.cjs`**: Verifica la integridad de los metadatos de los perfiles.
- **`check_columns.cjs`**: Inspecciona el esquema de las tablas para asegurar que todas las columnas requeridas por el frontend existen.
- **`check_notifications.cjs`**: Revisa el estado de la cola de notificaciones y posibles errores en los envios simulados/reales.

## Scripts de Auditoría (check_*.cjs)
Estos scripts suelen ser archivos CommonJS (.cjs) diseñados para ejecutarse rápidamente con `node`. Ayudan a validar que el entorno de Supabase esté correctamente configurado tras una migración de esquema.

---
**Nota**: Nunca expongas la `SERVICE_ROLE_KEY` en el repositorio público. Asegúrate de que `.env` esté siempre en `.gitignore`.
