import { Outlet, NavLink } from 'react-router-dom';
import { BarChart3, Users, Settings, Wrench, Send, ClipboardCheck, GitBranch, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function AdminLayout() {
    const { logout } = useAuth();
    const navItems = [
        { to: '/admin', icon: <BarChart3 size={20} />, label: 'Dashboard', end: true },
        { to: '/admin/requests', icon: <Wrench size={20} />, label: 'Servicios' },
        { to: '/admin/techs', icon: <Users size={20} />, label: 'Técnicos' },
        { to: '/admin/admins', icon: <ShieldCheck size={20} />, label: 'Admins' },
        { to: '/admin/checklist-templates', icon: <ClipboardCheck size={20} />, label: 'Plantillas' },
        { to: '/admin/template-rules', icon: <GitBranch size={20} />, label: 'Reglas' },
        { to: '/admin/catalog', icon: <Settings size={20} />, label: 'Catálogo' },
        { to: '/admin/config', icon: <Settings size={20} />, label: 'Ajustes' },
        { to: '/admin/notifications', icon: <Send size={20} />, label: 'Avisos' }
    ];

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 font-inter text-slate-200">
            {/* Desktop Sidebar */}
            <aside className="w-64 flex-shrink-0 hidden md:flex flex-col relative z-30">
                <div className="h-full bg-slate-900/50 border-r border-white/5 flex flex-col justify-between sticky top-0 backdrop-blur-3xl shadow-2xl">
                    <div className="p-8 space-y-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary rounded-[1rem] flex items-center justify-center text-slate-950 shadow-2xl shadow-primary/20">
                                <BarChart3 size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black italic tracking-tighter text-white leading-none">DENVER</h2>
                                <p className="text-[9px] font-bold text-primary tracking-widest uppercase mt-1">Admin Central</p>
                            </div>
                        </div>

                        <nav className="flex flex-col gap-2">
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em] mb-4 px-3">Gestión Global</p>
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    className={({ isActive }) =>
                                        `flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-700 ${
                                            isActive 
                                            ? 'bg-primary text-slate-950 font-bold shadow-2xl shadow-primary/20 scale-[1.02]' 
                                            : 'hover:bg-white/5 text-slate-400 hover:text-white font-medium'
                                        }`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            <div className={`${isActive ? 'scale-110' : 'opacity-70 group-hover:opacity-100 transition-opacity'}`}>
                                                {item.icon}
                                            </div>
                                            <span className="text-xs font-bold tracking-wide">{item.label}</span>
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6">
                        <button 
                            onClick={logout}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-slate-400 hover:text-white hover:bg-rose-500 transition-all duration-700 font-bold text-xs tracking-widest group"
                        >
                            <Send size={18} className="rotate-180 group-hover:-translate-x-2 transition-transform" />
                            CERRAR SESIÓN
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 bg-transparent px-4 md:px-10 py-10 relative overflow-y-auto">
                <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-primary/5 blur-[180px] rounded-full -z-0 pointer-events-none"></div>
                <div className="max-w-7xl mx-auto relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <Outlet />
                </div>
            </main>

            <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-3xl border border-white/5 rounded-2xl flex flex-wrap justify-around p-3 z-50 shadow-2xl overflow-hidden ring-1 ring-white/10">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                            `flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${isActive ? 'text-primary scale-110' : 'text-slate-500'
                            }`
                        }
                    >
                        {item.icon}
                        {/* <span className="text-[10px] font-medium hidden sm:block">{item.label}</span> */}
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
