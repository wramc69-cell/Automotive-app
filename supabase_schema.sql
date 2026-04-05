-- ==========================================
-- DENVER MOBILE AUTO CARE - SUPABASE INIT
-- ==========================================
-- This script initializes the complete database schema, 
-- custom types, RLS policies, and seed data.
-- ==========================================


-- -----------------------------------------------------------------------------
-- 1. CUSTOM TYPES (Enums)
-- -----------------------------------------------------------------------------
CREATE TYPE app_role AS ENUM ('CUSTOMER', 'TECH', 'ADMIN');
CREATE TYPE preferred_channel AS ENUM ('EMAIL', 'SMS', 'WHATSAPP', 'TELEGRAM');
CREATE TYPE powertrain_type AS ENUM ('GAS', 'HYBRID', 'EV', 'DIESEL');
CREATE TYPE symptom_severity AS ENUM ('LOW', 'MED', 'HIGH');
CREATE TYPE request_status AS ENUM ('DRAFT', 'SUBMITTED', 'TRIAGE', 'SCHEDULED', 'IN_PROGRESS', 'PENDING_APPROVAL', 'APPROVED', 'DECLINED', 'COMPLETED', 'CANCELED');
CREATE TYPE appointment_status AS ENUM ('SCHEDULED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED');
CREATE TYPE risk_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE parts_source AS ENUM ('CUSTOMER', 'SERVICE', 'MIXED');

-- trigger for auth: create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    role, 
    first_name, 
    last_name, 
    data_treatment_consent, 
    data_treatment_consent_date
  )
  VALUES (
    NEW.id, 
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'CUSTOMER'),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'data_treatment_consent')::BOOLEAN, false),
    CASE 
      WHEN NEW.raw_user_meta_data->>'data_treatment_consent_date' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'data_treatment_consent_date')::TIMESTAMPTZ 
      ELSE NULL 
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 2. UTILITY FUNCTIONS
-- -----------------------------------------------------------------------------
-- Trigger to automatically update `updated_at` column
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 3. TABLES DEFINITION
-- -----------------------------------------------------------------------------

-- App Config (Global settings)
CREATE TABLE public.app_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_hub_lat NUMERIC,
    service_hub_lng NUMERIC,
    distance_pricing_per_mile NUMERIC DEFAULT 1.5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trigger_app_config_updated_at BEFORE UPDATE ON public.app_config FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Profiles
CREATE TABLE public.profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'CUSTOMER',
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    preferred_channel preferred_channel DEFAULT 'EMAIL',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Vehicles
CREATE TABLE public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    org_id UUID, -- Optional: for B2B fleet management in the future
    year INTEGER NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    trim TEXT,
    powertrain powertrain_type DEFAULT 'GAS',
    odometer INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trigger_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Service Catalog
CREATE TABLE public.service_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    base_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trigger_service_catalog_updated_at BEFORE UPDATE ON public.service_catalog FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Symptom Tags
CREATE TABLE public.symptom_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    category TEXT,
    severity_hint symptom_severity DEFAULT 'LOW',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Requests
CREATE TABLE public.service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_user_id UUID NOT NULL REFERENCES public.profiles(user_id),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
    requested_service_id UUID REFERENCES public.service_catalog(id),
    status request_status DEFAULT 'DRAFT',
    triage_risk risk_level,
    triage_notes TEXT,
    symptoms_free_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trigger_service_requests_updated_at BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Request Symptoms (M2M)
CREATE TABLE public.request_symptoms (
    request_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE,
    symptom_id UUID REFERENCES public.symptom_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (request_id, symptom_id)
);

-- Appointments
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
    status appointment_status DEFAULT 'SCHEDULED',
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip TEXT NOT NULL,
    lat NUMERIC,
    lng NUMERIC,
    distance_miles NUMERIC,
    visit_fee NUMERIC(10, 2) DEFAULT 30.00,
    distance_surcharge NUMERIC(10, 2) DEFAULT 0.00,
    total_visit_cost NUMERIC(10, 2) DEFAULT 30.00,
    assigned_tech_user_id UUID REFERENCES public.profiles(user_id),
    customer_channel preferred_channel DEFAULT 'EMAIL',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trigger_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE INDEX idx_appointments_tech ON public.appointments(assigned_tech_user_id);

