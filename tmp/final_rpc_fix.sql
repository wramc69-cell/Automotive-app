-- ========================================================
-- REVISIÓN Y REPARACIÓN DEL RPC DE GENERACIÓN DE CHECKLIST
-- ========================================================
-- Este script soluciona el error "column ti.name does not exist"
-- ajustando los nombres de campos entre tablas de plantillas
-- (checklist_template_items -> item_text) y tablas de inspección 
-- (checklist_items -> item_name).
-- ========================================================

-- Eliminamos versiones previas con firmas que puedan causar conflicto
DROP FUNCTION IF EXISTS public.generate_checklist_auto(UUID, UUID);

CREATE OR REPLACE FUNCTION public.generate_checklist_auto(
  request_id UUID, 
  p_template_id UUID
)
RETURNS UUID AS $$
DECLARE
  new_checklist_id UUID;
  template_record RECORD;
  item_record RECORD;
BEGIN
  -- 1. Intentar recuperar si ya existe un checklist para este request
  SELECT id INTO new_checklist_id 
  FROM public.inspection_checklists 
  WHERE public.inspection_checklists.request_id = generate_checklist_auto.request_id 
  LIMIT 1;

  IF new_checklist_id IS NOT NULL THEN
    RETURN new_checklist_id;
  END IF;

  -- 2. Obtener información de la plantilla base
  SELECT * INTO template_record FROM public.checklist_templates WHERE id = p_template_id;
  
  IF template_record.id IS NULL THEN
    RAISE EXCEPTION 'La plantilla con ID % no existe.', p_template_id;
  END IF;

  -- 3. Crear el contenedor del checklist de inspección
  INSERT INTO public.inspection_checklists (
    name, 
    request_id, 
    template_id,
    status, 
    risk,
    created_at
  )
  VALUES (
    template_record.name,  -- Aquí usamos el name de la plantilla (checklist_templates.name existe)
    generate_checklist_auto.request_id, 
    p_template_id,
    'PENDING', 
    'LOW',
    NOW()
  )
  RETURNING id INTO new_checklist_id;

  -- 4. Copiar los items de la plantilla al checklist real
  -- NOTA: Estamos usando checklist_template_items (ti)
  -- El error original probablemente intentaba usar ti.name en lugar de ti.item_text
  INSERT INTO public.checklist_items (
    checklist_id, 
    category, 
    item_name,  -- Estamos mapeando a item_name en la tabla de destino
    status, 
    order_index, 
    requires_photo,
    tool_hint,
    template_item_id,
    template_section_id
  )
  SELECT 
    new_checklist_id,
    ts.title,       -- Usamos el título de la sección como categoría
    ti.item_text,   -- ¡FIX AQUÍ! El campo en checklist_template_items es item_text, NO name.
    'PENDING', 
    ti.sort_order, 
    ti.requires_photo,
    ti.tool_hint,
    ti.id,
    ti.section_id
  FROM public.checklist_template_items ti
  LEFT JOIN public.checklist_template_sections ts ON ti.section_id = ts.id
  WHERE ti.template_id = p_template_id AND ti.is_active = true
  ORDER BY ts.sort_order, ti.sort_order;

  RETURN new_checklist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgamos permisos necesarios
GRANT EXECUTE ON FUNCTION public.generate_checklist_auto(UUID, UUID) TO authenticated, service_role, anon;
