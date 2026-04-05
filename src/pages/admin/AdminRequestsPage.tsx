import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import {
    FileText, Search, Filter, Calendar,
    ChevronRight, Eye, User, CarFront, Wrench
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { Link } from 'react-router-dom';

export function AdminRequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadRequests();
    }, [filterStatus]);

    async function loadRequests() {
        setLoading(true);
        try {
            // Using supabaseAdmin to bypass RLS for administrative overview
            let query = supabaseAdmin
                .from('service_requests')
                .select('*, profiles(first_name, last_name), vehicles(make, model, year), appointments(assigned_tech_user_id, status, profiles(first_name, last_name))')
                .order('created_at', { ascending: false });

            if (filterStatus !== 'ALL') {
                query = query.eq('status', filterStatus);
            }

            const { data, error } = await query;
            if (error) throw error;
            setRequests(data || []);
        } catch (err) {
            console.error('Error loadRequests:', err);
        } finally {
            setLoading(false);
        }
    }

    const translateStatus = (status: string) => {
        const mapping: Record<string, string> = {
            'DRAFT': 'BORRADOR',
            'SCHEDULED': 'AGENDADO',
            'EN_ROUTE': 'EN CAMINO',
            'ARRIVED': 'EN SITIO',
            'IN_PROGRESS': 'EN PROCESO',
            'DIAGNOSED': 'DIAGNOSTICADO',
            'QUOTED': 'COTIZADO',
            'APPROVED': 'APROBADO',
            'COMPLETED': 'COMPLETADO',
            'DECLINED': 'RECHAZADO',
            'CANCELED': 'CANCELADO'
        };
        return mapping[status] || status;
    };

    const filtered = requests.filter(r =>
        r.profiles?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.profiles?.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.vehicles?.make.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const statuses = ['ALL', 'DRAFT', 'SCHEDULED', 'IN_PROGRESS', 'DIAGNOSED', 'QUOTED', 'APPROVED', 'COMPLETED', 'DECLINED', 'CANCELED'];

    if (loading) return <div className="p-10 text-center animate-pulse text-indigo-600 font-bold italic">Cargando todas las solicitudes...</div>;

    return (
        <div className="space-y-6 pb-20 animate-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                        <FileText className="text-indigo-600" /> Panel de Servicios
                    </h1>
                    <p className="text-slate-500 font-medium">Control centralizado de todas las solicitudes y técnicos.</p>
                </div>
            </div>

            <Card className="bg-white border-slate-200 shadow-xl shadow-slate-100 rounded-3xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row items-center gap-4 py-6">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                            placeholder="Buscar por cliente o vehículo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 h-12 border-slate-100 focus:ring-indigo-500 bg-white shadow-sm rounded-2xl"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Filter className="text-slate-400 hidden sm:block" size={18} />
                        <select
                            className="h-12 border-slate-100 rounded-2xl px-4 text-xs font-black uppercase tracking-tight bg-white focus:ring-indigo-500 w-full"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            {statuses.map(s => <option key={s} value={s}>{translateStatus(s)}</option>)}
                        </select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 italic">TICKET ID</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">CLIENTE / VEHÍCULO</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">TÉCNICO ASIGNADO</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">ESTADO</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">FECHA</th>
                                    <th className="px-6 py-4 text-right border-b border-slate-100">GESTIÓN</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.map(req => {
                                    const appointment = req.appointments?.[0];
                                    const tech = appointment?.profiles;
                                    
                                    return (
                                        <tr key={req.id} className="hover:bg-indigo-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 shadow-sm">
                                                    #{req.ticket_number || 'S/N'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <User size={12} className="text-indigo-400" />
                                                        <p className="text-sm font-black text-slate-800 leading-none">{req.profiles?.first_name} {req.profiles?.last_name}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <CarFront size={12} className="text-slate-400" />
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase">{req.vehicles?.year} {req.vehicles?.make} {req.vehicles?.model}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {tech ? (
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                                                            <Wrench size={14} />
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <p className="text-[11px] font-black text-slate-900 uppercase italic tracking-tighter">{tech.first_name} {tech.last_name}</p>
                                                            <div className="flex items-center gap-1">
                                                                <div className={`w-1.5 h-1.5 rounded-full ${appointment.status === 'SCHEDULED' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                                                <p className="text-[8px] font-black text-slate-400 uppercase">{appointment.status}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-rose-400">
                                                        <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
                                                            <User size={14} />
                                                        </div>
                                                        <span className="text-[9px] font-black uppercase tracking-widest italic text-rose-500">Sin Asignar</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className={`h-6 text-[9px] font-black tracking-tight uppercase px-3 shadow-sm border-none ${
                                                    req.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' :
                                                    req.status === 'DECLINED' || req.status === 'CANCELED' ? 'bg-rose-100 text-rose-600' :
                                                    req.status === 'APPROVED' ? 'bg-indigo-600 text-white shadow-indigo-100 shadow-md' :
                                                    req.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-600' :
                                                    req.status === 'QUOTED' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {translateStatus(req.status)}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-[10px] font-black text-slate-500 uppercase">{new Date(req.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link to={`/admin/requests/${req.id}`}>
                                                    <Button size="sm" variant="ghost" className="h-9 hover:bg-white hover:shadow-xl px-4 rounded-xl text-indigo-600 font-black text-[10px] border-none">
                                                        GESTIONAR <ChevronRight size={14} className="ml-1" />
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filtered.length === 0 && (
                            <div className="p-20 text-center space-y-4">
                                <div className="p-6 bg-slate-50 rounded-full inline-block border border-slate-100">
                                    <Search size={32} className="text-slate-200" />
                                </div>
                                <p className="text-slate-400 text-sm font-bold italic">No se encontraron solicitudes con esos filtros.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
