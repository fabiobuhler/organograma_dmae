-- =====================================================================
-- DMAE Organograma: Correção de RLS e Criação do Usuário Admin na Tabela 'users'
-- Execute este script no SQL Editor do seu projeto no Supabase
-- =====================================================================

-- 1. Desativar RLS na tabela users para permitir acesso via chave anon
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. Garantir permissão SELECT, INSERT, UPDATE, DELETE para a role anon e authenticated
GRANT ALL ON TABLE users TO anon;
GRANT ALL ON TABLE users TO authenticated;
GRANT ALL ON TABLE users TO service_role;

-- 3. Inserir a conta admin padrão caso não exista
INSERT INTO users (username, password, role, must_change_password)
VALUES ('admin', 'dmae123', 'admin', false)
ON CONFLICT (username) DO UPDATE 
SET password = EXCLUDED.password, role = EXCLUDED.role;
