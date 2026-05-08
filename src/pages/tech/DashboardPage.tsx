import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
    Wrench, MapPin, Calendar, Star, TrendingUp, Clock, 
    Navigation, XCircle, ChevronRight, Zap, Target,
    ShieldCheck, Activity, Map as MapIcon, ArrowUpRight,
    Power, CheckCircle2, AlertCircle, Info, Timer,
    Cpu, Radio, Signal, Terminal
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export function TechDashboardPage() {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [nextAppointment, setNextAppointment] = useState<any>(null);
    const [stats, setStats] = useState([
        { label: 'VISITAS HOY', value: '0', sub: 'MISIONES ACTIVAS', icon: <Calendar className="text-primary" />, color: 'shadow-primary/20 bg-primary/10' },
        { label: 'COMPLETADOS', value: '0', sub: 'CICLO ACTUAL', icon: <TrendingUp className="text-emerald-500" />, color: 'shadow-emerald-500/20 bg-emerald-500/10' },
        { label: 'RATING', value: '5.0', sub: 'ELITE STATUS', icon: <Star className="text-amber-400" />, color: 'shadow-amber-400/20 bg-amber-400/10' },
        { label: 'TIME_AVG', value: '--m', sub: 'POR DESPLIEGUE', icon: <Clock className="text-indigo-400" />, color: 'shadow-indigo-400/20 bg-indigo-400/10' },
    ]);

    useEffect(() => {
        if (user) {
            loadDashboardData();
        }
    }, [user]);

    async function loadDashboardData() {
        setLoading(true);
        try {
            const { data: apptData, error: apptError } = await supabase
                .from('appointments')
                .select(`
                    *,
                    service_requests!inner (
                        id,
                        ticket_number,
                        status,
                        vehicles (year, make, model, license_plate),
                        service_catalog:requested_service_id (name)
                    )
                `)
                .eq('assigned_tech_user_id', user?.id)
                .in('status', ['SCHEDULED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'])
                .order('scheduled_start', { ascending: true })
                .limit(10)
                .then(r => ({
                    data: (r.data || []).find((a: any) =>
                        !['CANCELED', 'DECLINED', 'COMPLETED'].includes(a.service_requests?.status)
                    ) || null,
                    error: r.error
                }));

            if (apptError) throw apptError;
            setNextAppointment(apptData);

            const today = new Date().toISOString().split('T')[0];
            const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

            const { count: todayCount } = await supabase
                .from('appointments')
                .select('*, service_requests!inner(status)', { count: 'exact', head: true })
                .eq('assigned_tech_user_id', user?.id)
                .neq('status', 'CANCELED')
                .neq('service_requests.status', 'CANCELED')
                .gte('scheduled_start', `${today}T00:00:00Z`)
                .lte('scheduled_start', `${today}T23:59:59Z`);

            const { count: monthCount } = await supabase
                .from('appointments')
                .select('*, service_requests!inner(status)', { count: 'exact', head: true })
                .eq('assigned_tech_user_id', user?.id)
                .eq('service_requests.status', 'COMPLETED')
                .gte('scheduled_start', startOfMonth);

            setStats(prev => [
                { ...prev[0], value: (todayCount || 0).toString() },
                { ...prev[1], value: (monthCount || 0).toString() },
                prev[2],
                prev[3]
            ]);

        } catch (err) {
            console.error('Error loading dashboard:', err);
        } finally {
            setLoading(false);
        }
    }

    const startRoute = () => {
        if (!nextAppointment) return;
        const clean = (val: string | null | undefined) => val && !val.includes('@') ? val.trim() : '';
        const appt = nextAppointment;
        const destination = [clean(appt.address), clean(appt.city), clean(appt.state), clean(appt.zip)].filter(Boolean).join(', ');
        const origin = [clean(profile?.address_line1), clean(profile?.city), clean(profile?.state), clean(profile?.zip)].filter(Boolean).join(', ');
        if (!destination) return alert('Punto de destino no detectado en el radar.');
        const mapUrl = origin ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}` : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
        window.open(mapUrl, '_blank');
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[75vh] gap-10 text-center px-4 font-inter">
                <div className="relative">
                    <div className="w-32 h-32 border-[12px] border-white/5 border-t-primary rounded-[2.5rem] animate-spin shadow-3xl shadow-primary/20"></div>
                    <Cpu size={40} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" />
                </div>
                <div className="space-y-3">
                    <p className="text-white text-3xl font-black uppercase tracking-[0.4em] italic leading-none">BOOTING_TECH_OS</p>
                    <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.8em] italic animate-pulse">SYNCHRONIZING_MISSION_DATA...</p>
                </div>
            </div>
        );
    }

    if (profile?.status === 'PENDING_APPROVAL') {
        return (
            <div className="flex items-center justify-center min-h-[85vh] px-4 animate-in fade-in slide-in-from-bottom-12 duration-1000 font-inter">
                <Card className="w-full max-w-2xl text-center p-12 md:p-20 rounded-[3rem] shadow-3xl border border-white/5 bg-slate-950/50 backdrop-blur-3xl relative overflow-hidden text-white">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2" />
                    <div className="w-36 h-36 bg-white/5 backdrop-blur-3xl rounded-[2.5rem] text-primary flex items-center justify-center mx-auto mb-12 shadow-3xl border border-white/10 rotate-6 hover:rotate-0 transition-transform duration-700">
                        <Timer size={72} className="animate-pulse shadow-primary/40 shadow-xl" />
                    </div>
                    <div className="space-y-8">
                        <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white mb-8 uppercase leading-[0.8]">PERFIL EN<br /><span className="text-primary italic">AUDITORÍA</span></h2>
                        <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[11px] leading-relaxed mb-12 px-10 italic">
                            LA CENTRAL <span className="text-white">Denver_Alpha</span> ESTÁ VALIDANDO SUS CREDENCIALES TÉCNICAS. ESTIMADO DE RESPUESTA: <span className="text-primary">24-48H OPERATIVAS</span>.
                        </p>
                        <div className="p-12 bg-slate-950/80 rounded-[2rem] border border-white/5 shadow-inner space-y-8">
                             <div className="flex items-center justify-center gap-6">
                                <Activity className="w-6 h-6 text-primary animate-ping" />
                                <span className="text-[14px] font-black uppercase text-white tracking-[0.6em] italic leading-none">MISION_CHANNEL_LOCKED</span>
                             </div>
                             <div className="flex justify-center gap-3">
                                <div className="w-16 h-3 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/20"></div>
                                <div className="w-3 h-3 bg-white/10 rounded-full"></div>
                                <div className="w-3 h-3 bg-white/10 rounded-full"></div>
                             </div>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    if (profile?.status === 'REJECTED') {
        return (
            <div className="flex items-center justify-center min-h-[85vh] px-4 animate-in fade-in zoom-in-95 duration-1000 font-inter">
                <Card className="w-full max-w-2xl text-center p-12 md:p-20 rounded-[3rem] shadow-3xl border border-rose-500/10 bg-slate-950/50 backdrop-blur-3xl overflow-hidden relative text-white">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-rose-500/5 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2" />
                    <div className="w-36 h-36 bg-rose-500/10 rounded-[2.5rem] text-rose-500 flex items-center justify-center mx-auto mb-12 shadow-3xl shadow-rose-500/10 -rotate-3 border border-rose-500/20">
                        <XCircle size={80} className="stroke-[2.5]" />
                    </div>
                    <div className="space-y-8">
                        <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white mb-8 uppercase leading-[0.8]">ACCESO<br /><span className="text-rose-500">DENEGADO</span></h2>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[11px] leading-relaxed mb-12 px-10 italic">
                            SU SOLICITUD NO HA SUPERADO LOS ESTÁNDARES DE CALIDAD <span className="text-white">Denver_Michigan</span>. SECTOR DE ACCESO LIMITADO POR PROTOCOLO.
                        </p>
                        <Link to="/" className="block">
                            <Button size="xl" className="h-28 px-20 rounded-[2rem] bg-rose-500 text-white hover:bg-white hover:text-slate-950 font-black text-[13px] tracking-[0.5em] uppercase italic transition-all duration-700 shadow-3xl shadow-rose-500/20 w-full md:w-auto">CERRAR TRANSMISIÓN</Button>
                        </Link>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-6 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 px-4 md:px-8 font-inter">
            
            {/* Header: Field Terminal Commander */}
            <header className="relative group grayscale hover:grayscale-0 transition-all duration-1000">
                <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none group-hover:bg-primary/20 transition-all"></div>
                <div className="relative z-10 p-5 bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-white/5">
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-60"></div>
                    
                    <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8 text-center lg:text-left">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-12 h-12 bg-white/5 backdrop-blur-3xl rounded-xl flex items-center justify-center border border-white/10 shadow-xl group-hover:rotate-12 transition-all duration-700">
                                <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/40 group-hover:scale-110 transition-transform duration-700">
                                    <Wrench size={18} className="drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex flex-col md:flex-row items-center gap-4">
                                    <h1 className="text-xl md:text-2xl font-black italic tracking-tighter text-white uppercase leading-[0.8] transition-all">
                                        OP_<span className="text-primary italic underline decoration-primary/20 underline-offset-[5px] transition-colors group-hover:text-white">{profile?.first_name || 'TECH'}</span>
                                    </h1>
                                    <Badge className="bg-primary text-white text-[10px] font-black border-none px-6 py-2 rounded-full shadow-2xl h-fit uppercase tracking-[0.4em] italic">ACTIVE_TERMINAL</Badge>
                                </div>
                                <div className="flex items-center justify-center lg:justify-start gap-8">
                                    <div className="flex items-center gap-4 px-6 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-xl">
                                        <Radio className="w-4 h-4 text-primary animate-pulse" />
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] italic pt-0.5">CHAN_ALPHA_SECURE</span>
                                    </div>
                                    <p className="text-slate-500 font-black uppercase tracking-[0.6em] text-[11px] italic flex items-center gap-3">
                                        <MapPin size={14} className="text-primary" /> {profile?.city?.toUpperCase() || 'DENVER_HQ'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="hidden xl:block">
                            <div className="w-40 h-40 border-4 border-white/5 rounded-2xl p-4 flex flex-col justify-center items-center gap-3 group-hover:border-primary/20 transition-all duration-700 -rotate-6 group-hover:rotate-0">
                                <Terminal size={48} className="text-white/5 group-hover:text-primary transition-all duration-700" />
                                <span className="text-[10px] font-black text-white/10 uppercase tracking-[0.8em]">v3.4.0</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Matrix Metrics Board */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <Card key={i} className="group relative bg-white/5 border-none rounded-[2rem] shadow-3xl hover:bg-white/10 hover:-translate-y-2 transition-all duration-700 overflow-hidden border border-white/5 hover:border-white/10">
                        <CardContent className="p-6 relative z-10 flex flex-col justify-between gap-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-700 shadow-2xl relative ${nextAppointment ? stat.color : 'bg-white/5 grayscale opacity-30 animate-pulse'}`}>
                                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                {React.cloneElement(stat.icon as React.ReactElement<any>, { size: 28, className: (stat.icon as any).props.className + ' group-hover:scale-125 transition-transform duration-700 relative z-10' })}
                            </div>
                            <div className="space-y-2">
                                <p className="text-3xl font-black text-white italic tracking-tighter leading-none group-hover:text-primary transition-colors">
                                    {stat.value}
                                </p>
                                <div className="flex flex-col gap-1">
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] italic">{stat.label}</h4>
                                    <p className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] italic opacity-40">{stat.sub}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </section>

            {/* Next Mission Deploy Console */}
            <section className="space-y-6">
                <div className="flex items-end gap-6 px-4">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-[2px] bg-primary rounded-full shadow-lg shadow-primary"></div>
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.6em] italic leading-none">Radar de Operaciones</span>
                        </div>
                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Misión <span className="text-primary italic">Asignada</span></h2>
                    </div>
                </div>

                {nextAppointment ? (
                    <Card className="border border-white/5 shadow-3xl overflow-hidden group bg-white/5 backdrop-blur-3xl rounded-[3rem] relative animate-in slide-in-from-bottom-12 duration-1000">
                        <div className="absolute top-0 left-0 w-2.5 h-full bg-primary/20 group-hover:bg-primary transition-all duration-700"></div>
                        <CardContent className="p-0 flex flex-col xl:flex-row">
                            
                            <div className="flex-1 p-8 md:p-12 space-y-10">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-10">
                                    <div className="space-y-12 flex-1">
                                        <div className="flex flex-wrap items-center gap-8">
                                            <Badge className="bg-primary text-slate-950 border-none text-[12px] font-black tracking-[0.5em] px-12 py-4 uppercase rounded-full shadow-2xl group-hover:bg-white transition-all duration-700 italic">
                                                {nextAppointment.status}
                                            </Badge>
                                            <div className="flex items-center gap-4 px-8 py-3.5 bg-white/5 rounded-full border border-white/5 shadow-xl transition-all">
                                                <Target size={20} className="text-primary animate-pulse" />
                                                <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] italic">TICKET_#{nextAppointment.service_requests?.ticket_number || 'UNKNOWN'}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <h3 className="text-3xl lg:text-4xl font-black text-white leading-[0.8] uppercase italic tracking-tighter group-hover:translate-x-3 transition-transform duration-700">
                                                {nextAppointment.service_requests?.vehicles
                                                    ? (
                                                        <>
                                                            {nextAppointment.service_requests.vehicles.make} <br />
                                                            <span className="opacity-30 italic text-2xl">{nextAppointment.service_requests.vehicles.model} {nextAppointment.service_requests.vehicles.year}</span>
                                                        </>
                                                    )
                                                    : 'UNIDAD_DESCONOCIDA'
                                                }
                                            </h3>
                                            <div className="flex items-center gap-8">
                                                {nextAppointment.service_requests?.vehicles?.license_plate && (
                                                    <p className="text-[14px] font-black uppercase tracking-[0.6em] italic text-primary bg-primary/5 px-6 py-2 rounded-lg border border-primary/20">PLACA: [{nextAppointment.service_requests.vehicles.license_plate}]</p>
                                                )}
                                                <div className="flex-1 h-[1px] bg-white/5"></div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="w-full md:w-auto p-8 md:p-10 bg-slate-900/50 rounded-3xl shadow-3xl border border-white/5 flex flex-col items-center justify-center gap-4 group-hover:bg-primary transition-all duration-700 group-hover:scale-105 group-hover:-rotate-2">
                                        <div className="flex items-center gap-4 mb-2">
                                            <Clock size={20} className="text-primary group-hover:text-slate-900" />
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] group-hover:text-slate-900/60 italic">Arribo Estimado</span>
                                        </div>
                                        <div className="text-4xl md:text-5xl font-black text-white italic tracking-tighter leading-none group-hover:text-slate-950 transition-colors">
                                            {new Date(nextAppointment.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                        </div>
                                        <div className="flex gap-3 mt-6">
                                            <div className="w-12 h-2.5 bg-primary rounded-full group-hover:bg-slate-950 transition-colors"></div>
                                            <div className="w-2.5 h-2.5 bg-white/10 rounded-full group-hover:bg-slate-950 transition-colors"></div>
                                            <div className="w-2.5 h-2.5 bg-white/10 rounded-full group-hover:bg-slate-950 transition-colors"></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10 border-t border-white/5">
                                    <div className="relative p-8 bg-white/5 rounded-3xl border border-white/5 group-hover:bg-white/10 transition-all duration-700 overflow-hidden flex items-center gap-6">
                                        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-primary shadow-3xl border border-white/5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 shrink-0">
                                            <Wrench size={32} />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[12px] font-black text-slate-600 uppercase tracking-[0.5em] italic mb-1 flex items-center gap-4">
                                               Protocolo <div className="w-6 h-[1px] bg-primary/40"></div>
                                            </p>
                                            <p className="text-xl font-black text-white uppercase tracking-tighter leading-tight italic">
                                                {nextAppointment.service_requests?.service_catalog?.name || 'Misión Estándar'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="relative p-8 bg-white/5 rounded-3xl border border-white/5 group-hover:bg-white/10 transition-all duration-700 overflow-hidden flex items-center gap-6">
                                        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-emerald-500 shadow-3xl border border-white/5 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700 shrink-0">
                                            <Navigation size={32} />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[12px] font-black text-slate-600 uppercase tracking-[0.5em] italic mb-1 flex items-center gap-4">
                                               Ubicación <div className="w-6 h-[1px] bg-emerald-500/40"></div>
                                            </p>
                                            <p className="text-xl font-black text-white leading-[0.9] uppercase italic tracking-tighter">
                                                {nextAppointment.address} <br />
                                                <span className="text-xs font-bold text-slate-500 tracking-widest mt-2 block">{nextAppointment.city}, {nextAppointment.state}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900/80 p-8 xl:w-[320px] flex flex-col justify-center gap-8 relative overflow-hidden xl:border-l-2 border-white/5 shrink-0 backdrop-blur-3xl">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-30 pointer-events-none" />
                                
                                <div className="space-y-10 relative z-10">
                                    <div className="p-6 bg-white/5 backdrop-blur-3xl rounded-[2rem] border border-white/5 space-y-4 transition-all duration-700 hover:bg-white/10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-slate-950 shadow-2xl shadow-primary/30">
                                                <Signal size={24} className="animate-pulse" />
                                            </div>
                                            <p className="text-[11px] font-black uppercase text-primary tracking-[0.5em] italic">Vector activo</p>
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-xl text-white font-black tracking-tight leading-none uppercase italic">
                                                {profile?.address_line1 || 'CENTRAL_DENVER'}
                                            </p>
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{profile?.city || 'STORAGE_7'}</span>
                                                <div className="h-[1px] flex-1 bg-white/10"></div>
                                                <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        <Button 
                                            onClick={startRoute}
                                            size="lg"
                                            className="w-full h-16 rounded-[1.2rem] font-black text-[13px] uppercase tracking-[0.4em] bg-primary hover:bg-white text-slate-950 shadow-3xl shadow-primary/20 transition-all duration-700 flex items-center justify-center gap-4 border-none group/launch active:scale-95"
                                        >
                                            <Navigation size={22} className="group-hover/launch:-translate-y-1 group-hover/launch:translate-x-1 transition-transform duration-700" /> 
                                            <span className="italic leading-none pt-1">TRANSITO</span>
                                        </Button>
                                        
                                        <Link to={`/tech/requests/${nextAppointment.request_id}`} className="block group/link">
                                            <div className="w-full h-16 rounded-[1.2rem] flex items-center justify-center gap-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-700 shadow-inner">
                                                <span className="text-[11px] font-bold uppercase tracking-[0.5em] text-slate-500 group-hover/link:text-white transition-colors italic leading-none pt-1">EXPEDIENTE</span>
                                                <ArrowUpRight size={20} className="text-slate-700 group-hover:text-primary transition-all duration-700" />
                                            </div>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="py-24 text-center bg-white/5 backdrop-blur-2xl rounded-[3rem] border-2 border-dashed border-white/5 flex flex-col items-center gap-10 group transition-all duration-1000 hover:border-white/10">
                         <div className="relative">
                            <div className="w-56 h-56 bg-white/5 rounded-[3rem] shadow-3xl flex items-center justify-center text-slate-800 border border-white/10 rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-all duration-1000 group-hover:text-emerald-500">
                                <Calendar size={48} className="opacity-20 transition-opacity group-hover:opacity-100" />
                            </div>
                            <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-slate-900 rounded-[2.5rem] border border-white/10 flex items-center justify-center text-white shadow-3xl animate-in fade-in zoom-in duration-1000">
                                <CheckCircle2 size={56} className="text-emerald-500 shadow-emerald-500/50 shadow-2xl" />
                            </div>
                         </div>
                        <div className="space-y-6 max-w-xl mx-auto px-10">
                            <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">MISIONES COMPLETADAS</h3>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.5em] leading-relaxed italic opacity-80">
                                EL SECTOR SE ENCUENTRA DESPEJADO. AGUARDANDO NUEVAS DIRECTRICES DESDE LA CENTRAL Denver_Michigan.
                            </p>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}

