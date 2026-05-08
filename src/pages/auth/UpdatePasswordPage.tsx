import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import { supabase } from '../../lib/supabase';

export function UpdatePasswordPage() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast({ title: 'Error', description: 'Las contraseñas no coinciden', type: 'error' });
            return;
        }

        if (password.length < 6) {
            toast({ title: 'Error', description: 'La contraseña debe tener al menos 6 caracteres', type: 'error' });
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            toast({ title: 'Éxito', description: 'Tu contraseña ha sido actualizada', type: 'success' });
            navigate('/auth/login', { replace: true });
        } catch (error: any) {
            console.error('Error updating password:', error);
            toast({ title: 'Error', description: error.message || 'No se pudo actualizar la contraseña', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950 px-4 relative overflow-hidden font-inter dark">
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>

            <Card className="w-full max-w-md animate-in bg-white/5 backdrop-blur-3xl shadow-3xl rounded-[2.5rem] overflow-hidden border border-white/10 relative z-10 zoom-in duration-700">
                <div className="h-2 w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
                <CardHeader className="text-center pt-10">
                    <CardTitle className="text-3xl font-black text-white italic tracking-tighter uppercase">Nueva Contraseña</CardTitle>
                    <CardDescription className="text-primary font-black uppercase tracking-[0.3em] text-[10px] italic">
                        Ingresa tu nueva contraseña para acceder a tu cuenta
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                    <form className="space-y-4" onSubmit={handleUpdate}>
                        <Input
                            label="NUEVA CONTRASEÑA"
                            type="password"
                            placeholder="••••••••"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-14 rounded-2xl border-white/10 bg-white/10 !text-white placeholder-slate-500 focus:border-primary"
                        />
                        <Input
                            label="CONFIRMAR CONTRASEÑA"
                            type="password"
                            placeholder="••••••••"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="h-14 rounded-2xl border-white/10 bg-white/5 text-white placeholder-slate-500 focus:border-primary"
                        />
                        <Button
                            type="submit"
                            fullWidth
                            loading={loading}
                            className="h-16 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] font-inter italic shadow-2xl border-none transition-all duration-700 bg-primary text-slate-950 hover:bg-white mt-4"
                        >
                            ACTUALIZAR CONTRASEÑA
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
