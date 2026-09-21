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
