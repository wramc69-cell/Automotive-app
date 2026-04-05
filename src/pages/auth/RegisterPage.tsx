import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { Mail, ArrowLeft, User, Wrench, Camera, Car, Upload, X, ChevronRight, CheckCircle2, ShieldCheck, Key, Palette, Clock, MapPin, Eye, EyeOff } from 'lucide-react';

export function RegisterPage() {
    const { toast } = useToast();
    const location = useLocation();
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
    };

    const prevStep = () => setStep(prev => prev - 1);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!dataConsent) {
            toast({ title: 'Atención', description: 'Debes aceptar el aviso de privacidad.', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            const { data: adminData, error: adminErr } = await supabaseAdmin.auth.admin.createUser({
                email,
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
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
                <Card className="max-w-md w-full rounded-[3rem] shadow-2xl border-none p-10 text-center space-y-6 animate-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-200">
                        <CheckCircle2 size={40} className="text-white" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900 uppercase">¡Registro Exitoso!</h2>
                        <p className="text-slate-500 font-medium">
                            {role === 'TECH' 
                                ? 'Tu perfil ha sido enviado para aprobación. Te notificaremos por correo una vez seas activado.' 
                                : 'Tu cuenta ha sido creada. Ya puedes iniciar sesión y agendar servicios.'}
                        </p>
                    </div>
                    <Link to="/auth/login" className="block w-full">
                        <Button className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200">INICIAR SESIÓN</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 py-12 md:py-20">
            <div className="max-w-xl w-full space-y-8 animate-in fade-in duration-700">
                
                <Card className="rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.12)] border-none overflow-hidden bg-white/80 backdrop-blur-xl">
                    <CardHeader className="pt-12 px-10 pb-4 text-center space-y-1">
                        <div className="flex justify-center mb-6">
                            <div className={`p-4 rounded-3xl shadow-lg ${role === 'TECH' ? 'bg-slate-900 text-white shadow-slate-200' : 'bg-blue-600 text-white shadow-blue-200'}`}>
                                {role === 'TECH' ? <Wrench size={32} /> : <User size={32} />}
                            </div>
                        </div>
                        <CardTitle className="text-4xl font-black text-slate-900 uppercase tracking-tight leading-none mb-2">
                            {role === 'TECH' ? 'Únete al Equipo' : 'Nuevo Cliente'}
                        </CardTitle>
                        <CardDescription className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">
                            {step === 1 ? 'Datos de Acceso' : step === 2 ? 'Información Personal' : 'Detalles Finales'}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="px-10 py-6">
                        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                            
                            {step === 1 && (
                                <div className="space-y-4 animate-in slide-in-from-right-10 duration-500">
                                    <Input label="Correo electrónico" type="email" placeholder="nombre@correo.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 rounded-2xl text-lg font-medium border-slate-100 bg-slate-50/50" />
                                    <div className="relative">
                                        <Input 
                                            label="Contraseña" 
                                            type={showPassword ? "text" : "password"} 
                                            placeholder="••••••••" 
                                            required 
                                            value={password} 
                                            onChange={(e) => setPassword(e.target.value)} 
                                            hint="Mínimo 6 caracteres" 
                                            className="h-14 rounded-2xl text-lg border-slate-100 bg-slate-50/50 pr-12" 
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-[42px] text-slate-400 hover:text-blue-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-6 animate-in slide-in-from-right-10 duration-500">
                                    {role === 'TECH' && (
                                        <div className="flex flex-col items-center gap-4">
                                            <button type="button" onClick={() => photoInputRef.current?.click()} className="relative group w-28 h-28 rounded-[2rem] overflow-hidden border-4 border-dashed border-slate-200 bg-slate-50 hover:border-blue-500 transition-all duration-500 transform hover:scale-105 shadow-inner">
                                                {photoPreview ? <img src={photoPreview} alt="Foto" className="w-full h-full object-cover" /> : <div className="flex flex-col items-center gap-1 text-slate-300"><Camera size={32} /><span className="text-[10px] font-black uppercase tracking-widest">Foto Perfil</span></div>}
                                                <div className="absolute inset-0 bg-blue-600/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Camera size={24} className="text-white" /></div>
                                            </button>
                                            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Nombre" placeholder="Tu nombre" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-14 rounded-2xl font-medium" />
                                        <Input label="Apellido" placeholder="Tu apellido" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-14 rounded-2xl font-medium" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Teléfono" type="tel" placeholder="(555) 123-4567" required value={phone} onChange={(e) => setPhone(e.target.value)} className="h-14 rounded-2xl font-medium block w-full" />
                                        <Input label="Dirección Completa" placeholder="123 Calle Principal" required value={address} onChange={(e) => setAddress(e.target.value)} className="h-14 rounded-2xl font-medium block w-full" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Ciudad" placeholder="Denver" required value={city} onChange={(e) => setCity(e.target.value)} className="h-14 rounded-2xl font-medium" />
                                        <Input label="Estado" placeholder="CO" required value={state} onChange={(e) => setState(e.target.value)} className="h-14 rounded-2xl font-medium block w-full" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Zona Postal" placeholder="Ej: 80202" required value={zipCode} onChange={(e) => setZipCode(e.target.value)} className="h-14 rounded-2xl font-medium" />
                                        <Input label="Fecha de Nacimiento" type="date" required value={dob} onChange={(e) => setDob(e.target.value)} className="h-14 rounded-2xl font-medium block w-full" />
                                    </div>
                                    
                                    {role === 'TECH' && (
                                        <div className="p-5 bg-slate-900/5 rounded-2xl border-2 border-dashed border-slate-100 space-y-4">
                                            <div className="flex flex-col gap-2">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Estatus Legal</p>
                                                <label className="flex items-center gap-4 cursor-pointer group">
                                                    <div className="relative flex items-center">
                                                        <input type="checkbox" checked={workAuthorized} onChange={(e) => setWorkAuthorized(e.target.checked)} className="peer h-6 w-6 rounded-lg border-2 border-slate-200 text-blue-600 focus:ring-0 cursor-pointer transition-all checked:border-blue-600" />
                                                        <ShieldCheck className="absolute h-4 w-4 left-1 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[11px] font-black text-slate-900">AUTORIZACIÓN DE TRABAJO</p>
                                                        <p className="text-[10px] text-slate-500 font-medium leading-tight">Confirmo que estoy legalmente autorizado para trabajar en EE. UU.</p>
                                                    </div>
                                                </label>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Especialización y Experiencia</label>
                                                <textarea value={experience} onChange={(e) => setExperience(e.target.value.slice(0, 200))} placeholder="Breve resumen de tus habilidades o experiencia..." className="w-full p-4 rounded-2xl bg-white border border-slate-100 font-medium text-sm focus:border-blue-500 outline-none resize-none h-24" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-3">
                                        <label className="flex items-start gap-4 cursor-pointer group">
                                            <div className="relative flex items-center pt-1">
                                                <input type="checkbox" checked={dataConsent} onChange={(e) => setDataConsent(e.target.checked)} className="peer h-6 w-6 rounded-lg border-2 border-slate-200 text-blue-600 focus:ring-0 cursor-pointer transition-all checked:border-blue-600" />
                                                <ShieldCheck className="absolute h-4 w-4 left-1 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-none">Aviso de Privacidad</p>
                                                <p className="text-[10px] text-slate-500 font-medium leading-relaxed group-hover:text-slate-700 transition-colors">Acepto el tratamiento de mis datos personales.</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {step === 3 && role === 'TECH' && (
                                <div className="space-y-6 animate-in slide-in-from-right-10 duration-500">
                                    <div className="p-7 bg-slate-900 rounded-[2.5rem] relative overflow-hidden group shadow-2xl text-white">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[40px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-blue-600/20" />
                                        <div className="relative z-10 space-y-5">
                                            <div className="flex justify-center mb-2">
                                                <button type="button" onClick={() => vehiclePhotoInputRef.current?.click()} className="relative w-full h-32 rounded-2xl overflow-hidden border-2 border-dashed border-white/20 bg-white/5 hover:border-blue-500">
                                                    {vehiclePhotoPreview ? <img src={vehiclePhotoPreview} alt="Vehículo" className="w-full h-full object-cover" /> : <div className="flex flex-col items-center gap-1 text-white/30"><Camera size={24} /><span className="text-[9px] font-black uppercase">Foto del Vehículo</span></div>}
                                                </button>
                                                <input ref={vehiclePhotoInputRef} type="file" accept="image/*" className="hidden" onChange={handleVehiclePhotoChange} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-blue-400 uppercase ml-1">Placa</label>
                                                    <input placeholder="ABC-123" required value={techVehiclePlate} onChange={(e) => setTechVehiclePlate(e.target.value.toUpperCase())} className="w-full h-12 rounded-xl bg-white/10 text-white text-center font-black outline-none" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-blue-400 uppercase ml-1">Color</label>
                                                    <input placeholder="Ej: Blanco" required value={techVehicleColor} onChange={(e) => setTechVehicleColor(e.target.value)} className="w-full h-12 px-4 rounded-xl bg-white/10 text-white font-bold outline-none" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-blue-400 uppercase ml-1">Marca</label>
                                                    <input placeholder="Ej: Honda" required value={techVehicleMake} onChange={(e) => setTechVehicleMake(e.target.value)} className="w-full h-12 px-4 rounded-xl bg-white/10 text-white font-bold outline-none" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-blue-400 uppercase ml-1">Modelo</label>
                                                    <input placeholder="Ej: Civic" required value={techVehicleModel} onChange={(e) => setTechVehicleModel(e.target.value)} className="w-full h-12 px-4 rounded-xl bg-white/10 text-white font-bold outline-none" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </form>
                    </CardContent>

                    <CardFooter className="px-10 pb-12 pt-6 flex flex-col gap-6">
                        <div className="flex gap-3 w-full">
                            {step > 1 && (
                                <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black text-xs uppercase border-slate-200" onClick={prevStep}>
                                    <ArrowLeft size={16} className="mr-2" /> Atrás
                                </Button>
                            )}
                            
                            {((role === 'TECH' && step < 3) || (role === 'CUSTOMER' && step < 2)) ? (
                                <Button className={`flex-[2] h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl ${role === 'TECH' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-blue-600 text-white hover:bg-blue-500'}`} onClick={nextStep}>
                                    Siguiente <ChevronRight size={16} />
                                </Button>
                            ) : (
                                <Button loading={loading} className={`flex-[2] h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl ${role === 'TECH' ? 'bg-slate-900 text-white' : 'bg-blue-600 text-white'}`} onClick={handleRegister}>
                                    {loading ? 'Procesando...' : 'Finalizar Registro'}
                                </Button>
                            )}
                        </div>

                        <div className="text-center space-y-3">
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                                ¿Ya tienes cuenta? <Link to="/auth/login" className="text-blue-600 font-black ml-1">Ingresa aquí</Link>
                            </p>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
