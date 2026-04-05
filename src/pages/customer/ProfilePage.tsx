import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';

export function ProfilePage() {
    const { user, profile, refreshProfile } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        channel: 'EMAIL',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zip: '',
        address2Line1: '',
        address2Line2: '',
        city2: '',
        state2: '',
        zip2: '',
        dataConsent: false
    });

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    const handleUpdatePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            toast({ title: 'Error', description: 'La contraseña debe tener al menos 6 caracteres', type: 'error' });
            return;
        }
        if (newPassword !== confirmPassword) {
            toast({ title: 'Error', description: 'Las contraseñas no coinciden', type: 'error' });
            return;
        }

        setPasswordLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            toast({ title: 'Éxito', description: 'Contraseña actualizada correctamente', type: 'success' });
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'No se pudo actualizar la contraseña', type: 'error' });
        } finally {
            setPasswordLoading(false);
        }
    };

    useEffect(() => {
        if (profile) {
            setForm({
                firstName: profile.first_name || '',
                lastName: profile.last_name || '',
                phone: profile.phone || '',
                channel: profile.preferred_channel || 'EMAIL',
                addressLine1: profile.address_line1 || '',
                addressLine2: profile.address_line2 || '',
                city: profile.city || '',
                state: profile.state?.includes('@') ? '' : (profile.state || ''),
                zip: profile.zip?.includes('@') ? '' : (profile.zip || ''),
                address2Line1: profile.address2_line1 || '',
                address2Line2: profile.address2_line2 || '',
                city2: profile.city2 || '',
                state2: profile.state2?.includes('@') ? '' : (profile.state2 || ''),
                zip2: profile.zip2?.includes('@') ? '' : (profile.zip2 || ''),
                dataConsent: !!profile.data_treatment_consent
            });
        } else if (user?.user_metadata) {
            // Fallback to metadata if profile record is missing (Self-heal UI)
            setForm(prev => ({
                ...prev,
                firstName: user.user_metadata.first_name || '',
                lastName: user.user_metadata.last_name || ''
            }));
        }
    }, [profile, user]);

    const handleSave = async () => {
        if (!user) return;
        
        if (!form.dataConsent) {
            toast({ title: 'Atención', description: 'Debes aceptar el tratamiento de datos sensibles.', type: 'error' });
            return;
        }

        setLoading(true);

        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (form.phone && !phoneRegex.test(form.phone)) {
            toast({ title: 'Error de Validación', description: 'Formato de teléfono inválido. Use formato internacional (ej. +17205551234)', type: 'error' });
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    user_id: user.id, // Primary key for upsert
                    first_name: form.firstName,
                    last_name: form.lastName,
                    phone: form.phone || null,
                    preferred_channel: form.channel,
                    address_line1: form.addressLine1 || null,
                    address_line2: form.addressLine2 || null,
                    city: form.city || null,
                    state: form.state || null,
                    zip: form.zip || null,
                    address2_line1: form.address2Line1 || null,
                    address2_line2: form.address2Line2 || null,
                    city2: form.city2 || null,
                    state2: form.state2 || null,
                    zip2: form.zip2 || null,
                    data_treatment_consent: form.dataConsent,
                    data_treatment_consent_date: form.dataConsent ? new Date().toISOString() : null
                });

            if (error) throw error;

            toast({ title: 'Perfil Guardado', description: 'Tus datos han sido procesados exitosamente.', type: 'success' });
            await refreshProfile();
        } catch (error: any) {
            console.error('Error saving profile:', error);
            toast({ title: 'Error', description: error.message || 'No se pudo guardar la información', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in">
            <div>
                <h1 className="text-2xl font-bold font-black uppercase tracking-tight">Mi Perfil</h1>
                <p className="text-muted-foreground font-medium">Administra tu información personal, direcciones y preferencias.</p>
            </div>

            <Card className="rounded-3xl shadow-xl border-slate-100 overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100 pb-8">
                    <CardTitle className="text-xl font-black">Datos Personales</CardTitle>
                    <CardDescription className="text-slate-500">Esta información es necesaria para contactarte y coordinar servicios.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Nombre(s)"
                            value={form.firstName}
                            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                            className="h-12 rounded-xl"
                        />
                        <Input
                            label="Apellido"
                            value={form.lastName}
                            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                            className="h-12 rounded-xl"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Correo Electrónico"
                            value={user?.email || ''}
                            disabled
                            className="h-12 rounded-xl bg-slate-50"
                        />
                        <Input
                            label="Teléfono Móvil"
                            type="tel"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            placeholder="+1 720 555 1234"
                            hint="Formato internacional, ej: +17205551234"
                            className="h-12 rounded-xl"
                        />
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t border-slate-50">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Dirección Residencial 1</h3>
                        <Input
                            label="Dirección (Línea 1)"
                            placeholder="Calle y número"
                            value={form.addressLine1}
                            onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                            className="h-12 rounded-xl"
                        />
                        <Input
                            label="Apartamento / Suite (Opcional)"
                            placeholder="Apt 123"
                            value={form.addressLine2}
                            onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
                            className="h-12 rounded-xl"
                        />
                        <div className="grid grid-cols-3 gap-4">
                            <Input
                                label="Ciudad"
                                value={form.city}
                                onChange={(e) => setForm({ ...form, city: e.target.value })}
                                className="h-12 rounded-xl"
                            />
                            <Input
                                label="Estado"
                                placeholder="CO"
                                value={form.state}
                                onChange={(e) => setForm({ ...form, state: e.target.value })}
                                className="h-12 rounded-xl"
                            />
                            <Input
                                label="Código Postal"
                                value={form.zip}
                                onChange={(e) => setForm({ ...form, zip: e.target.value })}
                                className="h-12 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-50">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Dirección Residencial 2</h3>
                        <Input
                            label="Dirección (Línea 1)"
                            placeholder="Calle y número"
                            value={form.address2Line1}
                            onChange={(e) => setForm({ ...form, address2Line1: e.target.value })}
                            className="h-12 rounded-xl"
                        />
                        <Input
                            label="Apartamento / Suite (Opcional)"
                            placeholder="Apt 123"
                            value={form.address2Line2}
                            onChange={(e) => setForm({ ...form, address2Line2: e.target.value })}
                            className="h-12 rounded-xl"
                        />
                        <div className="grid grid-cols-3 gap-4">
                            <Input
                                label="Ciudad"
                                value={form.city2}
                                onChange={(e) => setForm({ ...form, city2: e.target.value })}
                                className="h-12 rounded-xl"
                            />
                            <Input
                                label="Estado"
                                name="res_state_2_secure"
                                placeholder="CO"
                                value={form.state2}
                                onChange={(e) => setForm({ ...form, state2: e.target.value })}
                                className="h-12 rounded-xl"
                                autoComplete="new-password"
                            />
                            <Input
                                label="Zona Postal"
                                name="ZP_2_X9YZ"
                                value={form.zip2}
                                onChange={(e) => setForm({ ...form, zip2: e.target.value })}
                                className="h-12 rounded-xl"
                                autoComplete="chrome-off"
                                onFocus={(e) => e.target.removeAttribute('placeholder')}
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-50">
                        <Select
                            label="Canal de Contacto Preferido"
                            value={form.channel}
                            onChange={(e) => setForm({ ...form, channel: e.target.value })}
                            options={[
                                { value: 'EMAIL', label: 'Correo Electrónico' },
                                { value: 'SMS', label: 'Mensaje de Texto (SMS)' },
                                { value: 'WHATSAPP', label: 'WhatsApp' },
                                { value: 'TELEGRAM', label: 'Telegram' }
                            ]}
                            className="h-12 rounded-xl"
                        />

                        <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                            <input
                                type="checkbox"
                                id="dataConsent"
                                checked={form.dataConsent}
                                onChange={(e) => setForm({ ...form, dataConsent: e.target.checked })}
                                className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="dataConsent" className="text-xs text-slate-600 font-medium leading-relaxed">
                                Acepto el tratamiento de mis datos personales y sensibles conforme al Aviso de Privacidad de Denver Auto Care para la ejecución de los servicios automotrices solicitados.
                            </label>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end bg-slate-50 border-t border-slate-100 p-6">
                    <Button onClick={handleSave} loading={loading} className="h-12 px-8 rounded-xl font-bold shadow-lg">GUARDAR INFORMACIÓN</Button>
                </CardFooter>
            </Card>

            <Card className="rounded-3xl shadow-lg border-slate-100 overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-lg font-black">Seguridad</CardTitle>
                    <CardDescription>Establece una nueva contraseña para tu cuenta.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-8 pb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Nueva Contraseña"
                            type="password"
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="h-12 rounded-xl"
                        />
                        <Input
                            label="Confirmar Contraseña"
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="h-12 rounded-xl"
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end bg-slate-50 p-6">
                    <Button variant="outline" onClick={handleUpdatePassword} loading={passwordLoading} className="rounded-xl font-bold">Cambiar Contraseña</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
