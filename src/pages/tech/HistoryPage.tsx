import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { 
    CheckCircle2, Wrench, Calendar, ChevronRight, Search, Car, 
    Archive, ShieldCheck, Hash, User, Clock, MapPin, 
    Activity, Signal, Terminal, Radio, Truck, ArrowRight,
    MoveRight, Zap, Target
} from 'lucide-react';
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
            toast({ title: 'ERROR_CONEXIÓN', description: 'No se pudo sincronizar el archivo de misiones.', type: 'error' });
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
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-10 font-inter animate-in fade-in duration-1000">
                <div className="relative">
                    <div className="w-24 h-24 border-[8px] border-slate-100 border-t-emerald-500 rounded-[2.5rem] animate-spin shadow-3xl shadow-emerald-500/20"></div>
                    <Archive size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500 animate-pulse" />
                </div>
                <div className="text-center space-y-2">
                    <p className="text-slate-950 font-black uppercase text-xl tracking-[0.4em] italic leading-none">QUERY_ARCHIVE_SECTOR</p>
                    <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.6em] italic animate-pulse">ESTABLISHING_LINK_v4.2</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-16 pb-32 animate-in fade-in slide-in-from-bottom-12 duration-1000 px-4 md:px-8 font-inter">
            
            {/* Header: Mission Record Archive */}
            <header className="relative group">
                <div className="absolute inset-0 bg-emerald-500/10 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-1000"></div>
                <div className="relative z-10 bg-slate-950 rounded-[2.5rem] p-12 md:p-24 overflow-hidden border border-white/5 shadow-3xl">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-bl-[15rem] pointer-events-none group-hover:scale-110 transition-transform duration-1000"></div>
                    
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                        <div className="space-y-10 text-center lg:text-left">
                            <div className="flex items-center justify-center lg:justify-start gap-6">
                                <div className="w-16 h-16 bg-white/5 backdrop-blur-3xl rounded-[1.8rem] flex items-center justify-center text-emerald-500 border border-white/10 shadow-3xl group-hover:rotate-12 transition-transform duration-700">
                                    <Archive size={32} />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-emerald-500 font-black text-[11px] uppercase tracking-[0.6em] italic block">DENVER_MISSION_ARCHIVE</span>
                                    <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[9px] italic flex items-center gap-3">
                                       DATABASE_LINK: <span className="text-white">SECURE_v3.4.0</span>
                                    </p>
                                </div>
                            </div>
                            <h1 className="text-6xl md:text-9xl font-black italic uppercase tracking-tighter leading-[0.8] text-white">
                                ARCHIVO DE<br />
                                <span className="text-emerald-500 italic transition-colors duration-1000 group-hover:text-white">SERVICIOS</span>
                            </h1>
                        </div>
                        
                        <div className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] p-12 border border-white/10 text-center min-w-[320px] shadow-3xl group-hover:bg-white/10 transition-all duration-700 relative overflow-hidden group/count">
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/10 blur-3xl rounded-full group-hover/count:scale-150 transition-transform duration-1000"></div>
                            <div className="flex flex-col items-center gap-4 relative z-10">
                                <div className="flex items-center gap-3 bg-emerald-500/20 px-6 py-2 rounded-full border border-emerald-500/20">
                                    <CheckCircle2 size={14} className="text-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.4em] pt-0.5">VERIFIED_OPS</span>
                                </div>
                                <p className="text-white font-black text-8xl md:text-9xl italic tracking-tighter leading-none group-hover/count:text-emerald-500 transition-colors duration-700">
                                    {history.length.toString().padStart(2, '0')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Matrix Search: Tactical Interface */}
            <div className="relative group/search">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-primary/10 rounded-[2.5rem] blur opacity-25 group-focus-within/search:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center bg-white p-2 rounded-[2.5rem] shadow-3xl shadow-slate-200/40 border border-transparent group-focus-within/search:border-emerald-500/20">
                    <div className="w-20 h-16 flex items-center justify-center text-slate-300 group-focus-within/search:text-emerald-500 transition-colors duration-500">
                        <Search size={32} />
                    </div>
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="BUSCAR EXPEDIENTE: TICKET, VIN, CLIENTE O PROTOCOLO..."
                        className="flex-1 bg-transparent border-none h-16 text-xl font-black uppercase tracking-widest placeholder:text-slate-200 focus:ring-0 italic"
                    />
                    <div className="hidden md:flex items-center gap-4 pr-10">
                        <div className="h-4 w-[1px] bg-slate-100"></div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic opacity-60"> Denver_Detroit_Net</span>
                    </div>
                </div>
            </div>

            {/* Archive Matrix Grid */}
            {filtered.length === 0 ? (
                <div className="py-48 text-center bg-white rounded-[2.5rem] border-8 border-dashed border-slate-50 flex flex-col items-center gap-12 group transition-all hover:border-slate-100">
                     <div className="relative">
                        <div className="w-48 h-48 bg-slate-50 rounded-[2.5rem] shadow-inner flex items-center justify-center text-slate-100 border border-slate-50 rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-all duration-1000 group-hover:text-amber-500">
                            <Archive size={96} className="opacity-40" />
                        </div>
                        <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-slate-950 rounded-[2.5rem] flex items-center justify-center text-white shadow-3xl animate-denver-in">
                            <Search size={48} className="text-amber-500 shadow-amber-500/50 shadow-xl" />
                        </div>
                     </div>
                    <div className="space-y-6 max-w-lg mx-auto px-10">
                        <h3 className="text-5xl font-black text-slate-950 uppercase tracking-tighter italic leading-none">{search ? 'CONSULTA_SIN_RESULTADOS' : 'ARCHIVO_EN_BLANCO'}</h3>
                        <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.6em] leading-relaxed italic opacity-80">
                            {search ? 'EL TÉRMINO NO MATCH CON NINGÚN EXPEDIENTE DE MISIONES PASADAS.' : 'EL SISTEMA NO DETECTA MISIONES COMPLETADAS REGISTRADAS EN SU TERMINAL.'}
                        </p>
                    </div>
                    {search && (
                        <Button 
                            onClick={() => setSearch('')} 
                            className="bg-slate-950 h-20 px-16 rounded-[2rem] font-black text-[11px] tracking-[0.4em] text-white uppercase hover:bg-emerald-500 transition-all border-none italic"
                        >
                            VER_TODO_EL_ARCHIVO
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-12">
                    {filtered.map((appt, idx) => {
                        const sr = appt.service_requests;
                        const vehicle = sr?.vehicles;
                        const client = sr?.profiles;
                        const completedDate = new Date(appt.scheduled_start);

                        return (
                            <Link key={appt.id} to={`/tech/requests/${sr?.id}`} className="block group/card">
                                <Card className="border-none shadow-3xl shadow-slate-200/40 bg-white rounded-[2.5rem] overflow-hidden group-hover/card:shadow-emerald-500/20 hover:-translate-y-4 transition-all duration-700 relative border border-transparent hover:border-slate-100">
                                    <div className="absolute top-0 left-0 w-3 h-full bg-emerald-500/10 group-hover/card:bg-emerald-500 transition-all duration-1000"></div>
                                    <div className="flex flex-col lg:flex-row">
                                        
                                        {/* Date Sidebar: Archive Stamp */}
                                        <div className="w-full lg:w-[450px] bg-slate-950 p-12 md:p-20 flex flex-col justify-center items-center text-white text-center gap-10 relative overflow-hidden shrink-0 group-hover/card:bg-emerald-500 transition-colors duration-1000">
                                            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none opacity-40 group-hover/card:opacity-20" />
                                            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full group-hover/card:bg-white/10 transition-colors" />
                                            
                                            <div className="w-24 h-24 bg-white/5 backdrop-blur-3xl rounded-[2.5rem] flex items-center justify-center text-emerald-500 group-hover/card:text-slate-950 group-hover/card:rotate-12 transition-all duration-700 border border-white/10 shadow-3xl">
                                                <Calendar size={48} className="stroke-[2.5]" />
                                            </div>
                                            
                                            <div className="space-y-4 relative z-10">
                                                <p className="text-[11px] font-black uppercase text-slate-500 tracking-[0.8em] italic mb-3 group-hover/card:text-slate-950 transition-colors">OP_COMP_STAMP</p>
                                                <div className="flex flex-col items-center scale-110">
                                                    <p className="text-8xl md:text-9xl font-black italic tracking-tighter leading-[0.7] text-white uppercase group-hover/card:text-slate-950 transition-colors font-mono">
                                                        {completedDate.toLocaleDateString('es-ES', { day: '2-digit' })}
                                                    </p>
                                                    <div className="flex items-center gap-4 mt-12 bg-white/5 px-10 py-3.5 rounded-full border border-white/10 shadow-3xl group-hover/card:bg-slate-950 group-hover/card:border-slate-950 transition-colors">
                                                        <Clock size={18} className="text-emerald-500" />
                                                        <span className="text-[12px] font-black uppercase tracking-[0.6em] italic pt-1">
                                                            {completedDate.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()} {completedDate.getFullYear()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* History Operational Content */}
                                        <CardContent className="flex-1 p-12 md:p-24 space-y-16">
                                            <div className="flex flex-col md:flex-row justify-between items-start gap-12">
                                                <div className="space-y-10">
                                                    <div className="flex flex-wrap items-center gap-6">
                                                        <Badge className="bg-emerald-500 text-white px-10 py-3.5 text-[11px] font-black uppercase tracking-[0.5em] italic border-none shadow-3xl rounded-full group-hover/card:bg-slate-950 transition-colors duration-700">
                                                            VERIFICADO_OK
                                                        </Badge>
                                                        <div className="flex items-center gap-4 px-8 py-3.5 bg-slate-50 rounded-full border border-slate-100 shadow-inner group-hover/card:bg-white transition-all">
                                                            <Hash size={16} className="text-emerald-500" /> 
                                                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] italic">TICKET: #{sr?.ticket_number || 'UNKNOWN'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-6">
                                                        <h3 className="text-7xl lg:text-8xl font-black text-slate-950 leading-[0.75] uppercase italic tracking-tighter group-hover/card:text-emerald-500 transition-colors duration-700 scale-105 origin-left">
                                                            {vehicle ? (
                                                                <>
                                                                    {vehicle.make} <br />
                                                                    <span className="opacity-20 italic">{vehicle.model} {vehicle.year}</span>
                                                                </>
                                                            ) : 'ASSET_UNKNOWN'}
                                                        </h3>
                                                        <div className="flex items-center gap-6 text-slate-400 font-black uppercase text-[12px] tracking-[0.5em] italic opacity-60 group-hover/card:opacity-100 transition-opacity">
                                                            <User size={20} className="text-emerald-500" /> 
                                                            PROPIETARIO: {client ? `${client.first_name} ${client.last_name || ''}` : 'DENVER_CLIENT'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-[2.5rem] flex items-center justify-center group-hover/card:bg-slate-950 group-hover/card:text-emerald-500 transition-all duration-700 shadow-inner group-hover/card:-rotate-12 border border-slate-50">
                                                        <Archive size={54} className="stroke-[2.5]" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 pt-16 border-t border-slate-50 items-center">
                                                <div className="lg:col-span-2 flex items-center gap-10 p-12 bg-slate-50 rounded-[2.5rem] border border-slate-100 group-hover/card:bg-white group-hover/card:shadow-3xl group-hover/card:shadow-slate-200/40 transition-all duration-700">
                                                    <div className="w-24 h-24 bg-white rounded-[2.2rem] flex items-center justify-center text-emerald-500 shadow-3xl border border-slate-50 group-hover/card:scale-110 transition-transform duration-700"><Wrench size={42} /></div>
                                                    <div className="space-y-2">
                                                        <p className="text-[12px] font-black text-slate-300 uppercase tracking-[0.8em] mb-2 italic leading-none flex items-center gap-3">
                                                           PROTOCOL_NAME <div className="w-10 h-[1.5px] bg-emerald-500"></div>
                                                        </p>
                                                        <span className="text-3xl font-black uppercase text-slate-950 italic tracking-tighter leading-tight">{sr?.service_catalog?.name || 'GENERIC_MAINTENANCE'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end items-center gap-10">
                                                    <div className="text-right hidden sm:block space-y-3">
                                                        <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.6em] italic leading-none">ARCHIVE_CLEARANCE</p>
                                                        <div className="flex justify-end gap-2">
                                                            <div className="w-12 h-2.5 bg-emerald-500 rounded-full group-hover/card:w-20 transition-all duration-1000"></div>
                                                            <div className="w-2.5 h-2.5 bg-slate-100 rounded-full"></div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-slate-950 text-white h-24 px-12 rounded-full font-black text-[13px] tracking-[0.5em] uppercase italic flex items-center gap-8 shadow-3xl hover:bg-emerald-500 hover:text-white transition-all cursor-pointer group-hover/card:animate-denver-in active:scale-95">
                                                        CONSULTAR <ArrowRight size={28} className="group-hover/card:translate-x-4 transition-transform duration-700" />
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </div>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
