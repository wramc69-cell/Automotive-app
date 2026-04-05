import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Wrench, MapPin, Calendar, Star, TrendingUp, Clock, Navigation, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export function TechDashboardPage() {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [nextAppointment, setNextAppointment] = useState<any>(null);
    const [stats, setStats] = useState([
        { label: 'Visitas Hoy', value: '0', sub: 'Servicios', icon: <Calendar className="text-blue-500" />, color: 'bg-blue-500' },
        { label: 'Completados', value: '0', sub: 'Este mes', icon: <TrendingUp className="text-emerald-500" />, color: 'bg-emerald-500' },
        { label: 'Calificación', value: '5.0', sub: 'Excelente', icon: <Star className="text-amber-500" />, color: 'bg-amber-500' },
        { label: 'Tiempo Prom.', value: '--h', sub: 'Por servicio', icon: <Clock className="text-indigo-500" />, color: 'bg-indigo-500' },
    ]);

    useEffect(() => {
        if (user) {
            loadDashboardData();
        }
    }, [user]);

    async function loadDashboardData() {
        setLoading(true);
        try {
            // 1. Fetch Next/Current Appointment (Ignoring Canceled Parent Requests)
            const { data: apptData, error: apptError } = await supabase
                .from('appointments')
                .select(`
                    *,
                    service_requests!inner (
                        id,
                        ticket_number,
                        status,
                        vehicles (year, make, model),
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

            // 2. Fetch stats (Excluding Canceled)
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

            // Contar servicios del mes por service_requests.status = COMPLETED
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

        // Helper: removes any segment that looks like an email (contains @)
        const clean = (val: string | null | undefined) =>
            val && !val.includes('@') ? val.trim() : '';

        const appt = nextAppointment;
        const parts = [
            clean(appt.address),
            clean(appt.city),
            clean(appt.state),
            clean(appt.zip),
        ].filter(Boolean);
        const destination = parts.join(', ');

        const originParts = [
            clean(profile?.address_line1),
            clean(profile?.city),
            clean(profile?.state),
            clean(profile?.zip),
        ].filter(Boolean);
        const origin = originParts.join(', ');

        if (!destination) {
            alert('No hay dirección de destino registrada para este servicio.');
            return;
        }

        const mapUrl = origin
            ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
            : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
            
        window.open(mapUrl, '_blank');
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">Cargando tu agenda...</p>
            </div>
        );
    }

    if (profile?.status === 'PENDING_APPROVAL') {
        return (
            <div className="flex items-center justify-center min-h-[70vh] px-4 animate-in fade-in zoom-in duration-500">
                <Card className="w-full max-w-xl text-center p-12 rounded-[3.5rem] shadow-2xl border-none bg-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2" />
                    <div className="w-24 h-24 bg-amber-50 rounded-[2.5rem] text-amber-500 flex items-center justify-center mx-auto mb-10 shadow-xl shadow-amber-500/10 rotate-3 border-2 border-amber-100">
                        <Clock size={48} />
                    </div>
                    <h2 className="text-4xl font-black italic tracking-tighter text-slate-900 mb-6 uppercase">Perfil en Revisión</h2>
                    <p className="text-slate-500 font-bold text-lg leading-relaxed mb-8">
                        ¡Hola <span className="text-blue-600">{profile.first_name}</span>! Estamos validando tus datos y los de tu vehículo.
                        <br /><br />
                        <span className="text-slate-400 text-sm font-medium">Recibirás una notificación por correo electrónico una vez que el administrador apruebe tu acceso.</span>
                    </p>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                        ESTADO: <span className="text-amber-600">ESPERANDO APROBACIÓN ADMIN</span>
                    </div>
                </Card>
            </div>
        );
    }

    if (profile?.status === 'REJECTED') {
        return (
            <div className="flex items-center justify-center min-h-[70vh] px-4 animate-in fade-in zoom-in duration-500">
                <Card className="w-full max-w-xl text-center p-12 rounded-[3.5rem] shadow-2xl border-none bg-white">
                    <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] text-rose-500 flex items-center justify-center mx-auto mb-10 shadow-xl shadow-rose-500/10 -rotate-3 border-2 border-rose-100">
                        <XCircle size={48} />
                    </div>
                    <h2 className="text-4xl font-black italic tracking-tighter text-slate-900 mb-6 uppercase">Acceso No Aprobado</h2>
                    <p className="text-slate-500 font-bold text-lg leading-relaxed mb-8">
                        Lamentamos informarte que tu solicitud de técnico no ha sido aprobada en este momento.
                    </p>
                    <Link to="/">
                        <Button variant="outline" className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs border-slate-200">Volver al Inicio</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in pb-20">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 text-center md:text-left">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-2">
                            ¡Buen día, <span className="text-blue-400">{profile?.first_name || 'Técnico'}</span>!
                        </h1>
                        <p className="text-slate-400 font-medium text-lg">
                            {parseInt(stats[0].value) > 0 ? (
                                <>Tienes <span className="text-white font-bold underline decoration-blue-500 decoration-4 underline-offset-4">{stats[0].value} {parseInt(stats[0].value) === 1 ? 'servicio' : 'servicios'}</span> programados para hoy.</>
                            ) : (
                                "No tienes servicios programados para hoy."
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {stats.map((stat, i) => (
                    <Card key={i} className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm hover:translate-y-[-4px] transition-all duration-300">
                        <CardContent className="p-6">
                            <div className={`w-12 h-12 ${stat.color}/10 rounded-2xl flex items-center justify-center mb-4`}>
                                {stat.icon}
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl md:text-3xl font-black text-slate-900">{stat.value}</span>
                                    <span className="text-[10px] font-bold text-slate-400">{stat.sub}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Next Service Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                        Próxima Visita
                    </h2>
                    <Link to="/tech/requests" className="text-sm font-black text-blue-600 uppercase tracking-widest hover:underline">
                        Ver Agenda Completa
                    </Link>
                </div>

                {nextAppointment ? (
                    <Card className="border-none shadow-2xl shadow-blue-900/10 overflow-hidden group">
                        <CardContent className="p-0 flex flex-col md:flex-row">
                            <div className="flex-1 p-8 md:p-10 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Badge variant="primary" className="bg-blue-600 text-[10px] font-black tracking-widest px-3 py-1 uppercase">{nextAppointment.status}</Badge>
                                            <span className="text-xs font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-widest border border-slate-200">
                                                Ticket #{nextAppointment.service_requests?.ticket_number || 'S/N'}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl md:text-3xl font-black text-slate-900 group-hover:text-blue-600 transition-colors duration-300 uppercase italic tracking-tighter">
                                            {nextAppointment.service_requests?.vehicles
                                                ? `${nextAppointment.service_requests.vehicles.year} ${nextAppointment.service_requests.vehicles.make} ${nextAppointment.service_requests.vehicles.model}`
                                                : 'Vehículo del Cliente'
                                            }
                                        </h3>
                                         <p className="text-lg text-slate-500 font-bold mt-1 uppercase">
                                            Cliente de Denver
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-black text-blue-600">
                                            {new Date(nextAppointment.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">HOY</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-blue-50/50 transition-colors duration-300">
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 shrink-0">
                                            <Wrench size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Servicio</p>
                                            <p className="text-sm font-bold text-slate-800 truncate uppercase tracking-tighter">
                                                {nextAppointment.service_requests?.service_catalog?.name || 'Diagnóstico General'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-blue-50/50 transition-colors duration-300">
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 shrink-0">
                                            <MapPin size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ubicación</p>
                                            <p className="text-sm font-bold text-slate-800 truncate">
                                                {nextAppointment.address}, {nextAppointment.city}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900 p-8 md:w-80 flex flex-col justify-center gap-4 border-t md:border-t-0 md:border-l border-white/5 relative overflow-hidden">
                                <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-600/10 blur-[50px] rounded-full translate-x-1/2 translate-y-1/2"></div>
                                
                                {profile?.address_line1 && (
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/10 mb-2">
                                        <p className="text-[9px] font-black uppercase text-blue-400 tracking-widest mb-1 flex items-center gap-1">
                                            <Navigation size={10} /> Partida (Técnico)
                                        </p>
                                        <p className="text-[10px] text-slate-300 font-bold truncate">
                                            {profile.address_line1}, {profile.city}
                                        </p>
                                    </div>
                                )}

                                <Button 
                                    onClick={startRoute}
                                    className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/20 transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Navigation size={16} /> INICIAR RUTA
                                </Button>
                                <Link to={`/tech/requests/${nextAppointment.request_id}`} className="w-full">
                                    <Button variant="outline" className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest border-white/10 text-white hover:bg-white/5 transition-all duration-300">
                                        VER DETALLES
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="p-12 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                        <Calendar className="mx-auto text-slate-300 mb-4" size={48} />
                        <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest">No hay visitas pendientes</h3>
                        <p className="text-slate-400 text-sm font-medium mt-1">Disfruta tu descanso o revisa la agenda completa.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function Badge({ children, className }: any) {
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
            {children}
        </span>
    );
}