-- Chatbot Sessions
CREATE TABLE public.chatbot_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trigger_chatbot_sessions_updated_at BEFORE UPDATE ON public.chatbot_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Chatbot Messages
CREATE TABLE public.chatbot_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.chatbot_sessions(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('USER', 'BOT')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inspection Checklists (Templates)
CREATE TABLE public.inspection_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id UUID NOT NULL REFERENCES public.inspection_checklists(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    item_name TEXT NOT NULL,
    critical BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inspections (Filled Checklists)
CREATE TABLE public.inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
    tech_user_id UUID NOT NULL REFERENCES public.profiles(user_id),
    risk risk_level DEFAULT 'LOW',
    findings TEXT,
    recommendations TEXT,
    parts_by parts_source DEFAULT 'SERVICE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trigger_inspections_updated_at BEFORE UPDATE ON public.inspections FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Quotes
CREATE TABLE public.quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
    status request_status DEFAULT 'DRAFT',
    eta_hours_min INTEGER,
    eta_hours_max INTEGER,
    eta_notes TEXT,
    expected_completion_at TIMESTAMPTZ,
    total_parts NUMERIC(10, 2) DEFAULT 0.00,
    total_labor NUMERIC(10, 2) DEFAULT 0.00,
    tax NUMERIC(10, 2) DEFAULT 0.00,
    grand_total NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trigger_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Quote Items
CREATE TABLE public.quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('LABOR', 'PART', 'FEE')),
    description TEXT NOT NULL,
    quantity NUMERIC(10, 2) DEFAULT 1.00,
    unit_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quote Approvals (Simple Digital Signature)
CREATE TABLE public.quote_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID UNIQUE NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    approved_by_user_id UUID NOT NULL REFERENCES public.profiles(user_id),
    signer_full_name TEXT NOT NULL,
    accepted_terms BOOLEAN NOT NULL CHECK (accepted_terms = true),
    signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    signer_ip TEXT,
    signer_user_agent TEXT,
    signature_hash TEXT, -- Intended for light audit tracking: hash(quote_id + signed_at + user_id)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attachments (Storage Metadata)
CREATE TABLE public.attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    uploaded_by UUID REFERENCES public.profiles(user_id),
    request_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications Outbox
CREATE TABLE public.notifications_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id UUID REFERENCES public.profiles(user_id),
    recipient TEXT NOT NULL,
    channel preferred_channel NOT NULL,
    template_code TEXT,
    payload JSONB DEFAULT '{}',
    subject TEXT,
    body TEXT,
    sent_at TIMESTAMPTZ,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
    error_log TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments (Simulated)
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES public.quotes(id),
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
    payment_method TEXT,
    transaction_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trigger_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Audit Logs
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    actor_user_id UUID REFERENCES public.profiles(user_id),
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4. BUSINESS LOGIC TRIGGERS
-- -----------------------------------------------------------------------------
-- When a quote is approved, update quotes.status and service_requests.status
CREATE OR REPLACE FUNCTION process_quote_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.accepted_terms = true THEN
        -- Update Quote Status
        UPDATE public.quotes SET status = 'APPROVED', updated_at = NOW() WHERE id = NEW.quote_id;
        -- Update Service Request Status
        UPDATE public.service_requests sr
        SET status = 'APPROVED', updated_at = NOW()
        FROM public.quotes q
        WHERE q.id = NEW.quote_id AND sr.id = q.request_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_process_quote_approval
AFTER INSERT ON public.quote_approvals
FOR EACH ROW EXECUTE FUNCTION process_quote_approval();

-- -----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------------------------------------
-- Enable RLS on all tables
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Utility function to get current user role
CREATE OR REPLACE FUNCTION get_auth_role() RETURNS app_role AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles: Users can read/update/insert their own. Admins can do all.
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id OR get_auth_role() = 'ADMIN');
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id OR get_auth_role() = 'ADMIN');

