import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ShieldCheck, ShieldAlert, ArrowRight, ArrowLeft } from 'lucide-react';
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
                .order('first_name');

            if (data) setAdmins(data);
            if (error) throw error;
        } catch (err: any) {
            console.error('Error loadAdmins:', err);
        } finally {
            setLoading(false);
        }
    }

    async function demoteAdmin(userId: string) {
        if (!confirm('¿Desea quitar permisos de administrador a este usuario? Pasará a ser Técnico.')) return;
        try {
            const { error } = await supabaseAdmin
                .from('profiles')
                .update({ role: 'TECH' })
                .eq('user_id', userId);
            if (error) throw error;
            toast({ title: 'Rol Actualizado', description: 'El usuario ahora es Técnico.', type: 'success' });
            loadData();
        } catch (err: any) {
            alert(err.message);
        }
    }

    if (loading) return <div className="p-10 text-center animate-pulse text-indigo-600 font-bold">Cargando administradores...</div>;

    return (
        <div className="space-y-8 pb-20 animate-in">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="text-indigo-600" /> Panel de Administradores
                </h1>
                <p className="text-slate-500 font-medium">Gestión de personal con acceso total al sistema.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {admins.map(admin => (
                    <Card key={admin.user_id} className="bg-white shadow-sm border-slate-200">
                        <CardContent className="p-5">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                                        <ShieldCheck className="text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 leading-tight">{admin.first_name} {admin.last_name}</h3>
                                        <Badge className="bg-indigo-600 text-white mt-1 uppercase text-[9px] font-black">Admin</Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-50">
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="w-full text-rose-600 font-bold text-xs"
                                    onClick={() => demoteAdmin(admin.user_id)}
                                >
                                    <ShieldAlert size={14} className="mr-2" /> Rebajar a Técnico
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
