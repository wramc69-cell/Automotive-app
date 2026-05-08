import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Camera, Car, Save, User, Mail, Phone, CheckCircle2, X, Palette, Trash2, MapPin } from 'lucide-react';

export function TechProfilePage() {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const photoInputRef = useRef<HTMLInputElement>(null);
    const vehiclePhotoInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    // Editable state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    
    // Address Info (New)
    const [addressLine1, setAddressLine1] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('CO');
    const [zip, setZip] = useState('');
    
    // Vehicle Info
    const [techVehiclePlate, setTechVehiclePlate] = useState('');
    const [techVehicleMake, setTechVehicleMake] = useState('');
    const [techVehicleModel, setTechVehicleModel] = useState('');
    const [techVehicleColor, setTechVehicleColor] = useState('');
    
    // Photos
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const [vehiclePhotoUrl, setVehiclePhotoUrl] = useState<string | null>(null);
    const [vehiclePhotoFile, setVehiclePhotoFile] = useState<File | null>(null);
    const [vehiclePhotoPreview, setVehiclePhotoPreview] = useState<string | null>(null);

    useEffect(() => {
        if (profile) {
            setFirstName(profile.first_name || '');
            setLastName(profile.last_name || '');
            setPhone((profile as any).phone || '');
            setAddressLine1((profile as any).address_line1 || '');
            setCity((profile as any).city || 'Denver');
            setState((profile as any).state || 'CO');
            setZip((profile as any).zip || '');
            setTechVehiclePlate((profile as any).tech_vehicle_plate || '');
            setTechVehicleMake((profile as any).tech_vehicle_make || '');
            setTechVehicleModel((profile as any).tech_vehicle_model || '');
            setTechVehicleColor((profile as any).tech_vehicle_color || '');
            setAvatarUrl((profile as any).avatar_url || null);
            setVehiclePhotoUrl((profile as any).tech_vehicle_photo_url || null);
        }
    }, [profile]);

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

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        setSaved(false);

        try {
            let newAvatarUrl = avatarUrl;
            let newVehicleUrl = vehiclePhotoUrl;

            // 1. Upload Profile Photo
            if (photoFile) {
                const ext = photoFile.name.split('.').pop();
                const path = `avatars/${user.id}.${ext}`;
                const { error: uploadError } = await supabase.storage.from('avatars').upload(path, photoFile, { upsert: true });
                if (!uploadError) {
                    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
                    newAvatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
                    setAvatarUrl(newAvatarUrl);
                    setPhotoFile(null);
                    setPhotoPreview(null);
                }
            }

            // 2. Upload Vehicle Photo (Correct storage path)
            if (vehiclePhotoFile) {
                const ext = vehiclePhotoFile.name.split('.').pop();
                const path = `vehicles/${user.id}.${ext}`;
                const { error: uploadError } = await supabase.storage.from('avatars').upload(path, vehiclePhotoFile, { upsert: true });
                if (!uploadError) {
                    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
                    newVehicleUrl = `${urlData.publicUrl}?t=${Date.now()}`;
                    setVehiclePhotoUrl(newVehicleUrl);
                    setVehiclePhotoFile(null);
                    setVehiclePhotoPreview(null);
                }
            }

            // 3. Update Profile Data
            const { error: updateError } = await supabase.from('profiles').update({
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                phone: phone.trim() || null,
                address_line1: addressLine1.trim() || null,
                city: city.trim() || 'Denver',
                state: state.trim() || 'CO',
                zip: zip.trim() || null,
                tech_vehicle_plate: techVehiclePlate.trim().toUpperCase() || null,
                tech_vehicle_make: techVehicleMake.trim() || null,
                tech_vehicle_model: techVehicleModel.trim() || null,
                tech_vehicle_color: techVehicleColor.trim() || null,
                avatar_url: newAvatarUrl,
                tech_vehicle_photo_url: newVehicleUrl
            }).eq('user_id', user.id);

            if (updateError) throw updateError;

            setSaved(true);
            toast({ title: 'Perfil actualizado', type: 'success' });
            setTimeout(() => setSaved(false), 3000);
        } catch (err: any) {
            console.error('Error saving profile:', err);
            toast({ title: 'Error', description: err.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const currentPhoto = photoPreview || avatarUrl;
    const currentVehiclePhoto = vehiclePhotoPreview || vehiclePhotoUrl;

    return (
        <div className="space-y-12 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-1000 font-inter max-w-6xl mx-auto px-4">

            {/* Cabecera de Identidad Técnica */}
            <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-10 md:p-14 text-white shadow-3xl group">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 blur-[130px] rounded-full translate-x-1/3 -translate-y-1/3 animate-pulse"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                    <div className="relative shrink-0 group/avatar">
                        <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden bg-slate-800 ring-8 ring-white/5 shadow-inner relative md:rotate-6 group-hover/avatar:rotate-0 transition-all duration-700 ease-out flex items-center justify-center">
                            {currentPhoto ? (
                                <img src={currentPhoto} alt="Foto Perfil" className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-700" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-800"><User size={64} /></div>
                            )}
                            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        <button 
                            onClick={() => photoInputRef.current?.click()} 
                            className="absolute -bottom-4 -right-4 w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all border-8 border-slate-900 group-hover/avatar:bg-white group-hover/avatar:text-primary"
                        >
                            <Camera size={22} />
                        </button>
                        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    </div>

                    <div className="text-center md:text-left space-y-6">
                        <div className="space-y-2">
                            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
                                {firstName || 'TERMINAL'} <span className="text-primary block md:inline">{lastName || 'ACTIVA'}</span>
                            </h1>
                            <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px] flex items-center gap-3 justify-center md:justify-start italic group-hover:text-slate-400 transition-colors">
                                <Mail size={14} className="text-primary" /> {user?.email}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3 pt-2 justify-center md:justify-start">
                            <span className="bg-primary/20 text-primary border border-primary/20 text-[9px] font-black px-5 py-2 rounded-full uppercase tracking-[0.3em] shadow-xl shadow-primary/10 italic">CERTIFICADO DENVER PRO</span>
                            {techVehiclePlate && (
                                <span className="bg-white/5 text-slate-300 border border-white/10 text-[9px] font-black px-5 py-2 rounded-full flex items-center gap-3 uppercase tracking-widest italic backdrop-blur-md">
                                    <Car size={14} className="text-primary" /> {techVehiclePlate}
                                </span>
                            )}
                            {zip && (
                                <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-black px-5 py-2 rounded-full flex items-center gap-3 uppercase tracking-widest italic backdrop-blur-md">
                                    <MapPin size={14} /> {city} / {zip}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* Perfil Operacional */}
                <div className="lg:col-span-12 xl:col-span-7 space-y-10">
                    <Card className="rounded-[2rem] border-none shadow-3xl shadow-slate-100/50 bg-white overflow-hidden group">
                        <CardHeader className="p-12 pb-4">
                            <CardTitle className="text-3xl font-black italic tracking-tighter flex items-center gap-5 text-slate-900 uppercase">
                                <div className="w-14 h-14 bg-slate-50 text-primary rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-500"><User size={28} /></div> 
                                DATOS DEL AGENTE
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-12 pt-6 grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 italic">NOMBRE OPERATIVO</label>
                                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="NOMBRE" className="h-16 rounded-2xl text-lg font-black uppercase italic tracking-wider border-slate-100 bg-slate-50/50 focus:bg-white transition-all shadow-inner" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 italic">APELLIDO OPERATIVO</label>
                                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="APELLIDO" className="h-16 rounded-2xl text-lg font-black uppercase italic tracking-wider border-slate-100 bg-slate-50/50 focus:bg-white transition-all shadow-inner" />
                            </div>
                            <div className="md:col-span-2 space-y-12 mt-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 italic">LÍNEA DE CONTACTO DIRECTA</label>
                                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="h-16 rounded-2xl text-lg font-black tracking-[0.1em] border-slate-100 bg-slate-50/50 focus:bg-white transition-all shadow-inner" type="tel" />
                                </div>
                                
                                {/* Base de Operaciones */}
                                <div className="pt-10 border-t border-slate-100 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black uppercase text-slate-900 tracking-[0.3em] flex items-center gap-3 italic">
                                            <MapPin size={18} className="text-primary" /> BASE DE DESPLIEGUE
                                        </h3>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 italic">DIRECCIÓN DE ORIGEN (STREET)</label>
                                        <Input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} placeholder="DIRECCIÓN COMPLETA DE LA BASE" className="h-16 rounded-2xl font-bold border-slate-100 bg-slate-50/50 shadow-inner italic" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 italic">CIUDAD</label>
                                            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="DENVER" className="h-16 rounded-2xl font-black uppercase tracking-wider border-slate-100 bg-slate-50/50 shadow-inner italic" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 italic">ZIP CODE</label>
                                            <Input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="80205" className="h-16 rounded-2xl text-center font-black tracking-[0.4em] border-slate-100 bg-slate-50/50 shadow-inner" />
                                        </div>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-start gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-amber-500 shrink-0 mt-1"><MapPin size={18} /></div>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed italic">
                                            ESTA UBICACIÓN ES FUNDAMENTAL PARA EL CÁLCULO DE RUTAS Y TIEMPOS DE DESPLIEGUE HACIA EL CLIENTE EN GOOGLE MAPS.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Unidad de Servicio */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-10">
                    <Card className="rounded-[2.5rem] border-none shadow-3xl shadow-slate-100/50 bg-white overflow-hidden h-full group">
                        <CardHeader className="p-12 pb-4">
                            <CardTitle className="text-3xl font-black italic tracking-tighter flex items-center gap-5 text-slate-900 uppercase">
                                <div className="w-14 h-14 bg-slate-50 text-primary rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-500"><Car size={28} /></div> 
                                UNIDAD TÉCNICA
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-12 pt-6 space-y-10">
                            
                            {/* Visual de la Unidad */}
                            <div className="relative group/vehicle">
                                <div className="w-full h-56 rounded-[2rem] bg-slate-50 border-4 border-dashed border-slate-200 overflow-hidden flex items-center justify-center relative group-hover/vehicle:border-primary transition-all duration-700 shadow-inner">
                                    {currentVehiclePhoto ? (
                                        <img src={currentVehiclePhoto} alt="Unidad" className="w-full h-full object-cover group-hover/vehicle:scale-110 transition-transform duration-1000" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-4 text-slate-200">
                                            <Car size={64} className="group-hover/vehicle:text-primary transition-colors" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] italic text-slate-400">REGISTRAR UNIDAD</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover/vehicle:opacity-100 backdrop-blur-sm flex items-center justify-center transition-all duration-500">
                                        <Button onClick={() => vehiclePhotoInputRef.current?.click()} className="bg-white text-primary border-none rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] h-14 px-8 shadow-2xl italic hover:scale-110 transition-transform">ACTUALIZAR IMAGEN</Button>
                                    </div>
                                </div>
                                <input ref={vehiclePhotoInputRef} type="file" accept="image/*" className="hidden" onChange={handleVehiclePhotoChange} />
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-2 italic">IDENTIFICACIÓN DE PLACA</label>
                                    <Input value={techVehiclePlate} onChange={(e) => setTechVehiclePlate(e.target.value.toUpperCase())} placeholder="ABC-123" className="h-16 rounded-[1.2rem] text-2xl font-black text-center tracking-[0.5em] bg-slate-900 border-none text-white focus:ring-8 focus:ring-primary/20 shadow-2xl transition-all" />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 italic">MARCA</label>
                                        <Input value={techVehicleMake} onChange={(e) => setTechVehicleMake(e.target.value)} placeholder="EJ: FORD" className="h-16 rounded-2xl font-black uppercase border-slate-100 bg-slate-50 italic shadow-inner" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 italic">TONALIDAD</label>
                                        <div className="relative group/input">
                                            <Palette size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-hover/input:text-primary transition-colors" />
                                            <Input value={techVehicleColor} onChange={(e) => setTechVehicleColor(e.target.value)} placeholder="COLOR" className="h-16 pl-14 rounded-2xl font-black uppercase border-slate-100 bg-slate-50 italic shadow-inner" />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 italic">MODELO Y ESPECIFICACIONES</label>
                                    <Input value={techVehicleModel} onChange={(e) => setTechVehicleModel(e.target.value)} placeholder="EJ: TRANSIT CONNECT 2023" className="h-16 rounded-2xl font-black uppercase border-slate-100 bg-slate-50 italic shadow-inner" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Barra de Sincronización Flotante */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-6">
                <div className="backdrop-blur-2xl bg-slate-900/90 p-4 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 flex items-center justify-between gap-6 ring-1 ring-white/5">
                    <div className="flex-1 pl-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                            <p className="text-[10px] font-black text-white uppercase tracking-[0.3em] italic">CONFIGURACIÓN AGENTE</p>
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-widest italic">ACTUALIZAR DATOS DE TERMINAL</p>
                    </div>
                    <Button 
                        onClick={handleSave} 
                        loading={loading} 
                        className={`h-16 px-10 rounded-2xl font-black text-xs uppercase tracking-[0.3em] italic transition-all duration-500 flex items-center gap-4 shadow-2xl ${saved ? 'bg-emerald-500 hover:bg-emerald-500 scale-105' : 'bg-primary hover:bg-primary/90'} text-white`}
                    >
                        {saved ? <><CheckCircle2 size={24} /> ACTUALIZADO</> : <><Save size={24} /> SINCRONIZAR</>}
                    </Button>
                </div>
            </div>
            
        </div>
    );
}
