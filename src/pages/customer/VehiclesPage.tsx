import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Plus, Trash2, Edit2, History, Car, Info, Droplets, AlertTriangle, CheckCircle2, Zap, Settings, Activity } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { useAuth } from '../../contexts/AuthContext';
import { Timeline, type TimelineItem } from '../../components/ui/Timeline';

interface Vehicle {
    id: string;
    year: number;
    make: string;
    model: string;
    trim: string | null;
    powertrain: 'GAS' | 'HYBRID' | 'EV' | 'DIESEL';
    odometer: number | null;
    notes: string | null;
    created_at: string;
}

export function VehiclesPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);
    const [selectedVehicleHistory, setSelectedVehicleHistory] = useState<TimelineItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const [showInfo, setShowInfo] = useState<string | null>(null);
    const [oilStatus, setOilStatus] = useState<Record<string, { lastOilMiles: number | null; lastServiceDate: string | null }>>({});

    const [form, setForm] = useState({
        year: new Date().getFullYear(),
        make: '',
        model: '',
        trim: '',
        powertrain: 'GAS' as 'GAS' | 'HYBRID' | 'EV' | 'DIESEL',
        odometer: '',
        notes: ''
    });

    const fetchVehicles = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                .eq('owner_user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            const vehicleList = data || [];
            setVehicles(vehicleList);

            const statusMap: Record<string, { lastOilMiles: number | null; lastServiceDate: string | null }> = {};
            await Promise.all(vehicleList.map(async (v: Vehicle) => {
                const { data: cl } = await supabaseAdmin
                    .from('inspection_checklists')
                    .select('findings, updated_at, service_requests!inner(vehicle_id, status, service_catalog:requested_service_id(name))')
                    .eq('status', 'COMPLETED')
                    .eq('service_requests.vehicle_id', v.id)
                    .order('updated_at', { ascending: false })
                    .limit(10);

                const oilChange = (cl || []).find((c: any) =>
                    c.service_requests?.service_catalog?.name?.toLowerCase().includes('aceite') &&
                    c.findings?.oil_specs?.current_odometer
                );

                statusMap[v.id] = {
                    lastOilMiles: oilChange ? parseInt(oilChange.findings.oil_specs.current_odometer) : null,
                    lastServiceDate: oilChange?.updated_at ?? null
                };
            }));
            setOilStatus(statusMap);
        } catch (error: any) {
            toast({ title: 'Error de Red', description: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchVehicles();
    }, [fetchVehicles]);

    const handleOpenModal = (vehicle?: Vehicle) => {
        if (vehicle) {
            setEditingVehicle(vehicle);
            setForm({
                year: vehicle.year,
                make: vehicle.make,
                model: vehicle.model,
                trim: vehicle.trim || '',
                powertrain: vehicle.powertrain,
                odometer: vehicle.odometer?.toString() || '',
                notes: vehicle.notes || ''
            });
        } else {
            setEditingVehicle(null);
            setForm({
                year: new Date().getFullYear(),
                make: '',
                model: '',
                trim: '',
                powertrain: 'GAS',
                odometer: '',
                notes: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            const vehicleData = {
                owner_user_id: user.id,
                year: form.year,
                make: form.make,
                model: form.model,
                trim: form.trim || null,
                powertrain: form.powertrain,
                odometer: form.odometer ? parseInt(form.odometer) : null,
                notes: form.notes || null
            };

            if (editingVehicle) {
                const { error } = await supabase
                    .from('vehicles')
                    .update(vehicleData)
                    .eq('id', editingVehicle.id);
                if (error) throw error;
                toast({ title: 'Misión Actualizada', description: 'Datos técnicos del vehículo guardados.', type: 'success' });
            } else {
                const { error } = await supabase
                    .from('vehicles')
                    .insert(vehicleData);
                if (error) throw error;
                toast({ title: 'Unidad Agregada', description: 'Nuevo vehículo registrado en la flota.', type: 'success' });
            }
            setIsModalOpen(false);
            fetchVehicles();
        } catch (error: any) {
            toast({ title: 'Falla de Sistema', description: error.message, type: 'error' });
        }
    };

    const handleDelete = async () => {
        if (!vehicleToDelete) return;
        try {
            const { error } = await supabase
                .from('vehicles')
                .delete()
                .eq('id', vehicleToDelete);
            if (error) throw error;
            toast({ title: 'Unidad Desvinculada', description: 'Vehículo eliminado de la red Denver.', type: 'success' });
            setIsDeleteModalOpen(false);
            fetchVehicles();
        } catch (error: any) {
            toast({ title: 'Error de Borrado', description: error.message, type: 'error' });
        }
    };

    const fetchHistory = async (vehicle: Vehicle) => {
        setHistoryLoading(true);
        setIsHistoryModalOpen(true);
        try {
            const { data, error } = await supabase
                .from('service_requests')
                .select(`
                    id,
                    status,
                    created_at,
                    service_catalog (name),
                    inspections (findings, risk)
                `)
                .eq('vehicle_id', vehicle.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const timelineItems: TimelineItem[] = (data || []).map((req: any) => ({
                id: req.id,
                title: req.service_catalog?.name || 'Protocolo Denver',
                description: req.inspections?.[0]?.findings || `Estado Operativo: ${req.status}`,
                date: new Date(req.created_at).toLocaleDateString(),
                status: req.status === 'COMPLETED' ? 'success' : 'default'
            }));

            setSelectedVehicleHistory(timelineItems);
        } catch (error: any) {
            toast({ title: 'Error de Lectura', description: 'No se pudo acceder a la bitácora.', type: 'error' });
        } finally {
            setHistoryLoading(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-10 text-center px-4 animate-in fade-in duration-1000">
            <div className="relative">
                <div className="w-24 h-24 border-[10px] border-white/5 border-t-primary rounded-[2rem] animate-spin shadow-3xl shadow-primary/20"></div>
                <Car size={40} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" />
            </div>
            <div className="space-y-4">
                <p className="text-white text-3xl font-black uppercase tracking-[0.4em] italic leading-none">SCANNING_FLOTA</p>
                <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.8em] italic animate-pulse">SYNCHRONIZING_VEHICLE_TELEMETRY...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-16 pb-24 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Header / Stats Section */}
            <header className="relative px-4">
                <div className="flex flex-col md:flex-row justify-between items-end gap-10">
                    <div className="space-y-8">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-[2px] bg-primary rounded-full shadow-lg shadow-primary/40"></div>
                            <span className="text-[11px] font-black text-primary uppercase tracking-[0.6em] italic leading-none">Fleet Commander Terminal</span>
                        </div>
                        <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.8]">MI <br /><span className="text-primary italic">GARAGE</span></h1>
                        <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[11px] max-w-xl italic leading-relaxed opacity-80">
                            GESTIÓN TÉCNICA DE UNIDADES OPERATIVAS Y REGISTROS DE TELEMETRÍA.
                        </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-6 w-full md:w-auto">
                        <div className="bg-white/5 backdrop-blur-3xl px-10 py-5 rounded-[2rem] border border-white/10 flex flex-col items-center justify-center min-w-[160px] shadow-2xl">
                            <span className="text-4xl font-black italic text-white leading-none tracking-tighter">{vehicles.length}</span>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mt-3 italic leading-none">UNIDADES</span>
                        </div>
                        <Button 
                            size="xl"
                            onClick={() => handleOpenModal()}
                            className="h-24 px-12 rounded-[2.5rem] bg-primary hover:bg-white text-slate-950 font-black text-sm tracking-[0.4em] shadow-3xl shadow-primary/20 transition-all group flex items-center gap-5 border-none uppercase italic"
                        >
                            REGISTRAR UNIDAD <Plus size={24} className="group-hover:rotate-90 transition-transform duration-700" />
                        </Button>
                    </div>
                </div>
            </header>

            {vehicles.length === 0 ? (
                <div className="px-4">
                    <Card className="bg-white/5 backdrop-blur-3xl border-2 border-dashed border-white/10 shadow-3xl rounded-[4rem] overflow-hidden group hover:border-primary/40 transition-all duration-1000">
                        <CardContent className="p-20 text-center space-y-10">
                            <div className="relative mx-auto w-32 h-32">
                                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse"></div>
                                <div className="relative w-32 h-32 bg-white/5 rounded-[3rem] border border-white/10 flex items-center justify-center text-slate-700 group-hover:bg-primary group-hover:text-slate-950 transition-all duration-1000">
                                    <Car size={64} />
                                </div>
                            </div>
                            <div className="space-y-4 max-w-xl mx-auto">
                                <h3 className="text-4xl font-black italic uppercase tracking-tighter text-white">Sector de Arribo Vacío</h3>
                                <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[11px] leading-relaxed italic">
                                    NO SE DETECTAN UNIDADES ASIGNADAS A TU FIRMA DIGITAL. COMIENZA EL REGISTRO DE TU FLOTA PARA ACTIVAR LOS PROTOCOLOS DE MANTENIMIENTO PREVENTIVO.
                                </p>
                            </div>
                            <Button 
                                variant="outline" 
                                size="xl"
                                onClick={() => handleOpenModal()}
                                className="h-20 px-12 rounded-[2rem] border border-white/10 text-white font-black text-[12px] tracking-[0.5em] hover:bg-primary hover:text-slate-950 hover:border-primary transition-all uppercase italic"
                            >
                                INICIAR DESPLIEGUE <ArrowRight className="ml-4" size={20} />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-12 px-4 pb-20">
                    {vehicles.map((vehicle) => (
                        <Card key={vehicle.id} className="group bg-white/5 backdrop-blur-3xl border border-white/5 shadow-3xl rounded-[3.5rem] hover:bg-white/10 transition-all duration-1000 overflow-hidden relative flex flex-col">
                            {/* Visual IDs */}
                            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-[3rem] group-hover:bg-primary group-hover:w-20 group-hover:h-20 transition-all duration-700 pointer-events-none flex items-center justify-center">
                                <Zap size={24} className="text-primary group-hover:text-slate-950 transition-colors opacity-40 group-hover:opacity-100" />
                            </div>
                            
                            <CardHeader className="p-10 pb-6 relative z-10">
                                <div className="flex justify-between items-start gap-6">
                                    <div className="space-y-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-950 rounded-2xl flex items-center justify-center text-primary shadow-2xl border border-white/10 group-hover:rotate-12 transition-transform duration-700">
                                                <div className="w-2 h-2 bg-primary animate-ping rounded-full absolute -top-1 -right-1 shadow-primary shadow-lg"></div>
                                                <Car size={20} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-500 italic">Identificador_Alpha</span>
                                        </div>
                                        <CardTitle className="text-4xl font-black italic uppercase tracking-tighter text-white leading-[0.8] transition-all group-hover:translate-x-3 duration-700">
                                            {vehicle.make} <br />
                                            <span className="text-primary italic transition-colors uppercase text-3xl opacity-80 group-hover:opacity-100">{vehicle.model}</span>
                                        </CardTitle>
                                        <div className="flex flex-wrap gap-3">
                                            <Badge className="bg-white/5 hover:bg-white/10 text-white border-white/10 px-6 py-2 rounded-xl text-[10px] font-bold tracking-widest">{vehicle.year}</Badge>
                                            <Badge className="bg-primary/10 text-primary border-primary/20 px-6 py-2 rounded-xl text-[10px] font-black tracking-widest">{vehicle.powertrain}</Badge>
                                            {vehicle.trim && <Badge className="bg-white/5 text-slate-400 border-white/5 px-6 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase italic">{vehicle.trim}</Badge>}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3 relative z-20">
                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-12 w-12 rounded-2xl bg-white/5 text-slate-400 hover:bg-white hover:text-slate-950 transition-all shadow-xl border border-white/5" 
                                            onClick={() => handleOpenModal(vehicle)}
                                        >
                                            <Edit2 size={20} />
                                        </Button>
                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-xl border border-rose-500/20" 
                                            onClick={() => {
                                                setVehicleToDelete(vehicle.id);
                                                setIsDeleteModalOpen(true);
                                            }}
                                        >
                                            <Trash2 size={20} />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            
                            <CardContent className="p-10 pt-2 space-y-8 flex-grow">
                                {/* Telemetry Board */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-6 bg-slate-950/50 rounded-3xl border border-white/5 flex flex-col justify-center gap-2 group/item hover:bg-white/5 transition-all h-28 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover/item:bg-primary transition-all"></div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-500 italic">ODO_TELEMETRÍA</p>
                                        <p className="text-3xl font-black italic text-white tracking-tighter leading-none">
                                            {vehicle.odometer ? vehicle.odometer.toLocaleString() : '---'}
                                        </p>
                                        <p className="text-[10px] font-black text-primary uppercase italic tracking-[0.4em] leading-none">Millas_Totales</p>
                                    </div>
                                    
                                    <div className="p-6 bg-slate-950/50 rounded-3xl border border-white/5 flex flex-col justify-center items-center gap-3 group/item hover:bg-white/5 transition-all h-28">
                                        <Activity size={24} className="text-slate-800 group-hover/item:text-primary transition-all duration-700" />
                                        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-600 text-center italic">ESTADO_SISTEMAS</p>
                                        <span className="text-[8px] font-bold text-slate-800 uppercase tracking-widest">v4.0.2_ACTIVE</span>
                                    </div>
                                </div>

                                {/* Life Support Indicator */}
                                {(() => {
                                    const oil = oilStatus[vehicle.id];
                                    if (!oil || !oil.lastOilMiles) return (
                                        <div className="p-8 rounded-3xl bg-slate-950/30 border-2 border-dashed border-white/5 flex items-center justify-between group/oil transition-all hover:border-white/10">
                                           <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-slate-700 shadow-2xl border border-white/5">
                                                    <Droplets size={28} />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-700 leading-none italic">Health_Protocol_Link</p>
                                                    <p className="text-[12px] font-black text-slate-600 uppercase italic tracking-tighter">Sin registros de auditoría</p>
                                                </div>
                                           </div>
                                            <Settings size={20} className="text-slate-800 animate-spin-slow" />
                                        </div>
                                    );

                                    const currentOdo = vehicle.odometer ?? oil.lastOilMiles;
                                    const milesSinceChange = currentOdo - oil.lastOilMiles;
                                    const nextChangeAt = oil.lastOilMiles + 7500;
                                    const milesRemaining = nextChangeAt - currentOdo;
                                    const percentage = Math.min((milesSinceChange / 7500) * 100, 100);

                                    let levelColor = 'bg-emerald-500 shadow-emerald-500/40';
                                    let textColor = 'text-emerald-400';
                                    let statusLabel = 'ÓPTIMO';
                                    let icon = <CheckCircle2 size={24} className="text-emerald-500" />;

                                    if (milesSinceChange >= 9500) {
                                        levelColor = 'bg-rose-500 shadow-rose-500/40';
                                        textColor = 'text-rose-400';
                                        statusLabel = 'CRÍTICO';
                                        icon = <AlertTriangle size={24} className="text-rose-500 animate-pulse" />;
                                    } else if (milesSinceChange >= 7500) {
                                        levelColor = 'bg-primary shadow-primary/40';
                                        textColor = 'text-primary';
                                        statusLabel = 'PREVENTIVO';
                                        icon = <Zap size={24} className="text-primary animate-pulse" />;
                                    }

                                    return (
                                        <Card className="p-8 bg-slate-950/80 rounded-[2.5rem] border border-white/5 shadow-inner hover:bg-slate-950 transition-all duration-700 space-y-8">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-white/5 rounded-2xl shadow-2xl border border-white/5">{icon}</div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] leading-none mb-2 italic">ACEITE_LIFESPAN</p>
                                                        <h4 className={`text-2xl font-black italic tracking-tighter uppercase ${textColor}`}>{statusLabel}</h4>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black uppercase text-slate-700 tracking-[0.4em] leading-none mb-2 italic">INTEGRIDAD</p>
                                                    <p className="text-3xl font-black italic text-white tracking-tighter leading-none">{100 - Math.round(percentage)}%</p>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                <div className="w-full bg-slate-900 rounded-full h-8 overflow-hidden p-1.5 border border-white/5 shadow-inner flex items-center relative">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-[2500ms] shadow-lg ${levelColor} relative overflow-hidden`}
                                                        style={{ width: `${percentage}%` }}
                                                    >
                                                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[size:15px_15px] animate-[pulse_2s_linear_infinite]"></div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex justify-between items-center px-2">
                                                    <div className="space-y-2">
                                                        <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] italic">REGISTRO_BASE</p>
                                                        <p className="text-[11px] font-black text-white italic tracking-tighter">{oil.lastOilMiles.toLocaleString()} MI</p>
                                                    </div>
                                                    <div className="text-right space-y-2">
                                                        <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] italic">LÍMITE_MISION</p>
                                                        <p className="text-[11px] font-black text-primary italic tracking-tighter">{nextChangeAt.toLocaleString()} MI</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Droplets size={18} className="text-slate-700" />
                                                    <p className="text-[10px] font-black text-slate-500 tracking-[0.4em] uppercase italic leading-none">
                                                        OPERATIVA: <span className="text-white not-italic ml-2">{milesRemaining > 0 ? milesRemaining.toLocaleString() : 0} MI</span>
                                                    </p>
                                                </div>
                                                 {oil.lastServiceDate && (
                                                     <Badge className="bg-white/5 text-slate-500 border-none text-[9px] font-black tracking-[0.5em] italic uppercase px-4 py-2 rounded-lg">
                                                         LOG_{new Date(oil.lastServiceDate).toLocaleDateString().replace(/\//g, '')}
                                                     </Badge>
                                                 )}
                                            </div>
                                        </Card>
                                    );
                                })()}
                                
                                {vehicle.notes && (
                                    <div className="p-8 bg-slate-950/40 rounded-[2.5rem] border border-white/5 border-dashed relative overflow-hidden group/notes">
                                         <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                         <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.6em] mb-4 italic flex items-center gap-3">
                                            <Info size={14} className="text-primary" /> NOTAS_OPERATIVAS
                                         </p>
                                         <p className="text-[13px] font-black text-slate-300 uppercase tracking-tight italic leading-relaxed group-hover:text-white transition-opacity">
                                            "{vehicle.notes}"
                                         </p>
                                    </div>
                                )}
                            </CardContent>
                            
                            <CardFooter className="p-10 pt-0 mt-auto">
                                <Button 
                                    size="xl"
                                    className="h-20 w-full rounded-[2rem] bg-slate-950 group-hover:bg-primary text-white group-hover:text-slate-950 font-black text-[11px] tracking-[0.5em] transition-all duration-700 flex items-center justify-center gap-5 shadow-3xl border border-white/5 group-hover:border-primary italic uppercase group/log" 
                                    onClick={() => fetchHistory(vehicle)}
                                >
                                    <Activity size={20} className="group-hover/log:scale-125 transition-transform" /> CONSULTAR BITÁCORA
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Form Modal (Dark) */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setShowInfo(null);
                }}
                title={editingVehicle ? "CONFIGURACIÓN UNIDAD" : "NUEVO DESPLIEGUE"}
                className="max-w-2xl rounded-[3rem] p-12 overflow-hidden border border-white/5 shadow-3xl bg-slate-950/90 backdrop-blur-3xl text-white"
            >
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 blur-[100px] rounded-full pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
                <form className="space-y-8 relative z-10" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between pr-4">
                                <label className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-500 italic">AÑO_MODELO</label>
                                <button type="button" onClick={() => setShowInfo(prev => prev === 'year' ? null : 'year')} className="text-slate-600 hover:text-primary transition-colors">
                                    <Info size={18} />
                                </button>
                            </div>
                            <Input
                                type="number"
                                min="1900"
                                max={new Date().getFullYear() + 1}
                                value={form.year}
                                onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}
                                required
                                className="h-16 rounded-2xl border border-white/10 bg-white/5 shadow-inner px-6 font-black italic text-white text-xl tracking-tighter focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-all uppercase"
                            />
                            {showInfo === 'year' && <p className="text-[10px] font-bold text-primary italic uppercase tracking-[0.3em] px-2 animate-in slide-in-from-top-2">Datos requeridos para refacciones exactas.</p>}
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between pr-4">
                                <label className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-500 italic">FABRICANTE</label>
                                <button type="button" onClick={() => setShowInfo(prev => prev === 'make' ? null : 'make')} className="text-slate-600 hover:text-primary transition-colors">
                                    <Info size={18} />
                                </button>
                            </div>
                            <Input
                                placeholder="TOYOTA, FORD, BMW..."
                                value={form.make}
                                onChange={(e) => setForm({ ...form, make: e.target.value })}
                                required
                                className="h-16 rounded-2xl border border-white/10 bg-white/5 shadow-inner px-6 font-black italic text-white text-xl tracking-tighter focus:border-primary/40 transition-all placeholder:text-slate-800 uppercase"
                            />
                            {showInfo === 'make' && <p className="text-[10px] font-bold text-primary italic uppercase tracking-[0.3em] px-2">Marca oficial según registro.</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-500 italic ml-2">MODELO</label>
                            <Input
                                placeholder="CAMRY, F-150, CIVIC..."
                                value={form.model}
                                onChange={(e) => setForm({ ...form, model: e.target.value })}
                                required
                                className="h-16 rounded-2xl border border-white/10 bg-white/5 px-6 font-black italic text-white text-xl tracking-tighter focus:border-primary/40 transition-all uppercase placeholder:text-slate-800"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-500 italic ml-2">VERSIÓN_TRIM</label>
                            <Input
                                placeholder="SE, LIMITED, XLT..."
                                value={form.trim}
                                onChange={(e) => setForm({ ...form, trim: e.target.value })}
                                className="h-16 rounded-2xl border border-white/10 bg-white/5 px-6 font-black italic text-white text-xl tracking-tighter focus:border-primary/40 transition-all uppercase placeholder:text-slate-800"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-500 italic ml-2">SISTEMA_MOTRIZ</label>
                            <Select
                                value={form.powertrain}
                                onChange={(e) => setForm({ ...form, powertrain: e.target.value as any })}
                                options={[
                                    { value: 'GAS', label: '⛽ GASOLINA' },
                                    { value: 'HYBRID', label: '🔋 HÍBRIDO' },
                                    { value: 'EV', label: '⚡ ELÉCTRICO' },
                                    { value: 'DIESEL', label: '🚜 DIESEL' }
                                ]}
                                className="h-16 rounded-2xl border border-white/10 bg-white/5 font-black italic text-[12px] tracking-[0.5em] uppercase px-6 text-white"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-500 italic ml-2">ODÓMETRO_MI</label>
                            <Input
                                type="number"
                                value={form.odometer}
                                onChange={(e) => setForm({ ...form, odometer: e.target.value })}
                                className="h-16 rounded-2xl border border-white/10 bg-white/5 px-6 font-black italic text-white text-xl tracking-tighter focus:border-primary/40 transition-all uppercase placeholder:text-slate-800"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-500 italic ml-2">NOTAS_TÉCNICAS</label>
                        <Input
                            placeholder="COLOR, ACCESORIOS, DETALLES..."
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            className="h-16 rounded-2xl border border-white/10 bg-white/5 px-6 font-black italic text-white text-lg tracking-tighter focus:border-primary/40 transition-all uppercase placeholder:text-slate-800"
                        />
                    </div>
                    
                    <div className="pt-10 flex flex-col md:flex-row justify-end gap-6 border-t border-white/5">
                        <Button 
                            variant="ghost" 
                            size="xl"
                            type="button" 
                            onClick={() => setIsModalOpen(false)}
                            className="h-16 px-10 rounded-2xl font-black text-[12px] tracking-[0.5em] text-slate-500 hover:text-white hover:bg-white/5 uppercase italic"
                        >
                            CANCELAR
                        </Button>
                        <Button 
                            size="xl"
                            type="submit"
                            className="h-16 px-12 rounded-2xl bg-primary hover:bg-white text-slate-950 font-black text-[12px] tracking-[0.5em] shadow-3xl shadow-primary/20 transition-all uppercase italic border-none"
                        >
                            {editingVehicle ? 'CONFIRMAR CAMBIOS' : 'REGISTRAR UNIDAD'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Modal (Dark) */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="PROTOCOLO DE DESVINCULACIÓN"
                className="max-w-md rounded-[3rem] p-12 border border-rose-500/20 shadow-3xl bg-slate-950/95 backdrop-blur-3xl text-white"
            >
                <div className="py-10 space-y-8 text-center">
                    <div className="relative mx-auto w-24 h-24">
                        <div className="absolute inset-0 bg-rose-500/20 blur-3xl animate-pulse"></div>
                        <div className="relative w-24 h-24 bg-rose-500/10 rounded-[2rem] border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-2xl">
                            <AlertTriangle size={48} />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-2xl font-black italic uppercase tracking-tighter text-white">¿EJECUTAR BORRADO?</h4>
                        <p className="text-slate-500 font-bold uppercase text-[11px] leading-relaxed tracking-[0.3em] italic px-4">
                             ESTA OPERACIÓN ELIMINARÁ LA UNIDAD Y TODA SU BITÁCORA DE MANERA IRREVERSIBLE.
                        </p>
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                    <Button 
                        variant="destructive" 
                        size="xl"
                        onClick={handleDelete}
                        className="h-16 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-[12px] tracking-[0.4em] shadow-3xl uppercase italic border-none"
                    >
                        CONFIRMAR DESTRUCCIÓN
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="xl"
                        onClick={() => setIsDeleteModalOpen(false)}
                        className="h-16 rounded-2xl font-black text-[12px] tracking-[0.4em] text-slate-600 hover:text-white uppercase italic"
                    >
                        ABORTAR
                    </Button>
                </div>
            </Modal>

            {/* History Modal (Full Dark) */}
            <Modal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                title="LOG_AUDITORÍA_FLOTA"
                className="max-w-4xl rounded-[3rem] p-12 overflow-hidden border border-white/5 shadow-3xl bg-slate-950/95 backdrop-blur-3xl text-white"
            >
                {historyLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-8 text-center">
                        <div className="relative">
                            <div className="w-16 h-16 border-8 border-white/5 rounded-full"></div>
                            <div className="w-16 h-16 border-8 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                        </div>
                        <p className="text-slate-600 font-black uppercase text-[10px] tracking-[0.8em] italic animate-pulse">ACCEDIENDO_ARCHIVOS_CENTRAL</p>
                    </div>
                ) : selectedVehicleHistory.length === 0 ? (
                    <div className="py-24 text-center space-y-10">
                        <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] border border-white/10 flex items-center justify-center text-slate-800 mx-auto shadow-2xl">
                            <History size={48} />
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-3xl font-black italic text-white uppercase tracking-tighter">BITÁCORA_VACÍA</h4>
                            <p className="text-slate-600 font-black uppercase tracking-[0.5em] text-[11px] italic max-w-sm mx-auto leading-relaxed">
                                SIN INTERVENCIONES REGISTRADAS EN LA RED DENVER_ALPHA.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="max-h-[65vh] overflow-y-auto pr-6 scrollbar-hide py-10 space-y-12">
                        <div className="flex items-center gap-4 px-6 py-4 bg-white/5 rounded-2xl border border-white/10 w-fit">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
                            <span className="text-[10px] font-black text-white uppercase tracking-[0.5em] italic leading-none pt-0.5">LECTURA_SECUENCIAL_ACTIVA</span>
                        </div>
                        <Timeline items={selectedVehicleHistory} />
                    </div>
                )}
                <div className="flex justify-end pt-10 border-t border-white/5 mt-6">
                    <Button 
                        size="xl"
                        onClick={() => setIsHistoryModalOpen(false)}
                        className="h-16 px-12 rounded-2xl bg-white/5 text-slate-400 border border-white/10 font-black text-[12px] tracking-[0.5em] hover:bg-white hover:text-slate-950 transition-all uppercase italic shadow-2xl"
                    >
                        CERRAR TERMINAL
                    </Button>
                </div>
            </Modal>
        </div>
    );
}

function ArrowRight({ className, size }: { className?: string, size?: number }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width={size || 24} 
            height={size || 24} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
        </svg>
    );
}
