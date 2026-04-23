# Backup DMAE Organograma - 19/04/2026

## Estatísticas da Estrutura
- **Total de Unidades (Nodes):** 346
- **Total de Pessoas Cadastradas:** 1.348
- **Base de Dados:** Supabase Cloud (Live)
- **Status do Acesso:** Auditoria e Governança Ativas

## Resumo da Hierarquia Principal
1. **DIREÇÃO GERAL**
   - CONSELHO DELIBERATIVO
   - GABINETE
   - PROCURADORIA
   - **DIRETORIA DE GESTÃO E APOIO** (DGA)
   - **DIRETORIA DE OPERAÇÕES E MANUTENÇÃO** (DOM)
   - **DIRETORIA DE ENGENHARIA** (DEN)
   - **DIRETORIA DE NEGÓCIOS E RELACIONAMENTO** (DNR)

## Configurações de Segurança
- **Admin Root:** admin (dmae123)
- **Nível de Acesso:** RBAC (Admin / Editor)
- **Logs de Auditoria:** Persistidos em `audit_logs`

## Notas de Restauração
Em caso de falha catastrófica da base de dados Supabase, as seeds originais localizadas em `src/data/seedData.js` servirão como base para a recriação da estrutura.
