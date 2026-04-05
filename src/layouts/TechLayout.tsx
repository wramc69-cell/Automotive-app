import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Wrench, LogOut, ChevronRight, LayoutDashboard, UserCircle, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function TechLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const navItems = [
        { to: '/tech', icon: <LayoutDashboard size={20} />, label: 'Panel', end: true },
        { to: '/tech/requests', icon: <Wrench size={20} />, label: 'Mis Servicios' },
        { to: '/tech/history', icon: <History size={20} />, label: 'Historial' },
        { to: '/tech/profile', icon: <UserCircle size={20} />, label: 'Mi Perfil' },
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/auth/login');
    };

    return (
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
            {/* Sidebar for Desktop */}
            <aside className="hidden md:flex flex-col w-72 bg-slate-900 text-white border-r border-slate-800 shadow-xl z-20">
                <div className="p-8">
                    <div className="flex items-center gap-3 font-black text-2xl tracking-tighter">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <Wrench size={24} className="text-white" />
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            TECH PANEL
                        </span>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
                    <div className="px-4 mb-4">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Navegación Principal</p>
                    </div>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                `group flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 translate-x-1'
                                    : 'hover:bg-slate-800/50 text-slate-400 hover:text-white'
                                }`
                            }
                        >
                            <div className="flex items-center gap-3">
                                <span className="transition-transform group-hover:scale-110">{item.icon}</span>
                                <span className="font-bold text-sm tracking-tight">{item.label}</span>
                            </div>
                            <ChevronRight size={14} className={`opacity-0 transition-opacity ${item.label === 'Panel' ? '' : 'group-hover:opacity-50'}`} />
                        </NavLink>
                    ))}
                </nav>

                <div className="p-6 mt-auto">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-slate-800/50 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 font-bold text-sm shadow-inner"
                    >
                        <LogOut size={20} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth pb-32 md:pb-8">
                    <div className="max-w-7xl mx-auto h-full">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-6 left-6 right-6 h-16 bg-slate-900/90 backdrop-blur-xl border border-white/10 flex justify-around items-center px-4 rounded-3xl shadow-2xl z-50 overflow-hidden">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300 ${isActive
                                ? 'text-blue-400 scale-110'
                                : 'text-slate-500 hover:text-slate-300'
                            }`
                        }
                    >
                        <div className={`transition-transform duration-300`}>
                            {item.icon}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
                    </NavLink>
                ))}
                <button
                    onClick={handleLogout}
                    className="flex flex-col items-center justify-center gap-1 w-full h-full text-slate-500 hover:text-red-400"
                >
                    <LogOut size={20} />
                    <span className="text-[9px] font-black uppercase tracking-tighter">Salir</span>
                </button>
            </nav>
        </div>
    );
}
