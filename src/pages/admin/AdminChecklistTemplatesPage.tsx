import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import { 
    Plus, Edit, Trash2, CheckCircle, XCircle, 
    ArrowUp, ArrowDown, History, Send, ChevronRight, Settings2, FileText, CheckSquare
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';

type Tab = 'draft' | 'versions';

export function AdminChecklistTemplatesPage() {
    const { toast } = useToast();
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<Tab>('draft');
    const [loading, setLoading] = useState(true);
    
    // Draft Editing State
    const [sections, setSections] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [versions, setVersions] = useState<any[]>([]);
    
    // Modals
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    
    const [editingEntity, setEditingEntity] = useState<any>(null);
    const [templateForm, setTemplateForm] = useState({ code: '', name: '', description: '' });
    const [sectionForm, setSectionForm] = useState({ code: '', title: '', sort_order: 0 });
    const [itemForm, setItemForm] = useState({ 
        item_text: '', 
        sort_order: 0, 
        severity_hint: 'LOW', 
        requires_photo: false, 
        tool_hint: '', 
        section_id: '' 
    });

    const [publishing, setPublishing] = useState(false);

    const fetchTemplates = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('checklist_templates').select('*').order('name');
        if (error) toast({ title: 'Error', description: error.message, type: 'error' });
        else setTemplates(data || []);
        setLoading(false);
    }, [toast]);

    const fetchTemplateDetails = useCallback(async (templateId: string) => {
        const [secRes, itemRes, verRes] = await Promise.all([
            supabase.from('checklist_template_sections').select('*').eq('template_id', templateId).order('sort_order'),
            supabase.from('checklist_template_items').select('*').eq('template_id', templateId).order('sort_order'),
            supabase.from('checklist_template_versions').select('*').eq('template_id', templateId).order('version', { ascending: false })
        ]);

        if (secRes.error) toast({ title: 'Error', description: secRes.error.message, type: 'error' });
        else setSections(secRes.data || []);

        if (itemRes.error) toast({ title: 'Error', description: itemRes.error.message, type: 'error' });
        else setItems(itemRes.data || []);

        if (verRes.error) toast({ title: 'Error', description: verRes.error.message, type: 'error' });
        else setVersions(verRes.data || []);
    }, [toast]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    useEffect(() => {
        if (selectedTemplate) {
            fetchTemplateDetails(selectedTemplate.id);
        }
    }, [selectedTemplate, fetchTemplateDetails]);

    // HANDLERS
    const handlePublish = async () => {
        if (!selectedTemplate) return;
        setPublishing(true);
        try {
            const { data, error } = await supabase.rpc('publish_checklist_template', { 
                p_template_code: selectedTemplate.code 
            });
            if (error) throw error;
            toast({ title: '¡Publicado!', description: `Nueva versión generada con ID ${data}`, type: 'success' });
            fetchTemplateDetails(selectedTemplate.id);
        } catch (error: any) {
            toast({ title: 'Error al publicar', description: error.message, type: 'error' });
        } finally {
            setPublishing(false);
        }
    };

    const toggleActiveTemplate = async (template: any) => {
        const { error } = await supabase.from('checklist_templates').update({ is_active: !template.is_active }).eq('id', template.id);
        if (error) toast({ title: 'Error', description: error.message, type: 'error' });
        else fetchTemplates();
    };

    const toggleActiveSection = async (section: any) => {
        const { error } = await supabase.from('checklist_template_sections').update({ is_active: !section.is_active }).eq('id', section.id);
        if (!error) fetchTemplateDetails(selectedTemplate.id);
    };

    const toggleActiveItem = async (item: any) => {
        const { error } = await supabase.from('checklist_template_items').update({ is_active: !item.is_active }).eq('id', item.id);
        if (!error) fetchTemplateDetails(selectedTemplate.id);
    };

    // MOVE LOGIC (Simulation of Sort Order update)
    const moveItem = async (item: any, direction: 'up' | 'down') => {
        const siblingItems = items.filter(i => i.section_id === item.section_id);
        const idx = siblingItems.findIndex(i => i.id === item.id);
        if (direction === 'up' && idx === 0) return;
        if (direction === 'down' && idx === siblingItems.length - 1) return;

        const neighbor = direction === 'up' ? siblingItems[idx - 1] : siblingItems[idx + 1];
        
        // Swap values
        await Promise.all([
            supabase.from('checklist_template_items').update({ sort_order: neighbor.sort_order }).eq('id', item.id),
            supabase.from('checklist_template_items').update({ sort_order: item.sort_order }).eq('id', neighbor.id)
        ]);
        fetchTemplateDetails(selectedTemplate.id);
    };

    // SAVE FUNCTIONS
    const saveTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        const promise = editingEntity 
            ? supabase.from('checklist_templates').update(templateForm).eq('id', editingEntity.id)
            : supabase.from('checklist_templates').insert([templateForm]);
        
        const { error } = await promise;
        if (error) toast({ title: 'Error', description: error.message, type: 'error' });
        else {
            setIsTemplateModalOpen(false);
            fetchTemplates();
        }
    };

    const saveSection = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...sectionForm, template_id: selectedTemplate.id };
        const promise = editingEntity 
            ? supabase.from('checklist_template_sections').update(payload).eq('id', editingEntity.id)
            : supabase.from('checklist_template_sections').insert([payload]);
        
        const { error } = await promise;
        if (!error) {
            setIsSectionModalOpen(false);
            fetchTemplateDetails(selectedTemplate.id);
        }
    };

    const saveItem = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...itemForm, template_id: selectedTemplate.id };
        const promise = editingEntity 
            ? supabase.from('checklist_template_items').update(payload).eq('id', editingEntity.id)
            : supabase.from('checklist_template_items').insert([payload]);
        
        const { error } = await promise;
        if (!error) {
            setIsItemModalOpen(false);
            fetchTemplateDetails(selectedTemplate.id);
        }
    };

    return (
        <div className="space-y-8 animate-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Plantillas de Checklist</h1>
                    <p className="text-slate-500 font-medium">Gestiona los borradores e historial de inspecciones técnicas.</p>
                </div>
                <Button onClick={() => { setEditingEntity(null); setTemplateForm({ code: '', name: '', description: '' }); setIsTemplateModalOpen(true); }}>
                    <Plus size={18} className="mr-2" /> Nueva Plantilla
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-200px)]">
                {/* Left Panel: Templates List */}
                <Card className="lg:col-span-4 overflow-hidden flex flex-col">
                    <CardHeader className="border-b bg-slate-50/50">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Settings2 size={18} className="text-indigo-600" /> Catalogos Base
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-y-auto">
                        <div className="divide-y divide-slate-100">
                            {templates.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setSelectedTemplate(t)}
                                    className={`w-full text-left p-6 transition-all duration-300 group flex items-start justify-between ${selectedTemplate?.id === t.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900">{t.name}</span>
                                            {t.is_active ? (
                                                <Badge variant="success" className="text-[9px] px-1 py-0 uppercase">Activa</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[9px] px-1 py-0 uppercase">Pausada</Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 font-mono">{t.code}</p>
                                    </div>
                                    <ChevronRight size={16} className={`text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all ${selectedTemplate?.id === t.id ? 'text-indigo-600' : ''}`} />
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Right Panel: Selected Template Editor */}
                <Card className="lg:col-span-8 overflow-hidden flex flex-col relative shadow-2xl">
                    {!selectedTemplate ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12 text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200">
                                <CheckSquare size={32} className="text-slate-200" />
                            </div>
                            <p className="font-medium text-lg">Selecciona una plantilla para comenzar a editar su estructura.</p>
                        </div>
                    ) : (
                        <>
                            <CardHeader className="border-b bg-white z-10">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <CardTitle className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">
                                                {selectedTemplate.name}
                                            </CardTitle>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={() => { setEditingEntity(selectedTemplate); setTemplateForm(selectedTemplate); setIsTemplateModalOpen(true); }}>
                                                <Edit size={14} />
                                            </Button>
                                        </div>
                                        <p className="text-sm text-slate-500">{selectedTemplate.description}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className={selectedTemplate.is_active ? 'text-rose-600' : 'text-emerald-600'}
                                            onClick={() => toggleActiveTemplate(selectedTemplate)}
                                        >
                                            {selectedTemplate.is_active ? <XCircle size={16} className="mr-2" /> : <CheckCircle size={16} className="mr-2" />}
                                            {selectedTemplate.is_active ? 'Desactivar' : 'Activar'}
                                        </Button>
                                        <Button 
                                            variant="primary" 
                                            size="sm" 
                                            onClick={handlePublish}
                                            loading={publishing}
                                            className="shadow-lg shadow-indigo-100"
                                        >
                                            <Send size={16} className="mr-2" /> Publicar Versión
                                        </Button>
                                    </div>
                                </div>

                                {/* Tabs Navigation */}
                                <div className="flex gap-8 mt-6">
                                    <button 
                                        onClick={() => setActiveTab('draft')}
                                        className={`pb-3 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'draft' ? 'text-indigo-600 border-b-2 border-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Borrador Actual
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('versions')}
                                        className={`pb-3 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'versions' ? 'text-indigo-600 border-b-2 border-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Historial de Versiones
                                    </button>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1 overflow-y-auto bg-slate-50/30 p-8">
                                {activeTab === 'draft' ? (
                                    <div className="space-y-12">
                                        {sections.map(sec => (
                                            <div key={sec.id} className="space-y-4">
                                                <div className="flex items-center justify-between group">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition-colors ${sec.is_active ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-200 text-slate-400'}`}>
                                                            {sec.sort_order}
                                                        </div>
                                                        <div>
                                                            <h3 className={`font-black text-lg ${sec.is_active ? 'text-slate-900' : 'text-slate-400 line-through'}`}>{sec.title}</h3>
                                                            <code className="text-[10px] text-slate-400 uppercase tracking-tighter">{sec.code}</code>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600" onClick={() => { setEditingEntity(sec); setSectionForm(sec); setIsSectionModalOpen(true); }}><Edit size={14} /></Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={() => toggleActiveSection(sec)}>{sec.is_active ? <XCircle size={14} /> : <CheckCircle size={14} />}</Button>
                                                        <Button variant="primary" size="sm" className="ml-4 h-8 px-3 rounded-xl text-[10px]" onClick={() => { setEditingEntity(null); setItemForm({ ...itemForm, section_id: sec.id, sort_order: items.filter(i => i.section_id === sec.id).length + 1 }); setIsItemModalOpen(true); }}><Plus size={14} className="mr-1"/> Add Item</Button>
                                                    </div>
                                                </div>

                                                <div className="ml-12 border-l-2 border-slate-100 pl-6 space-y-3">
                                                    {items.filter(i => i.section_id === sec.id).map(item => (
                                                        <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-50 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all hover:translate-x-1">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-2 h-2 rounded-full ${item.is_active ? (item.severity_hint === 'CRITICAL' ? 'bg-rose-500 shadow-md shadow-rose-200' : 'bg-indigo-400') : 'bg-slate-200'}`} />
                                                                <div className="space-y-0.5">
                                                                    <p className={`font-bold text-sm ${item.is_active ? 'text-slate-700' : 'text-slate-400'}`}>{item.item_text}</p>
                                                                    <div className="flex items-center gap-3">
                                                                        <Badge variant="outline" className="text-[9px] scale-90 origin-left border-slate-100 text-slate-400">{item.severity_hint}</Badge>
                                                                        {item.requires_photo && <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-tighter flex items-center gap-1"><History size={10} /> Photo Req</span>}
                                                                        {item.tool_hint && <span className="text-[9px] text-slate-400 font-medium italic block">Tool: {item.tool_hint}</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                                <div className="flex flex-col gap-0.5 mr-3">
                                                                    <button onClick={() => moveItem(item, 'up')} className="text-slate-300 hover:text-indigo-600 transition-colors"><ArrowUp size={12} /></button>
                                                                    <button onClick={() => moveItem(item, 'down')} className="text-slate-300 hover:text-indigo-600 transition-colors"><ArrowDown size={12} /></button>
                                                                </div>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-400" onClick={() => { setEditingEntity(item); setItemForm(item); setIsItemModalOpen(true); }}><Edit size={14} /></Button>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={() => toggleActiveItem(item)}>{item.is_active ? <XCircle size={14} /> : <CheckCircle size={14} />}</Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        
                                        <div className="pt-8 flex justify-center">
                                            <Button variant="outline" onClick={() => { setEditingEntity(null); setSectionForm({ code: '', title: '', sort_order: sections.length + 1 }); setIsSectionModalOpen(true); }}>
                                                <Plus size={18} className="mr-2" /> Nueva Sección
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {versions.map(v => (
                                            <div key={v.id} className="bg-white rounded-3xl p-6 border border-slate-100 flex items-center justify-between hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300 border-l-8 border-l-slate-200">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-slate-900 shadow-inner">
                                                        <span className="text-[10px] font-black leading-none text-slate-400">VER</span>
                                                        <span className="text-xl font-black leading-none">{v.version}</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-3">
                                                            <Badge variant={v.status === 'PUBLISHED' ? 'success' : 'outline'} className="shadow-sm">{v.status}</Badge>
                                                            <span className="text-xs text-slate-500 font-medium">Publicado en: {v.published_at ? new Date(v.published_at).toLocaleString() : '---'}</span>
                                                        </div>
                                                        <p className="text-xs font-mono text-slate-400">ID: {v.id.slice(0, 8)}...</p>
                                                    </div>
                                                </div>
                                                <Button variant="outline" size="sm" className="rounded-xl font-bold h-10 px-5 group">
                                                    Abrir Snapshot <ChevronRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </>
                    )}
                </Card>
            </div>

            {/* Template Modal */}
            <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} title="Datos de la Plantilla">
                <form onSubmit={saveTemplate} className="space-y-4 pt-4">
                    <Input label="Código único" placeholder="Ej: DIAG_STD_V1" required value={templateForm.code} onChange={e => setTemplateForm({...templateForm, code: e.target.value.toUpperCase()})} />
                    <Input label="Nombre de visualización" required value={templateForm.name} onChange={e => setTemplateForm({...templateForm, name: e.target.value})} />
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700">Descripción</label>
                        <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-600 outline-none min-h-[100px]" value={templateForm.description} onChange={e => setTemplateForm({...templateForm, description: e.target.value})} />
                    </div>
                    <div className="flex justify-end gap-2 pt-6">
                        <Button variant="ghost" onClick={() => setIsTemplateModalOpen(false)}>Cancelar</Button>
                        <Button type="submit">Guardar</Button>
                    </div>
                </form>
            </Modal>

            {/* Section Modal */}
            <Modal isOpen={isSectionModalOpen} onClose={() => setIsSectionModalOpen(false)} title="Sección del Checklist">
                <form onSubmit={saveSection} className="space-y-4 pt-4">
                    <Input label="Código" placeholder="Ej: ENGINE" required value={sectionForm.code} onChange={e => setSectionForm({...sectionForm, code: e.target.value.toUpperCase()})} />
                    <Input label="Título" required value={sectionForm.title} onChange={e => setSectionForm({...sectionForm, title: e.target.value})} />
                    <Input label="Orden" type="number" required value={sectionForm.sort_order} onChange={e => setSectionForm({...sectionForm, sort_order: parseInt(e.target.value)})} />
                    <div className="flex justify-end gap-2 pt-6">
                        <Button variant="ghost" onClick={() => setIsSectionModalOpen(false)}>Cancelar</Button>
                        <Button type="submit">Guardar Sección</Button>
                    </div>
                </form>
            </Modal>

            {/* Item Modal */}
            <Modal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} title="Item del Checklist">
                <form onSubmit={saveItem} className="space-y-4 pt-4">
                    <Input label="Texto del Item" required value={itemForm.item_text} onChange={e => setItemForm({...itemForm, item_text: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700">Severidad sugerida</label>
                            <select className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm" value={itemForm.severity_hint} onChange={e => setItemForm({...itemForm, severity_hint: e.target.value})}>
                                <option value="LOW">LOW (Revisión)</option>
                                <option value="MEDIUM">MEDIUM (Sugerencia)</option>
                                <option value="HIGH">HIGH (Urgente)</option>
                                <option value="CRITICAL">CRITICAL (Seguridad)</option>
                            </select>
                        </div>
                        <Input label="Orden" type="number" required value={itemForm.sort_order} onChange={e => setItemForm({...itemForm, sort_order: parseInt(e.target.value)})} />
                    </div>
                    <Input label="Herramienta sugerida" value={itemForm.tool_hint} onChange={e => setItemForm({...itemForm, tool_hint: e.target.value})} />
                    <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl">
                        <input type="checkbox" id="req_photo" checked={itemForm.requires_photo} onChange={e => setItemForm({...itemForm, requires_photo: e.target.checked})} className="w-5 h-5 rounded text-indigo-600" />
                        <label htmlFor="req_photo" className="text-sm font-bold text-slate-700 cursor-pointer">Requiere Foto Evidencia</label>
                    </div>
                    <div className="flex justify-end gap-2 pt-6">
                        <Button variant="ghost" onClick={() => setIsItemModalOpen(false)}>Cancelar</Button>
                        <Button type="submit">Guardar Item</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
