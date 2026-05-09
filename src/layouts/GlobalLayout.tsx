import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { ShieldCheck, Zap, Lock, Menu, X, LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../components/ui/LanguageSelector';

export function GlobalLayout() {
    const { t } = useTranslation();
    const { user, profile, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location]);

    const handleLogout = () => {
        logout();
        navigate('/auth/login');
    };

    const isLanding = location.pathname === '/';

    return (
        <div className="min-h-screen flex flex-col font-sans bg-slate-950">
            {/* 1. Specialized Commercial Header (Dark Premium) */}
            <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 ${scrolled ? 'h-14 bg-slate-950/80 backdrop-blur-3xl border-b border-white/5 shadow-2xl shadow-black/50' : 'h-16 bg-transparent'}`}>
                {/* Brand Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary to-transparent opacity-80"></div>
                
                <div className="container mx-auto px-6 h-full flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 group-hover:bg-primary transition-all duration-700 shadow-lg shadow-primary/10">
                            <Zap className="text-primary group-hover:text-slate-950 transition-colors" fill="currentColor" size={16} />
                        </div>
                        <span className="text-[16px] font-black tracking-tight uppercase text-white">DENVER <span className="text-primary italic">Auto</span></span>
                    </Link>

                    <div className="flex items-center gap-6 lg:gap-12">
                        {/* Desktop Navigation Menu */}
                        <nav className="hidden lg:flex items-center gap-10">
                            <div className="flex items-center gap-8 text-[11px] font-black uppercase tracking-[0.3em] text-white/70">
                                <a href="#servicios" className="hover:text-primary transition-colors italic">{t('nav.services')}</a>
                                <a href="#como-funciona" className="hover:text-primary transition-colors italic">{t('nav.howItWorks')}</a>
                                <a href="#cobertura" className="hover:text-primary transition-colors italic">{t('nav.coverage')}</a>
                            </div>

                            <div className="h-5 w-[1px] bg-white/10 mx-2"></div>

                            {!user ? (
                                <div className="flex items-center gap-6">
                                    <Link to="/auth/login" className="text-[11px] font-black uppercase tracking-[0.4em] text-white hover:text-primary transition-colors italic">
                                        {t('nav.login')}
                                    </Link>
                                    <Link to="/auth/register">
                                        <Button className="rounded-full px-8 h-10 bg-primary text-slate-950 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white transition-all shadow-2xl shadow-primary/20 italic">
                                            {t('nav.explore')}
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 italic">Central_Id</span>
                                        <span className="text-sm font-black text-white italic tracking-tighter uppercase">{profile?.first_name || user.email?.split('@')[0]}</span>
                                    </div>
                                    <button 
                                        onClick={handleLogout}
                                        className="w-11 h-11 bg-white/5 text-slate-400 rounded-xl border border-white/5 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all group shadow-xl"
                                    >
                                        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            )}
                        </nav>

                        <LanguageSelector />

                        {/* Mobile Toggle */}
                        <button 
                            className={`lg:hidden w-10 h-10 rounded-lg flex items-center justify-center transition-all bg-white/5 text-white backdrop-blur-md border border-white/10`}
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <div className={`
                    lg:hidden fixed inset-0 z-[90] bg-slate-950/98 backdrop-blur-3xl transition-all duration-700 flex flex-col items-center justify-center gap-8
                    ${mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}
                `}>
                    <nav className="flex flex-col items-center gap-8">
                        <a href="#servicios" className="text-xl font-black text-white uppercase tracking-[0.3em] italic">{t('nav.services')}</a>
                        <a href="#como-funciona" className="text-xl font-black text-white uppercase tracking-[0.3em] italic">{t('nav.howItWorks')}</a>
                        <a href="#cobertura" className="text-xl font-black text-white uppercase tracking-[0.3em] italic">{t('nav.coverage')}</a>
                        
                        <div className="h-[1px] w-24 bg-primary/20"></div>
                        
                        {!user ? (
                            <div className="flex flex-col items-center gap-6">
                                <Link to="/auth/login" className="text-lg font-black text-primary uppercase tracking-[0.4em] italic">{t('nav.login')}</Link>
                                <Link to="/auth/register">
                                    <Button size="lg" className="rounded-xl px-12 bg-primary text-slate-950 font-black tracking-[0.2em] h-14">{t('auth.register.createAccount')}</Button>
                                </Link>
                                <Link to="/auth/login?role=ADMIN" className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.5em] mt-4 italic">{t('layouts.admin.adminCentral')}</Link>
                            </div>
                        ) : (
                            <button onClick={handleLogout} className="text-rose-500 text-lg font-black uppercase tracking-[0.4em] italic">{t('common.logout')}</button>
                        )}
                    </nav>
                </div>
            </header>

            <main className="flex-1 relative">
                <Outlet />
            </main>

            {/* Specialized Dark Footer */}
            <footer className="bg-slate-950 text-white pt-24 pb-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
                        <div className="space-y-6">
                            <Link to="/" className="flex items-center gap-3 group">
                                <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/30">
                                    <Zap className="text-primary" fill="currentColor" size={16} />
                                </div>
                                <span className="text-xl font-black tracking-tighter uppercase italic">DENVER <span className="text-primary not-italic">Auto_Hub</span></span>
                            </Link>
                            <p className="text-slate-500 text-[11px] font-bold leading-relaxed uppercase tracking-wider italic opacity-80">
                                {t('landing.hero.badge').toUpperCase()}
                            </p>
                            <div className="flex gap-3">
                                {[1, 2, 3].map(i => (
                                     <div key={i} className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary/30 hover:bg-white/10 transition-all cursor-pointer">
                                         <div className="w-2 h-2 bg-current rounded-full"></div>
                                     </div>
                                 ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-white font-black text-[11px] uppercase tracking-[0.6em] mb-10 italic">{t('nav.operations')}</h4>
                            <ul className="space-y-5 text-slate-500 text-[12px] font-black uppercase tracking-[0.2em] italic">
                                <li><a href="#" className="hover:text-primary transition-colors flex items-center gap-3"> <div className="w-1 h-1 bg-primary rounded-full"></div> {t('landing.services.items.oil.title')}</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors flex items-center gap-3"> <div className="w-1 h-1 bg-primary rounded-full"></div> {t('landing.services.items.brakes.title')}</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors flex items-center gap-3"> <div className="w-1 h-1 bg-primary rounded-full"></div> {t('landing.services.items.diagnostic.title')}</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors flex items-center gap-3"> <div className="w-1 h-1 bg-primary rounded-full"></div> {t('landing.services.items.suspension.title')}</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-black text-[11px] uppercase tracking-[0.6em] mb-10 italic">{t('nav.protocols')}</h4>
                            <ul className="space-y-5 text-slate-500 text-[12px] font-black uppercase tracking-[0.2em] italic">
                                <li><Link to="/auth/login?role=ADMIN" className="hover:text-white transition-colors">{t('nav.adminCommand')}</Link></li>
                                <li><Link to="/auth/register?role=TECH" className="hover:text-white transition-colors">{t('nav.techDeployment')}</Link></li>
                                <li><a href="#" className="hover:text-white transition-colors">{t('nav.aboutHq')}</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">{t('nav.privacyProtocol')}</a></li>
                            </ul>
                        </div>

                        <div className="p-8 bg-white/5 rounded-2xl border border-white/5 relative overflow-hidden group/cta">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-primary/20 transition-all"></div>
                            <h4 className="text-white font-black text-[9px] uppercase tracking-[0.6em] mb-6 italic relative z-10">{t('nav.assistanceRadar')}</h4>
                            <div className="space-y-6 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-slate-950 shadow-2xl shadow-primary/40 group-hover:scale-110 transition-transform">
                                        <Zap size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-slate-600 leading-none mb-1 tracking-[0.2em]">Hotline_Secure</p>
                                        <p className="text-white font-black text-base tracking-tighter italic">(303) 555-0123</p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-white/5">
                                    <p className="text-slate-600 text-[9px] font-bold uppercase tracking-[0.4em] leading-relaxed italic">
                                        Denver_Operations_Area.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-black uppercase tracking-[0.6em] italic text-slate-700">
                        <p className="text-center md:text-left">© 2026 DENVER_AUTO_HUB // ALL_SYSTEMS_OPERATIONAL</p>
                        <div className="flex gap-10">
                            <span className="hover:text-primary transition-colors cursor-pointer">ENCRYPTED</span>
                            <span className="hover:text-primary transition-colors cursor-pointer">SECURE_NODE</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
