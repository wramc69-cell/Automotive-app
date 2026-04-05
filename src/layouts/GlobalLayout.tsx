import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

export function GlobalLayout() {
    const { user, profile, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/auth/login');
    };

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            <header className="border-b border-border bg-card">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="text-xl font-bold text-primary">Denver Auto Care</Link>

                    <nav className="flex items-center gap-4">
                        {!user ? (
                            <>
                                <Link to="/auth/login" className="text-sm font-bold uppercase tracking-widest text-slate-500 hover:text-primary transition-colors">Ingresar</Link>
                                <span className="text-slate-200">|</span>
                                <Link to="/auth/register" className="text-sm font-bold uppercase tracking-widest text-slate-500 hover:text-primary transition-colors">Registrarme</Link>
                            </>
                        ) : (
                            <div className="flex items-center gap-6">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-400 hidden sm:inline-block">
                                    ¡Buen Dia, <span className="text-slate-900">{profile?.first_name || user.email?.split('@')[0]}</span>!
                                </span>
                                <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl border-slate-200 font-bold uppercase tracking-widest text-[10px]" onClick={handleLogout}>Salir</Button>
                            </div>
                        )}
                    </nav>
                </div>
            </header>

            <main className="flex-1">
                <Outlet />
            </main>

            <footer className="border-t border-border bg-secondary mt-auto py-8">
                <div className="container mx-auto px-4 text-center text-sm text-secondary-foreground">
                    <p>© 2026 Denver Mobile Auto Care. Servicios a domicilio en Denver, CO.</p>
                    <div className="mt-4 flex justify-center gap-4">
                        <Link to="#" className="hover:text-primary">FAQ</Link>
                        <Link to="#" className="hover:text-primary">Contacto</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
