import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { Mail, ArrowLeft, User, Wrench, Camera, Car, ShieldCheck, ChevronRight, CheckCircle2, Lock, Eye, EyeOff, MapPin, Calendar, Briefcase, FileText } from 'lucide-react';

export function RegisterPage() {
    const { toast } = useToast();
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [registered, setRegistered] = useState(false);
    
    const photoInputRef = useRef<HTMLInputElement>(null);
    const vehiclePhotoInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState(1);
    const [role, setRole] = useState<'CUSTOMER' | 'TECH'>('CUSTOMER');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('Denver');
    const [state, setState] = useState('CO');
    const [zipCode, setZipCode] = useState('');
    const [dob, setDob] = useState('');
    const [experience, setExperience] = useState('');
    const [workAuthorized, setWorkAuthorized] = useState(false);
    const [dataConsent, setDataConsent] = useState(false);
    
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    
    const [techVehiclePlate, setTechVehiclePlate] = useState('');
    const [techVehicleMake, setTechVehicleMake] = useState('');
    const [techVehicleModel, setTechVehicleModel] = useState('');
    const [techVehicleColor, setTechVehicleColor] = useState('');
    const [vehiclePhotoFile, setVehiclePhotoFile] = useState<File | null>(null);
    const [vehiclePhotoPreview, setVehiclePhotoPreview] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const r = params.get('role');
        if (r === 'TECH' || r === 'CUSTOMER') setRole(r);
    }, [location]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast({ title: 'Archivo muy grande', description: 'La foto no debe superar 5 MB.', type: 'error' });
            return;
        }
        setPhotoFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleVehiclePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast({ title: 'Archivo muy grande', description: 'La foto del vehículo no debe superar 5 MB.', type: 'error' });
            return;
        }
        setVehiclePhotoFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setVehiclePhotoPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const nextStep = () => {
        if (step === 1) {
            if (!email || !password) {
                toast({ title: 'Datos faltantes', description: 'Ingresa tu correo y contraseña.', type: 'error' });
                return;
            }
            if (password.length < 6) {
                toast({ title: 'Contraseña débil', description: 'Debe tener al menos 6 caracteres.', type: 'error' });
                return;
            }
        }
        if (step === 2) {
            if (!firstName || !lastName || !phone || !address || !city || !state || !zipCode) {
                toast({ title: 'Datos faltantes', description: 'Por favor completa todos los campos de ubicación y contacto.', type: 'error' });
                return;
            }
        }
        setStep(prev => prev + 1);
        window.scrollTo(0, 0);
    };

    const prevStep = () => {
        setStep(prev => prev - 1);
        window.scrollTo(0, 0);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!dataConsent) {
            toast({ title: 'Atención', description: 'Debes aceptar el aviso de privacidad.', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            const { data: adminData, error: adminErr } = await supabaseAdmin.auth.admin.createUser({
                email: email.toLowerCase(),
                password,
                email_confirm: true,
                user_metadata: { role, first_name: firstName, last_name: lastName }
            });

            if (adminErr) throw adminErr;
            const userId = adminData.user.id;

            let avatarUrl: string | null = null;
            if (role === 'TECH' && photoFile) {
                const ext = photoFile.name.split('.').pop();
                const path = `avatars/${userId}.${ext}`;
                const { error: upErr } = await supabaseAdmin.storage.from('avatars').upload(path, photoFile, { upsert: true });
                if (!upErr) {
                    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
                    avatarUrl = urlData.publicUrl;
                }
            }

            let vehiclePhotoUrl: string | null = null;
            if (role === 'TECH' && vehiclePhotoFile) {
                const ext = vehiclePhotoFile.name.split('.').pop();
                const path = `vehicles/${userId}.${ext}`;
                const { error: upErr } = await supabaseAdmin.storage.from('avatars').upload(path, vehiclePhotoFile, { upsert: true });
                if (!upErr) {
                    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
                    vehiclePhotoUrl = urlData.publicUrl;
                }
            }

            const payload: any = { 
                user_id: userId, 
                role, 
                first_name: firstName, 
                last_name: lastName, 
                preferred_channel: 'EMAIL', 
                data_treatment_consent: dataConsent, 
                data_treatment_consent_date: new Date().toISOString(),
                status: role === 'TECH' ? 'PENDING_APPROVAL' : 'ACTIVE',
                phone: phone.trim() || null,
                address_line1: address.trim() || null,
                city: city.trim() || null,
                state: state.trim() || null,
                zip: zipCode?.trim() || null,
                birth_date: dob || null,
                experience_summary: experience.trim() || null,
                work_authorized: workAuthorized
            };
            if (avatarUrl) payload.avatar_url = avatarUrl;
            
            if (role === 'TECH') { 
                payload.tech_vehicle_plate = techVehiclePlate.trim().toUpperCase(); 
                payload.tech_vehicle_make = techVehicleMake.trim();
                payload.tech_vehicle_model = techVehicleModel.trim(); 
                payload.tech_vehicle_color = techVehicleColor.trim();
                if (vehiclePhotoUrl) payload.tech_vehicle_photo_url = vehiclePhotoUrl;

                const { data: adminProfiles } = await supabaseAdmin.from('profiles').select('user_id').eq('role', 'ADMIN').limit(1);
                let adminEmail = 'admin@denverautocare.com'; 
                if (adminProfiles && adminProfiles.length > 0) {
                    const { data: adminUser } = await supabaseAdmin.auth.admin.getUserById(adminProfiles[0].user_id);
                    if (adminUser?.user?.email) adminEmail = adminUser.user.email;
                }

                await supabaseAdmin.from('notifications_outbox').insert({
                    recipient: adminEmail,
                    channel: 'EMAIL',
                    template_code: 'ADMIN_TECH_REQUEST',
                    subject: 'NUEVO TÉCNICO REGISTRADO',
                    body: `El técnico ${firstName} ${lastName} se ha registrado.`,
                    payload: { tech_id: userId, name: `${firstName} ${lastName}` }
                });
            }

            const { error: pErr } = await supabaseAdmin.from('profiles').upsert(payload, { onConflict: 'user_id' });
            if (pErr) throw pErr;

            setRegistered(true);
        } catch (err: any) {
            toast({ title: 'Error', description: err.message || 'No se pudo completar el registro', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (registered) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-inter">
                <Card className="max-w-md w-full rounded-[2.5rem] shadow-2xl border border-white/10 bg-white/5 backdrop-blur-3xl p-10 text-center space-y-6">
                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 size={40} className="text-primary" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">¡REGISTRO EXITOSO!</h2>
                        <p className="text-slate-400 text-sm font-medium">
                            {role === 'TECH' 
                                ? 'Tu perfil ha sido enviado para aprobación. Te notificaremos una vez seas activado.' 
                                : 'Tu cuenta ha sido creada. Ya puedes iniciar sesión y agendar servicios.'}
                        </p>
                    </div>
                    <Link to="/auth/login" className="block w-full">
                        <Button className="w-full h-14 rounded-2xl bg-primary text-slate-950 font-bold uppercase tracking-widest hover:bg-white transition-all">
                            INICIAR SESIÓN
                        </Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 py-12 md:py-20 relative overflow-hidden font-sans">
            {/* Professional Background Elements */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full"></div>
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-500/5 blur-[150px] rounded-full"></div>
            </div>

            <div className="w-full max-w-xl relative z-10 space-y-8">
                <div className="text-center space-y-6">
                    <Link to="/" className="inline-flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-slate-950 shadow-2xl shadow-primary/20">
                            <Wrench size={24} fill="currentColor" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-white italic">Denver <span className="text-primary not-italic">Auto Care</span></span>
                    </Link>
                    
                    <div className="space-y-4">
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-none">
                            {role === 'TECH' ? 'Únete al equipo' : 'Crear mi cuenta'}
                        </h1>
                        <div className="flex items-center justify-center gap-4 py-2">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className={`h-2 rounded-full transition-all duration-500 ${step >= s ? 'w-16 bg-primary shadow-lg shadow-primary/20' : 'w-6 bg-white/10'}`} />
                            ))}
                        </div>
                    </div>
                </div>

                <Card className="bg-white/5 border-white/10 backdrop-blur-3xl rounded-[2rem] shadow-2xl overflow-hidden">
                    <CardContent className="p-8 md:p-10">
                        <div className="space-y-10">
                            {step === 1 && (
                                <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
                                    <h3 className="text-sm font-bold text-primary tracking-widest uppercase italic">Paso 01 — Credenciales</h3>
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-slate-400 tracking-wide ml-2">Correo Electrónico</label>
                                            <div className="relative">
                                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500">
                                                    <Mail size={20} />
                                                </div>
                                                <Input type="email" placeholder="ejemplo@correo.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 pl-14 bg-white/5 border-white/10 text-white rounded-2xl" />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-slate-400 tracking-wide ml-2">Contraseña</label>
                                            <div className="relative">
                                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500">
                                                    <Lock size={20} />
                                                </div>
                                                <Input type={showPassword ? "text" : "password"} placeholder="Tu contraseña secreta" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 pl-14 pr-14 bg-white/5 border-white/10 text-white rounded-2xl" />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary transition-colors">
                                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
                                    <h3 className="text-sm font-bold text-primary tracking-widest uppercase italic">Paso 02 — Información Personal</h3>
                                    <div className="space-y-8">
                                        {role === 'TECH' && (
                                            <div className="flex flex-col items-center gap-6 bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
                                                <button type="button" onClick={() => photoInputRef.current?.click()} className="relative group w-28 h-28 rounded-full overflow-hidden border-2 border-dashed border-white/20 bg-slate-900 flex items-center justify-center hover:border-primary transition-all">
                                                    {photoPreview ? <img src={photoPreview} alt="Perfil" className="w-full h-full object-cover" /> : <Camera size={32} className="text-slate-500" />}
                                                    <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                                        <Camera size={24} className="text-white" />
                                                    </div>
                                                </button>
                                                <span className="text-xs font-bold text-slate-400">Subir foto de perfil</span>
                                                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input label="Nombre" placeholder="Tu nombre" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-11 rounded-xl bg-white/5 border-white/10" />
                                            <Input label="Apellido" placeholder="Tu apellido" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-11 rounded-xl bg-white/5 border-white/10" />
                                        </div>
                                        <Input label="Teléfono de Contacto" type="tel" placeholder="(303) 000-0000" required value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 rounded-xl bg-white/5 border-white/10" />
                                        <div className="space-y-4">
                                            <Input label="Dirección de Residencial" placeholder="Ej: 123 Street Ave" required value={address} onChange={(e) => setAddress(e.target.value)} className="h-11 rounded-xl bg-white/5 border-white/10" />
                                            <div className="grid grid-cols-3 gap-3">
                                                <Input label="Ciudad" placeholder="Denver" required value={city} onChange={(e) => setCity(e.target.value)} className="h-11 rounded-xl" />
                                                <Input label="Estado" placeholder="CO" required value={state} onChange={(e) => setState(e.target.value)} className="h-11 rounded-xl" />
                                                <Input label="ZIP" placeholder="80202" required value={zipCode} onChange={(e) => setZipCode(e.target.value)} className="h-11 rounded-xl" />
                                            </div>
                                        </div>
                                        <Input label="Fecha de Nacimiento" type="date" required value={dob} onChange={(e) => setDob(e.target.value)} className="h-11 rounded-xl [color-scheme:dark]" />
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-10 animate-in slide-in-from-right-10 duration-500">
                                    <h3 className="text-sm font-bold text-primary tracking-widest uppercase italic">Paso 03 — Detalles Operativos</h3>
                                    
                                    {role === 'TECH' && (
                                        <div className="space-y-8">
                                            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                                        <Car size={22} />
                                                    </div>
                                                    <h4 className="text-sm font-bold text-white tracking-wide">Información del Vehículo</h4>
                                                </div>
                                                <div className="flex justify-center">
                                                    <button type="button" onClick={() => vehiclePhotoInputRef.current?.click()} className="relative w-full h-40 rounded-[2rem] overflow-hidden border-2 border-dashed border-white/10 bg-slate-900 group hover:border-primary transition-all">
                                                        {vehiclePhotoPreview ? <img src={vehiclePhotoPreview} alt="Auto" className="w-full h-full object-cover" /> : <div className="flex flex-col items-center gap-2 text-slate-500"><Camera size={32} /><span className="text-xs font-bold">Foto del Vehículo</span></div>}
                                                    </button>
                                                    <input ref={vehiclePhotoInputRef} type="file" accept="image/*" className="hidden" onChange={handleVehiclePhotoChange} />
                                                </div>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <Input label="Placa" placeholder="ABC-123" required value={techVehiclePlate} onChange={(e) => setTechVehiclePlate(e.target.value.toUpperCase())} className="h-14 rounded-xl" />
                                                    <Input label="Color" placeholder="Ej: Plateado" required value={techVehicleColor} onChange={(e) => setTechVehicleColor(e.target.value)} className="h-14 rounded-xl" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <Input label="Marca" placeholder="Ej: Toyota" required value={techVehicleMake} onChange={(e) => setTechVehicleMake(e.target.value)} className="h-14 rounded-xl" />
                                                    <Input label="Modelo" placeholder="Ej: Tacoma" required value={techVehicleModel} onChange={(e) => setTechVehicleModel(e.target.value)} className="h-14 rounded-xl" />
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-3">
                                                    <label className="text-xs font-bold text-slate-400 ml-2">Especialidades Técnicas</label>
                                                    <textarea value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="Ej: Especialista en sistemas de frenado ..." className="w-full p-6 rounded-[2rem] bg-white/5 border border-white/10 text-white font-medium text-base focus:border-primary outline-none min-h-[120px] transition-all" />
                                                </div>
                                                <label className="flex items-center gap-6 p-6 bg-white/5 rounded-[2rem] border border-white/10 cursor-pointer group hover:bg-white/10 transition-all">
                                                    <div className="relative flex items-center">
                                                        <input type="checkbox" checked={workAuthorized} onChange={(e) => setWorkAuthorized(e.target.checked)} className="peer h-7 w-7 rounded-xl border-2 border-white/20 bg-white/5 text-primary focus:ring-0 cursor-pointer transition-all checked:border-primary" />
                                                        <ShieldCheck className="absolute h-5 w-5 left-1 text-slate-950 opacity-0 peer-checked:opacity-100 transition-opacity" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white tracking-wide">Autorización de Trabajo</p>
                                                        <p className="text-xs text-slate-500 font-medium italic">Confirmo estatus legal en EE. UU.</p>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-8 bg-primary/5 rounded-[2.5rem] border border-primary/20 space-y-6">
                                        <label className="flex items-start gap-6 cursor-pointer group">
                                            <div className="relative flex items-center pt-1">
                                                <input type="checkbox" checked={dataConsent} onChange={(e) => setDataConsent(e.target.checked)} className="peer h-7 w-7 rounded-xl border-2 border-white/20 bg-white/5 text-primary focus:ring-0 cursor-pointer transition-all checked:border-primary" />
                                                <ShieldCheck className="absolute h-5 w-5 left-1 text-slate-950 opacity-0 peer-checked:opacity-100 transition-opacity" />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-sm font-bold text-white tracking-wide">Aviso de Privacidad</p>
                                                <p className="text-sm text-slate-400 font-medium leading-relaxed group-hover:text-white transition-colors">Acepto el tratamiento de mis datos personales según los términos de servicio.</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-6 pt-8">
                                {step > 1 && (
                                    <Button variant="outline" className="flex-1 h-16 rounded-[1.5rem] border-white/10 text-white hover:bg-white/5 font-bold tracking-widest text-xs" onClick={prevStep}>
                                        <ArrowLeft size={18} className="mr-3" /> ATRÁS
                                    </Button>
                                )}
                                
                                <Button 
                                    className="flex-[2] h-16 rounded-[1.5rem] bg-primary text-slate-950 hover:bg-white font-black uppercase text-sm tracking-[0.2em] transition-all shadow-2xl shadow-primary/10 group"
                                    onClick={((role === 'TECH' && step < 3) || (role === 'CUSTOMER' && step < 2)) ? nextStep : handleRegister}
                                    loading={loading}
                                >
                                    {((role === 'TECH' && step < 3) || (role === 'CUSTOMER' && step < 2)) ? (
                                        <>Continuar <ChevronRight size={20} className="ml-2 group-hover:translate-x-2 transition-transform" /></>
                                    ) : (
                                        loading ? 'Registrando...' : 'Finalizar Registro'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="text-center space-y-8">
                    <p className="text-sm font-medium text-slate-500">
                        ¿Ya tienes una cuenta? <Link to="/auth/login" className="text-primary hover:text-white font-bold underline underline-offset-8 ml-2 transition-colors">Ingresar ahora</Link>
                    </p>
                    <Link to="/" className="inline-flex items-center gap-3 text-sm font-bold text-slate-600 hover:text-white transition-all group/back">
                        <ArrowLeft size={18} className="group-hover/back:-translate-x-2 transition-transform" /> Regresar al inicio
                    </Link>
                </div>
            </div>

            <div className="absolute bottom-10 text-center w-full">
                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-[0.6em]">Denver Mobile Auto Care — © 2026</p>
            </div>
        </div>
    );
}
