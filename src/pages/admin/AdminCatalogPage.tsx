import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import {
    Plus, Trash2, Power, PowerOff,
    Settings2, Tags, Search, Wrench,
    AlertTriangle, CheckCircle2, ChevronRight, Activity,
    Box, Briefcase, DollarSign
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';

export function AdminCatalogPage() {
    const [services, setServices] = useState<any[]>([]);
    const [tags, setTags] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const { data: srvData } = await supabase.from('service_catalog').select('*').order('name');
            const { data: tagData } = await supabase.from('symptom_tags').select('*').order('label');
            setServices(srvData || []);
            setTags(tagData || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function toggleService(id: string, current: boolean) {
        try {
            const { error } = await supabase.from('service_catalog').update({ active: !current }).eq('id', id);
            if (error) throw error;
            toast({ title: 'Estado Actualizado', type: 'success' });
            loadData();
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, type: 'error' });
        }
    }

    async function deleteTag(id: string) {
        if (!confirm('¿Eliminar esta etiqueta de síntoma?')) return;
        try {
            const { error } = await supabase.from('symptom_tags').delete().eq('id', id);
            if (error) throw error;
            toast({ title: 'Etiqueta Eliminada', type: 'success' });
            loadData();
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, type: 'error' });
        }
    }

    async function addService() {
        const name = prompt('Nombre del servicio técnico:');
        if (!name) return;
        const category = prompt('Categoría (MECHANICAL, TIRES, MAINTENANCE, ELECTRICAL):', 'MECHANICAL');
        const price = prompt('Inversión base (USD):', '100');

        try {
            const { error } = await supabase.from('service_catalog').insert({
                name,
                category: category?.toUpperCase(),
                base_price: parseFloat(price || '0'),
                active: true
            });
            if (error) throw error;
            toast({ title: 'Servicio Creado', type: 'success' });
            loadData();
        } catch (err: any) {
            toast({ title: 'Error al crear', description: err.message, type: 'error' });
        }
    }

    async function addTag() {
        const label = prompt('Nombre del síntoma reportado:');
        if (!label) return;
        const code = label.toUpperCase().replace(/\s+/g, '_');
        const severity = prompt('Nivel de Alerta (LOW, MED, HIGH, CRITICAL):', 'LOW');

        try {
            const { error } = await supabase.from('symptom_tags').insert({
                label,
                code,
                severity: severity?.toUpperCase(),
                active: true
            });
            if (error) throw error;
            toast({ title: 'Etiqueta Registrada', type: 'success' });
            loadData();
        } catch (err: any) {
            toast({ title: 'Error al crear', description: err.message, type: 'error' });
        }
    }

    const filteredServices = services.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 px-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-100 rounded-3xl animate-pulse"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Box className="w-6 h-6 text-primary animate-bounce" />
                    </div>
                </div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Sincronizando Catálogo Maestro...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1700px] mx-auto space-y-12 pb-24 animate-in fade-in duration-700 px-4">
            {/* Header: Arsenal de Soluciones */}
            <header className="relative p-12 md:p-16 bg-slate-950 rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
                <div className="absolute top-0 right-0 w-[50%] h-full bg-gradient-to-l from-primary/20 to-transparent"></div>
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/10 blur-[120px] rounded-full"></div>
                
                <div className="relative z-10 flex flex-col xl:flex-row justify-between items-end gap-12">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-10 w-full xl:w-auto">
                        <div className="w-28 h-28 bg-white/5 rounded-[2.5rem] flex items-center justify-center border-4 border-white/10 shadow-2xl backdrop-blur-xl group shrink-0">
                            <Settings2 className="w-14 h-14 text-primary group-hover:rotate-180 transition-transform duration-1000" />
                        </div>
                        <div className="text-center md:text-left space-y-4">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.8] pt-2">Arsenal Técnico</h1>
                                <Badge className="bg-primary text-white text-[10px] font-black border-none px-6 py-2 rounded-full shadow-[0_10px_30px_rgba(255,46,91,0.4)] tracking-[0.2em]">OPERATIONAL LEVEL</Badge>
                            </div>
                            <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[11px] flex items-center justify-center md:justify-start gap-4">
                                <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                                Centro de Comando de Ingeniería y Servicios Denver
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-6 items-center w-full xl:w-auto">
                        <div className="relative flex-1 xl:w-96 min-w-0">
                            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                placeholder="FILTRAR UNIDADES DE SERVICIO..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-20 pl-18 pr-10 rounded-[2.2rem] bg-white/5 border-2 border-white/10 text-white font-black text-xs uppercase tracking-widest outline-none focus:bg-white/10 focus:border-primary/50 focus:ring-8 focus:ring-primary/10 transition-all placeholder:text-slate-700 shadow-2xl"
                            />
                        </div>
                        <Button 
                            onClick={addService} 
                            className="h-20 px-10 rounded-[2rem] bg-white text-slate-900 font-black italic text-sm tracking-tighter hover:bg-primary hover:text-white transition-all shadow-2xl group flex items-center gap-4"
                        >
                            <Plus size={24} className="group-hover:rotate-90 transition-transform duration-500" /> INTEGRAR SERVICIO
                        </Button>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                {/* --- SERVICES COLUMN --- */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="flex items-center justify-between px-4">
                        <div className="flex items-center gap-4">
                            <div className="w-3 h-12 bg-primary rounded-full shadow-lg"></div>
                            <h2 className="text-2xl font-black italic tracking-tight text-slate-800 uppercase">Oferta de Servicios</h2>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredServices.length} DISPONIBLES</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {filteredServices.map(service => (
                            <Card key={service.id} className={`group relative overflow-hidden rounded-[2.5rem] transition-all duration-700 border-none shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] hover:shadow-2xl hover:-translate-y-2 ${!service.active ? 'opacity-40 grayscale bg-slate-50 border-4 border-dashed border-slate-200' : 'bg-white'}`}>
                                <CardContent className="p-10">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 border-2 ${service.active ? 'bg-slate-50 text-slate-900 border-slate-100' : 'bg-slate-200 text-slate-400 border-slate-300'}`}>
                                            <Briefcase size={32} strokeWidth={2.5} />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-3">REF_UNIT: {service.id?.slice(0, 8)}</p>
                                            <Badge className={`uppercase text-[9px] font-black px-4 py-1 rounded-full border-none shadow-sm tracking-widest ${service.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                {service.active ? 'READY_FOR_DEPLOY' : 'OFFLINE'}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="font-black text-slate-950 text-3xl leading-none uppercase italic tracking-tighter mb-3 group-hover:text-primary transition-colors">{service.name}</h3>
                                            <div className="flex items-center gap-4">
                                                <div className="h-1 w-8 bg-primary rounded-full"></div>
                                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                    {service.category || 'GENERAL_MAINTENANCE'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-10 border-t-4 border-slate-50">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">BASE_INVESTMENT</span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-xl font-black text-primary italic leading-none">$</span>
                                                    <span className="text-5xl font-black text-slate-950 italic tracking-tighter leading-none">{service.base_price}</span>
                                                    <span className="text-xs font-black text-slate-300 uppercase tracking-widest ml-1">USD</span>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                onClick={() => toggleService(service.id, service.active)}
                                                className={`h-16 w-16 rounded-2xl flex items-center justify-center transition-all shadow-xl ${service.active ? 'bg-slate-950 text-primary hover:bg-rose-600 hover:text-white' : 'bg-slate-200 text-slate-400 hover:bg-emerald-500 hover:text-white'}`}
                                            >
                                                {service.active ? <Power size={28} /> : <PowerOff size={28} />}
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] -mr-16 -mt-16 group-hover:bg-primary/10 transition-all rounded-full"></div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* --- SYMPTOMS COLUMN --- */}
                <aside className="lg:col-span-4 space-y-10 lg:sticky lg:top-8">
                    <div className="flex items-center justify-between px-4">
                        <div className="flex items-center gap-4">
                            <div className="w-3 h-12 bg-slate-900 rounded-full"></div>
                            <h2 className="text-2xl font-black italic tracking-tight text-slate-800 uppercase">Diagnóstico</h2>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={addTag}
                            className="text-primary hover:bg-primary/5 font-black text-[10px] uppercase tracking-widest"
                        >
                            + AGREGAR
                        </Button>
                    </div>

                    <Card className="bg-slate-950 border-none rounded-[2.5rem] overflow-hidden p-3 shadow-2xl relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none"></div>
                        <CardContent className="bg-white rounded-[2.5rem] p-12 shadow-2xl space-y-10 relative z-10">
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-16 h-16 bg-slate-950 rounded-[1.8rem] flex items-center justify-center text-primary shadow-2xl border-2 border-white/10 group">
                                    <Tags size={32} className="group-hover:scale-110 transition-transform" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-2xl font-black italic uppercase tracking-tighter text-slate-950 leading-none">Diccionario de Datos</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">IA_FIELD_ENGINEERING_V.03</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4">
                                {tags.map(tag => (
                                    <div
                                        key={tag.id}
                                        className="group relative flex items-center gap-4 pl-6 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.8rem] hover:border-primary hover:bg-white hover:shadow-2xl transition-all duration-500"
                                    >
                                        <div className={`w-3 h-3 rounded-full shadow-lg ${
                                            tag.severity === 'CRITICAL' ? 'bg-rose-500 shadow-rose-500/40 animate-pulse' :
                                            tag.severity === 'HIGH' ? 'bg-orange-500 shadow-orange-500/40' :
                                            tag.severity === 'MED' ? 'bg-amber-500 shadow-amber-500/40' : 'bg-emerald-500 shadow-emerald-500/40'
                                        }`} />
                                        <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest italic">{tag.label}</span>
                                        <button
                                            onClick={() => deleteTag(tag.id)}
                                            className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-all shadow-xl"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {tags.length === 0 && (
                                <div className="text-center py-20 opacity-20 select-none">
                                    <AlertTriangle size={64} strokeWidth={1} className="mx-auto mb-6 text-slate-400" />
                                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">DATA_RECORDS_EMPTY</p>
                                </div>
                            )}

                            <div className="mt-12 p-8 bg-slate-950 rounded-[2.5rem] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full group-hover:bg-primary/40 transition-all"></div>
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-primary border-2 border-white/10 backdrop-blur-3xl">
                                        <Wrench size={32} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-white font-black italic tracking-tighter uppercase italic">Optimización Táctica</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Denver Mobile AI Engine</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </div>
    );
}
