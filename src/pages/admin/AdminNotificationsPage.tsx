import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
    Mail, Send, AlertTriangle, CheckCircle,
    RefreshCcw, PlayCircle, Clock,
    Smartphone, MessageCircle, Send as TelegramIcon
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import {
    EmailAdapter, SmsAdapter, WhatsAppAdapter,
    TelegramAdapter, getTemplates
} from '../../lib/notifications';

export function AdminNotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadNotifications();
    }, []);

    async function loadNotifications() {
        setLoading(true);
        try {
            const { data, error } = await supabaseAdmin
                .from('notifications_outbox')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setNotifications(data || []);
        } catch (err) {
            console.error('Error loadNotifications:', err);
        } finally {
            setLoading(false);
        }
    }

    async function processQueue() {
        setProcessing(true);
        const pending = notifications.filter(n => n.status === 'PENDING');

        for (const item of pending) {
            try {
                const channel = item.channel || 'EMAIL';
                const templates: any = getTemplates(item.payload.data);
                const template = templates[item.template_code] || {
                    subject: 'Notificación Taller',
                    body: item.payload.body || 'Contenido predeterminado'
                };

                let result;
                const adapterPayload = {
                    to: item.recipient,
                    subject: template.subject,
                    body: template.body,
                    metadata: item.payload
                };

                // Simulate adapter logic
                switch (channel) {
                    case 'EMAIL': result = await EmailAdapter.send(adapterPayload); break;
                    case 'SMS': result = await SmsAdapter.send(adapterPayload); break;
                    case 'WHATSAPP': result = await WhatsAppAdapter.send(adapterPayload); break;
                    case 'TELEGRAM': result = await TelegramAdapter.send(adapterPayload); break;
                    default: result = await EmailAdapter.send(adapterPayload);
                }

                // Update status in DB
                await supabase
                    .from('notifications_outbox')
                    .update({
                        status: 'SENT',
                        sent_at: new Date().toISOString(),
                        provider_response: result
                    })
                    .eq('id', item.id);

                console.log(`[Queue Worker] Processed item ${item.id} successfully.`);
            } catch (err: any) {
                console.error(`[Queue Worker] Error processing ${item.id}:`, err);
                await supabase
                    .from('notifications_outbox')
                    .update({
                        status: 'FAILED',
                        error_log: err.message
                    })
                    .eq('id', item.id);
            }
        }

        await loadNotifications();
        setProcessing(false);
        alert(`Se procesaron ${pending.length} notificaciones.`);
    }

    const getChannelIcon = (channel: string) => {
        switch (channel) {
            case 'EMAIL': return <Mail size={14} className="text-blue-500" />;
            case 'SMS': return <Smartphone size={14} className="text-green-500" />;
            case 'WHATSAPP': return <MessageCircle size={14} className="text-green-600" />;
            case 'TELEGRAM': return <TelegramIcon size={14} className="text-sky-500" />;
            default: return <Mail size={14} />;
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-indigo-600 font-bold italic">Cargando bandeja de salida...</div>;

    return (
        <div className="space-y-6 pb-20 animate-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                        <Send className="text-indigo-600" /> Notifications Outbox
                    </h1>
                    <p className="text-slate-500 font-medium">Bandeja de salida de comunicaciones simuladas del sistema.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={loadNotifications} variant="outline" className="h-12 px-6 rounded-2xl border-indigo-200">
                        <RefreshCcw size={18} className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Sincronizar
                    </Button>
                    <Button
                        onClick={processQueue}
                        disabled={processing || !notifications.some(n => n.status === 'PENDING')}
                        className="h-12 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 font-bold"
                    >
                        {processing ? (
                            <><Clock size={18} className="mr-2 animate-spin" /> Procesando...</>
                        ) : (
                            <><PlayCircle size={18} className="mr-2" /> Procesar Cola ({notifications.filter(n => n.status === 'PENDING').length})</>
                        )}
                    </Button>
                </div>
            </div>

            <Card className="bg-white border-slate-200 shadow-xl shadow-slate-100 rounded-3xl overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 px-6 flex flex-row justify-between items-center">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Estado de Envío</CardTitle>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                            <span className="text-[10px] font-bold text-slate-500">PENDING</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                            <span className="text-[10px] font-bold text-slate-500">SENT</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">DESTINATARIO</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">CHANNEL</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">TEMPLATE</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">ESTADO</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">CREADO</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {notifications.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-bold text-slate-800 leading-none">{item.recipient}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">ID: {item.id.split('-')[0]}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded-lg w-fit border border-slate-100">
                                                {getChannelIcon(item.channel)}
                                                <span className="text-[10px] font-black text-slate-500">{item.channel}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-600">
                                            <Badge variant="outline" className="border-indigo-100 text-indigo-500 bg-indigo-50/30 font-black text-[9px] h-5 py-0">
                                                {item.template_code}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {item.status === 'SENT' ? (
                                                    <CheckCircle size={14} className="text-green-500" />
                                                ) : item.status === 'FAILED' ? (
                                                    <AlertTriangle size={14} className="text-red-500" />
                                                ) : (
                                                    <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-300 border-t-amber-600 animate-spin" />
                                                )}
                                                <span className={`text-[10px] font-bold ${item.status === 'SENT' ? 'text-green-600' :
                                                    item.status === 'FAILED' ? 'text-red-600' : 'text-amber-600'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-medium text-slate-400">
                                                {new Date(item.created_at).toLocaleString()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {notifications.length === 0 && (
                            <div className="p-20 text-center space-y-4">
                                <Mail size={48} className="mx-auto text-slate-100" />
                                <p className="text-slate-400 text-sm font-bold italic">No hay notificaciones en la cola.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
