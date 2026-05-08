import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, User, Car, Calendar, FileText, ChevronRight, Settings } from 'lucide-react';

export function CustomerLayout() {
    const navItems = [
        { to: '/app', icon: <LayoutDashboard size={22} />, label: 'DASHBOARD', end: true },
        { to: '/app/profile', icon: <User size={22} />, label: 'PERFIL' },
        { to: '/app/vehicles', icon: <Car size={22} />, label: 'MI GARAGE' },
        { to: '/app/chat', icon: <Calendar size={22} />, label: 'AGENDAR' },
        { to: '/app/requests', icon: <FileText size={22} />, label: 'MISIONES' },
    ];

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 font-inter text-slate-200">
            {/* Sidebar for Desktop - High End Navigation */}
            <aside className="w-64 flex-shrink-0 hidden md:block relative z-30">
                <div className="h-full bg-slate-900/50 border-r border-white/5 p-8 flex flex-col justify-between sticky top-0 backdrop-blur-3xl">
                    <div className="space-y-10">
                        <div className="px-4">
                            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mb-3 italic">Panel de Control</h2>
                        </div>
                        
                        <nav className="flex flex-col gap-2">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    className={({ isActive }) =>
                                        `flex items-center justify-between group px-4 py-3 rounded-2xl transition-all duration-500 overflow-hidden relative ${
                                            isActive 
                                            ? 'bg-primary text-slate-950 shadow-2xl shadow-primary/20 scale-[1.02]' 
                                            : 'hover:bg-white/5 text-slate-400 hover:text-white font-bold'
                                        }`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            <div className="flex items-center gap-4 relative z-10 transition-transform duration-500">
                                                <div className={`transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:text-primary group-hover:scale-110'}`}>
                                                    {item.icon}
                                                </div>
                                                <span className={`text-[11px] font-black tracking-widest uppercase transition-all ${isActive ? 'translate-x-1' : ''}`}>{item.label}</span>
                                            </div>
                                            {isActive ? (
                                                <div className="relative z-10 animate-in slide-in-from-right-4 duration-500">
                                                    <div className="w-1.5 h-1.5 bg-slate-950 rounded-full shadow-lg"></div>
                                                </div>
                                            ) : (
                                                <ChevronRight size={16} className="text-slate-700 group-hover:text-primary transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1" />
                                            )}
                                            {isActive && (
                                                <div className="absolute top-0 right-0 w-24 h-full bg-white/10 blur-3xl rounded-full translate-x-1/2"></div>
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </nav>
                    </div>

                    <div className="px-4">
                        <div className="p-6 bg-white/5 rounded-3xl border border-white/5 relative overflow-hidden group/sys transition-all hover:bg-white/10">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                            <div className="relative z-10 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-lg shadow-primary"></div>
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-primary">Estado Sistema</span>
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 group-hover/sys:text-white transition-colors italic">Online v3.0.4</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Operational Area */}
            <main className="flex-1 p-5 md:p-10 lg:p-14 bg-transparent pb-24 md:pb-16 relative overflow-hidden overflow-y-auto">
                {/* Visual Depth Accents */}
                <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-primary/5 blur-[180px] rounded-full -z-0 pointer-events-none"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-blue-500/5 blur-[150px] rounded-full -z-0 pointer-events-none"></div>
                
                <div className="relative z-10 w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Adaptive Terminal Nav */}
            <nav className="md:hidden fixed bottom-6 left-6 right-6 h-20 bg-slate-900/90 backdrop-blur-3xl rounded-[2rem] flex items-center justify-around px-8 z-50 shadow-3xl shadow-slate-900/40 border border-white/5 ring-1 ring-white/10 scale-in-center">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center gap-1.5 transition-all duration-500 relative ${
                                isActive ? 'text-primary scale-110' : 'text-slate-500 hover:text-white'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div className={`transition-all duration-500 ${isActive ? 'translate-y-[-4px]' : 'translate-y-0'}`}>
                                    {item.icon}
                                </div>
                                {isActive && (
                                    <div className="absolute top-[-15px] w-8 h-8 bg-primary/20 blur-xl rounded-full scale-150 animate-pulse"></div>
                                )}
                                <span className={`text-[8px] font-black uppercase tracking-widest italic transition-all duration-500 ${isActive ? 'opacity-100 scale-100 mt-1' : 'opacity-0 scale-50'}`}>
                                    {item.label}
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
