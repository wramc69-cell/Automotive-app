import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
    FileText, Search, Filter, Calendar,
    ChevronRight, Eye, User, CarFront, Wrench,
    Activity, ShieldCheck, Zap
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

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-10 px-4 animate-in fade-in duration-1000">
            <div className="relative">
                <div className="w-24 h-24 border-[10px] border-white/5 border-t-primary rounded-[2.5rem] animate-spin shadow-3xl shadow-primary/20"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="w-8 h-8 text-primary animate-pulse" />
                </div>
            </div>
            <div className="text-center space-y-2">
                <p className="text-white font-black uppercase text-xl tracking-[0.6em] italic leading-none">QUERYING_DENVER_NET</p>
                <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.8em] italic animate-pulse">ESTABLISHING_HIGH_SPEED_LINK</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-[1700px] mx-auto space-y-16 pb-40 animate-in fade-in slide-in-from-bottom-12 duration-1000 px-4 mt-8 font-inter">
            {/* Header: Dispatch Command Terminal (Enhanced Dark) */}
            <header className="relative p-12 md:p-20 bg-white/5 backdrop-blur-3xl rounded-[3rem] overflow-hidden shadow-3xl border border-white/10">
                <div className="absolute top-0 right-0 w-[50%] h-full bg-gradient-to-l from-primary/10 via-transparent to-transparent pointer-events-none"></div>
                <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] bg-primary/10 blur-[200px] rounded-full pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col xl:flex-row justify-between items-center gap-16">
                    <div className="flex flex-col md:flex-row items-center gap-12 w-full xl:w-auto">
                        <div className="w-28 h-28 md:w-36 md:h-36 bg-slate-950 rounded-[3rem] flex items-center justify-center border border-white/10 shadow-3xl group shrink-0 relative overflow-hidden">
                            <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/15 transition-all"></div>
                            <FileText className="w-14 h-14 md:w-20 md:h-20 text-primary group-hover:scale-110 transition-transform duration-1000 relative z-10" />
                        </div>
                        <div className="text-center md:text-left space-y-10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 justify-center md:justify-start">
                                    <div className="w-10 h-[2px] bg-primary rounded-full"></div>
                                    <span className="text-primary font-black text-[11px] uppercase tracking-[0.8em] italic block pt-0.5">ESTACIÓN_DESPACHO_CENTRAL</span>
                                </div>
                                <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.8]">Monitor de<br /><span className="text-primary">Misiones</span></h1>
                            </div>
                            
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-10 bg-slate-950 px-10 py-6 rounded-[2.5rem] border border-white/5 w-fit shadow-2xl">
                                <div className="flex flex-col text-center">
                                    <span className="text-slate-500 font-bold text-[10px] tracking-[0.4em] uppercase mb-2">TOTAL_OP</span>
                                    <span className="text-white font-black text-4xl italic tracking-tighter">{requests.length.toString().padStart(2, '0')}</span>
                                </div>
                                <div className="w-[1px] h-12 bg-white/10"></div>
                                <div className="flex flex-col text-center">
                                    <span className="text-slate-500 font-bold text-[10px] tracking-[0.4em] uppercase mb-2 text-rose-500/60">PENDING</span>
                                    <span className="text-rose-500 font-black text-4xl italic tracking-tighter">{requests.filter(r => !r.appointments?.[0]).length.toString().padStart(2, '0')}</span>
                                </div>
                                <div className="w-[1px] h-12 bg-white/10"></div>
                                <div className="flex flex-col text-center">
                                    <span className="text-slate-500 font-bold text-[10px] tracking-[0.4em] uppercase mb-2 text-primary/60">COMPLETED</span>
                                    <span className="text-primary font-black text-4xl italic tracking-tighter">{requests.filter(r => r.status === 'COMPLETED').length.toString().padStart(2, '0')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Precision Control Console (Premium Dark) */}
            <div className="flex flex-col xl:flex-row gap-10">
                <div className="relative flex-1 group">
                    <div className="absolute left-12 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary group-focus-within:scale-110 transition-all duration-700">
                        <Search size={32} />
                    </div>
                    <input
                        placeholder="Rastrear expediente, cliente o ID de misión..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-28 pl-28 pr-12 rounded-[2.5rem] bg-white/5 backdrop-blur-3xl border border-white/5 hover:border-white/10 shadow-3xl font-black text-white placeholder:text-slate-600 focus:border-primary focus:bg-white/10 outline-none transition-all text-[15px] uppercase tracking-[0.3em] italic"
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-8 shrink-0">
                    <div className="h-28 w-28 bg-slate-950 rounded-[2.5rem] flex items-center justify-center text-primary shadow-3xl border border-white/5 hover:rotate-12 transition-all duration-700">
                        <Filter size={36} />
                    </div>
                    <div className="relative">
                        <select
                            className="h-28 border border-white/5 rounded-[2.5rem] px-14 text-[14px] font-black uppercase tracking-[0.4em] italic bg-slate-950 text-white shadow-3xl hover:border-white/10 focus:border-primary outline-none appearance-none cursor-pointer min-w-[380px] transition-all"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            {statuses.map(s => <option key={s} value={s}>{translateStatus(s).toUpperCase()}</option>)}
                        </select>
                        <div className="absolute right-12 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
                            <ChevronRight size={28} className="rotate-90" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Grid: High-Fidelity Tactical Feed */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                {filtered.map(req => {
                    const appointment = req.appointments?.[0];
                    const tech = appointment?.profiles;
                    
                    return (
                        <Card key={req.id} className="group relative rounded-[3rem] border border-white/5 shadow-3xl overflow-hidden bg-white/5 backdrop-blur-3xl hover:bg-white/10 transition-all duration-700 active:scale-[0.98]">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-[2000ms] pointer-events-none blur-3xl"></div>
                            
                            <CardContent className="p-12 md:p-16 relative z-10">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-20">
                                    <div className="space-y-8">
                                        <div className="flex flex-wrap items-center gap-6">
                                            <div className="bg-slate-950 text-white px-8 py-4 rounded-2xl shadow-3xl border border-white/10 flex items-center gap-4 group-hover:border-primary/40 transition-colors">
                                                <span className="text-[11px] font-black italic tracking-widest text-primary opacity-60">ID_REF</span>
                                                <div className="w-[1px] h-5 bg-white/10"></div>
                                                <span className="text-2xl font-black italic tracking-tighter text-white">#{req.ticket_number || req.id.slice(0,5).toUpperCase()}</span>
                                            </div>
                                            <Badge className={`h-14 text-[11px] font-black tracking-[0.4em] uppercase px-10 rounded-2xl border-none shadow-3xl italic ${
                                                req.status === 'COMPLETED' ? 'bg-emerald-500 text-white' :
                                                req.status === 'DECLINED' || req.status === 'CANCELED' ? 'bg-rose-500 text-white' :
                                                req.status === 'APPROVED' ? 'bg-indigo-600 text-white' :
                                                req.status === 'SCHEDULED' ? 'bg-primary text-slate-950' :
                                                req.status === 'QUOTED' ? 'bg-amber-400 text-slate-950' : 'bg-white/10 text-white/50'
                                            }`}>
                                                {translateStatus(req.status)}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end shrink-0">
                                        <div className="bg-white/5 px-8 py-4 rounded-2xl border border-white/5 shadow-inner">
                                            <p className="text-[16px] font-black text-white uppercase italic tracking-tighter leading-none">{new Date(req.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase()}</p>
                                        </div>
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.6em] mt-4 italic">SYNC_STAMP: {new Date(req.created_at).getUTCFullYear()}</p>
                                    </div>
                                </div>

                                <div className="space-y-16">
                                    {/* Client and Vehicle Asset (Enhanced Dark) */}
                                    <div className="flex items-center gap-10">
                                        <div className="w-28 h-28 bg-slate-950 rounded-[2.5rem] flex items-center justify-center text-primary group-hover:scale-110 group-hover:rotate-[15deg] transition-all duration-1000 shadow-3xl border border-white/5 shrink-0">
                                            <CarFront size={56} strokeWidth={1.5} />
                                        </div>
                                        <div className="space-y-4 min-w-0">
                                            <h3 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none group-hover:text-primary transition-all truncate">{req.profiles?.first_name} {req.profiles?.last_name}</h3>
                                            <div className="flex items-center gap-5 bg-white/5 w-fit px-8 py-3 rounded-2xl border border-white/5">
                                                <Activity size={16} className="text-primary animate-pulse" />
                                                <p className="text-[13px] text-slate-400 font-black uppercase tracking-[0.3em] italic truncate">{req.vehicles?.year} {req.vehicles?.make} {req.vehicles?.model}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tech Assignment Node (Tactical Dark) */}
                                    <div className="bg-slate-950 rounded-[3rem] p-12 flex flex-col md:flex-row items-center justify-between gap-10 group/tech border border-white/5 shadow-3xl hover:bg-black/40 transition-all duration-700 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20 group-hover/tech:bg-primary transition-all"></div>
                                        {tech ? (
                                            <div className="flex items-center gap-10">
                                                <div className="w-20 h-20 bg-white/5 rounded-[1.8rem] flex items-center justify-center text-primary border border-white/10 shadow-3xl ring-4 ring-white/5 group-hover/tech:rotate-12 transition-transform">
                                                    <Wrench size={40} />
                                                </div>
                                                <div className="space-y-3">
                                                    <p className="text-[16px] font-black text-white uppercase italic tracking-widest leading-none border-b-2 border-primary/20 group-hover/tech:border-primary transition-all pb-1">{tech.first_name} {tech.last_name}</p>
                                                    <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500 uppercase tracking-[0.5em] italic">
                                                        <Activity size={14} className="text-emerald-500" /> STS: {appointment.status}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-10">
                                                <div className="w-20 h-20 bg-rose-500/10 rounded-[1.8rem] flex items-center justify-center text-rose-500 border border-rose-500/20 shadow-2xl animate-pulse">
                                                    <User size={40} />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-[14px] font-black uppercase tracking-[0.3em] italic text-rose-500">PENDIENTE_DESPACHO</p>
                                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.5em] italic">REQUIRES_ASSET_ALLOCATION</p>
                                                </div>
                                            </div>
                                        )}
                                        <Link to={`/admin/requests/${req.id}`} className="w-full md:w-auto relative z-10">
                                            <Button className="w-full md:w-28 h-28 rounded-[2rem] bg-primary text-slate-950 hover:bg-white hover:text-slate-950 transition-all duration-700 shadow-3xl border-none group-hover/tech:scale-110 active:scale-95 flex items-center justify-center">
                                                <ChevronRight size={48} className="group-hover/tech:translate-x-2 transition-transform duration-700" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                            
                            <div className="h-4 w-full bg-white/5 group-hover:bg-primary transition-all duration-1000 shadow-[0_-20px_50px_rgba(255,46,91,0.2)]"></div>
                        </Card>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <div className="py-72 text-center bg-white/5 backdrop-blur-3xl rounded-[4rem] border-2 border-dashed border-white/5 space-y-12 group overflow-hidden relative shadow-inner">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse duration-[3000ms]"></div>
                    <div className="w-48 h-48 bg-slate-950 rounded-[3rem] flex items-center justify-center text-slate-800 mx-auto shadow-3xl border border-white/5 relative z-10 group-hover:scale-110 transition-transform duration-1000">
                        <Search size={100} className="group-hover:rotate-12 transition-transform duration-1000 opacity-20" />
                    </div>
                    <div className="space-y-8 relative z-10">
                        <h3 className="text-6xl md:text-7xl font-black italic uppercase tracking-tighter text-white/20 leading-none">Canal Vacío</h3>
                        <p className="text-[18px] font-black text-slate-600 uppercase tracking-[0.8em] italic leading-loose opacity-60">
                            NO_SE_DETECTAN_SEÑALES_DE_MISIÓN_EN_ESTE_CUADRANTE
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
