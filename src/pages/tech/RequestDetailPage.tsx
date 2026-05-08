import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { useToast } from '../../components/ui/Toast';
import { 
    ArrowLeft, Plus, Trash2, Calendar, User, Hash, Wrench, Clock, Save, LogOut, Camera, Check, X, Minus, Droplet, FileText, ShieldCheck,
    Navigation, Activity, Target, Zap, ChevronRight, AlertCircle, Info, Timer, Cpu, Radio, Signal, Terminal, Truck, Settings,
    CheckCircle2, MoveRight
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';

export function TechRequestDetailPage() {
    const { id: requestId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [request, setRequest] = useState<any>(null);
    const [templates, setTemplates] = useState<any[]>([]);
    const [inspectionChecklist, setInspectionChecklist] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSelector, setShowSelector] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (requestId) loadData();
    }, [requestId]);

    async function loadData() {
        setLoading(true);
        try {
            const { data: req, error: reqError } = await supabaseAdmin
                .from('service_requests')
                .select('*, profiles(*), vehicles(id, make, model, year, odometer, trim, powertrain), service_catalog(*), appointments(*)')
                .eq('id', requestId)
                .single();
            if (reqError) console.error('loadData error:', reqError.message);
            setRequest(req);

            const { data: cl } = await supabase
                .from('inspection_checklists')
                .select('*')
                .eq('request_id', requestId)
                .maybeSingle();

            if (cl) {
                setInspectionChecklist(cl);
                const { data: itm } = await supabase
                    .from('checklist_items')
                    .select('*')
                    .eq('checklist_id', cl.id)
                    .order('order_index', { ascending: true });
                setItems(itm || []);
            }

            const { data: tmps } = await supabase
                .from('checklist_templates')
                .select('*')
                .eq('is_active', true);
            setTemplates(tmps || []);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function generate(tmpId: string) {
        setLoading(true);
        try {
            const { error } = await supabase.rpc('generate_checklist_auto', { 
                request_id: requestId, 
                p_template_id: tmpId 
            });
            if (error) throw error;
            setShowSelector(false);
            loadData();
        } catch (e: any) {
            toast({ title: 'Error', description: e.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    }

    async function updateItemStatus(itemId: string, status: string) {
        try {
            const { error } = await supabase
                .from('checklist_items')
                .update({ status })
                .eq('id', itemId);
            if (error) throw error;
            setItems(prev => prev.map(itm => itm.id === itemId ? { ...itm, status } : itm));
        } catch (err: any) {
            toast({ title: 'Error', description: 'No se pudo guardar el estado.', type: 'error' });
        }
    }

    async function updateItemNotes(itemId: string, notes: string) {
        try {
            const { error } = await supabase
                .from('checklist_items')
                .update({ notes })
                .eq('id', itemId);
            if (error) throw error;
            setItems(prev => prev.map(itm => itm.id === itemId ? { ...itm, notes } : itm));
        } catch (err: any) {
            toast({ title: 'Error', description: 'No se pudieron guardar las notas.', type: 'error' });
        }
    }

    async function updateOilSpecs(field: string, value: string) {
        if (!inspectionChecklist) return;
        const currentFindings = inspectionChecklist.findings || {};
        const updatedFindings = {
            ...currentFindings,
            oil_specs: { ...(currentFindings.oil_specs || {}), [field]: value }
        };
        try {
            const { error } = await supabase
                .from('inspection_checklists')
                .update({ findings: updatedFindings })
                .eq('id', inspectionChecklist.id);
            if (error) throw error;
            setInspectionChecklist({ ...inspectionChecklist, findings: updatedFindings });
        } catch (err: any) {
             toast({ title: 'Error', description: 'No se pudieron guardar los detalles del aceite.', type: 'error' });
        }
    }

    async function publishChecklist() {
        if (!inspectionChecklist) return;
        setSaving(true);
        try {
            const isOilService = request?.service_catalog?.name?.toLowerCase()?.includes('aceite');
            if (isOilService && inspectionChecklist.findings?.oil_specs?.current_odometer) {
                const newOdo = parseInt(inspectionChecklist.findings.oil_specs.current_odometer);
                if (!isNaN(newOdo) && request?.vehicles?.id) {
                    await supabaseAdmin.from('vehicles').update({ odometer: newOdo }).eq('id', request.vehicles.id);
                }
            }

            const { error: clError } = await supabase
                .from('inspection_checklists')
                .update({ status: 'COMPLETED' })
                .eq('id', inspectionChecklist.id);
            if (clError) throw clError;

            const { error: srError } = await supabaseAdmin
                .from('service_requests')
                .update({ status: 'COMPLETED' })
                .eq('id', requestId);
            if (srError) throw srError;

            toast({ title: '✅ Misión Cumplida', description: 'Reporte técnico validado y transmitido a la central.', type: 'success' });
            navigate('/tech');
        } catch(err: any){
            console.error('publishChecklist error:', err);
            toast({ title: 'Error', description: 'No se pudo completar el servicio. Reintente conexión.', type: 'error' });
        } finally {
            setSaving(false);
        }
    }

    if (loading && !request) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-10 font-inter animate-in fade-in duration-1000">
                <div className="relative">
                    <div className="w-24 h-24 border-[8px] border-slate-100 border-t-primary rounded-[2.5rem] animate-spin shadow-3xl shadow-primary/20"></div>
                    <Cpu size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" />
                </div>
                <div className="text-center space-y-2">
                    <p className="text-slate-950 font-black uppercase text-xl tracking-[0.4em] italic leading-none">BOOTING_DEPLOY_TERMINAL</p>
                    <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.6em] italic animate-pulse">v4.2.1 - ACTIVE_SYNC</p>
                </div>
            </div>
        );
    }

    const isOilChange = request?.service_catalog?.name?.toLowerCase()?.includes('aceite');
    
    const grouped: any = {};
    (items || []).forEach((i: any) => {
        const cat = i.category || 'General';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(i);
    });

    const appointment = request?.appointments?.[0];

    return (
        <div className="max-w-[1400px] mx-auto space-y-16 pb-32 animate-in fade-in slide-in-from-bottom-12 duration-1000 px-4 md:px-8 font-inter">
            
            {/* Action Bar: Mission Controls */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 py-4">
                <Button 
                    variant="ghost" 
                    onClick={() => navigate('/tech')} 
                    className="group flex items-center gap-6 text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 hover:text-slate-950 transition-all duration-300 p-0"
                >
                    <div className="w-14 h-14 rounded-full border-2 border-slate-100 flex items-center justify-center group-hover:border-slate-950 transition-all text-slate-950 shadow-sm bg-white">
                        <ArrowLeft size={20} />
                    </div>
                    VOLVER_AL_LOG
                </Button>
                
                <div className="flex items-center gap-6 bg-slate-950 p-3 pl-8 rounded-full shadow-3xl border border-white/5">
                    <div className="flex flex-col items-end mr-4">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">TERMINAL_TECH</span>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(255,46,91,0.6)]"></div>
                            <span className="text-[11px] font-black text-white uppercase italic pt-0.5">MISION_ACTIVA</span>
                        </div>
                    </div>
                    <div className="h-14 px-8 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                        <span className="text-[12px] font-black text-primary uppercase tracking-[0.4em] italic">ALPHA_#{request?.ticket_number || '0000'}</span>
                    </div>
                </div>
            </div>

            {/* Asset Header: Detroit Diesel Style */}
            <header className="relative group">
                <div className="absolute inset-0 bg-primary/10 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none group-hover:bg-primary/20 transition-all duration-1000"></div>
                <div className="relative z-10 bg-slate-950 rounded-[2.5rem] p-12 md:p-24 overflow-hidden border border-white/5 shadow-3xl">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-bl-[15rem] pointer-events-none"></div>
                    <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/5 blur-3xl rounded-full"></div>
                    
                    <div className="relative z-10 flex flex-col lg:flex-row justify-between items-end gap-16">
                        <div className="space-y-12 flex-1 w-full text-center lg:text-left">
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                                <Badge className="bg-primary text-white px-10 py-3.5 text-[11px] font-black uppercase tracking-[0.5em] italic border-none shadow-3xl rounded-full">
                                    {request?.status || 'IN_PROGRESS'}
                                </Badge>
                                <div className="flex items-center gap-4 bg-white/5 backdrop-blur-xl px-6 py-2.5 rounded-full border border-white/10">
                                    <Wrench size={16} className="text-primary" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic">{request?.service_catalog?.name || 'DENVER_ALPHA'}</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h1 className="text-7xl md:text-8xl lg:text-[10rem] font-black italic uppercase tracking-tighter leading-[0.75] text-white transition-all scale-105 origin-left">
                                    {request?.vehicles?.make} <br />
                                    <span className="text-primary italic opacity-20 scale-90 block pt-4">{request?.vehicles?.model} {request?.vehicles?.year}</span>
                                </h1>
                                <div className="flex flex-wrap justify-center lg:justify-start gap-8 pt-6">
                                    {request?.vehicles?.trim && (
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em] italic">TRIM_PATH</span>
                                            <span className="text-2xl text-white font-black italic uppercase tracking-widest">{request.vehicles.trim}</span>
                                        </div>
                                    )}
                                    {request?.vehicles?.powertrain && (
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em] italic">POWER_DRIVE</span>
                                            <span className="text-2xl text-slate-400 font-black italic uppercase tracking-widest">{request.vehicles.powertrain}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="w-full lg:w-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                             <Card className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 min-w-[300px] shadow-3xl relative overflow-hidden group/meta">
                                <div className="absolute top-0 right-0 w-2 h-full bg-primary/20 group-hover/meta:bg-primary transition-all"></div>
                                <div className="space-y-8 relative z-10">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary"><User size={20} /></div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] italic leading-none">CLIENTE_DENVER</p>
                                            <p className="font-black text-xl text-white italic uppercase tracking-tighter">{request?.profiles?.first_name || 'DENVER_USER'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400"><Clock size={20} /></div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] italic leading-none">DEPLOY_SYNC</p>
                                            <p className="font-black text-xl text-white italic uppercase tracking-tighter">
                                                {appointment?.scheduled_start ? new Date(appointment.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400"><Hash size={20} /></div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] italic leading-none">ODO_RECORD</p>
                                            <p className="font-black text-xl text-white italic uppercase tracking-tighter">{request?.vehicles?.odometer ? `${request.vehicles.odometer.toLocaleString()} MI` : 'S/R'}</p>
                                        </div>
                                    </div>
                                </div>
                             </Card>
                        </div>
                    </div>
                </div>
            </header>

            {/* Template Selector / Initialization Block */}
            {!inspectionChecklist ? (
                <Card 
                    className="flex flex-col items-center justify-center p-24 bg-white rounded-[2.5rem] border-8 border-dashed border-slate-50 gap-12 text-center group cursor-pointer hover:border-primary/20 hover:shadow-3xl transition-all duration-1000 shadow-xl shadow-slate-100/50" 
                    onClick={() => setShowSelector(true)}
                >
                    <div className="relative">
                        <div className="w-40 h-40 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 border border-slate-50 rotate-12 group-hover:rotate-0 transition-all duration-1000 group-hover:bg-primary/5 group-hover:text-primary">
                            <Plus size={80} strokeWidth={3} />
                        </div>
                        <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center text-white animate-denver-in shadow-3xl">
                            <Activity size={32} className="text-primary animate-pulse" />
                        </div>
                    </div>
                    <div className="space-y-6 max-w-xl">
                        <h3 className="text-5xl font-black italic uppercase tracking-tighter text-slate-950 leading-none">INICIAR EXPEDIENTE TÉCNICO</h3>
                        <p className="text-slate-400 font-black uppercase tracking-[0.6em] text-[11px] leading-relaxed italic opacity-80">DESPLIEGUE DE HOJA DE RUTA OPERATIVA PARA DIAGNÓSTICO Denver_Detroit.</p>
                    </div>
                    <Button 
                        size="xl"
                        onClick={(e) => { e.stopPropagation(); setShowSelector(true); }} 
                        className="bg-slate-950 h-24 px-20 rounded-[2.5rem] font-black text-sm tracking-[0.4em] text-white uppercase shadow-[0_30px_100px_-20px_rgba(30,41,59,0.4)] hover:shadow-primary/40 hover:bg-primary transition-all duration-700 active:scale-95 border-none scale-110"
                    >
                        SELECCIONAR PROTOCOLO DE DESPLIEGUE
                    </Button>
                </Card>
            ) : (
                <div className="flex flex-col md:flex-row justify-between items-center p-12 bg-white rounded-[2.5rem] border-none shadow-3xl shadow-slate-200/50 gap-10 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-3 h-full bg-emerald-500/20 group-hover:bg-emerald-500 transition-all"></div>
                    <div className="flex items-center gap-10">
                        <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center text-emerald-500 shadow-inner border border-emerald-100 group-hover:rotate-12 transition-transform">
                            <ShieldCheck size={48} />
                        </div>
                        <div>
                            <p className="text-[12px] font-black text-slate-300 uppercase tracking-[0.6em] italic leading-none mb-3">CONEXIÓN_OPERATIVA_ACTIVA</p>
                            <h4 className="font-black text-slate-950 uppercase italic text-3xl tracking-tighter">SINCRONIZACIÓN EN TIEMPO REAL</h4>
                        </div>
                    </div>
                    <Button 
                        variant="ghost" 
                        onClick={() => { if(window.confirm('¿Deseas REINICIAR el checklist? Se borrarán todos los estados actuales.')) setShowSelector(true); }} 
                        className="text-slate-400 hover:text-rose-500 font-black h-16 rounded-[1.5rem] px-8 text-[11px] tracking-[0.4em] uppercase italic group/reset bg-slate-50/50 hover:bg-rose-50"
                    >
                        <Trash2 size={20} className="mr-4 group-hover/reset:animate-bounce" /> REINICIAR PROTOCOLO
                    </Button>
                </div>
            )}

            {/* Template Selection Matrix */}
            {showSelector && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 animate-in slide-in-from-bottom-12 duration-1000">
                    {templates.map((t, idx) => (
                        <div 
                            key={t.id} 
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <Card 
                                onClick={() => generate(t.id)} 
                                className="group p-12 rounded-[2.5rem] bg-white border-none hover:bg-slate-950 text-center transition-all shadow-3xl hover:shadow-primary/40 cursor-pointer overflow-hidden relative h-full"
                            >
                                <div className="absolute top-0 right-0 p-8 text-slate-50 group-hover:text-primary transition-colors opacity-10 group-hover:opacity-10 scale-150">
                                    <Terminal size={120} />
                                </div>
                                <div className="h-20 w-20 bg-slate-50 group-hover:bg-primary group-hover:scale-110 rounded-[2rem] mx-auto mb-10 flex items-center justify-center text-slate-400 group-hover:text-white transition-all shadow-inner border border-slate-100 group-hover:border-primary">
                                    <Plus size={40} strokeWidth={3} />
                                </div>
                                <p className="font-black uppercase text-[11px] text-slate-900 group-hover:text-white transition-colors leading-tight tracking-[0.4em] italic mb-2">MOD_PROTO</p>
                                <p className="font-black italic text-2xl text-slate-950 group-hover:text-white uppercase tracking-tighter">{t.name}</p>
                            </Card>
                        </div>
                    ))}
                </div>
            )}

            {/* Operational Terminal Content */}
            {inspectionChecklist && (
                <div className="space-y-32">
                    
                    {/* FLUID MATRIX DASHBOARD (Oil Specs) */}
                    {isOilChange && (
                        <section className="bg-slate-950 rounded-[2.5rem] p-12 md:p-24 text-white shadow-3xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-60"></div>
                            <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]"></div>
                            
                            <div className="relative z-10 space-y-20">
                                <header className="flex flex-col md:flex-row items-end justify-between gap-12">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-6">
                                            <div className="w-20 h-20 bg-primary/20 rounded-[2.5rem] flex items-center justify-center text-primary border border-primary/20 shadow-3xl group-hover:rotate-12 transition-transform duration-700">
                                                <Droplet size={40} className="fill-primary/20" />
                                            </div>
                                            <h3 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter">FLUID_ENGINE<br /><span className="text-primary italic opacity-40">SPECS_RADAR</span></h3>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-auto p-10 bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 space-y-6 min-w-[350px]">
                                        <div className="flex items-center gap-4">
                                            <Signal size={16} className="text-primary animate-pulse" />
                                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.6em] italic">ODOMETER_MASTER_SET</span>
                                        </div>
                                        <div className="space-y-2">
                                            <Input 
                                                type="number"
                                                placeholder="LECTURA ACTUAL" 
                                                className="bg-white/5 border-none text-white h-20 rounded-[1.8rem] font-black text-5xl italic tracking-tighter uppercase px-8 focus:ring-4 focus:ring-primary shadow-inner placeholder:text-slate-800"
                                                defaultValue={inspectionChecklist?.findings?.oil_specs?.current_odometer || ''}
                                                onBlur={(e) => updateOilSpecs('current_odometer', e.target.value)}
                                            />
                                            <p className="text-[10px] font-black italic text-slate-500 tracking-[0.4em] px-4 uppercase">HIST_RECORD: {request?.vehicles?.odometer?.toLocaleString() || '0'} MI</p>
                                        </div>
                                    </div>
                                </header>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                    {/* OIL_BRAND_SELECTOR */}
                                    <div className="space-y-6 p-10 bg-white/5 rounded-[2.5rem] border border-white/5 hover:bg-white/10 transition-all duration-700 group/oil">
                                        <label className="text-[10px] font-black uppercase tracking-[0.8em] text-slate-500 italic block mb-2 px-2 flex items-center gap-4">
                                            <div className="w-2 h-2 bg-primary rounded-full group-hover/oil:w-8 transition-all"></div> BRAND_SINT
                                        </label>
                                        <select
                                            className="w-full h-20 rounded-[2rem] px-8 bg-slate-900 border-none text-white font-black italic text-lg focus:ring-4 focus:ring-primary transition-all cursor-pointer uppercase tracking-tighter appearance-none shadow-3xl"
                                            defaultValue={
                                                ['Mobil 1','Castrol EDGE','Valvoline','Pennzoil Platinum', 'Shell Rotella T6', 'Royal Purple', 'Quaker State', 'STP', 'Havoline', 'Lucas Oil'].includes(inspectionChecklist?.findings?.oil_specs?.type || '')
                                                    ? (inspectionChecklist?.findings?.oil_specs?.type || '')
                                                    : (inspectionChecklist?.findings?.oil_specs?.type ? 'otro' : '')
                                            }
                                            onChange={(e) => {
                                                if (e.target.value !== 'otro') updateOilSpecs('type', e.target.value);
                                                else updateOilSpecs('type', '');
                                                const custom = document.getElementById('oil-type-custom');
                                                if (custom) custom.style.display = e.target.value === 'otro' ? 'block' : 'none';
                                            }}
                                        >
                                            <option value="" style={{color:'#1e293b'}}>-- SELECT --</option>
                                            {['Mobil 1','Castrol EDGE','Valvoline','Pennzoil Platinum','Shell Rotella T6','Royal Purple','Quaker State','STP','Havoline','Lucas Oil'].map(v => (
                                                <option key={v} value={v} style={{color:'#1e293b'}}>{v}</option>
                                            ))}
                                            <option value="otro" style={{color:'#1e293b'}}>CUSTOM_SPEC</option>
                                        </select>
                                        <Input
                                            id="oil-type-custom"
                                            placeholder="SPECIFY_BRAND"
                                            className="bg-primary/20 border-primary text-white h-16 rounded-[1.5rem] px-8 font-black italic uppercase tracking-widest hidden"
                                            defaultValue={inspectionChecklist?.findings?.oil_specs?.type || ''}
                                            onBlur={(e) => updateOilSpecs('type', e.target.value)}
                                        />
                                    </div>

                                    {/* VOLUME_SELECTOR */}
                                    <div className="space-y-6 p-10 bg-white/5 rounded-[2.5rem] border border-white/5 hover:bg-white/10 transition-all duration-700 group/oil">
                                        <label className="text-[10px] font-black uppercase tracking-[0.8em] text-slate-500 italic block mb-2 px-2 flex items-center gap-4">
                                            <div className="w-2 h-2 bg-primary rounded-full group-hover/oil:w-8 transition-all"></div> VOL_QUARTS
                                        </label>
                                        <select
                                            className="w-full h-20 rounded-[2rem] px-8 bg-slate-900 border-none text-white font-black italic text-lg focus:ring-4 focus:ring-primary transition-all cursor-pointer uppercase tracking-tighter appearance-none shadow-3xl"
                                            defaultValue={inspectionChecklist?.findings?.oil_specs?.quantity || ''}
                                            onChange={(e) => updateOilSpecs('quantity', e.target.value)}
                                        >
                                            <option value="" style={{color:'#1e293b'}}>-- VOLUME --</option>
                                            {[...Array(20)].map((_, i) => {
                                                const val = (3 + i * 0.5).toFixed(1);
                                                return <option key={val} value={val} style={{color:'#1e293b'}}>{val} QTS</option>;
                                            })}
                                        </select>
                                    </div>

                                    {/* FILTER_SELECTOR */}
                                    <div className="space-y-6 p-10 bg-white/5 rounded-[2.5rem] border border-white/5 hover:bg-white/10 transition-all duration-700 group/oil">
                                        <label className="text-[10px] font-black uppercase tracking-[0.8em] text-slate-500 italic block mb-2 px-2 flex items-center gap-4">
                                            <div className="w-2 h-2 bg-primary rounded-full group-hover/oil:w-8 transition-all"></div> FILT_MODEL
                                        </label>
                                        <select
                                            className="w-full h-20 rounded-[2rem] px-8 bg-slate-900 border-none text-white font-black italic text-lg focus:ring-4 focus:ring-primary transition-all cursor-pointer uppercase tracking-tighter appearance-none shadow-3xl"
                                            defaultValue={
                                                ['FRAM','Motorcraft','Bosch','Purolator','WIX','AC Delco','K&N','STP','Mobil 1','Denso'].includes(inspectionChecklist?.findings?.oil_specs?.filter || '')
                                                    ? (inspectionChecklist?.findings?.oil_specs?.filter || '')
                                                    : (inspectionChecklist?.findings?.oil_specs?.filter ? 'otro' : '')
                                            }
                                            onChange={(e) => {
                                                if (e.target.value !== 'otro') updateOilSpecs('filter', e.target.value);
                                                else updateOilSpecs('filter', '');
                                                const custom = document.getElementById('filter-custom');
                                                if (custom) custom.style.display = e.target.value === 'otro' ? 'block' : 'none';
                                            }}
                                        >
                                            <option value="" style={{color:'#1e293b'}}>-- FILTER --</option>
                                            {['FRAM','Motorcraft','Bosch','Purolator','WIX','AC Delco','K&N','STP','Mobil 1','Denso'].map(f => (
                                                <option key={f} value={f} style={{color:'#1e293b'}}>{f}</option>
                                            ))}
                                            <option value="otro" style={{color:'#1e293b'}}>CUSTOM_FILTER</option>
                                        </select>
                                        <Input
                                            id="filter-custom"
                                            placeholder="FILTER_REF_NUM"
                                            className="bg-primary/20 border-primary text-white h-16 rounded-[1.5rem] px-8 font-black italic uppercase tracking-widest hidden"
                                            defaultValue={inspectionChecklist?.findings?.oil_specs?.filter || ''}
                                            onBlur={(e) => updateOilSpecs('filter', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* MISSION_CHECKLIST_GRID (Detroit Items) */}
                    {Object.keys(grouped).map(cat => (
                        <div key={cat} className="space-y-16 animate-in fade-in duration-1000">
                            <div className="flex items-center gap-8">
                                <div className="w-1.5 h-16 bg-primary rounded-full shadow-3xl shadow-primary/40"></div>
                                <div className="space-y-1">
                                    <h3 className="text-4xl md:text-5xl font-black text-slate-950 uppercase italic tracking-tighter leading-none">{cat}</h3>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.6em] italic">SECTOR_EXECUTION_MATRIX</p>
                                </div>
                                <div className="h-[2px] flex-1 bg-slate-50"></div>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                {grouped[cat].map((item: any, idx: number) => (
                                    <Card key={item.id} className="p-10 md:p-14 rounded-[2.5rem] border-none shadow-3xl shadow-slate-200/40 flex flex-col gap-12 relative overflow-hidden transition-all hover:scale-[1.02] hover:shadow-primary/5 group/entry bg-white">
                                        <div className="absolute top-0 left-0 w-2 h-full bg-slate-50 group-hover/entry:bg-primary/20 transition-all"></div>
                                        <div className="flex justify-between items-start">
                                            <p className="font-black uppercase text-3xl md:text-4xl text-slate-950 leading-none italic tracking-tighter scale-105 origin-left group-hover/entry:text-primary transition-colors">{item.item_name}</p>
                                        </div>
                                        
                                        {/* Status Tactical Toggle */}
                                        <div className="grid grid-cols-3 gap-4 bg-slate-50 p-3 rounded-[2.5rem] border border-slate-100 shadow-inner group-hover/entry:bg-white transition-colors">
                                            <button 
                                                onClick={() => updateItemStatus(item.id, 'OK')} 
                                                className={`flex flex-col items-center justify-center p-6 rounded-[2rem] transition-all duration-500 scale-100 active:scale-95 ${item.status === 'OK' ? 'bg-emerald-500 text-white shadow-[0_20px_50px_-10px_rgba(16,185,129,0.5)]' : 'text-slate-300 hover:text-slate-500 hover:bg-white'}`}
                                            >
                                                <CheckCircle2 size={32} className="stroke-[2.5]" />
                                                <span className="text-[10px] font-black uppercase mt-3 tracking-[0.4em] italic pt-1">FUNCIONAL</span>
                                            </button>
                                            <button 
                                                onClick={() => updateItemStatus(item.id, 'ISSUE')} 
                                                className={`flex flex-col items-center justify-center p-6 rounded-[2rem] transition-all duration-500 scale-100 active:scale-95 ${item.status === 'ISSUE' ? 'bg-rose-500 text-white shadow-[0_20px_50px_-10px_rgba(244,63,94,0.5)]' : 'text-slate-300 hover:text-slate-500 hover:bg-white'}`}
                                            >
                                                <AlertCircle size={32} className="stroke-[2.5]" />
                                                <span className="text-[10px] font-black uppercase mt-3 tracking-[0.4em] italic pt-1">REPORTAR</span>
                                            </button>
                                            <button 
                                                onClick={() => updateItemStatus(item.id, 'N/A')} 
                                                className={`flex flex-col items-center justify-center p-6 rounded-[2rem] transition-all duration-500 scale-100 active:scale-95 ${item.status === 'N/A' ? 'bg-slate-950 text-white shadow-[0_20px_50px_-10px_rgba(15,23,42,0.5)]' : 'text-slate-300 hover:text-slate-500 hover:bg-white'}`}
                                            >
                                                <Minus size={32} className="stroke-[2.5]" />
                                                <span className="text-[10px] font-black uppercase mt-3 tracking-[0.4em] italic pt-1">EXT_OS</span>
                                            </button>
                                        </div>

                                        {/* Entry Input Matrix */}
                                        <div className="flex flex-col sm:flex-row gap-6 pt-10 border-t border-slate-50">
                                            <div className="flex-1 relative group/entryin">
                                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/entryin:text-primary transition-colors">
                                                    <FileText size={22} />
                                                </div>
                                                <Input 
                                                    placeholder="OBSERVACIONES TÉCNICAS A PIE DE MÁQUINA..." 
                                                    className="pl-20 bg-slate-50 border-none rounded-[1.8rem] placeholder:italic h-18 py-8 font-black text-sm text-slate-800 uppercase italic tracking-widest focus:ring-4 focus:ring-primary/10" 
                                                    defaultValue={item.notes || ''} 
                                                    onBlur={(e) => updateItemNotes(item.id, e.target.value)}
                                                />
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                onClick={() => toast({ title: "OPTIC_SYNC_ACTIVE", description: "Iniciando captura de evidencia Detroit...", type: "info"})} 
                                                className="h-18 w-24 bg-slate-950 rounded-[1.8rem] text-primary hover:bg-primary hover:text-white border-none shadow-3xl transition-all scale-100 active:scale-90"
                                            >
                                                <Camera size={32} />
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                    
                    {/* MISSION_OUTRO (High Fidelty Finalization) */}
                    <section className="bg-slate-950 p-16 md:p-32 rounded-[2.5rem] text-center space-y-16 shadow-3xl text-white relative overflow-hidden group/final">
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent opacity-60"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,46,91,0.05)_0%,transparent_70%)]"></div>
                        
                        <div className="max-w-4xl mx-auto space-y-10 relative z-10">
                            <div className="flex items-center justify-center gap-6 mb-4">
                                <Terminal size={40} className="text-primary animate-pulse" />
                                <span className="text-[12px] font-black uppercase text-primary tracking-[1em] italic">FINAL_MISSION_STATUS</span>
                            </div>
                            <h3 className="text-7xl md:text-[8rem] font-black italic uppercase tracking-tighter leading-[0.75] transition-all group-hover/final:scale-110">DICTAMEN<br /><span className="text-primary">TECNICO_FINAL</span></h3>
                            <p className="text-slate-500 text-xl font-black uppercase tracking-[0.4em] italic opacity-60">TRANSMISIÓN DE REPORTE DE CAMPO Denver_Detroit_HQ</p>
                        </div>

                        <div className="max-w-5xl mx-auto relative z-10 group/text">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-white/5 rounded-[2.5rem] blur opacity-25 group-hover/text:opacity-50 transition-opacity"></div>
                            <textarea 
                                className="relative w-full h-64 p-12 bg-slate-900/80 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 outline-none focus:ring-8 focus:ring-primary/20 transition-all text-3xl italic font-black uppercase tracking-tighter text-white placeholder:text-slate-800 shadow-inner overflow-hidden resize-none" 
                                placeholder="INGRESE REPORTE DE CIERRE OPERATIVO..." 
                                defaultValue={inspectionChecklist?.findings && typeof inspectionChecklist.findings === 'object' ? (inspectionChecklist.findings.summary || '') : ''}
                                onBlur={(e) => {
                                    const newFindings = { ...(inspectionChecklist?.findings || {}), summary: e.target.value };
                                    supabase.from('inspection_checklists').update({ findings: newFindings }).eq('id', inspectionChecklist.id).then();
                                    setInspectionChecklist({ ...inspectionChecklist, findings: newFindings });
                                }}
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-10 justify-center items-center relative z-10 pt-10">
                            <Button 
                                onClick={publishChecklist} 
                                disabled={saving}
                                className="h-28 px-24 rounded-[2.5rem] font-black text-2xl tracking-[0.2em] bg-primary hover:bg-white text-white hover:text-slate-950 border-none shadow-[0_40px_100px_-20px_rgba(255,46,91,0.6)] hover:shadow-primary/40 transition-all duration-1000 scale-110 hover:scale-125 hover:-rotate-1 active:scale-95 disabled:opacity-50"
                            >
                                {saving ? "TRANSMITIENDO..." : "✅ PUBLICAR_EXPEDIENTE"}
                            </Button>
                            <Button 
                                variant="ghost" 
                                onClick={() => navigate('/tech')} 
                                className="h-20 text-slate-500 hover:text-white font-black text-sm tracking-[0.6em] uppercase italic transition-all group-hover/final:translate-x-6"
                            >
                                CONTINUAR LUEGO <MoveRight className="ml-6" />
                            </Button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
