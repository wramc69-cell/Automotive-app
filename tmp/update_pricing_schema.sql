-- 1. Separar costos en el catálogo
ALTER TABLE public.service_catalog 
ADD COLUMN IF NOT EXISTS labor_price NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS parts_price NUMERIC(10, 2) DEFAULT 0.00;

-- Migrar datos existentes (opcional si ya hay datos)
UPDATE public.service_catalog SET labor_price = base_price WHERE labor_price = 0;

-- 2. Asegurar que los perfiles tengan campos para ubicación (ya existen en profiles, pero confirmamos indices)
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(city, state, zip);

-- 3. Agregar bandera de insumos a las citas para registro histórico
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS has_supplies BOOLEAN DEFAULT false;
