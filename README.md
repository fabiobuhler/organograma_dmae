# DMAE - Sistema de Organograma e Gestão de Ativos

Sistema avançado para visualização da estrutura organizacional do DMAE, integrado com gestão de ativos, pessoal e contratos de contingência.

## 🚀 Funcionalidades Principais

- **Visualização Dinâmica de Organograma**:
  - **Modo Árvore**: Navegação interativa com Zoom e Pan.
  - **Modo Lista**: Visualização hierárquica compacta com bordas coloridas por unidade e expansão recursiva.
- **Gestão de Ativos Centralizada**:
  - Cadastro de ativos com suporte a até 3 fotos.
  - Categorização por tipos e grupos (Editores agora gerenciam tipos de ativos).
  - Identificação visual de equipamentos pertencentes ao **Plano de Contingência** (Ícone de Sirene).
- **Gestão de Pessoal e Contratos**:
  - Vinculação de responsáveis a unidades e contratos.
  - Monitoramento de vigência de contratos (Ativo, A Vencer, Vencido).
  - Gestão de fiscais e gestores de contrato.
- **Governança e Segurança**:
  - **Três Níveis de Acesso**: 
    - **Público**: Visualiza apenas a estrutura básica e ativos (dados de contrato ocultos).
    - **Editor**: Edição de dados, gestão de ativos e tipos de ativos.
    - **Administrador**: Gestão de usuários, logs e estatísticas.
  - **Monitoramento em Tempo Real**: Contador de usuários on-line no rodapé via Supabase Presence.
  - **Estatísticas de BI**: Painel de BI por unidade e painel de estatísticas de acesso para ADM.
  - **Logs de Auditoria Imutáveis**: Registro de todas as ações, acessível apenas por administradores (sem opção de exclusão via UI).
  - **Gestão de Senhas**: Reset de senha seguro para `dmae123` com obrigatoriedade de troca no próximo acesso.
- **Persistência em Nuvem**: Integração total com Supabase.
- **Relatórios e Exportação**:
  - Exportação de listas para **Excel (CSV)**.
  - Geração de relatórios em **PDF** formatado e exportação de Dashboards.
  - Impressão direta do organograma.

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React.js, Vite.
- **Estilização**: Vanilla CSS (DMAE Design System).
- **Ícones**: Lucide-React.
- **Banco de Dados**: Supabase (PostgreSQL) com Realtime Presence.
- **Bibliotecas Auxiliares**: 
  - `html2canvas` / `jspdf` para relatórios.
  - `react-zoom-pan-pinch` para navegação no organograma.

## 📋 Requisitos do Banco de Dados (Supabase)

O sistema utiliza as seguintes tabelas principais:
- `nodes`: Estrutura das unidades e pessoas.
- `assets`: Inventário de equipamentos.
- `persons`: Cadastro de servidores e colaboradores.
- `contracts`: Gestão de contratos e vigências.
- `users`: Gestão de usuários e permissões.
- `audit_logs`: Registro de ações do sistema.
- `asset_types`: Gerenciamento de categorias de ativos.

## ⚙️ Desenvolvimento e Build

### Instalação
```bash
npm install
```

### Executar em Desenvolvimento
```bash
npm run dev
```

### Gerar Pacote de Produção
```bash
npm run build
```

---
**Desenvolvido por:** Fábio Bühler  
**Versão Atual:** 1.0.2026.04241700
