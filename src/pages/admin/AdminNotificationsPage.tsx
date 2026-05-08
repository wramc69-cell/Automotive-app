import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
    Mail, Send, AlertTriangle, CheckCircle2,
    RefreshCcw, PlayCircle, Clock,
    Smartphone, MessageCircle, Send as TelegramIcon,
    Terminal, Activity, Zap, ShieldCheck, Cpu,
    ChevronRight, ExternalLink, Trash2, Globe
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import {
    EmailAdapter, SmsAdapter, WhatsAppAdapter,
    TelegramAdapter, getTemplates
} from '../../lib/notifications';
import { useToast } from '../../components/ui/Toast';

export function AdminNotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const { toast } = useToast();

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
        let successCount = 0;
        let failCount = 0;

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

                await supabase
                    .from('notifications_outbox')
                    .update({
                        status: 'SENT',
                        sent_at: new Date().toISOString(),
                        provider_response: result
                    })
                    .eq('id', item.id);
                successCount++;
            } catch (err: any) {
                console.error(`[Queue Worker] Error processing ${item.id}:`, err);
                await supabase
                    .from('notifications_outbox')
                    .update({
                        status: 'FAILED',
                        error_log: err.message
                    })
                    .eq('id', item.id);
                failCount++;
            }
        }

        await loadNotifications();
        setProcessing(false);
        toast({ 
            title: 'Cola Procesada', 
            description: `Enviados: ${successCount}, Fallidos: ${failCount}`,
            type: successCount > 0 ? 'success' : 'error'
        });
    }

    const getChannelIcon = (channel: string) => {
        switch (channel) {
            case 'EMAIL': return <Mail size={32} />;
            case 'SMS': return <Smartphone size={32} />;
            case 'WHATSAPP': return <MessageCircle size={32} />;
            case 'TELEGRAM': return <TelegramIcon size={32} />;
            default: return <Mail size={32} />;
        }
    };

    const stats = {
        pending: notifications.filter(n => n.status === 'PENDING').length,
        sent: notifications.filter(n => n.status === 'SENT').length,
        failed: notifications.filter(n => n.status === 'FAILED').length,
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 px-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-100 rounded-3xl animate-pulse"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Terminal className="w-6 h-6 text-primary animate-bounce" />
                    </div>
                </div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Iniciando Telemetría de Comm...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1700px] mx-auto space-y-12 pb-24 animate-in fade-in duration-700 px-4 mt-8">
            {/* Header: Digital Gateway Terminal */}
            <header className="relative p-12 md:p-20 bg-slate-950 rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-b-8 border-primary/20">
                <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-primary/10 via-primary/5 to-transparent"></div>
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/10 blur-[150px] rounded-full"></div>
                
                <div className="relative z-10 flex flex-col xl:flex-row justify-between items-end gap-12">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-12 w-full xl:w-auto">
                        <div className="w-32 h-32 bg-white/5 rounded-[2.5rem] flex items-center justify-center border-4 border-white/10 shadow-3xl backdrop-blur-2xl group shrink-0">
                            <Send className="w-16 h-16 text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-700" />
                        </div>
                        <div className="text-center md:text-left space-y-8">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
                                <h1 className="text-6xl md:text-9xl font-black italic tracking-tighter text-white uppercase leading-[0.8] pt-2">Gateway Outbox</h1>
                                <Badge className="bg-primary text-white text-[12px] font-black border-none px-8 py-3 rounded-xl shadow-[0_20px_50px_rgba(255,46,91,0.4)] tracking-[0.4em]">LIVE_COMMS_ENGINE</Badge>
                            </div>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 bg-white/5 backdrop-blur-md px-10 py-5 rounded-[2.5rem] border border-white/10 w-fit">
                                <div className="flex items-center gap-4">
                                    <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
                                    <span className="text-white font-black text-[11px] tracking-widest">{stats.pending} PENDING_BURST</span>
                                </div>
                                <div className="w-[2px] h-6 bg-white/10"></div>
                                <div className="flex items-center gap-4">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                                    <span className="text-white font-black text-[11px] tracking-widest">{stats.sent} SUCCESS_BURST</span>
                                </div>
                                <div className="w-[2px] h-6 bg-white/10"></div>
                                <div className="flex items-center gap-4">
                                    <div className="w-3 h-3 rounded-full bg-rose-500 animate-bounce shadow-[0_0_15px_rgba(244,63,94,0.5)]"></div>
                                    <span className="text-white font-black text-[11px] tracking-widest">{stats.failed} REJECTED_BURST</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-6 items-center">
                        <Button 
                            onClick={loadNotifications} 
                            variant="ghost"
                            className="h-20 px-10 rounded-[1.8rem] bg-white/5 border-2 border-white/10 text-white font-black text-xs tracking-[0.3em] hover:bg-white/10 hover:scale-105 transition-all active:scale-95"
                        >
                            <RefreshCcw size={22} className={`mr-4 ${loading ? 'animate-spin' : ''}`} /> RELOAD_FEED
                        </Button>
                        <Button 
                            onClick={processQueue} 
                            disabled={processing || stats.pending === 0}
                            className="h-24 px-16 rounded-[2.5rem] bg-primary text-white font-black italic text-xl tracking-tighter hover:bg-white hover:text-slate-950 transition-all shadow-[0_30px_60px_-15px_rgba(255,46,91,0.5)] group relative overflow-hidden active:scale-95"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                            {processing ? (
                                <><Clock size={28} className="mr-6 animate-spin" /> DISPATCHING...</>
                            ) : (
                                <><Zap size={28} className="mr-6 group-hover:scale-125 transition-transform" /> ACTIVATE_COIL ({stats.pending})</>
                            )}
                        </Button>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-12 space-y-10">
                    <div className="flex items-center justify-between px-8">
                        <div className="flex items-center gap-8">
                            <div className="w-4 h-16 bg-primary rounded-full shadow-[0_0_20px_rgba(255,46,91,0.5)]"></div>
                            <div>
                                <h2 className="text-4xl font-black italic tracking-tighter text-slate-950 uppercase leading-none pt-2">Operational Comm Log</h2>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] mt-2 italic">SISTEMA_DE_TRAFICO_DE_DATOS_EN_TIEMPO_REAL</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {notifications.map(item => (
                            <Card key={item.id} className="group relative overflow-hidden bg-white border-none rounded-[2.5rem] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.08)] hover:shadow-2xl transition-all duration-700 border-8 border-transparent hover:border-slate-50">
                                <CardContent className="p-12">
                                    <div className="flex flex-col lg:flex-row items-center gap-12">
                                        {/* Status Bio Industrial */}
                                        <div className="flex items-center gap-8 w-full lg:w-[30%] min-w-[350px]">
                                            <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-3xl border-4 transition-all duration-700 group-hover:rotate-12 ${
                                                item.status === 'SENT' ? 'bg-emerald-50 text-emerald-500 border-emerald-100 ring-8 ring-emerald-50/50' :
                                                item.status === 'FAILED' ? 'bg-rose-50 text-rose-500 border-rose-100 ring-8 ring-rose-50/50 animate-pulse' :
                                                'bg-amber-50 text-amber-500 border-amber-100 ring-8 ring-amber-50/50 animate-pulse'
                                            }`}>
                                                {getChannelIcon(item.channel)}
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="font-black text-slate-950 text-2xl leading-none uppercase italic tracking-tighter truncate max-w-[250px] group-hover:text-primary transition-colors">{item.recipient}</h4>
                                                <div className="flex flex-col gap-2">
                                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                                        <Terminal size={14} className="text-primary" /> GATEWAY_{item.channel}
                                                    </p>
                                                    <Badge className="w-fit bg-slate-950 text-white text-[9px] font-black border-none px-4 py-1 rounded-full">{item.template_code}</Badge>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Payload Info Tactical */}
                                        <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-12 w-full border-x-4 border-slate-50 px-12">
                                            <div className="space-y-3">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">STATUS_INDICATOR</p>
                                                <div className="flex items-center gap-4 bg-slate-50 w-fit px-5 py-3 rounded-2xl border-2 border-slate-100 shadow-inner">
                                                    <div className={`w-3 h-3 rounded-full ${
                                                        item.status === 'SENT' ? 'bg-emerald-500' :
                                                        item.status === 'FAILED' ? 'bg-rose-500' : 'bg-amber-500'
                                                    }`} />
                                                    <span className={`text-[12px] font-black uppercase italic tracking-tighter ${
                                                        item.status === 'SENT' ? 'text-emerald-600' :
                                                        item.status === 'FAILED' ? 'text-rose-600' : 'text-amber-600'
                                                    }`}>{item.status}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">BURST_TIMESTAMP</p>
                                                <div className="text-[13px] font-black text-slate-950 uppercase tracking-tighter bg-slate-50 w-fit px-5 py-3 rounded-2xl border-2 border-slate-100 shadow-inner">
                                                    {new Date(item.created_at).toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="hidden lg:block space-y-3">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">GATEWAY_METADATA</p>
                                                <div className="flex items-center gap-3">
                                                    <Badge className="bg-slate-200 text-slate-500 text-[9px] font-black border-none py-1.5 px-4 rounded-lg">ID: {item.id.slice(0, 8)}</Badge>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Activity Actions */}
                                        <div className="flex items-center justify-end gap-6 w-full lg:w-auto shrink-0">
                                            {item.error_log && (
                                                <Badge className="bg-rose-600 text-white text-[10px] font-black border-none px-6 py-3 rounded-xl shadow-xl animate-pulse">REACTION_FAILED</Badge>
                                            )}
                                            <Button variant="ghost" className="h-20 w-20 rounded-[1.8rem] bg-slate-950 text-white hover:bg-primary transition-all shadow-3xl flex items-center justify-center hover:scale-110 active:scale-95 group/debug">
                                                <ExternalLink size={28} className="group-hover/debug:rotate-12 transition-transform" />
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    {/* Error Console Terminal Style */}
                                    {item.status === 'FAILED' && (
                                        <div className="mt-12 p-10 bg-slate-950 rounded-[2.5rem] border-l-8 border-rose-500 relative overflow-hidden shadow-3xl">
                                            <div className="absolute top-0 right-0 w-64 h-full bg-rose-500/10 blur-[80px]"></div>
                                            <div className="flex items-start gap-8 text-rose-400 relative z-10 font-mono text-[13px] leading-relaxed">
                                                <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 shrink-0 border-2 border-rose-500/20">
                                                    <AlertTriangle size={32} />
                                                </div>
                                                <div>
                                                    <p className="font-black mb-3 uppercase tracking-[0.5em] text-rose-500 underline decoration-rose-500/30 decoration-4 underline-offset-8">[CRITICAL_SYNC_FAILURE]</p>
                                                    <p className="opacity-90 font-bold bg-white/5 p-4 rounded-xl border border-white/5">{item.error_log || 'Unknown external provider rejection'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Progress Radial Glow Indicator */}
                                    <div className="absolute bottom-0 left-0 w-full h-2 bg-slate-50">
                                        <div className={`h-full transition-all duration-1000 ease-out shadow-[0_0_20px] ${
                                            item.status === 'SENT' ? 'bg-emerald-500 w-full shadow-emerald-500/50' : 
                                            item.status === 'FAILED' ? 'bg-rose-500 w-full shadow-rose-500/50' : 
                                            'bg-amber-500 w-[66%] shadow-amber-500/50 animate-pulse'
                                        }`}></div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {notifications.length === 0 && (
                            <div className="py-52 text-center bg-slate-50 rounded-[2.5rem] border-8 border-dashed border-slate-100 flex flex-col items-center gap-10">
                                <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center text-slate-100 shadow-3xl border-4 border-slate-50 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-primary/5 animate-pulse"></div>
                                    <Mail size={64} className="relative z-10 text-slate-200" />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-4xl font-black italic uppercase tracking-tighter text-slate-300 leading-none">Gateway Idle</h3>
                                    <p className="text-[14px] font-black text-slate-400 uppercase tracking-[0.5em] max-w-lg mx-auto leading-relaxed italic opacity-50 underline decoration-primary/20 decoration-8 underline-offset-[12px]">NO_PENDING_COMMUNICATIONS_DETECTED</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
