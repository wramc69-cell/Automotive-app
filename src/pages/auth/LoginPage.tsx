import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import { supabase } from '../../lib/supabase';
import { User, Wrench, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
    const { toast } = useToast();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState<'CUSTOMER' | 'TECH' | 'ADMIN' | null>(null);

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
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            toast({ title: 'Éxito', description: 'Inicio de sesión exitoso', type: 'success' });
            
            // Allow a small delay for the toast if needed, or redirect immediately
            // The AuthContext will pick up the new session and the guards will handle the rest,
            // but a manual navigate is more robust for manual login.
            if (data.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('user_id', data.user.id)
                    .single();
                
                const userRole = profile?.role || data.user.user_metadata?.role;
                if (userRole === 'ADMIN') navigate('/admin');
                else if (userRole === 'TECH') navigate('/tech');
                else navigate('/app');
            }
        } catch (error: any) {
            console.error('Error in login:', error);
            toast({ title: 'Error', description: error.message || 'Credenciales inválidas', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!email) {
            toast({ title: 'Atención', description: 'Por favor, ingresa tu correo electrónico primero para restablecer la contraseña', type: 'error' });
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/update-password`,
            });
            if (error) throw error;
            toast({ title: 'Correo Enviado', description: 'Revisa tu bandeja de entrada para restablecer tu contraseña', type: 'success' });
        } catch (error: any) {
            console.error('Error resetting password:', error);
            toast({ title: 'Error', description: error.message || 'No se pudo enviar el correo de recuperación', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh] px-4">
            <Card className="w-full max-w-md animate-in shadow-2xl rounded-[2rem] overflow-hidden border-slate-100">
                <div className={`h-2 w-full ${role === 'TECH' ? 'bg-slate-800' : role === 'ADMIN' ? 'bg-indigo-600' : 'bg-primary'}`}></div>
                <CardHeader className="text-center pt-10">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${role === 'TECH' ? 'bg-slate-100 text-slate-600' : role === 'ADMIN' ? 'bg-indigo-50 text-indigo-600' : 'bg-primary/10 text-primary'}`}>
                        {role === 'TECH' ? <Wrench size={32} /> : <User size={32} />}
                    </div>
                    <CardTitle className="text-3xl font-black text-slate-900">
                        {role === 'TECH' ? 'Acceso Técnico' : role === 'ADMIN' ? 'Panel Control' : 'Bienvenido'}
                    </CardTitle>
                    <CardDescription className="text-slate-500 font-bold uppercase tracking-tight text-[10px]">
                        {role === 'TECH' ? 'Gestiona tus órdenes de trabajo' : role === 'ADMIN' ? 'Administración del Sistema' : 'Inicia sesión para ver tus servicios'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                    <form className="space-y-4" onSubmit={handleLogin}>
                        <Input
                            label="Correo electrónico"
                            type="email"
                            placeholder="tu@correo.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-12 rounded-xl"
                        />
                        <div className="space-y-1">
                            <div className="relative">
                                <Input
                                    label="Contraseña"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-12 rounded-xl pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-[38px] text-slate-400 hover:text-primary transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            <div className="text-right">
                                <button type="button" onClick={handleResetPassword} className="text-[10px] text-primary font-bold hover:underline">¿Olvidaste tu contraseña?</button>
                            </div>
                        </div>
                        <Button
                            type="submit"
                            fullWidth
                            loading={loading}
                            variant={role === 'TECH' ? 'dark' : role === 'ADMIN' ? 'dark' : 'primary'}
                            className="h-14 rounded-2xl font-black mt-2 shadow-xl"
                        >
                            INGRESAR
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col items-center pb-10 gap-3 border-t border-slate-50 pt-6">
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                        ¿No tienes cuenta? <Link to={`/auth/register${role ? `?role=${role}` : ''}`} className="text-primary hover:underline ml-1">Regístrate</Link>
                    </p>
                    <Link to="/" className="text-[9px] text-slate-300 hover:text-slate-500 font-bold uppercase tracking-tighter flex items-center gap-1">
                        <ArrowLeft size={10} /> Volver al inicio
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
