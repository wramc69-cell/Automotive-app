import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { 
    Calendar, MapPin, Wrench, User, Hash, 
    ArrowRight, Clock, Activity, Target, 
    ShieldCheck, Box, MoveRight, ChevronRight,
    Search, Filter, LayoutGrid, List, Sparkles,
    Navigation, CheckCircle2, AlertCircle,
    Zap, Radio, Signal, Terminal, Truck
} from 'lucide-react';

export function TechRequestsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadAppointments = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select('*, service_requests(*, vehicles(*), service_catalog(*))')
                .eq('assigned_tech_user_id', user.id)
                .neq('status', 'CANCELED')
                .order('scheduled_start', { ascending: false });

            if (error) throw error;

            const uniqueRequests: any[] = [];
            const seenIds = new Set();
            
            (data || []).forEach(appt => {
                const rid = appt.service_requests?.id;
                const rStatus = appt.service_requests?.status;
                const aStatus = appt.status;

                const isDeadRequest = ['CANCELED', 'DECLINED', 'COMPLETED'].includes(rStatus);
                const isDeadAppointment = ['CANCELED', 'COMPLETED'].includes(aStatus);

                if (rid && !seenIds.has(rid) && !isDeadRequest && !isDeadAppointment) {
                    seenIds.add(rid);
                    uniqueRequests.push(appt);
                }
            });

            setAppointments(uniqueRequests);

        } catch (err: any) {
            console.error('Error loading tech requests:', err);
            toast({ title: 'ERROR_TRANSMISIÓN', description: 'No se pudieron sincronizar las misiones activas.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAppointments();
    }, [user]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-12 font-inter animate-in fade-in duration-1000">
                <div className="relative">
                    <div className="w-32 h-32 border-[12px] border-white/5 border-t-primary rounded-[3rem] animate-spin shadow-3xl shadow-primary/20"></div>
                    <Radio size={40} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" />
                </div>
                <div className="text-center space-y-3">
                    <p className="text-white font-black uppercase text-2xl tracking-[0.4em] italic leading-none">ESCANEANDO_FRECUENCIAS</p>
                    <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.8em] italic animate-pulse">PROTOCOLO_DENVER_NET active</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-20 pb-40 animate-in fade-in slide-in-from-bottom-16 duration-1000 px-4 md:px-8 font-inter">
            
            {/* Header: Mission Logistics Center (Enhanced Dark) */}
            <header className="relative group">
                <div className="absolute inset-0 bg-primary/20 blur-[200px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none group-hover:bg-primary/30 transition-all duration-1000"></div>
                <div className="relative z-10 bg-white/5 backdrop-blur-3xl rounded-[3rem] p-12 md:p-24 overflow-hidden border border-white/10 shadow-3xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-bl-[20rem] pointer-events-none group-hover:scale-110 transition-transform duration-1000 blur-2xl"></div>
                    
                    <div className="flex flex-col xl:flex-row items-center justify-between gap-16">
                        <div className="space-y-12 text-center xl:text-left">
                            <div className="flex items-center justify-center xl:justify-start gap-8">
                                <div className="w-20 h-20 bg-white/5 backdrop-blur-[50px] rounded-[2rem] flex items-center justify-center text-primary border border-white/10 shadow-3xl group-hover:rotate-12 group-hover:scale-110 transition-all duration-700">
                                    <Target size={40} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-4 justify-center xl:justify-start">
                                        <div className="w-10 h-[2px] bg-primary rounded-full"></div>
                                        <span className="text-primary font-black text-[12px] uppercase tracking-[0.8em] italic block pt-0.5">CENTRAL_LOGÍSTICA_DENVER</span>
                                    </div>
                                    <p className="text-slate-500 font-black uppercase tracking-[0.5em] text-[10px] italic">
                                       SISTEMA_OPERATIVO <span className="text-white/40 ml-4 font-mono">v.7.2.1-RADAR_ACTIVE</span>
                                    </p>
                                </div>
                            </div>
                            <h1 className="text-6xl md:text-9xl font-black italic uppercase tracking-tighter leading-[0.8] text-white">
                                COLA DE<br />
                                <span className="text-primary italic transition-colors duration-1000 group-hover:text-white">DESPLIEGUE</span>
                            </h1>
                        </div>
                        
                        <div className="bg-white/5 backdrop-blur-[50px] rounded-[3rem] p-16 border border-white/10 text-center min-w-[380px] shadow-3xl group-hover:bg-white/10 transition-all duration-700 relative overflow-hidden group/count">
                            <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-primary/15 blur-[60px] rounded-full group-hover/count:scale-150 transition-transform duration-1000"></div>
                            <div className="flex flex-col items-center gap-6 relative z-10">
                                <div className="flex items-center gap-4 bg-primary/20 px-8 py-2.5 rounded-full border border-primary/30">
                                    <Radio size={18} className="text-primary animate-pulse" />
                                    <span className="text-[11px] font-black uppercase text-primary tracking-[0.5em] pt-0.5">MISIONES_ACTIVAS</span>
                                </div>
                                <p className="text-white font-black text-9xl md:text-[10rem] italic tracking-tighter leading-none group-hover/count:text-primary transition-colors duration-700">
                                    {appointments.length.toString().padStart(2, '0')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Missions List (Tactical Dark Grid) */}
            <div className="grid grid-cols-1 gap-12">
                {appointments.length === 0 ? (
                    <div className="py-56 text-center bg-white/5 backdrop-blur-3xl rounded-[4rem] border-2 border-dashed border-white/5 flex flex-col items-center gap-16 group transition-all duration-1000 hover:border-white/15 shadow-inner">
                         <div className="relative">
                            <div className="w-56 h-56 bg-slate-900 rounded-[3rem] shadow-3xl flex items-center justify-center text-slate-800 border border-white/5 rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-all duration-1000">
                                <Truck size={100} className="opacity-10" />
                            </div>
                            <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-slate-950 rounded-[2.5rem] flex items-center justify-center text-white shadow-3xl border border-white/5 animate-denver-in">
                                <CheckCircle2 size={56} className="text-emerald-500/40 shadow-emerald-500/20 shadow-2xl" />
                            </div>
                         </div>
                        <div className="space-y-6 max-w-2xl mx-auto px-10">
                            <h3 className="text-5xl md:text-6xl font-black text-white/40 uppercase tracking-tighter italic leading-none">SECTOR_DESPEJADO</h3>
                            <p className="text-[12px] font-black text-slate-600 uppercase tracking-[0.8em] leading-relaxed italic opacity-80">
                                NO TIENES MISIONES ASIGNADAS EN ESTE CUADRANTE. EL SISTEMA PERMANECE EN MODO ESCUCHA Denver_Alpha.
                            </p>
                        </div>
                    </div>
                ) : (
                    appointments.map((appt, idx) => (
                        <Link key={appt.id} to={`/tech/requests/${appt.request_id}`} className="block group/card active:scale-[0.98] transition-transform">
                            <Card className="border border-white/5 shadow-3xl bg-white/5 backdrop-blur-3xl rounded-[3rem] overflow-hidden group-hover/card:bg-white/10 transition-all duration-700 relative">
                                <div className="absolute top-0 left-0 w-3.5 h-full bg-primary/20 group-hover/card:bg-primary transition-all duration-1000"></div>
                                <div className="flex flex-col xl:flex-row">
                                    
                                    {/* Sidebar de ID en Misión (Tactical Stamp - Premium Dark) */}
                                    <div className="w-full xl:w-[500px] bg-slate-950 p-16 md:p-24 flex flex-col justify-center items-center text-white text-center gap-12 relative overflow-hidden shrink-0 group-hover/card:bg-primary transition-all duration-1000">
                                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none opacity-30" />
                                        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/15 blur-[120px] rounded-full" />
                                        
                                        <div className="w-28 h-28 bg-white/5 backdrop-blur-3xl rounded-[2.5rem] flex items-center justify-center text-primary group-hover/card:text-slate-950 group-hover/card:rotate-[15deg] group-hover/card:scale-110 transition-all duration-700 border border-white/10 shadow-3xl">
                                            <Clock size={56} className="stroke-[2.5]" />
                                        </div>
                                        
                                        <div className="space-y-6 relative z-10 w-full">
                                            <div className="flex items-center gap-4 justify-center">
                                                <div className="w-6 h-[1px] bg-white/20"></div>
                                                <p className="text-[12px] font-black uppercase text-slate-500 tracking-[0.8em] italic group-hover/card:text-slate-950 transition-colors">DEPL_ETA_SYNC</p>
                                                <div className="w-6 h-[1px] bg-white/20"></div>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <p className="text-9xl md:text-[10rem] font-black italic tracking-tighter leading-none text-white uppercase group-hover/card:text-slate-950 transition-colors font-mono">
                                                    {new Date(appt.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                </p>
                                                <div className="flex items-center gap-5 mt-14 bg-white/5 px-12 py-4 rounded-full border border-white/10 shadow-3xl group-hover/card:bg-slate-950 transition-all">
                                                    <Calendar size={20} className="text-primary" />
                                                    <span className="text-[13px] font-black uppercase tracking-[0.6em] italic pt-1 text-slate-300">
                                                        {new Date(appt.scheduled_start).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Main Operational Data Matrix (Premium Dark) */}
                                    <CardContent className="flex-1 p-16 md:p-24 space-y-20">
                                        <div className="flex flex-col md:flex-row justify-between items-start gap-16">
                                            <div className="space-y-12">
                                                <div className="flex flex-wrap items-center gap-8">
                                                    <Badge className="bg-primary text-slate-950 px-12 py-3.5 text-[12px] font-black uppercase tracking-[0.6em] italic border-none shadow-2xl rounded-full group-hover/card:bg-white transition-all duration-700">
                                                        {appt.status}
                                                    </Badge>
                                                    <div className="flex items-center gap-5 px-10 py-3.5 bg-white/5 rounded-full border border-white/5 shadow-inner transition-all">
                                                        <Hash size={20} className="text-primary" /> 
                                                        <span className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.4em] italic pt-0.5">REF: #{appt.service_requests?.ticket_number || 'ST_772'}</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-8">
                                                    <h3 className="text-7xl md:text-8xl font-black text-white leading-[0.8] uppercase italic tracking-tighter group-hover/card:text-primary transition-all duration-700 origin-left">
                                                        {appt.service_requests?.vehicles ? (
                                                            <>
                                                                {appt.service_requests.vehicles.make} <br />
                                                                <span className="opacity-20 italic text-4xl md:text-5xl">{appt.service_requests.vehicles.model} {appt.service_requests.vehicles.year}</span>
                                                            </>
                                                        ) : 'ASSET_ALPHA_UNIT'}
                                                    </h3>
                                                    <div className="flex items-center gap-8 text-slate-500 font-bold uppercase text-[14px] tracking-[0.6em] italic pl-6 border-l-4 border-primary/40 group-hover/card:border-primary transition-all">
                                                        <User size={24} className="text-primary" /> 
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] text-slate-600 font-bold tracking-[.8em] opacity-40">CARGO_CONTACT</p>
                                                            {appt.service_requests?.customer_name || 'CLIENTE_PREMIUM'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-8">
                                                <div className="w-24 h-24 bg-white/5 text-slate-700 rounded-[2.5rem] flex items-center justify-center group-hover/card:bg-slate-950 group-hover/card:text-primary transition-all duration-700 shadow-3xl group-hover/card:rotate-12 border border-white/5">
                                                    <ChevronRight size={56} className="stroke-[3]" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12 pt-20 border-t border-white/10 items-center">
                                            <div className="xl:col-span-2 flex items-center gap-12 p-12 bg-white/5 rounded-[3rem] border border-white/5 group-hover/card:bg-white/10 transition-all duration-700 group-hover/card:translate-x-4">
                                                <div className="w-28 h-28 bg-slate-900 rounded-[2.2rem] flex items-center justify-center text-primary shadow-3xl border border-white/5 group-hover/card:scale-110 group-hover/card:rotate-6 transition-all duration-1000 shrink-0"><Wrench size={48} /></div>
                                                <div className="space-y-3">
                                                    <p className="text-[13px] font-bold text-slate-600 uppercase tracking-[0.8em] mb-2 italic leading-none flex items-center gap-4">
                                                       PROTOCOL_CMD <div className="w-12 h-[2px] bg-primary/40"></div>
                                                    </p>
                                                    <span className="text-3xl md:text-4xl font-black uppercase text-white italic tracking-tighter leading-tight">{appt.service_requests?.service_catalog?.name || 'MANTENIMIENTO_ALPHA_NET'}</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-end items-center gap-12">
                                                <div className="text-right hidden sm:block space-y-4">
                                                    <p className="text-[12px] font-black text-slate-600 uppercase tracking-[0.6em] italic leading-none">VECT_CLEARANCE</p>
                                                    <div className="flex justify-end gap-3">
                                                        <div className="w-14 h-3 bg-primary/20 rounded-full group-hover/card:w-28 group-hover/card:bg-primary transition-all duration-1000"></div>
                                                        <div className="w-3 h-3 bg-white/5 rounded-full group-hover/card:bg-primary transition-colors"></div>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-950 text-white h-28 px-16 rounded-full font-black text-[15px] tracking-[0.6em] uppercase italic flex items-center gap-10 shadow-3xl hover:bg-white hover:text-slate-950 transition-all duration-700 cursor-pointer group-hover/card:shadow-primary/30">
                                                    OPERAR <ArrowRight size={36} className="group-hover/card:translate-x-6 transition-transform duration-700" />
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </div>
                            </Card>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
