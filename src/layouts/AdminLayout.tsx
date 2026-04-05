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
        <div className="flex flex-col md:flex-row h-screen bg-slate-50 overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="border-r border-slate-200 bg-white w-64 flex-shrink-0 hidden md:flex flex-col shadow-2xl shadow-slate-200/50 z-10">
                <div className="p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <BarChart3 size={20} />
                        </div>
                        <div>
                            <h2 className="font-black text-slate-900 leading-none tracking-tight italic">DENVER</h2>
                            <p className="text-[10px] font-black text-indigo-600 tracking-tighter uppercase">Admin Console</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${
                                    isActive 
                                    ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200 translate-x-1' 
                                    : 'hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 font-medium'
                                }`
                            }
                        >
                            {item.icon}
                            <span className="text-sm tracking-tight">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 mt-auto border-t border-slate-50">
                    <button 
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-rose-500 hover:bg-rose-50 transition-colors font-bold text-sm"
                    >
                        <Send size={18} className="rotate-180" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-[#fafbfc] px-4 md:px-12 py-8 relative">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>

            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-indigo-950 border-t border-indigo-900 flex flex-wrap justify-around p-2 z-40">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                            `flex flex-col items-center gap-1 p-2 rounded-md transition-colors ${isActive ? 'text-indigo-400' : 'text-indigo-300/50'
                            }`
                        }
                    >
                        {item.icon}
                        <span className="text-[10px] font-medium hidden sm:block">{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
