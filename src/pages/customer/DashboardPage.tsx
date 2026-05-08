import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
    Wrench, Calendar, Car, ChevronRight, 
    LayoutDashboard, Zap, Trash2, Activity, 
    ShieldCheck, MapPin, Gauge, MoveRight,
    Terminal, Clock, AlertCircle, Box,
    ArrowUpRight, Target
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';

export function CustomerDashboardPage() {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const [requests, setRequests] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    useEffect(() => {
        if (user) loadData();
    }, [user]);

    async function loadData() {
        setLoading(true);
        try {
            const [reqRes, vehRes] = await Promise.all([
                supabase
                    .from('service_requests')
                    .select('*, vehicles(make, model, year, odometer), service_catalog(name)')
                    .eq('customer_user_id', user!.id)
                    .order('created_at', { ascending: false })
                    .limit(5),
                supabase
                    .from('vehicles')
                    .select('*')
                    .eq('owner_user_id', user!.id)
                    .order('created_at', { ascending: false })
            ]);

            setRequests(reqRes.data || []);
            setVehicles(vehRes.data || []);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }

    const active = requests.filter(r => !['COMPLETED', 'CANCELED', 'DECLINED'].includes(r.status));
    const completed = requests.filter(r => r.status === 'COMPLETED');
    const pendingAction = requests.filter(r => r.status === 'QUOTED');

    const STATUS_LABEL: Record<string, string> = {
        SUBMITTED: 'SOLICITADO', SCHEDULED: 'PROGRAMADO', DIAGNOSED: 'DIAGNOSTICADO',
        QUOTED: 'PENDIENTE ACEP.', APPROVED: 'APROBADO', COMPLETED: 'COMPLETADO',
        CANCELED: 'CANCELADO', DECLINED: 'RECHAZADO',
    };

    const handleCancelRequest = async (e: React.MouseEvent, requestId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm('¿Deseas abortar esta misión de servicio?')) return;
        setCancellingId(requestId);
        try {
            await supabase.from('service_requests').update({ status: 'CANCELED' }).eq('id', requestId);
            await supabase.from('appointments').update({ status: 'CANCELED' }).eq('request_id', requestId);
            toast({ title: 'Protocolo Abortado', description: 'La misión ha sido enviada al archivo histórico.', type: 'info' });
            loadData();
        } catch (err) {
            toast({ title: 'Falla de Sistema', description: 'No se pudo cancelar el servicio.', type: 'error' });
        } finally {
            setCancellingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
                <div className="relative">
                    <div className="w-24 h-24 border-8 border-slate-100 rounded-[2.5rem] animate-pulse"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Terminal className="w-10 h-10 text-primary animate-bounce" />
                    </div>
                </div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.6em] animate-pulse">Iniciando Terminal de Cliente...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 pb-16 animate-in fade-in duration-1000 px-4 lg:px-8">
            
            {/* Header: Command Center welcome */}
            <header className="relative group overflow-hidden bg-slate-950 rounded-2xl border border-white/5 shadow-3xl">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none"></div>
                
                <div className="relative z-10 p-5 md:p-8 flex flex-col lg:flex-row justify-between items-center gap-6">
                    <div className="space-y-3 text-center lg:text-left">
                        <div className="flex items-center justify-center lg:justify-start gap-4">
                            <div className="w-10 h-10 bg-white/5 backdrop-blur-2xl rounded-xl flex items-center justify-center border border-white/10 shadow-xl group-hover:rotate-12 transition-all">
                                <LayoutDashboard className="text-primary" size={20} />
                            </div>
                            <div className="space-y-1">
                                <span className="text-primary font-black text-[10px] uppercase tracking-[0.5em] italic block leading-none">DENVER_COMMAND_CENTER</span>
                                <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[9px] flex items-center gap-2">
                                   STATUS: <span className="flex items-center gap-1.5 text-emerald-400"><div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> OPERATIONAL</span>
                                </p>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase leading-[0.8] text-white">
                                HOLA,<br />
                                <span className="text-primary italic group-hover:text-white transition-colors duration-700">{profile?.first_name || 'OPERADOR'}</span>
                            </h1>
                            <p className="text-slate-400 font-bold text-sm uppercase tracking-tighter max-w-xl italic opacity-80 leading-snug">
                               SISTEMA DE GESTIÓN CONCIERGE. <br /> MONITOREO DE ACTIVOS EN TIEMPO REAL.
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-4 w-full lg:w-auto">
                        <Link to="/app/chat">
                            <Button size="lg" className="h-10 px-6 rounded-full bg-primary hover:bg-white text-white hover:text-slate-900 font-black text-[11px] tracking-[0.4em] uppercase italic transition-all duration-700 shadow-3xl shadow-primary/30 border-none group/btn">
                                SOLICITAR MISIÓN <Zap size={18} className="ml-3 group-hover/btn:scale-125 transition-transform" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Tactical Stats Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'OPERACIONES ACTIVAS', value: active.length, icon: <Activity size={24} />, color: 'text-primary', bg: 'bg-primary/10', sub: 'MISIONES_DEPLOYED' },
                    { label: 'BITÁCORA TOTAL', value: requests.length, icon: <ShieldCheck size={24} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', sub: 'HISTORY_ARCHIVE' },
                    { label: 'GARAGE PRIVADO', value: vehicles.length, icon: <Car size={24} />, color: 'text-amber-400', bg: 'bg-amber-400/10', sub: 'MANAGED_ASSETS' }
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-3xl bg-white/5 backdrop-blur-3xl rounded-[2.5rem] group/stat hover:-translate-y-2 transition-all duration-700 overflow-hidden border border-white/5 hover:border-white/10">
                        <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bg} blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover/stat:scale-150 transition-transform`}></div>
                    <CardContent className="p-8 relative z-10 flex flex-col gap-6">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 group-hover/stat:bg-primary group-hover/stat:text-slate-950 transition-all shadow-xl group-hover/stat:rotate-12">
                                {stat.icon}
                            </div>
                            <div className="space-y-3">
                                <div className={`text-4xl font-black italic tracking-tighter leading-none transition-colors ${stat.color} group-hover/stat:text-white`}>
                                    {stat.value.toString().padStart(2, '0')}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] italic leading-none">{stat.label}</h3>
                                    <p className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] italic opacity-40">{stat.sub}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-12 pt-8">
                {/* Active Support Console */}
                <div className="xl:col-span-3 space-y-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between px-4 gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-[2px] bg-primary rounded-full"></div>
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.6em] italic leading-none">Misiones de Servicio</span>
                            </div>
                            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Despliegue de <span className="text-primary italic">Activos</span></h2>
                        </div>
                        <Link to="/app/requests" className="group flex items-center gap-8 bg-white/5 px-10 py-5 rounded-full hover:bg-white/10 transition-all border border-white/5">
                             <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase tracking-[0.4em] transition-colors italic">Ver historial completo</span>
                             <MoveRight className="text-slate-500 group-hover:text-primary transition-all group-hover:translate-x-3" size={24} />
                        </Link>
                    </div>

                    <div className="space-y-6">
                        {active.length === 0 ? (
                            <div className="text-center py-28 bg-white/5 backdrop-blur-2xl rounded-[3rem] border-2 border-dashed border-white/5 flex flex-col items-center gap-8 group/empty hover:border-primary/20 transition-all duration-700">
                                <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center text-slate-600 border border-white/10 shadow-2xl group-hover/empty:scale-110 group-hover/empty:text-primary transition-all duration-1000 group-hover/empty:rotate-12">
                                    <Wrench size={40} />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">SISTEMA STANDBY</h3>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.4em] max-w-md mx-auto leading-relaxed italic opacity-80">
                                        TODOS LOS ACTIVOS SE ENCUENTRAN OPERATIVOS. <br/> REQUERIR ASISTENCIA PARA NUEVAS MISIONES.
                                    </p>
                                </div>
                                <Link to="/app/chat" className="mt-6">
                                    <Button size="lg" className="h-16 px-12 rounded-full bg-primary hover:bg-white text-slate-950 font-black text-[12px] tracking-[0.4em] uppercase italic transition-all duration-700 shadow-2xl shadow-primary/20 border-none">
                                        NUEVA SOLICITUD <Zap size={20} className="ml-4" />
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            active.map((req, idx) => (
                                <Link key={req.id} to={`/app/requests/${req.id}`} className="block group/card relative animate-in slide-in-from-bottom-12 duration-1000" style={{ animationDelay: `${idx * 200}ms` }}>
                                    <Card className="border border-white/5 shadow-3xl bg-white/5 backdrop-blur-3xl rounded-[2.5rem] group-hover/card:bg-white/10 group-hover/card:border-white/10 transition-all duration-1000 overflow-hidden relative">
                                        <div className="absolute top-0 left-0 w-2.5 h-full bg-primary/20 group-hover/card:bg-primary transition-all duration-700"></div>
                                        
                                        <CardContent className="p-8 md:p-12 pl-12 md:pl-16">
                                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
                                                <div className="space-y-8 flex-1">
                                                    <div className="flex flex-wrap items-center gap-6">
                                                        <Badge className="bg-primary text-slate-950 border-none text-[10px] font-black tracking-[0.3em] px-8 py-2.5 uppercase rounded-full shadow-2xl italic">
                                                            {STATUS_LABEL[req.status] || req.status}
                                                        </Badge>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-2 h-2 bg-primary rounded-full group-hover/card:animate-ping" />
                                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic leading-none">LOG_{req.ticket_number || req.id.slice(0,8).toUpperCase()}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="space-y-4">
                                                        <h3 className="text-2xl md:text-3xl font-black text-white group-hover/card:text-primary transition-colors duration-700 uppercase italic tracking-tighter leading-tight">
                                                            {req.service_catalog?.name || 'SERVICIO_BASE'}
                                                        </h3>
                                                        <div className="flex flex-wrap items-center gap-6">
                                                            <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
                                                                <Car size={18} className="text-primary" />
                                                                <span className="text-xs font-bold text-white uppercase italic tracking-tight">{req.vehicles?.make} {req.vehicles?.model}</span>
                                                            </div>
                                                            <div className="flex items-center gap-3 bg-white/5 px-8 py-3 rounded-2xl border border-white/5">
                                                                <Clock size={18} className="text-primary" />
                                                                <span className="text-xs font-bold text-white uppercase italic tracking-tight">{new Date(req.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-end gap-6 w-full lg:w-auto pt-8 lg:pt-0 border-t lg:border-none border-white/5">
                                                    {['SUBMITTED', 'SCHEDULED', 'DIAGNOSED', 'QUOTED'].includes(req.status) && (
                                                        <button 
                                                            onClick={(e) => handleCancelRequest(e, req.id)}
                                                            disabled={cancellingId === req.id}
                                                            className="h-16 w-16 flex items-center justify-center text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all duration-500 disabled:opacity-50 border border-transparent hover:border-rose-500/20"
                                                        >
                                                            <Trash2 size={24} />
                                                        </button>
                                                    )}
                                                    <div className="w-16 h-16 bg-white/5 text-slate-600 rounded-2xl flex items-center justify-center group-hover/card:bg-primary group-hover/card:text-slate-950 transition-all duration-1000 shadow-2xl group-hover/card:-translate-y-2 group-hover/card:rotate-6">
                                                        <ChevronRight size={32} />
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                {/* Sidebar: Asset Management */}
                <aside className="space-y-12">
                    {/* Garage Widget */}
                    <div className="space-y-8 animate-in slide-in-from-right-16 duration-1000">
                        <div className="flex items-center justify-between px-6">
                            <div className="space-y-2">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.6em] italic leading-none">Mi Flota_</span>
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">GARAGE</h3>
                            </div>
                            <Link to="/app/vehicles" className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-primary hover:text-slate-950 transition-all shadow-xl border border-white/5">
                                <ArrowUpRight size={28} />
                            </Link>
                        </div>
                        
                        <Card className="border-none shadow-3xl bg-white/5 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden p-6 border border-white/5">
                            <div className="space-y-4">
                                {vehicles.length === 0 ? (
                                    <Link to="/app/vehicles" className="block p-10 text-center bg-white/5 border-2 border-dashed border-white/10 rounded-3xl group/add hover:border-primary/40 transition-all duration-700">
                                        <Box size={32} className="text-slate-600 mx-auto mb-4 group-hover/add:text-primary transition-colors" />
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] italic group-hover/add:text-white transition-colors">Añadir Vehículo_</p>
                                    </Link>
                                ) : (
                                    vehicles.slice(0, 3).map(v => (
                                        <Link key={v.id} to="/app/vehicles" className="block group/veh">
                                            <div className="flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all duration-700 border border-white/5">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center text-slate-600 group-hover/veh:text-primary shadow-2xl border border-white/5 group-hover/veh:scale-110 group-hover/veh:rotate-6 transition-all duration-700">
                                                        <Car size={24} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className="font-black text-xl italic uppercase tracking-tighter leading-none text-white transition-colors">{v.make}</h4>
                                                        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-slate-500 italic">{v.model} • {v.year}</p>
                                                    </div>
                                                </div>
                                                <ChevronRight size={24} className="text-slate-700 group-hover/veh:text-primary group-hover/veh:translate-x-3 transition-all" />
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Quick Access Archive */}
                    <div className="space-y-8 animate-in slide-in-from-right-24 duration-1000">
                        <div className="flex items-center justify-between px-6">
                            <div className="space-y-2">
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.6em] italic leading-none">Bitácora_</span>
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">HISTORIAL</h3>
                            </div>
                        </div>

                        <Card className="border-none shadow-3xl bg-white/5 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden p-6 border border-white/5">
                            <div className="space-y-3">
                                {requests.filter(r => ['COMPLETED', 'CANCELED'].includes(r.status)).slice(0, 3).map((req, i) => (
                                    <Link key={req.id} to={`/app/requests/${req.id}`} className="flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all duration-700 group/log border border-white/5" style={{ animationDelay: `${i * 100}ms` }}>
                                        <div className="flex items-center gap-5">
                                            <div className={`w-3 h-3 rounded-full ${req.status === 'COMPLETED' ? 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.6)]' : 'bg-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.6)]'}`}></div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold italic uppercase tracking-tighter text-white group-hover/log:text-primary transition-colors">{req.service_catalog?.name || 'LOG_ENTRY'}</p>
                                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic">{new Date(req.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase()}</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={20} className="text-slate-700 group-hover/log:text-primary group-hover/log:translate-x-2 transition-all" />
                                    </Link>
                                ))}
                                {requests.filter(r => ['COMPLETED', 'CANCELED'].includes(r.status)).length === 0 && (
                                    <div className="py-16 text-center text-[11px] font-bold text-slate-600 uppercase tracking-[0.5em] italic">REGISTROS_VACIÓS</div>
                                )}
                            </div>
                        </Card>
                    </div>
                </aside>
            </div>
        </div>
    );
}
