import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { User } from 'lucide-react';

export function OnboardingPage() {
    const { session, profile, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // Initial state based on existing profile data if any
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        channel: 'EMAIL',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        techVehiclePlate: '',
        techVehicleModel: '',
        dataConsent: false
    });

    useEffect(() => {
        if (profile) {
            // IF ALREADY COMPLETE (or Staff) -> REDIRECT AWAY
            const isComplete = (profile.role === 'ADMIN' || profile.role === 'TECH' || (profile.first_name && profile.last_name && (profile as any).data_consent === true));
            
            if (isComplete) {
                if (profile.role === 'TECH') navigate('/tech', { replace: true });
                else if (profile.role === 'ADMIN') navigate('/admin', { replace: true });
                else navigate('/app', { replace: true });
                return;
            }

            setForm(prev => ({
                ...prev,
                firstName: profile.first_name || '',
                lastName: profile.last_name || '',
                phone: profile.phone || '',
                channel: profile.preferred_channel || 'EMAIL',
                address: (profile as any).address || '',
                city: (profile as any).city || '',
                state: (profile as any).state || '',
                zipCode: (profile as any).zip_code || '',
                techVehiclePlate: (profile as any).tech_vehicle_plate || '',
                techVehicleModel: (profile as any).tech_vehicle_model || '',
                dataConsent: (profile as any).data_consent || false
            }));
            setAvatarUrl((profile as any).avatar_url || null);
        }
    }, [profile]);

    const isTech = profile?.role === 'TECH' || session?.user?.user_metadata?.role === 'TECH';

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !session?.user) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${session.user.id}/${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            setAvatarUrl(data.publicUrl);
            toast({ title: 'Foto subida', description: 'Tu foto de perfil se ha guardado', type: 'success' });
        } catch (error: any) {
            toast({ title: 'Error al subir foto', description: error.message, type: 'error' });
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!form.dataConsent) {
            toast({ title: 'Acción Requerida', description: 'Debes autorizar el manejo de tus datos personales para continuar', type: 'error' });
            return;
        }

        setLoading(true);

        if (!session?.user) return;

        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (form.phone && !phoneRegex.test(form.phone)) {
            toast({ title: 'Error de Validación', description: 'Formato de teléfono inválido (ej. +17205551234)', type: 'error' });
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.from('profiles').upsert({
                user_id: session.user.id,
                role: profile?.role || 'CUSTOMER',
                first_name: form.firstName,
                last_name: form.lastName,
                phone: form.phone || null,
                preferred_channel: form.channel as any,
                address: form.address || null,
                city: form.city || null,
                state: form.state || null,
                zip_code: form.zipCode || null,
                avatar_url: avatarUrl,
                tech_vehicle_plate: isTech ? form.techVehiclePlate : null,
                tech_vehicle_model: isTech ? form.techVehicleModel : null,
                data_consent: form.dataConsent,
                data_consent_at: new Date().toISOString()
            });

            if (error) throw error;

            toast({ title: '¡Éxito!', description: 'Perfil completado correctamente', type: 'success' });
            await refreshProfile();
            
            // Redirect based on role
            if (profile?.role === 'TECH') navigate('/tech', { replace: true });
            else if (profile?.role === 'ADMIN') navigate('/admin', { replace: true });
            else navigate('/app', { replace: true });
        } catch (error: any) {
            console.error('Error in onboarding:', error);
            toast({ title: 'Error', description: error.message || 'Error al guardar el perfil', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[90vh] flex flex-col items-center justify-center p-4 py-12">
            <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl p-10 border border-slate-50 animate-in">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4 text-primary">
                        <User size={40} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900">Configura tu Perfil</h1>
                    <p className="text-slate-500 mt-2 font-medium">
                        {isTech 
                            ? 'Como técnico, necesitamos tu información profesional para las visitas.' 
                            : 'Personaliza tu cuenta para una mejor experiencia.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Common Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Nombre(s)"
                            required
                            value={form.firstName}
                            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                            placeholder="Ej. Juan"
                            className="h-12 rounded-xl"
                        />
                        <Input
                            label="Apellidos"
                            required
                            value={form.lastName}
                            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                            placeholder="Ej. Pérez"
                            className="h-12 rounded-xl"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Teléfono Móvil"
                            type="tel"
                            required
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            placeholder="+1 720 555 1234"
                            hint="Formato: +1XXXXXXXXXX"
                            className="h-12 rounded-xl"
                        />
                        <Select
                            label="Canal de Contacto"
                            value={form.channel}
                            onChange={(e) => setForm({ ...form, channel: e.target.value })}
                            options={[
                                { value: 'EMAIL', label: 'Email' },
                                { value: 'SMS', label: 'SMS' },
                                { value: 'WHATSAPP', label: 'WhatsApp' }
                            ]}
                            className="h-12 rounded-xl"
                        />
                    </div>

                    {/* Tech-Specific Fields */}
                    {isTech && (
                        <div className="space-y-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <span className="w-2 h-2 bg-primary rounded-full"></span>
                                Información del Técnico
                            </h3>
                            
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Foto de Perfil</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center overflow-hidden">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="text-slate-300" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                            disabled={uploading}
                                            className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                        />
                                        {uploading && <p className="text-[10px] text-primary animate-pulse mt-1">Subiendo...</p>}
                                    </div>
                                </div>
                            </div>

                            <Input
                                label="Dirección de Vivienda / Base"
                                required={isTech}
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                                placeholder="Calle y número"
                                className="h-12 rounded-xl"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Input
                                    label="Ciudad"
                                    required={isTech}
                                    value={form.city}
                                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                                    placeholder="Ej. Denver"
                                    className="h-12 rounded-xl"
                                />
                                <Input
                                    label="Estado"
                                    required={isTech}
                                    value={form.state}
                                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                                    placeholder="Ej. CO"
                                    className="h-12 rounded-xl"
                                />
                                <Input
                                    label="Código Postal"
                                    required={isTech}
                                    value={form.zipCode}
                                    onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                                    placeholder="80202"
                                    className="h-12 rounded-xl"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Vehículo del Técnico (Modelo)"
                                    required={isTech}
                                    value={form.techVehicleModel}
                                    onChange={(e) => setForm({ ...form, techVehicleModel: e.target.value })}
                                    placeholder="Ej. Ford Transit Blanca"
                                    className="h-12 rounded-xl"
                                />
                                <Input
                                    label="Placa del Vehículo"
                                    required={isTech}
                                    value={form.techVehiclePlate}
                                    onChange={(e) => setForm({ ...form, techVehiclePlate: e.target.value })}
                                    placeholder="Ej. ABC-1234"
                                    className="h-12 rounded-xl"
                                />
                            </div>
                        </div>
                    )}

                    {/* Data Consent */}
                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.dataConsent}
                                onChange={(e) => setForm({ ...form, dataConsent: e.target.checked })}
                                className="mt-1 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            <span className="text-xs text-slate-600 font-medium">
                                Autorizo a Denver Auto Care el tratamiento de mis datos personales según la Política de Privacidad. 
                                Entiendo que esta información se utilizará para gestionar los servicios técnicos y la seguridad de las visitas.
                            </span>
                        </label>
                    </div>

                    <div className="pt-4">
                        <Button type="submit" variant="primary" fullWidth loading={loading} className="h-14 rounded-2xl font-black shadow-xl shadow-primary/20">
                            GUARDAR Y CONTINUAR
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
