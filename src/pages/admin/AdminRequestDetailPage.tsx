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
        <div className="space-y-8 pb-20 animate-in">
            <div className="flex items-center gap-4">
                <Link to="/admin/requests">
                    <Button variant="ghost" size="icon" className="rounded-full bg-white shadow hover:bg-indigo-50">
                        <ArrowLeft size={20} className="text-indigo-600" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 leading-tight">Solicitud #{request.ticket_number || 'S/N'}</h1>
                    <p className="text-xs font-bold text-slate-400">Panel de Control de Emergencia (Admin Only)</p>
                </div>
                <Badge className={`ml-auto font-black px-4 h-8 text-[11px] uppercase tracking-widest ${request.status === 'COMPLETED' ? 'bg-green-500' :
                        request.status === 'DECLINED' ? 'bg-red-500' : 'bg-indigo-600 pulse-slow'
                    }`}>
                    {request.status}
                </Badge>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Information and Main Controls */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Client details */}
                        <Card className="rounded-3xl shadow-sm border-slate-100 overflow-hidden">
                            <CardHeader className="bg-slate-50 py-3 border-b border-slate-100">
                                <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <User size={14} className="text-indigo-600" /> Datos del Propietario
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <h3 className="text-lg font-black text-slate-900">{request.profiles?.first_name} {request.profiles?.last_name}</h3>
                                <p className="text-sm font-medium text-slate-500">{request.profiles?.email}</p>
                                <p className="text-sm font-bold text-indigo-600 mt-2">{request.profiles?.phone}</p>
                            </CardContent>
                        </Card>

                        {/* Vehicle details */}
                        <Card className="rounded-3xl shadow-sm border-slate-100 overflow-hidden">
                            <CardHeader className="bg-slate-50 py-3 border-b border-slate-100">
                                <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <CarFront size={14} className="text-indigo-600" /> Identificación del Vehículo
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <h3 className="text-lg font-black text-slate-900">{request.vehicles?.year} {request.vehicles?.make}</h3>
                                <p className="text-sm font-bold text-slate-500 uppercase">{request.vehicles?.model} {request.vehicles?.trim}</p>
                                <p className="text-xs font-medium text-slate-400 mt-2 italic">Odometer: {request.vehicles?.odometer} miles</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Symptoms & Triage */}
                    <Card className="rounded-3xl shadow-sm border-slate-100 overflow-hidden border-2 border-dashed border-slate-200">
                        <CardHeader className="bg-slate-50 py-3 border-b border-slate-100">
                            <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                <FileText size={14} className="text-amber-500" /> Diagnóstico Capturado
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <p className="text-slate-700 font-bold mb-4">{request.symptoms_free_text || 'Sin texto de síntomas.'}</p>
                            <div className="flex flex-wrap gap-2">
                                {request.symptom_tags?.map((t: string) => (
                                    <Badge key={t} className="bg-slate-100 text-slate-600 border-slate-200 font-bold">{t}</Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Admin Override Area */}
                    <Card className="rounded-3xl border-2 border-red-100 bg-red-50/20 shadow-none overflow-hidden">
                        <CardHeader className="bg-red-50 py-3 border-b border-red-100">
                            <CardTitle className="text-[10px] font-black uppercase text-red-500 tracking-widest flex items-center gap-2">
                                <ShieldAlert size={14} /> Controles Críticos de Administrador
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 flex flex-wrap gap-4">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => forceStatus('DRAFT')} 
                                className="text-[10px] h-10 font-bold bg-white text-slate-800 hover:bg-slate-50 border-2 border-slate-200 flex-1 min-w-[120px] transition-all"
                            >
                                <History size={14} className="mr-2" /> FORZAR DRAFT
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => forceStatus('SCHEDULED')} 
                                className="text-[10px] h-10 font-bold bg-white text-blue-600 hover:bg-blue-600 hover:text-white border-2 border-blue-100 flex-1 min-w-[120px] transition-all"
                            >
                                <Calendar size={14} className="mr-2" /> FORZAR AGENDADO
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => forceStatus('COMPLETED')} 
                                className="text-[10px] h-10 font-bold bg-white text-emerald-600 hover:bg-emerald-600 hover:text-white border-2 border-emerald-100 flex-1 min-w-[120px] transition-all"
                            >
                                <CheckCircle size={14} className="mr-2" /> FORZAR COMPLETADO
                            </Button>
                            <Button 
                                variant="dark" 
                                size="sm" 
                                onClick={() => forceStatus('DECLINED')} 
                                className="text-[10px] h-10 font-bold bg-rose-600 text-white hover:bg-rose-700 flex-1 min-w-[120px] transition-all border-none"
                            >
                                <XCircle size={14} className="mr-2" /> CANCELAR / RECHAZAR
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Side History / Logs */}
                <div className="space-y-6">
                    {/* Active Appointment Status */}
                    <Card className="rounded-3xl shadow-xl shadow-indigo-100/50 border-indigo-100 overflow-hidden">
                        <CardHeader className="bg-indigo-600 py-4 text-white">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={14} /> Información de Cita
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {appointment ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                                                <History size={18} />
                                            </div>
                                             <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Programado para</p>
                                                <p className="text-xs font-black text-slate-800">{new Date(appointment.scheduled_start).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 p-3 bg-blue-50/50 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <Wrench className="text-blue-600" size={18} />
                                            <div>
                                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">Asignado a</p>
                                                <p className="text-xs font-black text-blue-800">
                                                    {appointment.assigned_tech_user_id ? `${techs.find(t => t.user_id === appointment.assigned_tech_user_id)?.first_name || 'Técnico'} ${techs.find(t => t.user_id === appointment.assigned_tech_user_id)?.last_name || ''}` : 'SIN ASIGNAR'}
                                                </p>
                                            </div>
                                        </div>
                                        <select 
                                            className="w-full text-[10px] font-bold h-10 rounded-xl bg-white border-blue-200 border-2 text-blue-900 focus:ring-0 shadow-sm"
                                            value={appointment.assigned_tech_user_id || ""}
                                            onChange={(e) => assignTechnician(e.target.value)}
                                        >
                                            <option value="" disabled>Elegir Técnico por Ubicación...</option>
                                            {techs.map(t => (
                                                <option key={t.user_id} value={t.user_id}>
                                                    {t.first_name} {t.last_name} ({t.city || 'Sin ciudad'}, {t.zip || 'No Zip'})
                                                </option>
                                            ))}
                                        </select>
                                        {appointment.assigned_tech_user_id && (
                                            <p className="text-[10px] text-slate-500 font-medium px-1 mt-1 bg-white p-2 rounded-lg border border-slate-100 italic">
                                                Partida: {techs.find(t => t.user_id === appointment.assigned_tech_user_id)?.address_line1 || 'No registrada'} 
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="text-center p-4 border-2 border-dashed border-slate-100 rounded-3xl">
                                        <Clock className="mx-auto text-slate-200 mb-2" size={32} />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Sin Agenda Activa</p>
                                        <p className="text-xs text-slate-500 mt-1 italic">Esta solicitud está en borrador o no tiene fecha asignada.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase ml-1">Asignar Técnico y Programar (Admin)</p>
                                        <select 
                                            id="new-tech-select"
                                            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-bold bg-slate-50"
                                            defaultValue=""
                                        >
                                            <option value="">Opcional: Seleccionar Técnico</option>
                                            {techs.map(t => <option key={t.user_id} value={t.user_id}>{t.first_name} {t.last_name}</option>)}
                                        </select>
                                        <Button 
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold"
                                            onClick={() => {
                                                const sel = document.getElementById('new-tech-select') as HTMLSelectElement;
                                                createAppointment(sel.value);
                                            }}
                                        >
                                            AGENDAR Y ASIGNAR AHORA
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Full Audit Logs */}
                    <Card className="rounded-3xl shadow-sm border-slate-100 overflow-hidden bg-slate-900 text-slate-200">
                        <CardHeader className="bg-slate-800 py-3 border-b border-slate-700 flex flex-row items-center justify-between">
                            <CardTitle className="text-[10px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2">
                                <ShieldAlert size={14} /> Auditoría Total
                            </CardTitle>
                            <span className="text-[10px] font-black bg-indigo-500/20 text-indigo-400 px-2 rounded-full">{auditLogs.length} EVENTOS</span>
                        </CardHeader>
                        <CardContent className="p-0 max-h-[500px] overflow-y-auto">
                            {auditLogs.map((log) => (
                                <div key={log.id} className="p-4 border-b border-slate-800 last:border-0 hover:bg-slate-800/50 transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[10px] font-black uppercase tracking-tight ${log.action.includes('ADMIN') ? 'text-amber-400' : 'text-indigo-400'}`}>
                                            {log.action.replace(/_/g, ' ')}
                                        </span>
                                        <span className="text-[9px] font-medium text-slate-500">
                                            {new Date(log.created_at).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-normal mb-1">
                                        Entidad ID: {log.entity_id}
                                    </p>
                                    {log.details && (
                                        <div className="bg-black/30 p-2 rounded text-[9px] font-mono text-slate-500 overflow-x-auto">
                                            {JSON.stringify(log.details)}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {auditLogs.length === 0 && (
                                <div className="text-center py-10 text-slate-600 uppercase font-black text-[10px] tracking-widest italic animate-pulse">
                                    No hay registros de auditoría.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
