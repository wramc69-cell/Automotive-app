import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import { 
    Plus, Edit, Trash2, GitBranch, 
    AlertCircle, CheckCircle2, LayoutGrid, ArrowRight, Settings
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';

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
    
    // Auth check
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
            toast({ title: 'Error', description: error.message, type: 'error' });
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
        
        // Basic Validation: 1 default per service
        if (form.is_default) {
            const hasExistingDefault = rules.some(r => r.service_catalog_id === form.service_catalog_id && r.is_default && r.id !== editingRule?.id);
            if (hasExistingDefault) {
                toast({ title: 'Conflicto', description: 'Ya existe una plantilla predeterminada para este servicio.', type: 'error' });
                return;
            }
        }

        try {
            if (editingRule) {
                const { error } = await supabase.from('service_template_rules').update(form).eq('id', editingRule.id);
                if (error) throw error;
                toast({ title: 'Actualizado', description: 'Regla actualizada correctamente.', type: 'success' });
            } else {
                const { error } = await supabase.from('service_template_rules').insert([form]);
                if (error) throw error;
                toast({ title: 'Creado', description: 'Regla creada correctamente.', type: 'success' });
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, type: 'error' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta regla de asignación?')) return;
        const { error } = await supabase.from('service_template_rules').delete().eq('id', id);
        if (error) toast({ title: 'Error', description: error.message, type: 'error' });
        else {
            toast({ title: 'Eliminado', description: 'Regla eliminada.', type: 'success' });
            fetchData();
        }
    };

    return (
        <div className="space-y-8 animate-in">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic flex items-center gap-4 group">
                        <div className="bg-indigo-600 p-2 rounded-2xl text-white shadow-xl shadow-indigo-200 group-hover:rotate-12 transition-transform duration-500">
                            <GitBranch size={32} />
                        </div>
                        REGLAS DE ASIGNACIÓN
                    </h1>
                    <p className="text-slate-500 font-medium">Asocia automáticamente el catálogo de servicios con el checklist técnico correcto.</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="shadow-2xl shadow-indigo-100 h-14 px-8 rounded-2xl bg-slate-900 text-white hover:bg-indigo-600 transition-all active:scale-95">
                    <Plus size={20} className="mr-3" /> AGREGAR MAPEO
                </Button>
            </div>

            {/* Main Content */}
            {loading ? (
                <div className="flex items-center justify-center p-20 text-slate-300 gap-3">
                    <LayoutGrid className="animate-spin" /> Cargando lógica de negocio...
                </div>
            ) : rules.length === 0 ? (
                <Card className="p-20 text-center border-dashed border-2 bg-slate-50/20">
                    <div className="max-w-md mx-auto space-y-6">
                        <div className="w-20 h-20 bg-white shadow-inner rounded-3xl flex items-center justify-center mx-auto text-slate-200">
                            <AlertCircle size={40} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">No hay reglas definidas</h2>
                        <p className="text-slate-500 text-sm">Sin reglas, el sistema usará la plantilla estándar (DIAG_STD_V1) por defecto para todas las solicitudes.</p>
                        <Button onClick={() => handleOpenModal()}>Crear primera regla</Button>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {rules.map(rule => (
                        <div key={rule.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-50 transition-all duration-500 group relative overflow-hidden">
                            {rule.is_default && <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600 shadow-lg" />}
                            
                            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                                <div className="flex-1 flex items-center gap-8">
                                    <div className="space-y-1 min-w-[200px]">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Servicio Catálogo</p>
                                        <h3 className="text-xl font-black text-slate-900 leading-tight underline decoration-slate-100 decoration-4">
                                            {rule.service?.name}
                                        </h3>
                                        <code className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{rule.service?.code}</code>
                                    </div>

                                    <div className="hidden md:flex items-center justify-center px-4">
                                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shadow-inner">
                                            <ArrowRight size={24} />
                                        </div>
                                    </div>

                                    <div className="space-y-1 min-w-[200px]">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Plantilla Checklist</p>
                                        <h3 className="text-xl font-black text-slate-900 leading-tight flex items-center gap-3">
                                            {rule.template?.name}
                                            {rule.is_default && <Badge variant="default" className="text-[9px] shadow-sm">DEFAULT</Badge>}
                                        </h3>
                                        <code className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded italic">@{rule.template?.code}</code>
                                    </div>
                                </div>

                                <div className="flex items-center gap-12">
                                    <div className="text-right space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prioridad</p>
                                        <div className="text-3xl font-black font-mono text-slate-300 drop-shadow-sm group-hover:text-indigo-600 transition-colors">
                                            {rule.priority.toString().padStart(2, '0')}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            {rule.is_active ? 
                                                <Badge variant="success" className="px-4 py-1.5 rounded-xl border-none shadow-sm"><CheckCircle2 size={12} className="mr-2" /> Activa</Badge> : 
                                                <Badge variant="outline" className="px-4 py-1.5 rounded-xl border-slate-200">Inactiva</Badge>
                                            }
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-indigo-600" onClick={() => handleOpenModal(rule)}>
                                                <Edit size={18} />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-rose-500" onClick={() => handleDelete(rule.id)}>
                                                <Trash2 size={18} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRule ? "Editar Regla de Asignación" : "Nuevo Mapeo de Plantilla"}>
                <form onSubmit={handleSubmit} className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 uppercase tracking-tighter">Servicio en Catálogo</label>
                            <Select 
                                value={form.service_catalog_id} 
                                onChange={e => setForm({...form, service_catalog_id: e.target.value})}
                                options={services.map(s => ({ value: s.id, label: s.name }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 uppercase tracking-tighter">Plantilla de Inspección</label>
                            <Select 
                                value={form.template_id} 
                                onChange={e => setForm({...form, template_id: e.target.value})}
                                options={templates.map(t => ({ value: t.id, label: t.name }))}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <Input 
                                label="Prioridad (Ranking)" 
                                type="number" 
                                value={form.priority} 
                                onChange={e => setForm({...form, priority: parseInt(e.target.value)})}
                                hint="Mayor número = Mayor peso"
                            />
                            <div className="flex items-center gap-4 bg-slate-50 rounded-2xl p-4 border border-slate-100 h-14 mt-6">
                                <input 
                                    type="checkbox" 
                                    id="is_default" 
                                    checked={form.is_default} 
                                    onChange={e => setForm({...form, is_default: e.target.checked})}
                                    className="w-6 h-6 rounded-lg text-indigo-600 border-slate-300 focus:ring-indigo-600"
                                />
                                <label htmlFor="is_default" className="text-sm font-black text-slate-800 cursor-pointer">Predeterminada</label>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
                            <input 
                                type="checkbox" 
                                id="is_active" 
                                checked={form.is_active} 
                                onChange={e => setForm({...form, is_active: e.target.checked})}
                                className="w-6 h-6 rounded-lg bg-slate-800 text-indigo-400 border-slate-700 focus:ring-indigo-400"
                            />
                            <div className="flex-1">
                                <label htmlFor="is_active" className="text-sm font-black uppercase tracking-widest cursor-pointer">Regla Activa</label>
                                <p className="text-[10px] text-slate-400 font-medium">Si se desactiva, el sistema ignorará este mapeo por completo.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" variant="primary" className="px-10 h-12 rounded-xl shadow-lg shadow-indigo-100">
                            {editingRule ? 'Actualizar Regla' : 'Guardar Mapeo'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
