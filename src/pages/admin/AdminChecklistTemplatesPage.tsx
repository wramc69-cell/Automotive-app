import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import { 
    Plus, Edit, Trash2, CheckCircle, XCircle, 
    ArrowUp, ArrowDown, History, Send, ChevronRight, Settings2, FileText, CheckSquare,
    Zap, ShieldCheck, Activity, Terminal, Layers, Info, Trash, AlertTriangle, Cpu,
    Camera, Wrench, Layout, Clock, Eye, Power
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

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
            toast({ title: 'Protocolo Publicado', description: `Nueva versión generada con ID ${data}`, type: 'success' });
            fetchTemplateDetails(selectedTemplate.id);
        } catch (error: any) {
            toast({ title: 'Falla en Publicación', description: error.message, type: 'error' });
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

    const moveItem = async (item: any, direction: 'up' | 'down') => {
        const siblingItems = items.filter(i => i.section_id === item.section_id);
        const idx = siblingItems.findIndex(i => i.id === item.id);
        if (direction === 'up' && idx === 0) return;
        if (direction === 'down' && idx === siblingItems.length - 1) return;

        const neighbor = direction === 'up' ? siblingItems[idx - 1] : siblingItems[idx + 1];
        
        await Promise.all([
            supabase.from('checklist_template_items').update({ sort_order: neighbor.sort_order }).eq('id', item.id),
            supabase.from('checklist_template_items').update({ sort_order: item.sort_order }).eq('id', neighbor.id)
        ]);
        fetchTemplateDetails(selectedTemplate.id);
    };

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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 px-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-100 rounded-3xl animate-pulse"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Layout className="w-6 h-6 text-primary animate-bounce" />
                    </div>
                </div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Estructurando Protocolos Maestros...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1700px] mx-auto space-y-12 pb-24 animate-in fade-in duration-700 px-4">
            {/* Header: Arquitectura de Ingeniería */}
            <header className="relative p-12 md:p-16 bg-slate-950 rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
                <div className="absolute top-0 right-0 w-[50%] h-full bg-gradient-to-l from-primary/20 to-transparent"></div>
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/10 blur-[120px] rounded-full"></div>
                
                <div className="relative z-10 flex flex-col xl:flex-row justify-between items-end gap-12">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-10 w-full xl:w-auto">
                        <div className="w-28 h-28 bg-white/5 rounded-[2.5rem] flex items-center justify-center border-4 border-white/10 shadow-2xl backdrop-blur-xl group shrink-0">
                            <Layers className="w-14 h-14 text-primary group-hover:scale-110 transition-transform duration-1000" />
                        </div>
                        <div className="text-center md:text-left space-y-4">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.8] pt-2">Protocolos Maestro</h1>
                                <Badge className="bg-primary text-white text-[10px] font-black border-none px-6 py-2 rounded-full shadow-[0_10px_30px_rgba(255,46,91,0.4)] tracking-[0.2em]">ENGINEERING LEVEL</Badge>
                            </div>
                            <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[11px] flex items-center justify-center md:justify-start gap-4">
                                <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                                Estándares de Inspección y Control de Calidad Denver
                            </p>
                        </div>
                    </div>

                    <Button 
                        onClick={() => { setEditingEntity(null); setTemplateForm({ code: '', name: '', description: '' }); setIsTemplateModalOpen(true); }}
                        className="h-20 px-10 rounded-[2rem] bg-white text-slate-900 font-black italic text-sm tracking-tighter hover:bg-primary hover:text-white transition-all shadow-2xl group flex items-center gap-4"
                    >
                        <Plus size={24} className="group-hover:rotate-90 transition-transform duration-500" /> NUEVA PLANTILLA MAESTRA
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start h-auto xl:h-[calc(100vh-350px)]">
                {/* Left Panel: Catalog List */}
                <Card className="lg:col-span-4 h-full bg-slate-50 border-none rounded-[2.5rem] overflow-hidden flex flex-col p-4 shadow-inner">
                    <div className="bg-white rounded-[2.5rem] flex-1 flex flex-col overflow-hidden shadow-2xl relative border-2 border-slate-100">
                        <div className="p-10 border-b-4 border-slate-50 shrink-0">
                            <div className="flex items-center justify-between">
                                <h3 className="font-black text-slate-950 text-2xl uppercase italic tracking-tighter leading-none">Índice Protocolar</h3>
                                <Badge className="bg-slate-950 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest">{templates.length} UNITS</Badge>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <div className="space-y-6">
                                {templates.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setSelectedTemplate(t)}
                                        className={`w-full text-left p-10 rounded-[2.5rem] transition-all duration-700 group relative overflow-hidden ${selectedTemplate?.id === t.id ? 'bg-slate-950 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] scale-[1.02]' : 'hover:bg-slate-50'}`}
                                    >
                                        <div className="relative z-10 flex items-center justify-between">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-4 h-4 rounded-full ${t.is_active ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-slate-200'}`}></div>
                                                    <span className={`font-black uppercase italic tracking-tighter text-2xl leading-none transition-colors ${selectedTemplate?.id === t.id ? 'text-white' : 'text-slate-950'}`}>{t.name}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <code className={`text-[11px] uppercase font-black tracking-[0.2em] px-3 py-1 rounded-xl transition-colors ${selectedTemplate?.id === t.id ? 'bg-white/10 text-primary' : 'bg-slate-100 text-slate-400'}`}>{t.code}</code>
                                                    <Badge className={`text-[9px] font-black border-none px-3 py-1 rounded-full ${t.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 text-slate-300'}`}>{t.is_active ? 'DEPLOYED' : 'IDLE'}</Badge>
                                                </div>
                                            </div>
                                            <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center transition-all duration-700 ${selectedTemplate?.id === t.id ? 'bg-primary text-white rotate-90 scale-110 shadow-2xl' : 'bg-slate-100 text-slate-200 group-hover:bg-slate-950 group-hover:text-primary group-hover:shadow-2xl'}`}>
                                                <ChevronRight size={32} strokeWidth={3} />
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Right Panel: Active Editor */}
                <Card className="lg:col-span-8 h-full bg-slate-950 border-none rounded-[2.5rem] overflow-hidden flex flex-col shadow-[0_60px_120px_-20px_rgba(0,0,0,0.6)] relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none"></div>
                    
                    {!selectedTemplate ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-20 text-center gap-12 relative z-10">
                            <div className="w-48 h-48 bg-white/5 rounded-[2.5rem] flex items-center justify-center border-4 border-dashed border-white/10 relative group-hover:border-primary/30 transition-all duration-700">
                                <div className="absolute inset-0 bg-primary/20 blur-[100px] animate-pulse rounded-full"></div>
                                <Terminal size={80} className="text-white/10 relative z-10 group-hover:text-primary/40 transition-colors" />
                            </div>
                            <div className="space-y-6 max-w-sm">
                                <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter">Mission Control</h3>
                                <p className="text-slate-500 font-bold text-[11px] uppercase tracking-[0.4em] leading-loose italic opacity-60">Sincronice una unidad protocolar para iniciar secuencia de edición técnica.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <CardHeader className="p-12 border-b border-white/5 relative z-10 shrink-0">
                                <div className="flex flex-col xl:flex-row justify-between items-start gap-10">
                                    <div className="flex items-center gap-8">
                                        <div className="w-24 h-24 bg-primary/10 rounded-[2.2rem] flex items-center justify-center text-primary shadow-2xl border-2 border-primary/20 backdrop-blur-xl">
                                            <FileText size={40} strokeWidth={2.5} />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-6">
                                                <h3 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">{selectedTemplate.name}</h3>
                                                <button 
                                                    onClick={() => { setEditingEntity(selectedTemplate); setTemplateForm(selectedTemplate); setIsTemplateModalOpen(true); }}
                                                    className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-2xl border border-white/10"
                                                >
                                                    <Edit size={20} />
                                                </button>
                                            </div>
                                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.3em] max-w-lg line-clamp-1 italic underline decoration-primary/30 decoration-2 underline-offset-8">{selectedTemplate.description || 'TECHNICAL_SPEC_EMPTY'}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 w-full xl:w-auto">
                                        <Button 
                                            onClick={() => toggleActiveTemplate(selectedTemplate)}
                                            className={`h-18 flex-1 xl:flex-none px-10 rounded-[1.8rem] border-4 font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-2xl ${selectedTemplate.is_active ? 'border-rose-500/20 bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white' : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                                        >
                                            {selectedTemplate.is_active ? <XCircle size={20} className="mr-3" /> : <CheckCircle size={20} className="mr-3" />}
                                            {selectedTemplate.is_active ? 'HALT_SYSTEM' : 'INIT_DEPLOY'}
                                        </Button>
                                        <Button 
                                            onClick={handlePublish}
                                            disabled={publishing}
                                            className="h-18 flex-1 xl:flex-none px-10 rounded-[1.8rem] bg-primary text-white font-black italic text-sm tracking-tighter hover:bg-white hover:text-slate-950 shadow-[0_20px_40px_rgba(255,46,91,0.3)] group"
                                        >
                                            <Zap size={22} className={`mr-3 group-hover:scale-125 transition-transform ${publishing ? 'animate-spin' : ''}`} /> COMMIT_VERSION
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex gap-16 mt-12">
                                    <button 
                                        onClick={() => setActiveTab('draft')}
                                        className={`group flex items-center gap-4 pb-6 text-xs font-black uppercase tracking-[0.4em] transition-all relative ${activeTab === 'draft' ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}
                                    >
                                        <Activity size={16} className={activeTab === 'draft' ? 'text-primary' : ''} /> 
                                        LIVE_ARCH_EDITOR
                                        {activeTab === 'draft' && <div className="absolute bottom-0 left-0 w-full h-1.5 bg-primary rounded-full shadow-[0_0_20px_#FF2E5B]"></div>}
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('versions')}
                                        className={`group flex items-center gap-4 pb-6 text-xs font-black uppercase tracking-[0.4em] transition-all relative ${activeTab === 'versions' ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}
                                    >
                                        <History size={16} className={activeTab === 'versions' ? 'text-primary' : ''} /> 
                                        VERSION_DATABASE
                                        {activeTab === 'versions' && <div className="absolute bottom-0 left-0 w-full h-1.5 bg-primary rounded-full shadow-[0_0_20px_#FF2E5B]"></div>}
                                    </button>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1 overflow-y-auto p-12 relative z-10 space-y-16 custom-scrollbar-dark bg-black/40">
                                {activeTab === 'draft' ? (
                                    <div className="space-y-16">
                                        {sections.map((sec, sIdx) => (
                                            <div key={sec.id} className="space-y-8 animate-in slide-in-from-bottom-5 duration-500" style={{ animationDelay: `${sIdx * 100}ms` }}>
                                                <div className="flex items-center justify-between group/sec">
                                                    <div className="flex items-center gap-6">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-all shadow-xl shadow-black/40 border-2 ${sec.is_active ? 'bg-primary text-white border-primary shadow-primary/20' : 'bg-white/5 text-slate-700 border-white/5'}`}>
                                                            {sec.sort_order}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-3">
                                                                <h3 className={`font-black text-2xl uppercase italic tracking-tighter ${sec.is_active ? 'text-white' : 'text-slate-700'}`}>{sec.title}</h3>
                                                                {!sec.is_active && <Badge className="bg-slate-800 text-slate-500 border-none text-[8px] uppercase tracking-widest px-2">INACTIVO</Badge>}
                                                            </div>
                                                            <code className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">{sec.code}</code>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover/sec:opacity-100 transition-all">
                                                        <button 
                                                            onClick={() => { setEditingEntity(sec); setSectionForm(sec); setIsSectionModalOpen(true); }}
                                                            className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-all shadow-xl"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => toggleActiveSection(sec)}
                                                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-xl ${sec.is_active ? 'bg-white/5 text-rose-500 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                                                        >
                                                            <Power size={16} />
                                                        </button>
                                                        <Button 
                                                            variant="primary" 
                                                            size="sm" 
                                                            className="ml-4 h-10 px-6 rounded-xl font-black text-[9px] uppercase tracking-widest" 
                                                            onClick={() => { setEditingEntity(null); setItemForm({ ...itemForm, section_id: sec.id, sort_order: items.filter(i => i.section_id === sec.id).length + 1 }); setIsItemModalOpen(true); }}
                                                        >
                                                            + ADD ITEM
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="ml-6 space-y-4 border-l-2 border-white/5 pl-10">
                                                    {items.filter(i => i.section_id === sec.id).map((item, iIdx) => (
                                                        <div key={item.id} className="group/item relative bg-white/5 p-6 rounded-3xl border border-white/[0.03] flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-white/[0.07] hover:border-primary/20 hover:-translate-x-1 transition-all duration-300">
                                                            <div className="flex items-center gap-6 flex-1 w-full md:w-auto">
                                                                <div className={`w-3 h-12 rounded-full hidden md:block ${item.is_active ? (item.severity_hint === 'CRITICAL' ? 'bg-rose-500 shadow-[0_0_15px_#FF2E5B]' : 'bg-primary') : 'bg-slate-800'}`} />
                                                                <div className="space-y-2 flex-1 pt-1">
                                                                    <div className="flex items-center gap-4">
                                                                        <p className={`font-black uppercase italic tracking-tight text-lg ${item.is_active ? 'text-white' : 'text-slate-600'}`}>{item.item_text}</p>
                                                                        <Badge className={`text-[8px] font-black border-none px-3 py-0.5 rounded-full ${
                                                                            item.severity_hint === 'CRITICAL' ? 'bg-rose-500 text-white' :
                                                                            item.severity_hint === 'HIGH' ? 'bg-orange-500 text-white' :
                                                                            item.severity_hint === 'MEDIUM' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                                                                        }`}>
                                                                            {item.severity_hint}
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="flex flex-wrap items-center gap-6">
                                                                        {item.requires_photo && <span className="text-[9px] text-primary font-black uppercase tracking-[0.2em] flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-lg border border-primary/20"><Camera size={12}/> REQUIRE PHOTO</span>}
                                                                        {item.tool_hint && <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2"><Wrench size={12} className="text-primary"/> {item.tool_hint}</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                                                                <div className="flex flex-col gap-0.5 mr-6 scale-90">
                                                                    <button onClick={() => moveItem(item, 'up')} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 hover:text-primary transition-all"><ArrowUp size={14} /></button>
                                                                    <button onClick={() => moveItem(item, 'down')} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 hover:text-primary transition-all"><ArrowDown size={14} /></button>
                                                                </div>
                                                                <button 
                                                                    onClick={() => { setEditingEntity(item); setItemForm(item); setIsItemModalOpen(true); }}
                                                                    className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all shadow-xl"
                                                                >
                                                                    <Edit size={16} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => toggleActiveItem(item)}
                                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-white/5 ${item.is_active ? 'text-rose-500 hover:bg-rose-500 hover:text-white' : 'text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                                                                >
                                                                    <Power size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {items.filter(i => i.section_id === sec.id).length === 0 && (
                                                        <div className="p-8 border-2 border-dashed border-white/5 rounded-3xl text-center">
                                                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest italic">No se han definido reactivos para esta sección.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        
                                        <div className="pt-20 flex justify-center pb-20">
                                            <button 
                                                onClick={() => { setEditingEntity(null); setSectionForm({ code: '', title: '', sort_order: sections.length + 1 }); setIsSectionModalOpen(true); }}
                                                className="group relative flex flex-col items-center gap-4 focus:outline-none"
                                            >
                                                <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center border-4 border-dashed border-white/10 group-hover:bg-primary group-hover:border-primary transition-all duration-500">
                                                    <Plus size={32} className="text-white/20 group-hover:text-white group-hover:rotate-90 transition-all duration-500" />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] group-hover:text-primary transition-colors">NUEVA SECCIÓN MODULAR</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
                                        {versions.map((v, vIdx) => (
                                            <div key={v.id} className="bg-white/5 rounded-[2.5rem] p-10 border border-white/5 flex flex-col gap-8 hover:bg-white/[0.08] hover:border-primary/20 transition-all duration-300 relative overflow-hidden group">
                                                <div className="absolute top-0 right-10 w-24 h-full bg-gradient-to-b from-primary/5 to-transparent blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                
                                                <div className="flex justify-between items-start relative z-10">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-20 h-20 bg-slate-900 rounded-[1.8rem] flex flex-col items-center justify-center text-white shadow-2xl border border-white/5 ring-4 ring-white/5 ring-offset-4 ring-offset-slate-900 shadow-black">
                                                            <span className="text-[10px] font-black leading-none text-slate-500 mb-1">VER</span>
                                                            <span className="text-3xl font-black leading-none italic tracking-tighter text-primary">{v.version}</span>
                                                        </div>
                                                        <div className="space-y-3 pt-1">
                                                            <div className="flex items-center gap-3">
                                                                <Badge className={`uppercase text-[9px] font-black px-4 py-1 rounded-full border-none shadow-lg ${v.status === 'PUBLISHED' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-slate-800 text-slate-500 shadow-none'}`}>{v.status}</Badge>
                                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{v.status === 'PUBLISHED' ? 'CORE STABLE' : 'SNAPSHOT'}</span>
                                                            </div>
                                                            <p className="text-[9px] font-mono text-slate-600 tracking-tighter">ID: {v.id}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4 bg-black/20 p-6 rounded-3xl relative z-10 border border-white/5">
                                                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                        <span className="flex items-center gap-2"><Clock size={12} className="text-primary"/> PUBLISHED_AT</span>
                                                        <span className="text-white italic">{v.published_at ? new Date(v.published_at).toLocaleString() : '---'}</span>
                                                    </div>
                                                </div>

                                                <Button variant="ghost" className="h-16 w-full rounded-2xl bg-white/5 border border-white/5 text-white font-black text-[10px] uppercase tracking-[0.3em] hover:bg-primary transition-all group/btn">
                                                    INSPECCIONAR SNAPSHOT <Eye size={18} className="ml-4 group-hover/btn:scale-125 transition-transform" />
                                                </Button>
                                            </div>
                                        ))}

                                        {versions.length === 0 && (
                                            <div className="col-span-full py-40 text-center bg-white/5 rounded-[2.5rem] border-4 border-dashed border-white/5 flex flex-col items-center gap-6">
                                                <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-slate-700 shadow-2xl border border-white/5">
                                                    <History size={48} />
                                                </div>
                                                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-600 leading-none">Sin Historial de Registro</h3>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] max-w-sm mx-auto leading-relaxed italic underline decoration-primary decoration-4">Debe publicar la primera versión operativa.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </>
                    )}
                </Card>
            </div>

            {/* Template Modal - Premium Style */}
            <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} title="Parámetros de Protocolo">
                <form onSubmit={saveTemplate} className="space-y-6 pt-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Código de Sistema (Inmutable)</label>
                        <input 
                            placeholder="EJ: DIAG_STD_V1" 
                            required 
                            className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none font-black text-slate-900 focus:ring-4 focus:ring-primary/10 outline-none uppercase tracking-widest"
                            value={templateForm.code} 
                            onChange={e => setTemplateForm({...templateForm, code: e.target.value.toUpperCase()})} 
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Comercial de la Plantilla</label>
                        <input 
                            placeholder="EJ: DIAGNÓSTICO PREVENTIVO MAESTRO" 
                            required 
                            className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-slate-900 focus:ring-4 focus:ring-primary/10 outline-none uppercase tracking-tighter italic"
                            value={templateForm.name} 
                            onChange={e => setTemplateForm({...templateForm, name: e.target.value})} 
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Objetivo del Protocolo</label>
                        <textarea 
                            className="w-full bg-slate-50 border-none rounded-2xl p-6 text-sm font-medium focus:ring-4 focus:ring-primary/10 outline-none min-h-[120px] text-slate-600" 
                            placeholder="Describa el alcance de esta inspección..."
                            value={templateForm.description} 
                            onChange={e => setTemplateForm({...templateForm, description: e.target.value})} 
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
                        <Button variant="ghost" className="font-bold uppercase tracking-widest text-[10px]" onClick={() => setIsTemplateModalOpen(false)}>Abortar</Button>
                        <Button type="submit" className="h-12 px-8 rounded-xl bg-slate-900 text-white font-black italic tracking-tighter uppercase">Comprometer Cambios</Button>
                    </div>
                </form>
            </Modal>

            {/* Section Modal */}
            <Modal isOpen={isSectionModalOpen} onClose={() => setIsSectionModalOpen(false)} title="Módulo Estructural">
                <form onSubmit={saveSection} className="space-y-6 pt-6 text-left">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Código Módulo</label>
                            <input placeholder="EJ: FRENOS" required className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-slate-900 outline-none uppercase" value={sectionForm.code} onChange={e => setSectionForm({...sectionForm, code: e.target.value.toUpperCase()})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jerarquía (Orden)</label>
                            <input type="number" required className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none font-black text-slate-900 outline-none text-center" value={sectionForm.sort_order} onChange={e => setSectionForm({...sectionForm, sort_order: parseInt(e.target.value)})} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título de la Sección</label>
                        <input placeholder="EJ: SISTEMA DE FRENADO Y DISCOS" required className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none font-black text-slate-900 outline-none uppercase italic" value={sectionForm.title} onChange={e => setSectionForm({...sectionForm, title: e.target.value})} />
                    </div>
                    <div className="flex justify-end gap-3 pt-8 border-t border-slate-100">
                        <Button variant="ghost" className="font-bold text-[10px] uppercase tracking-widest" onClick={() => setIsSectionModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" className="h-12 px-8 rounded-xl bg-primary text-white font-black italic tracking-tighter">Guardar Módulo</Button>
                    </div>
                </form>
            </Modal>

            {/* Item Modal */}
            <Modal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} title="Reactivo Técnico">
                <form onSubmit={saveItem} className="space-y-6 pt-6 text-left">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Instrucción del Punto de Control</label>
                        <input placeholder="EJ: VERIFICAR ESPESOR DE BALATAS DELANTERAS" required className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none font-black text-slate-900 outline-none uppercase italic text-sm tracking-tighter" value={itemForm.item_text} onChange={e => setItemForm({...itemForm, item_text: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alerta Predeterminada</label>
                            <select className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest appearance-none outline-none focus:ring-4 focus:ring-primary/10" value={itemForm.severity_hint} onChange={e => setItemForm({...itemForm, severity_hint: e.target.value})}>
                                <option value="LOW">LOW (OBSERVACIÓN)</option>
                                <option value="MEDIUM">MEDIUM (PRECAUCIÓN)</option>
                                <option value="HIGH">HIGH (URGENCIA)</option>
                                <option value="CRITICAL">CRITICAL (PELIGRO)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jerarquía ITEM</label>
                            <input type="number" required className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none font-black text-slate-900 outline-none text-center" value={itemForm.sort_order} onChange={e => setItemForm({...itemForm, sort_order: parseInt(e.target.value)})} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Herramienta de Medición Requerida</label>
                        <input placeholder="EJ: CALIBRADOR DIGITAL, MICRÓMETRO" className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none font-bold text-slate-400 outline-none uppercase text-xs" value={itemForm.tool_hint} onChange={e => setItemForm({...itemForm, tool_hint: e.target.value})} />
                    </div>
                    <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-100 group">
                        <input type="checkbox" id="req_photo_modal" checked={itemForm.requires_photo} onChange={e => setItemForm({...itemForm, requires_photo: e.target.checked})} className="w-6 h-6 rounded-lg text-primary focus:ring-primary border-slate-300" />
                        <label htmlFor="req_photo_modal" className="text-xs font-black text-slate-700 cursor-pointer uppercase tracking-widest group-hover:text-primary transition-colors">COMPROMETER EVIDENCIA FOTOGRÁFICA</label>
                    </div>
                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
                        <Button variant="ghost" onClick={() => setIsItemModalOpen(false)} className="font-bold uppercase text-[10px] tracking-widest">Descartar</Button>
                        <Button type="submit" className="h-12 px-10 rounded-xl bg-slate-900 text-white font-black uppercase italic tracking-tighter">Guardar Reactivo</Button>
                    </div>
                </form>
            </Modal>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
                
                .custom-scrollbar-dark::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar-dark::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar-dark::-webkit-scrollbar-thumb { background: rgba(255,46,91,0.2); border-radius: 10px; }
            `}} />
        </div>
    );
}
