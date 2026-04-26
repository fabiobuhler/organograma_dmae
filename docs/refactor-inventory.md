# Levantamento para Refatoração do App.jsx — DMAE Organograma

> **Gerado em:** 2026-04-24 | **Versão analisada:** 1.0.2026.04241700  
> ⚠️ Este documento é somente leitura. Nenhum arquivo foi alterado, excluído ou commitado.

---

## 1. Estado do Git

| Campo | Valor |
|-------|-------|
| Branch atual | `recovery/backup-app` |
| Último commit | `c03db094` — ponto de restauração (relatórios PDF, ordenação, empresa no badge) |
| Arquivos modificados | Nenhum (working tree clean) |
| Arquivos não rastreados | Nenhum |
| Alterações locais | ❌ Não há |

**Branches existentes:**
- `main` — branch de produção
- `recovery/backup-app` — branch atual (ponto de restauração)
- `gh-pages` — branch do site publicado
- `ajuste-ativos-pessoas-manutencao` — branch de feature antiga

**Últimos 8 commits:**
```
c03db094 chore: ponto de restauracao - relatorios PDF...
fd800ee8 Atualiza versao para 1.0.2026.04241700
3455f88d Bump version to 1.0.2026.04241600
60f63238 Estabiliza organograma, contratos, ativos, alertas e contingencia
ab2ef56b Hardening Asset Contingency Management...
7847d94b Update governance guidelines and versions
20f2b6a8 Update footer version
2a0ad3cc Release v1.0.2026.04231811: Fixed Tree Panning, Zoom issues
```

---

## 2. Estrutura de Arquivos e Classificação

| Arquivo | Tamanho | Tipo | Recomendação |
|---------|---------|------|--------------|
| `src/App.jsx` | ~299 KB | Código-fonte principal | **Refatorar — candidato à quebra** |
| `src/index.css` | ~33 KB | Código-fonte (estilos) | Manter |
| `src/main.jsx` | ~1.3 KB | Código-fonte | Manter |
| `src/lib/supabase.js` | ~0.4 KB | Configuração | Manter |
| `src/utils/helpers.js` | ~7.7 KB | Utilitário | Manter — expandir |
| `src/components/OrgNode.jsx` | — | Componente | Manter |
| `src/data/seedData.js` | ~495 KB | Dados | Manter temporariamente |
| `src/data/seedData2.js` | ~79 KB | Dados | Verificar necessidade |
| `src/data/servidores.csv` | ~207 KB | Dados brutos | Candidato a mover para `docs/data/` |
| `src/data/dmae_logo.jfif` | — | Asset | Mover para `public/` |
| `src/backup_layout/` (6 arquivos) | — | Backup | **Candidato a exclusão futura** |
| `backup/App.after_asset_types_edit.jsx` | — | Backup | Candidato a exclusão após confirmação |
| `backup/App.before_asset_types_edit.jsx` | — | Backup | Candidato a exclusão após confirmação |
| `backup/App.before_encoding_fix.jsx` | — | Backup | Candidato a exclusão após confirmação |
| `backup/App.jsx.bak` | — | Backup | Candidato a exclusão após confirmação |
| `backup/index.before_asset_types_edit.css` | — | Backup | Candidato a exclusão após confirmação |
| `backup/index.before_encoding_fix.css` | — | Backup | Candidato a exclusão após confirmação |
| `backup/index.css.bak` | — | Backup | Candidato a exclusão após confirmação |
| `backup/OrgNode.jsx.bak` | — | Backup | Candidato a exclusão após confirmação |
| `backup_layout.md` | — | Documentação | Manter ou mover para `docs/` |
| `backup_recovery/App.current_wrong.jsx` | — | Backup | Candidato a exclusão após confirmação |
| `backup_recovery/index.current_wrong.css` | — | Backup | Candidato a exclusão após confirmação |
| `scratch/fix_mojibake.cjs` | — | Script de manutenção | Candidato a exclusão (já aplicado) |
| `scratch/fix-mojibake.cjs` | — | Script de manutenção | Candidato a exclusão (já aplicado) |
| `scratch/fix-mojibake-final.cjs` | — | Script de manutenção | Candidato a exclusão (já aplicado) |
| `scratch/fix-mojibake-v2.cjs` | — | Script de manutenção | Candidato a exclusão (já aplicado) |
| `scratch/update_version.cjs` | — | Script utilitário | Manter temporariamente |
| `fix_app.ps1` | — | Script de manutenção | Candidato a exclusão |
| `fix_encoding.ps1` | — | Script de manutenção | Candidato a exclusão (já aplicado) |
| `check_balance.py` | — | Script debug | Candidato a exclusão |
| `merge.cjs` | — | Script | Candidato a exclusão |
| `parse.cjs` | — | Script | Candidato a exclusão |
| `rebuild.cjs` | — | Script | Candidato a exclusão |
| `rebuild2.cjs` | — | Script | Candidato a exclusão |
| `On_line/` (5 .url files) | — | Atalhos Windows | Candidato a exclusão do Git |
| `.env` | — | Configuração sensível | ⚠️ **NÃO DEVE estar no Git** |
| `eslint_results.txt` | — | Log | Candidato a exclusão |
| `DMAE_GOVERNANCE.skill.md` | — | Documentação | Manter |
| `GOVERNANCE.md` | ~5 KB | Documentação | Manter — atualizar |
| `supabase_migration_color.sql` | ~1 KB | Migração | Mover para `docs/migrations/` |
| `update.json` | ~63 KB | Dados? | Verificar necessidade |
| `package.json` | — | Configuração | Essencial |
| `vite.config.js` | — | Configuração | Essencial |
| `eslint.config.js` | — | Configuração | Essencial |
| `public/logo-dmae.png` | ~30 KB | Asset público | Manter |
| `public/icon-dmae.png` | ~12 KB | Asset público | Manter |

