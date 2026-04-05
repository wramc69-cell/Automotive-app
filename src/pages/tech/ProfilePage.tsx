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
        <div className="space-y-8 pb-20 animate-in fade-in duration-500 max-w-5xl mx-auto">

            {/* Hero header */}
            <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3" />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="relative shrink-0">
                        <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden bg-slate-800 ring-4 ring-white/10 shadow-2xl relative rotate-3 hover:rotate-0 transition-transform duration-500">
                            {currentPhoto ? (
                                <img src={currentPhoto} alt="Foto" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-500"><User size={54} /></div>
                            )}
                        </div>
                        <button onClick={() => photoInputRef.current?.click()} className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-all border-4 border-slate-900"><Camera size={18} className="text-white" /></button>
                        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    </div>

                    <div className="text-center md:text-left space-y-2">
                        <h1 className="text-4xl font-black italic tracking-tighter leading-none">
                            {firstName || 'Técnico'} <span className="text-blue-500">{lastName || ''}</span>
                        </h1>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2 justify-center md:justify-start"><Mail size={12} /> {user?.email}</p>
                        <div className="flex flex-wrap gap-2 pt-2 justify-center md:justify-start">
                            <span className="bg-blue-600/20 text-blue-400 border border-blue-500/20 text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg shadow-blue-500/10">Taller Denver Pro</span>
                            {techVehiclePlate && <span className="bg-white/5 text-slate-300 border border-white/10 text-[9px] font-black px-4 py-1.5 rounded-full flex items-center gap-2 uppercase tracking-widest"><Car size={12} className="text-blue-500" /> {techVehiclePlate}</span>}
                            {zip && <span className="bg-amber-600/20 text-amber-500 border border-amber-500/20 text-[9px] font-black px-4 py-1.5 rounded-full flex items-center gap-2 uppercase tracking-widest leading-none"><MapPin size={10} /> {city}, ZIP {zip}</span>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* Personal Info */}
                <div className="lg:col-span-12 xl:col-span-7 space-y-8">
                    <Card className="rounded-[3rem] border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden">
                        <CardHeader className="p-10 pb-6">
                            <CardTitle className="text-2xl font-black italic tracking-tighter flex items-center gap-4 text-slate-900 uppercase">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><User size={24} /></div> Datos del Perfil
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-10 pt-4 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Input label="Nombre" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Tu nombre" className="h-14 rounded-2xl text-lg border-slate-100 bg-slate-50/50" />
                            <Input label="Apellido" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Tu apellido" className="h-14 rounded-2xl text-lg border-slate-100 bg-slate-50/50" />
                            <div className="md:col-span-2 space-y-8">
                                <Input label="Teléfono de Contacto" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="h-14 rounded-2xl text-lg border-slate-100 bg-slate-50/50" type="tel" />
                                
                                {/* Address Section */}
                                <div className="pt-6 border-t border-slate-100 space-y-6">
                                    <h3 className="text-sm font-black uppercase text-slate-900 tracking-widest flex items-center gap-2">
                                        <MapPin size={16} className="text-blue-600" /> Ubicación del Centro de Partida
                                    </h3>
                                    <Input label="Calle y Número (Base)" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} placeholder="Ej. 789 North St" className="h-14 rounded-2xl border-slate-100 bg-slate-50/50" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Ciudad" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Denver" className="h-14 rounded-2xl border-slate-100 bg-slate-50/50" />
                                        <Input label="Código Postal (ZIP)" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="80205" className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-black tracking-widest" />
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium italic">
                                        * Esta dirección se utiliza como punto de origen en Google Maps y para el cálculo de millas hacia el cliente.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Vehicle Section */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-8">
                    <Card className="rounded-[3rem] border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden h-full">
                        <CardHeader className="p-10 pb-6">
                            <CardTitle className="text-2xl font-black italic tracking-tighter flex items-center gap-4 text-slate-900 uppercase">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Car size={24} /></div> Mi Vehículo
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-10 pt-4 space-y-8">
                            
                            {/* Vehicle Photo Upload */}
                            <div className="relative group">
                                <div className="w-full h-44 rounded-[2.5rem] bg-slate-50 border-4 border-dashed border-slate-200 overflow-hidden flex items-center justify-center relative group-hover:border-indigo-400 transition-colors">
                                    {currentVehiclePhoto ? (
                                        <img src={currentVehiclePhoto} alt="Vehículo" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-slate-300">
                                            <Car size={48} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Subir Foto Vehículo</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-indigo-600/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <Button onClick={() => vehiclePhotoInputRef.current?.click()} variant="outline" className="bg-white border-none rounded-xl font-black text-[10px] uppercase tracking-widest h-10 px-4">Cambiar Imagen</Button>
                                    </div>
                                </div>
                                <input ref={vehiclePhotoInputRef} type="file" accept="image/*" className="hidden" onChange={handleVehiclePhotoChange} />
                            </div>

                            <div className="space-y-6">
                                <Input label="Placa" value={techVehiclePlate} onChange={(e) => setTechVehiclePlate(e.target.value.toUpperCase())} placeholder="ABC-123" className="h-14 rounded-2xl text-xl font-black text-center tracking-widest bg-slate-900 border-none text-white focus:ring-4 focus:ring-blue-600/20" />
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-tighter text-slate-400 ml-1">Marca</label>
                                        <Input value={techVehicleMake} onChange={(e) => setTechVehicleMake(e.target.value)} placeholder="Ej: Toyota" className="h-12 rounded-xl border-slate-100 bg-slate-50" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-tighter text-slate-400 ml-1">Color</label>
                                        <div className="relative">
                                            <Palette size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                            <Input value={techVehicleColor} onChange={(e) => setTechVehicleColor(e.target.value)} placeholder="Ej: Blanco" className="h-12 pl-10 rounded-xl border-slate-100 bg-slate-50" />
                                        </div>
                                    </div>
                                </div>
                                
                                <Input label="Modelo" value={techVehicleModel} onChange={(e) => setTechVehicleModel(e.target.value)} placeholder="Ej: Hilux 2023" className="h-12 rounded-xl border-slate-100 bg-slate-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Save Action Bar */}
            <div className="sticky bottom-8 left-0 right-0 z-40 px-4">
                <div className="max-w-md mx-auto bg-slate-900/90 backdrop-blur-xl p-4 rounded-[2rem] shadow-2xl border border-white/10 flex items-center justify-between gap-4">
                    <div className="flex-1 px-4">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Configuración de Perfil</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Recuerda guardar al terminar</p>
                    </div>
                    <Button onClick={handleSave} loading={loading} className={`h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-xl ${saved ? 'bg-emerald-600 hover:bg-emerald-600' : 'bg-blue-600 hover:bg-blue-500'} text-white`}>
                        {saved ? <><CheckCircle2 size={20} /> GUARDADO</> : <><Save size={20} /> GUARDAR</>}
                    </Button>
                </div>
            </div>
            
        </div>
    );
}
