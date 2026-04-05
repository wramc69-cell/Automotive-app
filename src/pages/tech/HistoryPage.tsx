import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { CheckCircle2, Wrench, Calendar, ChevronRight, Search, Car } from 'lucide-react';
import { Input } from '../../components/ui/Input';

export function TechHistoryPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (user) loadHistory();
    }, [user]);

    async function loadHistory() {
        setLoading(true);
        try {
            // Fetch all appointments for this tech linked to COMPLETED service requests
            const { data, error } = await supabaseAdmin
                .from('appointments')
                .select(`
                    *,
                    service_requests!inner (
                        id,
                        ticket_number,
                        status,
                        updated_at,
                        vehicles (year, make, model, odometer),
                        service_catalog:requested_service_id (name),
                        profiles:customer_user_id (first_name, last_name)
                    )
                `)
                .eq('assigned_tech_user_id', user!.id)
                .eq('service_requests.status', 'COMPLETED')
                .order('scheduled_start', { ascending: false });

            if (error) throw error;

            // Deduplicate by request id
            const seen = new Set();
            const unique = (data || []).filter((a: any) => {
                const rid = a.service_requests?.id;
                if (!rid || seen.has(rid)) return false;
                seen.add(rid);
                return true;
            });

            setHistory(unique);
        } catch (err: any) {
            console.error('loadHistory error:', err);
            toast({ title: 'Error', description: 'No se pudo cargar el historial.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }

    const filtered = history.filter(a => {
        const sr = a.service_requests;
        const term = search.toLowerCase();
        return (
            sr?.ticket_number?.toLowerCase().includes(term) ||
            sr?.vehicles?.make?.toLowerCase().includes(term) ||
            sr?.vehicles?.model?.toLowerCase().includes(term) ||
            sr?.service_catalog?.name?.toLowerCase().includes(term) ||
            sr?.profiles?.first_name?.toLowerCase().includes(term) ||
            sr?.profiles?.last_name?.toLowerCase().includes(term)
        );
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Cargando historial...</p>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-in pb-24">
            {/* Header */}
            <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                                <CheckCircle2 className="text-emerald-400" size={22} />
                            </div>
                            <span className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.3em]">Registro de Trabajo</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
                            Historial de Servicios
                        </h1>
                        <p className="text-slate-400 font-medium mt-2">
                            {history.length} servicio{history.length !== 1 ? 's' : ''} completado{history.length !== 1 ? 's' : ''} en total
                        </p>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl px-8 py-5 text-center">
                        <p className="text-4xl font-black text-emerald-400">{history.length}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Total Completados</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por ticket, vehículo, cliente o servicio..."
                    className="pl-14 h-14 rounded-2xl border-slate-200 bg-white shadow-sm text-sm font-medium"
                />
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <Card className="p-20 rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
                    <CheckCircle2 size={48} className="text-slate-200 mb-6" />
                    <h3 className="text-xl font-black uppercase italic text-slate-400 leading-tight">
                        {search ? 'Sin resultados para esa búsqueda' : 'Aún no tienes servicios completados'}
                    </h3>
                    <p className="text-slate-300 text-sm font-medium mt-2">
                        {search ? 'Intenta con otros términos.' : 'Los servicios que marques como efectuados aparecerán aquí.'}
                    </p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filtered.map((appt) => {
                        const sr = appt.service_requests;
                        const vehicle = sr?.vehicles;
                        const client = sr?.profiles;
                        const completedDate = new Date(appt.scheduled_start);

                        return (
                            <Card key={appt.id} className="group border-none shadow-xl shadow-slate-100 rounded-3xl overflow-hidden hover:shadow-2xl hover:scale-[1.005] transition-all duration-300">
                                <CardContent className="p-0 flex flex-col md:flex-row">
                                    {/* Date Sidebar */}
                                    <div className="bg-emerald-500 md:w-36 p-6 flex flex-col justify-center items-center text-white text-center gap-1 shrink-0">
                                        <CheckCircle2 size={20} className="opacity-70 mb-1" />
                                        <p className="font-black text-2xl leading-none">
                                            {completedDate.toLocaleDateString('es-ES', { day: '2-digit' })}
                                        </p>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">
                                            {completedDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>

                                    {/* Main Content */}
                                    <div className="flex-1 p-6 md:p-8 space-y-4">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge className="bg-emerald-100 text-emerald-700 border-none text-[9px] font-black uppercase tracking-widest px-3">
                                                        ✅ COMPLETADO
                                                    </Badge>
                                                    <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                                                        Ticket #{sr?.ticket_number || 'S/N'}
                                                    </span>
                                                </div>
                                                <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">
                                                    {vehicle ? `${vehicle.year || ''} ${vehicle.make} ${vehicle.model}` : 'Vehículo Denver'}
                                                </h3>
                                                {client && (
                                                    <p className="text-sm font-bold text-slate-500">
                                                        Cliente: {client.first_name} {client.last_name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-4 pt-3 border-t border-slate-50">
                                            <div className="flex items-center gap-2">
                                                <Wrench size={14} className="text-emerald-600" />
                                                <span className="text-sm font-bold uppercase tracking-tighter text-slate-700">
                                                    {sr?.service_catalog?.name || 'Inspección General'}
                                                </span>
                                            </div>
                                            {vehicle?.odometer && (
                                                <div className="flex items-center gap-2">
                                                    <Car size={14} className="text-slate-400" />
                                                    <span className="text-sm font-medium text-slate-500">
                                                        {vehicle.odometer.toLocaleString('en-US')} mi
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-slate-400" />
                                                <span className="text-sm font-medium text-slate-500">
                                                    {completedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <div className="p-6 flex items-center justify-center bg-slate-50 md:border-l border-slate-100 shrink-0">
                                        <Link to={`/tech/requests/${sr?.id}`}>
                                            <Button
                                                variant="ghost"
                                                className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-emerald-600 hover:text-white transition-all group-hover:translate-x-1"
                                            >
                                                Ver Detalle <ChevronRight size={16} className="ml-2" />
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