---

## 3. Arquivos Candidatos a Exclusão/Movimentação

| Arquivo | Motivo | Recomendação |
|---------|--------|--------------|
| `.env` | Segredo — **não deve estar no Git** | Remover do tracking com `git rm --cached .env` + add ao `.gitignore` |
| `backup/*.bak` e `backup/*.jsx` | Backups manuais antigos — código já estável | Excluir após confirmação do usuário |
| `backup_recovery/*.jsx` e `*.css` | Backups de recovery já superados | Excluir após confirmação |
| `src/backup_layout/` (6 arquivos) | Versões antigas do layout | Excluir após confirmação |
| `scratch/fix-mojibake*.cjs` | Scripts de encoding já aplicados | Excluir (manutenção encerrada) |
| `fix_app.ps1` / `fix_encoding.ps1` | Scripts de correção já aplicados | Excluir |
| `check_balance.py` / `merge.cjs` / `parse.cjs` / `rebuild.cjs` / `rebuild2.cjs` | Scripts de debug/rebuild já superados | Excluir |
| `On_line/*.url` | Atalhos Windows — não pertencem ao repositório | Excluir do Git |
| `eslint_results.txt` | Log gerado — não pertence ao Git | Excluir / adicionar ao `.gitignore` |
| `src/data/servidores.csv` | Dado bruto — pode conter dados pessoais | Mover para `docs/data/` ou excluir |
| `supabase_migration_color.sql` | Migração histórica | Mover para `docs/migrations/` |

---

## 4. Tamanho e Complexidade do App.jsx

| Métrica | Valor |
|---------|-------|
| Total de linhas | **5.241** |
| Tamanho em bytes | ~306 KB |
| `useState` | **85** |
| `useEffect` | **11** |
| `useMemo` | **15** |
| `useCallback` | **55** |
| Funções top-level (fora do App) | **14** |
| Chamadas `supabase.from(...)` | **26** |

**Funções declaradas fora do componente App (top-level):**

| Linha | Função | Risco extração |
|-------|--------|---------------|
| 92 | `assetIcon(c)` | Baixo |
| 99 | `getContractStatus(c)` | Baixo |
| 108 | `getDashboardStats(contractList)` | Baixo |
| 126 | `exportAssetsPdf(...)` | Baixo |
| 290 | `exportLogsPdf(logsList)` | Baixo |
| 347 | `generateDirectPdf(logsList)` | Baixo |
| 398 | `exportLogsCsv(logsList)` | Baixo |
| 404 | `ListNode` (componente) | Médio |
| 478 | `NodeSelector` (componente) | Médio |
| 529 | `PersonSelector` (componente) | Médio |
| 629 | `fixMojibakeText(value)` | Baixo |
| 680 | `normalizeDeep(value)` | Baixo |
| 690 | `SystemAlertModal` (componente) | Baixo |
| 751 | `ConfirmDialog` (componente) | Baixo |

---

## 5. Componentes Candidatos à Extração

### BAIXO RISCO

