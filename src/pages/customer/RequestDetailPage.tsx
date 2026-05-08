import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
    ArrowLeft, Download, Calendar,
    FileText, Zap, MapPin, Wrench, ShieldCheck,
    Clock, Check, X, Shield, Activity, Camera, ExternalLink, AlertTriangle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { TermsModal } from '../../components/ui/TermsModal';

const STATUS_LABEL: Record<string, string> = {
    'SUBMITTED': 'SOLICITADO',
    'SCHEDULED': 'PROGRAMADO',
    'DIAGNOSED': 'DIAGNOSTICADO',
    'QUOTED': 'PRESUPUESTADO',
    'APPROVED': 'APROBADO',
    'COMPLETED': 'COMPLETADO',
    'CANCELED': 'CANCELADO',
    'DECLINED': 'RECHAZADO'
};

const STAGES = [
    { id: 'SUBMITTED', label: 'Solicitado', description: 'Recepción' },
    { id: 'SCHEDULED', label: 'Asignado', description: 'Técnico Ok' },
    { id: 'DIAGNOSED', label: 'Análisis', description: 'Diagnóstico' },
    { id: 'QUOTED', label: 'Presupuesto', description: 'Aprobación' },
    { id: 'APPROVED', label: 'En Curso', description: 'Reparación' },
    { id: 'COMPLETED', label: 'Finalizado', description: 'Entregado' }
];

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

            await supabase.from('notifications_outbox').insert({
                recipient_user_id: user.id,
                recipient: user.email || '',
                channel: 'EMAIL',
                template_code: 'QUOTE_APPROVED',
                payload: {
                    data: {
                        name: request.profiles?.first_name || 'Cliente',
                        vehicle: `${request.vehicles.make} ${request.vehicles.model}`
                    }
                },
                status: 'PENDING'
            });

            toast({ title: 'Protocolo Autorizado', description: 'El despliegue técnico ha comenzado.', type: 'success' });
            loadData();
        } catch (err: any) {
            toast({ title: 'Falla de Autorización', description: 'No se pudo procesar la firma digital.', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleRejectQuote = async () => {
        if (!quote || !user) return;
        const reason = window.prompt('Por favor, indique el motivo de rechazo técnico:');

        setSubmitting(true);
        try {
            await supabase.from('quotes').update({ status: 'DECLINED' }).eq('id', quote.id);
            await supabase.from('service_requests').update({ status: 'DECLINED' }).eq('id', requestId);

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

            toast({ title: 'Misión Abortada', description: 'El presupuesto ha sido rechazado por el operador.', type: 'info' });
            loadData();
        } catch (err) {
            toast({ title: 'Falla de Sistema', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelRequest = async () => {
        if (!window.confirm('¿Efectuar comando de CANCELACIÓN? Esta acción cerrará el expediente operativo.')) return;

        setSubmitting(true);
        try {
            await supabase.from('service_requests').update({ status: 'CANCELED' }).eq('id', requestId);
            await supabase.from('appointments').update({ status: 'CANCELED' }).eq('request_id', requestId);

            toast({ title: 'Expediente Cerrado', description: 'La solicitud ha sido eliminada de la cola activa.', type: 'info' });
            loadData();
        } catch (err: any) {
            toast({ title: 'Falla Técnica', description: 'No se pudo cancelar el servicio.', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-32 text-center text-primary font-black animate-pulse">SINCRONIZANDO TERMINAL...</div>;
    if (!request) return <div className="p-32 text-center text-slate-400 font-black">EXPEDIENTE NO LOCALIZADO</div>;

    const categories = Array.from(new Set(results.map(r => r.checklist_items?.category)));
    const allPhotos = results.reduce((acc: string[], curr) => [...acc, ...(curr.photo_urls || [])], []);

    return (
        <div className="space-y-8 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-1000 font-inter max-w-[1400px] mx-auto px-4 md:px-8">
            
            {/* Action Bar: Tactical Navigation */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <Link to="/app/requests" className="group flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 hover:text-primary transition-all duration-300 italic">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/5 transition-all">
                        <ArrowLeft size={16} />
                    </div>
                    VOLVER AL LISTADO OPERATIVO
                </Link>
                {inspection?.status === 'COMPLETED' && (
                    <Button variant="outline" size="lg" onClick={() => window.print()} className="h-12 rounded-xl px-6 font-black text-[10px] tracking-[0.4em] uppercase border-slate-100 bg-white hover:bg-slate-950 hover:text-white transition-all shadow-md shadow-slate-100">
                        <Download size={16} className="mr-3" /> DESCARGAR REPORTE 1.0X
                    </Button>
                )}
            </div>

            {/* Inmersive Header: Mission Header */}
            <section className="relative group">
                <div className="absolute inset-0 bg-primary/10 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-1000 group-hover:bg-primary/20"></div>
                <div className="relative z-10 bg-slate-950 rounded-3xl p-8 md:p-12 overflow-hidden border border-white/5 shadow-3xl shadow-slate-950/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-bl-[15rem] pointer-events-none group-hover:scale-110 transition-transform duration-1000"></div>
                    
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="space-y-6 text-center md:text-left">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                <Badge className={`px-6 py-2 text-[9px] font-black uppercase tracking-[0.4em] italic rounded-full border-none shadow-sm ${
                                    request.status === 'APPROVED' || request.status === 'COMPLETED' ? 'bg-emerald-500 text-white' : 
                                    request.status === 'QUOTED' ? 'bg-amber-500 text-white animate-pulse' : 
                                    request.status === 'CANCELED' || request.status === 'DECLINED' ? 'bg-rose-500 text-white' :
                                    'bg-primary text-white'
                                }`}>
                                    {STATUS_LABEL[request.status] || request.status}
                                </Badge>
                                <span className="text-[9px] font-black text-slate-500 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 uppercase tracking-[0.5em] italic">
                                    LOG_ID: #{request.ticket_number || request.id.slice(0,8).toUpperCase()}
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-[0.8] text-white">
                                {request.vehicles?.make}<br />
                                <span className="text-primary italic transition-colors duration-1000 group-hover:text-white uppercase">{request.vehicles?.model}</span>
                            </h1>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
                                <p className="text-slate-400 font-black uppercase tracking-[0.5em] text-[9px] flex items-center gap-3 italic opacity-80">
                                    <Wrench size={14} className="text-primary" /> {request.service_catalog?.name || 'DESPLIEGUE GENERAL'}
                                </p>
                                <p className="text-slate-400 font-black uppercase tracking-[0.5em] text-[9px] flex items-center gap-3 italic opacity-80">
                                    <Calendar size={14} className="text-primary" /> {new Date(request.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase()}
                                </p>
                            </div>
                        </div>
                        
                        <div className="relative group/photo shrink-0 hidden md:block">
                            <div className="absolute -inset-4 bg-primary/20 blur-xl rounded-full opacity-0 group-hover/photo:opacity-100 transition-opacity"></div>
                            <div className="w-32 h-32 bg-white/5 rounded-3xl flex items-center justify-center text-primary text-4xl font-black shadow-2xl border-2 border-white/5 italic rotate-3 group-hover/photo:rotate-0 transition-all duration-700">
                                <Zap size={48} fill="currentColor" className="animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tracking Terminal: Unified Progress */}
            <section className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-50 transition-all hover:shadow-primary/5">
                 <div className="flex items-center justify-between gap-4 overflow-x-auto pb-6 scrollbar-hide px-2">
                    {STAGES.map((stage, idx) => {
                        const currentIdx = STAGES.findIndex(s => s.id === request?.status);
                        const isActive = idx <= currentIdx;
                        const isCurrent = idx === currentIdx;

                        return (
                            <div key={stage.id} className="flex flex-col items-center min-w-[100px] relative group/stage">
                                {idx < STAGES.length - 1 && (
                                    <div className={`absolute top-6 left-1/2 w-full h-[3px] -z-0 transition-all duration-1000 ${idx < currentIdx ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]' : 'bg-slate-100'}`}></div>
                                )}
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-4 transition-all duration-700 z-10 ${
                                    isCurrent ? 'bg-slate-950 border-primary text-primary scale-110 shadow-lg shadow-primary/20 rotate-6 group-hover/stage:rotate-0' :
                                    isActive ? 'bg-primary border-primary text-white shadow-md shadow-primary/10' :
                                    'bg-white border-slate-100 text-slate-200'
                                }`}>
                                    {isActive && !isCurrent ? <Check size={20} strokeWidth={4} /> : 
                                     isCurrent ? <Activity size={20} className="animate-pulse" /> :
                                     <span className="text-lg font-black italic">{idx + 1}</span>}
                                </div>
                                <div className="mt-4 text-center space-y-1">
                                    <p className={`text-[10px] font-black uppercase tracking-[0.4em] italic transition-colors leading-none ${isActive ? 'text-slate-950' : 'text-slate-300'}`}>
                                        {stage.label}
                                    </p>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none border-t border-slate-100 pt-1">{stage.description}</p>
                                </div>
                            </div>
                        );
                    })}
                 </div>
                 
                 { (request?.status === 'CANCELED' || request?.status === 'DECLINED') && (
                    <div className="mt-8 p-6 bg-rose-50 rounded-2xl flex flex-col md:flex-row items-center gap-6 border-2 border-rose-100 border-dashed animate-in slide-in-from-top duration-700">
                        <div className="w-16 h-16 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-200 shrink-0 border-4 border-white">
                            <X size={32} strokeWidth={4} />
                        </div>
                        <div className="text-center md:text-left space-y-1">
                            <h4 className="font-black text-rose-900 uppercase italic tracking-tighter text-2xl leading-none">EXPEDIENTE BLOQUEADO</h4>
                            <p className="text-rose-600/80 font-black text-[10px] uppercase tracking-[0.3em] italic">Misión abortada por {request?.status === 'CANCELED' ? 'EL OPERADOR' : 'PROTOCOLO TÉCNICO'}. Contacto de seguridad disponible.</p>
                        </div>
                    </div>
                 )}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                <div className="lg:col-span-3 space-y-8">
                    
                    {/* Mission Authorization: Quote Terminal */}
                    {quote && quote.status === 'SENT' && (
                        <Card className="border-none shadow-lg shadow-amber-200/20 bg-white rounded-3xl overflow-hidden animate-in zoom-in duration-700">
                            <div className="bg-amber-400 p-8 md:p-12 text-slate-950 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full bg-slate-950/5 pointer-events-none" />
                                <div className="space-y-4 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-amber-400 shadow-md">
                                            <Zap size={20} />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.4em] italic leading-none">Mission_Ready</span>
                                    </div>
                                    <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-[0.8]">AUTORIZAR <br /><span className="opacity-60 italic">DESPLIEGUE</span></h2>
                                </div>
                                <div className="text-center md:text-right relative z-10">
                                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] italic mb-2 leading-none">TOTAL OPERATIVO_</p>
                                    <span className="text-6xl md:text-7xl font-black italic tracking-tighter leading-none">${quote.grand_total.toFixed(0)}<span className="text-2xl opacity-40">.{quote.grand_total.toFixed(2).split('.')[1]}</span></span>
                                </div>
                            </div>
                            
                            <CardContent className="p-8 md:p-12 space-y-12">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100 shadow-inner group hover:bg-white transition-all duration-500">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 flex items-center justify-center text-amber-600 group-hover:rotate-12 transition-transform">
                                                <Clock size={24} />
                                            </div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">TIEMPO ESTIMADO (ETA)</p>
                                        </div>
                                        <p className="text-4xl font-black text-slate-950 italic tracking-tighter leading-none">
                                            {quote.eta_hours_min}<span className="text-primary italic">-</span>{quote.eta_hours_max} <span className="text-xl text-slate-400 opacity-50 font-black italic">H_D_S</span>
                                        </p>
                                        <p className="text-[9px] text-slate-400 mt-4 leading-relaxed font-black italic uppercase tracking-widest">{quote.eta_notes || 'Protocolo sujeto a respuesta inmediata.'}</p>
                                    </div>
                                    <div className="p-8 bg-slate-950 rounded-[2rem] text-white shadow-xl shadow-slate-900/40 flex flex-col justify-center gap-4">
                                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-2 italic leading-none">DESGLOSE DE ACTIVOS</p>
                                         <div className="space-y-3">
                                             <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic">
                                                 <span>Logística y Lab_</span>
                                                 <span>${(quote.grand_total * 0.45).toFixed(2)}</span>
                                             </div>
                                             <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic">
                                                 <span>Refacciones OEM_</span>
                                                 <span>${(quote.grand_total * 0.55).toFixed(2)}</span>
                                             </div>
                                             <div className="w-full h-px bg-white/5 my-3" />
                                             <div className="flex justify-between text-xl font-black text-white uppercase italic tracking-tighter">
                                                 <span className="text-primary italic">TOTAL DENVER</span>
                                                 <span>${quote.grand_total.toFixed(2)}</span>
                                             </div>
                                         </div>
                                    </div>
                                </div>

                                {/* Items Matrix */}
                                <div className="space-y-8">
                                    <h4 className="text-[10px] font-black text-slate-950 uppercase tracking-[0.8em] flex items-center gap-4 italic">
                                        <div className="w-12 h-[2px] bg-primary" /> CONCEPTOS TÉCNICOS
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {quote.quote_items?.map((item: any) => (
                                            <div key={item.id} className="flex justify-between items-center p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:bg-slate-950 hover:text-white transition-all duration-700 group/entry">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-2 h-2 bg-primary rounded-full shadow-lg shadow-primary/20 group-hover/entry:animate-ping" />
                                                    <div className="space-y-1">
                                                        <span className="text-sm font-black uppercase italic tracking-tighter block leading-none">{item.description}</span>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] group-hover/entry:text-primary transition-colors">{item.type}</span>
                                                    </div>
                                                </div>
                                                <span className={`text-xl font-black italic tracking-tighter ${item.type === 'DISCOUNT' ? 'text-emerald-500' : 'group-hover/entry:text-primary transition-colors'}`}>
                                                    {item.type === 'DISCOUNT' ? '-' : ''}${Math.abs(item.total_price).toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Approval Terminal */}
                                <div className="bg-slate-50 p-6 md:p-8 rounded-[2rem] border-2 border-dashed border-slate-100 space-y-8">
                                    <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-slate-950 flex items-center justify-center text-primary shadow-lg rotate-12 transition-transform hover:rotate-0 duration-700">
                                            <ShieldCheck size={32} />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-3xl font-black italic uppercase tracking-tighter leading-none text-slate-900">FIRMA <span className="text-primary italic">DIGITAL</span></h4>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Protocolo de seguridad Denver_Auth</p>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="flex items-start gap-6 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:-translate-y-1 transition-all duration-500 cursor-pointer group/chk" onClick={() => setAcceptedTerms(!acceptedTerms)}>
                                            <div className={`w-8 h-8 rounded-xl border-2 transition-all duration-500 flex items-center justify-center shrink-0 ${acceptedTerms ? 'bg-primary border-primary rotate-12 shadow-primary/30' : 'bg-transparent border-slate-100'}`}>
                                                {acceptedTerms && <Check size={18} strokeWidth={5} className="text-white" />}
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-lg font-black uppercase tracking-tighter text-slate-950 italic">CONSENTIMIENTO OPERATIVO</p>
                                                <p className="text-[10px] text-slate-400 leading-relaxed font-black uppercase tracking-widest italic">Entiendo y autorizo la ejecución de los trabajos listados conforme a los <button onClick={(e) => { e.stopPropagation(); setShowTerms(true); }} className="text-primary font-black hover:underline underline-offset-4 decoration-2">TÉRMINOS DE SERVICIO</button>. Esta autorización vincula el despliegue técnico inmediato.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-950 uppercase tracking-[0.5em] block ml-4 italic leading-none">IDENTIFICACIÓN DEL OPERADOR_</label>
                                            <Input
                                                placeholder="NOMBRE COMPLETO PARA FIRMAR"
                                                value={signature}
                                                onChange={(e) => setSignature(e.target.value)}
                                                className="h-16 bg-white border-2 border-slate-100 text-slate-950 font-black italic text-xl uppercase tracking-tighter rounded-2xl px-6 focus:ring-4 focus:ring-primary/20 shadow-inner placeholder:text-slate-200 placeholder:italic placeholder:font-black transition-all"
                                            />
                                        </div>

                                        <div className="flex flex-col md:flex-row gap-4 pt-2">
                                            <Button
                                                variant="ghost"
                                                className="h-14 rounded-xl text-slate-400 hover:text-rose-500 font-black text-[10px] tracking-[0.4em] uppercase transition-all duration-300 border-2 border-transparent hover:border-rose-100 italic"
                                                onClick={handleRejectQuote}
                                                disabled={submitting}
                                            >
                                                X_ ABORTAR MISIÓN
                                            </Button>
                                            <Button
                                                size="lg"
                                                className="h-16 flex-1 rounded-2xl bg-slate-950 hover:bg-primary text-white font-black text-[11px] tracking-[0.3em] uppercase transition-all duration-700 shadow-xl shadow-slate-900/30 flex items-center justify-center gap-4 border-none italic group"
                                                onClick={handleApproveQuote}
                                                disabled={!acceptedTerms || !signature.trim() || submitting}
                                            >
                                                AUTORIZAR DESPLIEGUE AHORA <Zap size={20} className="group-hover:scale-125 transition-transform animate-pulse" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Technical Analysis Output */}
                    {inspection?.status === 'COMPLETED' ? (
                        <div className="space-y-8">
                            <Card className={`border-none shadow-md shadow-slate-200/50 rounded-3xl overflow-hidden bg-white group transition-all hover:shadow-primary/5`}>
                                <div className={`h-4 w-full ${inspection.risk === 'HIGH' ? 'bg-rose-500 animate-pulse' : inspection.risk === 'MED' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                <CardHeader className="p-8 md:p-12 pb-0 space-y-6">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                        <Badge className={`px-6 py-2 text-[10px] font-black uppercase tracking-[0.5em] rounded-full border-none shadow-sm italic ${
                                            inspection.risk === 'HIGH' ? 'bg-rose-500 text-white' : 
                                            inspection.risk === 'MED' ? 'bg-amber-500 text-slate-950' : 
                                            'bg-emerald-500 text-white'
                                        }`}>
                                            NIVEL DE RIESGO: {inspection.risk}
                                        </Badge>
                                        <div className="flex items-center gap-3 text-slate-400 font-black text-[9px] uppercase tracking-[0.5em] italic bg-slate-50 px-6 py-2 rounded-full border border-slate-100">
                                            <ShieldCheck size={16} className="text-primary" /> DENVER_TECH_CERTIFIED
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-[0.8] text-slate-950 group-hover:text-primary transition-colors duration-700">HALLAZGOS<br /><span className="opacity-40 italic">OPERATIVOS</span></h2>
                                        <p className="text-slate-400 font-black uppercase tracking-[0.8em] text-[10px] pl-2 border-l-4 border-primary italic mt-4">SCANNED_DIAGNOSTIC_VER_1.0</p>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 md:p-12 pt-8 space-y-12">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <section className="space-y-6 bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-inner group/finding hover:bg-white transition-all duration-500">
                                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.5em] flex items-center gap-4 italic">
                                                <div className="w-8 h-[2px] bg-primary group-hover/finding:w-16 transition-all" /> OBSERVACIONES
                                            </h4>
                                            <p className="text-slate-900 leading-relaxed font-black text-lg italic tracking-tighter uppercase opacity-80 group-hover:opacity-100 transition-opacity">
                                                {inspection.findings || 'SISTEMA NOMINAL. NO SE REPORTARON ANOMALÍAS CRÍTICAS.'}
                                            </p>
                                        </section>
                                        <section className="space-y-6 bg-slate-950 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden group/rec hover:scale-[1.02] transition-all duration-700">
                                            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
                                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] flex items-center gap-4 italic relative z-10">
                                                <Zap size={16} className="text-primary group-hover/rec:animate-bounce" /> RECOMENDACIÓN
                                            </h4>
                                            <p className="text-slate-200 leading-relaxed font-black text-lg italic tracking-tighter uppercase relative z-10">
                                                {inspection.recommendations || 'CONTINUAR CON EL CICLO DE MANTENIMIENTO PREVENTIVO DENVER 10K.'}
                                            </p>
                                        </section>
                                    </div>

                                    {/* Checklist Matrix */}
                                    {results.length > 0 && (
                                        <div className="space-y-10 pt-10 border-t border-slate-100">
                                            <div className="flex items-center gap-4">
                                                <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-950 leading-none">CHECKLIST <span className="text-primary italic">SISTÉMICO</span></h3>
                                                <div className="flex-1 h-px bg-slate-100" />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                {categories.map(cat => (
                                                    <div key={cat} className="space-y-6 group/cat">
                                                        <h5 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 pl-4 border-l-4 border-primary leading-none italic group-hover/cat:text-primary transition-colors">{cat}</h5>
                                                        <div className="space-y-3">
                                                            {results.filter(r => r.checklist_items?.category === cat).map(r => (
                                                                <div key={r.id} className="flex justify-between items-center p-4 md:p-6 bg-slate-50 rounded-2xl hover:bg-slate-950 hover:text-white hover:shadow-lg transition-all duration-700 border border-transparent group/row">
                                                                    <span className="text-xs font-black uppercase italic tracking-tighter opacity-80 group-hover/row:opacity-100">{r.checklist_items?.item_name}</span>
                                                                    <Badge className={`px-4 py-1.5 text-[8px] font-black uppercase rounded-full border-none shadow-sm italic ${
                                                                        r.status === 'OK' ? 'bg-emerald-500/10 text-emerald-500 group-hover/row:bg-emerald-500 group-hover/row:text-white' : 
                                                                        r.status === 'ISSUE' ? 'bg-rose-500/10 text-rose-500 group-hover/row:bg-rose-500 group-hover/row:text-white' : 
                                                                        'bg-slate-200 text-slate-400 group-hover/row:bg-white group-hover/row:text-slate-950'
                                                                    }`}>
                                                                        {r.status}
                                                                    </Badge>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        /* Diagnostic Pending Terminal */
                        <Card className="bg-slate-950 rounded-3xl p-16 md:p-24 text-center relative overflow-hidden group shadow-xl shadow-slate-900/50">
                             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                             <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
                             <div className="relative z-10 space-y-10">
                                <div className="w-20 h-20 bg-white/5 backdrop-blur-3xl rounded-2xl flex items-center justify-center text-primary mx-auto border border-white/10 shadow-xl group-hover:rotate-12 transition-transform duration-1000">
                                    <Activity size={40} className="animate-pulse" />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white leading-none">ESCANEANDO <span className="text-primary italic">SISTEMAS_</span></h3>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em] max-w-lg mx-auto leading-relaxed italic border-t border-white/5 pt-6">ANÁLISIS TÉCNICO MULTIPUNTO EN CURSO. SINCRONIZANDO CON DENVER_CLOUD HUB.</p>
                                </div>
                                <div className="max-w-md mx-auto pt-6">
                                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                                        <div className="h-full bg-primary w-2/3 animate-pulse shadow-[0_0_15px_rgba(var(--primary-rgb),0.6)] rounded-full transition-all duration-1000" />
                                    </div>
                                    <p className="text-[9px] font-black text-primary mt-6 uppercase tracking-[0.4em] italic animate-bounce flex items-center justify-center gap-3">
                                        <Zap size={12} fill="currentColor" /> TRAN_DATA_SENDING_4401KB
                                    </p>
                                </div>
                             </div>
                        </Card>
                    )}
                </div>

                {/* Sidebar: Data Matrix & Evidence */}
                <aside className="space-y-8">
                    {/* Visual Evidence Terminal */}
                    <Card className="rounded-3xl shadow-sm border border-slate-50 bg-white p-8 overflow-hidden group/evidence hover:shadow-primary/5 transition-all">
                        <CardHeader className="p-0 mb-8 border-b border-slate-50 pb-6 flex flex-row items-center justify-between">
                            <div className="space-y-1">
                                <span className="text-[9px] font-black text-primary uppercase tracking-[0.5em] italic leading-none">Assets_</span>
                                <CardTitle className="text-xl font-black uppercase tracking-tighter text-slate-950 italic">EVIDENCIA</CardTitle>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover/evidence:bg-slate-950 group-hover/evidence:text-primary transition-all duration-500">
                                <Camera size={20} />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {allPhotos.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {allPhotos.map((url: string, idx: number) => (
                                        <div key={idx} className="aspect-square rounded-[1rem] overflow-hidden border-2 border-slate-50 bg-slate-100 cursor-pointer hover:scale-95 hover:rotate-2 hover:border-primary transition-all duration-500 shadow-sm">
                                            <img src={url} alt={`Evidencia_Log_${idx}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 px-6 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-50 space-y-4">
                                    <div className="w-12 h-12 bg-white rounded-[1rem] flex items-center justify-center text-slate-100 mx-auto shadow-inner">
                                        <FileText size={24} />
                                    </div>
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] leading-relaxed italic">NO HAY CAPTURAS REGISTRADAS EN LA COLA ACTUAL.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Operational Details Matrix */}
                    <Card className="rounded-3xl shadow-sm border border-slate-50 bg-white p-8 overflow-hidden group/ops hover:shadow-primary/5 transition-all">
                         <CardHeader className="p-0 mb-8 border-b border-slate-50 pb-6">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.5em] italic leading-none mb-1 block">Matrix_Data</span>
                            <CardTitle className="text-xl font-black uppercase tracking-tighter text-slate-950 italic">PROTOCOLO</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 space-y-8">
                             <div className="flex items-start gap-4 group/item pt-1">
                                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0 group-hover/ops:rotate-12 transition-transform duration-500 shadow-sm border border-primary/5">
                                    <MapPin size={18} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-slate-950 tracking-[0.2em] leading-none italic">DENVER_HUB_ZONE</p>
                                    <p className="text-[9px] font-black text-slate-400 italic leading-relaxed uppercase tracking-widest">Sincronización GPS activa. Soporte de cercanía vinculado.</p>
                                </div>
                             </div>

                             <div className="pt-8 border-t border-slate-50 space-y-6">
                                 <div className="flex justify-between items-center group/row">
                                     <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em] italic group-hover/row:text-primary transition-colors">STATUS_NET</span>
                                     <Badge className="font-black text-[9px] px-4 py-1.5 rounded-full bg-slate-950 text-white uppercase italic tracking-[0.2em] shadow-sm">{request.status}</Badge>
                                 </div>
                                 <div className="flex justify-between items-center group/row">
                                     <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em] italic group-hover/row:text-primary transition-colors">SECURITY_CODE</span>
                                     <span className="flex items-center gap-2 text-emerald-500 text-[9px] font-black tracking-[0.2em] italic uppercase">
                                         <ShieldCheck size={14} /> CERTIFIED
                                     </span>
                                 </div>
                             </div>

                             {['SCHEDULED', 'DIAGNOSED', 'QUOTED'].includes(request.status) && (
                                <div className="pt-8 border-t border-slate-50 space-y-4">
                                     {(() => {
                                        const appointment = request.appointments?.[0];
                                        if (!appointment || appointment.status === 'CANCELED') return null;
                                        
                                        const scheduledAt = new Date(appointment.scheduled_start).getTime();
                                        const now = new Date().getTime();
                                        const diffHours = (scheduledAt - now) / (1000 * 60 * 60);
                                        const canReschedule = diffHours >= 12;

                                        return (
                                            <div className="space-y-4">
                                                <Link to={`/app/schedule?request_id=${requestId}&reschedule=true`} className={`block w-full ${!canReschedule ? 'pointer-events-none' : ''}`}>
                                                    <Button
                                                        size="lg"
                                                        className={`w-full h-12 rounded-xl font-black text-[10px] tracking-[0.3em] uppercase transition-all duration-500 border-none shadow-sm ${canReschedule ? 'bg-slate-50 text-slate-950 hover:bg-slate-950 hover:text-primary' : 'bg-slate-50 text-slate-200 cursor-not-allowed opacity-50'} italic`}
                                                        disabled={!canReschedule}
                                                    >
                                                        <Calendar size={16} className="mr-3" /> 
                                                        {canReschedule ? 'MOD_AGEND_PRO' : 'LOCK_AGEND'}
                                                    </Button>
                                                </Link>
                                                {!canReschedule && (
                                                    <div className="p-4 bg-rose-50 rounded-xl flex items-center gap-3 border border-rose-100 shadow-inner">
                                                         <AlertTriangle size={16} className="text-rose-500 shrink-0" />
                                                         <p className="text-[8px] text-rose-500 font-black uppercase leading-tight italic tracking-widest">BLOQUEO TEMPORAL: SE REQUIERE VENTANA DE 12H PARA MODIFICACIONES.</p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                     })()}

                                     <Button
                                        variant="ghost"
                                        className="w-full h-12 text-slate-300 hover:text-rose-600 font-black text-[10px] tracking-[0.4em] uppercase transition-all duration-300 border-none italic hover:bg-rose-50 rounded-xl"
                                        onClick={handleCancelRequest}
                                        loading={submitting}
                                     >
                                        <X size={16} className="mr-3" /> ABORT_MISSION_X
                                     </Button>
                                </div>
                             )}
                        </CardContent>
                    </Card>
                </aside>
            </div>

            <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
        </div>
    );
}
