-- =====================================================================
-- DMAE Organograma: Correção de RLS (Row Level Security) e Permissões
-- Execute este script no SQL Editor do seu projeto no Supabase:
-- Dashboard Supabase -> SQL Editor -> New Query -> Run
-- =====================================================================

-- 1. Desativar RLS em todas as tabelas operacionais para liberar a escrita via chave anon
ALTER TABLE IF EXISTS nodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS persons DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS asset_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs DISABLE ROW LEVEL SECURITY;

-- 2. Garantir permissões de leitura e escrita para as roles 'anon', 'authenticated' e 'service_role'
GRANT ALL ON TABLE nodes TO anon, authenticated, service_role;
GRANT ALL ON TABLE persons TO anon, authenticated, service_role;
GRANT ALL ON TABLE assets TO anon, authenticated, service_role;
GRANT ALL ON TABLE contracts TO anon, authenticated, service_role;
GRANT ALL ON TABLE asset_types TO anon, authenticated, service_role;
GRANT ALL ON TABLE users TO anon, authenticated, service_role;
GRANT ALL ON TABLE audit_logs TO anon, authenticated, service_role;

-- =====================================================================
-- OPÇÃO ALTERNATIVA: Se o seu ambiente exigir RLS ATIVADO por política institucional,
-- descomente o bloco abaixo para criar políticas permissivas em vez de desativar o RLS:
-- =====================================================================

/*
-- Ativar RLS
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Criar políticas permissivas para a chave anon/autenticada
DROP POLICY IF EXISTS "Permitir acesso total em nodes" ON nodes;
CREATE POLICY "Permitir acesso total em nodes" ON nodes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso total em persons" ON persons;
CREATE POLICY "Permitir acesso total em persons" ON persons FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso total em assets" ON assets;
CREATE POLICY "Permitir acesso total em assets" ON assets FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso total em contracts" ON contracts;
CREATE POLICY "Permitir acesso total em contracts" ON contracts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso total em asset_types" ON asset_types;
CREATE POLICY "Permitir acesso total em asset_types" ON asset_types FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso total em users" ON users;
CREATE POLICY "Permitir acesso total em users" ON users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso total em audit_logs" ON audit_logs;
CREATE POLICY "Permitir acesso total em audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
*/