| Item | Tipo | Destino sugerido | Risco | Dependências externas |
|------|------|-----------------|-------|-----------------------|
| `SystemAlertModal` | Componente | `components/common/SystemAlertModal.jsx` | ✅ Baixo | lucide-react |
| `ConfirmDialog` | Componente | `components/common/ConfirmDialog.jsx` | ✅ Baixo | lucide-react |
| `assetIcon()` | Função | `utils/assetUtils.js` | ✅ Baixo | lucide-react |
| `exportAssetsPdf()` | Função | `utils/exportUtils.js` | ✅ Baixo | Nenhuma |
| `exportLogsPdf()` | Função | `utils/exportUtils.js` | ✅ Baixo | Nenhuma |
| `generateDirectPdf()` | Função | `utils/exportUtils.js` | ✅ Baixo | html2pdf (window) |
| `exportLogsCsv()` | Função | `utils/exportUtils.js` | ✅ Baixo | helpers.js |
| `fixMojibakeText()` | Função | `utils/encoding.js` | ✅ Baixo | Nenhuma |
| `normalizeDeep()` | Função | `utils/encoding.js` | ✅ Baixo | fixMojibakeText |
| `getContractStatus()` | Função | `utils/contractUtils.js` | ✅ Baixo | Nenhuma |
| `getDashboardStats()` | Função | `utils/contractUtils.js` | ✅ Baixo | getContractStatus |
| `maskPhone()` | Função | `utils/phone.js` (já em helpers.js) | ✅ Baixo | Nenhuma |

### MÉDIO RISCO

| Item | Tipo | Destino sugerido | Risco | Dependências externas |
|------|------|-----------------|-------|-----------------------|
| `NodeSelector` | Componente | `components/selectors/NodeSelector.jsx` | 🟡 Médio | nodes state, lucide-react |
| `PersonSelector` | Componente | `components/selectors/PersonSelector.jsx` | 🟡 Médio | persons/nodes state |
| `ListNode` | Componente | `components/org/ListNode.jsx` | 🟡 Médio | nodes, isProtected, assets |
| AssetForm (inline) | Componente | `components/assets/AssetForm.jsx` | 🟡 Médio | 15+ estados, maskPhone, NodeSelector |
| ContractForm (inline) | Componente | `components/contracts/ContractForm.jsx` | 🟡 Médio | 10+ estados, NodeSelector, PersonSelector |
| PersonForm (inline) | Componente | `components/people/PersonForm.jsx` | 🟡 Médio | nodes, contracts states |
| NodeForm (inline) | Componente | `components/org/NodeForm.jsx` | 🟡 Médio | nodes state, assets |
| AssetTypesModal (inline) | Componente | `components/assets/AssetTypesModal.jsx` | 🟡 Médio | assetTypes, supabase |

### ALTO RISCO — NÃO MOVER AGORA

| Item | Tipo | Risco | Motivo |
|------|------|-------|--------|
| `loadCloudData()` | Função async | 🔴 Alto | Carrega tudo do Supabase, crítico para o bootstrap |
| `saveAsset()` / `deleteAsset()` | Funções | 🔴 Alto | Acoplado ao estado e audit log |
| `saveNode()` / `deleteNode()` | Funções | 🔴 Alto | Recursividade + audit log |
| `saveContract()` | Função | 🔴 Alto | Valida fiscais, gestores e pessoas |
| Dashboard completo | Bloco JSX | 🔴 Alto | Usa quase todos os estados |
| Pan/Zoom da árvore | Bloco + refs | 🔴 Alto | Pointer events, refs, efeitos complexos |
| Lógica de autenticação | Bloco | 🔴 Alto | Auth Supabase + must_change_password |
| Supabase Presence | useEffect | 🔴 Alto | Websocket em tempo real |

---

## 6. Mapa de Dependências

| Bloco | Estados usados | Funções usadas | Componentes usados |
|-------|----------------|----------------|--------------------|
| `SystemAlertModal` | `systemAlert` | `closeSystemAlert` | lucide-react |
| `ConfirmDialog` | `confirmDialog` | `setConfirmDialog` | lucide-react |
| `NodeSelector` | `nodes` (prop) | `onChange` (prop) | — |
| `PersonSelector` | `persons, nodes` (props) | `onSelect, onClear` (props) | — |
| `ListNode` | `expandedSet` (prop) | `onSelect, onToggleExpandAll` | lucide-react, Siren, AlertTriangle |
| `AssetForm` | `assetForm, assetTypes, nodes, assets` | `saveAsset, showSystemAlert, maskPhone` | `NodeSelector` |
| `ContractForm` | `contractForm, persons, nodes` | `saveContract, showSystemAlert` | `NodeSelector, PersonSelector` |
| `PersonForm` | `personForm, nodes, contracts` | `savePerson, showSystemAlert` | `NodeSelector` |
| `NodeForm` | `nodeForm, nodes` | `saveNode, showSystemAlert` | — |
| `AssetTypesModal` | `assetTypes` | `saveAssetType, deleteAssetType` | — |
| `Dashboard` | quase todos | `loadCloudData, exportAssetsPdf` | todos os seletores |
| `loadCloudData` | todos os setters | supabase.from (26x) | — |
| `exportAssetsPdf` | nenhum (recebe list) | `getPath` (prop) | — |

