-- Migration to ensure columns exist and create generating RPC
DO $$
BEGIN
    -- Ensure request_id exists in inspection_checklists
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inspection_checklists' AND column_name = 'request_id') THEN
        ALTER TABLE public.inspection_checklists ADD COLUMN request_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE;
    END IF;

    -- Ensure updated_at exists if we want it
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inspection_checklists' AND column_name = 'updated_at') THEN
        ALTER TABLE public.inspection_checklists ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Ensure findings, recommendations, risk, status, tech_user_id exist (some were missing from my guess above)
    -- Actually they were in the keys but my guess has risk, status etc
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'checklist_items' AND column_name = 'status') THEN
        ALTER TABLE public.checklist_items ADD COLUMN status TEXT DEFAULT 'PENDING';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'checklist_items' AND column_name = 'notes') THEN
        ALTER TABLE public.checklist_items ADD COLUMN notes TEXT;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'checklist_items' AND column_name = 'photo_urls') THEN
        ALTER TABLE public.checklist_items ADD COLUMN photo_urls TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Drop previous if exists with same name but different params
DROP FUNCTION IF EXISTS public.generate_checklist_auto(UUID, UUID);

-- Checklist Auto Generation Function
CREATE OR REPLACE FUNCTION public.generate_checklist_auto(request_id UUID, appointment_id UUID DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  -- Check if already exists
  SELECT id INTO new_id FROM public.inspection_checklists WHERE public.inspection_checklists.request_id = generate_checklist_auto.request_id LIMIT 1;
  IF new_id IS NOT NULL THEN
    RETURN new_id;
  END IF;

  -- Create record
  INSERT INTO public.inspection_checklists (
    name, 
    request_id, 
    status, 
    risk,
    created_at
  )
  VALUES (
    'Inspección Inteligente Denver', 
    generate_checklist_auto.request_id, 
    'PENDING', 
    'LOW',
    NOW()
  )
  RETURNING id INTO new_id;

  -- Insert Base Items for Denver
  INSERT INTO public.checklist_items (checklist_id, category, item_name, status, order_index, requires_photo)
  VALUES 
    (new_id, 'MOTOR', 'Nivel / Fugas de Aceite', 'PENDING', 1, true),
    (new_id, 'MOTOR', 'Estado de Bandas', 'PENDING', 2, false),
    (new_id, 'MOTOR', 'Batería y Terminales', 'PENDING', 3, true),
    (new_id, 'FRENOS', 'Balatas Delanteras', 'PENDING', 4, true),
    (new_id, 'FRENOS', 'Balatas Traseras', 'PENDING', 5, true),
    (new_id, 'FRENOS', 'Líquido de Frenos', 'PENDING', 6, false),
    (new_id, 'SUSPENSIÓN', 'Amortiguadores', 'PENDING', 7, true),
    (new_id, 'SISTEMA ELÉCTRICO', 'Luces Exteriores', 'PENDING', 8, false),
    (new_id, 'LLANTAS', 'Presión y Estado General', 'PENDING', 9, true),
    (new_id, 'GENERAL', 'Escaneo OBDII (Códigos)', 'PENDING', 10, true);

  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions (MANDATORY TO AVOID 'FUNCTION NOT FOUND' FOR USER)
GRANT ALL ON public.inspection_checklists TO authenticated, service_role, anon;
GRANT ALL ON public.checklist_items TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.generate_checklist_auto(UUID, UUID) TO authenticated, service_role, anon;
