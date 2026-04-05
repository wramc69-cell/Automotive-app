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
        <div className="flex items-center justify-center min-h-[80vh] px-4">
            <Card className="w-full max-w-md animate-in shadow-2xl rounded-[2rem] overflow-hidden border-slate-100">
                <div className="h-2 w-full bg-primary"></div>
                <CardHeader className="text-center pt-10">
                    <CardTitle className="text-3xl font-black text-slate-900">Nueva Contraseña</CardTitle>
                    <CardDescription className="text-slate-500 font-bold uppercase tracking-tight text-[10px]">
                        Ingresa tu nueva contraseña para acceder a tu cuenta
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                    <form className="space-y-4" onSubmit={handleUpdate}>
                        <Input
                            label="Nueva Contraseña"
                            type="password"
                            placeholder="••••••••"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-12 rounded-xl"
                        />
                        <Input
                            label="Confirmar Contraseña"
                            type="password"
                            placeholder="••••••••"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="h-12 rounded-xl"
                        />
                        <Button
                            type="submit"
                            fullWidth
                            loading={loading}
                            className="h-14 rounded-2xl font-black mt-2 shadow-xl bg-primary shadow-primary/20"
                        >
                            ACTUALIZAR CONTRASEÑA
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