---

## 7. Proposta de Estrutura de Pastas

```
src/
  App.jsx               ← reduzir para ~500 linhas
  main.jsx
  index.css

  components/
    common/
      SystemAlertModal.jsx    ← FASE 1
      ConfirmDialog.jsx       ← FASE 1

    selectors/
      NodeSelector.jsx        ← FASE 2
      PersonSelector.jsx      ← FASE 2

    org/
      ListNode.jsx            ← FASE 2
      OrgNode.jsx             ← já existe

    assets/
      AssetForm.jsx           ← FASE 3
      AssetDetail.jsx         ← FASE 4
      AssetTypesModal.jsx     ← FASE 3

    contracts/
      ContractForm.jsx        ← FASE 3
      ContractDetail.jsx      ← FASE 4

    people/
      PersonForm.jsx          ← FASE 3
      PersonDetail.jsx        ← FASE 4

    dashboard/
      Dashboard.jsx           ← FASE 4

  services/
    assetsService.js          ← FASE 5
    contractsService.js       ← FASE 5
    nodesService.js           ← FASE 5
    personsService.js         ← FASE 5
    auditService.js           ← FASE 5

  utils/
    helpers.js                ← já existe
    exportUtils.js            ← FASE 1
    encoding.js               ← FASE 1
    phone.js                  ← FASE 1
    assetUtils.js             ← FASE 1
    contractUtils.js          ← FASE 1

  data/
    seedData.js               ← já existe

  lib/
    supabase.js               ← já existe
```

---

## 8. Fases Recomendadas

| Fase | O que fazer | Risco | Redução estimada do App.jsx |
|------|-------------|-------|-----------------------------|
| **FASE 0** | Levantamento (este documento) | ✅ Zero | 0 linhas |
| **FASE 1** | Extrair: SystemAlertModal, ConfirmDialog, exportUtils.js, encoding.js, phone.js, assetUtils.js | ✅ Baixo | ~300 linhas |
| **FASE 2** | Extrair: NodeSelector, PersonSelector, ListNode | 🟡 Médio | ~300 linhas |
| **FASE 3** | Extrair formulários: AssetForm, ContractForm, PersonForm, NodeForm, AssetTypesModal | 🟡 Médio | ~1.200 linhas |
| **FASE 4** | Extrair detalhes e Dashboard | 🟡/🔴 Médio-Alto | ~800 linhas |
| **FASE 5** | Extrair services Supabase | 🔴 Alto | ~400 linhas |
| **FASE 6** | Context API / estado global | 🔴 Alto | Refatoração total |

---

## 9. Análise do .gitignore

**Entradas já presentes:**
- `node_modules`, `dist`, `dist-ssr`, `*.local`, `*.log`, `.DS_Store`, `.vscode/*`

**Entradas AUSENTES — adicionar:**
```gitignore
# Segredos
.env
.env.local
.env.*.local

# Backups e temporários
backup/
backup_recovery/
scratch/
src/backup_layout/
*.bak
*.tmp

# Arquivos gerados/desnecessários
On_line/
eslint_results.txt
update.json
Thumbs.db
```

> ⚠️ **Atenção crítica:** `.env` está atualmente rastreado no Git. Contém a chave `VITE_SUPABASE_ANON_KEY`. Deve ser removido com `git rm --cached .env` antes de qualquer push público.

---

## 10. Sugestões para GOVERNANCE.md

Seções a adicionar:

1. **Política de Refatoração Segura** — nunca alterar mais de um componente por sessão; testar localmente antes de commitar.
2. **Arquivos proibidos de apagar sem confirmação** — `src/App.jsx`, `src/index.css`, `src/lib/supabase.js`, `public/logo-dmae.png`.
3. **Fluxo obrigatório de branch** — `feature/xxx` → PR → `main` → build → `gh-pages`.
4. **Ordem de quebra do App.jsx** — seguir as Fases 1 a 6 desta documentação.
5. **Checkpoints de teste após cada fase** — login, carregamento, Pan/Zoom, CRUD de ativo, relatório PDF.
6. **Regras de encoding UTF-8** — nunca editar App.jsx com Notepad; usar VS Code com UTF-8 sem BOM.
7. **Backup e restauração** — criar commit antes de cada fase de refatoração.
8. **Padrão .env/Supabase** — nunca commitar `.env`; usar `.env.example` para documentar variáveis.
9. **Proibido subir backup/, scratch/, .env e dist** — adicionar ao `.gitignore` e remover do tracking.
10. **Não substituir main sem testar localmente** — obrigatório Hard Refresh (Ctrl+Shift+R) antes do build.

