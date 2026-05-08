import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Stepper } from '../../components/ui/Stepper';
import type { Step } from '../../components/ui/Stepper';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
    Calendar, 
    Clock, 
    MapPin, 
    CheckCircle, 
    ArrowRight, 
    ArrowLeft, 
    DollarSign, 
    ShoppingBag,
    PlusCircle,
    Info,
    Check,
    Zap,
    Activity,
    ShieldCheck,
    Truck,
    LayoutDashboard
} from 'lucide-react';

const steps: Step[] = [
    { id: '1', title: 'LOGÍSTICA', description: 'LOCALIZACIÓN DEL ACTIVO' },
    { id: '2', title: 'INSERCIÓN', description: 'SINCRONIZACIÓN DE VENTANA' },
    { id: '3', title: 'PROTOCOLO', description: 'ORDEN DE MISIÓN FINAL' }
];

const TIME_SLOTS = [
    { label: 'MAÑANA (09:00 - 12:00)', value: '09:00-12:00', start: '09:00', end: '12:00' },
    { label: 'MEDIODÍA (12:00 - 15:00)', value: '12:00-15:00', start: '12:00', end: '15:00' },
    { label: 'TARDE (15:00 - 18:00)', value: '15:00-18:00', start: '15:00', end: '18:00' },
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

    const [request, setRequest] = useState<any>(null);
    const [config, setConfig] = useState<any>(null);

    const [address, setAddress] = useState({
        line1: '',
        line2: '',
        zip: '',
        city: 'Denver',
        state: 'CO'
    });
    const [useSavedAddress, setUseSavedAddress] = useState<number | null>(null);
    const [replaceAddressId, setReplaceAddressId] = useState<number | null>(null);
    const [saveToProfile, setSaveToProfile] = useState(false);
    const [distanceMiles, setDistanceMiles] = useState(10);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[0].value);

    const isRoutine = request?.service_catalog?.name 
        ? !!request.service_catalog.name.match(/mantenimiento|aceite|filtro|routine|oil|filter/i)
        : false;
    const [hasSupplies, setHasSupplies] = useState(false);

    const travelFee = isRoutine ? 0 : 30.00;
    const distancePricing = config?.distance_pricing_per_mile || 1.5;
    const distanceSurcharge = distanceMiles * distancePricing;
    const suppliesCost = hasSupplies ? 0 : (request?.service_catalog?.parts_price || 0);
    const serviceLabor = request?.service_catalog?.labor_price || request?.service_catalog?.base_price || 0;
    const totalCost = travelFee + distanceSurcharge + serviceLabor + suppliesCost;

    const savedCount = (profile?.address_line1 ? 1 : 0) + (profile?.address2_line1 ? 1 : 0);

    useEffect(() => {
        async function loadData() {
            if (!requestId) {
                toast({ title: 'Error de Navegación', description: 'No se encontró el ID de la solicitud en la transmisión.', type: 'error' });
                navigate('/app/requests');
                return;
            }

            try {
                const { data: reqData, error: reqError } = await supabase
                    .from('service_requests')
                    .select('*, vehicles(*, make, model), service_catalog(*)')
                    .eq('id', requestId)
                    .single();

                if (reqError) throw reqError;
                setRequest(reqData);

                const { data: confData } = await supabase
                    .from('app_config')
                    .select('*')
                    .limit(1)
                    .single();

                if (confData) setConfig(confData);

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
                toast({ title: 'Error de Red', description: 'No se pudo sincronizar la información del servidor.', type: 'error' });
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [requestId, navigate, toast, profile]);

    const handleNext = () => {
        if (currentStep === 0) {
            if (!address.line1 || !address.zip) {
                toast({ title: 'Datos Incompletos', description: 'Protocolo requiere dirección y código postal para triangulación.', type: 'error' });
                return;
            }
        }
        if (currentStep === 1) {
            if (!selectedDate) {
                toast({ title: 'Slot Requerido', description: 'Seleccione una ventana de inserción válida.', type: 'error' });
                return;
            }
        }
        setCurrentStep(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(prev => prev - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleConfirm = async () => {
        if (!user) return;
        setSubmitting(true);
        try {
            const slot = TIME_SLOTS.find(s => s.value === selectedSlot);
            const startDateTime = `${selectedDate}T${slot?.start}:00Z`;
            const endDateTime = `${selectedDate}T${slot?.end}:00Z`;

            const apptData: any = {
                request_id: requestId,
                scheduled_start: startDateTime,
                scheduled_end: endDateTime,
                address: `${address.line1}${address.line2 ? ', ' + address.line2 : ''}`,
                city: address.city,
                state: address.state,
                zip: address.zip,
                distance_miles: distanceMiles,
                visit_fee: travelFee,
                distance_surcharge: distanceSurcharge,
                total_visit_cost: totalCost,
                customer_channel: profile?.preferred_channel || 'EMAIL',
                status: 'SCHEDULED'
            };

            const { data: existingAppt } = await supabase
                .from('appointments')
                .select('id')
                .eq('request_id', requestId)
                .not('status', 'eq', 'CANCELED')
                .maybeSingle();

            if (existingAppt) {
                await supabase.from('appointments').update(apptData).eq('id', existingAppt.id);
            } else {
                await supabase.from('appointments').insert(apptData);
            }

            await supabase
                .from('service_requests')
                .update({ status: 'SCHEDULED' })
                .eq('id', requestId);

            setConfirmed(true);
            toast({ title: 'Misión Programada', description: 'El despliegue técnico ha sido registrado.', type: 'success' });

        } catch (err: any) {
            console.error(err);
            toast({ title: 'Falla de Transmisión', description: err.message, type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 font-inter animate-in fade-in duration-1000">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-100 border-t-primary rounded-[1.5rem] animate-spin shadow-xl shadow-primary/20"></div>
                    <Activity size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" fill="currentColor" />
                </div>
                <div className="text-center space-y-2">
                    <p className="text-slate-950 font-black uppercase text-lg tracking-[0.3em] italic leading-none">CONFIGURANDO INTERVENCIÓN</p>
                    <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.4em] italic animate-pulse">PROTOCOLO SCHED_v2 ACTIVE</p>
                </div>
            </div>
        );
    }

    if (confirmed) {
        return (
            <div className="max-w-[800px] mx-auto py-16 px-6 animate-in fade-in zoom-in-95 duration-1000 font-inter">
                <Card className="text-center p-12 md:p-16 border-none shadow-3xl rounded-[2.5rem] bg-slate-950 overflow-hidden relative group text-white">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none group-hover:scale-125 transition-transform duration-1000"></div>
                    <div className="relative z-10 space-y-12">
                        <div className="w-24 h-24 bg-white/5 backdrop-blur-3xl rounded-3xl flex items-center justify-center text-primary mx-auto shadow-2xl border border-white/10 group-hover:rotate-12 transition-transform duration-700">
                            <ShieldCheck size={48} className="drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                        </div>
                        <div className="space-y-4">
                            <span className="text-primary font-black text-[10px] uppercase tracking-[0.6em] italic">MISION STATUS: LOGGED</span>
                            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-[0.8] text-white">
                                ¡MISION<br />
                                <span className="text-primary">ACTIVA</span>!
                            </h1>
                            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] max-w-md mx-auto italic mt-6">
                                EL ESPECIALISTA HA SIDO NOTIFICADO. REVISE EL TIMELINE PARA SEGUIMIENTO EN TIEMPO REAL.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                            <Link to={`/app/requests/${requestId}`} className="flex-1">
                                <Button size="lg" className="w-full h-16 bg-primary hover:bg-white hover:text-slate-950 text-white border-none rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] italic shadow-xl transition-all duration-700">ORDEN DE MISION <ArrowRight size={18} className="ml-3" /></Button>
                            </Link>
                            <Link to="/app" className="flex-1">
                                <Button size="lg" variant="outline" className="w-full h-16 border-2 border-white/10 text-white hover:bg-white/10 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] italic transition-all duration-700">VOLVER A TERMINAL</Button>
                            </Link>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-[1000px] mx-auto space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-8 duration-700 font-inter px-4 md:px-8">
            
            {/* Header: Sched Matrix */}
            <div className="relative group grayscale hover:grayscale-0 transition-all duration-1000">
                <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none group-hover:bg-primary/20 transition-all"></div>
                <div className="relative z-10 bg-slate-950 rounded-[2.5rem] p-8 md:p-12 overflow-hidden border border-white/5 shadow-xl shadow-slate-950/40">
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-[60px]"></div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 flex-wrap">
                        <div className="space-y-6 text-center md:text-left flex-1 min-w-[280px]">
                            <div className="flex items-center justify-center md:justify-start gap-4">
                                <div className="w-12 h-12 bg-white/5 backdrop-blur-3xl rounded-2xl flex items-center justify-center text-primary border border-white/10 shadow-lg group-hover:rotate-6 transition-transform duration-700 shrink-0">
                                    <Clock size={24} />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-primary font-black text-[10px] uppercase tracking-[0.5em] italic block">DENVER SCHEDULING MATRIX</span>
                                    <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[9px] italic flex items-center gap-2">
                                       TARGET: <span className="text-white">COORDINATING_DEPLOYMENT</span>
                                    </p>
                                </div>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-[0.85] text-white">
                                {isRescheduling ? 'SYNC' : 'AGENDAR'} <br /> 
                                <span className="text-primary italic transition-all duration-700 group-hover:text-white">PROTOCOLO</span>
                            </h1>
                        </div>
                        <div className="hidden lg:block shrink-0">
                            <div className="w-32 h-32 border-2 border-dashed border-white/10 rounded-3xl flex items-center justify-center group-hover:border-primary/40 transition-colors duration-700 rotate-12">
                                <Truck size={48} className="text-white/10 group-hover:text-primary/40 transition-all duration-700" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 md:px-8">
                <Stepper steps={steps} currentStep={currentStep} />
            </div>

            <Card className="shadow-2xl shadow-slate-200/40 border border-slate-100 rounded-[2.5rem] overflow-hidden bg-white mt-8">
                <CardHeader className="p-8 md:p-12 pb-8 border-b border-slate-50">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="text-center md:text-left space-y-2">
                            <CardTitle className="text-4xl md:text-5xl font-black italic tracking-tighter text-slate-950 uppercase leading-none">
                                {currentStep === 0 && 'LOCALIZACIÓN'}
                                {currentStep === 1 && 'SINCRONIZACIÓN'}
                                {currentStep === 2 && 'ORDEN FINAL'}
                            </CardTitle>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic flex items-center gap-3 justify-center md:justify-start">
                                <div className="w-6 h-[1.5px] bg-primary"></div>
                                {currentStep === 0 && 'INGRESE EL PUNTO EXACTO DE INTERVENCIÓN'}
                                {currentStep === 1 && 'ELIJA LA VENTANA OPERATIVA DISPONIBLE'}
                                {currentStep === 2 && 'VALIDE LOS DETALLES ANTES DEL DESPLIEGUE'}
                            </p>
                        </div>
                        <div className="flex flex-col items-center md:items-end">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mb-2">STAGE_LEVEL_0{currentStep + 1}</span>
                            <div className="flex gap-2">
                                {[0,1,2].map(i => (
                                    <div key={i} className={`h-1.5 rounded-full transition-all duration-700 shadow-sm ${i === currentStep ? 'w-12 bg-primary' : i < currentStep ? 'w-3 bg-slate-950' : 'w-3 bg-slate-100'}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-8 md:p-12 py-10">
                    {/* Step 0: Ubicación (Logistics Step) */}
                    {currentStep === 0 && (
                        <div className="space-y-16 animate-in slide-in-from-right-12 duration-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {profile?.address_line1 && (
                                    <div 
                                        onClick={() => { setUseSavedAddress(1); setAddress({ line1: profile.address_line1 || '', line2: profile.address_line2 || '', zip: profile.zip || '', city: profile.city || 'Denver', state: profile.state || 'CO' }); }}
                                        className={`p-8 md:p-10 rounded-3xl border-2 transition-all flex flex-col justify-between gap-6 cursor-pointer group/addr relative overflow-hidden ${useSavedAddress === 1 ? 'border-primary bg-slate-950 text-white shadow-xl scale-[1.02]' : 'border-slate-100 bg-slate-50 hover:border-slate-300 hover:scale-[1.01]'}`}
                                    >
                                        {useSavedAddress === 1 && <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2" />}
                                        <div className="flex items-start justify-between relative z-10">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-700 ${useSavedAddress === 1 ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-white text-slate-400 border border-slate-200 shadow-sm'}`}><MapPin size={24} /></div>
                                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-700 ${useSavedAddress === 1 ? 'border-primary bg-primary' : 'border-slate-200 bg-white'}`}>
                                                {useSavedAddress === 1 && <Check size={16} className="text-white stroke-[4]" />}
                                            </div>
                                        </div>
                                        <div className="relative z-10 space-y-1">
                                            <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-1 italic ${useSavedAddress === 1 ? 'text-primary' : 'text-slate-500'}`}>DIRECCIÓN_MAESTRA</p>
                                            <p className="text-2xl font-black italic uppercase tracking-tighter leading-none mb-1">{profile.address_line1}</p>
                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">{profile.zip} {profile.city}, {profile.state}</p>
                                        </div>
                                    </div>
                                )}

                                <div 
                                    onClick={() => { setUseSavedAddress(null); setAddress({ line1: '', line2: '', zip: '', city: 'Denver', state: 'CO' }); }}
                                    className={`p-8 md:p-10 rounded-3xl border-2 transition-all flex flex-col justify-between gap-6 cursor-pointer group/addr relative overflow-hidden ${useSavedAddress === null ? 'border-primary bg-slate-950 text-white shadow-xl scale-[1.02]' : 'border-2 border-dashed border-slate-200 hover:border-primary/40 hover:bg-slate-50 transition-colors'}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-700 ${useSavedAddress === null ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-slate-100 text-slate-400'}`}><PlusCircle size={24} /></div>
                                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-700 ${useSavedAddress === null ? 'border-primary bg-primary' : 'border-slate-200 bg-white'}`}>
                                            {useSavedAddress === null && <Check size={16} className="text-white stroke-[4]" />}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-1 italic ${useSavedAddress === null ? 'text-primary' : 'text-slate-400'}`}>DIRECCIÓN_MANUAL</p>
                                        <p className={`text-2xl font-black italic uppercase tracking-tighter leading-none ${useSavedAddress === null ? 'text-white' : 'text-slate-400'}`}>INGRESAR NUEVO PUNTO</p>
                                    </div>
                                </div>
                            </div>

                            {useSavedAddress === null && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 md:p-10 bg-slate-50 rounded-3xl animate-in zoom-in-95 duration-700 border border-slate-100 shadow-inner">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-950 ml-4 italic">COORD_DIRECCIÓN</label>
                                        <Input placeholder="EJ. 1600 CAMPBELL ST" value={address.line1} onChange={e => setAddress({ ...address, line1: e.target.value })} className="h-14 rounded-2xl border-none bg-white shadow-md font-black italic uppercase px-6 text-sm focus:ring-4 focus:ring-primary/20 transition-all placeholder:text-slate-200" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-950 ml-4 italic">ZIP_CÓDIGO_POSTAL</label>
                                        <Input placeholder="80204" value={address.zip} onChange={e => setAddress({ ...address, zip: e.target.value })} className="h-14 rounded-2xl border-none bg-white shadow-md font-black tracking-[0.4em] text-center italic text-sm focus:ring-4 focus:ring-primary/20 transition-all placeholder:text-slate-200" />
                                    </div>
                                </div>
                            )}

                            <div className="p-8 md:p-12 bg-slate-950 rounded-3xl text-white shadow-xl relative overflow-hidden group/dist transition-all duration-700 border border-white/5">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover/dist:scale-125 transition-transform duration-1000"></div>
                                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
                                    <div className="flex items-center gap-8">
                                        <div className="w-20 h-20 bg-white/5 backdrop-blur-3xl rounded-2xl flex items-center justify-center text-primary shadow-xl border border-white/10 group-hover/dist:rotate-12 transition-transform duration-700 shrink-0">
                                            <DollarSign size={36} className="drop-shadow-[0_0_10px_rgba(var(--primary),0.6)]" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-2 italic flex items-center gap-3">
                                                <div className="w-6 h-[1.5px] bg-primary/40"></div> ESTADO FINANCIERO
                                            </p>
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-6xl md:text-7xl font-black italic tracking-tighter leading-none text-white group-hover/dist:text-primary transition-colors duration-700">${totalCost.toFixed(2)}</span>
                                                <span className="text-slate-500 font-black uppercase text-[10px] tracking-[0.2em] italic">USD_NET</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 max-w-md w-full space-y-6 bg-white/5 p-6 rounded-3xl border border-white/5 backdrop-blur-3xl">
                                        <div className="flex justify-between items-center font-black italic text-primary uppercase text-[10px] tracking-[0.3em]">
                                            RANGO_LOGÍSTICO: {distanceMiles} MI <span className="text-white opacity-20">||||||||||</span>
                                        </div>
                                        <input type="range" min="1" max="50" value={distanceMiles} onChange={e => setDistanceMiles(parseInt(e.target.value))} className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary shadow-inner" />
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.3em] italic text-center leading-relaxed">SISTEMA AJUSTA CARGO POR DESPLAZAMIENTO SEGÚN DISTANCIA DESDE EL HUB.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 1: Sincronización (Insertion Step) */}
                    {currentStep === 1 && (
                        <div className="max-w-2xl mx-auto space-y-12 animate-in slide-in-from-right-12 duration-700">
                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-950 flex items-center gap-3 italic ml-4">
                                    <Calendar size={18} className="text-primary" /> FECHA_VENTANA_INTERVENCIÓN
                                </h3>
                                <div className="relative group">
                                    <div className="absolute inset-x-0 bottom-0 h-6 bg-primary/5 blur-xl group-hover:bg-primary/10 transition-colors pointer-events-none"></div>
                                    <Input
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={selectedDate}
                                        onChange={e => setSelectedDate(e.target.value)}
                                        className="h-20 rounded-[2rem] font-black uppercase italic border-none bg-slate-50 shadow-inner px-10 text-2xl focus:ring-4 focus:ring-primary/10 appearance-none translate-y-0 group-hover:-translate-y-1 transition-all duration-700 text-slate-950 focus:bg-white"
                                    />
                                    <Calendar className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-primary transition-all duration-700" size={28} />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-950 flex items-center gap-3 italic ml-4">
                                    <Clock size={18} className="text-primary" /> VENTANA_OPERATIVA_TÉCNICA
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {TIME_SLOTS.map(slot => (
                                        <div 
                                            key={slot.value}
                                            onClick={() => setSelectedSlot(slot.value)}
                                            className={`p-6 md:p-8 rounded-3xl border-2 transition-all flex items-center justify-between cursor-pointer group/slot relative overflow-hidden ${selectedSlot === slot.value ? 'border-primary bg-slate-950 text-white shadow-xl scale-[1.02]' : 'border-slate-100 bg-white hover:border-slate-200 hover:scale-[1.01]'}`}
                                        >
                                            <div className="flex items-center gap-6 relative z-10">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-700 ${selectedSlot === slot.value ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30' : 'bg-slate-50 text-slate-400 shadow-inner'}`}>
                                                    <Clock size={24} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className={`text-xl md:text-2xl font-black uppercase tracking-tighter italic ${selectedSlot === slot.value ? 'text-primary' : 'text-slate-950 group-hover/slot:text-primary transition-colors'}`}>{slot.label.split(' ')[0]}</p>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{slot.label.split(' ').slice(1).join(' ') || 'FRANJA DIURNA'}</p>
                                                </div>
                                            </div>
                                            {selectedSlot === slot.value && (
                                                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white animate-in zoom-in-75 duration-500 shadow-lg relative z-10">
                                                    <Check size={20} className="stroke-[4]" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Orden Final (Protocol Step) */}
                    {currentStep === 2 && (
                        <div className="space-y-12 animate-in zoom-in-95 duration-700">
                            <div className="bg-slate-950 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden group/final border border-white/5">
                                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none group-hover:scale-125 transition-transform duration-1000"></div>
                                <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-primary/5 blur-[80px] rounded-full"></div>
                                
                                <h3 className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-12 italic flex items-center gap-4 relative z-10">
                                     <div className="w-10 h-[1.5px] bg-primary"></div> ESPECIFICACIONES DE MISIÓN FINAL
                                </h3>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                                    <div className="space-y-12">
                                        <div className="flex items-start gap-6 group/item transition-all hover:translate-x-2 duration-500">
                                            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-primary border border-white/10 shadow-lg group-hover/final:scale-110 group-hover/item:bg-primary group-hover/item:text-white transition-all duration-700">
                                                <MapPin size={28} />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.3em] italic mb-1">TARGET_COORD</p>
                                                <p className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter leading-none transition-colors group-hover/item:text-primary">{address.line1}</p>
                                                <p className="text-primary font-black uppercase text-[10px] tracking-[0.3em] italic flex items-center gap-2 mt-2">
                                                   ZONE: <span className="text-white opacity-60">{address.city.toUpperCase()} [{address.zip}]</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-6 group/item transition-all hover:translate-x-2 duration-500">
                                            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-primary border border-white/10 shadow-lg group-hover/final:scale-110 group-hover/item:bg-primary group-hover/item:text-white transition-all duration-700">
                                                <Calendar size={28} />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.3em] italic mb-1">SCHED_TIMEWINDOW</p>
                                                <p className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter leading-[0.85] text-white transition-colors group-hover/item:text-primary">
                                                    {new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'short' }).toUpperCase()}
                                                </p>
                                                <p className="text-primary font-black uppercase text-[10px] tracking-[0.3em] italic flex items-center gap-2 mt-2">
                                                    <Clock size={14} /> <span className="text-white opacity-60">{TIME_SLOTS.find(s => s.value === selectedSlot)?.label.toUpperCase()}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 backdrop-blur-3xl rounded-[2rem] p-8 md:p-10 border border-white/10 shadow-2xl space-y-8">
                                        <h4 className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] flex items-center justify-between italic">
                                            BUDGET_SUMMARY <div className="h-[1px] bg-white/10 flex-1 ml-6"></div>
                                        </h4>
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center group/price transition-all">
                                                <span className="text-slate-500 font-black italic tracking-[0.2em] uppercase text-[9px] group-hover/price:text-white transition-colors">TRASH_LOGISTICS_FEE</span>
                                                <span className="text-2xl font-black italic tracking-tighter text-white group-hover/price:text-primary transition-colors">${(travelFee + distanceSurcharge).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center group/price transition-all">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-slate-500 font-black italic tracking-[0.2em] uppercase text-[9px] group-hover/price:text-white transition-colors">TECH_OPS_LABOR</span>
                                                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">{request?.service_catalog?.name || 'MANTENIMIENTO DENVER'}</span>
                                                </div>
                                                <span className="text-2xl font-black italic tracking-tighter text-white group-hover/price:text-primary transition-colors">${serviceLabor.toFixed(2)}</span>
                                            </div>
                                            {isRoutine && (
                                                <div className="flex justify-between items-center group/price transition-all">
                                                    <span className="text-slate-500 font-black italic tracking-[0.2em] uppercase text-[9px] group-hover/price:text-white transition-colors">SUPPLY_MATRIX ({hasSupplies ? 'BYO' : 'HQ'})</span>
                                                    <span className="text-2xl font-black italic tracking-tighter text-white group-hover/price:text-primary transition-colors">${suppliesCost.toFixed(2)}</span>
                                                </div>
                                            )}
                                            <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                                                <div className="flex flex-col gap-2">
                                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic mb-1">TOTAL_MISSION_COST</span>
                                                    <div className="flex gap-1">
                                                        <div className="w-6 h-1 bg-primary rounded-full group-hover/final:w-12 transition-all duration-1000"></div>
                                                        <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-6xl font-black italic tracking-tighter text-white animate-denver-in inline-block">${totalCost.toFixed(2)}</span>
                                                    <p className="text-[9px] font-black italic text-slate-600 mt-1 tracking-[0.2em] uppercase">USD_NET || VAT_INC</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-8 md:p-10 bg-slate-50 rounded-3xl border border-slate-100 flex items-start gap-6 shadow-inner relative overflow-hidden group/clause">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-1000" />
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary shadow-xl shrink-0 border border-slate-50 group-hover:rotate-6 transition-transform duration-500"><Info size={28} /></div>
                                <div className="space-y-3 relative z-10">
                                    <h5 className="font-black italic uppercase text-[10px] tracking-[0.3em] text-slate-950">CLAUSULA_INSERCIÓN_OPERATIVA</h5>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] leading-relaxed italic max-w-xl">
                                        AL CONFIRMAR LA MISIÓN, SE DESPLEGARÁ UNA UNIDAD MÓVIL ALPHA CON UN ESPECIALISTA ASIGNADO. EL TÉCNICO ESTABLECERÁ CONTACTO DE VOZ 30 MINUTOS ANTES DEL ARRIBO COORDINADO PARA VALIDAR PERÍMETRO DE SEGURIDAD Y ACCESO.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="p-8 md:p-12 pt-0 bg-white border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
                    {currentStep > 0 && (
                        <Button 
                            variant="outline" 
                            onClick={handleBack}
                            className="h-14 px-8 w-full md:w-auto border-2 border-slate-200 hover:border-slate-950 hover:bg-slate-950 hover:text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] italic group transition-all duration-700 shadow-md"
                        >
                            <ArrowLeft size={18} className="mr-4 group-hover:-translate-x-2 transition-transform" /> ATRÁS_MATRIX
                        </Button>
                    )}
                    <Button 
                        disabled={submitting || (currentStep === 0 && (!address.line1 || !address.zip)) || (currentStep === 1 && (!selectedDate || !selectedSlot))}
                        onClick={currentStep === 2 ? handleConfirm : handleNext}
                        className={`h-16 px-10 w-full md:w-auto rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] italic group transition-all duration-700 shadow-xl ml-auto ${currentStep === 2 ? 'bg-primary hover:bg-slate-950 text-white shadow-primary/30 scale-105' : 'bg-slate-950 hover:bg-primary text-white shadow-slate-950/30'}`}
                    >
                        {submitting ? (
                            <span className="flex items-center gap-3">SYNC_DATABASE... <Activity size={20} className="animate-spin" /></span>
                        ) : currentStep === 2 ? (
                            <span className="flex items-center gap-4">CONFIRMAR_DESPLIEGUE <ShieldCheck size={22} className="group-hover:rotate-12 transition-transform" /></span>
                        ) : (
                            <span className="flex items-center gap-4">SIGUIENTE_STAGE <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform" /></span>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
