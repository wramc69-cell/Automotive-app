import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Calendar, Wrench, PlusCircle, Inbox } from 'lucide-react';

const STATUS_BADGE: Record<string, 'warning' | 'success' | 'destructive' | 'secondary' | 'outline'> = {
    DRAFT: 'outline',
    SUBMITTED: 'warning',
    SCHEDULED: 'secondary',
    DIAGNOSED: 'secondary',
    QUOTED: 'warning',
    APPROVED: 'success',
    COMPLETED: 'success',
    CANCELED: 'destructive',
    DECLINED: 'destructive',
};

const STATUS_LABEL: Record<string, string> = {
    DRAFT: 'Borrador',
    SUBMITTED: 'Solicitado',
    SCHEDULED: 'Programado',
    DIAGNOSED: 'Diagnosticado',
    QUOTED: 'Pendiente Cotización',
    APPROVED: 'Aprobado',
    COMPLETED: 'Completado',
    CANCELED: 'Cancelado',
    DECLINED: 'Rechazado',
};

export function RequestsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) loadRequests();
    }, [user]);

    async function loadRequests() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('service_requests')
                .select('*, vehicles(make, model, year), service_catalog(name)')
                .eq('customer_user_id', user!.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (err: any) {
            console.error('Error loading requests:', err);
            toast({ title: 'Error', description: 'No se pudieron cargar tus solicitudes.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteDraft(id: string) {
        const isSubmitted = requests.find(r => r.id === id)?.status === 'SUBMITTED';
        const msg = isSubmitted 
            ? '¿Estás seguro de que deseas eliminar esta solicitud? Aún no ha sido procesada.'
            : '¿Estás seguro de que deseas eliminar este borrador? Esta acción no se puede deshacer.';

        if (!window.confirm(msg)) return;
        
        try {
            const { error } = await supabase
                .from('service_requests')
                .delete()
                .eq('id', id);

            if (error) throw error;
            
            toast({ title: isSubmitted ? 'Solicitud eliminada' : 'Borrador eliminado', description: 'El servicio ha sido removido.', type: 'success' });
            loadRequests();
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, type: 'error' });
        }
    }

    async function handleCancelRequest(id: string) {
        if (!window.confirm('¿Estás seguro de que deseas cancelar este servicio?')) return;
        
        try {
            await supabase.from('service_requests').update({ status: 'CANCELED' }).eq('id', id);
            // Optionally update appointments if they exist
            await supabase.from('appointments').update({ status: 'CANCELED' }).eq('request_id', id);
            
            toast({ title: 'Cancelado', description: 'El servicio ha sido cancelado.', type: 'info' });
            loadRequests();
        } catch(err: any) {
            toast({ title: 'Error', description: err.message, type: 'error' });
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-muted-foreground text-sm">Cargando tus solicitudes...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Mis Solicitudes</h1>
                    <p className="text-muted-foreground">Historial de servicios y presupuestos actuales.</p>
                </div>
                <Link to="/app/chat">
                    <Button className="gap-2">
                        <PlusCircle size={16} /> Agendar Nuevo
                    </Button>
                </Link>
            </div>

            {requests.length === 0 ? (
                <Card>
                    <CardContent className="py-20 text-center flex flex-col items-center gap-4 text-muted-foreground">
                        <Inbox size={48} className="opacity-20" />
                        <div>
                            <h3 className="font-semibold text-slate-600 text-lg">Sin solicitudes aún</h3>
                            <p className="text-sm mt-1">Cuando agendes tu primer servicio aparecerá aquí.</p>
                        </div>
                        <Link to="/app/chat">
                            <Button variant="outline" className="mt-2 gap-2">
                                <Calendar size={16} /> Agendar mi primer servicio
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Ticket ID</TableHead>
                                <TableHead>Vehículo</TableHead>
                                <TableHead>Servicio</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-bold text-primary">
                                        #{req.ticket_number || 'S/N'}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap flex items-center gap-2">
                                        <Wrench size={14} className="text-slate-400 shrink-0" />
                                        {req.vehicles
                                            ? `${req.vehicles.year} ${req.vehicles.make} ${req.vehicles.model}`
                                            : '—'}
                                    </TableCell>
                                    <TableCell>{req.service_catalog?.name || req.description || '—'}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(req.created_at).toLocaleDateString('es-US', {
                                            day: '2-digit', month: 'short', year: 'numeric'
                                        })}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={STATUS_BADGE[req.status] || 'outline'}>
                                            {STATUS_LABEL[req.status] || req.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {(req.status === 'DRAFT' || req.status === 'SUBMITTED') && (
                                                <Link to={`/app/schedule?request_id=${req.id}`}>
                                                    <Button variant="outline" size="sm" className="text-primary border-primary/20 hover:bg-primary/5">
                                                        {req.status === 'DRAFT' ? 'Completar' : 'Agendar Visita'}
                                                    </Button>
                                                </Link>
                                            )}
                                            
                                            {(req.status === 'DRAFT' || req.status === 'SUBMITTED') && (
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="text-destructive border-destructive/20 hover:bg-destructive/5"
                                                    onClick={() => handleDeleteDraft(req.id)}
                                                >
                                                    Eliminar
                                                </Button>
                                            )}

                                            {['SCHEDULED', 'DIAGNOSED', 'QUOTED'].includes(req.status) && (
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="text-destructive border-destructive/20 hover:bg-destructive/5"
                                                    onClick={() => handleCancelRequest(req.id)}
                                                >
                                                    Cancelar
                                                </Button>
                                            )}

                                            <Link to={`/app/requests/${req.id}`}>
                                                <Button variant="ghost" size="sm">Ver Detalles</Button>
                                            </Link>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}
        </div>
    );
}
