import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
    ArrowLeft, Download, Calendar,
    FileText, Zap, MapPin, Wrench, ShieldCheck,
    Clock, Check, X, Shield
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { TermsModal } from '../../components/ui/TermsModal';

export function RequestDetailPage() {
    const { id: requestId } = useParams();
    const { user } = useAuth();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [request, setRequest] = useState<any>(null);
    const [inspection, setInspection] = useState<any>(null);
    const [results, setResults] = useState<any[]>([]);
    const [quote, setQuote] = useState<any>(null);

    // Approval state
    const [showTerms, setShowTerms] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [signature, setSignature] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user && requestId) {
            loadData();
        }
    }, [user, requestId]);

    async function loadData() {
        setLoading(true);
        try {
            const { data: reqData, error: reqError } = await supabase
                .from('service_requests')
                .select('*, vehicles(*), service_catalog(*), appointments(*), request_symptoms(symptom_tags(*))')
                .eq('id', requestId)
                .single();

            if (reqError) throw reqError;
            setRequest(reqData);

            const { data: inspData } = await supabase
                .from('inspections')
                .select('*')
                .eq('request_id', requestId)
                .maybeSingle();

            if (inspData) {
                setInspection(inspData);
                const { data: resData } = await supabase
                    .from('inspection_results')
                    .select('*, checklist_items(*)')
                    .eq('inspection_id', inspData.id)
                    .order('created_at', { ascending: true });
                setResults(resData || []);
            }

            // Fetch Quote
            const { data: qData } = await supabase
                .from('quotes')
                .select('*, quote_items(*)')
                .eq('request_id', requestId)
                .maybeSingle();

            setQuote(qData);

        } catch (err: any) {
            console.error('Error loading request details:', err);
        } finally {
            setLoading(false);
        }
    }

    const handleApproveQuote = async () => {
        if (!acceptedTerms || !signature.trim() || !quote || !user) return;

        setSubmitting(true);
        try {
            // 1. Create Approval Record
            const { error: appError } = await supabase
                .from('quote_approvals')
                .insert({
                    quote_id: quote.id,
                    approved_by_user_id: user.id,
                    signer_full_name: signature,
                    accepted_terms: true,
                    signer_user_agent: navigator.userAgent,
                });

            if (appError) throw appError;

            // Trigger will handle quote and request status updates to 'APPROVED'

            // 2. Notification
            await supabase.from('notifications_outbox').insert({
                recipient_user_id: user.id,
                recipient: user.email || '',
                channel: 'EMAIL', // Customer usually gets confirmation on email
                template_code: 'QUOTE_APPROVED',
                payload: {
                    data: {
                        name: request.profiles?.first_name || 'Cliente',
                        vehicle: `${request.vehicles.make} ${request.vehicles.model}`
                    }
                },
                status: 'PENDING'
            });

            toast({ title: 'Presupuesto Aprobado', description: 'El técnico comenzará con la reparación.', type: 'success' });
            loadData();
        } catch (err: any) {
            console.error('Error approving:', err);
            toast({ title: 'Error', description: 'No se pudo procesar la aprobación.', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleRejectQuote = async () => {
        if (!quote || !user) return;
        const reason = window.prompt('Por favor, cuéntanos el motivo del rechazo (opcional):');

        setSubmitting(true);
        try {
            // 1. Update Status
            await supabase.from('quotes').update({ status: 'DECLINED' }).eq('id', quote.id);
            await supabase.from('service_requests').update({ status: 'DECLINED' }).eq('id', requestId);

            // 2. Notification
            await supabase.from('notifications_outbox').insert({
                recipient_user_id: user.id,
                recipient: user.email || '',
                channel: 'EMAIL',
                template_code: 'QUOTE_DECLINED',
                payload: {
                    data: {
                        name: request.profiles?.first_name || 'Cliente',
                        vehicle: `${request.vehicles.make} ${request.vehicles.model}`,
                        reason: reason || 'No especificado'
                    }
                },
                status: 'PENDING'
            });

            toast({ title: 'Presupuesto Rechazado', description: 'Lamentamos que no podamos proceder en esta ocasión.', type: 'info' });
            loadData();
        } catch (err) {
            toast({ title: 'Error', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelRequest = async () => {
        if (!window.confirm('¿Estás seguro de que deseas cancelar este servicio? Esta acción no se puede deshacer.')) return;

        setSubmitting(true);
        try {
            // Cancel Request
            await supabase.from('service_requests').update({ status: 'CANCELED' }).eq('id', requestId);

            // Cancel Appointments related
            await supabase.from('appointments').update({ status: 'CANCELED' }).eq('request_id', requestId);

            toast({ title: 'Servicio Cancelado', description: 'Tu solicitud ha sido cancelada exitosamente.', type: 'info' });
            loadData();
        } catch (err: any) {
            console.error('Error cancelling:', err);
            toast({ title: 'Error', description: 'No se pudo cancelar el servicio.', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const getTimeline = () => {
        const stages = [
            { id: 'SUBMITTED', label: 'Solicitado', description: 'Recepción inicial' },
            { id: 'SCHEDULED', label: 'Programado', description: 'Técnico asignado' },
            { id: 'DIAGNOSED', label: 'Diagnosticado', description: 'Revisión técnica' },
            { id: 'QUOTED', label: 'Presupuestado', description: 'Esperando aprobación' },
            { id: 'APPROVED', label: 'Aprobado', description: 'En reparación' },
            { id: 'COMPLETED', label: 'Completado', description: '¡Listo!' }
        ];

        // Custom index finder
        const currentIdx = stages.findIndex(s => s.id === request?.status);
        const isCanceled = request?.status === 'CANCELED';
        const isDeclined = request?.status === 'DECLINED';

        return (
            <div className="flex justify-between items-center mb-10 overflow-x-auto pb-4 gap-4 px-2">
                {stages.map((stage, idx) => {
                    const isActive = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;

                    return (
                        <div key={stage.id} className="flex flex-col items-center min-w-[80px] text-center relative">
                            {idx > 0 && (
                                <div className={`absolute top-4 right-1/2 w-full h-[2px] -z-10 ${idx <= currentIdx ? 'bg-primary' : 'bg-slate-200'}`} style={{ width: 'calc(100% + 2rem)', right: '50%' }}></div>
                            )}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isCurrent ? 'bg-primary border-primary text-white scale-110 shadow-lg shadow-primary/20' :
                                isActive ? 'bg-primary/10 border-primary text-primary' :
                                    'bg-white border-slate-200 text-slate-300'
                                }`}>
                                {isActive && !isCurrent ? <Check size={14} /> : <span>{idx + 1}</span>}
                            </div>
                            <span className={`text-[10px] font-bold mt-2 uppercase tracking-tight ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>
                                {stage.label}
                            </span>
                        </div>
                    );
                })}
                {(isCanceled || isDeclined) && (
                    <div className="flex flex-col items-center min-w-[80px] text-center">
                        <div className="w-8 h-8 rounded-full bg-destructive border-2 border-destructive text-white flex items-center justify-center">
                            <X size={14} />
                        </div>
                        <span className="text-[10px] font-bold mt-2 uppercase text-destructive tracking-tight">
                            {isCanceled ? 'CANCELADO' : 'RECHAZADO'}
                        </span>
                    </div>
                )}
            </div>
        );
    };

    if (loading) return <div className="p-20 text-center">Cargando detalles...</div>;
    if (!request) return <div className="p-20 text-center text-muted-foreground">No se encontró la solicitud.</div>;

    const categories = Array.from(new Set(results.map(r => r.checklist_items?.category)));
    const allPhotos = results.reduce((acc: string[], curr) => [...acc, ...(curr.photo_urls || [])], []);

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in pb-20 px-4">
            <Link to="/app/requests" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft size={16} className="mr-1" /> Volver a mis servicios
            </Link>

            <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        {request.vehicles?.year} {request.vehicles?.make} {request.vehicles?.model}
                        <Badge variant={request.status === 'APPROVED' ? 'success' : request.status === 'QUOTED' ? 'warning' : 'outline'}>
                            {request.status.replace('_', ' ')}
                        </Badge>
                    </h1>
                    <p className="text-muted-foreground mt-1 flex items-center gap-2">
                        <Wrench size={14} /> {request.service_catalog?.name} • Ticket ID: <span className="font-bold text-primary italic">#{request.ticket_number || 'S/N'}</span>
                    </p>
                </div>
                {inspection?.status === 'COMPLETED' && (
                    <Button variant="outline" onClick={() => window.print()}>
                        <Download size={16} className="mr-2" /> Descargar Reporte
                    </Button>
                )}
            </div>

            {getTimeline()}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Content: Quote/Diagnosis & Checklist */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Action Required: Quote Approval */}
                    {quote && quote.status === 'SENT' && (
                        <Card className="border-2 border-warning shadow-lg bg-warning/5 overflow-hidden animate-pulse-subtle">
                            <CardHeader className="bg-warning/10 border-b border-warning/20">
                                <CardTitle className="flex items-center gap-2 text-warning-foreground">
                                    <Zap size={20} /> Acción Requerida: Autorizar Reparación
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-white rounded-lg border border-warning/20">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Total del Presupuesto</p>
                                        <p className="text-3xl font-bold text-primary">${quote.grand_total.toFixed(2)}</p>
                                    </div>
                                    <div className="p-4 bg-white rounded-lg border border-warning/20">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Tiempo Estimado (ETA)</p>
                                        <p className="text-xl font-bold flex items-center gap-2">
                                            <Clock size={18} className="text-primary" />
                                            {quote.eta_hours_min}-{quote.eta_hours_max} Horas
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-1 italic">{quote.eta_notes || 'Una vez iniciados los trabajos.'}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold border-b pb-2">Desglose de Conceptos</h4>
                                    <div className="space-y-2">
                                        {quote.quote_items?.map((item: any) => (
                                            <div key={item.id} className="flex justify-between text-sm py-1 border-b border-dashed border-slate-200 last:border-0">
                                                <span>
                                                    <Badge variant="outline" className="mr-2 text-[8px] uppercase">{item.type}</Badge>
                                                    {item.description}
                                                    {item.quantity > 1 && <span className="text-muted-foreground text-[10px] ml-1">(x{item.quantity})</span>}
                                                </span>
                                                <span className={item.type === 'DISCOUNT' ? 'text-success font-bold' : ''}>
                                                    {item.type === 'DISCOUNT' ? '-' : ''}${Math.abs(item.total_price).toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between font-bold text-lg pt-2 text-slate-800">
                                        <span>Total Final</span>
                                        <span>${quote.grand_total.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Approval Form */}
                                <div className="bg-white p-6 rounded-xl border-2 border-slate-100 space-y-4">
                                    <h4 className="font-bold flex items-center gap-2">
                                        <ShieldCheck size={18} className="text-success" />
                                        Firma de Autorización
                                    </h4>

                                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                        <input
                                            type="checkbox"
                                            id="terms"
                                            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            checked={acceptedTerms}
                                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                                        />
                                        <label htmlFor="terms" className="text-xs text-slate-600 leading-tight">
                                            He leído y acepto los <button onClick={() => setShowTerms(true)} className="text-primary font-bold hover:underline">términos y condiciones</button> de Denver Mobile Auto Care. Entiendo que este es un presupuesto autorizado y el costo final puede variar si se encuentran adicionales.
                                        </label>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre Completo (Firma Digital)</label>
                                        <Input
                                            placeholder="Escribe tu nombre tal como aparece en tu identificación"
                                            value={signature}
                                            onChange={(e) => setSignature(e.target.value)}
                                            className="font-signature text-lg italic"
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            variant="destructive"
                                            className="flex-1"
                                            onClick={handleRejectQuote}
                                            disabled={submitting}
                                        >
                                            <X size={16} className="mr-2" /> Rechazar
                                        </Button>
                                        <Button
                                            className="flex-[2] bg-success hover:bg-success/90 text-white"
                                            onClick={handleApproveQuote}
                                            disabled={!acceptedTerms || !signature.trim() || submitting}
                                        >
                                            <Check size={16} className="mr-2" /> Autorizar Reparación
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Approved Quote Summary */}
                    {quote && quote.status === 'APPROVED' && (
                        <Card className="border-success bg-success/5 overflow-hidden">
                            <CardHeader className="bg-success/10 border-b border-success/20 py-3">
                                <CardTitle className="text-sm font-bold text-success-foreground flex items-center gap-2">
                                    <Shield size={16} /> Presupuesto Autorizado
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 flex justify-between items-center flex-wrap gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-bold">Total del Proyecto</p>
                                    <p className="text-2xl font-bold text-slate-800">${quote.grand_total.toFixed(2)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground uppercase font-bold">Estado</p>
                                    <Badge variant="success">TRABAJO EN PROCESO</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Diagnosis Result */}
                    {inspection?.status === 'COMPLETED' ? (
                        <Card className={`border-l-8 ${inspection.risk === 'HIGH' ? 'border-l-destructive bg-destructive/5' : inspection.risk === 'MED' ? 'border-l-amber-500 bg-amber-500/5' : 'border-l-success bg-success/5'}`}>
                            <CardHeader>
                                <div className="flex justify-between items-center mb-2">
                                    <Badge className={inspection.risk === 'HIGH' ? 'bg-destructive' : inspection.risk === 'MED' ? 'bg-amber-500' : 'bg-success'}>
                                        RIESGO: {inspection.risk}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1 italic">
                                        <ShieldCheck size={12} /> Diagnosticado por experto
                                    </span>
                                </div>
                                <CardTitle className="text-xl">Diagnóstico Técnico</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <section>
                                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Hallazgos</h4>
                                    <p className="text-slate-700 bg-white/50 p-4 rounded-lg border border-slate-100 leading-relaxed">
                                        {inspection.findings || 'No se registraron hallazgos específicos.'}
                                    </p>
                                </section>
                                <section>
                                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Recomendación & Plan</h4>
                                    <p className="text-slate-700 bg-white/50 p-4 rounded-lg border border-slate-100 leading-relaxed">
                                        {inspection.recommendations || 'No se registraron recomendaciones.'}
                                    </p>
                                </section>
                                <div className="flex items-center gap-3 p-3 bg-white/80 rounded-lg border border-slate-100 text-xs text-slate-600">
                                    <Zap size={14} className="text-amber-500" />
                                    <span><strong>Preferencia de partes:</strong> {inspection.parts_by === 'SERVICE' ? 'Nosotros suministramos las refacciones premium.' : 'Mixto/Cliente por coordinar.'}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="bg-slate-50 border-dashed">
                            <CardContent className="p-12 text-center text-muted-foreground">
                                <Wrench size={40} className="mx-auto mb-4 opacity-20" />
                                <h3 className="text-lg font-medium text-slate-600">Inspección en curso</h3>
                                <p className="text-sm max-w-xs mx-auto mt-2">Nuestro técnico está revisando tu vehículo en este momento. Te notificaremos cuando el diagnóstico esté listo.</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Simple Checklist Summary */}
                    {results.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <FileText size={20} className="text-primary" />
                                Resumen de Inspección Digital
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {categories.map(cat => (
                                    <Card key={cat} className="overflow-hidden">
                                        <div className="bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-500 border-b">
                                            {cat}
                                        </div>
                                        <CardContent className="p-3 space-y-2">
                                            {results.filter(r => r.checklist_items?.category === cat).map(r => (
                                                <div key={r.id} className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-600">{r.checklist_items?.item_name}</span>
                                                    <Badge variant={r.status === 'OK' ? 'success' : r.status === 'ISSUE' ? 'destructive' : 'outline'} className="text-[10px] px-1.5 h-5">
                                                        {r.status}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar: Media & Stats */}
                <div className="space-y-6">
                    {/* Media Gallery */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm uppercase text-slate-400">Evidencia (Fotos)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {allPhotos.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {allPhotos.map((url: string, idx: number) => (
                                        <div key={idx} className="aspect-square rounded-md overflow-hidden border bg-slate-100 cursor-pointer hover:opacity-80 transition-opacity">
                                            <img src={url} alt={`Evidencia ${idx}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-xs text-muted-foreground bg-slate-50 rounded-lg border-2 border-dashed">
                                    No hay fotos adjuntas todavía.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Service Info */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm uppercase text-slate-400">Información del Servicio</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <MapPin size={16} className="text-primary mt-1 shrink-0" />
                                <div className="text-sm">
                                    <p className="font-medium">Ubicación de Visita</p>
                                    <p className="text-muted-foreground italic text-xs leading-relaxed">Las coordenadas y dirección exacta están protegidas para privacidad del técnico.</p>
                                </div>
                            </div>
                            <div className="pt-4 border-t flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Estado Global</span>
                                <Badge variant="secondary">{request.status}</Badge>
                            </div>

                            {['SCHEDULED', 'DIAGNOSED', 'QUOTED'].includes(request.status) && (
                                <div className="pt-4 border-t space-y-3">
                                    {(() => {
                                        const appointment = request.appointments?.[0];
                                        if (!appointment || appointment.status === 'CANCELED') return null;
                                        
                                        const scheduledAt = new Date(appointment.scheduled_start).getTime();
                                        const now = new Date().getTime();
                                        const diffHours = (scheduledAt - now) / (1000 * 60 * 60);
                                        const canReschedule = diffHours >= 12;

                                        return (
                                            <div className="space-y-3">
                                                <Link to={`/app/schedule?request_id=${requestId}&reschedule=true`} className={!canReschedule ? 'pointer-events-none' : ''}>
                                                    <Button
                                                        variant="outline"
                                                        className={`w-full font-bold border-2 ${canReschedule ? 'border-primary text-primary hover:bg-primary/5' : 'opacity-50 cursor-not-allowed border-slate-200 text-slate-400'}`}
                                                        disabled={!canReschedule}
                                                    >
                                                        <Calendar size={16} className="mr-2" /> 
                                                        {canReschedule ? 'Reprogramar Cita' : 'Reprogramación Bloqueada'}
                                                    </Button>
                                                </Link>
                                                {!canReschedule && (
                                                    <p className="text-[9px] text-destructive font-black uppercase text-center flex items-center justify-center gap-1">
                                                        <Shield size={10} /> 12H de anticipación mínima requerida
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    <Button
                                        variant="outline"
                                        className="w-full text-destructive border-destructive/20 hover:bg-destructive/5 font-bold"
                                        onClick={handleCancelRequest}
                                        loading={submitting}
                                    >
                                        <X size={16} className="mr-2" /> Cancelar Servicio
                                    </Button>
                                    <p className="text-[10px] text-muted-foreground text-center mt-2 italic">
                                        Solo puedes cancelar antes de que inicie la reparación.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
        </div>
    );
}
