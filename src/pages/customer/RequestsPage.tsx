import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Calendar, Wrench, PlusCircle, Inbox, Hash, ArrowRight, Trash2, Clock, CheckCircle2, ChevronRight, Zap, FileText, Activity, ShieldCheck } from 'lucide-react';

const STATUS_LABEL: Record<string, string> = {
    DRAFT: 'BORRADOR',
    SUBMITTED: 'SOLICITADO',
    SCHEDULED: 'PROGRAMADO',
    DIAGNOSED: 'DIAGNOSTICADO',
    QUOTED: 'PENDIENTE PRECIO',
    APPROVED: 'APROBADO',
    COMPLETED: 'COMPLETADO',
    CANCELED: 'CANCELADO',
    DECLINED: 'RECHAZADO',
};

export function RequestsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) loadRequests();
    }, [user]);

    async function loadRequests() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('service_requests')
                .select('*, vehicles(make, model, year, license_plate), service_catalog(name)')
                .eq('customer_user_id', user!.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (err: any) {
            console.error(err);
            toast({ title: 'Falla de Sincronización', description: 'Fallo al sincronizar con la base denver.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteDraft(id: string) {
        if (!window.confirm('¿Efectuar comando de ELIMINACIÓN PERMANENTE?')) return;
        try {
            await supabase.from('service_requests').delete().eq('id', id);
            toast({ title: 'Expediente Eliminado', description: 'La solicitud ha sido eliminada permanentemente de la red.', type: 'success' });
            loadRequests();
        } catch (err: any) {
            toast({ title: 'Error de Comando', description: 'No se pudo eliminar el registro.', type: 'error' });
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-10 font-inter animate-in fade-in duration-1000">
                <div className="relative">
                    <div className="w-32 h-32 border-[12px] border-white/5 border-t-primary rounded-[3rem] animate-spin shadow-3xl shadow-primary/20"></div>
                    <Zap size={40} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" fill="currentColor" />
                </div>
                <div className="text-center space-y-3">
                    <p className="text-white font-black uppercase text-2xl tracking-[0.4em] italic leading-none">ACCEDIENDO_ARCHIVOS</p>
                    <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.8em] italic animate-pulse">PROTOCOLO DENVER_NET v3.0</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-12 duration-1000 px-4 md:px-8">
            
            {/* Header: Operative Registry Center (Enhanced Dark) */}
            <section className="relative group">
                <div className="absolute inset-0 bg-primary/20 blur-[180px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-1000 group-hover:bg-primary/30"></div>
                <div className="relative z-10 bg-white/5 backdrop-blur-3xl rounded-[3rem] p-10 md:p-16 overflow-hidden border border-white/10 shadow-3xl">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-bl-[20rem] pointer-events-none group-hover:scale-110 transition-transform duration-1000 blur-2xl"></div>
                    
                    <div className="flex flex-col xl:flex-row items-center justify-between gap-10">
                        <div className="space-y-8 text-center xl:text-left">
                            <div className="flex items-center justify-center xl:justify-start gap-6">
                                <div className="w-16 h-16 bg-white/5 backdrop-blur-3xl rounded-2xl flex items-center justify-center text-primary border border-white/10 shadow-3xl group-hover:rotate-12 group-hover:scale-110 transition-all duration-700">
                                    <FileText size={32} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-4 justify-center xl:justify-start">
                                        <div className="w-8 h-[2px] bg-primary rounded-full"></div>
                                        <span className="text-primary font-black text-[11px] uppercase tracking-[0.6em] italic block">REGISTRO DE OPERACIONES</span>
                                    </div>
                                    <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px] italic">
                                       CENTRAL_DENVER <span className="text-white/40 font-mono ml-4">v3.0.4.5</span>
                                    </p>
                                </div>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-[0.8] text-white">
                                BITÁCORA DE<br />
                                <span className="text-primary italic transition-colors duration-1000 group-hover:text-white">MISIONES</span>
                            </h1>
                        </div>
                        <Link to="/app/chat" className="w-full xl:w-auto">
                            <Button size="lg" className="h-20 px-12 w-full xl:w-auto rounded-[1.5rem] bg-white text-slate-950 hover:bg-primary hover:text-white font-black text-[12px] tracking-[0.4em] uppercase italic transition-all duration-700 shadow-3xl flex items-center justify-center gap-4 group/btn border-none">
                                NUEVA MISIÓN <PlusCircle size={24} className="group-hover/btn:rotate-90 transition-all duration-700" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {requests.length === 0 ? (
                <div className="text-center py-24 px-10 bg-white/5 backdrop-blur-2xl rounded-[3rem] border-2 border-dashed border-white/5 shadow-inner space-y-10 group/empty transition-all duration-1000 hover:border-white/10">
                    <div className="relative">
                        <div className="w-32 h-32 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-slate-800 mx-auto border border-white/5 shadow-3xl group-hover/empty:scale-110 group-hover/empty:text-primary transition-all duration-1000 rotate-12 group-hover/empty:rotate-0"><Inbox size={56} className="opacity-20" /></div>
                        <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-primary rounded-full shadow-2xl animate-ping opacity-20"></div>
                    </div>
                    <div className="space-y-4 max-w-xl mx-auto">
                        <h3 className="text-3xl font-black uppercase italic text-white/40 tracking-tighter leading-none">SIN REGISTROS TÁCTICOS</h3>
                        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-[0.6em] leading-relaxed italic">
                            EL SISTEMA NO DETECTA TRANSMISIONES ACTIVAS DESDE SU POSICIÓN. SOLICITE UN DESPLIEGUE PARA COMENZAR.
                        </p>
                    </div>
                    <Link to="/app/chat" className="inline-block pt-4">
                        <Button size="lg" className="h-16 px-10 rounded-[1.2rem] bg-primary text-slate-950 hover:bg-white font-black text-[11px] tracking-[0.4em] uppercase italic transition-all duration-700 border-none shadow-3xl">INICIAR PROTOCOLO <Zap size={20} className="ml-4" /></Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-8">
                    {requests.map((req, idx) => (
                        <Link key={req.id} to={`/app/requests/${req.id}`} className="block group/card">
                            <Card className="border border-white/5 shadow-3xl bg-white/5 backdrop-blur-3xl rounded-[2.5rem] hover:bg-white/10 transition-all duration-700 overflow-hidden relative active:scale-[0.98]">
                                <div className="absolute top-0 left-0 w-2.5 h-full bg-primary/20 group-hover/card:bg-primary transition-all duration-700"></div>
                                <div className="flex flex-col lg:flex-row">
                                    
                                    {/* Sidebar de ID en Misión (Tactical Ticket) */}
                                    <div className="w-full lg:w-72 bg-slate-950 p-10 md:p-12 flex flex-col justify-center items-center text-white text-center gap-6 relative overflow-hidden shrink-0 group-hover/card:bg-primary transition-all duration-700">
                                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none opacity-30" />
                                        
                                        <div className="space-y-4 relative z-10">
                                            <p className="text-[10px] font-bold uppercase text-slate-500 tracking-[0.5em] italic group-hover/card:text-white transition-colors">TICKET_ID</p>
                                            <div className="flex flex-col items-center">
                                                <p className="text-5xl md:text-6xl font-black italic tracking-tighter leading-none text-white uppercase group-hover/card:text-slate-950 transition-colors">#{req.ticket_number || req.id.slice(0,5).toUpperCase()}</p>
                                                <div className="flex items-center gap-3 mt-6 bg-white/5 px-5 py-2 rounded-full border border-white/5 shadow-2xl group-hover/card:bg-slate-950 transition-all">
                                                    <Calendar size={14} className="text-primary" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] italic pt-0.5">
                                                        {new Date(req.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Main Operational Data Matrix */}
                                    <CardContent className="flex-1 p-10 md:p-12 space-y-10">
                                        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                                            <div className="space-y-8">
                                                <div className="flex flex-wrap items-center gap-6">
                                                    <Badge className={`px-8 py-2.5 text-[10px] font-black uppercase tracking-[0.4em] rounded-full italic border-none shadow-2xl ${
                                                        req.status === 'COMPLETED' ? 'bg-emerald-500 text-white' : 
                                                        req.status === 'CANCELED' || req.status === 'DECLINED' ? 'bg-rose-500 text-white' : 
                                                        req.status === 'QUOTED' ? 'bg-amber-400 text-slate-950 animate-pulse' :
                                                        'bg-primary text-slate-950'
                                                    }`}>
                                                        {STATUS_LABEL[req.status] || req.status}
                                                    </Badge>
                                                    <div className="flex items-center gap-3 px-5 py-2 bg-white/5 rounded-full border border-white/5 shadow-inner transition-all">
                                                        <Activity size={14} className="text-primary" />
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] italic pt-0.5">TELEMETRÍA OK</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <h3 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-[0.85] group-hover/card:text-primary transition-all duration-700">
                                                        {req.vehicles ? (
                                                            <>
                                                                {req.vehicles.make} <br />
                                                                <span className="opacity-60 italic text-2xl">{req.vehicles.model} {req.vehicles.year}</span>
                                                            </>
                                                        ) : 'UNIDAD_NODETECH'}
                                                    </h3>
                                                    {req.vehicles?.license_plate && (
                                                        <p className="text-[12px] font-black text-slate-500 uppercase tracking-[0.5em] italic leading-none pl-4 border-l-4 border-primary mt-4">PLACA: [{req.vehicles.license_plate}]</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-5">
                                                {(req.status === 'DRAFT' || req.status === 'SUBMITTED') && (
                                                    <button 
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteDraft(req.id); }}
                                                        className="h-16 w-16 bg-white/5 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all duration-700 shadow-2xl border border-white/5 group/trash"
                                                    >
                                                        <Trash2 size={24} />
                                                    </button>
                                                )}
                                                <div className="w-16 h-16 bg-white/5 text-slate-700 rounded-2xl flex items-center justify-center group-hover/card:bg-slate-950 group-hover/card:text-primary transition-all duration-700 shadow-3xl group-hover/card:rotate-12 border border-white/5">
                                                    <ChevronRight size={32} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pt-10 border-t border-white/5 items-center">
                                            <div className="xl:col-span-2 flex items-center gap-6 p-6 bg-white/5 rounded-[1.5rem] border border-white/5 group-hover/card:bg-white/10 transition-all duration-700 group-hover/card:translate-x-2">
                                                <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center text-primary shadow-2xl border border-white/5 group-hover/card:scale-110 group-hover/card:rotate-6 transition-all duration-700 shrink-0"><Wrench size={24} /></div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.5em] mb-1 italic leading-none">Comando de Servicio</p>
                                                    <span className="text-xl md:text-2xl font-black uppercase text-white italic tracking-tighter leading-tight">{req.service_catalog?.name || 'MANTENIMIENTO_ALPHA'}</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-end items-center gap-6">
                                                <div className="text-right hidden sm:block space-y-2">
                                                    <p className="text-[10px] font-bold text-slate-700 uppercase tracking-[0.4em] italic leading-none">SECURITY_VECT</p>
                                                    <div className="flex justify-end gap-1.5">
                                                        <div className="w-8 h-2 bg-primary/40 rounded-full group-hover/card:w-16 group-hover/card:bg-primary transition-all duration-700"></div>
                                                        <div className="w-2 h-2 bg-white/5 rounded-full group-hover/card:bg-primary transition-all"></div>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-950 text-white h-16 px-10 rounded-[1.2rem] font-black text-[12px] tracking-[0.4em] uppercase italic flex items-center gap-4 shadow-3xl hover:bg-white hover:text-slate-950 transition-all duration-700 cursor-pointer group-hover/card:shadow-primary/20">
                                                    EXPEDIENTE <ArrowRight size={20} className="group-hover/card:translate-x-2 transition-transform duration-700" />
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
