import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import { 
    Plus, Edit, Trash2, GitBranch, 
    AlertCircle, LayoutGrid, ArrowRight, Settings,
    Zap, Activity, ShieldCheck, Terminal, Layers, 
    ChevronRight, MoveRight, Box, Cpu, Info, Power,
    ArrowUpRight, Target, Share2, Search, CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

// Helper component for Select to maintain visual consistency
function CommandSelect({ value, onChange, options, label }: any) {
    return (
        <div className="space-y-4">
            {label && <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] px-4 font-mono">{label}</label>}
            <div className="relative group">
                <select 
                    value={value} 
                    onChange={onChange}
                    className="w-full h-20 px-8 rounded-3xl bg-slate-50 border-4 border-transparent font-black uppercase text-[12px] tracking-tight hover:bg-white focus:border-primary outline-none transition-all cursor-pointer appearance-none shadow-inner"
                >
                    {options.map((opt: any) => (
                        <option key={opt.value} value={opt.value} className="bg-white text-slate-950">{opt.label.toUpperCase()}</option>
                    ))}
                </select>
                <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 group-hover:text-primary transition-colors">
                    <ChevronRight size={24} className="rotate-90" />
                </div>
            </div>
        </div>
    );
}

interface Rule {
    id: string;
    service_catalog_id: string;
    template_id: string;
    priority: number;
    is_default: boolean;
    is_active: boolean;
    service?: { code: string; name: string };
    template?: { code: string; name: string };
}

export function AdminTemplateRulesPage() {
    const { toast } = useToast();
    const [rules, setRules] = useState<Rule[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<Rule | null>(null);
    const [form, setForm] = useState({
        service_catalog_id: '',
        template_id: '',
        priority: 0,
        is_default: false,
        is_active: true
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [rulesRes, servicesRes, templatesRes] = await Promise.all([
                supabase.from('service_template_rules').select('*, service:service_catalog(code, name), template:checklist_templates(code, name)').order('priority', { ascending: false }),
                supabase.from('service_catalog').select('*').eq('active', true).order('name'),
                supabase.from('checklist_templates').select('*').eq('is_active', true).order('name')
            ]);

            if (rulesRes.error) throw rulesRes.error;
            setRules(rulesRes.data || []);
            setServices(servicesRes.data || []);
            setTemplates(templatesRes.data || []);
        } catch (error: any) {
            toast({ title: 'Error de Red', description: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = (rule?: Rule) => {
        if (rule) {
            setEditingRule(rule);
            setForm({
                service_catalog_id: rule.service_catalog_id,
                template_id: rule.template_id,
                priority: rule.priority,
                is_default: rule.is_default,
                is_active: rule.is_active
            });
        } else {
            setEditingRule(null);
            setForm({
                service_catalog_id: services[0]?.id || '',
                template_id: templates[0]?.id || '',
                priority: 10,
                is_default: false,
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (form.is_default) {
            const hasExistingDefault = rules.some(r => r.service_catalog_id === form.service_catalog_id && r.is_default && r.id !== editingRule?.id);
            if (hasExistingDefault) {
                toast({ title: 'Conflicto de Lógica', description: 'Ya existe una plantilla predeterminada para este servicio.', type: 'error' });
                return;
            }
        }

        try {
            if (editingRule) {
                const { error } = await supabase.from('service_template_rules').update(form).eq('id', editingRule.id);
                if (error) throw error;
                toast({ title: 'Lógica Actualizada', description: 'Mapeo de protocolo comprometido con éxito.', type: 'success' });
            } else {
                const { error } = await supabase.from('service_template_rules').insert([form]);
                if (error) throw error;
                toast({ title: 'Enrutador Activado', description: 'Nueva regla de asignación registrada.', type: 'success' });
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast({ title: 'Falla en el Motor', description: error.message, type: 'error' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta regla de asignación? Este cambio afectará la orquestación técnica inmediata.')) return;
        const { error } = await supabase.from('service_template_rules').delete().eq('id', id);
        if (error) toast({ title: 'Error', description: error.message, type: 'error' });
        else {
            toast({ title: 'Regla Eliminada', type: 'success' });
            fetchData();
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 px-4">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-slate-100 rounded-3xl animate-pulse"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-primary animate-bounce" />
                </div>
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Sincronizando Motor de Enrutamiento Denver...</p>
        </div>
    );

    return (
        <div className="max-w-[1700px] mx-auto space-y-12 pb-32 animate-in fade-in duration-700 px-4 mt-8">
            {/* Header: Routing Orchestrator */}
            <header className="relative p-12 md:p-20 bg-slate-950 rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-b-8 border-primary/20">
                <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-primary/10 via-primary/5 to-transparent"></div>
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/10 blur-[150px] rounded-full"></div>
                
                <div className="relative z-10 flex flex-col xl:flex-row justify-between items-end gap-12">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-12 w-full xl:w-auto">
                        <div className="w-32 h-32 bg-white/5 rounded-[2.5rem] flex items-center justify-center border-4 border-white/10 shadow-3xl backdrop-blur-2xl group shrink-0">
                            <GitBranch className="w-16 h-16 text-primary group-hover:rotate-180 transition-transform duration-1000" />
                        </div>
                        <div className="text-center md:text-left space-y-8">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
                                <h1 className="text-6xl md:text-9xl font-black italic tracking-tighter text-white uppercase leading-[0.8] pt-2">Motor de Reglas</h1>
                                <Badge className="bg-primary text-white text-[12px] font-black border-none px-8 py-3 rounded-xl shadow-[0_20px_50px_rgba(255,46,91,0.4)] tracking-[0.4em]">ROUTING_ENGINE_v4</Badge>
                            </div>
                            <div className="flex items-center justify-center md:justify-start gap-3">
                                <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                                <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[12px]">Orquestación de servicios y protocolos tácticos</p>
                            </div>
                        </div>
                    </div>
                    
                    <Button 
                        onClick={() => handleOpenModal()} 
                        className="h-24 md:h-32 px-12 md:px-20 rounded-[2.5rem] md:rounded-[2.5rem] bg-primary text-white font-black italic text-xl md:text-2xl tracking-tighter hover:bg-white hover:text-slate-950 transition-all duration-700 shadow-[0_30px_60px_rgba(255,46,91,0.3)] border-none shrink-0 group"
                    >
                        <Plus className="w-10 h-10 mr-6 group-hover:rotate-90 transition-transform" />
                        AGREGAR MAPEO
                    </Button>
                </div>
            </header>

            {/* Rules Board: The Logical Matrix */}
            <div className="space-y-12">
                {rules.length === 0 ? (
                    <div className="py-60 text-center bg-slate-50 rounded-[2.5rem] border-8 border-dashed border-slate-100 space-y-10 group overflow-hidden relative">
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse"></div>
                        <div className="w-40 h-40 bg-white rounded-[2.5rem] flex items-center justify-center text-slate-200 mx-auto shadow-3xl border-4 border-slate-100 relative z-10">
                            <Terminal size={80} className="group-hover:rotate-12 transition-transform duration-700" />
                        </div>
                        <div className="space-y-6 relative z-10">
                            <h3 className="text-5xl font-black italic uppercase tracking-tighter text-slate-300 leading-none">Matriz de Lógica Vacía</h3>
                            <p className="text-[16px] font-black text-slate-400 uppercase tracking-[0.5em] italic leading-loose opacity-50 underline decoration-primary/20 decoration-8 underline-offset-[12px]">
                                NO_ROUTING_PROTOCOLS_DEFINED_IN_THIS_SECTOR
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-12">
                        {rules.map((rule, idx) => (
                            <Card key={rule.id} className={`group relative bg-white border-none rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] overflow-hidden transition-all duration-700 hover:-translate-y-4 ${!rule.is_active ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                                <CardContent className="p-12 md:p-16">
                                    <div className="flex flex-col xl:flex-row items-center justify-between gap-16">
                                        
                                        {/* Logic Linkage Feed */}
                                        <div className="flex-1 flex flex-col md:flex-row items-center gap-12 w-full">
                                            {/* Source Segment */}
                                            <div className="flex-1 space-y-6 text-center md:text-left">
                                                <div className="flex items-center justify-center md:justify-start gap-4">
                                                    <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-primary shadow-xl">
                                                        <Box size={20} />
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] pt-1">CATÁLOGO_ORIGEN</span>
                                                </div>
                                                <h3 className="text-4xl md:text-5xl font-black text-slate-950 uppercase italic tracking-tighter leading-none group-hover:text-primary transition-colors">
                                                    {rule.service?.name}
                                                </h3>
                                                <Badge className="bg-slate-100 text-slate-500 text-[10px] font-black border-none px-6 py-2 rounded-xl shadow-inner italic">@{rule.service?.code || 'UNNAMED'}</Badge>
                                            </div>

                                            {/* Tactical Bridge */}
                                            <div className="shrink-0 flex items-center justify-center">
                                                <div className="w-24 h-24 rounded-full bg-slate-50 border-4 border-dashed border-slate-200 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/5 transition-all duration-700 relative">
                                                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-[20px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                    <MoveRight size={48} className="text-slate-300 group-hover:text-primary group-hover:translate-x-3 transition-all duration-700 relative z-10" />
                                                </div>
                                            </div>

                                            {/* Destination Segment */}
                                            <div className="flex-1 space-y-6 text-center md:text-left">
                                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                                    <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-primary shadow-xl">
                                                        <Layers size={20} />
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] pt-1">PLANTILLA_DESTINO</span>
                                                    {rule.is_default && <Badge className="bg-emerald-500 text-white text-[9px] font-black border-none px-6 py-1.5 rounded-full shadow-[0_10px_30px_rgba(16,185,129,0.3)] animate-pulse uppercase tracking-[0.2em]">DEFAULT_SYS</Badge>}
                                                </div>
                                                <h3 className="text-4xl md:text-5xl font-black text-slate-950 uppercase italic tracking-tighter leading-none">
                                                    {rule.template?.name}
                                                </h3>
                                                <Badge className="bg-primary/10 text-primary text-[10px] font-black border-2 border-primary/20 px-6 py-2 rounded-xl italic">SYS_{rule.template?.code || 'X01'}</Badge>
                                            </div>
                                        </div>

                                        {/* Priority & Control Node */}
                                        <div className="flex items-center gap-12 w-full xl:w-auto xl:border-l-4 xl:border-slate-100 xl:pl-16">
                                            <div className="flex flex-col items-center gap-2 group/rank">
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] mb-2 font-mono italic">RANK</span>
                                                <div className="text-8xl font-black italic tracking-tighter text-slate-100 group-hover/rank:text-primary transition-colors leading-none pt-2">
                                                    {rule.priority.toString().padStart(2, '0')}
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-6 flex-1 lg:flex-none">
                                                <div className="flex items-center justify-end gap-3">
                                                    <Badge className={`px-6 h-12 flex items-center justify-center rounded-2xl border-none shadow-xl text-[10px] font-black tracking-[0.3em] font-mono italic ${rule.is_active ? 'bg-emerald-500 text-white' : 'bg-slate-950 text-white/20'}`}>
                                                        {rule.is_active ? 'OP_ACTIVE' : 'SUSPENDED'}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-end gap-4">
                                                    <button 
                                                        onClick={() => handleOpenModal(rule)}
                                                        className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center text-white hover:bg-primary transition-all shadow-2xl active:scale-95 group/edit"
                                                    >
                                                        <Edit size={28} className="group-hover/edit:rotate-12 transition-transform" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(rule.id)}
                                                        className="w-16 h-16 bg-rose-50 text-rose-300 hover:bg-rose-500 hover:text-white rounded-2xl flex items-center justify-center transition-all shadow-2xl active:scale-95 group/del"
                                                    >
                                                        <Trash2 size={28} className="group-hover/del:scale-110 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-4 w-full bg-slate-50 mt-16 rounded-full overflow-hidden">
                                        <div className={`h-full transition-all duration-1000 ${rule.is_active ? 'bg-primary w-full shadow-[0_0_20px_#FF2E5B]' : 'bg-slate-200 w-0'}`}></div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Rule Editor Modal: Immersive Console */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-[20px] z-[130] flex items-center justify-center p-6 animate-in fade-in duration-500">
                    <Card className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-[0_100px_200px_-50px_rgba(0,0,0,1)] border-none overflow-hidden animate-in zoom-in-95 duration-500">
                        <CardHeader className="bg-slate-950 p-16 md:p-24 text-center relative">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                            <div className="w-32 h-32 bg-white/5 rounded-[2.5rem] flex items-center justify-center text-primary mx-auto mb-10 backdrop-blur-2xl border-2 border-white/10 shadow-3xl">
                                <Cpu size={64} className="animate-spin-slow" />
                            </div>
                            <h3 className="text-5xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.8] pt-2">Lógica Operativa</h3>
                            <p className="text-slate-500 font-bold uppercase text-[12px] tracking-[0.5em] mt-10">CORE_ROUTING_PARAMETERS_v4</p>
                        </CardHeader>
                        
                        <CardContent className="p-16 md:p-24 space-y-16 max-h-[50vh] overflow-y-auto scrollbar-hide">
                            <form id="rule-form" onSubmit={handleSubmit} className="space-y-16">
                                <div className="space-y-12">
                                    <CommandSelect 
                                        label="SELECCIONAR_SERVICIO_CATALOG"
                                        value={form.service_catalog_id} 
                                        onChange={(e: any) => setForm({...form, service_catalog_id: e.target.value})}
                                        options={services.map(s => ({ value: s.id, label: s.name }))}
                                    />

                                    <div className="flex justify-center relative">
                                        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 rounded-full"></div>
                                        <div className="w-16 h-16 bg-white rounded-3xl border-4 border-slate-100 flex items-center justify-center z-10 text-primary shadow-2xl animate-bounce">
                                            <ArrowRight size={32} className="rotate-90" />
                                        </div>
                                    </div>

                                    <CommandSelect 
                                        label="ASIGNAR_PLANTILLA_INSPECCIÓN"
                                        value={form.template_id} 
                                        onChange={(e: any) => setForm({...form, template_id: e.target.value})}
                                        options={templates.map(t => ({ value: t.id, label: t.name }))}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-6">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] px-4 font-mono italic">RANKING_PRIORIDAD</label>
                                        <div className="relative group">
                                            <input 
                                                type="number" 
                                                className="w-full h-24 rounded-[2.5rem] bg-slate-950 border-4 border-white/10 font-black text-primary text-5xl text-center outline-none focus:border-primary transition-all shadow-4xl italic"
                                                value={form.priority} 
                                                onChange={e => setForm({...form, priority: parseInt(e.target.value)})}
                                            />
                                            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-600 uppercase tracking-widest pointer-events-none">VAL_0-99</span>
                                        </div>
                                    </div>

                                    <div 
                                        className={`h-24 px-10 rounded-[2.5rem] flex items-center justify-between cursor-pointer transition-all duration-700 self-end ${form.is_default ? 'bg-emerald-500 shadow-[0_20px_50px_rgba(16,185,129,0.4)]' : 'bg-slate-50 border-4 border-slate-100 opacity-50'}`}
                                        onClick={() => setForm({...form, is_default: !form.is_default})}
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${form.is_default ? 'bg-white text-emerald-500' : 'bg-slate-200 text-slate-400'}`}>
                                                <Target size={24} />
                                            </div>
                                            <span className={`text-[12px] font-black uppercase tracking-widest ${form.is_default ? 'text-white' : 'text-slate-400'}`}>PREDETERMINADA</span>
                                        </div>
                                        {form.is_default && <CheckCircle2 size={32} className="text-white animate-pulse" />}
                                    </div>
                                </div>

                                <div 
                                    className={`p-10 rounded-[2.5rem] flex items-center gap-8 cursor-pointer transition-all duration-700 border-4 ${form.is_active ? 'bg-slate-950 border-primary shadow-[0_50px_100px_rgba(255,46,91,0.2)]' : 'bg-slate-50 border-slate-100 grayscale opacity-40'}`}
                                    onClick={() => setForm({...form, is_active: !form.is_active})}
                                >
                                    <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all ${form.is_active ? 'bg-primary text-white shadow-[0_0_30px_#FF2E5B]' : 'bg-slate-200 text-slate-400'}`}>
                                        <Power size={40} />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <p className={`text-xl font-black uppercase tracking-[0.2em] italic ${form.is_active ? 'text-white' : 'text-slate-400'}`}>MOTOR_ESTADO: {form.is_active ? 'OPERATIVO' : 'EN_RESERVA'}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">INFLUYE_EN_LAS_ASIGNACIONES_CENTRALES</p>
                                    </div>
                                </div>
                            </form>
                        </CardContent>

                        <div className="p-16 md:p-24 pt-0 flex gap-8">
                            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 h-24 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[12px] border-4 border-slate-100 text-slate-400 hover:bg-slate-50">ABORTAR</Button>
                            <Button 
                                form="rule-form"
                                type="submit"
                                className="flex-[2] h-24 rounded-[2.5rem] bg-primary text-white font-black italic text-xl tracking-tighter hover:bg-slate-950 transition-all border-none shadow-[0_30px_60px_rgba(255,46,91,0.3)] active:scale-95 flex items-center justify-center gap-6 group"
                            >
                                {editingRule ? 'REFRACTORIZAR_ENRUTADOR' : 'ACTIVAR_MAREO_LÓGICO'}
                                <ChevronRight size={32} className="group-hover:translate-x-3 transition-transform duration-700" />
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
