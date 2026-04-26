# Fase 0 — Segurança e Higiene do Repositório

## Estado do Git
- **Branch:** `refactor/app-split-phase-0-security`
- **Último Commit:** `c03db094` (ponto de restauracao - relatorios PDF profissionais...)
- **Working Tree:** Possui alterações locais não commitadas em `App.jsx`, `index.css`, `package.json` e `package-lock.json`.

## Arquivos sensíveis encontrados
- **.env:** Estava rastreado no Git. Removido do tracking com `git rm --cached`.
- **lista.txt:** Presente no diretório raiz. Recomendação de exclusão do Git.
- **Token em cache gh-pages:** Identificado em `node_modules\.cache\gh-pages\https!fabiobuhler!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@github.com!fabiobuhler!organograma_dmae`. **URGENTE: Revogar token no GitHub.**
- **node_modules:** Existe localmente (normal). Cache de gh-pages contém segredo.
- **dist:** Pasta de build presente localmente.

## .gitignore
- **Entradas adicionadas:** `.env`, `backup/`, `backup_recovery/`, `scratch/`, `src/backup_layout/`, `On_line/`, `eslint_results.txt`, `lista.txt`, `update.json`, `*.bak`, `*.tmp`.
- **Entradas já existentes:** `node_modules`, `dist`, `dist-ssr`, `logs`, `*.log`, `.vscode/*`, `.idea`, `.DS_Store`.

## Arquivos rastreados que deveriam ser ignorados
| Arquivo/Pasta | Status | Recomendação |
| :--- | :--- | :--- |
| `backup/` | Rastreado | Remover do tracking (`git rm -r --cached`) |
| `backup_recovery/` | Rastreado | Remover do tracking (`git rm -r --cached`) |
| `scratch/` | Rastreado | Remover do tracking (`git rm -r --cached`) |
| `On_line/` | Rastreado | Remover do tracking (`git rm -r --cached`) |
| `eslint_results.txt` | Rastreado | Remover do tracking (`git rm --cached`) |
| `update.json` | Rastreado | Remover do tracking (`git rm --cached`) |
| `lista.txt` | Untracked | Adicionar ao .gitignore (feito) |

## Ações executadas
- `.gitignore` atualizado com as novas regras de higiene.
- `.env` removido do tracking do Git (mantido localmente).
- `.env.example` criado para referência de configuração.
- **Nenhum arquivo de produção (`App.jsx`, `index.css`) foi alterado nesta fase.**
- Pastas de organização criadas: `docs/migrations/`, `docs/archive/`, `scripts/maintenance/`.

## Pendências para decisão do usuário
1. **REVOGAR TOKEN GITHUB:** O token foi exposto no nome da pasta de cache do `gh-pages` dentro de `node_modules`.
2. **LIMPAR CACHE GH-PAGES:** Confirmar comando `Remove-Item -Recurse -Force node_modules\.cache\gh-pages`.
3. **REMOVER DO TRACKING:** Autorizar a remoção (cached) das pastas de backup, scratch e arquivos temporários listados na tabela acima.
4. **MOVIMENTAÇÃO DE ARQUIVOS:** Autorizar mover migrações SQL para `docs/migrations/` e scripts para `scripts/maintenance/`.
