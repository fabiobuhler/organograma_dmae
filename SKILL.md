# Skill de Governança — DMAE Organograma

Esta skill resume as diretrizes críticas para atuação no sistema. Para detalhes completos, consulte [DMAE_GOVERNANCE.skill.md](file:///c:/Users/Fabio/.antigravity/dmae-organograma/DMAE_GOVERNANCE.skill.md).

## 🛡️ Princípios Fundamentais
- **Fonte da Verdade**: Supabase (PostgreSQL). LocalStorage é apenas cache.
- **Segurança**: Proteger dados sensíveis (Contratos/BI) sob guards `(isProtected || canEdit)`.
- **RBAC**: Quatro perfis (Público, Público Interno, Editor, Administrador).
- **Imutabilidade**: Logs de auditoria não podem ser apagados via interface.

## 🎨 Hierarquia de Cores
- **Campo Canônico**: `color` (fallback: `cor`).
- **Herança**: Se um nó tem `color`, ele é a nova base. Se não, herda do pai + clareamento.
- **Suavização**: Padrão de **5%** de fade por nível de profundidade.
- **Consistência**: Modo Árvore e Modo Lista devem usar a mesma lógica (`computeNodeColor`).

## 🛠️ Regras de Operação
- **Contingência**: Use o termo "Contingência". Exiba a Sirene Vermelha com borda amarela.
- **WhatsApp**: Link direto `https://wa.me/55[numero]` para acionamento rápido.
- **Pan/Zoom**: Funcionalidade crítica; preserve `setPointerCapture` e `transform-origin: 0 0`.
- **Encodings**: Preservar UTF-8 rigorosamente. Corrigir mojibake imediatamente.

## 🚀 Fluxo de Trabalho
1. Trabalhar sempre em branches (ex: `fix/`, `feature/`, `refactor/`).
2. Não executar `npm run build` ou `npm run dev` sem autorização.
3. Registrar arquivos alterados e validar com o usuário via prints.
4. Atualizar versão em: `App.jsx`, `README.md`, `README.txt`, `GOVERNANCE.md`.

**Versão de Trabalho:** 1.0.2026.04270956
**Estável de Referência:** 1.0.2026.04270145
