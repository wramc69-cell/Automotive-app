# Arquitectura del Sistema - Denver Mobile Auto Care

## Resumen Ejecutivo
Denver Mobile Auto Care es un sistema de gestión para un taller mecánico móvil (MVP). Permite a los clientes solicitar servicios, a los administradores gestionar la logística y a los técnicos realizar inspecciones y diagnósticos en el sitio.

## Stack Tecnológico
- **Frontend**: React 19 + TypeScript + Vite.
- **Estilos**: TailwindCSS v3 para un diseño responsivo y moderno.
- **Iconografía**: Lucide React.
- **Backend / Database**: Supabase (PostgreSQL).
- **Autenticación**: Supabase Auth con perfiles vinculados.
- **Seguridad**: Row Level Security (RLS) para aislamiento de datos por rol.
- **Notificaciones**: Integración con Resend para envío de correos electrónicos.

## Estructura de Directorios (src)
```text
/src
  /assets        # Recursos estáticos (imágenes, logos)
  /components    # Componentes UI reutilizables
  /contexts      # Contextos de React (Auth, etc.)
  /layouts       # Envoltorios de página (GlobalLayout)
  /lib           # Clientes de API (Supabase, Resend)
  /pages         # Páginas organizadas por rol
    /admin       # Dashboard y gestión administrativa
    /tech        # Interfaz operativa para técnicos
    /customer    # Interfaz para clientes finales
    /auth        # Login, registro y recuperación
    /public      # Landing page y vistas públicas
  App.tsx        # Enrutamiento principal
  main.tsx       # Punto de entrada de la aplicación
```

## Patrones de Diseño
- **Layouts**: Uso de `GlobalLayout` para gestionar barras laterales y navegación por rol.
- **Permissions**: Control de acceso basado en el campo `role` de la tabla `profiles`.
- **Integraciones**: Supabase Admin para acciones de bypass de RLS (cuando es necesario) y Resend para notificaciones asíncronas.
