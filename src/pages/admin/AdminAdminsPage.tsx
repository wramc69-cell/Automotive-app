import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
    ShieldCheck, ShieldAlert, Users, Activity, 
    Trash2, ChevronRight, Lock, Shield, UserMinus
} from 'lucide-react';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { useToast } from '../../components/ui/Toast';

export function AdminAdminsPage() {
    const [admins, setAdmins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const { data, error } = await supabaseAdmin
                .from('profiles')
                .select('*')
                .eq('role', 'ADMIN')
                .order('created_at', { ascending: false });

            if (data) setAdmins(data);
            if (error) throw error;
        } catch (err: any) {
            console.error('Error loadAdmins:', err);
            toast({ title: 'Error de carga', description: err.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    }

    async function demoteAdmin(userId: string, name: string) {
        if (!confirm(`¿Estás seguro de revocar los permisos de administrador a ${name}? Pasará a tener rol de Técnico.`)) return;
        try {
            const { error } = await supabaseAdmin
                .from('profiles')
                .update({ role: 'TECH' })
                .eq('user_id', userId);
            if (error) throw error;
            toast({ title: 'Seguridad Actualizada', description: 'Permisos revocados con éxito.', type: 'success' });
            loadData();
        } catch (err: any) {
            toast({ title: 'Error fatal', description: err.message, type: 'error' });
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 px-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-100 rounded-3xl animate-pulse"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="w-6 h-6 text-primary animate-bounce" />
                    </div>
                </div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Sincronizando Protocolos de Seguridad...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1700px] mx-auto space-y-12 pb-24 animate-in fade-in duration-700 px-4">
            {/* Header: Jerarquía de Comando */}
            <header className="relative p-12 md:p-20 bg-slate-950 rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
                <div className="absolute top-0 right-0 w-[50%] h-full bg-gradient-to-l from-primary/20 to-transparent"></div>
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/10 blur-[120px] rounded-full"></div>
                
                <div className="relative z-10 flex flex-col xl:flex-row justify-between items-end gap-12">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-12 w-full xl:w-auto">
                        <div className="w-32 h-32 bg-white/5 rounded-[2.5rem] flex items-center justify-center border-4 border-white/10 shadow-2xl backdrop-blur-xl group shrink-0">
                            <Shield className="w-16 h-16 text-primary group-hover:scale-110 transition-transform duration-1000" />
                        </div>
                        <div className="text-center md:text-left space-y-6">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
                                <h1 className="text-6xl md:text-9xl font-black italic tracking-tighter text-white uppercase leading-[0.8] pt-2">Master Comando</h1>
                                <Badge className="bg-primary text-white text-[12px] font-black border-none px-8 py-3 rounded-full shadow-[0_15px_40px_rgba(255,46,91,0.5)] tracking-[0.3em]">ROOT ACCESS LEVEL 9</Badge>
                            </div>
                            <p className="text-slate-500 font-bold uppercase tracking-[0.5em] text-[12px] flex items-center justify-center md:justify-start gap-6">
                                <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                                Protocolos Master Denver Mobile Security System
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {admins.map(admin => (
                    <Card key={admin.user_id} className="group overflow-hidden bg-white border-none rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06)] hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 relative border-8 border-transparent hover:border-slate-50">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] -mr-16 -mt-16 group-hover:bg-primary/20 transition-all rounded-full pointer-events-none"></div>
                        <CardContent className="p-12 relative z-10">
                            <div className="flex flex-col items-center text-center gap-8">
                                <div className="relative">
                                    <div className="w-32 h-32 rounded-[2.5rem] bg-slate-50 overflow-hidden ring-[12px] ring-slate-50/50 flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 border-4 border-white">
                                        {admin.avatar_url ? (
                                            <img src={admin.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-primary opacity-20"><Users size={64} strokeWidth={1} /></div>
                                        )}
                                    </div>
                                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-slate-950 border-4 border-white rounded-[1.2rem] flex items-center justify-center text-primary shadow-2xl group-hover:-rotate-12 transition-transform">
                                        <ShieldCheck size={24} />
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <h3 className="font-black text-slate-950 text-3xl leading-none uppercase italic tracking-tighter group-hover:text-primary transition-colors underline decoration-slate-100 decoration-8 underline-offset-[12px] decoration-skip-ink">{admin.first_name} {admin.last_name}</h3>
                                    <div className="flex flex-col items-center gap-3 pt-4">
                                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl">{admin.email || admin.user_id?.slice(0, 12)}</p>
                                        <Badge className="bg-slate-950 text-white text-[10px] font-black border-none px-6 py-2 rounded-full mt-4 tracking-[0.3em] shadow-xl">ENCRYPTED_ADMIN</Badge>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-12 pt-10 border-t-4 border-slate-50">
                                <Button 
                                    className="w-full h-20 rounded-3xl bg-slate-950 text-white font-black text-xs uppercase tracking-widest hover:bg-rose-600 transition-all border-none group/action shadow-xl hover:shadow-rose-500/20"
                                    onClick={() => demoteAdmin(admin.user_id, admin.first_name)}
                                >
                                    <UserMinus size={22} className="mr-4 group-hover/action:scale-125 transition-transform" /> 
                                    DECOUPLE_ACCESS
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {admins.length === 0 && (
                <div className="py-40 text-center bg-slate-50 rounded-[2.5rem] border-4 border-dashed border-slate-100 flex flex-col items-center gap-8">
                    <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center text-slate-200 shadow-2xl border-4 border-slate-50 relative overflow-hidden">
                        <div className="absolute inset-0 bg-primary/5 animate-pulse"></div>
                        <ShieldAlert size={64} className="relative z-10" />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-300 leading-none">Root Access Cleared</h3>
                        <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] max-w-sm mx-auto leading-relaxed italic opacity-50 underline decoration-primary/20 decoration-4">SISTEMA_SIN_COMANDO_ACTIVO</p>
                    </div>
                </div>
            )}
        </div>
    );
}
