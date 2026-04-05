
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

export function LandingPage() {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="max-w-4xl space-y-12 animate-in">
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
                        Denver <span className="text-primary italic">Auto Care</span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
                        Reparación y mantenimiento automotriz confiable en Denver, CO.
                        Directo a tu casa u oficina para que no detengas tu día.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto w-full">
                    {/* Path Client */}
                    <div className="p-8 bg-white rounded-3xl border-2 border-slate-100 shadow-xl shadow-slate-200/50 space-y-6 flex flex-col items-center transition-all hover:border-primary/20">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></svg>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-slate-800">Soy Cliente</h2>
                            <p className="text-sm text-slate-500 font-medium">Agenda servicios, recibe diagnósticos digitales y aprueba presupuestos.</p>
                        </div>
                        <div className="flex flex-col gap-3 w-full pt-4">
                            <Link to="/auth/register?role=CUSTOMER">
                                <Button size="lg" className="w-full rounded-2xl h-14 font-black">REGISTRARME</Button>
                            </Link>
                            <Link to="/auth/login?role=CUSTOMER">
                                <Button variant="outline" size="lg" className="w-full rounded-2xl h-14 font-black">INGRESAR</Button>
                            </Link>
                        </div>
                    </div>

                    {/* Path Tech */}
                    <div className="p-8 bg-slate-50 rounded-3xl border-2 border-slate-200/50 space-y-6 flex flex-col items-center transition-all hover:bg-slate-100/50">
                        <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-slate-800">Soy Técnico</h2>
                            <p className="text-sm text-slate-500 font-medium">Gestiona tus órdenes de trabajo, realiza inspecciones y envía cotizaciones.</p>
                        </div>
                        <div className="flex flex-col gap-3 w-full pt-4">
                            <Link to="/auth/register?role=TECH">
                                <Button size="lg" variant="secondary" className="w-full rounded-2xl h-14 font-black">UNIRME AL EQUIPO</Button>
                            </Link>
                            <Link to="/auth/login?role=TECH">
                                <Button variant="outline" size="lg" className="w-full rounded-2xl h-14 font-black bg-white">INICIAR SESIÓN</Button>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4 pt-4">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        © 2026 Denver Mobile Auto Care. Servicios a domicilio en Denver, CO.
                    </p>
                    <Link to="/auth/login?role=ADMIN" className="text-[9px] text-slate-300 hover:text-indigo-400 font-bold uppercase tracking-tighter transition-colors">
                        Panel de Administración
                    </Link>
                </div>
            </div>
        </div>
    );
}
