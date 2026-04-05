import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Trash2, Edit2, History, Car, Info, Droplets, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
    // Map: vehicleId -> { lastOilMiles: number | null, lastServiceDate: string | null }
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

            // For each vehicle, fetch the most recent completed oil change mileage
            const statusMap: Record<string, { lastOilMiles: number | null; lastServiceDate: string | null }> = {};
            await Promise.all(vehicleList.map(async (v: Vehicle) => {
                const { data: cl } = await supabaseAdmin
                    .from('inspection_checklists')
                    .select('findings, updated_at, service_requests!inner(vehicle_id, status, service_catalog:requested_service_id(name))')
                    .eq('status', 'COMPLETED')
                    .eq('service_requests.vehicle_id', v.id)
                    .order('updated_at', { ascending: false })
                    .limit(10);

                // Filter to oil change services client-side
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
            toast({ title: 'Error', description: error.message, type: 'error' });
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
            // SELF-HEAL CHECK: Ensure profile exists before vehicle insert (Foreign Key constraint fix)
            const { data: prof, error: profCheckErr } = await supabase
                .from('profiles')
                .select('user_id')
                .eq('user_id', user.id)
                .single();

            if (profCheckErr && profCheckErr.code !== 'PGRST116') { // PGRST116 means no rows found
                throw profCheckErr;
            }

            if (!prof) {
                // Trigger profile creation if it's missing (failsafe for old test accounts)
                const { error: pErr } = await supabase
                    .from('profiles')
                    .insert({
                        user_id: user.id,
                        role: user.user_metadata?.role || 'CUSTOMER',
                        first_name: user.user_metadata?.first_name || 'User',
                        last_name: user.user_metadata?.last_name || (user.email?.split('@')[0] || 'Customer')
                    });
                if (pErr) throw new Error(`Error reparando perfil: ${pErr.message}`);
                console.log('Profile self-healed found for user:', user.id);
            }

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
                toast({ title: 'Actualizado', description: 'Vehículo actualizado con éxito.', type: 'success' });
            } else {
                const { error } = await supabase
                    .from('vehicles')
                    .insert(vehicleData);
                if (error) throw error;
                toast({ title: 'Creado', description: 'Vehículo agregado con éxito.', type: 'success' });
            }
            setIsModalOpen(false);
            fetchVehicles();
            setShowInfo(null);
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, type: 'error' });
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
            toast({ title: 'Eliminado', description: 'Vehículo eliminado con éxito.', type: 'success' });
            setIsDeleteModalOpen(false);
            fetchVehicles();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, type: 'error' });
        }
    };

    const fetchHistory = async (vehicle: Vehicle) => {
        setHistoryLoading(true);
        setIsHistoryModalOpen(true);
        try {
            // Fetch requests and their inspections
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
                title: req.service_catalog?.name || 'Servicio General',
                description: req.inspections?.[0]?.findings || `Estado: ${req.status}`,
                date: new Date(req.created_at).toLocaleDateString(),
                status: req.status === 'COMPLETED' ? 'success' : 'default'
            }));

            setSelectedVehicleHistory(timelineItems);
        } catch (error: any) {
            toast({ title: 'Error', description: 'No se pudo cargar el historial.', type: 'error' });
        } finally {
            setHistoryLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Mis Vehículos</h1>
                    <p className="text-muted-foreground">Administra los autos asociados a tu cuenta.</p>
                </div>
                <Button onClick={() => handleOpenModal()}>
                    <Plus size={16} className="mr-2" /> Agregar Vehículo
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12 text-slate-400">Cargando vehículos...</div>
            ) : vehicles.length === 0 ? (
                <Card className="p-12 text-center border-dashed">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-slate-50 flex items-center justify-center rounded-full text-slate-300">
                            <Car size={32} />
                        </div>
                        <p className="text-slate-500">Aún no has agregado ningún vehículo.</p>
                        <Button variant="outline" onClick={() => handleOpenModal()}>Agregar el primero</Button>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vehicles.map((vehicle) => (
                        <Card key={vehicle.id} className="group hover:border-primary/30 transition-colors">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{vehicle.make} {vehicle.model}</CardTitle>
                                        <CardDescription>{vehicle.year} • {vehicle.powertrain}</CardDescription>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleOpenModal(vehicle)}>
                                            <Edit2 size={14} />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => {
                                            setVehicleToDelete(vehicle.id);
                                            setIsDeleteModalOpen(true);
                                        }}>
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                                <p className="text-slate-600">
                                    <span className="font-medium text-slate-900">Millas:</span> {vehicle.odometer ? `${vehicle.odometer.toLocaleString()} mi` : 'No registrado'}
                                </p>
                                {vehicle.trim && (
                                    <p className="text-slate-600">
                                        <span className="font-medium text-slate-900">Versión:</span> {vehicle.trim}
                                    </p>
                                )}

                                {/* OIL CHANGE TRAFFIC LIGHT */}
                                {(() => {
                                    const oil = oilStatus[vehicle.id];
                                    if (!oil) return null;

                                    if (!oil.lastOilMiles) {
                                        return (
                                            <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                                                <Droplets size={16} className="text-slate-400 shrink-0" />
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cambio de Aceite</p>
                                                    <p className="text-xs font-bold text-slate-500">Sin registro previo</p>
                                                </div>
                                            </div>
                                        );
                                    }

                                    const currentOdo = vehicle.odometer ?? oil.lastOilMiles;
                                    const milesSinceChange = currentOdo - oil.lastOilMiles;
                                    const nextChangeAt = oil.lastOilMiles + 7500;
                                    const milesRemaining = nextChangeAt - currentOdo;

                                    let color = 'bg-emerald-500';
                                    let textColor = 'text-emerald-700';
                                    let bgColor = 'bg-emerald-50 border-emerald-100';
                                    let icon = <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />;
                                    let label = 'Al Día';
                                    let detail = `${milesRemaining.toLocaleString()} mi restantes`;

                                    if (milesSinceChange >= 9500) {
                                        color = 'bg-red-500';
                                        textColor = 'text-red-700';
                                        bgColor = 'bg-red-50 border-red-100';
                                        icon = <AlertTriangle size={16} className="text-red-500 shrink-0" />;
                                        label = '¡Urgente!';
                                        detail = `${(milesSinceChange - 7500).toLocaleString()} mi vencido`;
                                    } else if (milesSinceChange >= 7500) {
                                        color = 'bg-orange-400';
                                        textColor = 'text-orange-700';
                                        bgColor = 'bg-orange-50 border-orange-100';
                                        icon = <AlertTriangle size={16} className="text-orange-500 shrink-0" />;
                                        label = 'Próximo Cambio';
                                        detail = `${(milesSinceChange - 7500).toLocaleString()} mi sobre límite`;
                                    }

                                    const lastDate = oil.lastServiceDate
                                        ? new Date(oil.lastServiceDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                                        : null;

                                    return (
                                        <div className={`mt-3 p-3 rounded-xl border ${bgColor}`}>
                                            <div className="flex items-center gap-2 mb-2">
                                                {icon}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Aceite Sintético</p>
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-white ${color}`}>{label}</span>
                                                    </div>
                                                    <p className={`text-xs font-bold ${textColor}`}>{detail}</p>
                                                </div>
                                            </div>
                                            {/* Progress bar */}
                                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-2 rounded-full transition-all ${color}`}
                                                    style={{ width: `${Math.min((milesSinceChange / 9500) * 100, 100)}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between mt-1.5">
                                                <p className="text-[9px] text-slate-400">{oil.lastOilMiles.toLocaleString()} mi</p>
                                                <p className="text-[9px] text-slate-400">Próx: {nextChangeAt.toLocaleString()} mi</p>
                                            </div>
                                            {lastDate && <p className="text-[9px] text-slate-400 mt-1">Último cambio: {lastDate}</p>}
                                        </div>
                                    );
                                })()}
                            </CardContent>
                            <CardFooter className="pt-2 border-t mt-4">
                                <Button variant="ghost" fullWidth size="sm" onClick={() => fetchHistory(vehicle)}>
                                    <History size={14} className="mr-2" /> Ver Historial
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Form Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setShowInfo(null);
                }}
                title={editingVehicle ? "Editar Vehículo" : "Agregar Nuevo Vehículo"}
            >
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Año</label>
                                <button type="button" onClick={() => setShowInfo(prev => prev === 'year' ? null : 'year')} className="text-slate-300 hover:text-primary transition-colors">
                                    <Info size={14} />
                                </button>
                            </div>
                            <Input
                                type="number"
                                min="1900"
                                max={new Date().getFullYear() + 1}
                                value={form.year}
                                onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}
                                required
                                hint={showInfo === 'year' ? "El año de fabricación (ej. 2015). Ayuda a elegir las refacciones correctas." : ""}
                                className="h-12 rounded-xl"
                            />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Marca</label>
                                <button type="button" onClick={() => setShowInfo(prev => prev === 'make' ? null : 'make')} className="text-slate-300 hover:text-primary transition-colors">
                                    <Info size={14} />
                                </button>
                            </div>
                            <Input
                                placeholder="Ej. Toyota"
                                value={form.make}
                                onChange={(e) => setForm({ ...form, make: e.target.value })}
                                required
                                hint={showInfo === 'make' ? "El fabricante del auto (ej. Toyota, Honda, Ford)." : ""}
                                className="h-12 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Modelo</label>
                                <button type="button" onClick={() => setShowInfo(prev => prev === 'model' ? null : 'model')} className="text-slate-300 hover:text-primary transition-colors">
                                    <Info size={14} />
                                </button>
                            </div>
                            <Input
                                placeholder="Ej. Camry"
                                value={form.model}
                                onChange={(e) => setForm({ ...form, model: e.target.value })}
                                required
                                hint={showInfo === 'model' ? "El nombre comercial del vehículo (ej. Camry, Civic, F-150)." : ""}
                                className="h-12 rounded-xl"
                            />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Versión / Trim</label>
                                <button type="button" onClick={() => setShowInfo(prev => prev === 'trim' ? null : 'trim')} className="text-slate-300 hover:text-primary transition-colors">
                                    <Info size={14} />
                                </button>
                            </div>
                            <Input
                                placeholder="Ej. SE"
                                value={form.trim}
                                onChange={(e) => setForm({ ...form, trim: e.target.value })}
                                hint={showInfo === 'trim' ? "Nivel de equipamiento o edición (ej. SE, Limited, XLT)." : ""}
                                className="h-12 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Motorización</label>
                                <button type="button" onClick={() => setShowInfo(prev => prev === 'power' ? null : 'power')} className="text-slate-300 hover:text-primary transition-colors">
                                    <Info size={14} />
                                </button>
                            </div>
                            <Select
                                value={form.powertrain}
                                onChange={(e) => setForm({ ...form, powertrain: e.target.value as any })}
                                options={[
                                    { value: 'GAS', label: 'Gasolina' },
                                    { value: 'HYBRID', label: 'Híbrido' },
                                    { value: 'EV', label: 'Eléctrico' },
                                    { value: 'DIESEL', label: 'Diesel' }
                                ]}
                                hint={showInfo === 'power' ? "Tipo de tecnología que impulsa tu motor." : ""}
                                className="h-12 rounded-xl"
                            />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Odómetro (Millas)</label>
                                <button type="button" onClick={() => setShowInfo(prev => prev === 'odo' ? null : 'odo')} className="text-slate-300 hover:text-primary transition-colors">
                                    <Info size={14} />
                                </button>
                            </div>
                            <Input
                                type="number"
                                value={form.odometer}
                                onChange={(e) => setForm({ ...form, odometer: e.target.value })}
                                hint={showInfo === 'odo' ? "Lectura de millas en tu tablero. Ayuda a predecir mantenimientos." : ""}
                                className="h-12 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Notas Adicionales</label>
                            <button type="button" onClick={() => setShowInfo(prev => prev === 'notes' ? null : 'notes')} className="text-slate-300 hover:text-primary transition-colors">
                                <Info size={14} />
                            </button>
                        </div>
                        <Input
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            hint={showInfo === 'notes' ? "Detalles como color o fallas previas (ej. 'Color Gris', 'Falla en radio')." : ""}
                            className="h-12 rounded-xl"
                        />
                    </div>
                    <div className="pt-4 flex justify-end gap-2">
                        <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit">Guardar</Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="¿Eliminar vehículo?"
            >
                <div className="py-4 text-slate-600">
                    Esta acción no se puede deshacer. Se perderá el acceso al historial vinculado a este vehículo desde el perfil.
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleDelete}>Confirmar Eliminación</Button>
                </div>
            </Modal>

            {/* History Modal */}
            <Modal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                title="Historial de Salud (Health History)"
            >
                {historyLoading ? (
                    <div className="py-8 text-center text-slate-400">Cargando historial...</div>
                ) : selectedVehicleHistory.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 italic">No hay historial para este vehículo aún.</div>
                ) : (
                    <div className="max-h-[60vh] overflow-y-auto pr-2">
                        <Timeline items={selectedVehicleHistory} />
                    </div>
                )}
                <div className="flex justify-end pt-6">
                    <Button variant="outline" onClick={() => setIsHistoryModalOpen(false)}>Cerrar</Button>
                </div>
            </Modal>
        </div>
    );
}
