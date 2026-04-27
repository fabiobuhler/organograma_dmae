# Governança e Diretrizes do Sistema DMAE Organograma

Este documento serve como a **Bússola de Desenvolvimento** para qualquer IA ou desenvolvedor que atuar neste projeto. Ele consolida as regras de ouro, padrões visuais e o fluxo de trabalho operacional que mantém a integridade do sistema.

## 1. Identidade e Elementos Essenciais (Não Alterar)
Os elementos abaixo são a "alma" visual do sistema e só devem ser alterados sob solicitação expressa e justificada:

- **Sinalização de Contingência**: Ativos ou unidades críticas DEVEM exibir a **Sirene Vermelha** (`Siren` do lucide-react) dentro de um círculo com **Borda Amarela** (`2px solid #eab308`). O preenchimento da sirene deve ter opacidade leve (`fillOpacity={0.1}`).
- **Logotipo DMAE**: Presente no cabeçalho e favicon, vinculado dinamicamente ao nó raiz (DMAE).
- **Rodapé e Versão**: O rodapé deve conter o nome do desenvolvedor ("Fábio Bühler"), a versão no formato `1.0.YYYY.MMDDHHmm` e o **Contador de Usuários Real-time**.
- **Hierarquia Visual**: O sistema suporta visualização em Árvore (Tree) e Lista. Ambas as visualizações DEVEM utilizar a mesma lógica de cálculo de cores (`computeNodeColor`), garantindo suavização de 5% por nível de profundidade.
- **Governança de Ativos de Contingência**: Ativos de contingência (is_emergency) EXIGEM preenchimento obrigatório de **Responsável pela Contingência** e **Telefone de Acionamento**. A visualização deve priorizar o contato direto via WhatsApp.

## 2. Governança de Dados e Privacidade
- **Privacidade Hardened**: Dados de contratos (SEI, valores, fiscais/gestores) são **SENSÍVEIS**. Eles devem ser omitidos ou protegidos por guards `(isProtected || canEdit)` em todos os modais (Pessoa, Ativo, BI) para usuários não autenticados.
- **Online Presence**: O contador de usuários on-line utiliza **Supabase Presence**. Não utilize simulações por intervalo para este dado; ele deve refletir conexões reais via Websocket.
- **Fonte da Verdade**: O Supabase é a única fonte oficial. O LocalStorage é usado apenas como cache de contingência.

## 3. Segurança e Auditoria
- **Imutabilidade de Logs**: O histórico de auditoria (`audit_logs`) é permanente. A interface administrativa NÃO deve permitir a exclusão de registros de log. Limpezas só devem ocorrer via console direto do banco de dados por pessoal autorizado.
- **Níveis de Acesso (RBAC)**: 
  - **Público**: Visualização básica de estrutura e ativos.
  - **Público Interno**: Visualização completa de dados liberados internamente (sem edição).
  - **Editores**: Podem gerenciar a estrutura, ativos, pessoas, contratos e **Tipos de Ativos**.
  - **Administradores**: Acesso exclusivo a Gestão de Usuários, Logs e Estatísticas de Acesso.
- **Gestão de Usuários**: 
  - Exclusão de usuários deve ser feita via UUID (ID) para evitar erros de homônimos ou formatação.
  - O Reset de Senha (padrão `dmae123`) deve forçar o estado `must_change_password: true`.

### Supabase Auth
- O Supabase Auth é a fonte oficial de autenticação.
- A tabela `users` representa o perfil operacional dentro do sistema.
- Usuários liberados devem possuir vínculo com `auth_user_id`.
- Não excluir usuários por nome, e-mail ou matrícula.
- Exclusão e reset devem usar UUID/id seguro.
- Reset de senha temporária deve forçar `must_change_password: true`.
- Operações administrativas do Auth não devem ser feitas no frontend com `service_role`.
- O frontend deve usar apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

## 4. Fluxo de Trabalho (Workflow do Agente)
- **Interação com Usuário**: Priorize pedir ao usuário que realize ações manuais ou forneça prints em vez de tentar navegar autonomamente no browser, devido à precisão e agilidade.
- **Navegação de Árvore (Pan/Zoom)**: Esta é uma funcionalidade **CRÍTICA**. 
  - Utilize **Pointer Events** (`setPointerCapture`) para garantir que o arraste funcione em todos os dispositivos.
  - O container interno (`tree-viewport-inner`) DEVE usar `transform-origin: 0 0` (top left).
  - A centralização da árvore deve ser feita via **Safe Centering** (`margin: 0 auto` no elemento `.tree`), nunca via `justify-content: center` no container quando houver possibilidade de overflow lateral.
  - Efeitos que interagem com o DOM da árvore (`vpRef`) devem incluir `isLoadingCloud` em suas dependências para garantir o registro após o carregamento total.
- **Build de Produção**:
  - **NUNCA** gere o build (`npm run build`) automaticamente sem antes validar o Pan em Hard Refresh (Ctrl+Shift+R).
  - Antes de cada build, atualize a versão no `App.jsx`, no `README.md` e no `README.txt`.
  - O arquivo `README.txt` deve ser **obrigatoriamente** copiado para a pasta `dist` após cada build, garantindo que o pacote de produção contenha a documentação atualizada.

- **Sincronização de Tipos de Ativos**: Operações de persistência (INSERT/UPDATE) devem sempre verificar as restrições de RLS. Devido ao uso de chaves *anon*, as tabelas públicas de ativos devem estar com RLS desativado ou corretamente configuradas. Efetue sempre `.select()` após `insert()` ou `update()` para confirmar efetivação.
- **Formatação e Máscaras**: Campos como telefone e CPF/CNPJ devem ser formatados e validados dinamicamente para garantir a uniformidade (ex: `maskPhone`).
- **Integração Externa (WhatsApp)**: Sempre que houver um telefone de contato responsável, o sistema deve apresentar um atalho de redirecionamento dinâmico no formato `https://wa.me/55[numero]`.
- **Limpeza de Código (Lint)**: A limpeza deve ser **CONSERVADORA**. Nunca remova ícones do `lucide-react` baseando-se apenas no JSX principal; verifique sempre funções auxiliares (ex: `assetIcon`) e mapeamentos condicionais. A remoção de ícones usados em helpers causa `ReferenceError` imediato e impede o carregamento do App.

## 5. Estatísticas, BI e Auditoria Operacional
- O Dashboard de BI deve consolidar dados recursivamente: unidade + descendentes.
- As estatísticas administrativas devem ser geradas dinamicamente a partir da tabela `audit_logs`.
- Não criar contadores redundantes no banco de dados sem necessidade.
- Indicadores de contingência em manutenção devem considerar apenas ativos com `isEmergency === true && isMaintenance === true`.
- Ativos comuns em manutenção não devem ser contados como contingência em manutenção.

## 6. Hierarquia de Cores e Herança
- **Cor Canônica**: O campo `color` é a fonte oficial da cor do nó. O campo `cor` é mantido apenas para compatibilidade legada.
- **Base da Herança**: Se um nó possui `color` definida, ele torna-se a nova origem da herança para seus descendentes.
- **Suavização (Fade)**: Nós que não possuem cor própria herdam a cor efetiva do pai clareada em exatos **5%**. Esta regra é universal para subordinadas e unidades de apoio.
- **Consistência**: Bordas, conectores e fundos de cards devem respeitar esta hierarquia para manter a coesão visual.

---
**Desenvolvido por:** Fábio Bühler  
**Versão Atual:** 1.0.2026.04270956 (Governance and Color Sync)
