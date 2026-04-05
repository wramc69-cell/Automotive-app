import { Link } from 'react-router-dom';
import { ShieldAlert, LogOut, ArrowRight, User, Wrench, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';

export function RoleDenied({ allowedRoles }: { allowedRoles: string[] }) {
    const { profile, logout } = useAuth();
    const currentRole = profile?.role || 'USUARIO';

    const getPortalInfo = (role: string) => {
        switch (role) {
            case 'ADMIN': return { label: 'Panel de Administrador', path: '/admin', icon: <ShieldCheck size={24} />, color: 'text-indigo-600', bgColor: 'bg-indigo-50' };
            case 'TECH': return { label: 'Portal de Técnicos', path: '/tech', icon: <Wrench size={24} />, color: 'text-slate-600', bgColor: 'bg-slate-100' };
            case 'CUSTOMER': return { label: 'Área de Clientes', path: '/app', icon: <User size={24} />, color: 'text-primary', bgColor: 'bg-primary/10' };
            default: return { label: 'Inicio', path: '/', icon: <ArrowRight size={24} />, color: 'text-slate-400', bgColor: 'bg-slate-50' };
        }
    };

    const targetPortal = getPortalInfo(currentRole);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 animate-in fade-in duration-500">
            <div className="max-w-md w-full animate-in zoom-in-95 duration-700">
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 overflow-hidden border border-slate-100">
                    <div className="bg-rose-500 p-10 text-white text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <ShieldAlert size={64} className="mx-auto mb-4 relative z-10 animate-bounce" />
                        <h2 className="text-3xl font-black italic relative z-10 tracking-tight">Acceso Denegado</h2>
                        <p className="text-rose-100 font-bold uppercase tracking-widest text-[10px] mt-2 opacity-80">Seguridad de Denver Auto Care</p>
                    </div>

                    <div className="p-8 text-center space-y-6">
                        <div className="space-y-2">
                            <p className="text-slate-600 font-medium">
                                Tu cuenta tiene el perfil de <strong className="text-slate-900 uppercase">{currentRole}</strong>, pero has intentado ingresar a una zona restringida para <strong className="text-rose-600 uppercase">{allowedRoles.join(', ')}</strong>.
                            </p>
                        </div>

                        <div className={`p-6 ${targetPortal.bgColor} rounded-2xl border border-transparent hover:border-slate-50 transition-all group`}>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tu módulo asignado es:</p>
                            <div className="flex items-center justify-center gap-4 mb-4">
                                <div className={`${targetPortal.color}`}>
                                    {targetPortal.icon}
                                </div>
                                <span className={`text-xl font-black italic tracking-tight ${targetPortal.color}`}>
                                    {targetPortal.label}
                                </span>
                            </div>
                            <Link to={targetPortal.path} className="block">
                                <Button fullWidth className="h-12 rounded-xl font-bold shadow-lg shadow-slate-200 group-hover:scale-[1.02] transition-transform">
                                    IR A MI PORTAL <ArrowRight size={18} className="ml-2" />
                                </Button>
                            </Link>
                        </div>

                        <div className="pt-4 border-t border-slate-50 flex flex-col items-center gap-4">
                            <button 
                                onClick={() => logout()}
                                className="text-xs text-slate-400 hover:text-rose-500 font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"
                            >
                                <LogOut size={14} /> Cerrar Sesión e Ingresar con otro Usuario
                            </button>
                        </div>
                    </div>
                </div>
                
                <p className="text-center mt-8 text-[10px] text-slate-300 font-bold uppercase tracking-tighter">
                    © 2026 Denver Mobile Auto Care. Monitoreo de seguridad activo.
                </p>
            </div>
        </div>
    );
}