-- Vehicles: Customer owns them. Techs and Admins can view all.
CREATE POLICY "Customers manage own vehicles" ON public.vehicles FOR ALL USING (auth.uid() = owner_user_id);
CREATE POLICY "Techs and Admins can view all vehicles" ON public.vehicles FOR SELECT USING (get_auth_role() IN ('TECH', 'ADMIN'));
CREATE POLICY "Admins can manage all vehicles" ON public.vehicles FOR ALL USING (get_auth_role() = 'ADMIN');

-- Service Catalog & Symptoms & Checklists: Everyone can read. Only admins can write.
CREATE POLICY "Everyone can view catalog" ON public.service_catalog FOR SELECT USING (true);
CREATE POLICY "Admins can manage catalog" ON public.service_catalog FOR ALL USING (get_auth_role() = 'ADMIN');

CREATE POLICY "Everyone can view symptoms" ON public.symptom_tags FOR SELECT USING (true);
CREATE POLICY "Admins can manage symptoms" ON public.symptom_tags FOR ALL USING (get_auth_role() = 'ADMIN');

CREATE POLICY "Everyone can read checklists" ON public.inspection_checklists FOR SELECT USING (true);
CREATE POLICY "Everyone can read checklist items" ON public.checklist_items FOR SELECT USING (true);
CREATE POLICY "Admins manage checklists" ON public.inspection_checklists FOR ALL USING (get_auth_role() = 'ADMIN');
CREATE POLICY "Admins manage checklist items" ON public.checklist_items FOR ALL USING (get_auth_role() = 'ADMIN');

-- Service Requests: Customers manage own. Techs view assigned logic handled at application or via joins. Actually, Techs probably need to see requests to be assigned, or at least ones they are assigned to. Admins view all.
CREATE POLICY "Customers view own requests" ON public.service_requests FOR SELECT USING (auth.uid() = customer_user_id);
CREATE POLICY "Customers create own requests" ON public.service_requests FOR INSERT WITH CHECK (auth.uid() = customer_user_id);
CREATE POLICY "Customers update own drafts" ON public.service_requests FOR UPDATE USING (auth.uid() = customer_user_id AND status = 'DRAFT');
CREATE POLICY "Admins view all requests" ON public.service_requests FOR ALL USING (get_auth_role() = 'ADMIN');
CREATE POLICY "Techs view assigned requests" ON public.service_requests FOR SELECT USING (
  get_auth_role() = 'TECH' AND id IN (SELECT request_id FROM public.appointments WHERE assigned_tech_user_id = auth.uid())
);

CREATE POLICY "Customers view own appointments" ON public.appointments FOR SELECT USING (
  request_id IN (SELECT id FROM public.service_requests WHERE customer_user_id = auth.uid())
);
CREATE POLICY "Customers insert own appointments" ON public.appointments FOR INSERT WITH CHECK (
  request_id IN (SELECT id FROM public.service_requests WHERE customer_user_id = auth.uid())
);
CREATE POLICY "Techs view assigned appointments" ON public.appointments FOR SELECT USING (assigned_tech_user_id = auth.uid());
CREATE POLICY "Techs update assigned appointments" ON public.appointments FOR UPDATE USING (assigned_tech_user_id = auth.uid());
CREATE POLICY "Admins manage all appointments" ON public.appointments FOR ALL USING (get_auth_role() = 'ADMIN');

-- Notifications: Customers can insert and view their own
CREATE POLICY "Customers manage own notifications" ON public.notifications_outbox FOR ALL USING (recipient_user_id = auth.uid());
CREATE POLICY "Admins manage all notifications" ON public.notifications_outbox FOR ALL USING (get_auth_role() = 'ADMIN');

