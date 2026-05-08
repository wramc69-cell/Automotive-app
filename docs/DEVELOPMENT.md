# Guía de Desarrollo y Configuración

## Requisitos Previos
- Node.js v18 o superior.
- Una instancia de Supabase (URL y Anon Key).
- API Key de Resend (para correos electrónicos).

## Configuración Local
1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Configurar variables de entorno (`.env`):
   ```env
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   VITE_RESEND_API_KEY=...
   ```
3. Levantar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Base de Datos
Cada cambio en el esquema debe reflejarse en `supabase_schema.sql`. Para aplicar cambios manualmente:
- Copiar el contenido de `supabase_schema.sql` en el SQL Editor de Supabase.

## Roles de Usuario para Pruebas
Para cambiar el rol de un usuario recién registrado:
1. Ve a la tabla `profiles` en Supabase.
2. Localiza el `user_id`.
3. Cambia el campo `role` a `TECH` o `ADMIN`.
4. El cambio se reflejará tras un refresco de sesión en el frontend.

## Scripts de Utilidad
- `analyze.js`: Script para análisis de código (opcional).
- `check_profiles_admin.cjs`: Validación de permisos administrativos.
- `delete-techs.ts`: Script de limpieza para técnicos (usar con precaución).

## Mejores Prácticas
- **Tipado**: Mantener TypeScript estricto siempre que sea posible.
- **Componentes**: Usar componentes de Radix UI o Tailwind headless para accesibilidad.
- **RLS**: Siempre probar nuevas tablas con las políticas de seguridad activadas.
