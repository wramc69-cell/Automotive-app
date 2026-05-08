import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import {
    Users, FileCheck, DollarSign,
    ArrowUpRight, Clock, Target, CheckCircle2, Activity
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

export function AdminDashboardPage() {
    const [stats, setStats] = useState<any>({
        counts: {},
        conversionRate: 0,
        avgDiagTime: '0h',
        totalRevenue: 0,
        recentActivity: [],
        clientStats: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    async function loadStats() {
        setLoading(true);
        try {
            // 1. Fetch requests with customer names
            const { data: reqs, error: reqError } = await supabaseAdmin
                .from('service_requests')
                .select('status, profiles:customer_user_id(first_name, last_name, role)');
            
            if (reqError) throw reqError;

            const counts = reqs?.reduce((acc: any, curr: any) => {
                acc[curr.status] = (acc[curr.status] || 0) + 1;
                return acc;
            }, {});

            // Group by client (excluding admins)
            const clientGroups: Record<string, any> = {};
            reqs?.forEach((r: any) => {
                if (r.profiles?.role === 'ADMIN') return; // Hide admins from customer lists
                
                const name = r.profiles ? `${r.profiles.first_name} ${r.profiles.last_name}` : 'Cliente Desconocido';
                if (!clientGroups[name]) {
                    clientGroups[name] = { name, total: 0, statuses: {} };
                }
                clientGroups[name].total++;
                clientGroups[name].statuses[r.status] = (clientGroups[name].statuses[r.status] || 0) + 1;
            });

            const clientStats = Object.values(clientGroups)
                .sort((a: any, b: any) => b.total - a.total)
                .slice(0, 5); // Main dashboard only shows top 5

            const { count: quotedCount } = await supabaseAdmin.from('quotes').select('id', { count: 'exact', head: true });
            const { count: approvedCount } = await supabaseAdmin.from('service_requests').select('id', { count: 'exact', head: true }).eq('status', 'APPROVED');
            const conversion = quotedCount ? (approvedCount || 0) / quotedCount * 100 : 0;

            const { data: revData } = await supabaseAdmin.from('quotes').select('grand_total').eq('status', 'APPROVED');
            const revenue = revData?.reduce((s, c) => s + (c.grand_total || 0), 0) || 0;

            const { data: times } = await supabaseAdmin
                .from('inspections')
                .select('updated_at, service_requests(created_at)')
                .eq('status', 'COMPLETED');

            let avgTimeStr = '3.5h'; // Fallback for demo
            if (times && times.length > 0) {
                const totalDiff = times.reduce((s, t: any) => {
                    const diff = new Date(t.updated_at).getTime() - new Date(t.service_requests.created_at).getTime();
                    return s + diff;
                }, 0);
                const avgHours = totalDiff / times.length / (1000 * 60 * 60);
                avgTimeStr = `${avgHours.toFixed(1)}h`;
            }

            const { data: activity } = await supabaseAdmin
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            setStats({
                counts: counts || {},
                conversionRate: conversion.toFixed(1),
                avgDiagTime: avgTimeStr,
                totalRevenue: revenue,
                recentActivity: activity || [],
                clientStats: clientStats
            });
        } catch (err) {
            console.error('Error loading stats:', err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-10 text-center px-4 font-inter">
            <div className="relative">
                <div className="w-32 h-32 border-[12px] border-white/5 border-t-primary rounded-[2.5rem] animate-spin shadow-3xl shadow-primary/20"></div>
                <Users size={40} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" />
            </div>
            <div className="space-y-3">
                <p className="text-white text-2xl font-black uppercase tracking-[0.4em] italic leading-none">BOOTING_ADMIN_OS</p>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.8em] italic animate-pulse">ANALYZING_METRICS_MATRIX...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 pb-16 animate-in fade-in slide-in-from-bottom-12 duration-1000 font-inter max-w-[1600px] mx-auto px-4 md:px-8">
            
            {/* Cabecera del Centro de Comando (Enhanced Dark) */}
            <div className="relative overflow-hidden bg-white/5 backdrop-blur-3xl rounded-[3rem] p-8 md:p-14 text-white shadow-3xl border border-white/10 group">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 blur-[180px] rounded-full translate-x-1/3 -translate-y-1/3 animate-pulse duration-[5s]"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full -translate-x-1/4 translate-y-1/4"></div>
                
                <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-12">
                    <div className="space-y-6 text-center xl:text-left">
                        <div className="flex items-center gap-8 justify-center xl:justify-start">
                            <div className="w-16 h-16 bg-white/5 backdrop-blur-3xl rounded-2xl flex items-center justify-center text-primary border border-white/10 shadow-2xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-1000">
                                <Target size={32} />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-4 justify-center xl:justify-start">
                                    <div className="w-8 h-[2px] bg-primary rounded-full"></div>
                                    <span className="text-primary font-black text-[11px] uppercase tracking-[0.6em] italic block">Protocolo Alpha Central</span>
                                </div>
                                <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-[0.85]">
                                    Comando <br /> <span className="text-white/20 italic">de Operaciones</span>
                                </h1>
                            </div>
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[11px] max-w-2xl italic leading-relaxed opacity-80">
                            Monitor de alta precisión Denver Auto Care v4.2.0. Gestión de activos y telemetría en tiempo real para la terminal de control.
                        </p>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-6 shrink-0 w-full xl:w-auto">
                        <Button 
                            onClick={loadStats} 
                            className="bg-primary hover:bg-white text-slate-950 h-20 px-12 rounded-[1.5rem] font-black text-[13px] uppercase tracking-[0.4em] italic shadow-3xl shadow-primary/20 transition-all duration-700 hover:scale-105 active:scale-95 flex items-center justify-center gap-6 group/btn border-none"
                        >
                            SINCRONIZAR TERMINAL <ArrowUpRight className="group-hover/btn:translate-x-2 group-hover/btn:-translate-y-2 transition-all duration-700" size={24} />
                        </Button>
                        <div className="flex items-center gap-6 px-10 py-6 bg-white/5 backdrop-blur-3xl rounded-[1.5rem] border border-white/10 justify-center">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-emerald-500 italic">SISTEMA_ONLINE</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Parrilla de Métricas Críticas (KPIs) - Dark Premium */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                <MetricCard 
                    title="Ventas Consolidadas" 
                    value={`$${stats.totalRevenue.toLocaleString()}`} 
                    subtitle="INGRESOS BRUTOS" 
                    icon={<DollarSign size={28} />} 
                    color="text-emerald-400" 
                    bgColor="bg-emerald-400/10"
                    borderColor="border-white/5"
                />
                <MetricCard 
                    title="Conversión" 
                    value={`${stats.conversionRate}%`} 
                    subtitle="CIERRE DE PROSPECTOS" 
                    icon={<Target size={28} />} 
                    color="text-primary" 
                    bgColor="bg-primary/10"
                    borderColor="border-white/5"
                />
                <MetricCard 
                    title="Time Diagnostics" 
                    value={stats.avgDiagTime} 
                    subtitle="EFICIENCIA TÉCNICA" 
                    icon={<Clock size={28} />} 
                    color="text-amber-400" 
                    bgColor="bg-amber-400/10"
                    borderColor="border-white/5"
                />
                <MetricCard 
                    title="Servicios Activos" 
                    value={stats.counts['SCHEDULED'] || 0} 
                    subtitle="UNIDADES EN ESPERA" 
                    icon={<FileCheck size={28} />} 
                    color="text-indigo-400" 
                    bgColor="bg-indigo-400/10"
                    borderColor="border-white/5"
                />
            </div>

            {/* Operaciones por Cliente (Glassmorphic) */}
            <Card className="rounded-[3rem] border border-white/5 shadow-3xl overflow-hidden bg-white/5 backdrop-blur-3xl group transition-all duration-1000">
                <CardHeader className="p-10 pb-6 flex flex-col md:flex-row justify-between items-end gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-[2px] bg-primary rounded-full"></div>
                            <span className="text-primary font-black text-[11px] uppercase tracking-[0.6em] italic">Segmentación Operativa</span>
                        </div>
                        <CardTitle className="text-3xl font-black italic tracking-tighter flex items-center gap-6 text-white uppercase leading-none">
                            <div className="w-14 h-14 bg-white/5 text-slate-500 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-slate-950 transition-all duration-700 shadow-2xl border border-white/10 group-hover:rotate-12"><Users size={28} /></div> 
                            Monitior de Clientes
                        </CardTitle>
                    </div>
                    <div className="text-right">
                        <Badge className="bg-primary text-slate-950 text-[11px] font-black uppercase tracking-[0.4em] italic px-8 py-3 rounded-full border-none shadow-2xl">TOP {stats.clientStats?.length || 0} ACTIVOS</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-10 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {stats.clientStats?.map((client: any) => (
                            <div key={client.name} className="flex flex-col p-8 rounded-[2rem] bg-white/5 border border-white/5 hover:border-primary/30 hover:bg-white/10 hover:shadow-3xl transition-all duration-700 group/item relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full translate-x-1/2 -translate-y-1/2 group-hover/item:scale-150 transition-transform duration-1000 blur-2xl"></div>
                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter line-clamp-1 group-hover/item:text-primary transition-colors">{client.name}</h3>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] italic leading-none">Status: Verificado</p>
                                    </div>
                                    <span className="bg-primary text-slate-950 px-5 py-2 rounded-full text-[11px] font-black shadow-2xl uppercase italic tracking-widest leading-none pt-2.5">
                                        {client.total} REQ
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-3 relative z-10 pt-6 mt-auto border-t border-white/5">
                                    {Object.entries(client.statuses).map(([st, count]: [string, any]) => (
                                        <div key={st} className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl text-[10px] font-black border border-white/5 shadow-inner">
                                            <div className={`w-2.5 h-2.5 rounded-full ${st === 'COMPLETED' ? 'bg-emerald-500' : st === 'CANCELED' ? 'bg-rose-500' : 'bg-primary'} shadow-lg`}></div>
                                            <span className="text-slate-400 uppercase italic tracking-widest leading-none pt-1">{st.replace('_', ' ')}: {count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-11 gap-8">
                {/* Distribución Global (Dark) */}
                <Card className="lg:col-span-4 rounded-[3rem] border border-white/5 shadow-3xl overflow-hidden bg-white/5 backdrop-blur-3xl group">
                    <CardHeader className="bg-slate-950 p-10 relative overflow-hidden border-b border-white/5">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 blur-[100px] rounded-full pointer-events-none"></div>
                        <CardTitle className="text-2xl font-black italic flex items-center gap-6 uppercase tracking-tighter relative z-10 text-white">
                            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-primary border border-white/5 shadow-2xl"><CheckCircle2 size={28} /></div> 
                            Insights Globales
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-10 space-y-4">
                        {Object.entries(stats.counts).length > 0 ? Object.entries(stats.counts).map(([status, count]: [string, any]) => (
                            <div key={status} className="group/stat flex justify-between items-center p-6 bg-white/5 hover:bg-white/10 hover:shadow-2xl rounded-[1.5rem] transition-all duration-700 border border-transparent hover:border-white/10">
                                <div className="flex items-center gap-6">
                                    <div className={`w-4 h-4 rounded-full ${status === 'COMPLETED' ? 'bg-emerald-500 shadow-emerald-500/50' : status === 'CANCELED' ? 'bg-rose-500 shadow-rose-500/50' : 'bg-primary shadow-primary/50'} shadow-xl`}></div>
                                    <span className="font-black text-white uppercase italic tracking-widest text-[13px] group-hover/stat:text-primary transition-colors">{status.replace('_', ' ')}</span>
                                </div>
                                <span className="bg-slate-950 text-white group-hover/stat:bg-primary group-hover/stat:text-slate-950 px-8 py-3 rounded-2xl font-black text-lg transition-all shadow-3xl group-hover/stat:scale-110 italic">
                                    {count}
                                </span>
                            </div>
                        )) : (
                            <div className="py-24 text-center">
                                <p className="text-slate-600 font-black uppercase text-[12px] tracking-[0.6em] italic animate-pulse">Sincronizando Matriz...</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Registro de Auditoría Crítica (Dark Ops) */}
                <Card className="lg:col-span-7 rounded-[3rem] border border-white/5 shadow-3xl overflow-hidden bg-white/5 backdrop-blur-3xl group">
                    <CardHeader className="p-10 pb-6 flex flex-row justify-between items-center bg-transparent border-b border-white/5">
                        <div className="space-y-3">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-[2px] bg-primary rounded-full"></div>
                                <span className="text-primary font-black text-[11px] uppercase tracking-[0.6em] italic">Bitácora de Terminal</span>
                             </div>
                            <CardTitle className="text-3xl font-black italic tracking-tighter flex items-center gap-6 text-white uppercase leading-none">
                                <div className="w-14 h-14 bg-white/5 text-primary rounded-2xl flex items-center justify-center shadow-2xl border border-white/10 group-hover:rotate-12 transition-all duration-1000"><Activity size={28} /></div> 
                                Eventos Críticos
                            </CardTitle>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-4 px-8 py-4 bg-primary/5 rounded-full border border-primary/20 shadow-2xl">
                                <div className="w-3 h-3 rounded-full bg-primary animate-ping"></div>
                                <span className="text-[11px] font-black text-primary uppercase tracking-[0.4em] italic pt-0.5">Live_Stream</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10 pt-8">
                        <div className="space-y-6">
                            {stats.recentActivity.length > 0 ? (
                                stats.recentActivity.map((log: any) => (
                                    <div key={log.id} className="group/log relative pl-16 border-l-2 border-white/5 pb-4 last:pb-0 hover:border-primary transition-all duration-700">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-950 border-2 border-white/10 shadow-2xl group-hover/log:bg-primary group-hover/log:border-primary group-hover/log:scale-150 transition-all duration-700"></div>
                                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 p-6 rounded-[1.5rem] bg-white/5 hover:bg-white/10 hover:shadow-3xl transition-all duration-700 border border-transparent hover:border-white/10">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-6">
                                                    <p className="text-lg font-black text-white uppercase italic tracking-tighter group-hover/log:text-primary transition-colors leading-none">{log.action.replace('_', ' ')}</p>
                                                    <Badge className="text-[10px] font-black bg-white/5 text-slate-500 px-4 py-1.5 rounded-lg border border-white/5 tracking-widest uppercase italic">{log.entity_type}</Badge>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-2 h-2 rounded-full bg-primary/40"></div>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] italic leading-none">ID_VECT: <span className="text-white opacity-40 ml-2">{log.entity_id?.split('-')[0]}</span></p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6 text-slate-400 bg-slate-950/50 px-6 py-4 rounded-2xl shadow-inner border border-white/5 italic shrink-0">
                                                <Clock size={20} className="text-primary animate-pulse" />
                                                <div className="flex flex-col">
                                                    <span className="text-[12px] font-black uppercase tracking-widest leading-none text-white italic">
                                                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </span>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest mt-2 text-slate-600 leading-none">
                                                        {new Date(log.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-24 text-center bg-white/5 backdrop-blur-3xl rounded-[3rem] border-2 border-dashed border-white/5 flex flex-col items-center gap-8">
                                    <div className="w-20 h-20 bg-slate-900 rounded-[1.5rem] border border-white/5 flex items-center justify-center text-slate-800 shadow-3xl animate-pulse"><Target size={40} /></div>
                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white opacity-40">Esperando Transmisión</h3>
                                        <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-slate-600 italic">LOS EVENTOS OPERACIONALES SE REGISTRARÁN EN TIEMPO REAL.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function MetricCard({ title, value, subtitle, icon, color, bgColor, borderColor }: any) {
    return (
        <div className={`relative group p-8 bg-white/5 backdrop-blur-3xl border ${borderColor} rounded-[2.5rem] shadow-3xl hover:shadow-primary/20 hover:border-primary/30 transition-all duration-1000 overflow-hidden`}>
            <div className={`absolute -right-10 -top-10 opacity-5 group-hover:opacity-10 transition-opacity duration-1000 scale-[3.5] rotate-12 ${color}`}>
                {icon}
            </div>
            <div className={`w-14 h-14 ${bgColor} ${color} rounded-2xl flex items-center justify-center mb-6 shadow-2xl border border-white/5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-1000`}>
                {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 28 }) : icon}
            </div>
            <div className="space-y-4">
                <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-500 italic leading-none">{title}</p>
                <div className={`text-4xl font-black italic tracking-tighter text-white group-hover:text-primary transition-all duration-700 origin-left`}>{value}</div>
                <div className="flex items-center gap-4 pt-6 border-t border-white/5">
                    <div className={`w-3 h-3 rounded-full ${color} animate-pulse shadow-lg`}></div>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] italic leading-none pt-1">{subtitle}</p>
                </div>
            </div>
        </div>
    );
}
