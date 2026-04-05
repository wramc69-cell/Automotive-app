-- Remove the incorrect foreign key
ALTER TABLE public.inspection_checklists
DROP CONSTRAINT IF EXISTS inspection_checklists_template_id_fkey;

-- Recreate it correctly pointing to checklist_templates
ALTER TABLE public.inspection_checklists
ADD CONSTRAINT inspection_checklists_template_id_fkey
FOREIGN KEY (template_id)
REFERENCES public.checklist_templates(id)
ON DELETE SET NULL;
