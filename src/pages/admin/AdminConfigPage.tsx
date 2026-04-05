import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
    Settings, MapPin, DollarSign,
    Save, Plus, Trash2, Truck
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function AdminConfigPage() {
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadConfig();
    }, []);

    async function loadConfig() {
        const { data } = await supabase.from('app_config').select('*').single();
        if (data) setConfig(data);
        setLoading(false);
    }

    async function handleSave() {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('app_config')
                .update({
                    service_hub_lat: parseFloat(config.service_hub_lat),
                    service_hub_lng: parseFloat(config.service_hub_lng),
                    visit_fee: parseFloat(config.visit_fee),
                    distance_ranges: config.distance_ranges
                })
                .eq('id', config.id);

            if (error) alert(error.message);
            else alert('Configuración guardada correctamente.');
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    }

    function addRange() {
        const ranges = [...(config.distance_ranges || [])];
        ranges.push({ min: 0, max: 0, surcharge: 0 });
        setConfig({ ...config, distance_ranges: ranges });
    }

    function removeRange(index: number) {
        const ranges = config.distance_ranges.filter((_: any, i: number) => i !== index);
        setConfig({ ...config, distance_ranges: ranges });
    }

    function updateRange(index: number, field: string, value: string) {
        const ranges = [...config.distance_ranges];
        ranges[index] = { ...ranges[index], [field]: parseFloat(value || '0') };
        setConfig({ ...config, distance_ranges: ranges });
    }

    if (loading) return <div className="p-10 text-center animate-pulse text-indigo-600 font-bold italic underline">Cargando Configuración Global...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                        <Settings className="text-indigo-600 animate-spin-slow" /> Configuración Global
                    </h1>
                    <p className="text-slate-500 font-medium">Controla los parámetros operativos y precios del sistema.</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 px-8 py-6 rounded-2xl">
                    <Save size={18} className="mr-2" /> {saving ? 'Guardando...' : 'GUARDAR CAMBIOS'}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Hub Location */}
                <Card className="bg-white border-slate-200 shadow-sm rounded-3xl overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-100">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wide text-slate-500">
                            <MapPin size={16} className="text-red-500" /> Ubicación del Hub Central
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">Latitud</label>
                            <Input
                                type="number"
                                value={config.service_hub_lat}
                                onChange={(e) => setConfig({ ...config, service_hub_lat: e.target.value })}
                                className="h-12 text-sm font-medium border-slate-100 focus:ring-red-500 rounded-xl"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">Longitud</label>
                            <Input
                                type="number"
                                value={config.service_hub_lng}
                                onChange={(e) => setConfig({ ...config, service_hub_lng: e.target.value })}
                                className="h-12 text-sm font-medium border-slate-100 focus:ring-red-500 rounded-xl"
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium italic mt-2 animate-pulse">
                            * Se usa para calcular distancias automáticas en futuros módulos.
                        </p>
                    </CardContent>
                </Card>

                {/* Base Pricing */}
                <Card className="bg-white border-slate-200 shadow-sm rounded-3xl overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-100">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wide text-slate-500">
                            <DollarSign size={16} className="text-green-500" /> Tarifas de Servicio
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter ml-1">Cuota de Visita Base (USD)</label>
                            <Input
                                type="number"
                                value={config.visit_fee}
                                onChange={(e) => setConfig({ ...config, visit_fee: e.target.value })}
                                className="h-12 text-lg font-black text-green-600 border-slate-100 focus:ring-green-500 rounded-xl"
                            />
                        </div>
                        <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3">
                            <Truck className="text-green-600" size={24} />
                            <p className="text-[11px] text-green-700 font-bold leading-tight">
                                Este valor se suma a cada cita y puede descontarse al aprobar cotizaciones.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Distance Pricing Ranges */}
            <Card className="bg-white border-slate-200 shadow-sm rounded-3xl overflow-hidden border-2 border-dashed border-indigo-100">
                <CardHeader className="bg-indigo-50 border-b border-indigo-100 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wide text-indigo-600">
                        <Truck size={16} /> Rangos de Cobro por Distancia
                    </CardTitle>
                    <Button size="sm" onClick={addRange} className="bg-white text-indigo-600 hover:bg-slate-50 border border-indigo-200 h-8 font-black text-[10px]">
                        <Plus size={14} className="mr-1" /> AGREGAR RANGO
                    </Button>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-3">
                        <div className="grid grid-cols-4 gap-4 px-2 mb-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Min Millas</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Max Millas</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Recargo ($)</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Acciones</span>
                        </div>
                        {config.distance_ranges?.map((range: any, idx: number) => (
                            <div key={idx} className="grid grid-cols-4 gap-4 bg-slate-50 p-2 rounded-xl group hover:bg-indigo-50/30 transition-colors">
                                <Input
                                    type="number"
                                    value={range.min}
                                    onChange={(e) => updateRange(idx, 'min', e.target.value)}
                                    className="h-10 text-center font-bold text-xs border-indigo-50 bg-white"
                                />
                                <Input
                                    type="number"
                                    value={range.max}
                                    onChange={(e) => updateRange(idx, 'max', e.target.value)}
                                    className="h-10 text-center font-bold text-xs border-indigo-50 bg-white"
                                />
                                <Input
                                    type="number"
                                    value={range.surcharge}
                                    onChange={(e) => updateRange(idx, 'surcharge', e.target.value)}
                                    className="h-10 text-center font-black text-xs text-indigo-600 border-indigo-50 bg-white"
                                />
                                <div className="flex items-center justify-center">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => removeRange(idx)}
                                        className="h-10 w-10 text-red-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