-- Inspections: Techs create/update for their assignments. Customers view their own. Admins all.
CREATE POLICY "Techs manage own inspections" ON public.inspections FOR ALL USING (tech_user_id = auth.uid());
CREATE POLICY "Customers view own inspections" ON public.inspections FOR SELECT USING (
  request_id IN (SELECT id FROM public.service_requests WHERE customer_user_id = auth.uid())
);
CREATE POLICY "Admins manage all inspections" ON public.inspections FOR ALL USING (get_auth_role() = 'ADMIN');

-- Quotes & Quote Items: Techs create. Customers view. Admins all.
CREATE POLICY "Techs manage quotes" ON public.quotes FOR ALL USING (get_auth_role() = 'TECH');
CREATE POLICY "Techs manage quote items" ON public.quote_items FOR ALL USING (get_auth_role() = 'TECH');
CREATE POLICY "Customers view own quotes" ON public.quotes FOR SELECT USING (
  request_id IN (SELECT id FROM public.service_requests WHERE customer_user_id = auth.uid())
);
CREATE POLICY "Customers view own quote items" ON public.quote_items FOR SELECT USING (
  quote_id IN (SELECT q.id FROM public.quotes q JOIN public.service_requests sr ON q.request_id = sr.id WHERE sr.customer_user_id = auth.uid())
);
CREATE POLICY "Admins manage quotes" ON public.quotes FOR ALL USING (get_auth_role() = 'ADMIN');
CREATE POLICY "Admins manage quote items" ON public.quote_items FOR ALL USING (get_auth_role() = 'ADMIN');

-- Quote Approvals: Customers insert for their quotes. Admins all.
CREATE POLICY "Customers insert own approvals" ON public.quote_approvals FOR INSERT WITH CHECK (approved_by_user_id = auth.uid());
CREATE POLICY "Customers view own approvals" ON public.quote_approvals FOR SELECT USING (approved_by_user_id = auth.uid());
CREATE POLICY "Techs view quote approvals" ON public.quote_approvals FOR SELECT USING (get_auth_role() = 'TECH');

-- Chatbot: Customers manage their own sessions and messages.
CREATE POLICY "Customers manage own chatbot sessions" ON public.chatbot_sessions FOR ALL USING (auth.uid() = customer_user_id);
CREATE POLICY "Customers manage own chatbot messages" ON public.chatbot_messages FOR ALL USING (
    session_id IN (SELECT id FROM public.chatbot_sessions WHERE customer_user_id = auth.uid())
);

-- -----------------------------------------------------------------------------
-- 6. SEED DATA
-- -----------------------------------------------------------------------------

-- Core Service Catalog
INSERT INTO public.service_catalog (code, name, description, base_price) VALUES
('DIAG_GENERAL', 'Diagnóstico General', 'Inspección completa para identificar la raíz de cualquier problema mecánico o eléctrico.', 50.00),
('BRAKES', 'Inspección/Cambio de Frenos', 'Revisión y reemplazo de balatas o rotores.', 80.00),
('FLUIDS', 'Cambio de Aceite & Filtros', 'Cambio de aceite sintético y filtros de motor.', 65.00),
('SUSPENSION', 'Revisión de Suspensión', 'Inspección de amortiguadores y resortes.', 45.00)
ON CONFLICT (code) DO NOTHING;

-- Common Symptom Tags
INSERT INTO public.symptom_tags (code, label, category, severity_hint) VALUES
('SYM_NO_START', 'No arranca', 'Motor', 'HIGH'),
('SYM_BATTERY_LIGHT', 'Luz de batería encendida', 'Eléctrico', 'HIGH'),
('SYM_CHECK_ENGINE', 'Check Engine (Luz Amarilla)', 'Motor', 'MED'),
('SYM_BRAKE_SQUEAL', 'Ruido agudo al frenar', 'Frenos', 'MED'),
('SYM_VIBRATION', 'Vibración en el volante', 'Suspensión', 'LOW'),
('SYM_OIL_LEAK', 'Mancha de aceite en el suelo', 'Fluidos', 'HIGH')
ON CONFLICT (code) DO NOTHING;

-- ==========================================
-- END OF SUPABASE INIT SCRIPT
-- ==========================================
