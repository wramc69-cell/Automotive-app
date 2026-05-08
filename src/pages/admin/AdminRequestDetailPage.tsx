import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
    ArrowLeft, User, CarFront, FileText,
    Calendar, History, ShieldAlert, CheckCircle,
    XCircle, Clock, Wrench
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { useToast } from '../../components/ui/Toast';

export function AdminRequestDetailPage() {
    const { id } = useParams();
    const { toast } = useToast();
    const [request, setRequest] = useState<any>(null);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [techs, setTechs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDetail();
    }, [id]);

    async function loadDetail() {
        setLoading(true);
        try {
            // Using supabaseAdmin to bypass RLS for detailed administrative view
            const { data: req, error: reqError } = await supabaseAdmin
                .from('service_requests')
                .select('*, profiles(*), vehicles(*), appointments(*), inspections(*), quotes(*)')
                .eq('id', id)
                .single();
            
            if (reqError) throw reqError;
            setRequest(req);

            const { data: techData } = await supabaseAdmin
                .from('profiles')
                .select('*')
                .eq('role', 'TECH')
                .order('first_name');
            setTechs(techData || []);

            const { data: logs, error: logError } = await supabaseAdmin
                .from('audit_logs')
                .select('*')
                .eq('entity_id', id)
                .order('created_at', { ascending: false });
            
            if (logError) throw logError;
            setAuditLogs(logs || []);
        } catch (err) {
            console.error('Error loadDetail Admin:', err);
        } finally {
            setLoading(false);
        }
    }

    async function assignTechnician(techId: string) {
        if (!request.appointments?.[0]?.id) return;
        const appointmentId = request.appointments[0].id;
        
        const { error } = await supabaseAdmin
            .from('appointments')
            .update({ assigned_tech_user_id: techId })
            .eq('id', appointmentId);
        
        if (error) {
            alert(error.message);
        } else {
            loadDetail();
        }
    }

    async function createAppointment(techId: string = '') {
        try {
            // 1. Create the appointment record
            const { data: newApp, error: appError } = await supabaseAdmin
                .from('appointments')
                .insert({
                    request_id: id,
                    scheduled_start: new Date().toISOString(),
                    scheduled_end: new Date(new Date().getTime() + 2*3600000).toISOString(),
                    address: request.address || 'Address on file',
                    city: request.city || 'Denver',
                    state: 'CO',
                    zip: request.zip || '80202',
                    status: 'SCHEDULED',
                    assigned_tech_user_id: techId || null
                })
                .select()
                .single();

            if (appError) throw appError;

            // 2. Update the request status
            const { error: reqError } = await supabaseAdmin
                .from('service_requests')
                .update({ status: 'SCHEDULED' })
                .eq('id', id);

            if (reqError) throw reqError;

            toast({ title: 'Cita Creada', description: 'Se ha generado la cita y actualizado el estado.', type: 'success' });
            loadDetail();
        } catch (err: any) {
            console.error('Error createAppointment:', err);
            alert(err.message);
        }
    }

    async function forceStatus(newStatus: string) {
        if (!confirm(`¿Forzar estado a ${newStatus}? Se registrará en la auditoría.`)) return;

        // 1. Update Request Status
        await supabaseAdmin.from('service_requests').update({ status: newStatus }).eq('id', id);

        // 2. Sync Appointment Status if it's a cancellation
        if (newStatus === 'DECLINED' || newStatus === 'CANCELED') {
            await supabaseAdmin
                .from('appointments')
                .update({ status: 'CANCELED' })
                .eq('request_id', id);
        }

        // Log manual intervention
        const { data: { user } } = await supabase.auth.getUser();
        await supabaseAdmin.from('audit_logs').insert({
            entity_type: 'SERVICE_REQUEST',
            entity_id: id,
            action: `ADMIN_FORCE_STATUS_${newStatus}`,
            actor_user_id: user?.id,
            details: { previous_status: request.status }
        });

        loadDetail();
    }

    if (loading) return <div className="p-10 text-indigo-600 font-black italic animate-bounce">Expediente Secreto Admin...</div>;
    if (!request) return <div className="p-10 text-center">Solicitud no encontrada.</div>;

    const appointment = request.appointments?.[0];

    return (
        <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-1000 font-inter max-w-7xl mx-auto px-4">
            
            {/* Cabecera de Control Táctico */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative">
                <div className="flex items-center gap-8">
                    <Link to="/admin/requests">
                        <Button variant="ghost" size="icon" className="w-16 h-16 rounded-[2rem] bg-white shadow-3xl shadow-slate-200/50 hover:bg-primary hover:text-white transition-all group">
                            <ArrowLeft size={28} className="group-hover:-translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                    <div className="space-y-2">
                        <div className="flex items-center gap-4">
                            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-slate-900 leading-none uppercase">
                                EXPEDIENTE <span className="text-primary">#{request.ticket_number || 'S/N'}</span>
                            </h1>
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[10px] flex items-center gap-2 italic">
                            <span className="w-10 h-[1px] bg-slate-200" /> TERMINAL DE CONTROL CENTRAL
                        </p>
                    </div>
                </div>
                <Badge className={`px-8 h-12 text-[11px] font-black tracking-[0.3em] uppercase rounded-full border-none shadow-2xl italic ${
                    request.status === 'COMPLETED' ? 'bg-emerald-500 text-white' :
                    request.status === 'DECLINED' || request.status === 'CANCELED' ? 'bg-rose-500 text-white' :
                    request.status === 'APPROVED' ? 'bg-indigo-600 text-white' :
                    request.status === 'SCHEDULED' ? 'bg-primary text-white animate-pulse' :
                    request.status === 'QUOTED' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                    ESTADO: {request.status}
                </Badge>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                {/* Columna Principal: Inteligencia de Activos */}
                <div className="xl:col-span-8 space-y-10">
                    
                    {/* Tarjetas de Información en Paralelo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Cliente */}
                        <Card className="rounded-[2.5rem] border-none shadow-3xl shadow-slate-200/40 overflow-hidden bg-white group hover:shadow-primary/10 transition-all duration-700">
                            <CardHeader className="bg-slate-900 p-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 blur-3xl rounded-full"></div>
                                <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] flex items-center gap-4 italic relative z-10">
                                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-primary"><User size={20} /></div> 
                                    PROPIETARIO DEL ACTIVO
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-10 space-y-4">
                                <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter group-hover:text-primary transition-colors">{request.profiles?.first_name} {request.profiles?.last_name}</h3>
                                <div className="flex flex-col gap-2">
                                    <p className="text-sm font-bold text-slate-400 font-mono lower-case">{request.profiles?.email}</p>
                                    <p className="text-lg font-black text-slate-900 tracking-widest">{request.profiles?.phone}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Vehículo */}
                        <Card className="rounded-[2.5rem] border-none shadow-3xl shadow-slate-200/40 overflow-hidden bg-white group hover:shadow-primary/10 transition-all duration-700">
                            <CardHeader className="bg-slate-900 p-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 blur-3xl rounded-full"></div>
                                <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] flex items-center gap-4 italic relative z-10">
                                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-primary"><CarFront size={20} /></div> 
                                    ESPECIFICACIONES TÉCNICAS
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-10 space-y-4">
                                <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter group-hover:text-primary transition-colors">{request.vehicles?.year} {request.vehicles?.make}</h3>
                                <div className="flex flex-col gap-2">
                                    <p className="text-sm font-black text-slate-500 uppercase tracking-widest">{request.vehicles?.model} {request.vehicles?.trim}</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">{request.vehicles?.odometer?.toLocaleString()} MILLAS TOTALES</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Reporte de Síntomas */}
                    <Card className="rounded-[2.5rem] border-none shadow-3xl shadow-slate-200/40 overflow-hidden bg-white group border-l-8 border-primary">
                        <CardHeader className="p-10 pb-4">
                            <CardTitle className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em] flex items-center gap-4 italic">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-primary shadow-inner"><FileText size={24} /></div> 
                                DIAGNÓSTICO PRELIMINAR DEL CLIENTE
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-10 pt-6 space-y-8">
                            <div className="bg-slate-50/80 p-8 rounded-[2.5rem] border border-slate-100">
                                <p className="text-xl font-bold text-slate-700 italic leading-relaxed">"{request.symptoms_free_text || 'Sin texto de síntomas descriptivo.'}"</p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {request.symptom_tags?.map((t: string) => (
                                    <Badge key={t} className="bg-white text-slate-900 border-2 border-slate-100 px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest italic shadow-sm group-hover:border-primary transition-colors">{t}</Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Controles Maestros (Admin Override) */}
                    <Card className="rounded-[2.5rem] border-none shadow-3xl shadow-rose-200/20 overflow-hidden bg-rose-50/30 group">
                        <CardHeader className="bg-rose-500 p-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full"></div>
                            <CardTitle className="text-[11px] font-black uppercase text-white tracking-[0.5em] flex items-center gap-4 italic relative z-10">
                                <ShieldAlert size={24} className="animate-pulse" /> PROTOCOLO DE INTERVENCIÓN MANUAL
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Button 
                                variant="outline" 
                                onClick={() => forceStatus('DRAFT')} 
                                className="h-20 rounded-[1.5rem] bg-white border-2 border-slate-200 hover:border-slate-900 text-[10px] font-black uppercase tracking-widest italic transition-all group/btn"
                            >
                                <History size={20} className="mr-3 text-slate-400 group-hover/btn:text-slate-900" /> REINICIAR DRAFT
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={() => forceStatus('SCHEDULED')} 
                                className="h-20 rounded-[1.5rem] bg-white border-2 border-blue-100 hover:border-blue-600 text-blue-600 text-[10px] font-black uppercase tracking-widest italic transition-all group/btn"
                            >
                                <Calendar size={20} className="mr-3 group-hover/btn:scale-110" /> FORZAR AGENDADO
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={() => forceStatus('COMPLETED')} 
                                className="h-20 rounded-[1.5rem] bg-white border-2 border-emerald-100 hover:border-emerald-600 text-emerald-600 text-[10px] font-black uppercase tracking-widest italic transition-all group/btn"
                            >
                                <CheckCircle size={20} className="mr-3 group-hover/btn:scale-110" /> FORZAR COMPLETADO
                            </Button>
                            <Button 
                                variant="dark" 
                                onClick={() => forceStatus('DECLINED')} 
                                className="h-20 rounded-[1.5rem] bg-rose-600 hover:bg-rose-700 text-white border-none text-[10px] font-black uppercase tracking-widest italic transition-all shadow-xl shadow-rose-200"
                            >
                                <XCircle size={20} className="mr-3" /> ANULAR SERVICIO
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Columna Lateral: Logística y Auditoría */}
                <div className="xl:col-span-4 space-y-10">
                    
                    {/* Panel de Asignación Logística */}
                    <Card className="rounded-[2.5rem] border-none shadow-3xl shadow-primary/10 overflow-hidden bg-white group">
                        <CardHeader className="bg-primary p-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 blur-3xl rounded-full"></div>
                            <CardTitle className="text-[11px] font-black uppercase text-white tracking-[0.4em] flex items-center gap-4 italic relative z-10">
                                <Calendar size={20} /> DESPLIEGUE TÉCNICO
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-10 space-y-8">
                            {appointment ? (
                                <div className="space-y-8">
                                    <div className="flex flex-col gap-4 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 relative group/item">
                                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover/item:opacity-20 transition-opacity">
                                            <Wrench size={40} />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">PERSONAL ASIGNADO</p>
                                        <p className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
                                            {appointment.assigned_tech_user_id ? `${techs.find(t => t.user_id === appointment.assigned_tech_user_id)?.first_name || 'Agente'} ${techs.find(t => t.user_id === appointment.assigned_tech_user_id)?.last_name || ''}` : 'SIN RECURSO ASIGNADO'}
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]"></div>
                                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest italic">{appointment.status}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] ml-2 italic">REASIGNAR OPERADOR</p>
                                        <select 
                                            className="w-full h-16 rounded-2xl bg-white border-2 border-slate-100 text-[11px] font-black uppercase tracking-widest italic px-6 focus:ring-4 focus:ring-primary/5 transition-all outline-none appearance-none cursor-pointer"
                                            value={appointment.assigned_tech_user_id || ""}
                                            onChange={(e) => assignTechnician(e.target.value)}
                                        >
                                            <option value="" disabled>SELECCIONAR AGENTE TÉCNICO...</option>
                                            {techs.map(t => (
                                                <option key={t.user_id} value={t.user_id}>
                                                    {t.first_name.toUpperCase()} {t.last_name.toUpperCase()} (ZIP: {t.zip || '---'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="p-8 bg-slate-900 rounded-[2.5rem] shadow-xl">
                                        <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em] mb-4 italic">CRONOGRAMA DE OPERACIÓN</p>
                                        <div className="flex items-center gap-4 text-white">
                                            <Clock size={24} className="text-primary" />
                                            <div className="space-y-1">
                                                <p className="text-lg font-black tracking-tighter leading-none">{new Date(appointment.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(appointment.scheduled_start).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' }).toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 space-y-8 bg-slate-50 rounded-[2.5rem] border-4 border-dashed border-slate-100">
                                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-200 mx-auto shadow-inner">
                                        <Calendar size={40} />
                                    </div>
                                    <div className="space-y-4 px-6">
                                        <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-400 leading-tight">SIN AGENDA OPERATIVA</h3>
                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-relaxed">ESTE EXPEDIENTE REQUIERE PROGRAMACIÓN DE CITA Y ASIGNACIÓN DE TÉCNICO PARA INICIAR EL FLUJO.</p>
                                        <Button 
                                            className="w-full bg-primary hover:bg-primary/90 text-white h-16 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] italic shadow-xl shadow-primary/20"
                                            onClick={() => createAppointment()}
                                        >
                                            INICIAR PROGRAMACIÓN
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Auditoría de Terminal Digital */}
                    <Card className="rounded-[2.5rem] border-none shadow-3xl shadow-slate-900/40 overflow-hidden bg-slate-950 text-slate-400 font-mono">
                        <CardHeader className="bg-slate-900 p-8 border-b border-slate-800 flex flex-row items-center justify-between">
                            <CardTitle className="text-[9px] font-black uppercase text-primary tracking-[0.5em] flex items-center gap-4 italic relative z-10">
                                <ShieldAlert size={18} /> LOG_TERMINAL_RT
                            </CardTitle>
                            <span className="text-[9px] font-bold bg-white/5 text-slate-500 px-4 py-1.5 rounded-full border border-white/5 tracking-[0.2em]">{auditLogs.length} EVENTOS</span>
                        </CardHeader>
                        <CardContent className="p-0 max-h-[450px] overflow-y-auto scrollbar-hide text-[10px]">
                            {auditLogs.map((log) => (
                                <div key={log.id} className="p-8 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors relative group/log">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`font-black uppercase tracking-widest ${log.action.includes('ADMIN') ? 'text-amber-500' : 'text-primary'}`}>
                                            [{log.action.replace(/_/g, ' ')}]
                                        </span>
                                        <span className="text-slate-600 font-bold">
                                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-slate-500 font-bold truncate">ENTITY_ID: <span className="text-slate-300">{log.entity_id}</span></p>
                                        {log.details && (
                                            <div className="bg-black/40 p-6 rounded-2xl text-[9px] text-slate-500 overflow-x-auto border border-white/5 group-hover/log:border-primary/20 transition-colors">
                                                <pre className="whitespace-pre-wrap">{JSON.stringify(log.details, null, 2)}</pre>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {auditLogs.length === 0 && (
                                <div className="text-center py-20 text-slate-700 uppercase font-black text-[9px] tracking-[0.6em] italic animate-pulse">
                                    [ESPERANDO_TELEMETRIA_SISTEMA]
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