---

## 11. Áreas Sensíveis — Não Quebrar Sem Teste

| Área | Teste mínimo recomendado |
|------|--------------------------|
| Login administrador | Fazer login com usuário admin |
| Troca obrigatória de senha | Criar usuário novo e verificar redirecionamento |
| `loadCloudData` | Recarregar página e verificar nós e ativos |
| Persistência de nodes | Criar/editar/excluir nó e recarregar |
| Persistência de assets | Cadastrar ativo e verificar no registro |
| Persistência de contratos | Criar contrato e verificar listagem |
| Pan/Zoom da árvore | Arrastar e aplicar zoom no organograma |
| Modo Lista | Alternar para modo lista e navegar |
| Foco de unidade | Clicar em unidade e verificar subárvore |
| Ativos de contingência | Criar ativo com isEmergency=true |
| WhatsApp | Verificar link gerado com número correto |
| Máscara de telefone | Digitar número e verificar formatação |
| Exportação PDF | Gerar PDF de ativos e verificar seções |
| Exportação CSV | Baixar CSV e verificar dados |
| Logs de auditoria | Realizar operação e verificar log gerado |
| Supabase Presence | Abrir 2 abas e verificar contador online |

---

## 12. Recomendação Final

> O `App.jsx` com 5.241 linhas é sustentável no curto prazo mas representa risco crescente de manutenção.  
> A refatoração deve ser feita em fases pequenas, com commit entre cada fase.

**Próximos passos imediatos (sem risco):**
1. Adicionar entradas faltantes no `.gitignore`
2. Remover `.env` do tracking Git (`git rm --cached .env`)
3. Iniciar **FASE 1**: extrair `SystemAlertModal`, `ConfirmDialog` e `utils/exportUtils.js`

**Não fazer ainda:**
- Não mover os services Supabase
- Não extrair o Dashboard
- Não criar Context API

---


---

## Checkpoint pós-Fase 2B

- **Branch atual:** `refactor/app-split-phase-2b-listnode`
- **Último commit:** `7da75b85` — Extrai componente de lista do organograma
- **Linhas atuais do App.jsx:** 5.151 (Redução de ~260 linhas)
- **Componentes extraídos:**
  - `WhatsAppButton` (em `src/components/common/WhatsAppButton.jsx`)
  - `WhatsAppQrButton` (em `src/components/common/WhatsAppQrButton.jsx`)
  - `SystemAlertModal` (em `src/components/common/SystemAlertModal.jsx`)
  - `ConfirmDialog` (em `src/components/common/ConfirmDialog.jsx`)
  - `NodeSelector` (em `src/components/selectors/NodeSelector.jsx`)
  - `PersonSelector` (em `src/components/selectors/PersonSelector.jsx`)
  - `ListNode` (em `src/components/org/ListNode.jsx`)
- **Utilitários extraídos:**
  - `phone.js` (lógica de máscara e WhatsApp)
  - `assetUtils.js` (agrupamento e status de ativos)
  - `contractUtils.js` (status e estatísticas de contratos)
- **Testes realizados (Pelo Usuário):**
  - ✅ Login administrador e troca de senha
  - ✅ CRUD de Ativos (Proprios e Contratados)
  - ✅ CRUD de Contratos (Gestores e Fiscais)
  - ✅ WhatsApp/QR Code em ativos de contingência
  - ✅ Modais de Alerta e Confirmação
  - ✅ Modo Lista (Navegação recursiva)
  - ✅ Árvore/Pan/Zoom (Integridade mantida)
- **Áreas ainda não mexidas (Pendentes):**
  - Dashboard/BI (Lógica complexa)
  - PDF/CSV (Exportação de logs e ativos)
  - Supabase services (loadCloudData e mutations)
  - Formulários grandes (AssetForm, PersonForm, NodeForm)


---

## Checkpoint pós-Fase 4B — Auditoria e Administração

### Estado atual
- Branch atual: `refactor/app-split-phase-4b-logaction-standard`
- Último commit: `d88d16c3` — Padroniza chamadas futuras de auditoria
- Linhas atuais do App.jsx: 5018
- Working tree: Limpo (clean)

