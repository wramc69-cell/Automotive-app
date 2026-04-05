import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Stepper } from '../../components/ui/Stepper';
import type { Step } from '../../components/ui/Stepper';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { MapPin, Calendar, Clock, DollarSign, CheckCircle, ArrowRight, ShoppingBag } from 'lucide-react';

const steps: Step[] = [
    { id: '1', title: 'Ubicación', description: '¿Dónde está el vehículo?' },
    { id: '2', title: 'Fecha & Hora', description: '¿Cuándo vamos?' },
    { id: '3', title: 'Resumen', description: 'Revisa tu cita' }
];

const TIME_SLOTS = [
    { label: 'Mañana (09:00 - 12:00)', value: '09:00-12:00', start: '09:00', end: '12:00' },
    { label: 'Mediodía (12:00 - 15:00)', value: '12:00-15:00', start: '12:00', end: '15:00' },
    { label: 'Tarde (15:00 - 18:00)', value: '15:00-18:00', start: '15:00', end: '18:00' },
];

export function SchedulePage() {
    const [searchParams] = useSearchParams();
    const requestId = searchParams.get('request_id');
    const isRescheduling = searchParams.get('reschedule') === 'true';
    const { user, profile, refreshProfile } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    // Data from DB
    const [request, setRequest] = useState<any>(null);
    const [config, setConfig] = useState<any>(null);

    // Form State
    // Form State
    const [address, setAddress] = useState({
        line1: '',
        line2: '',
        zip: '',
        city: 'Denver',
        state: 'CO'
    });
    const [useSavedAddress, setUseSavedAddress] = useState<number | null>(null); // null, 1 or 2
    const [replaceAddressId, setReplaceAddressId] = useState<number | null>(null); // null, 1 or 2
    const [saveToProfile, setSaveToProfile] = useState(false);
    const [distanceMiles, setDistanceMiles] = useState(10);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[0].value);

    const isRoutine = request?.service_catalog?.name 
        ? !!request.service_catalog.name.match(/mantenimiento|aceite|filtro|routine|oil|filter/i)
        : false;
    const [hasSupplies, setHasSupplies] = useState(false);

    // Costs
    const visitFee = isRoutine ? 0 : 30.00;
    const distancePricing = config?.distance_pricing_per_mile || 1.5;
    const distanceSurcharge = distanceMiles * distancePricing;
    const totalCost = visitFee + distanceSurcharge;

    const savedCount = (profile?.address_line1 ? 1 : 0) + (profile?.address2_line1 ? 1 : 0);

    useEffect(() => {
        async function loadData() {
            if (!requestId) {
                toast({ title: 'Error', description: 'No se encontró el ID de la solicitud.', type: 'error' });
                navigate('/app/requests');
                return;
            }

            try {
                // Fetch Request
                const { data: reqData, error: reqError } = await supabase
                    .from('service_requests')
                    .select('*, vehicles(*), service_catalog(*)')
                    .eq('id', requestId)
                    .single();

                if (reqError) throw reqError;
                setRequest(reqData);

                // Fetch Config
                const { data: confData } = await supabase
                    .from('app_config')
                    .select('*')
                    .limit(1)
                    .single();

                if (confData) setConfig(confData);

                // Default to first address if available
                if (profile?.address_line1) {
                    setAddress({
                        line1: profile.address_line1 || '',
                        line2: profile.address_line2 || '',
                        zip: profile.zip || '',
                        city: profile.city || 'Denver',
                        state: profile.state || 'CO'
                    });
                    setUseSavedAddress(1);
                }

            } catch (err: any) {
                console.error('Error loading schedule data:', err);
                toast({ title: 'Error', description: 'No se pudo cargar la información.', type: 'error' });
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [requestId, navigate, toast, profile]);

    const handleNext = () => {
        if (currentStep === 0) {
            if (!address.line1 || !address.zip) {
                toast({ title: 'Campo requerido', description: 'Por favor ingresa la dirección y ZIP.', type: 'warning' });
                return;
            }
            // If try to save but already have 2 and didn't select replacement
            if (!useSavedAddress && saveToProfile && savedCount >= 2 && !replaceAddressId) {
                toast({ title: 'Atención', description: 'Has alcanzado el límite de 2 direcciones. Por favor selecciona cuál deseas reemplazar para continuar.', type: 'warning' });
                return;
            }
        }
        if (currentStep === 1) {
            if (!selectedDate) {
                toast({ title: 'Campo requerido', description: 'Por favor selecciona una fecha.', type: 'warning' });
                return;
            }
            // Check if date is in the future
            const today = new Date().toISOString().split('T')[0];
            if (selectedDate < today) {
                toast({ title: 'Fecha inválida', description: 'La fecha debe ser hoy o en el futuro.', type: 'warning' });
                return;
            }
        }

        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleConfirm();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(prev => prev - 1);
    };

    const handleConfirm = async () => {
        if (!user) return;
        setSubmitting(true);
        try {
            const slot = TIME_SLOTS.find(s => s.value === selectedSlot);
            const startDateTime = `${selectedDate}T${slot?.start}:00Z`;
            const endDateTime = `${selectedDate}T${slot?.end}:00Z`;

            // 0. Update profile address if needed
            if (saveToProfile && user) {
                const payload: any = {};
                
                // Case 1: Replace Address 1 OR New User (Total 0 saved)
                if (savedCount === 0 || replaceAddressId === 1) {
                    payload.address_line1 = address.line1;
                    payload.address_line2 = address.line2;
                    payload.zip = address.zip;
                    payload.city = address.city;
                    payload.state = address.state;
                } 
                // Case 2: Save as second address (Only have 1 saved and it's in Slot 1)
                else if (savedCount === 1 && profile?.address_line1 && !profile?.address2_line1) {
                    payload.address2_line1 = address.line1;
                    payload.address2_line2 = address.line2;
                    payload.zip2 = address.zip;
                    payload.city2 = address.city;
                    payload.state2 = address.state;
                }
                // Case 3: Explicitly replacing the second address
                else if (replaceAddressId === 2) {
                    payload.address2_line1 = address.line1;
                    payload.address2_line2 = address.line2;
                    payload.zip2 = address.zip;
                    payload.city2 = address.city;
                    payload.state2 = address.state;
                }
                // Case 4: Gap in Slot 1 (Unlikely, but for robustness)
                else if (savedCount === 1 && !profile?.address_line1 && profile?.address2_line1) {
                    payload.address_line1 = address.line1;
                    payload.address_line2 = address.line2;
                    payload.zip = address.zip;
                    payload.city = address.city;
                    payload.state = address.state;
                }

                if (Object.keys(payload).length > 0) {
                    const { error: profileError } = await supabase.from('profiles').update(payload).eq('user_id', user.id);
                    if (profileError) {
                        console.error('Profile update error:', profileError);
                        if (profileError.code === '42703') {
                            toast({ title: 'Error de BD', description: 'Por favor ejecuta el SQL para habilitar las dos direcciones.', type: 'error' });
                        }
                    } else {
                        // Crucial: Refresh profile context so future steps/pages see the new data
                        if (refreshProfile) await refreshProfile();
                    }
                }
            }

            const suppliesNote = isRoutine ? `\n- Insumos: ${hasSupplies ? 'EL CLIENTE YA TIENE LOS MATERIALES' : 'EL TÉCNICO DEBE PROVEER MATERIALES'}` : '';
            
            // 1. Upsert Appointment (Update if exists, insert if new)
            const apptData: any = {
                request_id: requestId,
                scheduled_start: startDateTime,
                scheduled_end: endDateTime,
                address: `${address.line1}${address.line2 ? ', ' + address.line2 : ''}`,
                city: address.city,
                state: address.state,
                zip: address.zip,
                distance_miles: distanceMiles,
                visit_fee: visitFee,
                distance_surcharge: distanceSurcharge,
                total_visit_cost: totalCost,
                customer_channel: profile?.preferred_channel || 'EMAIL',
                status: 'SCHEDULED'
            };

            // Check if there's an existing active appointment to update
            const { data: existingAppt } = await supabase
                .from('appointments')
                .select('id')
                .eq('request_id', requestId)
                .not('status', 'eq', 'CANCELED')
                .maybeSingle();

            let apptError;
            if (existingAppt) {
                const { error } = await supabase
                    .from('appointments')
                    .update(apptData)
                    .eq('id', existingAppt.id);
                apptError = error;
            } else {
                const { error } = await supabase
                    .from('appointments')
                    .insert(apptData);
                apptError = error;
            }

            if (apptError) {
                console.error('Appt Error:', apptError);
                throw new Error(`Error en Cita: ${apptError.message}`);
            }

            // 2. Update Service Request Status
            const { error: reqUpdateError } = await supabase
                .from('service_requests')
                .update({ 
                    status: 'SCHEDULED',
                    triage_notes: (request.triage_notes || '') + suppliesNote
                })
                .eq('id', requestId);

            if (reqUpdateError) {
                console.error('Req Update Error:', reqUpdateError);
                throw new Error(`Error en Solicitud: ${reqUpdateError.message}`);
            }

            // 3. Queue Notification
            const { error: notifError } = await supabase
                .from('notifications_outbox')
                .insert({
                    recipient_user_id: user?.id,
                    recipient: user?.email || profile?.phone || '',
                    channel: profile?.preferred_channel || 'EMAIL',
                    template_code: 'APPOINTMENT_CONFIRMED',
                    payload: {
                        data: {
                            name: profile?.first_name || 'Cliente',
                            date: selectedDate,
                            time: slot?.label,
                            address: address.line1
                        }
                    },
                    status: 'PENDING'
                });

            if (notifError) {
                console.warn('Notification queue failed:', notifError);
                // No lanzamos error para que la UI se marque como confirmada, 
                // ya que la cita y el estado de la solicitud sí se guardaron.
                toast({ 
                    title: 'Aviso', 
                    description: 'Cita agendada, pero hubo un problema al enviar la notificación automática.', 
                    type: 'warning' 
                });
            }

            setConfirmed(true);
            toast({ title: '¡Éxito!', description: 'Tu cita ha sido confirmada.', type: 'success' });

        } catch (err: any) {
            console.error('Error confirming appointment:', err);
            toast({ title: 'Error', description: `No se pudo confirmar la cita: ${err.message}`, type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-muted-foreground">Cargando detalles de tu solicitud...</p>
            </div>
        );
    }

    if (confirmed) {
        return (
            <div className="max-w-2xl mx-auto py-12 px-4 animate-in">
                <Card className="text-center p-8 border-success/20 shadow-xl rounded-2xl">
                    <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={48} />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold">¡{isRescheduling ? 'Reprogramación Exitosa' : 'Cita Confirmada'}!</CardTitle>
                        <p className="text-muted-foreground mt-2">
                            Hemos {isRescheduling ? 'actualizado' : 'recibido'} tu programación. Un técnico te contactará el día del servicio.
                        </p>
                    </CardHeader>
                    <CardContent className="mt-8">
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-left space-y-4">
                            <h4 className="font-semibold text-slate-700 uppercase text-xs tracking-wider">Resumen de la Cita</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3">
                                    <Calendar className="text-primary" size={18} />
                                    <div>
                                        <p className="text-xs text-slate-500">Fecha</p>
                                        <p className="font-medium">{selectedDate}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="text-primary" size={18} />
                                    <div>
                                        <p className="text-xs text-slate-500">Horario</p>
                                        <p className="font-medium">{TIME_SLOTS.find(s => s.value === selectedSlot)?.label.split(' ')[0]}</p>
                                    </div>
                                </div>
                                <div className="col-span-2 flex items-center gap-3">
                                    <MapPin className="text-primary" size={18} />
                                    <div>
                                        <p className="text-xs text-slate-500">Dirección</p>
                                        <p className="font-medium">{address.line1}, {address.city}, {address.state}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to={`/app/requests/${requestId}`} className="w-full sm:w-auto">
                            <Button className="w-full sm:w-auto">Ver Solicitud</Button>
                        </Link>
                        <Link to="/app" className="w-full sm:w-auto">
                            <Button variant="outline" className="w-full sm:w-auto">Ir al Dashboard</Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in pb-12">
            <div>
                <h1 className="text-2xl font-bold">{isRescheduling ? 'Reprogramar Servicio' : 'Agendar Servicio'}</h1>
                <p className="text-muted-foreground">
                    {isRescheduling 
                        ? 'Elige una nueva fecha y hora para tu visita.' 
                        : 'Completa los detalles para que un técnico visite tu vehículo.'}
                </p>
                {request && (
                    <div className="mt-4 flex items-center gap-2 text-sm bg-primary/5 text-primary-hover p-3 rounded-lg border border-primary/10">
                        <ArrowRight size={16} />
                        <span>{isRescheduling ? 'Reprogramando' : 'Programando'}: <strong>{request.service_catalog?.name}</strong> para <strong>{request.vehicles?.make} {request.vehicles?.model}</strong></span>
                    </div>
                )}
            </div>

            <Stepper steps={steps} currentStep={currentStep} />

            <Card className="mt-8 shadow-lg border-slate-200">
                <CardHeader className="border-b bg-slate-50/50">
                    <CardTitle className="text-lg">
                        {currentStep === 0 && '¿Dónde se encuentra el vehículo?'}
                        {currentStep === 1 && '¿Cuándo quieres que vayamos?'}
                        {currentStep === 2 && 'Confirmación de detalles'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">

                    {currentStep === 0 && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Selecciona o ingresa la ubicación</h3>
                                
                                {/* Address 1 */}
                                {profile?.address_line1 && (
                                    <div className={`p-5 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 cursor-pointer ${useSavedAddress === 1 ? 'border-primary bg-primary/5 shadow-inner' : 'border-slate-100 bg-slate-50'}`}
                                         onClick={() => {
                                             setUseSavedAddress(1);
                                             setAddress({
                                                 line1: profile.address_line1 || '',
                                                 line2: profile.address_line2 || '',
                                                 zip: profile.zip || '',
                                                 city: profile.city || 'Denver',
                                                 state: profile.state || 'CO'
                                             });
                                         }}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${useSavedAddress === 1 ? 'bg-primary text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}>
                                                <MapPin size={24} />
                                            </div>
                                            <div>
                                                <p className={`text-sm font-black uppercase tracking-tight ${useSavedAddress === 1 ? 'text-primary' : 'text-slate-600'}`}>
                                                    Dirección 1: {profile.first_name} {profile.last_name}
                                                </p>
                                                <p className="text-xs text-slate-500 font-bold mt-0.5">{profile.address_line1}, {profile.zip}</p>
                                            </div>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${useSavedAddress === 1 ? 'border-primary bg-primary' : 'border-slate-200 bg-white'}`}>
                                            {useSavedAddress === 1 && <div className="w-2 h-2 bg-white rounded-full shadow-sm" />}
                                        </div>
                                    </div>
                                )}

                                {/* Address 2 */}
                                {profile?.address2_line1 && (
                                    <div className={`p-5 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 cursor-pointer ${useSavedAddress === 2 ? 'border-primary bg-primary/5 shadow-inner' : 'border-slate-100 bg-slate-50'}`}
                                         onClick={() => {
                                             setUseSavedAddress(2);
                                             setAddress({
                                                 line1: profile.address2_line1 || '',
                                                 line2: profile.address2_line2 || '',
                                                 zip: profile.zip2 || '',
                                                 city: profile.city2 || 'Denver',
                                                 state: profile.state2 || 'CO'
                                             });
                                         }}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${useSavedAddress === 2 ? 'bg-primary text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}>
                                                <MapPin size={24} />
                                            </div>
                                            <div>
                                                <p className={`text-sm font-black uppercase tracking-tight ${useSavedAddress === 2 ? 'text-primary' : 'text-slate-600'}`}>
                                                    Dirección 2: {profile.first_name} {profile.last_name}
                                                </p>
                                                <p className="text-xs text-slate-500 font-bold mt-0.5">{profile.address2_line1}, {profile.zip2}</p>
                                            </div>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${useSavedAddress === 2 ? 'border-primary bg-primary' : 'border-slate-200 bg-white'}`}>
                                            {useSavedAddress === 2 && <div className="w-2 h-2 bg-white rounded-full shadow-sm" />}
                                        </div>
                                    </div>
                                )}

                                {/* New Address Option */}
                                <div className={`p-5 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 cursor-pointer ${useSavedAddress === null ? 'border-primary bg-primary/5 shadow-inner' : 'border-slate-100 bg-slate-50'}`}
                                     onClick={() => {
                                         setUseSavedAddress(null);
                                         setAddress({ line1: '', line2: '', zip: '', city: 'Denver', state: 'CO' });
                                     }}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${useSavedAddress === null ? 'bg-primary text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}>
                                            <MapPin size={24} />
                                        </div>
                                        <div>
                                            <p className={`text-sm font-black uppercase tracking-tight ${useSavedAddress === null ? 'text-primary' : 'text-slate-600'}`}>
                                                Otra Dirección / Nueva
                                            </p>
                                            <p className="text-xs text-slate-500 font-bold mt-0.5">Ingresa una ubicación manualmente</p>
                                        </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${useSavedAddress === null ? 'border-primary bg-primary' : 'border-slate-200 bg-white'}`}>
                                        {useSavedAddress === null && <div className="w-2 h-2 bg-white rounded-full shadow-sm" />}
                                    </div>
                                </div>
                            </div>

                            {/* New Address Form */}
                            {useSavedAddress === null && (
                                <div className="space-y-6 pt-4 border-t border-slate-100 animate-in slide-in-from-top-4 duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label="Calle y Número"
                                            placeholder="Ej. 123 Main St"
                                            value={address.line1}
                                            onChange={e => setAddress({ ...address, line1: e.target.value })}
                                            required
                                            className="h-12 rounded-xl"
                                        />
                                        <Input
                                            label="Apt / Suite / Otros"
                                            placeholder="Opcional"
                                            value={address.line2}
                                            onChange={e => setAddress({ ...address, line2: e.target.value })}
                                            className="h-12 rounded-xl"
                                        />
                                        <Input
                                            label="Código Postal (ZIP)"
                                            placeholder="80204"
                                            value={address.zip}
                                            onChange={e => setAddress({ ...address, zip: e.target.value })}
                                            required
                                            className="h-12 rounded-xl"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input label="Ciudad" value={address.city} disabled className="h-12 rounded-xl bg-slate-50" />
                                            <Select
                                                label="Estado"
                                                value={address.state}
                                                options={[{ label: 'Colorado', value: 'CO' }]}
                                                disabled
                                                className="h-12 rounded-xl bg-slate-50"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <input 
                                                type="checkbox" 
                                                id="saveProfile"
                                                checked={saveToProfile}
                                                onChange={(e) => setSaveToProfile(e.target.checked)}
                                                className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                                            />
                                            <label htmlFor="saveProfile" className="text-xs text-slate-600 font-bold uppercase tracking-tight cursor-pointer">
                                                Guardar dirección en mi perfil
                                            </label>
                                        </div>

                                        {saveToProfile && savedCount >= 2 && (
                                            <div className="p-4 bg-warning/10 rounded-2xl border border-warning/20 animate-in zoom-in-95">
                                                <p className="text-[10px] font-black uppercase text-warning mb-3">Sustitución Requerida (Máx 2 direcciones)</p>
                                                <p className="text-xs text-slate-600 font-medium mb-4">¿Cuál dirección deseas reemplazar?</p>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button 
                                                        onClick={() => setReplaceAddressId(1)}
                                                        className={`p-3 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${replaceAddressId === 1 ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}
                                                    >
                                                        Dirección 1
                                                    </button>
                                                    <button 
                                                        onClick={() => setReplaceAddressId(2)}
                                                        className={`p-3 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${replaceAddressId === 2 ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}
                                                    >
                                                        Dirección 2
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                                <div className="pt-6 border-t border-slate-100">
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-blue-50 rounded-3xl border-2 border-blue-100/50 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                                                <DollarSign size={28} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest leading-none mb-1">Costo Estimado de Traslado</p>
                                                <p className="text-3xl font-black text-blue-900 leading-none">${totalCost.toFixed(2)}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3">
                                            <MapPin size={18} className="text-blue-400" />
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-[10px] font-black text-blue-300">HUB CENTRAL</span>
                                                    <span className="text-blue-900 text-xl font-black">{distanceMiles} MI</span>
                                                    <span className="text-[10px] font-black text-blue-300">RANGO MÁX</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="50"
                                                    step="1"
                                                    value={distanceMiles}
                                                    onChange={e => setDistanceMiles(parseInt(e.target.value))}
                                                    className="w-full h-2 bg-blue-200 rounded-full appearance-none cursor-pointer accent-blue-600"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold italic text-center mt-3">
                                        * Este cargo inicial cubre el desplazamiento y tiempo del técnico a tu ubicación.
                                    </p>
                                </div>

                                {isRoutine && (
                                    <div className="pt-6 border-t border-slate-100 space-y-4 animate-in slide-in-from-top-4 duration-700">
                                        <div className="flex items-center gap-3 mb-2">
                                            <ShoppingBag className="text-primary" size={20} />
                                            <h3 className="text-sm font-black uppercase tracking-tight text-slate-700">Insumos para Mantenimiento</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button 
                                                type="button"
                                                onClick={() => setHasSupplies(true)}
                                                className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${hasSupplies ? 'border-primary bg-primary/5 shadow-inner' : 'border-slate-100 bg-white text-slate-400'}`}
                                            >
                                                <CheckCircle size={24} className={hasSupplies ? 'text-primary' : 'text-slate-200'} />
                                                <p className={`text-xs font-black uppercase ${hasSupplies ? 'text-primary' : ''}`}>Yo tengo los insumos</p>
                                                <p className="text-[9px] font-medium text-center leading-tight">Solo requiero la mano de obra del técnico.</p>
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setHasSupplies(false)}
                                                className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${!hasSupplies ? 'border-primary bg-primary/5 shadow-inner' : 'border-slate-100 bg-white text-slate-400'}`}
                                            >
                                                <ShoppingBag size={24} className={!hasSupplies ? 'text-primary' : 'text-slate-200'} />
                                                <p className={`text-xs font-black uppercase ${!hasSupplies ? 'text-primary' : ''}`}>Proveer insumos</p>
                                                <p className="text-[9px] font-medium text-center leading-tight">El técnico proveerá aceite, filtros y materiales.</p>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    {currentStep === 1 && (
                        <div className="space-y-6 max-w-md mx-auto">
                            <Input
                                label="Fecha de la visita"
                                type="date"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                required
                            />
                            <Select
                                label="Franja horaria preferida"
                                value={selectedSlot}
                                onChange={e => setSelectedSlot(e.target.value)}
                                options={TIME_SLOTS.map(t => ({ label: t.label, value: t.value }))}
                            />
                            <div className="bg-blue-50 p-4 rounded-lg flex gap-3 text-blue-700 text-sm border border-blue-100 mt-6">
                                <Clock size={18} className="shrink-0" />
                                <p>
                                    Nuestros técnicos operan en ventanas de 3 horas para dar flexibilidad ante el tráfico y trabajos previos.
                                </p>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200 overflow-hidden">
                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="text-slate-400 mt-1" size={18} />
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400">Ubicación</p>
                                            <p className="text-sm font-medium">{address.line1}, {address.city}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Calendar className="text-slate-400 mt-1" size={18} />
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400">Programación</p>
                                            <p className="text-sm font-medium">{selectedDate} - {TIME_SLOTS.find(s => s.value === selectedSlot)?.label.split(' ')[0]}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 space-y-4">
                                    <h4 className="text-xs font-black text-slate-400 uppercase flex items-center gap-2 tracking-widest">
                                        <DollarSign size={14} className="text-primary" /> Presupuesto Detallado
                                    </h4>
                                    
                                    <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                        {/* Travel Cost */}
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500 font-bold">COSTO TRASLADO MÓVIL</span>
                                            <span className="font-black text-slate-900">${totalCost.toFixed(2)}</span>
                                        </div>
                                        
                                        {/* Labor Cost */}
                                        <div className="flex justify-between items-center text-sm pt-2">
                                            <div className="flex flex-col">
                                                <span className="text-slate-500 font-bold uppercase text-[10px]">Mano de Obra</span>
                                                <span className="text-xs text-slate-400 leading-tight">{request?.service_catalog?.name || 'Servicio técnico'}</span>
                                            </div>
                                            <span className="font-black text-slate-900">
                                                ${(request?.service_catalog?.labor_price || request?.service_catalog?.base_price || 0).toFixed(2)}
                                            </span>
                                        </div>

                                        {/* Materials Cost */}
                                        {isRoutine && (
                                            <div className={`flex justify-between items-center text-sm pt-2 transition-opacity ${hasSupplies ? 'opacity-40 italic' : ''}`}>
                                                <div className="flex flex-col">
                                                    <span className="text-slate-500 font-bold uppercase text-[10px]">Insumos y Materiales</span>
                                                    <span className="text-xs text-slate-400 leading-tight">
                                                        {hasSupplies ? 'Provistos por el cliente' : 'Provistos por Denver Mobile'}
                                                    </span>
                                                </div>
                                                <span className={`font-black ${hasSupplies ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                                    {hasSupplies ? '$0.00' : `$${(request?.service_catalog?.parts_price || 0).toFixed(2)}`}
                                                </span>
                                            </div>
                                        )}

                                        {/* Grand Total */}
                                        <div className="pt-4 mt-2 border-t-2 border-slate-50 flex justify-between items-center">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-primary uppercase tracking-widest">Presupuesto Final</span>
                                                <p className="text-[9px] text-slate-400 font-medium">* Sujeto a inspección técnica</p>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-3xl font-black text-primary tracking-tighter">
                                                    ${(
                                                        totalCost + 
                                                        (request?.service_catalog?.labor_price || request?.service_catalog?.base_price || 0) + 
                                                        (hasSupplies ? 0 : (request?.service_catalog?.parts_price || 0))
                                                    ).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 border-dashed">
                                        <p className="text-[10px] text-orange-700 font-bold leading-tight">
                                            {isRoutine 
                                                ? `Este presupuesto incluye la visita, $${(request?.service_catalog?.labor_price || 0).toFixed(2)} por mano de obra y ` + (hasSupplies ? 'no incluye materiales ya que los proveerás tú.' : `$${(request?.service_catalog?.parts_price || 0).toFixed(2)} por la provisión de insumos.`)
                                                : 'Este cargo inicial de visita cubre el traslado y diagnóstico. El presupuesto final de reparación se te presentará tras la inspección física.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </CardContent>
                <div className="flex justify-between p-6 pt-0">
                    <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>Atrás</Button>
                    <Button onClick={handleNext} loading={submitting}>
                        {currentStep === steps.length - 1 ? (isRescheduling ? 'Confirmar Nueva Fecha' : 'Confirmar Cita') : 'Siguiente'}
                    </Button>
                </div>
            </Card>
        </div>
    );
}
