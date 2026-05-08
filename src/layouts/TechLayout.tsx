import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Wrench, LogOut, ChevronRight, LayoutDashboard, UserCircle, History, Zap, Settings, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function TechLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const navItems = [
        { to: '/tech', icon: <LayoutDashboard size={22} />, label: 'TERMINAL', end: true },
        { to: '/tech/requests', icon: <Wrench size={22} />, label: 'MISIONES' },
        { to: '/tech/history', icon: <History size={22} />, label: 'HISTORIAL' },
        { to: '/tech/profile', icon: <UserCircle size={22} />, label: 'PERFIL' },
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/auth/login');
    };

    return (
        <div className="flex min-h-screen bg-slate-950 font-inter text-slate-200">
            {/* Operator Sidebar */}
            <aside className="w-64 flex-shrink-0 hidden md:block relative z-40">
                <div className="h-screen bg-slate-900/50 border-r border-white/5 flex flex-col justify-between sticky top-0 backdrop-blur-3xl shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
                    
                    <div className="p-8 space-y-10 relative z-10">
                        {/* Brand Section */}
                        <div className="flex items-center gap-4 group/brand cursor-pointer">
                            <div className="w-12 h-12 bg-primary rounded-[1rem] flex items-center justify-center shadow-2xl shadow-primary/20 group-hover/brand:rotate-12 transition-all duration-700">
                                <Zap size={24} className="text-slate-950 fill-current" />
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-xl font-black italic tracking-tighter text-white leading-none">DENVER <span className="text-primary block not-italic">Tech Hub</span></h1>
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic">Operations Console</span>
                            </div>
                        </div>

                        {/* Navigation Terminal */}
                        <nav className="flex flex-col gap-2">
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em] mb-4 px-3">Terminal Console</p>
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    className={({ isActive }) =>
                                        `flex items-center justify-between group px-4 py-3 rounded-2xl transition-all duration-700 relative overflow-hidden ${
                                            isActive 
                                            ? 'bg-primary text-slate-950 shadow-2xl shadow-primary/10' 
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            <div className="flex items-center gap-4 relative z-10">
                                                <div className={`transition-all duration-500 ${isActive ? 'scale-110' : 'group-hover:text-primary group-hover:scale-110'}`}>
                                                    {item.icon}
                                                </div>
                                                <span className="text-[11px] font-bold tracking-widest uppercase">{item.label}</span>
                                            </div>
                                            {isActive ? (
                                                <div className="w-2 h-2 bg-slate-950 rounded-full shadow-lg relative z-10 animate-in zoom-in duration-500"></div>
                                            ) : (
                                                <div className="w-1 h-3 bg-white/10 rounded-full group-hover:bg-primary/50 transition-colors"></div>
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </nav>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 relative z-10 space-y-4">
                        <div className="p-5 bg-white/5 rounded-3xl border border-white/5 space-y-4 transition-all hover:bg-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500"></div>
                                <span className="text-[10px] font-bold text-emerald-500 tracking-widest uppercase italic">Estado: Online</span>
                            </div>
                            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-primary h-full w-[85%] rounded-full shadow-lg shadow-primary/20"></div>
                            </div>
                        </div>
                        
                        <button
                            onClick={handleLogout}
                            className="w-full h-14 flex items-center justify-center gap-3 rounded-2xl bg-rose-500/5 hover:bg-rose-500 text-slate-500 hover:text-white transition-all duration-700 font-bold text-xs tracking-widest group/logout"
                        >
                            <LogOut size={20} className="group-hover/logout:-translate-x-1 transition-transform" />
                            CERRAR SESIÓN
                        </button>
                    </div>
                </div>
            </aside>

            {/* Content Core */}
            <div className="flex-1 flex flex-col min-w-0 bg-transparent relative overflow-y-auto">
                <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-primary/5 blur-[200px] rounded-full pointer-events-none -z-0"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-blue-500/5 blur-[150px] rounded-full -z-0 pointer-events-none"></div>
                
                <main className="flex-1 p-5 md:p-10 lg:p-14 relative z-10">
                    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Mobile Operator Nav */}
            <nav className="md:hidden fixed bottom-3 left-4 right-4 h-14 bg-slate-900/90 backdrop-blur-3xl rounded-2xl flex items-center justify-around px-6 z-50 shadow-3xl shadow-slate-900/50 border border-white/5 ring-1 ring-white/10">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center gap-1.5 transition-all duration-500 ${
                                isActive ? 'text-primary scale-110' : 'text-slate-500 hover:text-white'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div className={`transition-all duration-500 ${isActive ? 'translate-y-[-4px]' : 'translate-y-0'}`}>
                                    {item.icon}
                                </div>
                                <span className={`text-[8px] font-black uppercase tracking-widest italic transition-all duration-500 ${isActive ? 'opacity-100 mt-1' : 'opacity-0 scale-50 h-0'}`}>
                                    {item.label}
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}
                <button
                    onClick={handleLogout}
                    className="flex flex-col items-center justify-center gap-1.5 text-slate-500 hover:text-rose-500 transition-colors"
                >
                    <LogOut size={22} />
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-0 h-0 italic">OUT</span>
                </button>
            </nav>
        </div>
    );
}