### Fase 4A
- Extraído LogsModal para `src/components/admin/LogsModal.jsx`.
- Extraído StatsModal para `src/components/admin/StatsModal.jsx`.
- Criada normalização de logs com `normalizeAuditLog`.
- Corrigido fetch de `audit_logs` para usar os campos reais do schema:
  - `entity_type`
  - `entity_name`
  - `details`
- Corrigida visualização de Detalhes/Alvo.
- Corrigidos PDF, impressão e CSV do histórico.

### Fase 4B
- Padronizadas chamadas futuras de `logAction`.
- Tipos padronizados:
  - USER
  - AUTH
  - NODE
  - PERSON
  - ASSET
  - ASSET_TYPE
  - CONTRACT
  - IMPORT
  - EXPORT
  - SYNC
  - SYSTEM
- Mantida compatibilidade com logs antigos por fallback.
- Nenhuma alteração no schema Supabase.
- Nenhuma migration aplicada.

### Testes realizados
- Histórico de Modificações.
- Detalhes/Alvo na tela.
- Logs antigos por fallback.
- Novos logs com `entity_type`/`entity_name`.
- PDF do histórico.
- CSV do histórico.
- Login/logout.
- Edição de caixa.
- Edição de ativo.
- Edição de contrato.

### Áreas preservadas
- Dashboard/BI.
- Exportações principais de ativos/contratos.
- Supabase services.
- Formulários grandes.
- `loadCloudData`.
- `saveAsset`/`saveContract`/`saveNode`/`savePerson`.

### Próximas fases sugeridas
Fase 5A — extrair modal/detalhe de pessoa, se estiver isolado.
Fase 5B — extrair modal/detalhe de contrato, sem salvar contrato ainda.
Fase 5C — extrair modal/detalhe de ativo, sem AssetForm ainda.
Fase 6 — formulários grandes.
Fase 7 — serviços Supabase.

*Documento atualizado em 2026-04-26.*

---

## Checkpoint pós-Fase 3C

### Estado atual
- Branch atual: `refactor/app-split-phase-3c-asset-badges-use`
- Último commit: `c8b7779a` — Aplica badges visuais de ativos
- Linhas atuais do App.jsx: 5020 (Redução acumulada contínua)
- Working tree: Limpo

### Fases concluídas
- Fase 0 — Segurança, .gitignore, .env fora do tracking e inventário.
- Fase 1A — Consolidação de phone.js, WhatsAppButton e WhatsAppQrButton.
- Fase 1B — Extração de SystemAlertModal e ConfirmDialog.
- Fase 1C — Extração de utilitários puros de ativos e contratos.
- Fase 2A — Extração de NodeSelector e PersonSelector.
- Fase 2B — Extração de ListNode.
- Fase 2C — Checkpoint documental pós-Fase 2B.
- Fase 3A — Extração de AssetTypesModal.
- Fase 3B — Extração de AssetContactActions e preparação de AssetBadges.
- Fase 3C — Aplicação de AssetBadges em pontos visuais simples.

### Arquivos criados/extraídos
Common:
- src/components/common/SystemAlertModal.jsx
- src/components/common/ConfirmDialog.jsx
- src/components/common/WhatsAppButton.jsx
- src/components/common/WhatsAppQrButton.jsx

Selectors:
- src/components/selectors/NodeSelector.jsx
- src/components/selectors/PersonSelector.jsx

Org:
- src/components/org/ListNode.jsx

Assets:
- src/components/assets/AssetTypesModal.jsx
- src/components/assets/AssetContactActions.jsx
- src/components/assets/AssetBadges.jsx

Utils:
- src/utils/phone.js
- src/utils/assetUtils.js
- src/utils/contractUtils.js

### Testes já realizados
- Login administrador.
- Cadastro/edição de tipos de ativos.
- Confirmação de exclusão com ConfirmDialog.
- Alertas persistentes com SystemAlertModal.
- Cadastro de estrutura com responsável.
- Bloqueio de pessoa em mais de uma caixa/node.
- Permissão de pessoa em múltiplos contratos.
- Unidade vinculada em contrato.
- Registro Centralizado de Ativos.
- Ativos de contingência.
- Ativos em manutenção.
- WhatsApp e QR Code.
- Visualização em lista.
- Subir nível e fechar foco.
- Árvore e Pan/Zoom.
- Dashboard conferido visualmente.
- PDF/CSV preservados.

### Áreas preservadas até agora
- Dashboard/BI complexo.
- Exportação PDF.
- Exportação Smart CSV.
- loadCloudData.
- saveAsset.
- saveContract.
- saveNode.
- savePerson.
- Autenticação/login.
- Regras de permissões.
- Supabase services.

