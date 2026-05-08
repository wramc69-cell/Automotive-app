import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
    Users, Wrench, UserPlus, 
    Calendar, TrendingUp, Car, CheckCircle2, ShieldCheck, 
    XCircle, Clock, MapPin, Briefcase, Phone, Trash2,
    ChevronRight, MoveRight, AlertCircle, Award, Activity, Search, Zap
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { useToast } from '../../components/ui/Toast';

// --- Interfaces ---
interface TechProfile {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    address?: string;
    avatar_url?: string;
    status: 'PENDING_APPROVAL' | 'ACTIVE' | 'INACTIVE';
    role: string;
    birth_date?: string;
    work_authorized?: boolean;
    experience?: string;
    tech_vehicle_photo_url?: string;
    tech_vehicle_plate?: string;
    tech_vehicle_make?: string;
    tech_vehicle_model?: string;
    tech_vehicle_color?: string;
    created_at: string;
    activeApps: any[];
}

export function AdminTechsPage() {
    const [techs, setTechs] = useState<TechProfile[]>([]);
    const [pendingTechs, setPendingTechs] = useState<TechProfile[]>([]);
    const [unassignedReqs, setUnassignedReqs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteData, setInviteData] = useState({ email: '', first_name: '', last_name: '', role: 'TECH' });
    const [inviting, setInviting] = useState(false);
    const { toast } = useToast();
    const [selection, setSelection] = useState<Record<string, string>>({});
    const [selectedTechJobs, setSelectedTechJobs] = useState<any[] | null>(null);
    const [isJobsModalOpen, setIsJobsModalOpen] = useState(false);

    interface LastInvite {
        email: string;
        link: string;
        tempPass?: string;
    }
    const [lastInvite, setLastInvite] = useState<LastInvite | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const { data: allProfiles, error: profError } = await supabaseAdmin
                .from('profiles')
                .select('*')
                .eq('role', 'TECH')
                .order('created_at', { ascending: false });

            if (profError) throw profError;

            const { data: apps, error: appError } = await supabaseAdmin
                .from('appointments')
                .select(`
                    id, 
                    request_id, 
                    assigned_tech_user_id, 
                    status, 
                    scheduled_start, 
                    service_requests!inner(
                        id, 
                        ticket_number, 
                        status, 
                        vehicles(year, make, model), 
                        service_catalog(name)
                    )
                `)
                .in('status', ['SCHEDULED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'])
                .neq('service_requests.status', 'CANCELED')
                .neq('service_requests.status', 'DECLINED');

            if (appError) throw appError;

            const active = (allProfiles || [])
                .filter((p: any) => p.status === 'ACTIVE')
                .map((tech: any) => ({
                    ...tech,
                    activeApps: apps?.filter((a: any) => a.assigned_tech_user_id === tech.user_id) || []
                }));

            const pending = (allProfiles || [])
                .filter((p: any) => p.status === 'PENDING_APPROVAL');

            setTechs(active);
            setPendingTechs(pending);

            const { data: unassigned, error: unError } = await supabaseAdmin
                .from('appointments')
                .select(`
                    *, 
                    service_requests(
                        id, 
                        ticket_number,
                        customer_user_id, 
                        symptoms_free_text, 
                        status, 
                        vehicles(year, make, model), 
                        service_catalog(name)
                    )
                `)
                .is('assigned_tech_user_id', null)
                .neq('status', 'CANCELED')
                .order('scheduled_start');

            if (unError) throw unError;
            setUnassignedReqs(unassigned || []);

        } catch (err) {
            console.error('Error loadData Techs:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleApproval(userId: string, status: 'ACTIVE' | 'REJECTED') {
        try {
            const tech = pendingTechs.find(t => t.user_id === userId);
            const userEmail = tech?.email || 'correo@desconocido.com';

            if (status === 'ACTIVE') {
                const { error } = await supabaseAdmin.from('profiles').update({ status: 'ACTIVE' }).eq('user_id', userId);
                if (error) throw error;
                
                await supabase.from('notifications_outbox').insert({
                    recipient_user_id: userId,
                    recipient: userEmail,
                    channel: 'EMAIL',
                    template_code: 'TECH_APPROVED',
                    subject: '¡Perfil Aprobado!',
                    body: 'Tu perfil ha sido aprobado. Ya puedes acceder al panel de técnicos.',
                    status: 'PENDING'
                });
            } else {
                await supabase.from('notifications_outbox').insert({
                    recipient_user_id: null,
                    recipient: userEmail,
                    channel: 'EMAIL',
                    template_code: 'TECH_REJECTED',
                    subject: 'Solicitud de Perfil',
                    body: 'Lamentamos informarte que tu solicitud no ha sido aprobada en este momento.',
                    status: 'PENDING'
                });

                const { error: delError } = await supabase.rpc('admin_delete_user', { target_user_id: userId });
                if (delError) throw delError;
            }

            toast({ title: status === 'ACTIVE' ? "Técnico Aprobado" : "Solicitud Rechazada", type: "success" });
            loadData();
        } catch (err: any) {
            toast({ title: "Error en aprobación", description: err.message, type: "error" });
        }
    }

    async function handleInviteSubmit(e: React.FormEvent) {
        e.preventDefault();
        setInviting(true);
        setLastInvite(null);
        try {
            const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
                type: 'invite',
                email: inviteData.email,
                options: { 
                    data: { role: inviteData.role, first_name: inviteData.first_name, last_name: inviteData.last_name },
                    redirectTo: `${window.location.origin}/auth/update-password`
                }
            });

            if (linkError) throw linkError;

            const inviteLink = linkData.properties.action_link;
            const userId = linkData.user.id;

            await supabaseAdmin.from('profiles').upsert({
                user_id: userId,
                role: inviteData.role,
                first_name: inviteData.first_name,
                last_name: inviteData.last_name,
                status: 'ACTIVE',
                preferred_channel: 'EMAIL'
            }, { onConflict: 'user_id' });

            setLastInvite({ email: inviteData.email, link: inviteLink });
            toast({ title: "Acceso Generado", type: "success" });
            setInviteData({ ...inviteData, email: '' }); 
            loadData();
        } catch (err: any) {
            toast({ title: "Error fatal", description: err.message, type: "error" });
        } finally {
            setInviting(false);
        }
    }

    async function changeRole(userId: string, currentRole: string, direction: 'UP' | 'DOWN') {
        let newRole = currentRole;
        if (direction === 'UP') newRole = 'ADMIN';
        else newRole = currentRole === 'ADMIN' ? 'TECH' : 'CUSTOMER';
        
        if (newRole === currentRole) return;
        try {
            await supabaseAdmin.from('profiles').update({ role: newRole }).eq('user_id', userId);
            toast({ title: 'Rol Actualizado', type: 'success' });
            loadData();
        } catch (err: any) {
            toast({ title: "Error al cambiar rol", description: err.message, type: "error" });
        }
    }

    async function handleDeleteUser(userId: string, name: string) {
        if (!confirm(`¿Estás seguro de eliminar definitivamente al usuario ${name}? Esta acción no se puede deshacer.`)) return;
        try {
            setLoading(true);
            const { error } = await supabase.rpc('admin_delete_user', { target_user_id: userId });
            if (error) throw error;
            toast({ title: 'Usuario Eliminado', type: 'success' });
            loadData();
        } catch (err: any) {
            console.error("Error al borrar usuario:", err);
            toast({ title: "Error al eliminar usuario", description: err.message, type: "error" });
            setLoading(false);
        }
    }

    async function assignTech(id: string, techId: string) {
        if (!techId) return;
        try {
            await supabaseAdmin.from('appointments').update({ assigned_tech_user_id: techId }).eq('id', id);
            toast({ title: 'Técnico Asignado', type: 'success' });
            loadData();
        } catch (err: any) {
            toast({ title: "Error en asignación", description: err.message, type: "error" });
        }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 px-4">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-slate-100 rounded-3xl animate-pulse"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-primary animate-bounce" />
                </div>
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Sincronizando Plantilla Denver...</p>
        </div>
    );

    return (
        <div className="max-w-[1700px] mx-auto space-y-12 pb-32 animate-in fade-in duration-700 px-4 mt-8">
            {/* Header: Fleet Command Console */}
            <header className="relative p-12 md:p-20 bg-slate-950 rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-b-8 border-primary/20">
                <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-primary/10 via-primary/5 to-transparent"></div>
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/10 blur-[150px] rounded-full"></div>
                
                <div className="relative z-10 flex flex-col xl:flex-row justify-between items-end gap-12">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-12 w-full xl:w-auto">
                        <div className="w-32 h-32 bg-white/5 rounded-[2.5rem] flex items-center justify-center border-4 border-white/10 shadow-3xl backdrop-blur-2xl group shrink-0">
                            <Users className="w-16 h-16 text-primary group-hover:scale-110 transition-transform duration-700" />
                        </div>
                        <div className="text-center md:text-left space-y-8">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
                                <h1 className="text-6xl md:text-9xl font-black italic tracking-tighter text-white uppercase leading-[0.8] pt-2">Flota Técnica</h1>
                                <Badge className="bg-primary text-white text-[12px] font-black border-none px-8 py-3 rounded-xl shadow-[0_20px_50px_rgba(255,46,91,0.4)] tracking-[0.4em]">ELITE_OPERATIONS</Badge>
                            </div>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 bg-white/5 backdrop-blur-md px-10 py-5 rounded-[2.5rem] border border-white/10 w-fit">
                                <div className="flex flex-col">
                                    <span className="text-slate-400 font-black text-[9px] tracking-widest uppercase mb-1 underline decoration-primary/20">TOTAL_ASSETS</span>
                                    <span className="text-white font-black text-3xl italic tracking-tighter">{techs.length}</span>
                                </div>
                                <div className="w-[2px] h-10 bg-white/10"></div>
                                <div className="flex flex-col">
                                    <span className="text-slate-400 font-black text-[9px] tracking-widest uppercase mb-1 underline decoration-amber-500/20">PENDING_APPROVAL</span>
                                    <span className="text-amber-500 font-black text-3xl italic tracking-tighter">{pendingTechs.length}</span>
                                </div>
                                <div className="w-[2px] h-10 bg-white/10"></div>
                                <div className="flex flex-col">
                                    <span className="text-slate-400 font-black text-[9px] tracking-widest uppercase mb-1 underline decoration-emerald-500/20">ON_DUTY</span>
                                    <span className="text-emerald-500 font-black text-3xl italic tracking-tighter">{techs.filter(t => t.activeApps.length > 0).length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <Button 
                        onClick={() => setIsInviteModalOpen(true)}
                        className="h-24 md:h-32 px-12 md:px-20 rounded-[2.5rem] md:rounded-[2.5rem] bg-primary text-white font-black italic text-xl md:text-2xl tracking-tighter hover:bg-white hover:text-slate-950 transition-all duration-700 shadow-[0_30px_60px_rgba(255,46,91,0.3)] border-none shrink-0 group"
                    >
                        <UserPlus className="w-10 h-10 mr-6 group-hover:rotate-12 transition-transform" />
                        INVITAR NUEVO AGENTE
                    </Button>
                </div>
            </header>

            {/* Main Operational Grid */}
            <main className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                
                {/* Left Side: Team & Pending (8 cols) */}
                <div className="lg:col-span-8 space-y-16">
                    
                    {/* Section: Gatekeepers (Pending) */}
                    {pendingTechs.length > 0 && (
                        <section className="space-y-10">
                            <div className="flex items-center gap-6">
                                <div className="w-4 h-16 bg-amber-500 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.4)]"></div>
                                <h2 className="text-4xl font-black italic tracking-tight text-slate-950 uppercase">Puerta de Acceso</h2>
                                <Badge className="bg-amber-100 text-amber-600 font-black text-[10px] tracking-widest px-6 py-1.5 rounded-full border-none">SOLICITUDES_CRÍTICAS</Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {pendingTechs.map((tech) => (
                                    <Card key={tech.user_id} className="relative bg-white border-none rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] overflow-hidden group hover:-translate-y-4 transition-all duration-700">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-1000"></div>
                                        <CardContent className="p-12 space-y-10">
                                            <div className="flex items-center gap-8">
                                                <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 overflow-hidden ring-8 ring-slate-50 shadow-2xl border-2 border-white group-hover:scale-110 transition-transform duration-700 shrink-0">
                                                    {tech.avatar_url ? <img src={tech.avatar_url} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><Users size={40} /></div>}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-3xl font-black text-slate-950 uppercase italic tracking-tighter leading-none mb-4 truncate">{tech.first_name} {tech.last_name}</h3>
                                                    <div className="flex flex-wrap gap-4">
                                                        <div className="flex items-center gap-2 bg-slate-50 px-4 py-1.5 rounded-xl border border-slate-100">
                                                            <Briefcase size={12} className="text-primary" />
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tech.experience || 'NEW'} EXP</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 bg-slate-50 px-4 py-1.5 rounded-xl border border-slate-100">
                                                            <MapPin size={12} className="text-primary" />
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tech.address?.split(',')[0] || 'DENVER'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <Button 
                                                    onClick={() => handleApproval(tech.user_id, 'ACTIVE')}
                                                    className="h-16 rounded-[1.8rem] bg-emerald-500 text-white font-black text-[12px] uppercase tracking-[0.2em] shadow-xl hover:bg-slate-950 transition-all border-none"
                                                >
                                                    APROBAR
                                                </Button>
                                                <Button 
                                                    onClick={() => handleApproval(tech.user_id, 'REJECTED')}
                                                    className="h-16 rounded-[1.8rem] bg-slate-50 text-slate-400 font-black text-[12px] uppercase tracking-[0.2em] border-2 border-slate-100 hover:bg-rose-50 hover:text-rose-600 transition-all"
                                                >
                                                    RECHAZAR
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Section: Elite Operations Force */}
                    <section className="space-y-10 pb-32">
                        <div className="flex items-center gap-6">
                            <div className="w-4 h-16 bg-primary rounded-full shadow-[0_0_30px_rgba(255,46,91,0.4)]"></div>
                            <h2 className="text-4xl font-black italic tracking-tight text-slate-950 uppercase">Escuadrón Elite</h2>
                            <Activity size={24} className="text-emerald-500 animate-pulse" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {techs.length > 0 ? techs.map((tech) => (
                                <Card key={tech.user_id} className="relative bg-white border-none rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.08)] overflow-hidden group hover:-translate-y-4 transition-all duration-700">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-1000"></div>
                                    <CardContent className="p-12 md:p-14 space-y-12">
                                        <div className="flex justify-between items-start gap-6">
                                            <div className="flex gap-8">
                                                <div className="relative shrink-0">
                                                    <div className="w-24 h-24 rounded-[2.5rem] bg-slate-950 flex items-center justify-center ring-8 ring-slate-100 overflow-hidden shadow-2xl group-hover:rotate-6 transition-transform duration-700">
                                                        {tech.avatar_url ? <img src={tech.avatar_url} alt="Profile" className="w-full h-full object-cover" /> : <Users size={48} className="text-primary opacity-20" />}
                                                    </div>
                                                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-slate-50">
                                                        <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.6)]"></div>
                                                    </div>
                                                </div>
                                                <div className="pt-2">
                                                    <h3 className="text-3xl font-black text-slate-950 uppercase italic tracking-tighter leading-none mb-3">{tech.first_name} {tech.last_name}</h3>
                                                    <div className="flex items-center gap-4">
                                                        <Badge className="bg-slate-950 text-primary text-[9px] font-black tracking-[0.3em] px-4 py-1 rounded-xl border-none">ELITE_AG_v2</Badge>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                            <Award size={12} className="text-amber-500" /> TOP_RATED
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => { setSelectedTechJobs(tech.activeApps); setIsJobsModalOpen(true); }}
                                                className="w-20 h-20 bg-slate-950 rounded-[2.5rem] flex flex-col items-center justify-center text-white shadow-2xl hover:bg-primary transition-all duration-500 shrink-0 group/stat"
                                            >
                                                <span className="text-2xl font-black italic italic leading-none">{tech.activeApps.length}</span>
                                                <span className="text-[8px] font-black text-slate-500 group-hover:text-white uppercase tracking-widest mt-1">JOBS</span>
                                            </button>
                                        </div>

                                        {/* Deployment Status */}
                                        <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 flex items-center justify-between group/status">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary shadow-xl group-hover/status:scale-110 group-hover/status:rotate-12 transition-all duration-700">
                                                    {tech.tech_vehicle_photo_url ? <img src={tech.tech_vehicle_photo_url} alt="Vehicle" className="w-full h-full object-cover rounded-xl" /> : <Car size={32} />}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">DEPLO_UNIT</p>
                                                    <p className="text-sm font-black text-slate-950 uppercase italic tracking-tight">{tech.tech_vehicle_plate || 'MOBILE_UNIT_01'}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="text-slate-200 group-hover/status:translate-x-2 transition-transform duration-700" />
                                        </div>

                                        <div className="flex gap-4 pt-10 border-t-4 border-slate-50">
                                            <Button 
                                                onClick={() => changeRole(tech.user_id, tech.role, 'UP')} 
                                                disabled={tech.role === 'ADMIN'}
                                                className="flex-1 h-16 rounded-[1.8rem] bg-slate-950 text-white font-black text-[12px] uppercase tracking-widest hover:bg-primary transition-all border-none"
                                            >
                                                PROMOVER
                                            </Button>
                                            <button 
                                                onClick={() => handleDeleteUser(tech.user_id, tech.first_name)}
                                                className="w-16 h-16 flex items-center justify-center bg-rose-50 text-rose-300 hover:text-rose-600 hover:bg-rose-100 rounded-[1.8rem] transition-all duration-500 group/delete"
                                            >
                                                <Trash2 size={24} className="group-hover/delete:rotate-12 transition-transform" />
                                            </button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )) : (
                                <div className="col-span-full py-40 text-center bg-slate-50 rounded-[2.5rem] border-8 border-dashed border-slate-100 space-y-10">
                                    <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center text-slate-100 mx-auto shadow-3xl">
                                        <Users size={64} />
                                    </div>
                                    <h3 className="text-4xl font-black italic uppercase tracking-tighter text-slate-300">Zona Silenciosa</h3>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Right Side: Dispatch Command Console (4 cols) */}
                <aside className="lg:col-span-4 space-y-12">
                    <div className="sticky top-12 space-y-10">
                        <div className="flex items-center gap-6 px-4">
                            <div className="w-4 h-16 bg-slate-950 rounded-full shadow-2xl"></div>
                            <h2 className="text-4xl font-black italic tracking-tight text-slate-950 uppercase leading-none pt-2">Consola de<br/>Despacho</h2>
                        </div>

                        <Card className="bg-slate-950 rounded-[2.5rem] p-4 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-b-8 border-primary/20 overflow-hidden">
                            <div className="p-8 md:p-10 space-y-8 max-h-[800px] overflow-y-auto scrollbar-hide">
                                {unassignedReqs.length > 0 ? unassignedReqs.map((req) => (
                                    <Card key={req.id} className="relative bg-white/5 border border-white/5 rounded-[2.5rem] overflow-hidden group hover:bg-white/10 transition-all duration-700">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                        <CardContent className="p-10 space-y-8">
                                            <div className="flex items-center justify-between">
                                                <Badge className="bg-primary/20 text-primary text-[10px] font-black px-6 py-1.5 rounded-xl border-none tracking-widest animate-pulse">PENDING_ASSET</Badge>
                                                <span className="text-[12px] font-black text-white/20 font-mono tracking-widest">#{req.service_requests?.ticket_number || 'S/N'}</span>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <h4 className="text-3xl font-black text-white italic tracking-tighter leading-none group-hover:text-primary transition-colors">
                                                    {req.service_requests?.vehicles ? `${req.service_requests.vehicles.make} ${req.service_requests.vehicles.model}` : 'DENVER_UNIT'}
                                                </h4>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] underline decoration-primary/20">{req.service_requests?.service_catalog?.name || 'GENERIC_INSPECTION'}</p>
                                            </div>

                                            <div className="space-y-6 pt-8 border-t border-white/5">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] px-2">ASIGNAR_OPERADOR</p>
                                                <div className="flex items-center gap-4">
                                                    <select 
                                                        className="flex-1 h-20 px-8 rounded-3xl bg-white/5 border-2 border-white/5 text-white font-black uppercase text-[12px] tracking-tight focus:border-primary outline-none transition-all cursor-pointer appearance-none"
                                                        value={selection[req.id] || ""} 
                                                        onChange={(e) => setSelection({ ...selection, [req.id]: e.target.value })}
                                                    >
                                                        <option value="" className="bg-slate-950">SELECCIONAR...</option>
                                                        {techs.map((t) => (
                                                            <option key={t.user_id} value={t.user_id} className="bg-slate-950">{t.first_name.toUpperCase()} ({t.activeApps.length})</option>
                                                        ))}
                                                    </select>
                                                    <button 
                                                        onClick={() => assignTech(req.id, selection[req.id])} 
                                                        disabled={!selection[req.id]}
                                                        className="w-20 h-20 bg-primary text-white rounded-3xl flex items-center justify-center shadow-2xl hover:bg-white hover:text-slate-950 transition-all active:scale-95 disabled:opacity-20 group/go"
                                                    >
                                                        <Zap size={32} className="group-hover/go:scale-125 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )) : (
                                    <div className="text-center py-40 space-y-10 opacity-30">
                                        <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-inner border border-white/5">
                                            <ShieldCheck size={48} />
                                        </div>
                                        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Consola Limpia</h3>
                                    </div>
                                )}
                            </div>
                        </Card>

                        <div className="p-12 bg-slate-50 rounded-[2.5rem] border-b-8 border-slate-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                            <div className="relative z-10 flex items-center gap-8">
                                <div className="w-16 h-16 bg-white rounded-[2rem] flex items-center justify-center text-primary shadow-2xl border border-slate-100 group-hover:scale-110 transition-transform duration-700 shrink-0">
                                    <AlertCircle size={32} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2 font-mono">DENVER_PROTOCOL_v4</p>
                                    <p className="text-[13px] text-slate-950 font-black italic leading-tight uppercase tracking-tighter">"La eficiencia táctica define el estándar."</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </main>

            {/* --- JOBS DETAIL MODAL --- */}
            {isJobsModalOpen && selectedTechJobs && (
                <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-[20px] z-[110] flex items-center justify-center p-6 animate-in fade-in duration-500">
                    <Card className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-[0_100px_200px_-50px_rgba(0,0,0,1)] border-none overflow-hidden animate-in zoom-in-95 duration-500">
                        <CardHeader className="bg-slate-950 text-white p-14 md:p-20 relative">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                            <div className="flex items-center gap-10 relative z-10">
                                <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center text-primary backdrop-blur-2xl border-2 border-white/10 group shadow-3xl">
                                    <Briefcase size={48} className="group-hover:scale-110 transition-transform duration-700" />
                                </div>
                                <div>
                                    <h3 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-[0.8]">Hoja de Ruta</h3>
                                    <p className="text-slate-500 font-bold uppercase text-[12px] tracking-[0.4em] mt-6 flex items-center gap-4">
                                        <span className="w-3 h-3 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(255,46,91,0.6)]"></span>
                                        ACTIVE_DEPLOYMENT_FEED
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsJobsModalOpen(false)}
                                className="absolute top-12 right-12 z-20 h-20 w-20 rounded-full bg-white/5 hover:bg-primary flex items-center justify-center text-white transition-all hover:rotate-90 duration-700 border border-white/10 shadow-3xl"
                            >
                                <XCircle size={40} />
                            </button>
                        </CardHeader>
                        <CardContent className="p-14 md:p-20 max-h-[60vh] overflow-y-auto scrollbar-hide space-y-12">
                            {selectedTechJobs.length > 0 ? (
                                <div className="space-y-10">
                                    {selectedTechJobs.map((job) => (
                                        <div key={job.id} className="relative p-10 md:p-12 rounded-[2.5rem] bg-slate-50 border-2 border-slate-100 flex flex-col xl:flex-row justify-between items-center gap-10 group hover:bg-white hover:shadow-2xl transition-all duration-700">
                                            <div className="flex gap-10 items-center w-full">
                                                <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-2xl border-2 border-slate-50 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-700">
                                                    <Car size={48} className="text-primary opacity-20" />
                                                </div>
                                                <div className="min-w-0 flex-1 space-y-4">
                                                    <div className="flex flex-wrap items-center gap-6">
                                                        <Badge className="bg-slate-950 text-white font-black border-none px-6 py-2 rounded-2xl text-[12px] tracking-[0.2em] shadow-xl italic">UNIT_#{job.service_requests?.ticket_number || 'S/N'}</Badge>
                                                        <div className="flex items-center gap-3 text-[12px] font-black text-slate-400 uppercase tracking-widest">
                                                            <Calendar size={16} className="text-primary" /> {new Date(job.scheduled_start).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' }).toUpperCase()}
                                                        </div>
                                                    </div>
                                                    <h4 className="text-4xl font-black italic text-slate-950 tracking-tighter leading-none uppercase truncate">
                                                        {job.service_requests?.vehicles ? `${job.service_requests.vehicles.make} ${job.service_requests.vehicles.model}` : 'FLEET_UNIT_N/A'}
                                                    </h4>
                                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3 underline decoration-primary/20 decoration-4">
                                                        <Wrench size={16} className="text-primary animate-bounce-slow" /> {job.service_requests?.service_catalog?.name || 'FIELD_INSPECTION'}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge className={`h-16 w-full xl:w-auto flex items-center justify-center uppercase text-[12px] font-black border-none px-12 rounded-[1.8rem] shadow-2xl italic tracking-widest ${
                                                job.status === 'IN_PROGRESS' ? 'bg-indigo-600 text-white shadow-indigo-500/40' : 
                                                job.status === 'ARRIVED' ? 'bg-emerald-500 text-white shadow-emerald-500/40' :
                                                'bg-slate-950 text-white shadow-slate-950/40'
                                            }`}>
                                                {job.status === 'IN_PROGRESS' ? 'MISSION_IN_PROGRESS' : job.status.toUpperCase()}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-40 opacity-30">
                                    <h3 className="text-3xl font-black italic uppercase text-slate-200">HISTORIAL_VACÍO</h3>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
            
            {/* Invite Modal (Upgraded Aesthetic) */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-[20px] z-[120] flex items-center justify-center p-6 animate-in fade-in duration-500">
                    <Card className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-[0_100px_200px_-50px_rgba(0,0,0,1)] border-none overflow-hidden animate-in zoom-in-95 duration-500">
                        <CardHeader className="bg-slate-950 p-16 md:p-20 text-center relative">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                            <div className="w-32 h-32 bg-white/5 rounded-[2.5rem] flex items-center justify-center text-primary mx-auto mb-10 backdrop-blur-2xl border-2 border-white/10 shadow-3xl">
                                <UserPlus size={64} />
                            </div>
                            <h3 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white uppercase leading-[0.8]">Nuevo Agente</h3>
                            <p className="text-slate-500 font-bold uppercase text-[12px] tracking-[0.5em] mt-8">PROTOCOL_EN_INVITATION_v4</p>
                        </CardHeader>
                        <CardContent className="p-16 md:p-24">
                            {lastInvite ? (
                                <div className="space-y-12 animate-in zoom-in-95 text-center">
                                    <div className="w-32 h-32 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mx-auto shadow-inner border-4 border-emerald-500/20">
                                        <CheckCircle2 size={64} className="animate-bounce" />
                                    </div>
                                    <h4 className="text-4xl font-black italic uppercase tracking-tighter text-slate-950">ACCESO_Habilitado</h4>
                                    <Button 
                                        onClick={() => { navigator.clipboard.writeText(lastInvite.link); toast({ title: "Copiado", type: "success" }); }} 
                                        className="h-24 w-full rounded-3xl bg-primary text-white font-black uppercase text-sm tracking-[0.3em] shadow-[0_30px_60px_rgba(255,46,91,0.3)] border-none animate-pulse"
                                    >
                                        COPIAR TOKEN DE ACCESO
                                    </Button>
                                    <Button variant="ghost" className="w-full h-16 text-slate-400 font-black uppercase text-[12px] tracking-[0.4em] hover:text-primary transition-colors" onClick={() => setLastInvite(null)}>NUEVA_MISIÓN</Button>
                                </div>
                            ) : (
                                <form id="invite-form" onSubmit={handleInviteSubmit} className="space-y-10">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] px-4 font-mono">FIRST_NAME_B01</p>
                                            <input placeholder="JOHN" required className="w-full h-20 px-8 rounded-3xl border-4 border-transparent bg-slate-50 font-black italic outline-none focus:border-primary/20 transition-all text-slate-950 shadow-inner text-lg" value={inviteData.first_name} onChange={e => setInviteData({...inviteData, first_name: e.target.value})} />
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] px-4 font-mono">LAST_NAME_B01</p>
                                            <input placeholder="DOE" required className="w-full h-20 px-8 rounded-3xl border-4 border-transparent bg-slate-50 font-black italic outline-none focus:border-primary/20 transition-all text-slate-950 shadow-inner text-lg" value={inviteData.last_name} onChange={e => setInviteData({...inviteData, last_name: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] px-4 font-mono">ENCRYPTED_EMAIL</p>
                                        <input type="email" placeholder="AGENTE@DENVERMOBILE.COM" required className="w-full h-20 px-8 rounded-3xl border-4 border-transparent bg-slate-50 font-black italic outline-none focus:border-primary/20 transition-all text-slate-950 shadow-inner text-lg" value={inviteData.email} onChange={e => setInviteData({...inviteData, email: e.target.value})} />
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] px-4 font-mono">SECURITY_LEVEL</p>
                                        <select className="w-full h-20 px-8 rounded-3xl border-4 border-transparent bg-slate-950 font-black uppercase text-[12px] tracking-[0.3em] text-white outline-none focus:border-primary transition-all shadow-4xl cursor-pointer appearance-none" value={inviteData.role} onChange={e => setInviteData({...inviteData, role: e.target.value})}>
                                            <option value="TECH">AGENTE_OPERATIVO_(FIELD)</option>
                                            <option value="ADMIN">COMANDANTE_ADMIN_(CENTRAL)</option>
                                        </select>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                        {!lastInvite && (
                            <div className="p-16 md:p-24 pt-0 flex gap-8">
                                <Button variant="outline" className="flex-1 h-24 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[12px] border-4 border-slate-100 text-slate-400 hover:bg-slate-50" onClick={() => setIsInviteModalOpen(false)}>ABORTAR</Button>
                                <Button form="invite-form" type="submit" disabled={inviting} className="flex-[2] h-24 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[12px] bg-primary text-white shadow-4xl shadow-primary/30 border-none hover:bg-slate-950 transition-all active:scale-95 italic">
                                    {inviting ? "CIFRANDO..." : "ENVIAR_ORDEN_DE_ACCESO"}
                                </Button>
                            </div>
                        )}
                        {lastInvite && <div className="p-16 md:p-24 pt-0"><Button className="w-full h-24 rounded-[2.5rem] bg-slate-950 text-white font-black uppercase tracking-[0.3em] text-[12px] hover:bg-primary transition-all border-none shadow-3xl" onClick={() => { setIsInviteModalOpen(false); setLastInvite(null); }}>CERRAR_SISTEMA</Button></div>}
                    </Card>
                </div>
            )}
        </div>
    );
}
