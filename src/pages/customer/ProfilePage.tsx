import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import { User, Shield, MapPin, Smartphone, Mail, Lock, CheckCircle2, UserCheck, Zap, Info, ShieldCheck } from 'lucide-react';

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

    const [showLabelInfo, setShowLabelInfo] = useState<string | null>(null);

    const handleUpdatePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            toast({ title: 'Protocolo de Seguridad', description: 'La contraseña debe tener al menos 6 caracteres para cumplir el estándar Denver.', type: 'error' });
            return;
        }
        if (newPassword !== confirmPassword) {
            toast({ title: 'Error de Sincronización', description: 'Las contraseñas no coinciden. Verifique las credenciales.', type: 'error' });
            return;
        }

        setPasswordLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            toast({ title: 'Credenciales Actualizadas', description: 'Nueva contraseña establecida en la red segura.', type: 'success' });
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast({ title: 'Falla de Seguridad', description: error.message || 'No se pudo actualizar el acceso.', type: 'error' });
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
            toast({ title: 'Atención de Consentimiento', description: 'Es necesario autorizar el tratamiento de datos para continuar.', type: 'error' });
            return;
        }

        setLoading(true);

        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (form.phone && !phoneRegex.test(form.phone)) {
            toast({ title: 'Falla de Validación', description: 'Formato de teléfono inválido (Use +17205551234).', type: 'error' });
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    user_id: user.id,
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

            toast({ title: 'Terminal Actualizada', description: 'Expediente de operador guardado con éxito.', type: 'success' });
            await refreshProfile();
        } catch (error: any) {
            toast({ title: 'Falla de Sincronización', description: error.message || 'No se pudo guardar la información.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-1000 px-4">
            
            {/* Header: Operator Identity Card */}
            <section className="relative group">
                <div className="absolute inset-0 bg-primary/10 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-1000 group-hover:bg-primary/20"></div>
                <div className="relative z-10 bg-slate-950 rounded-3xl p-8 overflow-hidden border border-white/5 shadow-3xl shadow-slate-950/20">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-bl-[4rem] pointer-events-none group-hover:scale-110 transition-transform duration-1000"></div>
                    
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="relative">
                            <div className="w-24 h-24 md:w-32 md:h-32 bg-white/5 rounded-[2rem] flex items-center justify-center text-primary text-4xl font-black shadow-2xl border-4 border-white/5 italic rotate-3 group-hover:rotate-0 transition-transform duration-700">
                                {form.firstName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-xl shadow-primary/40 animate-bounce group-hover:animate-none">
                                <Zap size={20} fill="currentColor" />
                            </div>
                        </div>
                        
                        <div className="text-center md:text-left space-y-4">
                            <div className="space-y-2">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.5em] italic leading-none">Account Access Terminal</span>
                                <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter text-white uppercase leading-[0.8]">
                                    {form.firstName ? (
                                        <>
                                            {form.firstName} <br />
                                            <span className="text-primary italic transition-colors duration-1000 group-hover:text-white uppercase">{form.lastName}</span>
                                        </>
                                    ) : (
                                        <>SESIÓN <br /><span className="text-primary italic uppercase">ACTIVA</span></>
                                    )}
                                </h1>
                            </div>
                            
                            <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                <Badge className="px-6 py-2 rounded-2xl bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-[9px] font-black italic tracking-[0.2em] uppercase flex items-center gap-2">
                                    <CheckCircle2 size={12} /> STATUS_VERIFIED
                                </Badge>
                                <Badge className="px-6 py-2 rounded-2xl bg-primary/10 border-primary/20 text-primary text-[9px] font-black italic tracking-[0.2em] uppercase flex items-center gap-2">
                                    <UserCheck size={12} /> OPERATOR_DENVER
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Control Grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Identity Module (Enhanced Dark) */}
                <Card className="rounded-[2.5rem] border border-white/5 shadow-3xl overflow-hidden bg-white/5 backdrop-blur-3xl group flex flex-col hover:bg-white/10 transition-all duration-700">
                    <CardHeader className="p-10 pb-6 flex flex-col gap-4 border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-950 rounded-2xl flex items-center justify-center text-primary shadow-2xl border border-white/5">
                                <User size={20} />
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] italic">Módulo de Identidad_</span>
                        </div>
                        <CardTitle className="text-3xl font-black italic uppercase tracking-tighter text-white">
                            DATOS <span className="text-primary italic">PRIMARIOS</span>
                        </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="p-10 pt-8 space-y-8 flex-grow">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] ml-1 italic group-hover:text-primary transition-colors">Primer_Nombre</label>
                            <Input
                                value={form.firstName}
                                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                                className="h-14 rounded-2xl border border-white/5 bg-slate-950/50 focus:bg-slate-950 focus:border-primary shadow-2xl px-6 font-black italic text-white uppercase tracking-tighter transition-all"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] ml-1 italic group-hover:text-primary transition-colors">Apellido_Paterno</label>
                            <Input
                                value={form.lastName}
                                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                                className="h-14 rounded-2xl border border-white/5 bg-slate-950/50 focus:bg-slate-950 focus:border-primary shadow-2xl px-6 font-black italic text-white uppercase tracking-tighter transition-all"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-primary/60 uppercase tracking-[0.4em] ml-1 italic">Email_Registro</label>
                            <div className="relative">
                                <Input
                                    value={user?.email || ''}
                                    disabled
                                    className="h-14 rounded-2xl border border-white/5 bg-white/5 text-slate-500 font-black italic px-6 cursor-not-allowed uppercase tracking-tighter"
                                />
                                <Lock size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Module (Enhanced Dark) */}
                <Card className="rounded-[2.5rem] border border-white/5 shadow-3xl overflow-hidden bg-white/5 backdrop-blur-3xl group flex flex-col hover:bg-white/10 transition-all duration-700">
                    <CardHeader className="p-10 pb-6 flex flex-col gap-4 border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-950 rounded-2xl flex items-center justify-center text-primary shadow-2xl border border-white/5">
                                <Smartphone size={20} />
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] italic">Comunicaciones_</span>
                        </div>
                        <CardTitle className="text-3xl font-black italic uppercase tracking-tighter text-white">
                            CANALES <span className="text-primary italic">LINKED</span>
                        </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="p-10 pt-8 space-y-8 flex-grow">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] ml-1 italic group-hover:text-primary transition-colors">Teléfono_Móvil</label>
                            <Input
                                type="tel"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                placeholder="+1 720 555 1234"
                                className="h-14 rounded-2xl border border-white/5 bg-slate-950/50 focus:bg-slate-950 focus:border-primary shadow-2xl px-6 font-black italic text-white uppercase tracking-tighter transition-all"
                            />
                            <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em] ml-2 animate-pulse italic">Format: +[Code][Number]</p>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] ml-1 italic group-hover:text-primary transition-colors">Preferred_Channel</label>
                            <Select
                                value={form.channel}
                                onChange={(e) => setForm({ ...form, channel: e.target.value })}
                                options={[
                                    { value: 'EMAIL', label: 'CORREO ELECTRÓNICO' },
                                    { value: 'SMS', label: 'MENSAJE DE TEXTO' },
                                    { value: 'WHATSAPP', label: 'WHATSAPP DIRECTO' },
                                    { value: 'TELEGRAM', label: 'TELEGRAM APP' }
                                ]}
                                className="h-14 rounded-2xl border border-white/5 bg-slate-950/50 focus:bg-slate-950 border-white/5 text-white font-black italic text-[12px] tracking-[0.3em] uppercase w-full px-6 transition-all"
                            />
                        </div>
                        
                        <div className="p-6 bg-slate-950/50 rounded-[1.5rem] border border-white/5 border-dashed mt-4 group-hover:border-primary/20 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-primary shadow-2xl border border-white/5 group-hover:rotate-12 transition-transform">
                                    <Mail size={20} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">MÉTODO DE CONTACTO</p>
                                    <p className="text-[12px] font-black text-white uppercase italic tracking-tighter">Sincronizado vía Denver_HUB</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Address Management Terminal (Enhanced Dark) */}
            <Card className="rounded-[3rem] border border-white/5 shadow-3xl overflow-hidden bg-white/5 backdrop-blur-3xl">
                <CardHeader className="p-10 md:p-16 flex flex-col lg:flex-row justify-between items-center gap-10 bg-slate-950/40 border-b border-white/5">
                    <div className="space-y-6 text-center lg:text-left">
                        <div className="flex items-center gap-4 justify-center lg:justify-start">
                            <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-primary shadow-2xl border border-white/10">
                                <MapPin size={24} />
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.8em] italic leading-none">Geolocalización_</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white uppercase leading-[0.9]">DIRECCIONES <br /><span className="text-primary italic">DE SERVICIO</span></h2>
                    </div>
                    <Button 
                        size="lg"
                        onClick={handleSave} 
                        loading={loading} 
                        className="h-16 px-12 rounded-[1.5rem] bg-primary text-slate-950 hover:bg-white transition-all duration-700 font-black text-[12px] tracking-[0.4em] shadow-3xl border-none uppercase italic group w-full lg:w-auto"
                    >
                        OPERACIÓN: SALVAR DATOS <Zap size={20} className="ml-4 group-hover:scale-125 transition-transform" />
                    </Button>
                </CardHeader>
                
                <CardContent className="p-10 md:p-16 space-y-16">
                    {/* Primary Grid */}
                    <div className="space-y-10">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-[2px] bg-primary"></div>
                            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.5em] italic leading-none">SECTOR_ALFA [RESIDENCIAL]</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="md:col-span-2 space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] ml-1 italic">Calle_y_Numero</label>
                                <Input
                                    placeholder="Ej. 123 Denva Lane"
                                    value={form.addressLine1}
                                    onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                                    className="h-14 rounded-2xl border border-white/5 bg-slate-950/50 focus:bg-slate-950 focus:border-primary shadow-2xl px-6 font-black italic text-white uppercase tracking-tighter"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] ml-1 italic">Ciudad_</label>
                                <Input
                                    value={form.city}
                                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                                    className="h-14 rounded-2xl border border-white/5 bg-slate-950/50 focus:bg-slate-950 focus:border-primary shadow-2xl px-6 font-black italic text-white uppercase tracking-tighter"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] ml-1 italic">Estado_</label>
                                <Input
                                    placeholder="CO"
                                    value={form.state}
                                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                                    className="h-14 rounded-2xl border border-white/5 bg-slate-950/50 focus:bg-slate-950 focus:border-primary shadow-2xl px-6 font-black italic text-white uppercase tracking-tighter"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Secondary Grid */}
                    <div className="space-y-10 pt-16 border-t border-white/5 border-dashed">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-[2px] bg-white/20"></div>
                            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] italic leading-none">SECTOR_BETA [OPERATIVO]</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="md:col-span-2 space-y-3">
                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] ml-1 italic">Calle_y_Numero</label>
                                <Input
                                    placeholder="Ej. Office Campus A"
                                    value={form.address2Line1}
                                    onChange={(e) => setForm({ ...form, address2Line1: e.target.value })}
                                    className="h-14 rounded-2xl border border-white/5 bg-slate-950/50 focus:bg-slate-950 focus:border-primary shadow-2xl px-6 font-black italic text-white uppercase tracking-tighter opacity-70 focus:opacity-100 transition-all"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] ml-1 italic">Ciudad_</label>
                                <Input
                                    value={form.city2}
                                    onChange={(e) => setForm({ ...form, city2: e.target.value })}
                                    className="h-14 rounded-2xl border border-white/5 bg-slate-950/50 focus:bg-slate-950 focus:border-primary shadow-2xl px-6 font-black italic text-white uppercase tracking-tighter opacity-70 focus:opacity-100 transition-all"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] ml-1 italic">ZIP_Code</label>
                                <Input
                                    value={form.zip2}
                                    onChange={(e) => setForm({ ...form, zip2: e.target.value })}
                                    className="h-14 rounded-2xl border border-white/5 bg-slate-950/50 focus:bg-slate-950 focus:border-primary shadow-2xl px-6 font-black italic text-white uppercase tracking-tighter opacity-70 focus:opacity-100 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Privacy Compliance Module (Enhanced Dark) */}
            <Card className="rounded-[2.5rem] border-2 border-dashed border-white/5 shadow-none bg-white/5 overflow-hidden group hover:border-primary/20 transition-all duration-700">
                <CardContent className="p-8 md:p-10 flex items-center gap-10">
                    <div className="relative shrink-0">
                        <input
                            type="checkbox"
                            id="dataConsent"
                            checked={form.dataConsent}
                            onChange={(e) => setForm({ ...form, dataConsent: e.target.checked })}
                            className="h-10 w-10 rounded-[1rem] border-2 border-white/10 text-primary focus:ring-primary/20 appearance-none checked:bg-primary checked:border-primary transition-all duration-700 cursor-pointer shadow-3xl bg-slate-950/50"
                        />
                        {form.dataConsent && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-950 font-black text-sm">
                                <CheckCircle2 size={24} fill="currentColor" />
                            </div>
                        )}
                    </div>
                    <label htmlFor="dataConsent" className="text-[11px] text-slate-500 font-black leading-relaxed cursor-pointer select-none uppercase tracking-[0.3em] italic group-hover:text-white transition-colors">
                        AUTORIZO EL TRATAMIENTO DE MIS DATOS PERSONALES Y SENSIBLES CONFORME AL <span className="text-primary underline decoration-2 underline-offset-[6px] font-black group-hover:text-white transition-colors">AVISO DE PRIVACIDAD</span> DE DENVER PARA REPARACIONES.
                    </label>
                </CardContent>
            </Card>

            {/* Security Terminal [Bottom] */}
            <Card className="rounded-3xl shadow-3xl shadow-slate-900/20 border-none overflow-hidden bg-slate-950 text-white group">
                <CardHeader className="p-8 md:p-12 bg-white/5 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/20 rounded-xl flex items-center justify-center text-primary shadow-sm">
                                <ShieldCheck size={16} />
                            </div>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em] italic">Capa de Seguridad_</span>
                        </div>
                        <CardTitle className="text-3xl font-black italic uppercase tracking-tighter text-white">
                            CONTROL DE <span className="text-primary italic">ACCESO</span>
                        </CardTitle>
                    </div>
                    <Button 
                        variant="outline" 
                        size="lg"
                        onClick={handleUpdatePassword} 
                        loading={passwordLoading} 
                        className="h-12 px-6 rounded-xl border-white/10 text-white hover:bg-white hover:text-slate-950 transition-all duration-500 font-black text-[9px] tracking-[0.4em] uppercase italic bg-white/5"
                    >
                        ACTUALIZAR CREDENCIALES <Lock size={14} className="ml-3" />
                    </Button>
                </CardHeader>
                
                <CardContent className="p-8 md:p-12 bg-gradient-to-br from-slate-950 to-slate-900">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1 italic">Clave_Entrada</label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="h-12 rounded-xl border-white/10 bg-white/5 focus:bg-white/10 focus:ring-primary text-white font-black tracking-widest px-4"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1 italic">Confirmar_Clave</label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="h-12 rounded-xl border-white/10 bg-white/5 focus:bg-white/10 focus:ring-primary text-white font-black tracking-widest px-4"
                            />
                        </div>
                    </div>
                </CardContent>
                
                <CardFooter className="p-6 md:p-8 bg-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        <p className="text-[8px] font-black text-slate-500 tracking-[0.4em] uppercase italic">Encriptación AES-256 Activa</p>
                    </div>
                    <p className="text-[8px] font-black text-slate-700 tracking-[0.4em] uppercase italic">DENVER_SEC_V3.0</p>
                </CardFooter>
            </Card>

        </div>
    );
}
