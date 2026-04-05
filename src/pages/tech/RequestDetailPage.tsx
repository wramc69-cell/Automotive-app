import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { useToast } from '../../components/ui/Toast';
import { 
    ArrowLeft, Plus, Trash2, Calendar, User, Hash, Wrench, Clock, Save, LogOut, Camera, Check, X, Minus, Droplet, FileText
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
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
            // Si es un cambio de aceite y hay un millaje nuevo, actualizamos el odómetro del vehículo
            if (isOilService && inspectionChecklist.findings?.oil_specs?.current_odometer) {
                const newOdo = parseInt(inspectionChecklist.findings.oil_specs.current_odometer);
                if (!isNaN(newOdo) && request?.vehicles?.id) {
                    await supabaseAdmin.from('vehicles').update({ odometer: newOdo }).eq('id', request.vehicles.id);
                }
            }

            // Marcar el checklist como completado
            const { error: clError } = await supabase
                .from('inspection_checklists')
                .update({ status: 'COMPLETED' })
                .eq('id', inspectionChecklist.id);
            if (clError) throw clError;

            // Actualizar el estado del servicio a COMPLETED usando supabaseAdmin (el rol tech no tiene UPDATE en service_requests por RLS)
            const { error: srError } = await supabaseAdmin
                .from('service_requests')
                .update({ status: 'COMPLETED' })
                .eq('id', requestId);
            if (srError) throw srError;

            toast({ title: '✅ Servicio Efectuado', description: 'El servicio ha sido registrado como completado y enviado a administración.', type: 'success' });
            navigate('/tech');
        } catch(err: any){
            console.error('publishChecklist error:', err);
            toast({ title: 'Error', description: 'No se pudo completar el servicio. Intenta nuevamente.', type: 'error' });
        } finally {
            setSaving(false);
        }
    }

    if (loading && !request) return <div className="p-20 text-center font-black animate-pulse">ESTABLECIENDO CONEXIÓN...</div>;

    const isOilChange = request?.service_catalog?.name?.toLowerCase()?.includes('aceite');
    
    const grouped: any = {};
    (items || []).forEach((i: any) => {
        const cat = i.category || 'General';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(i);
    });

    const appointment = request?.appointments?.[0];

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-10 pb-32">
            {/* BARRA DE NAVEGACIÓN SUPERIOR */}
            <div className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm border sticky top-4 z-50">
                <Button variant="ghost" onClick={() => navigate('/tech')} className="font-black text-slate-500 hover:text-indigo-600">
                    <ArrowLeft className="mr-2" size={18} /> MIS SERVICIOS
                </Button>
                <div className="flex items-center gap-3">
                    <Badge className="bg-slate-100 text-slate-900 border-none font-black italic">TICKET #{request?.ticket_number || 'S/N'}</Badge>
                    <Button variant="outline" className="border-rose-100 text-rose-500 font-bold" onClick={() => navigate('/tech')}>
                        <LogOut className="mr-2" size={18} /> SALIR
                    </Button>
                </div>
            </div>

            {/* PANEL DE CONTEXTO PREMIUM */}
            <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                    <Hash size={200} />
                </div>
                <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-4">
                        <Badge className="bg-indigo-600 px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em]">{request?.status || 'PENDIENTE'}</Badge>
                        <span className="h-1 w-12 bg-white/20 rounded-full"></span>
                        <p className="text-slate-400 font-black italic">Ref: {request?.ticket_number || 'Sin correlativo'}</p>
                    </div>
                    
                    <div>
                        <h1 className="text-6xl font-black italic uppercase tracking-tighter leading-none">
                            {request?.vehicles?.year || '—'} {request?.vehicles?.make || '—'} {request?.vehicles?.model || '—'}
                        </h1>
                        <p className="text-2xl text-indigo-400 font-black mt-2 italic">
                            {request?.vehicles?.trim && <span>{request.vehicles.trim} · </span>}
                            {request?.vehicles?.powertrain && <span>{request.vehicles.powertrain}</span>}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-10 border-t border-slate-800">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><User size={12} className="text-indigo-400" /> Dueño</p>
                            <p className="font-bold text-lg">{request?.profiles ? `${request.profiles.first_name} ${request.profiles.last_name}` : 'Cliente Denver'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Calendar size={12} className="text-indigo-400" /> Fecha</p>
                            <p className="font-bold text-lg">{appointment?.scheduled_start ? new Date(appointment.scheduled_start).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Pendiente'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Clock size={12} className="text-indigo-400" /> Hora</p>
                            <p className="font-bold text-lg">{appointment?.scheduled_start ? new Date(appointment.scheduled_start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'S/H'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Wrench size={12} className="text-indigo-400" /> Tipo Tarea</p>
                            <p className="font-bold text-lg text-indigo-300">{request?.service_catalog?.name || 'Inspección'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTROL DE PLANTILLA */}
            {!inspectionChecklist ? (
                <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[4rem] border-4 border-dashed border-slate-100 gap-6">
                    <div className="p-8 bg-indigo-50 rounded-full text-indigo-600 animate-bounce"><Plus size={48} /></div>
                    <div className="text-center">
                        <h3 className="text-2xl font-black uppercase italic">¿Listo para empezar la inspección?</h3>
                        <p className="text-slate-400 font-medium mt-2">Selecciona abajo la hoja de ruta que mejor se ajuste a este servicio.</p>
                    </div>
                    <Button onClick={() => setShowSelector(true)} className="bg-indigo-600 h-16 px-12 rounded-[2rem] font-black text-xl shadow-2xl hover:scale-105 transition-all">
                        ELEGIR HOJA DE SERVICIO
                    </Button>
                </div>
            ) : (
                <div className="flex justify-between items-center p-8 bg-white rounded-[3rem] border shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-green-50 rounded-2xl text-green-600"><Save size={24} /></div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Inspección en curso</p>
                            <h4 className="font-black text-slate-900 uppercase">Progreso guardado automáticamente</h4>
                        </div>
                    </div>
                    <Button variant="outline" onClick={() => setShowSelector(true)} className="border-rose-100 text-rose-500 font-black h-12 rounded-xl">
                        <Trash2 size={18} className="mr-2" /> REINICIAR TODO
                    </Button>
                </div>
            )}

            {/* SELECTOR DE PLANTILLA INTERACTIVO */}
            {showSelector && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-10 duration-500">
                    {templates.map(t => (
                        <button key={t.id} onClick={() => generate(t.id)} className="group p-8 rounded-[3rem] bg-white border-2 border-slate-100 hover:border-indigo-600 text-center transition-all shadow-lg hover:shadow-2xl">
                            <div className="h-16 w-16 bg-slate-50 group-hover:bg-indigo-600 rounded-3xl mx-auto mb-6 flex items-center justify-center text-slate-400 group-hover:text-white transition-all">
                                <Plus size={32} />
                            </div>
                            <p className="font-black uppercase text-sm text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{t.name}</p>
                        </button>
                    ))}
                </div>
            )}

            {/* LISTADO DE CATEGORÍAS Y TAREAS */}
            {inspectionChecklist && (
                <div className="space-y-16">
                    {/* MODULO DE ACEITE (SOLO SI ES CAMBIO DE ACEITE) */}
                    {isOilChange && (
                        <div className="bg-indigo-600 rounded-[3rem] p-12 text-white shadow-xl relative overflow-hidden">
                            <Droplet size={120} className="absolute right-[-20px] top-[-20px] opacity-10" />
                            <div className="relative z-10 space-y-8">
                                <h3 className="text-3xl font-black italic uppercase tracking-tighter">Especificaciones del Cambio de Aceite</h3>
                                
                                {/* ODOMETER SECTION */}
                                <div className="p-6 bg-white/10 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="space-y-1">
                                        <p className="text-xs font-black uppercase tracking-widest text-indigo-300">Millaje Inicial (Registrado)</p>
                                        <p className="text-2xl font-black">{request?.vehicles?.odometer ? `${request.vehicles.odometer.toLocaleString('en-US')} mi` : 'No Registrado'}</p>
                                    </div>
                                    <div className="flex-1 md:max-w-xs space-y-2">
                                        <p className="text-xs font-black uppercase tracking-widest text-indigo-200">Millas Actuales (Tablero)</p>
                                        <Input 
                                            type="number"
                                            placeholder="Ingresa millas actuales..." 
                                            className="bg-white text-slate-900 placeholder:text-slate-400 h-14 rounded-2xl font-black text-xl"
                                            defaultValue={inspectionChecklist?.findings?.oil_specs?.current_odometer || ''}
                                            onBlur={(e) => updateOilSpecs('current_odometer', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* OIL INFO SECTION */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* OIL BRAND */}
                                    <div className="space-y-2">
                                        <p className="text-xs font-black uppercase tracking-widest text-indigo-200">Marca de Aceite Sintético</p>
                                        <select
                                            className="w-full h-14 rounded-2xl px-4 bg-white/10 border border-white/20 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                                            defaultValue={
                                                ['Mobil 1','Castrol EDGE','Valvoline','Pennzoil Platinum','Shell Rotella T6','Royal Purple','Quaker State','STP','Havoline','Lucas Oil'].includes(inspectionChecklist?.findings?.oil_specs?.type || '')
                                                    ? (inspectionChecklist?.findings?.oil_specs?.type || '')
                                                    : (inspectionChecklist?.findings?.oil_specs?.type ? 'otro' : '')
                                            }
                                            onChange={(e) => {
                                                if (e.target.value !== 'otro') updateOilSpecs('type', e.target.value);
                                                else updateOilSpecs('type', '');
                                                // toggle visibility of custom input
                                                const custom = document.getElementById('oil-type-custom');
                                                if (custom) custom.style.display = e.target.value === 'otro' ? 'block' : 'none';
                                            }}
                                        >
                                            <option value="" style={{color:'#1e293b'}}>-- Seleccionar marca --</option>
                                            <option value="Mobil 1" style={{color:'#1e293b'}}>Mobil 1</option>
                                            <option value="Castrol EDGE" style={{color:'#1e293b'}}>Castrol EDGE</option>
                                            <option value="Valvoline" style={{color:'#1e293b'}}>Valvoline</option>
                                            <option value="Pennzoil Platinum" style={{color:'#1e293b'}}>Pennzoil Platinum</option>
                                            <option value="Shell Rotella T6" style={{color:'#1e293b'}}>Shell Rotella T6</option>
                                            <option value="Royal Purple" style={{color:'#1e293b'}}>Royal Purple</option>
                                            <option value="Quaker State" style={{color:'#1e293b'}}>Quaker State</option>
                                            <option value="STP" style={{color:'#1e293b'}}>STP</option>
                                            <option value="Havoline" style={{color:'#1e293b'}}>Havoline</option>
                                            <option value="Lucas Oil" style={{color:'#1e293b'}}>Lucas Oil</option>
                                            <option value="otro" style={{color:'#1e293b'}}>Otro (especificar)</option>
                                        </select>
                                        <Input
                                            id="oil-type-custom"
                                            placeholder="Especifica marca / viscosidad..."
                                            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 rounded-2xl"
                                            style={{ display: (inspectionChecklist?.findings?.oil_specs?.type && !['Mobil 1','Castrol EDGE','Valvoline','Pennzoil Platinum','Shell Rotella T6','Royal Purple','Quaker State','STP','Havoline','Lucas Oil'].includes(inspectionChecklist?.findings?.oil_specs?.type)) ? 'block' : 'none' }}
                                            defaultValue={inspectionChecklist?.findings?.oil_specs?.type || ''}
                                            onBlur={(e) => updateOilSpecs('type', e.target.value)}
                                        />
                                    </div>

                                    {/* QUANTITY */}
                                    <div className="space-y-2">
                                        <p className="text-xs font-black uppercase tracking-widest text-indigo-200">Cantidad (Cuartos)</p>
                                        <select
                                            className="w-full h-14 rounded-2xl px-4 bg-white/10 border border-white/20 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                                            defaultValue={inspectionChecklist?.findings?.oil_specs?.quantity || ''}
                                            onChange={(e) => updateOilSpecs('quantity', e.target.value)}
                                        >
                                            <option value="" style={{color:'#1e293b'}}>-- Seleccionar --</option>
                                            <option value="4" style={{color:'#1e293b'}}>4 cuartos</option>
                                            <option value="4.5" style={{color:'#1e293b'}}>4.5 cuartos</option>
                                            <option value="5" style={{color:'#1e293b'}}>5 cuartos</option>
                                            <option value="5.5" style={{color:'#1e293b'}}>5.5 cuartos</option>
                                            <option value="6" style={{color:'#1e293b'}}>6 cuartos</option>
                                            <option value="6.5" style={{color:'#1e293b'}}>6.5 cuartos</option>
                                            <option value="7" style={{color:'#1e293b'}}>7 cuartos</option>
                                        </select>
                                    </div>

                                    {/* FILTER BRAND */}
                                    <div className="space-y-2">
                                        <p className="text-xs font-black uppercase tracking-widest text-indigo-200">Marca de Filtro</p>
                                        <select
                                            className="w-full h-14 rounded-2xl px-4 bg-white/10 border border-white/20 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
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
                                            <option value="" style={{color:'#1e293b'}}>-- Seleccionar filtro --</option>
                                            <option value="FRAM" style={{color:'#1e293b'}}>FRAM</option>
                                            <option value="Motorcraft" style={{color:'#1e293b'}}>Motorcraft</option>
                                            <option value="Bosch" style={{color:'#1e293b'}}>Bosch</option>
                                            <option value="Purolator" style={{color:'#1e293b'}}>Purolator</option>
                                            <option value="WIX" style={{color:'#1e293b'}}>WIX</option>
                                            <option value="AC Delco" style={{color:'#1e293b'}}>AC Delco</option>
                                            <option value="K&N" style={{color:'#1e293b'}}>K&N</option>
                                            <option value="STP" style={{color:'#1e293b'}}>STP</option>
                                            <option value="Mobil 1" style={{color:'#1e293b'}}>Mobil 1</option>
                                            <option value="Denso" style={{color:'#1e293b'}}>Denso</option>
                                            <option value="otro" style={{color:'#1e293b'}}>Otro (especificar)</option>
                                        </select>
                                        <Input
                                            id="filter-custom"
                                            placeholder="Especifica marca / número de filtro..."
                                            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 rounded-2xl"
                                            style={{ display: (inspectionChecklist?.findings?.oil_specs?.filter && !['FRAM','Motorcraft','Bosch','Purolator','WIX','AC Delco','K&N','STP','Mobil 1','Denso'].includes(inspectionChecklist?.findings?.oil_specs?.filter)) ? 'block' : 'none' }}
                                            defaultValue={inspectionChecklist?.findings?.oil_specs?.filter || ''}
                                            onBlur={(e) => updateOilSpecs('filter', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {Object.keys(grouped).map(cat => (
                        <div key={cat} className="space-y-8">
                            <div className="flex items-center gap-6">
                                <span className="h-3 w-3 bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]"></span>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.5em]">{cat}</h3>
                                <div className="h-[1px] flex-1 bg-slate-100"></div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {grouped[cat].map((item: any) => (
                                    <Card key={item.id} className="p-8 rounded-[3rem] border-2 border-slate-50 shadow-lg shadow-slate-100 flex flex-col gap-6 relative overflow-hidden transition-all">
                                        <div className="flex justify-between items-start gap-4">
                                            <p className="font-black uppercase text-xl text-slate-900 leading-tight italic pr-4">{item.item_name}</p>
                                        </div>
                                        
                                        {/* Botones de Estado tipo Checklist Clásico */}
                                        <div className="grid grid-cols-3 gap-3 bg-slate-50 p-2 rounded-[2rem]">
                                            <button 
                                                onClick={() => updateItemStatus(item.id, 'OK')} 
                                                className={`flex flex-col items-center justify-center p-3 rounded-3xl transition-all ${item.status === 'OK' ? 'bg-green-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-600'}`}
                                            >
                                                <Check size={20} className="mb-1" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">OK</span>
                                            </button>
                                            <button 
                                                onClick={() => updateItemStatus(item.id, 'ISSUE')} 
                                                className={`flex flex-col items-center justify-center p-3 rounded-3xl transition-all ${item.status === 'ISSUE' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-600'}`}
                                            >
                                                <X size={20} className="mb-1" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">No Cumple</span>
                                            </button>
                                            <button 
                                                onClick={() => updateItemStatus(item.id, 'N/A')} 
                                                className={`flex flex-col items-center justify-center p-3 rounded-3xl transition-all ${item.status === 'N/A' ? 'bg-slate-400 text-white shadow-md' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-600'}`}
                                            >
                                                <Minus size={20} className="mb-1" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">N/A</span>
                                            </button>
                                        </div>

                                        {/* Notas y Foto */}
                                        <div className="flex gap-3 pt-4 border-t border-slate-100">
                                            <div className="flex-1 relative">
                                                <FileText size={16} className="absolute left-4 top-4 text-slate-300" />
                                                <Input 
                                                    placeholder="Añadir comentario técnico..." 
                                                    className="pl-12 bg-slate-50 border-none rounded-2xl placeholder:italic h-12" 
                                                    defaultValue={item.notes || ''} 
                                                    onBlur={(e) => updateItemNotes(item.id, e.target.value)}
                                                />
                                            </div>
                                            <Button variant="ghost" onClick={() => toast({ title: "Cámara", description: "Función de cámara simulada", type: "info"})} className="h-12 w-12 bg-slate-50 rounded-2xl text-slate-400 hover:bg-indigo-50 hover:text-indigo-600">
                                                <Camera size={20} />
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                    
                    {/* ACCIÓN DE CIERRE FINAL */}
                    <div className="bg-slate-900 p-16 rounded-[5rem] text-center space-y-8 shadow-3xl text-white">
                        <div className="max-w-2xl mx-auto space-y-4">
                            <h3 className="text-5xl font-black italic uppercase tracking-tighter">Confirmar Servicio</h3>
                            <p className="text-slate-400 text-lg font-medium">Al confirmar, el servicio quedará registrado como <span className="text-emerald-400 font-black">COMPLETADO</span> y el reporte será enviado al panel de administración.</p>
                        </div>
                        <textarea 
                            className="w-full h-40 p-10 bg-slate-800 rounded-[3rem] border-none outline-none focus:ring-4 focus:ring-indigo-600 transition-all text-xl italic" 
                            placeholder="Resumen técnico final del servicio..." 
                            defaultValue={inspectionChecklist?.findings && typeof inspectionChecklist.findings === 'object' ? (inspectionChecklist.findings.summary || '') : ''}
                            onBlur={(e) => {
                                const newFindings = { ...(inspectionChecklist?.findings || {}), summary: e.target.value };
                                supabase.from('inspection_checklists').update({ findings: newFindings }).eq('id', inspectionChecklist.id).then();
                                setInspectionChecklist({ ...inspectionChecklist, findings: newFindings });
                            }}
                        />
                        <div className="flex flex-col md:flex-row gap-4 justify-center">
                            <Button 
                                onClick={publishChecklist} 
                                disabled={saving}
                                className="h-20 px-16 rounded-[2.5rem] font-black text-xl bg-emerald-500 hover:bg-emerald-600 shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {saving ? "GUARDANDO..." : "✅ SERVICIO EFECTUADO"}
                            </Button>
                            <Button variant="ghost" onClick={() => navigate('/tech')} className="h-20 px-10 rounded-[2.5rem] font-black text-slate-400 hover:text-white">VOLVER LUEGO (BORRADOR)</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