### Próximas fases sugeridas
Fase 4A — extrair modais administrativos menos acoplados:
- LogsModal;
- StatsModal;
- UsersModal, se estiver isolado.

Fase 4B — extrair detalhes pequenos:
- PersonDetail;
- ContractDetail simples;
- AssetDetail apenas se estiver claro e isolado.

Fase 5 — formulários grandes:
- PersonForm;
- NodeForm;
- AssetForm;
- ContractForm.

Fase 6 — serviços Supabase:
- Somente depois dos componentes visuais estarem estáveis.

### Regras para próximas fases
- Não misturar refatoração com funcionalidade nova.
- Um commit por fase.
- Teste manual obrigatório antes de commit.
- Não mexer em Dashboard/PDF/CSV sem fase específica.
- Não mover funções Supabase ainda.
- Não fazer push sem autorização.

---

## Checkpoint pós-Fase 5C — Detalhes de entidades

### Estado atual
- Branch atual: `refactor/app-split-phase-5c-asset-detail`
- Último commit: `7296a60e` — Extrai detalhes de ativo
- Linhas atuais do App.jsx: 4687
- Working tree: Limpo

### Fase 5A — PersonDetail
- Extraído componente:
  - src/components/people/PersonDetail.jsx
- Responsável pela visualização/leitura de dados de pessoa.
- Preservados no App.jsx:
  - savePerson;
  - edição de pessoa;
  - exclusão;
  - Supabase;
  - regras de vínculo pessoa-node;
  - contratos.

### Fase 5B — ContractDetail
- Extraído componente:
  - src/components/contracts/ContractDetail.jsx
- Responsável pela visualização/leitura de contrato.
- Preservados no App.jsx:
  - saveContract;
  - edição de contrato;
  - validação;
  - Supabase;
  - exportações/relatórios.
- Ajuste adicional:
  - exclusão de contrato passou a usar ConfirmDialog do sistema, removendo popup nativo.

### Fase 5C — AssetDetail
- Extraído componente:
  - src/components/assets/AssetDetail.jsx
- Responsável pela visualização/leitura de ativo.
- Preservados no App.jsx:
  - saveAsset;
  - edição de ativo;
  - validação;
  - Supabase;
  - exportações/relatórios;
  - Dashboard/BI.
- Ajuste adicional:
  - exclusão de ativo passou a usar ConfirmDialog do sistema, removendo popup nativo.

### Testes realizados
- Visualização de pessoa pelo organograma.
- Visualização de pessoa pelo cadastro.
- WhatsApp/QR Code de pessoa.
- Edição de pessoa abre normalmente.
- Exclusão de pessoa abre confirmação.
- Visualização de contrato.
- Impressão/exportação de contrato.
- Edição de contrato abre normalmente.
- Exclusão de contrato usa ConfirmDialog.
- Visualização de ativo próprio.
- Visualização de ativo contratado.
- Visualização de ativo de contingência.
- Visualização de ativo em manutenção.
- WhatsApp/QR Code de ativo.
- Edição de ativo abre normalmente.
- Exclusão de ativo usa ConfirmDialog.
- Dashboard preservado.
- Console sem erro.

### Componentes extraídos até a Fase 5
Common:
- SystemAlertModal
- ConfirmDialog
- WhatsAppButton
- WhatsAppQrButton

Admin:
- LogsModal
- StatsModal

Selectors:
- NodeSelector
- PersonSelector

Org:
- ListNode

People:
- PersonDetail

Contracts:
- ContractDetail

Assets:
- AssetTypesModal
- AssetContactActions
- AssetBadges
- AssetDetail

Utils:
- phone.js
- assetUtils.js
- contractUtils.js

### Áreas ainda preservadas para fases futuras
- PersonForm;
- NodeForm;
- AssetForm;
- ContractForm;
- savePerson;
- saveNode;
- saveAsset;
- saveContract;
- loadCloudData;
- serviços Supabase;
- Dashboard/BI;
- exportações principais PDF/CSV;
- autenticação/login.

### Próximas fases sugeridas
Fase 6A — extrair PersonForm.
Fase 6B — extrair NodeForm.
Fase 6C — extrair AssetForm.
Fase 6D — extrair ContractForm.
Fase 6E — checkpoint documental da Fase 6.
Fase 7 — serviços Supabase, somente após estabilização dos formulários.

### Regras para a Fase 6
- Um formulário por fase.
- Não misturar refatoração com nova funcionalidade.
- Não mover Supabase junto com formulário.
- App.jsx continua dono do save.
- Componentes recebem estados e callbacks por props.
- Teste manual obrigatório antes do commit.
- Atenção especial para validação, alertas e ConfirmDialog.
- Não alterar Dashboard/PDF/CSV durante os formulários.

