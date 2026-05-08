# Centro de Documentación - Denver Mobile Auto Care

Bienvenido a la documentación oficial del proyecto. Aquí encontrarás todo lo necesario para entender la arquitectura, el modelo de datos y los flujos operativos del sistema.

## Índice de Documentación

### 1. [Manual de Usuario](docs/USER_MANUAL.md)
Guía práctica para Clientes, Técnicos y Administradores sobre cómo operar las funciones principales de la aplicación.

### 2. [Arquitectura del Sistema](docs/ARCHITECTURE.md)
Resumen detallado de las tecnologías utilizadas, estructura de carpetas `src/`, patrones de diseño y stack tecnológico.

### 3. [Base de Datos](docs/DATABASE.md)
Especificación del esquema de PostgreSQL, tipos enumerados y relaciones entre tablas principales.

### 4. [Seguridad y RLS](docs/SECURITY_RLS.md)
Detalles profundos sobre las políticas de **Row Level Security**, aislamiento por rol y funciones de seguridad en DB.

### 5. [Flujos de Trabajo (MVP)](docs/WORKFLOWS.md)
Guía paso a paso sobre el ciclo de vida de un servicio: solicitud, triaje, inspección y aprobación.

### 6. [Sistema de Notificaciones](docs/NOTIFICATIONS.md)
Detalles sobre la integración con **Resend**, los canales de comunicación soportados y las plantillas de mensajes.

### 7. [Guía de Desarrollo](docs/DEVELOPMENT.md)
Instrucciones para la configuración del entorno local, variables de entorno y ejecución de la app.

### 8. [Herramientas Administrativas](docs/ADMIN_TOOLS.md)
Guía sobre los scripts de utilidad en el servidor para el mantenimiento, depuración y limpieza de datos.

---

## Recursos Rápidos
- **Esquema SQL**: [`supabase_schema.sql`](./supabase_schema.sql)
- **Dashboard Admin**: `/admin/dashboard`
- **Dashboard Tech**: `/tech/dashboard`
- **Dashboard Cliente**: `/customer/dashboard`

---
*Documentación generada automáticamente - Abril 2026*
