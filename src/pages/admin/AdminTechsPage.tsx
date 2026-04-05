import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Users, Wrench, ShieldAlert, UserPlus, ArrowRight, UserMinus, Calendar, Settings2, TrendingUp, Car, CheckCircle2, ShieldCheck, Palette, XCircle, Clock, MapPin, Briefcase, Phone, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { useToast } from '../../components/ui/Toast';

const calculateAge = (dob: string | null) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age + ' años';
};

export function AdminTechsPage() {
    const [techs, setTechs] = useState<any[]>([]);
    const [pendingTechs, setPendingTechs] = useState<any[]>([]);
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
            // Fetch all technicians
            const { data: allTechs, error: profError } = await supabaseAdmin
                .from('profiles')
                .select('*')
                .eq('role', 'TECH')
                .order('created_at', { ascending: false });

            if (profError) throw profError;

            // Separate active and pending
            const active = (allTechs || []).filter((t: any) => t.status === 'ACTIVE');
            const pending = (allTechs || []).filter((t: any) => t.status === 'PENDING_APPROVAL');

            const { data: apps, error: appError } = await supabaseAdmin
                .from('appointments')
                .select('id, request_id, assigned_tech_user_id, status, scheduled_start, service_requests!inner(id, ticket_number, status, vehicles(year, make, model), service_catalog(name))')
                .in('status', ['SCHEDULED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'])
                .neq('service_requests.status', 'CANCELED')
                .neq('service_requests.status', 'DECLINED');

            if (appError) throw appError;

            const techData = active.map((tech: any) => ({
                ...tech,
                activeApps: apps?.filter((a: any) => a.assigned_tech_user_id === tech.user_id) || []
            }));

            setTechs(techData);
            setPendingTechs(pending);

            // Fetch unassigned
            const { data: unassigned, error: unError } = await supabaseAdmin
                .from('appointments')
                .select('*, service_requests(id, customer_user_id, symptoms_free_text, status, vehicles(year, make, model), service_catalog(name))')
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
            const userEmail = (tech as any)?.email || 'correo@desconocido.com';

            if (status === 'ACTIVE') {
                // If Approved, update status to ACTIVE
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
                // If Rejected, we insert notification disconnected from user_id, THEN we delete the user completely
                await supabase.from('notifications_outbox').insert({
                    recipient_user_id: null, // Set to null so admin_delete_user doesn't wipe this notification
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
            alert(err.message);
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
                status: 'ACTIVE', // Invited by admin = Auto Active
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
            alert(err.message);
        }
    }

    async function handleDeleteUser(userId: string, name: string) {
        if (!confirm(`¿Estás seguro de eliminar definitivamente al usuario ${name} y TODO su historial? Esta acción no se puede deshacer.`)) return;
        try {
            setLoading(true);
            const { error } = await supabase.rpc('admin_delete_user', { target_user_id: userId });
            if (error) throw error;
            toast({ title: 'Usuario Eliminado', type: 'success' });
            loadData();
        } catch (err: any) {
            console.error("Error al borrar usuario:", err);
            alert("Hubo un error al eliminar el usuario, revisa la consola para más detalles.");
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
            alert(err.message);
        }
    }

    if (loading) return <div className="p-10 text-center animate-pulse text-indigo-600 font-bold italic tracking-widest uppercase">Gestionando equipo...</div>;

    return (
        <div className="space-y-10 pb-20 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-blue-600/20 rotate-3">
                        <Users size={28} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black italic tracking-tighter text-slate-900 leading-none">Gestión de Técnicos</h1>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Personal y Asignaciones</p>
                    </div>
                </div>
                <Button onClick={() => setIsInviteModalOpen(true)} className="h-14 px-8 rounded-2xl font-black bg-slate-900 text-white shadow-xl flex items-center gap-3 hover:translate-y-[-2px] transition-all">
                    <UserPlus size={20} /> INVITAR TÉCNICO
                </Button>
            </div>

            {isInviteModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
                    <Card className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl border-none overflow-hidden">
                        <CardHeader className="bg-slate-900 text-white p-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-[50px] rounded-full translate-x-1/2 -translate-y-1/2" />
                            <CardTitle className="text-3xl font-black italic tracking-tighter relative z-10 flex items-center gap-3"><UserPlus size={32} className="text-blue-400" /> Invitar al Equipo</CardTitle>
                        </CardHeader>
                        <CardContent className="p-10">
                            {lastInvite ? (
                                <div className="space-y-6 animate-in zoom-in-95 text-center">
                                    <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
                                    <Button onClick={() => { navigator.clipboard.writeText(lastInvite.link); toast({ title: "Link Copiado", type: "success" }); }} className="w-full h-12 rounded-xl bg-emerald-600 text-white font-black uppercase text-[10px]">COPIAR LINK</Button>
                                    <Button variant="ghost" className="text-slate-500 font-bold text-xs" onClick={() => setLastInvite(null)}>ENVIAR OTRO</Button>
                                </div>
                            ) : (
                                <form id="invite-form" onSubmit={handleInviteSubmit} className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <input placeholder="Nombre" required className="w-full h-12 px-5 rounded-2xl border border-slate-100 bg-slate-50 font-bold outline-none" value={inviteData.first_name} onChange={e => setInviteData({...inviteData, first_name: e.target.value})} />
                                        <input placeholder="Apellido" required className="w-full h-12 px-5 rounded-2xl border border-slate-100 bg-slate-50 font-bold outline-none" value={inviteData.last_name} onChange={e => setInviteData({...inviteData, last_name: e.target.value})} />
                                    </div>
                                    <input type="email" placeholder="ejemplo@denver.com" required className="w-full h-12 px-5 rounded-2xl border border-slate-100 bg-slate-50 font-bold outline-none" value={inviteData.email} onChange={e => setInviteData({...inviteData, email: e.target.value})} />
                                    <select className="w-full h-12 px-5 rounded-2xl border border-slate-100 bg-slate-50 font-black uppercase text-xs" value={inviteData.role} onChange={e => setInviteData({...inviteData, role: e.target.value})}>
                                        <option value="TECH">⚙️ TÉCNICO MECÁNICO</option>
                                        <option value="ADMIN">🛡️ ADMINISTRADOR</option>
                                    </select>
                                </form>
                            )}
                        </CardContent>
                        <div className="px-10 pb-10 flex gap-4">
                            {!lastInvite ? (
                                <>
                                    <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs border-slate-200" onClick={() => setIsInviteModalOpen(false)}>Cancelar</Button>
                                    <Button form="invite-form" type="submit" disabled={inviting} className="flex-[2] h-14 rounded-2xl font-black uppercase tracking-widest text-xs bg-blue-600 text-white shadow-2xl shadow-blue-600/20">GENERAR ACCESO</Button>
                                </>
                            ) : (
                                <Button className="w-full h-14 rounded-2xl bg-slate-100 text-slate-900 font-black uppercase tracking-widest text-xs" onClick={() => { setIsInviteModalOpen(false); setLastInvite(null); }}>Cerrar</Button>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            {/* NEW: Pending Approvals Section */}
            {pendingTechs.length > 0 && (
                <div className="space-y-6 animate-in slide-in-from-top-10 duration-700">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-1.5 h-8 bg-amber-500 rounded-full" />
                        <h2 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-3">Solicitudes Pendientes <Badge className="bg-amber-100 text-amber-600 border-none text-sm px-3 py-1">{pendingTechs.length}</Badge></h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingTechs.map((tech) => (
                            <Card key={tech.user_id} className="bg-white border-2 border-amber-100 border-dashed rounded-[2.5rem] overflow-hidden shadow-xl shadow-amber-900/5">
                                <CardContent className="p-8">
                                    <div className="flex gap-4 mb-6">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-50 overflow-hidden ring-4 ring-white shadow-lg shrink-0">
                                            {tech.avatar_url ? <img src={tech.avatar_url} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><Users size={32} /></div>}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-black text-slate-900 text-lg leading-tight truncate">{tech.first_name} {tech.last_name}</h3>
                                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1"><Clock size={10} className="inline mr-1" /> Esperando Aprobación</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest"><MapPin size={12}/> {tech.address || 'Sin Dirección'} {tech.zip_code ? `(${tech.zip_code})` : ''}</div>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest"><Phone size={12}/> {tech.phone || 'Sin Teléfono'}</div>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest"><Calendar size={12}/> Edad: <span className="text-slate-700 font-black">{calculateAge(tech.birth_date)}</span></div>
                                            
                                            <div className="flex items-center gap-2 py-1 px-3 bg-slate-50 rounded-lg border border-slate-100">
                                                {tech.work_authorized ? (
                                                    <><ShieldCheck size={14} className="text-emerald-500" /><span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Autorizado para trabajar (EE.UU.)</span></>
                                                ) : (
                                                    <><ShieldAlert size={14} className="text-rose-500" /><span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">NO AUTORIZADO / PENDIENTE</span></>
                                                )}
                                            </div>

                                            {tech.experience_summary && (
                                                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 text-[11px] text-slate-600 font-medium leading-relaxed italic relative">
                                                    <Briefcase size={12} className="absolute top-3 right-3 text-slate-300" />
                                                    "{tech.experience_summary}"
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden shadow-sm">
                                                {tech.tech_vehicle_photo_url ? (
                                                    <img src={tech.tech_vehicle_photo_url} alt="Vehículo" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Car size={20} className="text-slate-300" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-none">{tech.tech_vehicle_plate || 'Sin Placa'}</p>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">{tech.tech_vehicle_make} {tech.tech_vehicle_model} {tech.tech_vehicle_color ? `(${tech.tech_vehicle_color})` : ''}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={() => handleApproval(tech.user_id, 'ACTIVE')} className="flex-1 h-12 rounded-xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all"><CheckCircle2 size={16} className="mr-2" /> APROBAR</Button>
                                            <Button onClick={() => handleApproval(tech.user_id, 'REJECTED')} variant="outline" className="flex-1 h-12 rounded-xl border-rose-200 text-rose-600 font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 transition-all"><XCircle size={16} className="mr-2" /> RECHAZAR</Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                <div className="xl:col-span-8 space-y-6">
                    <div className="flex items-center gap-3 px-2"><div className="w-1.5 h-6 bg-blue-600 rounded-full" /><h2 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">Técnicos Activos ({techs.length})</h2></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {techs.map((tech: any) => (
                            <Card key={tech.user_id} className="bg-white shadow-xl shadow-slate-200/50 border-none rounded-[2rem] overflow-hidden group hover:shadow-2xl transition-all">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex gap-4 min-w-0">
                                            <div className="w-16 h-16 rounded-[1.25rem] bg-indigo-50 overflow-hidden ring-4 ring-slate-50 flex items-center justify-center shrink-0 shadow-lg">
                                                {tech.avatar_url ? <img src={tech.avatar_url} alt="Profile" className="w-full h-full object-cover" /> : <Users className="text-indigo-400" size={28} />}
                                            </div>
                                            <div className="min-w-0 pt-1">
                                                <h3 className="font-black text-slate-900 text-lg leading-tight truncate">{tech.first_name} {tech.last_name}</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1"><ShieldAlert size={10} className="inline mr-1 text-blue-500" /> {tech.role}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setSelectedTechJobs(tech.activeApps);
                                                setIsJobsModalOpen(true);
                                            }}
                                            title="Ver detalles de servicios"
                                            className="text-center p-4 rounded-[2rem] bg-indigo-600 hover:bg-slate-900 shadow-lg shadow-indigo-600/20 transition-all shrink-0 focus:outline-none hover:scale-105 active:scale-95 group/jobs"
                                        >
                                            <div className="text-2xl font-black text-white leading-none mb-1">{tech.activeApps.length}</div>
                                            <p className="text-[9px] font-black text-indigo-200 group-hover/jobs:text-white uppercase tracking-widest leading-none">ACTIVOS</p>
                                        </button>
                                    </div>
                                    
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            {tech.work_authorized ? (
                                                <div className="flex items-center gap-1.5 py-1 px-2.5 bg-emerald-50 rounded-lg text-[10px] font-black text-emerald-700 uppercase tracking-wider border border-emerald-100 shadow-sm"><ShieldCheck size={12} /> Legal (EE.UU.)</div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 py-1 px-2.5 bg-rose-50 rounded-lg text-[10px] font-black text-rose-600 uppercase tracking-wider border border-rose-100 shadow-sm"><ShieldAlert size={12} /> Pendiente Estatus</div>
                                            )}
                                            <div className="flex items-center gap-1.5 py-1 px-2.5 bg-indigo-50 rounded-lg text-[10px] font-black text-indigo-700 uppercase tracking-wider border border-indigo-100 shadow-sm"><Briefcase size={12} /> {tech.experience || 'S/E'} Exp.</div>
                                        </div>
                                    
                                    <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4 relative overflow-hidden group/vehicle">
                                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-slate-100 overflow-hidden">
                                            {tech.tech_vehicle_photo_url ? <img src={tech.tech_vehicle_photo_url} alt="Vehículo" className="w-full h-full object-cover" /> : <Car size={20} className="text-slate-300" />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em] leading-none">{tech.tech_vehicle_plate || 'SIN PLACA'}</p>
                                                {tech.tech_vehicle_color && <Badge variant="outline" className="h-4 px-1.5 text-[7px] uppercase font-black border-slate-200 text-slate-500 bg-white">{tech.tech_vehicle_color}</Badge>}
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold truncate mt-1.5 uppercase tracking-wide"><span className="text-slate-600">{tech.tech_vehicle_make || 'Genérico'}</span> {tech.tech_vehicle_model || ''}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-4 pt-4 border-t border-dashed border-slate-100">
                                        <Button size="sm" variant="ghost" className="flex-1 h-10 text-emerald-600 font-black text-[9px] uppercase tracking-widest bg-emerald-50/50 hover:bg-emerald-100 rounded-xl" onClick={() => changeRole(tech.user_id, tech.role, 'UP')} disabled={tech.role === 'ADMIN'}><TrendingUp size={12} className="mr-1" /> Promover</Button>
                                        <Button size="sm" variant="ghost" className="flex-1 h-10 text-rose-600 font-black text-[9px] uppercase tracking-widest bg-rose-50/50 hover:bg-rose-100 rounded-xl" onClick={() => changeRole(tech.user_id, tech.role, 'DOWN')}><UserMinus size={12} className="mr-1" /> Rebajar</Button>
                                        <Button size="sm" variant="ghost" className="h-10 px-3 text-red-600 font-black bg-red-50 hover:bg-red-100 rounded-xl" onClick={() => handleDeleteUser(tech.user_id, tech.first_name)}><Trash2 size={14} /></Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                <div className="xl:col-span-4 space-y-6">
                    <div className="flex items-center gap-3 px-2"><div className="w-1.5 h-6 bg-indigo-600 rounded-full" /><h2 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter flex items-center gap-2">Asignaciones <ArrowRight size={20} className="text-blue-500" /></h2></div>
                    <Card className="bg-slate-50 border-slate-200 border-2 border-dashed rounded-[2.5rem] overflow-hidden">
                        <CardContent className="p-4 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
                            {unassignedReqs.length > 0 ? unassignedReqs.map((req: any) => (
                                <Card key={req.id} className="bg-white shadow-xl shadow-slate-200/50 border-none rounded-2xl">
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-3 min-w-0">
                                            <div className="space-y-1 min-w-0">
                                                <h4 className="font-black text-slate-900 line-clamp-2 text-xs leading-tight uppercase">{req.service_requests?.vehicles ? `${req.service_requests.vehicles.year} ${req.service_requests.vehicles.make} ${req.service_requests.vehicles.model}` : 'Vehículo'}</h4>
                                                <span className="flex items-center gap-1.5 text-blue-600 uppercase font-black text-[9px] tracking-widest"><Wrench size={10} /> {req.service_requests?.service_catalog?.name || 'Diagnóstico'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-4">
                                            <select className="flex-1 text-[10px] h-10 font-black border-2 border-slate-100 rounded-xl bg-slate-50 px-3 outline-none" value={selection[req.id] || ""} onChange={(e) => setSelection({ ...selection, [req.id]: e.target.value })}>
                                                <option value="" disabled>Técnico</option>
                                                {techs.map((t: any) => (<option key={t.user_id} value={t.user_id}>{t.first_name} {t.last_name}</option>))}
                                            </select>
                                            <Button size="sm" className="h-10 w-10 p-0 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0" onClick={() => assignTech(req.id, selection[req.id])} disabled={!selection[req.id]}><CheckCircle2 size={18} /></Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )) : (
                                <div className="text-center py-20 text-slate-400 italic text-sm font-bold uppercase tracking-widest">¡Todo asignado!</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Jobs Modal */}
            {isJobsModalOpen && selectedTechJobs && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
                    <Card className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl border-none overflow-hidden">
                        <CardHeader className="bg-slate-900 text-white p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-[50px] rounded-full translate-x-1/2 -translate-y-1/2" />
                            <CardTitle className="text-2xl font-black italic tracking-tighter relative z-10 flex items-center gap-3">
                                <Wrench size={28} className="text-blue-400" /> Servicios Activos
                            </CardTitle>
                            <button 
                                onClick={() => setIsJobsModalOpen(false)}
                                className="absolute top-8 right-8 z-20 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
                            >
                                <XCircle size={24} />
                            </button>
                        </CardHeader>
                        <CardContent className="p-8 max-h-[60vh] overflow-y-auto">
                            {selectedTechJobs.length > 0 ? (
                                <div className="space-y-4">
                                    {(() => {
                                        // Deduplicar trabajos por request_id para el administrador
                                        const uniqueJobs: any[] = [];
                                        const seen = new Set();
                                        selectedTechJobs.forEach(j => {
                                            if (!seen.has(j.request_id)) {
                                                seen.add(j.request_id);
                                                uniqueJobs.push(j);
                                            }
                                        });

                                        return uniqueJobs.map((job) => (
                                            <div key={job.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center gap-4">
                                                <div className="flex gap-4 items-center min-w-0">
                                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                                                        <Car size={24} className="text-slate-400" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest truncate leading-tight">
                                                                {job.service_requests?.vehicles ? `${job.service_requests.vehicles.year} ${job.service_requests.vehicles.make} ${job.service_requests.vehicles.model}` : 'Vehículo N/A'}
                                                            </p>
                                                            <Badge className="bg-blue-600 border-none text-[8px] font-black px-2">#{job.service_requests?.ticket_number || 'S/N'}</Badge>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                                                            {job.service_requests?.service_catalog?.name || 'Servicio'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <Badge className={`uppercase text-[8px] font-black border-none ${
                                                        job.status === 'IN_PROGRESS' ? 'bg-indigo-100 text-indigo-600' : 
                                                        job.status === 'ARRIVED' ? 'bg-emerald-100 text-emerald-600' :
                                                        'bg-blue-100 text-blue-600'
                                                    }`}>
                                                        {job.status}
                                                    </Badge>
                                                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter italic">
                                                        Proxima: {new Date(job.scheduled_start).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                                    </p>
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-slate-400 italic">No hay trabajos activos para este técnico.</div>
                            )}
                        </CardContent>
                        <div className="p-8 pt-0">
                            <Button onClick={() => setIsJobsModalOpen(false)} className="w-full h-14 rounded-2xl bg-slate-100 text-slate-900 font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all border-none">
                                CERRAR DETALLE
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