---

## Checkpoint pós-Fase 7D — Bloco de services concluído

### Estado atual
- Branch atual: `refactor/app-split-phase-7d-auxiliary-services`
- Último commit: `cb9594b6` (fix: torna categorias de tipos de ativos dinamicas) + Alterações pendentes.
- Linhas atuais do App.jsx: 4.243
- Working tree: Alterações de auditoria e services auxiliares pendentes de commit.

### Services existentes
Arquivos criados e consolidados em `src/services/`:
- `supabaseReadService.js`: Consultas de leitura (SELECT).
- `supabaseWriteService.js`: Operações de persistência (UPSERT/DELETE).
- `auditService.js`: Persistência de logs de auditoria.

### Fase 7A — supabaseReadService
Responsabilidade:
- centralizar leituras SELECT;
- reduzir acoplamento direto do App.jsx com Supabase;
- manter services puros (sem React, sem estado e sem UI).

Funções extraídas:
- `fetchNodes`, `fetchPersons`, `fetchAssets`, `fetchContracts`, `fetchUsers`, `fetchAssetTypes`, `fetchAuditLogs`.

### Fase 7B — supabaseWriteService
Responsabilidade:
- centralizar operações de escrita e exclusão;
- receber `supabase` e `payload/id` por parâmetro;
- retornar os dados salvos ou status de sucesso;
- não validar regras de negócio nem disparar alertas visuais.

Entidades cobertas:
- **Persons:** `upsertPerson`, `deletePersonById`.
- **Nodes:** `upsertNode`, `deleteNodeById`.
- **Assets:** `upsertAsset`, `deleteAssetById`.
- **Contracts:** `upsertContract`, `deleteContractById`.
- **Asset Types (Fase 7D):** `upsertAssetType`, `deleteAssetTypeById`.
- **Users (Fase 7D):** `upsertUser`, `deleteUserById`, `deleteUserByUsername`.

### Fase 7C — auditService
Responsabilidade:
- centralizar persistência de auditoria;
- construir payload padronizado;
- garantir que falhas de log não bloqueiem operações CRUD.

Funções extraídas:
- `buildAuditLogPayload`, `insertAuditLog`, `writeAuditLog`.

Preservado no App.jsx:
- `logAction` como orquestrador de quando e o que logar;
- `normalizeAuditLog` para compatibilidade visual e retroativa.

### Fase 7D — services auxiliares e categorias dinâmicas
Operações auxiliares extraídas:
- Gestão de tipos de ativos e usuários migrada para services.

Ajuste funcional:
- Categorias/grupos de tipos de ativos tornaram-se dinâmicos.
- Grupos padrão (Veículo, Equipamento, etc.) preservados.
- Novos grupos cadastrados reaparecem como sugestão no `datalist` em tempo real e após recarga.

### Regra permanente — App.jsx como orquestrador
O `App.jsx` continua sendo o núcleo da aplicação, responsável por:
- Montar payloads e validar campos obrigatórios;
- Controlar permissões e perfis de usuário;
- Chamar alertas (`showSystemAlert`) e registrar logs (`logAction`);
- Gerenciar o estado React global e a sincronização visual;
- Coordenar a navegação e o retorno ao modal/listagem de origem.

### Regra permanente — services puros
Os arquivos em `src/services/` devem permanecer desacoplados:
- Não importam React nem hooks;
- Não acessam o estado do App diretamente;
- Não possuem lógica de interface (modais, alertas, cores);
- Lançam erros para serem tratados pela camada de orquestração.

### Regra permanente — retorno ao modal de origem
Toda ação iniciada em um modal ou listagem deve retornar à mesma tela de origem após salvar, cancelar ou fechar, garantindo fluidez na navegação administrativa.

### Testes realizados no bloco 7
- Carregamento inicial via Supabase Cloud;
- CRUD completo de todas as entidades (Pessoas, Estruturas, Ativos, Contratos, Tipos, Usuários);
- Auditoria de todas as operações de escrita;
- Geração de relatórios PDF/CSV de logs com dados reais;
- Navegação do organograma com centralização automática e preservação de zoom;
- Validação matemática de CNPJ e máscaras de campos;
- Persistência de fotos e categorias dinâmicas.

### Próximos blocos
- **Fase 8:** Export Services (Modularização de PDF/CSV).
- **Fase 9:** Dashboard/BI modular e limpeza final.

*Documento atualizado em 2026-04-26.*
