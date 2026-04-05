import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Calendar, MapPin, Wrench, User, Hash, ArrowRight, Clock } from 'lucide-react';

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

            // Filtro inteligente: Mostrar solo activos y evitar duplicados por request_id
            const uniqueRequests: any[] = [];
            const seenIds = new Set();
            
            (data || []).forEach(appt => {
                const rid = appt.service_requests?.id;
                const rStatus = appt.service_requests?.status;
                const aStatus = appt.status;

                // Definimos estados "muertos" que no deben mostrarse
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
            toast({ title: 'Error', description: 'No se pudieron cargar los servicios.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAppointments();
    }, [user]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Sincronizando Denver...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-10 animate-in">
            <header className="space-y-2">
                <h1 className="text-4xl font-black italic uppercase tracking-tighter italic">Mis Servicios Asignados</h1>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em]">Agenda de Trabajo Denver Mobile</p>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {appointments.length === 0 ? (
                    <Card className="p-20 rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
                        <Wrench size={48} className="text-slate-200 mb-6" />
                        <h3 className="text-xl font-black uppercase italic text-slate-400 leading-tight">No tienes servicios activos <br /> en tu agenda actual</h3>
                    </Card>
                ) : (
                    appointments.map((appt) => (
                        <Card key={appt.id} className="group p-0 rounded-[3rem] border-none shadow-xl shadow-slate-100 overflow-hidden hover:shadow-2xl hover:scale-[1.01] transition-all duration-500">
                            <div className="flex flex-col md:flex-row">
                                {/* Lateral Informativo */}
                                <div className="bg-slate-900 md:w-48 p-8 flex flex-col justify-center items-center text-white text-center gap-2">
                                    <Clock size={24} className="text-indigo-400 mb-2" />
                                    <p className="font-black text-2xl tracking-tighter leading-none italic">
                                        {new Date(appt.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                                        {new Date(appt.scheduled_start).toLocaleDateString()}
                                    </p>
                                </div>

                                {/* Contenido Principal */}
                                <div className="flex-1 p-8 md:p-10 space-y-6 flex flex-col justify-center">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Badge className="bg-indigo-600 px-4 py-1 text-[10px] font-black uppercase tracking-widest italic">{appt.status}</Badge>
                                        <span className="text-xs font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-2">
                                            <Hash size={12} /> TICKET #{appt.service_requests?.ticket_number || 'S/N'}
                                        </span>
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
                                            {appt.service_requests?.vehicles ? `${appt.service_requests.vehicles.make} ${appt.service_requests.vehicles.model}` : 'Vehículo Denver'}
                                        </h3>
                                        <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                                            <User size={12} className="text-indigo-600" /> Cliente de Denver Mobile
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-6 pt-4 border-t border-slate-50">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Wrench size={16} className="text-indigo-600" />
                                            <span className="font-bold uppercase tracking-tighter">{appt.service_requests?.service_catalog?.name || 'Inspección'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <MapPin size={16} className="text-indigo-600" />
                                            <span className="font-medium">{appt.address}, {appt.city}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Botón Acción */}
                                <div className="p-8 flex items-center justify-center bg-slate-50 md:border-l border-slate-100">
                                    <Link to={`/tech/requests/${appt.request_id}`} className="w-full md:w-auto">
                                        <Button className="h-16 px-10 rounded-[2rem] font-black text-xs uppercase tracking-widest bg-indigo-600 hover:bg-slate-900 shadow-xl shadow-indigo-100 group-hover:translate-x-2 transition-all">
                                            TRABAJAR <ArrowRight size={18} className="ml-3" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
