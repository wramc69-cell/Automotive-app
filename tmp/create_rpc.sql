-- Checklist Auto Generation Function
CREATE OR REPLACE FUNCTION public.generate_checklist_auto(
  val_request_id UUID, 
  val_appointment_id UUID
)
RETURNS UUID AS $$
DECLARE
  new_checklist_id UUID;
  req_service_id UUID;
BEGIN
  -- 1. Ensure inspection_checklists has request_id (Adding column if not there, though it should be)
  -- Perform check if column exists, else raise error or handle it.
  -- In a real migration we'd do: ALTER TABLE inspection_checklists ADD COLUMN IF NOT EXISTS request_id UUID;

  -- 2. Check if a checklist for this request already exists
  SELECT id INTO new_checklist_id 
  FROM public.inspection_checklists 
  WHERE request_id = val_request_id 
  LIMIT 1;

  IF new_checklist_id IS NOT NULL THEN
    RETURN new_checklist_id;
  END IF;

  -- 3. Get the type of service requested
  SELECT requested_service_id INTO req_service_id
  FROM public.service_requests
  WHERE id = val_request_id;

  -- 4. Create the Checklist container
  INSERT INTO public.inspection_checklists (
    name, 
    request_id, 
    status, 
    risk,
    created_at
  )
  VALUES (
    'Inspección Multi-Puntos Denver', 
    val_request_id, 
    'PENDING', 
    'LOW',
    NOW()
  )
  RETURNING id INTO new_checklist_id;

  -- 5. Insert DEFAULT ITEMS (The 'Intelligence')
  -- We'll insert a standard set of inspection points
  INSERT INTO public.checklist_items (checklist_id, category, item_name, status, order_index, requires_photo)
  VALUES 
    (new_checklist_id, 'MOTOR', 'Nivel de Aceite', 'PENDING', 1, true),
    (new_checklist_id, 'MOTOR', 'Estado de la Batería', 'PENDING', 2, true),
    (new_checklist_id, 'MOTOR', 'Fugas Visibles', 'PENDING', 3, true),
    (new_checklist_id, 'FRENOS', 'Pastillas Delanteras', 'PENDING', 4, true),
    (new_checklist_id, 'FRENOS', 'Pastillas Traseras', 'PENDING', 5, true),
    (new_checklist_id, 'SUSPENSIÓN', 'Amortiguadores', 'PENDING', 6, false),
    (new_checklist_id, 'LLANTAS', 'Estado General Llantas', 'PENDING', 7, true),
    (new_checklist_id, 'LÍQUIDOS', 'Nivel de Refrigerante', 'PENDING', 8, false),
    (new_checklist_id, 'LÍQUIDOS', 'Líquido de Frenos', 'PENDING', 9, false);

  -- 6. Add specific items based on service type
  -- If service is 'OIL_CHANGE' (Assuming code or name)
  -- In a real app we'd query template_items based on req_service_id.

  RETURN new_checklist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access
GRANT EXECUTE ON FUNCTION public.generate_checklist_auto(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_checklist_auto(UUID, UUID) TO service_role;
