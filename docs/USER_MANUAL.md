# Manual de Usuario - Denver Mobile Auto Care

Esta guía describe cómo utilizar las diferentes funcionalidades de la plataforma según el rol asignado.

## 1. Acceso a la Plataforma
- **Registro**: Los nuevos usuarios se registran como `CUSTOMER` por defecto.
- **Login**: Acceso mediante correo electrónico y contraseña gestionado por Supabase Auth.
- **Cambio de Rol**: Solo un administrador puede elevar un perfil a `TECH` o `ADMIN` a través del panel de control o directamente en la base de datos.

---

## 2. Guía para Clientes (Customers)
El portal del cliente está diseñado para ser simple y autogestionable.

### Gestión de Vehículos
- Accede a **"Mis Vehículos"** para registrar tus autos (Año, Marca, Modelo).
- Puedes añadir notas sobre el estado general o historial previo.

### Solicitar un Servicio
- **Chatbot Inteligente**: Interactúa con el asistente para describir fallas. El sistema extraerá síntomas automáticamente.
- **Catálogo**: Selecciona directamente servicios comunes como "Cambio de Aceite" o "Revisión de Frenos".

### Agendamiento y Aprobación
- Una vez creada la solicitud, selecciona la fecha, hora y dirección del servicio.
- Recibirás notificaciones cuando el técnico esté en camino.
- Cuando la cotización esté lista, revísala en **"Mis Servicios"** y fírmala digitalmente para autorizar el trabajo.

---

## 3. Guía para Técnicos (Techs)
La herramienta operativa para el trabajo en campo.

### Dashboard de Trabajo
- Visualiza tus citas del día y la ubicación de cada servicio.
- Cambia el estado de la cita (`En Camino`, `Llegué`, `Iniciado`) para mantener al cliente informado.

### Inspección y Resultados
- Selecciona la **Plantilla de Inspección** adecuada.
- Registra hallazgos, niveles de fluidos y recomendaciones preventivas.

### Generación de Cotización
- Añade conceptos de mano de obra y refacciones (partes).
- El sistema calculará automáticamente impuestos y el total.
- Haz clic en **"Enviar para Aprobación"** para que el cliente la reciba.

---

## 4. Guía para Administradores (Admins)
Control total sobre la operación y configuración.

### Gestión de Solicitudes
- Revisa el buzón de entrada de nuevas solicitudes.
- Asigna técnicos a citas pendientes según disponibilidad y zona geográfica.

### Configuración del Sistema
- **Catálogo de Servicios**: Define precios base y códigos de servicio.
- **Plantillas de Inspección**: Crea y edita los ítems que los técnicos deben revisar (Motor, Frenos, Luces, etc.).
- **Reglas de Negocio**: Configura costos de visita y cargos por distancia en la sección de Configuración Global.

### Auditoría y Notificaciones
- Monitorea los registros de auditoría para ver cambios de estatus críticos.
- Revisa la cola de notificaciones para asegurar que los mensajes lleguen correctamente a los clientes.
