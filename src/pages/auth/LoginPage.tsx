import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import { supabase } from '../../lib/supabase';
import { User, ShieldCheck, Zap, Lock, Eye, EyeOff, Wrench, ArrowLeft } from 'lucide-react';

export function LoginPage() {
    const { toast } = useToast();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState<'CUSTOMER' | 'TECH' | 'ADMIN' | null>(null);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const r = params.get('role');
        if (r === 'TECH' || r === 'CUSTOMER' || r === 'ADMIN') {
            setRole(r as any);
        }
    }, [location]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email: email.toLowerCase(), password });
            if (error) throw error;
            toast({ title: 'Ingreso exitoso', description: 'Cargando tu perfil...', type: 'success' });
            if (data.user) {
                const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', data.user.id).single();
                const userRole = profile?.role || data.user.user_metadata?.role;
                if (userRole === 'ADMIN') navigate('/admin');
                else if (userRole === 'TECH') navigate('/tech');
                else navigate('/app');
            }
        } catch (error: any) {
            setError(error.message || 'Credenciales inválidas');
            toast({ title: 'Error de ingreso', description: error.message || 'Credenciales inválidas', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Professional Background Elements */}
            <div className="absolute inset-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full"></div>
            </div>

            <div className="w-full max-w-md relative z-10 space-y-8">
                <div className="text-center space-y-6">
                    <Link to="/" className="inline-flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-slate-950 shadow-2xl shadow-primary/20">
                            <Zap size={24} fill="currentColor" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-white italic">Denver <span className="text-primary not-italic">Auto Care</span></span>
                    </Link>
                    
                    <div className="space-y-3">
                        <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter italic leading-none">
                        CENTRAL <br />
                        <span className="text-primary not-italic">COMMAND</span>
                    </h1>
                        <p className="text-slate-500 text-lg font-medium">Ingresa tus credenciales para continuar</p>
                    </div>
                </div>

                <div className="w-full max-w-md relative z-10">
                <div className="glass rounded-[2rem] border border-white/10 p-10 md:p-12 shadow-3xl relative overflow-hidden group">
                    {/* Decorative Scanner Line */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/30 blur-sm group-hover:bg-primary transition-colors"></div>

                    <div className="space-y-8">
                        <div className="space-y-2">
                            <h2 className="text-xl font-black text-white uppercase tracking-widest italic leading-none">Protocolo de Acceso</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] italic">Ingrese credenciales de terminal</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <Input
                                label="Identificador de Usuario"
                                type="email"
                                placeholder="NOMBRE@AUTO_HUB.SYS"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />

                            <Input
                                label="Código de Acceso"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />

                            {error && (
                                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                                    <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest italic">{error}</p>
                                </div>
                            )}

                            <Button 
                                type="submit" 
                                className="w-full h-14" 
                                loading={loading}
                            >
                                <Lock size={16} className="mr-2" /> INICIAR PROTOCOLO
                            </Button>
                        </form>

                        <div className="pt-8 border-t border-white/5 flex flex-col items-center gap-6">
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.4em] italic leading-tight text-center">
                                ¿No tienes acceso? <br />
                                <Link to="/auth/register" className="text-primary hover:text-white transition-colors">Solicitar Despliegue de Unidad</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

                <div className="text-center space-y-8">
                    <Link 
                        to="/" 
                        className="inline-flex items-center gap-3 text-sm font-bold text-slate-600 hover:text-white transition-all group/back"
                    >
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
