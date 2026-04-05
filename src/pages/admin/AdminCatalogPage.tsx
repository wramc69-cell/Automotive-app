import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import {
    Plus, Trash2, Power, PowerOff,
    Settings2, Tags, Search
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function AdminCatalogPage() {
    const [services, setServices] = useState<any[]>([]);
    const [tags, setTags] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

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
        await supabase.from('service_catalog').update({ active: !current }).eq('id', id);
        loadData();
    }

    async function deleteTag(id: string) {
        if (!confirm('¿Eliminar esta etiqueta?')) return;
        await supabase.from('symptom_tags').delete().eq('id', id);
        loadData();
    }

    async function addService() {
        const name = prompt('Nombre del servicio:');
        if (!name) return;
        const category = prompt('Categoría (MECHANICAL, ELECTRICAL, etc):', 'MECHANICAL');
        const price = prompt('Precio base:', '100');

        await supabase.from('service_catalog').insert({
            name,
            category,
            base_price: parseFloat(price || '0'),
            active: true
        });
        loadData();
    }

    async function addTag() {
        const label = prompt('Nombre del síntoma:');
        if (!label) return;
        const code = label.toUpperCase().replace(/\s+/g, '_');
        const severity = prompt('Severidad (LOW/MED/HIGH/CRITICAL):', 'LOW');

        await supabase.from('symptom_tags').insert({
            label,
            code,
            severity,
            active: true
        });
        loadData();
    }

    const filteredServices = services.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="p-10 text-center animate-pulse text-indigo-600 font-bold">Cargando Catálogo...</div>;

    return (
        <div className="space-y-8 pb-20 animate-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                        <Settings2 className="text-indigo-600" /> Catálogo de Servicios
                    </h1>
                    <p className="text-slate-500 font-medium">Gestiona la oferta de servicios y etiquetas de síntomas.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={addService} className="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 shadow-lg">
                        <Plus size={18} className="mr-2" /> Nuevo Servicio
                    </Button>
                    <Button onClick={addTag} variant="outline" className="border-indigo-200 text-indigo-600">
                        <Plus size={18} className="mr-2" /> Nueva Etiqueta
                    </Button>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input
                    placeholder="Buscar servicios por nombre o categoría..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-12 bg-white border-slate-200 shadow-sm focus:ring-indigo-500 rounded-xl"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Services Section */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 px-1">
                        Servicios Activos ({filteredServices.length})
                    </h2>
                    <div className="grid gap-3">
                        {filteredServices.map(service => (
                            <Card key={service.id} className={`overflow-hidden transition-all hover:translate-x-1 ${!service.active ? 'opacity-60 grayscale bg-slate-50 border-dashed' : 'bg-white shadow-sm border-indigo-100'}`}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex gap-4 items-center">
                                        <div className={`p-3 rounded-xl ${service.active ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                                            <Settings2 size={20} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-slate-900">{service.name}</h3>
                                                <Badge variant="outline" className="text-[10px] py-0">{service.category}</Badge>
                                            </div>
                                            <p className="text-sm font-bold text-indigo-600 mt-0.5">${service.base_price}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => toggleService(service.id, service.active)}
                                            className={service.active ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}
                                            title={service.active ? 'Desactivar' : 'Activar'}
                                        >
                                            {service.active ? <Power size={18} /> : <PowerOff size={18} />}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Tags Section */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 px-1">
                        Etiquetas de Síntomas <Tags size={18} className="text-amber-500" />
                    </h2>
                    <Card className="bg-white shadow-lg border-amber-100 rounded-2xl">
                        <CardContent className="p-6">
                            <div className="flex flex-wrap gap-2">
                                {tags.map(tag => (
                                    <div
                                        key={tag.id}
                                        className="group relative flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full hover:border-amber-300 hover:bg-amber-50 transition-all"
                                    >
                                        <span className={`w-2 h-2 rounded-full ${tag.severity === 'CRITICAL' ? 'bg-red-500' :
                                                tag.severity === 'HIGH' ? 'bg-orange-500' :
                                                    tag.severity === 'MED' ? 'bg-amber-500' : 'bg-green-500'
                                            }`} />
                                        <span className="text-sm font-bold text-slate-700">{tag.label}</span>
                                        <button
                                            onClick={() => deleteTag(tag.id)}
                                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity ml-1"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            {tags.length === 0 && (
                                <div className="text-center py-6 text-slate-400 italic text-sm">
                                    No hay etiquetas configuradas.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
