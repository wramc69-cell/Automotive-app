import { Resend } from 'resend';

export interface NotificationPayload {
    to: string;
    subject?: string;
    body: string;
    metadata?: any;
}

export const EmailAdapter = {
    send: async (payload: NotificationPayload) => {
        const apiKey = import.meta.env.VITE_RESEND_API_KEY;
        
        if (apiKey) {
            try {
                const resend = new Resend(apiKey);
                const { data, error } = await resend.emails.send({
                    from: 'Taller Denver <onboarding@resend.dev>', // Change to verified domain later
                    to: payload.to,
                    subject: payload.subject || 'Notificación',
                    html: `<p>${payload.body}</p>`, // Basic HTML wrap
                });

                if (error) throw error;
                console.log(`[RESEND EMAIL] Success! To: ${payload.to}`);
                return { success: true, message_id: data?.id || `resend-${Date.now()}` };
            } catch (err: any) {
                console.error('[RESEND ERROR]', err);
                return { success: false, error: err.message };
            }
        }

        // Fallback Simulation
        console.warn(`[SIMULATED EMAIL] (No VITE_RESEND_API_KEY found) To: ${payload.to} | Subject: ${payload.subject}`);
        return { success: true, message_id: `sim-email-${Math.random().toString(36).substr(2, 9)}` };
    }
};

export const SmsAdapter = {
    send: async (payload: NotificationPayload) => {
        console.log(`[SIMULATED SMS] To: ${payload.to} | Body: ${payload.body}`);
        return { success: true, message_id: `sim-sms-${Math.random().toString(36).substr(2, 9)}` };
    }
};

export const WhatsAppAdapter = {
    send: async (payload: NotificationPayload) => {
        console.log(`[SIMULATED WHATSAPP] To: ${payload.to} | Body: ${payload.body}`);
        return { success: true, message_id: `sim-wa-${Math.random().toString(36).substr(2, 9)}` };
    }
};

export const TelegramAdapter = {
    send: async (payload: NotificationPayload) => {
        console.log(`[SIMULATED TELEGRAM] To: ${payload.to} | Body: ${payload.body}`);
        return { success: true, message_id: `sim-tg-${Math.random().toString(36).substr(2, 9)}` };
    }
};

export const getTemplates = (data: any) => ({
    APPOINTMENT_CONFIRMED: {
        subject: 'Cita Confirmada - Taller Denver',
        body: `Hola ${data.name}, tu cita para el ${data.date} ha sido confirmada.`
    },
    DIAGNOSIS_READY: {
        subject: 'Diagnóstico Listo - Vehículo ${data.vehicle}',
        body: `Hola ${data.name}, el diagnóstico para tu ${data.vehicle} ya está disponible en la app.`
    },
    QUOTE_SENT: {
        subject: 'Presupuesto Disponible - Taller Denver',
        body: `Hemos generado un presupuesto para tu servicio. Por favor revísalo y apruébalo para comenzar.`
    },
    QUOTE_APPROVED: {
        subject: 'Presupuesto Aprobado',
        body: `¡Gracias! Hemos recibido tu aprobación. El técnico comenzará a trabajar pronto.`
    },
    QUOTE_DECLINED: {
        subject: 'Presupuesto Rechazado',
        body: `Lamentamos que no desees continuar con el servicio. Háznoslo saber si podemos ayudarte en algo más.`
    },
    STAFF_INVITATION: {
        subject: 'Invitación a Denver Auto Care',
        body: `Hola ${data.name}, has sido invitado a unirte a Denver Auto Care como ${data.role}. Por favor regístrate aquí: ${data.link}`
    },
    ADMIN_TECH_REQUEST: {
        subject: 'NUEVO TÉCNICO REGISTRADO - Requiere Aprobación',
        body: `El técnico ${data.name} se ha registrado y espera aprobación del perfil. Puedes gestionarlo aquí: ${data.link}`
    }
});
