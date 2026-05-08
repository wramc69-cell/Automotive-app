import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { 
    Zap, 
    Wrench, 
    User, 
    ShieldCheck, 
    CheckCircle2, 
    Clock, 
    MapPin, 
    Phone, 
    ChevronRight,
    Star,
    LayoutDashboard,
    ArrowRight,
    Bot,
    MessageSquare
} from 'lucide-react';

export function LandingPage() {
    return (
        <div className="flex flex-col w-full bg-slate-950 font-sans text-slate-100 overflow-x-hidden">
            {/* 1. Hero Section - Immersive Commercial Presence */}
            <section className="relative h-[600px] md:h-[700px] flex items-center overflow-hidden bg-slate-950">
                {/* Real Denver Backdrop */}
                <div className="absolute inset-0 z-0">
                    <img 
                        src="/denver_skyline_hero.png" 
                        alt="Denver Skyline and Colorado Mountains" 
                        className="w-full h-full object-cover opacity-60 scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
                    <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-slate-950 to-transparent"></div>
                </div>

                {/* Brand Decorative Accent */}
                <div className="absolute top-0 left-12 w-px h-64 bg-gradient-to-b from-primary to-transparent opacity-50 hidden lg:block"></div>

                <div className="container mx-auto px-6 relative z-10 pt-20">
                    <div className="max-w-4xl space-y-12">
                        <div className="space-y-6 animate-denver-in">
                            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full">
                                <span className="flex h-2 w-2 rounded-full bg-primary animate-ping"></span>
                                <span className="text-white text-[11px] font-black uppercase tracking-[0.4em] italic">Mecánica Móvil Premium en Colorado</span>
                            </div>
                            
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white uppercase leading-[0.85] mb-4">
                                EL PODER <br />
                                <span className="text-primary italic">DE REPARAR</span> <br />
                                <span className="text-white">DONDE SEA.</span>
                            </h1>
                        </div>

                        <p className="text-base md:text-lg font-medium text-slate-400 max-w-lg leading-relaxed animate-denver-in [animation-delay:200ms]">
                            Olvídate de las salas de espera. Llevamos la tecnología y el equipo de un taller certificado <span className="text-white font-bold italic underline decoration-primary decoration-4 underline-offset-8">directamente a tu ubicación</span>.
                        </p>

                        <div className="flex flex-wrap gap-4 pt-4 animate-denver-in [animation-delay:400ms]">
                            <Link to="/auth/register">
                                <Button className="h-14 px-10 rounded-xl bg-primary text-slate-950 font-black text-xs uppercase tracking-widest hover:bg-white hover:scale-105 transition-all shadow-xl group relative overflow-hidden">
                                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                                    SOLICITAR CITA <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <a href="tel:3035550123" className="flex items-center h-14 px-6 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all shadow-lg">
                                <Phone size={18} className="mr-3 text-primary animate-pulse" /> (303) 555-0123
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Unified Role Selection - Tactical Command Portals */}
            <section className="relative z-20 md:-mt-32 mb-24">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {/* Client Portal - Luxury Concierge */}
                        <Link to="/auth/login?role=CUSTOMER" className="group h-[450px] relative">
                            <div className="h-full bg-slate-900 border border-white/10 rounded-3xl overflow-hidden group-hover:border-primary transition-all duration-700 shadow-3xl hover:-translate-y-2 relative">
                                <img src="/luxury_car_owner.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:scale-110 transition-all duration-2000" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                                
                                <div className="absolute inset-0 p-8 flex flex-col justify-end gap-4">
                                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-slate-950 shadow-3xl shadow-primary/30 group-hover:rotate-12 transition-all duration-700">
                                        <User size={24} strokeWidth={2.5} />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-[1px] bg-primary rounded-full"></div>
                                            <span className="text-primary font-black text-[8px] uppercase tracking-[0.4em] italic">Misión de Cliente</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Pedir <br /> <span className="text-primary italic">Asistencia</span></h3>
                                        <p className="text-slate-400 font-bold text-xs leading-relaxed italic opacity-80">Acceso concierge. Agenda servicios premium con un solo toque.</p>
                                    </div>
                                    <div className="w-full flex justify-between items-center border-t border-white/10 pt-4 mt-2">
                                        <span className="text-white font-black text-[8px] uppercase tracking-[0.3em] italic">INGRESAR PROTOCOLO</span>
                                        <div className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-3xl text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-slate-950 transition-all duration-500 shadow-2xl border border-white/5">
                                            <ArrowRight size={18} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        <Link to="/auth/register?role=TECH" className="group h-[450px] relative">
                            <div className="h-full bg-slate-950 border border-white/10 rounded-3xl overflow-hidden group-hover:border-emerald-500/50 transition-all duration-700 shadow-3xl hover:-translate-y-2 relative">
                                {/* Photographic Tech Background - Elite Engineer working with Digital Tools */}
                                <img 
                                    src="https://images.unsplash.com/photo-1586335345719-786d7e0086c8?q=80&w=800&auto=format&fit=crop" 
                                    alt="" 
                                    className="absolute inset-0 w-full h-full object-cover opacity-60 brightness-[0.9] group-hover:opacity-75 group-hover:scale-110 transition-all duration-2000 contrast-110"
                                    onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80"; }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-30"></div>
                                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] opacity-10"></div>
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                                
                                <div className="absolute inset-0 p-8 flex flex-col justify-end gap-4">
                                    <div className="w-12 h-12 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all duration-700 shadow-3xl">
                                        <Wrench size={24} strokeWidth={2.5} />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-[1px] bg-emerald-500 rounded-full"></div>
                                            <span className="text-emerald-500 font-black text-[8px] uppercase tracking-[0.4em] italic">Unidad de Élite</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Soy <br /> <span className="text-emerald-500 italic">Ingeniero</span></h3>
                                        <p className="text-slate-400 font-bold text-xs leading-relaxed italic opacity-80">Únete a la flota táctica. Gestión digital Denver.</p>
                                    </div>
                                    <div className="w-full flex justify-between items-center border-t border-white/10 pt-4 mt-2">
                                        <span className="text-white font-black text-[8px] uppercase tracking-[0.3em] italic">DESPLEGAR UNIDAD</span>
                                        <div className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-3xl text-emerald-500 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all duration-500 shadow-2xl border border-white/5">
                                            <ArrowRight size={18} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        <Link to="/auth/login?role=ADMIN" className="group h-[450px] relative">
                            <div className="h-full bg-slate-900 border border-white/5 rounded-3xl overflow-hidden group-hover:border-white/40 transition-all duration-700 shadow-3xl hover:-translate-y-2 relative">
                                {/* Photographic Admin Background */}
                                <img 
                                    src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop" 
                                    alt="" 
                                    className="absolute inset-0 w-full h-full object-cover opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-2000"
                                />
                                <div className="absolute inset-0 opacity-30">
                                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px]"></div>
                                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-transparent to-white/5"></div>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                                
                                <div className="absolute inset-0 p-8 flex flex-col justify-end gap-4">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-950 shadow-3xl group-hover:bg-primary transition-all duration-700">
                                        <LayoutDashboard size={24} strokeWidth={2.5} />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-[1px] bg-slate-500 rounded-full"></div>
                                            <span className="text-slate-500 font-black text-[8px] uppercase tracking-[0.4em] italic">Comando Central</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">MISSION <br /> <span className="text-white italic">CONTROL</span></h3>
                                        <p className="text-slate-400 font-bold text-xs leading-relaxed italic opacity-80">Métricas en tiempo real y dispatch de flota.</p>
                                    </div>
                                    <div className="w-full flex justify-between items-center border-t border-white/10 pt-4 mt-2">
                                        <span className="text-slate-500 font-black text-[8px] uppercase tracking-[0.3em] italic">ACCESO RESTRINGIDO</span>
                                        <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center group-hover:bg-white group-hover:text-slate-950 transition-all duration-500 shadow-2xl">
                                            <ArrowRight size={18} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </section>

            {/* 3. Services Grid - Stitch Professional Style */}
            <section id="servicios" className="py-32 bg-slate-50 relative overflow-hidden text-slate-900 font-sans">
                <div className="container mx-auto px-6 space-y-20 relative z-10">
                    <div className="space-y-4">
                        <span className="text-blue-600 font-black text-[10px] uppercase tracking-widest leading-tight">NUESTRAS ESPECIALIDADES</span>
                        <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">Servicios Profesionales</h2>
                    </div>
 
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { 
                                title: "Aceite y Fluidos", 
                                desc: "Mantenimiento preventivo esencial. Reemplazo de fluidos vitales con insumos premium para proteger el motor de tu vehículo.",
                                image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCHsAJAODjwdu6WHzlOsacYFxqLSRtnFIeNjJ_87gNW1UCwBizEKH05cpEr9MGLjckw89BI0i1QLPp_aRC-fyANfZSNE8bD_q3m5w5k445vXqA5aug4bkLBpHhRQbcCdQQY_iyXC7WidoMHMajYLJYFv5NsGNLfgGQFOtRXEKGU3Kezyhs-Jd9uHq8OiICsIjiEhFPm8qx9nglOEx8kCJ7iygr3_f5Qqde7PkhugypPfAQTvjcBHB-Wz5HrmENO5ZT8eku71zFimRY",
                                slug: "aceite"
                            },
                            { 
                                title: "Reparación de Frenos", 
                                desc: "Inspección, diagnóstico y reemplazo de componentes de fricción y sistemas hidráulicos para una frenada segura.",
                                image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAQk4G5JgdqgsomUuyK2W20eL5JJfW1LZuK_lJIihH8NMC9sxW04GZxf175n-WpwxHAPHO-AwPrnK-ZSQkJejHIvgS1MSptLYibC2l-VcT8p6q7W2Pj2YiAWuG7CYJyKiyO8KYadVQlglv2IsuibhFCkykoBuRbq8dPHWWmkOxeldbYVYyzRZbwjWUaWmsgtYb2yMQaoW7IOeDMpgV4WOUsyK9q3bfizQzPV14c0fQ8Rb0p-lrEyTH4oTr3yEBMJV1aqRFIdTg-WhE",
                                slug: "frenos"
                            },
                            { 
                                title: "Diagnóstico Integral", 
                                desc: "Lectura de computadoras a bordo y escaneo multisistema para localizar fallas electrónicas con precisión milimétrica.",
                                image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBfm4UsAJydiHQfwnHuklRgDDcET7sfRm09dhER2svFQtjZv13WGzzIV8wCs-XhaZPq5-3pYE2V2411PA7J6E9GQP-RmHuvhlONA76RWjUFvh0s-cgg7DU3gMPUzDz2iQzf1goUSfGeTek5us_MdHuRletAsi1fqEQNGSTCIPywaWIoarN71YyaQmfPSeO2dfq9Ugpgc_9vWeqyjao5njjUt_rIvrCA7FZwC6eoS5XXVIolcb_2-8aOqs0Ptk-M9vEH3Y3T6F2SVhg",
                                slug: "diagnostico"
                            },
                            { 
                                title: "Suspensión y Dirección", 
                                desc: "Alineación, balanceo y sustitución de piezas de desgaste en el tren de rodaje para restaurar el confort de conducción.",
                                image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCZhLqTobn1VKhGWA4HWcbFBYM0O4YmCqsvqXzu8hsf7UmO7eNyaHuWdC4WspvaFeqTk3eFGnjwrmCyOFrMGHw6btbRi9bgulSy2Xxi9SO9cfwk1gfIrh9CR-mKU31U9ScCGN14sOkwmCP8S0uDh1uy64vWaFdBmHGotGlhajn3IU2ciLi34ltORzuni2b0cKskMePYyKLsvVFKb0xvx-tSK1S55KeyvAS8-f3wLR2RUCf9B9WhraiZE9HyvLUV9EX9uSNhCXpSrlA",
                                slug: "suspension"
                            }
                        ].map((s, i) => (
                            <a 
                                href={`#detalle-${s.slug}`}
                                key={i} 
                                className="bg-white rounded-[1.5rem] border border-slate-200 overflow-hidden flex flex-col hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group"
                            >
                                <div className="aspect-[16/10] overflow-hidden relative">
                                    <img 
                                        src={s.image} 
                                        alt={s.title} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                        onError={(e) => { e.currentTarget.src = "/denver_skyline_hero.png"; }}
                                    />
                                    <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors duration-500"></div>
                                </div>
                                <div className="p-8 flex flex-col flex-1 gap-4">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none group-hover:text-blue-600 transition-colors">
                                        {s.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                        {s.desc}
                                    </p>
                                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-blue-600">
                                        <span className="font-black text-[11px] uppercase tracking-widest group-hover:tracking-[0.2em] transition-all">Ver Detalles</span>
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>

                    {/* Service Deep Dives */}
                    <div className="pt-24 space-y-32">
                        {[
                            {
                                id: "detalle-aceite",
                                title: "Aceite y Fluidos",
                                subtitle: "Prevención y Rendimiento",
                                text: "El aceite es la sangre de su motor. Proveemos un servicio integral de lubricación utilizando aceites 100% sintéticos de marcas líderes que superan las especificaciones del fabricante (OEM). Nuestro protocolo asegura la máxima limpieza y protección térmica de las piezas móviles de su vehículo.",
                                image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCHsAJAODjwdu6WHzlOsacYFxqLSRtnFIeNjJ_87gNW1UCwBizEKH05cpEr9MGLjckw89BI0i1QLPp_aRC-fyANfZSNE8bD_q3m5w5k445vXqA5aug4bkLBpHhRQbcCdQQY_iyXC7WidoMHMajYLJYFv5NsGNLfgGQFOtRXEKGU3Kezyhs-Jd9uHq8OiICsIjiEhFPm8qx9nglOEx8kCJ7iygr3_f5Qqde7PkhugypPfAQTvjcBHB-Wz5HrmENO5ZT8eku71zFimRY",
                                specs: [
                                    "Cambio de aceite y filtro con grados de viscosidad precisos para el clima de Denver.",
                                    "Reposición de líquido refrigerante (Anticongelante) y revisión de fugas en el radiador.",
                                    "Reemplazo o purgado de líquido de transmisión y líquido de dirección hidráulica.",
                                    "Inspección ecológica: disposición segura de los fluidos usados."
                                ]
                            },
                            {
                                id: "detalle-frenos",
                                title: "Reparación de Sistema de Frenos",
                                subtitle: "Seguridad Sin Concesiones",
                                text: "La capacidad de detenerse a tiempo no es negociable. Realizamos intervenciones completas en el sistema de frenado, desde sustituciones rutinarias de pastillas hasta complejas reparaciones en el tren hidráulico, asegurando que tu vehículo responda instantáneamente al pedal.",
                                image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAQk4G5JgdqgsomUuyK2W20eL5JJfW1LZuK_lJIihH8NMC9sxW04GZxf175n-WpwxHAPHO-AwPrnK-ZSQkJejHIvgS1MSptLYibC2l-VcT8p6q7W2Pj2YiAWuG7CYJyKiyO8KYadVQlglv2IsuibhFCkykoBuRbq8dPHWWmkOxeldbYVYyzRZbwjWUaWmsgtYb2yMQaoW7IOeDMpgV4WOUsyK9q3bfizQzPV14c0fQ8Rb0p-lrEyTH4oTr3yEBMJV1aqRFIdTg-WhE",
                                specs: [
                                    "Instalación de balatas y pastillas de calidad OEM (cerámicas o semi-metálicas).",
                                    "Rectificación experta o reemplazo directo de discos (rotores) y tambores.",
                                    "Inspección de calipers, mangueras y cilindros maestros para descartar bloqueos.",
                                    "Cambio y presurización del líquido de frenos (DOT 3 / DOT 4)."
                                ]
                            },
                            {
                                id: "detalle-diagnostico",
                                title: "Diagnóstico Integral y Electrónica",
                                subtitle: "Tecnología de Punta",
                                text: "Los autos modernos son redes de computadoras sobre ruedas. Cuando se enciende la luz de 'Check Engine', utilizamos herramientas computarizadas y osciloscopios de última generación para interpretar códigos difusos y aislar problemas eléctricos sin adivinanzas.",
                                image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBfm4UsAJydiHQfwnHuklRgDDcET7sfRm09dhER2svFQtjZv13WGzzIV8wCs-XhaZPq5-3pYE2V2411PA7J6E9GQP-RmHuvhlONA76RWjUFvh0s-cgg7DU3gMPUzDz2iQzf1goUSfGeTek5us_MdHuRletAsi1fqEQNGSTCIPywaWIoarN71YyaQmfPSeO2dfq9Ugpgc_9vWeqyjao5njjUt_rIvrCA7FZwC6eoS5XXVIolcb_2-8aOqs0Ptk-M9vEH3Y3T6F2SVhg",
                                specs: [
                                    "Escaneo bidireccional y lectura de datos OBD-II en tiempo real.",
                                    "Evaluación profunda del sistema de inyección, bujías y bobinas de encendido.",
                                    "Pruebas de alternador, batería y caída de voltaje en redes complejas.",
                                    "Solución integral para monitores de emisiones e inspección de gases."
                                ]
                            },
                            {
                                id: "detalle-suspension",
                                title: "Geometría, Dirección y Suspensión",
                                subtitle: "Control y Estabilidad",
                                text: "Evite el desgaste irregular de los neumáticos y recupere el confort de viaje. Un sistema de suspensión robusto es crucial para tolerar el terreno de la ciudad y absorber el impacto sin transferirlo a la cabina ni comprometer la dirección asistida.",
                                image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCZhLqTobn1VKhGWA4HWcbFBYM0O4YmCqsvqXzu8hsf7UmO7eNyaHuWdC4WspvaFeqTk3eFGnjwrmCyOFrMGHw6btbRi9bgulSy2Xxi9SO9cfwk1gfIrh9CR-mKU31U9ScCGN14sOkwmCP8S0uDh1uy64vWaFdBmHGotGlhajn3IU2ciLi34ltORzuni2b0cKskMePYyKLsvVFKb0xvx-tSK1S55KeyvAS8-f3wLR2RUCf9B9WhraiZE9HyvLUV9EX9uSNhCXpSrlA",
                                specs: [
                                    "Diagnóstico y reemplazo de amortiguadores y resortes defectuosos.",
                                    "Revisión de bujes de horquilla, terminales de dirección y rótulas.",
                                    "Corrección de ruidos ('clunks') en topes, barras estabilizadoras y ejes homocinéticos.",
                                    "Preparación técnica previa a cualquier servicio de alineación geométrica y balanceo."
                                ]
                            }
                        ].map((detail, idx) => (
                            <div key={idx} id={detail.id} className={`flex flex-col ${idx % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 lg:gap-20 items-center scroll-mt-32`}>
                                <div className="lg:w-5/12">
                                    <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200 group">
                                        <div className="aspect-[4/3] bg-slate-100">
                                            <img src={detail.image} alt={detail.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                                        </div>
                                        <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-[2rem]"></div>
                                    </div>
                                </div>
                                <div className="lg:w-7/12 space-y-8">
                                    <div className="space-y-4">
                                        <h4 className="text-blue-600 font-black text-xs uppercase tracking-widest">{detail.subtitle}</h4>
                                        <h3 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">{detail.title}</h3>
                                        <p className="text-slate-600 text-lg leading-relaxed">{detail.text}</p>
                                    </div>
                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {detail.specs.map((spec, sidx) => (
                                            <li key={sidx} className="flex gap-3 items-start bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-blue-200 transition-colors">
                                                <CheckCircle2 className="text-blue-600 mt-0.5 shrink-0" size={18} />
                                                <span className="text-slate-700 text-sm leading-relaxed font-medium">{spec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="pt-4">
                                        <Link to={`/auth/register?service=${detail.id.split('-')[1]}`}>
                                            <Button className="bg-slate-900 hover:bg-blue-600 text-white rounded-xl px-8 h-12 font-black text-[11px] tracking-widest uppercase transition-colors shadow-xl shadow-blue-900/20">
                                                Agendar este servicio
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. How it Works - UI Flow Overhaul */}
            <section id="como-funciona" className="py-40 bg-slate-900/30 relative">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-32">
                        <div className="lg:w-1/2 space-y-16">
                            <div className="space-y-6">
                                <div className="inline-block px-4 py-1.5 bg-primary/10 rounded-lg">
                                    <span className="text-primary font-black text-[11px] uppercase tracking-[0.4em] italic">Simplicidad Total</span>
                                </div>
                                <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">¿CÓMO <span className="text-primary italic">FUNCIONA</span>?</h2>
                                <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-lg">Nosotros nos encargamos de todo.</p>
                            </div>

                            <div className="space-y-12">
                                {[
                                    { step: "01", title: "SOLICITA EL SERVICIO", desc: "Usa nuestra terminal digital para decirnos qué necesita tu auto." },
                                    { step: "02", title: "NOSOTROS LLEGAMOS", desc: "Nuestro experto llega a Denver con tecnología de taller avanzado." },
                                    { step: "03", title: "¡TRABAJO LISTO!", desc: "Reparamos, validamos y tu vehículo queda impecable." },
                                    { step: "04", title: "EVALUACIÓN CONTINUA", desc: "Usted nos evalúa y mejoramos. Su retroalimentación es clave." }
                                ].map((step, i) => (
                                    <div key={i} className="flex gap-6 items-start group">
                                        <div className="text-3xl font-black text-white/5 group-hover:text-primary transition-colors duration-500 leading-none">{step.step}</div>
                                        <div className="space-y-1 pt-1">
                                            <h3 className="text-base font-black text-white uppercase tracking-widest leading-none">{step.title}</h3>
                                            <p className="text-xs text-slate-500 font-medium leading-relaxed">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Premium Image Card with Denver Map */}
                        <div className="lg:w-1/2 relative group w-full">
                            <div className="absolute -inset-4 bg-primary/20 rounded-[4rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                            <div className="relative aspect-[4/5] bg-slate-950 rounded-[4rem] border-4 border-white/5 overflow-hidden shadow-default">
                                <iframe 
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d196237.15814571932!2d-105.10173663674681!3d39.76451865917409!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x876b80aa231f17cf%3A0x118ef4f8278a36d6!2sDenver%2C%20CO%2C%20USA!5e0!3m2!1sen!2smx!4v1713550000000!5m2!1sen!2smx" 
                                    className="w-full h-full border-0 opacity-60 group-hover:opacity-80 transition-opacity duration-1000 saturate-0 invert hue-rotate-180 contrast-125" 
                                    loading="lazy" 
                                    referrerPolicy="no-referrer-when-downgrade"
                                ></iframe>
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none"></div>
                                <div className="absolute bottom-10 left-10 right-10 p-6 bg-slate-900/90 backdrop-blur-3xl rounded-2xl border border-white/10 flex items-center justify-between gap-4 shadow-2xl">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-slate-950 shadow-xl">
                                            <MapPin size={24} />
                                        </div>
                                        <div>
                                            <span className="block text-[8px] font-black text-primary uppercase tracking-[0.4em] mb-1">Status en Vivo</span>
                                            <span className="text-lg font-black text-white uppercase tracking-tighter">Técnico en camino</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1.5">
                                        {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}></div>)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. Trust / Coverage - High End Dark Mode */}
            <section id="cobertura" className="py-40 bg-slate-950 text-white relative">
                <div className="absolute top-0 left-0 w-full h-px bg-white/10"></div>
                <div className="container mx-auto px-6 relative z-10 text-center space-y-20">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none italic">
                            CONFIANZA <span className="text-slate-500">Y TRANSPARENCIA</span> <br /> 
                            EN <span className="text-primary not-italic">DENVER</span>
                        </h2>
                        <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-3xl mx-auto">
                            Entendemos lo valioso que es tu tiempo. Operamos en toda el área metropolitana con precisión y garantía total.
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-20">
                        <div className="flex flex-col items-center">
                            <span className="text-4xl font-black text-primary italic">24/7</span>
                            <span className="text-[9px] font-black uppercase tracking-[0.4em] mt-3 text-slate-500 italic">Disponibilidad</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-4xl font-black text-white italic">100%</span>
                            <span className="text-[9px] font-black uppercase tracking-[0.4em] mt-3 text-slate-500 italic">Móvil & Flexible</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="flex gap-2 mb-2">
                                {[1,2,3,4,5].map(i => <Star key={i} fill="#FFB800" size={14} className="text-primary" />)}
                            </div>
                            <span className="text-4xl font-black text-white italic">5.0</span>
                            <span className="text-[9px] font-black uppercase tracking-[0.4em] mt-1 text-slate-500 italic">Satisfacción</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. Contact / Call to Action - Modern Dark UI */}
            <section className="pb-40 bg-slate-950">
                <div className="container mx-auto px-6">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-[4rem] p-16 md:p-24 flex flex-col lg:flex-row items-center justify-between gap-16 border border-white/10 shadow-default">
                        <div className="space-y-8 max-w-2xl text-center lg:text-left">
                            <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
                                ¿LISTO PARA <br />
                                <span className="text-primary italic">REPARAR TU</span> <br />
                                VEHÍCULO?
                            </h2>
                            <p className="text-slate-400 text-lg font-medium leading-relaxed">Únete a cientos de clientes que ya disfrutan de la libertad de un taller que llega a ellos.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-6 items-center">
                            <Link to="/auth/register">
                                <Button className="h-14 px-10 rounded-xl bg-primary text-slate-950 font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-xl group">
                                    COMENZAR AHORA <ChevronRight size={18} className="ml-2 group-hover:translate-x-1" />
                                </Button>
                            </Link>
                            <a href="tel:3035550123" className="flex items-center h-14 px-6 rounded-xl border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all">
                                <Phone size={18} className="mr-3 text-primary" /> LLAMAR DIRECTO
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* WhatsApp Floating Launcher - Stitch Style */}
            <div className="fixed bottom-28 right-6 z-[100]">
                <a href="https://wa.me/13035550123" target="_blank" rel="noopener noreferrer" className="block group">
                    <div className="w-14 h-14 rounded-2xl bg-[#25D366] text-white shadow-lg shadow-black/20 hover:scale-110 active:scale-95 transition-all flex items-center justify-center border border-white/10 backdrop-blur-3xl">
                        <svg className="w-8 h-8 fill-current" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
                            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l113.8-29.8c32.6 17.3 69.1 26.3 106.5 26.3 122.4 0 222-99.6 222-222 0-59.3-23-115.1-61.4-157.1zm-157 341.6c-33.2 0-65.4-8.9-93.5-25.7l-6.7-4-69.5 18.2 18.5-67.8-4.4-7c-18.4-29.4-28.1-63.1-28.1-97.8 0-101.6 82.7-184.3 184.3-184.3 49.2 0 95.3 19.1 130.1 53.9 34.8 34.8 53.9 81 53.9 130.3 0 101.6-82.7 184.3-184.3 184.3zm102.3-139.5c-5.6-2.8-33.1-16.3-38.2-18.2-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18.2-17.6 22-3.2 3.7-6.5 4.2-12.1 1.4-5.6-2.8-23.6-8.7-45-27.8-16.6-14.8-27.8-33.1-31.1-38.7-3.2-5.6-.4-8.7 2.5-11.5 2.6-2.5 5.6-6.5 8.4-9.8 2.8-3.2 3.7-5.6 5.6-9.3 1.9-3.7.9-6.9-.5-9.8-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.8 23.5 9.2 31.5 11.8 13.3 4.2 25.4 3.6 35 2.2 10.7-1.6 33.1-13.5 37.8-26.6 4.6-13.1 4.6-24.3 3.2-26.6-1.4-2.3-5.1-3.7-10.7-6.5z"/>
                        </svg>
                    </div>
                </a>
            </div>

            {/* Smart Mechanic Floating Launcher - Stitch Style */}
            <div className="fixed bottom-10 right-6 z-[100]">
                <Link to="/app/chat" className="block group">
                    <div className="w-14 h-14 rounded-full bg-[#FFB800] text-slate-950 shadow-lg shadow-black/20 hover:scale-110 active:scale-95 transition-all flex items-center justify-center p-0">
                        <Bot size={28} strokeWidth={2.5} />
                    </div>
                </Link>
            </div>
        </div>
    );
}
