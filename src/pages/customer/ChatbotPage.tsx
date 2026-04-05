import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Bot, User, AlertTriangle, CheckCircle, ChevronRight, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';

interface Message {
    id: string;
    role: 'bot' | 'user';
    text: string;
    options?: { label: string; value: any; action?: string }[];
    component?: React.ReactNode;
}

interface SymptomTag {
    id: string;
    code: string;
    label: string;
    category: string;
    severity_hint: 'LOW' | 'MED' | 'HIGH';
}

interface Vehicle {
    id: string;
    make: string;
    model: string;
    year: number;
}

export function ChatbotPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const initialized = useRef(false);

    // Flow State
    const [step, setStep] = useState<'WELCOME' | 'VEHICLE' | 'SERVICE_TYPE' | 'SYMPTOMS' | 'TRIAGE' | 'SUMMARY' | 'FINISHED'>('WELCOME');
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [symptomTags, setSymptomTags] = useState<SymptomTag[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
    const [freeTextSymptom, setFreeTextSymptom] = useState('');
    const [triageRisk, setTriageRisk] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('LOW');

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (!user || initialized.current) return;
        initialized.current = true;

        const initChat = async () => {
            // 1. Create session
            const { data: session, error: sErr } = await supabase
                .from('chatbot_sessions')
                .insert({ customer_user_id: user.id })
                .select()
                .single();

            if (sErr) return console.error(sErr);
            setSessionId(session.id);

            // 2. Load Vehicles
            const { data: vData } = await supabase.from('vehicles').select('id, make, model, year').eq('owner_user_id', user.id);
            setVehicles(vData || []);

            // 3. Load Symptoms
            const { data: syData } = await supabase.from('symptom_tags').select('*');
            setSymptomTags(syData || []);

            // 4. Welcome Message
            addBotMessage("¡Hola! Soy SmartMechanic, tu asistente virtual. Te ayudaré a gestionar tu servicio de manera rápida.", undefined, undefined, session.id);
            setTimeout(() => askVehicle(vData || [], session.id), 1000);
        };

        initChat();
    }, [user]);

    const addBotMessage = (text: string, options?: Message['options'], component?: React.ReactNode, overrideSessionId?: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        setMessages((prev: Message[]) => [...prev, { id, role: 'bot', text, options, component }]);
        const currentSessionId = overrideSessionId || sessionId;
        if (currentSessionId) {
            supabase.from('chatbot_messages').insert({ session_id: currentSessionId, sender: 'BOT', content: text }).then();
        }
    };

    const addUserMessage = (text: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        setMessages((prev: Message[]) => [...prev, { id, role: 'user', text }]);
        if (sessionId) {
            supabase.from('chatbot_messages').insert({ session_id: sessionId, sender: 'USER', content: text }).then();
        }
    };

    const askVehicle = (userVehicles: Vehicle[], overrideSessionId?: string) => {
        setStep('VEHICLE');
        if (userVehicles.length > 0) {
            const options = userVehicles.map(v => ({
                label: `${v.make} ${v.model} (${v.year})`,
                value: v.id,
                action: 'select_vehicle'
            }));
            options.push({ label: "+ Agregar otro vehículo", value: 'new', action: 'add_vehicle' });
            addBotMessage("Primero, ¿en cuál de tus vehículos hay un problema?", options, undefined, overrideSessionId);
        } else {
            addBotMessage("Veo que no tienes vehículos registrados. Por favor, agrega uno en la sección de 'Vehículos' o dime la marca y modelo aquí.", undefined, undefined, overrideSessionId);
            // For simplicity in this guided flow, we'll ask them to go to vehicles if none
            setMessages((prev: Message[]) => [...prev, {
                id: 'btn-vehicles',
                role: 'bot',
                text: "Necesitas registrar un vehículo para continuar.",
                options: [{ label: "Ir a Mis Vehículos", value: '/app/vehicles', action: 'navigate' }]
            }]);
        }
    };

    const handleOptionClick = async (option: { label: string; value: any; action?: string }) => {
        addUserMessage(option.label);

        if (option.action === 'select_vehicle') {
            const v = vehicles.find(veh => veh.id === option.value);
            setSelectedVehicle(v || null);
            if (sessionId) {
                await supabase.from('chatbot_sessions').update({ vehicle_id: option.value }).eq('id', sessionId);
            }
            setStep('SERVICE_TYPE');
            addBotMessage(`Perfecto, revisemos el ${v?.make}. ¿Qué tipo de servicio necesitas realizar?`, [
                { label: "Diagnóstico de Falla", value: 'DIAGNOSIS', action: 'select_service_type' },
                { label: "Mantenimiento Rutinario", value: 'MAINTENANCE', action: 'select_service_type' },
                { label: "Otros Servicios", value: 'OTHER', action: 'select_service_type' }
            ]);
        } else if (option.action === 'select_service_type') {
            if (option.value === 'DIAGNOSIS') {
                addBotMessage("Entendido. ¿Qué síntomas presenta tu vehículo? Selecciona el más relevante:");
                setStep('SYMPTOMS');
                renderSymptomSelector();
            } else if (option.value === 'MAINTENANCE') {
                addBotMessage("Excelente, procederé a crear una solicitud de mantenimiento rutinario.");
                createServiceRequest('FLUIDS'); // Default maintenance code
            } else {
                addBotMessage("Por favor, cuéntame un poco más sobre lo que necesitas en el cuadro de texto de abajo.");
                setStep('SYMPTOMS');
            }
        } else if (option.action === 'select_symptom') {
            setSelectedSymptoms([option.value]);
            processSymptoms();
        } else if (option.action === 'add_vehicle') {
            navigate('/app/vehicles');
        } else if (option.action === 'navigate') {
            navigate(option.value);
        } else if (option.action === 'finish_symptoms') {
            processSymptoms();
        } else if (option.action === 'triage_answer') {
            handleTriageResponse(option.value);
        } else if (option.action === 'create_request') {
            createServiceRequest();
        } else if (option.action === 'continue_chat') {
            setStep('SYMPTOMS');
            setTimeout(() => {
                addBotMessage("Entendido. Cuéntame más detalles sobre lo que sucede con tu vehículo o hazme cualquier otra pregunta.");
            }, 500);
        }
    };

    const renderSymptomSelector = () => {
        setMessages((prev: Message[]) => [...prev, {
            id: 'symptom-picker',
            role: 'bot',
            text: "Selecciona el problema principal:",
            options: symptomTags.map(s => ({
                label: s.label,
                value: s.id,
                action: 'select_symptom'
            }))
        }]);
    };

    const toggleSymptom = (id: string) => {
        setSelectedSymptoms((prev: string[]) => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const processSymptoms = () => {
        setStep('TRIAGE');
        addBotMessage("Entendido. Ahora unas preguntas rápidas de seguridad:");
        setTimeout(() => {
            addBotMessage("¿Hay alguna luz roja encendida en el tablero, escuchas ruidos metálicos fuertes o sientes que los frenos no responden bien?", [
                { label: "Sí, algo de eso sucede", value: 'HIGH', action: 'triage_answer' },
                { label: "No, el carro se siente seguro pero falla", value: 'LOW', action: 'triage_answer' }
            ]);
        }, 800);
    };

    const handleTriageResponse = (risk: string) => {
        setTriageRisk(risk as any);
        if (risk === 'HIGH') {
            addBotMessage("⚠️ RECOMENDACIÓN CRÍTICA: Basado en tus síntomas, te sugerimos NO conducir el vehículo. Podría ser peligroso o causar daños mayores. ¿Deseas que preparemos un diagnóstico general a domicilio?", [
                { label: "Sí, preparar solicitud", value: true, action: 'create_request' },
                { label: "No, quisiera seguir conversando", value: false, action: 'continue_chat' }
            ]);
        } else {
            addBotMessage("Gracias. He analizado tus datos y parece que necesitas una revisión técnica avanzada. ¿Procedemos a crear la solicitud de servicio?", [
                { label: "Sí, crear solicitud", value: true, action: 'create_request' },
                { label: "No, quisiera seguir conversando", value: false, action: 'continue_chat' }
            ]);
        }
        setStep('SUMMARY');
    };

    const createServiceRequest = async (overrideServiceCode?: string) => {
        if (!user || !selectedVehicle) return;
        setLoading(true);

        try {
            // Determine probable service
            let serviceCode = overrideServiceCode || 'DIAG_GENERAL';
            if (!overrideServiceCode) {
                const categories = symptomTags.filter(s => selectedSymptoms.includes(s.id)).map(s => s.category);
                if (categories.includes('Frenos')) serviceCode = 'BRAKES';
                else if (categories.includes('Suspensión')) serviceCode = 'SUSPENSION';
                else if (categories.includes('Fluidos')) serviceCode = 'FLUIDS';
            }

            const { data: service } = await supabase.from('service_catalog').select('id').eq('code', serviceCode).single();

            // 1. Create Request
            const { data: req, error: rErr } = await supabase
                .from('service_requests')
                .insert({
                    customer_user_id: user.id,
                    vehicle_id: selectedVehicle.id,
                    requested_service_id: service?.id,
                    status: 'DRAFT',
                    triage_risk: triageRisk,
                    triage_notes: `Síntomas: ${selectedSymptoms.length} seleccionados. Triage: ${triageRisk}.`,
                    symptoms_free_text: freeTextSymptom
                })
                .select()
                .single();

            if (rErr) throw rErr;

            // 2. Insert Junction Symptoms
            if (selectedSymptoms.length > 0) {
                await supabase.from('request_symptoms').insert(
                    selectedSymptoms.map(sid => ({ request_id: req.id, symptom_id: sid }))
                );
            }

            addBotMessage("¡Listo! He creado un borrador de tu solicitud. Ahora solo falta agendar la visita de nuestro técnico.");
            setStep('FINISHED');
            setMessages((prev: Message[]) => [...prev, {
                id: 'final-cta',
                role: 'bot',
                text: "Haz clic abajo para elegir fecha y hora:",
                options: [{ label: "Agendar Visita Ahora", value: `/app/schedule?request_id=${req.id}`, action: 'navigate' }]
            }]);

        } catch (error: any) {
            toast({ title: 'Error', description: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSendInput = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        addUserMessage(input);
        const val = input;
        setInput('');

        if (step === 'SYMPTOMS') {
            setFreeTextSymptom(val);
            addBotMessage("He guardado tu descripción. ¿Podemos continuar con las preguntas de seguridad?");
            setMessages((prev: Message[]) => [...prev, {
                id: 'cont-symptom',
                role: 'bot',
                text: "¿Terminamos con los síntomas?",
                options: [{ label: "Sí, continuar", value: true, action: 'finish_symptoms' }]
            }]);
        } else {
            addBotMessage("Entendido. Por favor selecciona una de las opciones guiadas para continuar mejor.");
        }
    };

    return (
        <div className="max-w-2xl mx-auto h-[calc(100vh-12rem)] min-h-[500px] flex flex-col pt-4 animate-in">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Diagnóstico Inteligente</h1>
                    <p className="text-muted-foreground">Cuéntame qué le pasa a tu auto.</p>
                </div>
                {triageRisk === 'HIGH' && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-destructive/10 text-destructive rounded-full text-xs font-bold border border-destructive/20 animate-pulse">
                        <AlertTriangle size={14} /> ALTO RIESGO
                    </div>
                )}
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden border-slate-200 shadow-xl rounded-2xl">
                <CardHeader className="border-b border-border bg-slate-50/50 pb-4">
                    <CardTitle className="flex items-center gap-2 text-slate-700">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                            <Bot size={18} />
                        </div>
                        SmartMechanic
                    </CardTitle>
                </CardHeader>

                <CardContent
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-[#f8fafc]"
                >
                    {messages.map((m: Message) => (
                        <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${m.role === 'bot' ? 'bg-white border border-slate-200 text-primary' : 'bg-primary text-white'
                                }`}>
                                {m.role === 'bot' ? <Bot size={16} /> : <User size={16} />}
                            </div>
                            <div className="max-w-[85%] space-y-2">
                                <div className={`p-4 shadow-sm ${m.role === 'user'
                                    ? 'bg-primary text-white rounded-2xl rounded-tr-none'
                                    : 'bg-white border border-slate-100 text-slate-700 rounded-2xl rounded-tl-none'
                                    }`}>
                                    <p className="text-sm leading-relaxed">{m.text}</p>
                                    {m.component}
                                </div>

                                {m.options && (
                                    <div className={`flex flex-wrap gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {m.options.map((opt: { label: string; value: any; action?: string }, i) => (
                                            <Button
                                                key={i}
                                                variant="outline"
                                                size="sm"
                                                className="bg-white hover:bg-primary hover:text-white border-primary/20 text-primary rounded-full transition-all duration-200"
                                                onClick={() => handleOptionClick(opt)}
                                            >
                                                {opt.label}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-primary">
                                <Loader2 size={16} className="animate-spin" />
                            </div>
                            <div className="p-3 bg-white border border-slate-100 rounded-2xl rounded-tl-none">
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="p-4 bg-white border-t border-slate-100">
                    <form className="flex w-full gap-2" onSubmit={handleSendInput}>
                        <div className="flex-1">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={step === 'SYMPTOMS' ? "Escribe detalles adicionales..." : "Escribe tu respuesta..."}
                                className="bg-slate-50 border-none focus-visible:ring-primary shadow-inner"
                            />
                        </div>
                        <Button type="submit" size="icon" disabled={!input.trim() || loading} className="rounded-xl shadow-lg shadow-primary/20">
                            <Send size={18} />
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    );
}
