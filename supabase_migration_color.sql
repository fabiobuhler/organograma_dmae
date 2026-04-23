-- =====================================================================
-- DMAE Organograma: Migração de campo "cor" -> "color" na tabela nodes
-- Execute no SQL Editor do Supabase
-- =====================================================================

-- 1. Criar coluna "color" se não existir
ALTER TABLE nodes
ADD COLUMN IF NOT EXISTS color TEXT;

-- 2. Migrar dados existentes da coluna "cor" para "color"
UPDATE nodes
SET color = cor
WHERE (color IS NULL OR color = '')
  AND cor IS NOT NULL
  AND cor <> '';

-- 3. (Opcional) Verificar resultado
SELECT id, name, color, cor
FROM nodes
WHERE color IS NOT NULL AND color <> ''
ORDER BY name
LIMIT 20;

-- =====================================================================
-- NOTA: Mantenha a coluna "cor" por ora para compatibilidade retroativa.
-- Após confirmar que tudo funciona, pode excluir com:
-- ALTER TABLE nodes DROP COLUMN IF EXISTS cor;
-- =====================================================================
