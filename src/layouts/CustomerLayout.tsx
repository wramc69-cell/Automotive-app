import { Outlet, NavLink } from 'react-router-dom';
import { Home, User, Car, MessageCircle, Calendar, FileText } from 'lucide-react';

export function CustomerLayout() {
    const navItems = [
        { to: '/app', icon: <Home size={20} />, label: 'Dashboard', end: true },
        { to: '/app/profile', icon: <User size={20} />, label: 'Perfil' },
        { to: '/app/vehicles', icon: <Car size={20} />, label: 'Vehículos' },
        { to: '/app/chat', icon: <Calendar size={20} />, label: 'Agendar' },
        { to: '/app/requests', icon: <FileText size={20} />, label: 'Solicitudes' },
    ];

    return (
        <div className="flex flex-col md:flex-row h-full">
            {/* Sidebar for Desktop / Bottom Nav for Mobile */}
            <aside className="border-r border-border bg-card w-full md:w-64 flex-shrink-0 md:h-dashboard overflow-y-auto hidden md:block">
                <nav className="p-4 flex flex-col gap-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'
                                }`
                            }
                        >
                            {item.icon}
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            <main className="flex-1 p-4 md:p-8 bg-slate-50/50 overflow-y-auto pb-24 md:pb-8">
                <Outlet />
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around p-2 z-40">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                            `flex flex-col items-center gap-1 p-2 rounded-md transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'
                            }`
                        }
                    >
                        {item.icon}
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
