import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Wrench, Calendar, FileText, CheckCircle, PlusCircle, Car, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Trash2, XCircle } from 'lucide-react';

export function CustomerDashboardPage() {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const [requests, setRequests] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    useEffect(() => {
        if (user) loadData();
    }, [user]);

    async function loadData() {
        setLoading(true);
        const [reqRes, vehRes] = await Promise.all([
            supabase
                .from('service_requests')
                .select('*, vehicles(make, model, year), service_catalog(name)')
                .eq('customer_user_id', user!.id)
                .order('created_at', { ascending: false })
                .limit(5),
            supabase
                .from('vehicles')
                .select('*')
                .eq('owner_user_id', user!.id)
                .order('created_at', { ascending: false })
        ]);

        setRequests(reqRes.data || []);
        setVehicles(vehRes.data || []);
        setLoading(false);
    }

    const active = requests.filter(r => !['COMPLETED', 'CANCELED', 'DECLINED'].includes(r.status));
    const completed = requests.filter(r => r.status === 'COMPLETED');
    const pending = requests.filter(r => r.status === 'QUOTED');

    const STATUS_LABEL: Record<string, string> = {
        SUBMITTED: 'Solicitado', SCHEDULED: 'Programado', DIAGNOSED: 'Diagnosticado',
        QUOTED: 'Pendiente Precio', APPROVED: 'Aprobado', COMPLETED: 'Completado',
        CANCELED: 'Cancelado', DECLINED: 'Rechazado',
    };
    const STATUS_BADGE: Record<string, any> = {
        SUBMITTED: 'warning', SCHEDULED: 'secondary', DIAGNOSED: 'secondary',
        QUOTED: 'warning', APPROVED: 'success', COMPLETED: 'success',
        CANCELED: 'destructive', DECLINED: 'destructive',
    };

    const handleCancelRequest = async (e: React.MouseEvent, requestId: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!window.confirm('¿Estás seguro de que deseas cancelar este servicio? Esta acción no se puede deshacer.')) return;

        setCancellingId(requestId);
        try {
            // 1. Update Request
            const { error: reqError } = await supabase
                .from('service_requests')
                .update({ status: 'CANCELED' })
                .eq('id', requestId);

            if (reqError) throw reqError;

            // 2. Update Appointments
            await supabase
                .from('appointments')
                .update({ status: 'CANCELED' })
                .eq('request_id', requestId);

            toast({ title: 'Servicio Cancelado', description: 'La solicitud ha sido cancelada.', type: 'info' });
            loadData();
        } catch (err: any) {
            console.error('Error cancelling service:', err);
            toast({ title: 'Error', description: 'No se pudo cancelar el servicio.', type: 'error' });
        } finally {
            setCancellingId(null);
        }
    };

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold">
                        Hola, {profile?.first_name || 'Cliente'} 👋
                    </h1>
                    <p className="text-muted-foreground">Aquí está el resumen de tus vehículos y servicios.</p>
                </div>
                <Link to="/app/chat">
                    <Button className="gap-2">
                        <Calendar size={16} /> Agendar Cita
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <Wrench size={18} /> Servicios Activos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{loading ? '—' : active.length}</div>
                        <p className="text-sm text-muted-foreground mt-1">En proceso o programados</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle size={18} className="text-success" /> Completados
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{loading ? '—' : completed.length}</div>
                        <p className="text-sm text-muted-foreground mt-1">Servicios finalizados</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText size={18} className="text-muted-foreground" /> Espera Aprobación
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{loading ? '—' : pending.length}</div>
                        <p className="text-sm text-muted-foreground mt-1">
                            {pending.length > 0 ? (
                                <Link to="/app/requests" className="text-warning font-semibold hover:underline">
                                    Ver presupuestos →
                                </Link>
                            ) : 'Sin cotizaciones pendientes'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Active Services (Quick View) */}
            {!loading && active.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Wrench size={18} className="text-primary" /> Servicios en Curso
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {active.map(req => (
                            <Card key={req.id} className="overflow-hidden border-l-4 border-l-primary">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{req.service_catalog?.name || 'Servicio General'}</span>
                                                <Badge variant={STATUS_BADGE[req.status]} className="text-[10px] uppercase">
                                                    {STATUS_LABEL[req.status]}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {req.vehicles?.year} {req.vehicles?.make} {req.vehicles?.model}
                                            </p>
                                        </div>
                                        {['SUBMITTED', 'SCHEDULED', 'DIAGNOSED', 'QUOTED'].includes(req.status) && (
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="h-8 text-xs text-destructive hover:bg-destructive/5 border-destructive/20"
                                                onClick={(e) => handleCancelRequest(e, req.id)}
                                                disabled={cancellingId === req.id}
                                            >
                                                Cancelar
                                            </Button>
                                        )}
                                    </div>
                                    <div className="mt-4 flex justify-between items-center">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Solicitado: {new Date(req.created_at).toLocaleDateString()}</p>
                                        <Link to={`/app/requests/${req.id}`}>
                                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 group">
                                                Ver Detalles <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Vehicles + Recent Requests */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Vehicles */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2"><Car size={18} /> Mis Vehículos</CardTitle>
                        <Link to="/app/vehicles">
                            <Button variant="ghost" size="sm" className="text-xs">Administrar</Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {loading ? (
                            <div className="space-y-2">
                                {[1, 2].map(i => <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />)}
                            </div>
                        ) : vehicles.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                <Car size={32} className="mx-auto mb-2 opacity-20" />
                                <p className="text-sm">No tienes vehículos registrados</p>
                                <Link to="/app/vehicles">
                                    <Button variant="outline" size="sm" className="mt-3 gap-2">
                                        <PlusCircle size={14} /> Agregar Vehículo
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            vehicles.map(v => (
                                <div key={v.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-slate-50 transition-colors">
                                    <div>
                                        <h4 className="font-semibold text-sm">{v.year} {v.make} {v.model}</h4>
                                        <p className="text-xs text-muted-foreground">
                                            {v.license_plate && `Placa: ${v.license_plate}`}
                                            {v.mileage && ` • ${v.mileage.toLocaleString()} mi`}
                                        </p>
                                    </div>
                                    <Link to="/app/vehicles">
                                        <Button variant="ghost" size="sm"><ChevronRight size={16} /></Button>
                                    </Link>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Recent Requests */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Servicios Recientes</CardTitle>
                        <Link to="/app/requests">
                            <Button variant="ghost" size="sm" className="text-xs">Ver todos</Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {loading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />)}
                            </div>
                        ) : requests.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                <Wrench size={32} className="mx-auto mb-2 opacity-20" />
                                <p className="text-sm">Aún no tienes solicitudes</p>
                                <Link to="/app/chat">
                                    <Button variant="outline" size="sm" className="mt-3 gap-2">
                                        <Calendar size={14} /> Agendar primer servicio
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            requests.slice(0, 4).map(req => (
                                <div key={req.id} className="relative group">
                                    <Link to={`/app/requests/${req.id}`}>
                                        <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer pr-12">
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {req.service_catalog?.name || req.description || 'Servicio General'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {req.vehicles ? `${req.vehicles.year} ${req.vehicles.make} ${req.vehicles.model}` : '—'}
                                                    {' · '}{new Date(req.created_at).toLocaleDateString('es-US', { day: '2-digit', month: 'short' })}
                                                </p>
                                            </div>
                                            <Badge variant={STATUS_BADGE[req.status] || 'outline'} className="text-[10px]">
                                                {STATUS_LABEL[req.status] || req.status}
                                            </Badge>
                                        </div>
                                    </Link>
                                    
                                    {['SUBMITTED', 'SCHEDULED', 'DIAGNOSED', 'QUOTED'].includes(req.status) && (
                                        <button
                                            onClick={(e) => handleCancelRequest(e, req.id)}
                                            disabled={cancellingId === req.id}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-destructive transition-colors rounded-full hover:bg-destructive/10"
                                            title="Cancelar Servicio"
                                        >
                                            <XCircle size={18} />
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
