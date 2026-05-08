import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
    Settings, MapPin, DollarSign,
    Save, Plus, Trash2, Truck,
    Navigation, Activity, Database,
    Zap, Globe, Cpu,
    Info, AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';

export function AdminConfigPage() {
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        loadConfig();
    }, []);

    async function loadConfig() {
        try {
            const { data, error } = await supabase.from('app_config').select('*').single();
            if (error) throw error;
            if (data) setConfig(data);
        } catch (err: any) {
            toast({ title: 'Error de Sincronización', description: err.message, type: 'error' });
        } finally {
            setLoading(false);
        }
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

            if (error) throw error;
            toast({ title: 'Configuración Blindada', description: 'Los parámetros operativos han sido actualizados con éxito.', type: 'success' });
        } catch (err: any) {
            toast({ title: 'Falla en el Sistema', description: err.message, type: 'error' });
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

    if (loading || !config) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 px-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-100 rounded-3xl animate-pulse"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Cpu className="w-6 h-6 text-primary animate-bounce" />
                    </div>
                </div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Cargando Núcleo del Sistema...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1700px] mx-auto space-y-12 pb-24 animate-in fade-in duration-700 px-4 mt-8">
            {/* Header: Core Configuration Terminal */}
            <header className="relative p-12 md:p-20 bg-slate-950 rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-b-8 border-primary/20">
                <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-primary/10 via-primary/5 to-transparent"></div>
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/10 blur-[150px] rounded-full"></div>
                
                <div className="relative z-10 flex flex-col xl:flex-row justify-between items-end gap-12">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-12 w-full xl:w-auto">
                        <div className="w-32 h-32 bg-white/5 rounded-[2.5rem] flex items-center justify-center border-4 border-white/10 shadow-3xl backdrop-blur-2xl group shrink-0">
                            <Settings className="w-16 h-16 text-primary group-hover:rotate-180 transition-transform duration-1000 ease-in-out" />
                        </div>
                        <div className="text-center md:text-left space-y-6">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
                                <h1 className="text-6xl md:text-9xl font-black italic tracking-[-0.05em] text-white uppercase leading-[0.8] drop-shadow-2xl pt-2">Maestro Central</h1>
                                <Badge className="bg-primary text-white text-[12px] font-black border-none px-8 py-3 rounded-xl shadow-[0_20px_50px_rgba(255,46,91,0.4)] tracking-[0.4em]">SYSTEM CORE UNIT_v2.5</Badge>
                            </div>
                            <div className="flex items-center justify-center md:justify-start gap-8 bg-white/5 backdrop-blur-md px-8 py-4 rounded-3xl border border-white/10 w-fit">
                                <p className="text-slate-400 font-bold uppercase tracking-[0.6em] text-[12px] flex items-center gap-4">
                                    <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                                    ALGORITMOS DE NEGOCIO_EN_LINEA
                                </p>
                            </div>
                        </div>
                    </div>

                    <Button 
                        onClick={handleSave} 
                        disabled={saving} 
                        className="h-24 px-16 rounded-[2.5rem] bg-primary text-white font-black italic text-xl tracking-tighter hover:bg-white hover:text-slate-950 transition-all shadow-[0_30px_60px_-15px_rgba(255,46,91,0.5)] group relative overflow-hidden active:scale-95"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                        {saving ? (
                            <><Zap size={28} className="mr-6 animate-spin text-white" /> SYNCING_CORE...</>
                        ) : (
                            <><Save size={28} className="mr-6 group-hover:scale-125 transition-transform" /> PROTECT_PARAMS</>
                        )}
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-4 space-y-12">
                    {/* Geolocation Hub Terminal */}
                    <Card className="bg-white border-none rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] overflow-hidden group border-t-8 border-rose-500 hover:shadow-2xl transition-all duration-700">
                        <CardContent className="p-12 space-y-10">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-500 border-4 border-rose-100 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                                    <MapPin size={32} strokeWidth={2.5} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-black text-slate-950 text-2xl uppercase italic leading-none tracking-tighter">Geo Hub</h3>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg">PUNTO_CERO_GPS</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1 flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-rose-500"></div> LATITUDE_N_S
                                    </label>
                                    <input
                                        type="number"
                                        value={config.service_hub_lat}
                                        onChange={(e) => setConfig({ ...config, service_hub_lat: e.target.value })}
                                        className="w-full h-20 px-10 rounded-3xl bg-slate-50 border-4 border-transparent font-black text-slate-950 text-xl focus:border-rose-500 focus:bg-white transition-all outline-none shadow-inner"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1 flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-rose-500"></div> LONGITUDE_E_W
                                    </label>
                                    <input
                                        type="number"
                                        value={config.service_hub_lng}
                                        onChange={(e) => setConfig({ ...config, service_hub_lng: e.target.value })}
                                        className="w-full h-20 px-10 rounded-3xl bg-slate-50 border-4 border-transparent font-black text-slate-950 text-xl focus:border-rose-500 focus:bg-white transition-all outline-none shadow-inner"
                                    />
                                </div>
                            </div>
                            <div className="p-8 bg-slate-950 rounded-[2.5rem] flex items-start gap-6 border-b-4 border-rose-500 shadow-3xl">
                                <Info size={28} className="text-rose-500 shrink-0" />
                                <p className="text-[11px] text-slate-400 font-bold uppercase leading-relaxed tracking-wider">
                                    Referencia maestra para el motor de cálculo de distancias y dispatch.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Financial Engine Console */}
                    <Card className="bg-white border-none rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] overflow-hidden group border-t-8 border-emerald-500 hover:shadow-2xl transition-all duration-700">
                        <CardContent className="p-12 space-y-12">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-500 border-4 border-emerald-100 shadow-2xl group-hover:scale-110 group-hover:-rotate-6 transition-all duration-700">
                                    <DollarSign size={32} strokeWidth={2.5} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-black text-slate-950 text-2xl uppercase italic leading-none tracking-tighter">Motor Fiscal</h3>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg">BASE_FEE_OPERATIONAL</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">FEE_DESPLAZAMIENTO (USD)</label>
                                <div className="relative group/input">
                                    <div className="absolute left-8 top-1/2 -translate-y-1/2 text-emerald-500 font-black italic text-4xl group-focus-within/input:scale-125 transition-transform">$</div>
                                    <input
                                        type="number"
                                        value={config.visit_fee}
                                        onChange={(e) => setConfig({ ...config, visit_fee: e.target.value })}
                                        className="w-full h-28 pl-18 pr-10 rounded-[2.5rem] bg-slate-50 border-4 border-transparent font-black text-slate-950 text-5xl focus:border-emerald-500 focus:bg-white transition-all outline-none shadow-2xl"
                                    />
                                </div>
                            </div>

                            <div className="p-10 bg-emerald-50 border-4 border-emerald-100 rounded-[2.5rem] flex flex-col items-center gap-6 text-center shadow-inner">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-emerald-100 animate-bounce">
                                    <Zap className="text-emerald-500" size={32} />
                                </div>
                                <p className="text-[12px] text-emerald-950 font-black leading-relaxed uppercase tracking-tighter">
                                    Inyección automática de costo base en cada ticket generado.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-8">
                    <Card className="bg-white border-none rounded-[2.5rem] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.1)] overflow-hidden border-t-8 border-primary/50">
                        <header className="p-16 border-b-4 border-slate-50 flex flex-col xl:flex-row justify-between items-center gap-12 bg-slate-50/50 backdrop-blur-3xl">
                            <div className="flex items-center gap-10 text-center md:text-left">
                                <div className="w-24 h-24 bg-slate-950 rounded-[2.5rem] flex items-center justify-center text-primary shadow-3xl transform -rotate-12 hover:rotate-0 transition-transform duration-700">
                                    <Truck size={48} strokeWidth={1.5} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-4xl font-black italic text-slate-950 uppercase tracking-tighter leading-none">Matriz de Despliegue</h3>
                                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1.5 flex items-center justify-center md:justify-start gap-4">
                                        <Database size={16} className="text-primary" /> LOGISTICS_OVERCHARGES_GEO_FENCING
                                    </p>
                                </div>
                            </div>
                            <Button 
                                onClick={addRange} 
                                className="h-20 px-12 rounded-[2rem] bg-slate-950 text-white font-black text-xs uppercase tracking-widest hover:bg-primary transition-all shadow-2xl flex items-center gap-6 group/add"
                            >
                                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover/add:scale-125 transition-transform">
                                    <Plus size={24} />
                                </div>
                                NEW_LOGISTICS_SEGMENT
                            </Button>
                        </header>

                        <CardContent className="p-8 md:p-16">
                            <div className="space-y-8">
                                <div className="grid grid-cols-12 gap-8 px-12 pb-6 border-b-2 border-slate-100 hidden md:grid">
                                    <span className="col-span-4 text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] text-center italic">MILES_RANGE_START</span>
                                    <span className="col-span-4 text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] text-center italic">MILES_RANGE_END</span>
                                    <span className="col-span-3 text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] text-center italic text-primary">SURCHARGE_VALUE</span>
                                    <span className="col-span-1"></span>
                                </div>

                                <div className="space-y-6">
                                    {config.distance_ranges?.map((range: any, idx: number) => (
                                        <div key={idx} className="group grid grid-cols-1 md:grid-cols-12 gap-8 bg-slate-50/50 hover:bg-white p-8 rounded-[2.5rem] transition-all duration-500 items-center border-[6px] border-transparent hover:border-slate-100 hover:shadow-3xl relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-2 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <div className="col-span-4">
                                                <div className="relative">
                                                     <input
                                                        type="number"
                                                        value={range.min}
                                                        onChange={(e) => updateRange(idx, 'min', e.target.value)}
                                                        className="w-full h-20 rounded-[2rem] bg-white border-4 border-slate-100 text-center font-black text-slate-950 text-2xl focus:border-primary outline-none transition-all shadow-inner group-hover:shadow-2xl"
                                                    />
                                                    <div className="absolute top-3 left-6 text-[9px] font-black text-slate-300 tracking-widest uppercase">MIN</div>
                                                </div>
                                            </div>
                                            <div className="col-span-4">
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={range.max}
                                                        onChange={(e) => updateRange(idx, 'max', e.target.value)}
                                                        className="w-full h-20 rounded-[2rem] bg-white border-4 border-slate-100 text-center font-black text-slate-950 text-2xl focus:border-primary outline-none transition-all shadow-inner group-hover:shadow-2xl"
                                                    />
                                                    <div className="absolute top-3 left-6 text-[9px] font-black text-slate-300 tracking-widest uppercase">MAX</div>
                                                </div>
                                            </div>
                                            <div className="col-span-3">
                                                <div className="relative">
                                                    <span className="absolute left-8 top-1/2 -translate-y-1/2 text-primary font-black italic text-2xl group-hover:scale-125 transition-transform">$</span>
                                                    <input
                                                        type="number"
                                                        value={range.surcharge}
                                                        onChange={(e) => updateRange(idx, 'surcharge', e.target.value)}
                                                        className="w-full h-24 pl-14 rounded-[2.5rem] bg-slate-950 text-center font-black text-white text-3xl focus:border-primary outline-none transition-all shadow-2xl"
                                                    />
                                                    <div className="absolute top-3 right-8 text-[9px] font-black text-primary tracking-widest uppercase italic">VALUE</div>
                                                </div>
                                            </div>
                                            <div className="col-span-1 flex justify-center">
                                                <button
                                                    onClick={() => removeRange(idx)}
                                                    className="w-20 h-20 rounded-[1.8rem] bg-rose-50 text-rose-300 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center hover:rotate-90 shadow-xl group-hover:scale-110 active:scale-90"
                                                >
                                                    <Trash2 size={32} strokeWidth={2} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {(!config.distance_ranges || config.distance_ranges.length === 0) && (
                                        <div className="py-40 text-center bg-slate-50/50 rounded-[2.5rem] border-8 border-dashed border-slate-100 flex flex-col items-center gap-10">
                                            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-slate-100 shadow-2xl animate-spin-slow">
                                                <Globe size={64} />
                                            </div>
                                            <div className="space-y-4">
                                                <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-300 leading-none">Global Reach Restricted</h3>
                                                <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] italic">NO_LOGISTICS_PROTOCOLS_LOADED</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                        
                        <footer className="p-16 bg-slate-950 flex flex-col md:flex-row items-center gap-12 border-t-8 border-primary/20">
                             <div className="w-24 h-24 bg-white/5 rounded-3xl backdrop-blur-xl border border-white/10 flex items-center justify-center text-primary shadow-3xl shrink-0">
                                <AlertCircle size={48} className="animate-pulse" />
                             </div>
                             <div className="text-center md:text-left space-y-4">
                                <p className="text-[18px] text-white font-black italic uppercase tracking-tight underline decoration-primary decoration-4 underline-offset-8">Critical Deployment Warning</p>
                                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.3em] leading-relaxed max-w-2xl">
                                    Cualquier modificación en los rangos de logística será inyectada en caliente al motor de checkout. Verifique los parámetros antes de sincronizar con el núcleo.
                                </p>
                             </div>
                        </footer>
                    </Card>
                </div>
            </div>
        </div>
    );
}
