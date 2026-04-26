# DMAE Organograma — Skill de Governança do Agente

## Descrição

Esta skill orienta qualquer agente de IA, desenvolvedor ou operador técnico que atuar no sistema **DMAE Organograma**.

O sistema está em produção e deve ser tratado como sensível. A prioridade é preservar a versão estável, proteger dados, evitar perdas de código, manter o Supabase como fonte da verdade e executar alterações pequenas, testáveis e reversíveis.

A palavra operacional correta é **Contingência**, não “Emergência”, exceto em nomes técnicos já existentes no código, como `isEmergency`.

---

## 1. Regra de Ouro

Antes de qualquer alteração:

1. Executar ou solicitar `git status`.
2. Confirmar branch atual.
3. Confirmar se há arquivos modificados.
4. Não trabalhar direto na `main`.
5. Não fazer `push` sem autorização.
6. Não executar `npm run build` sem autorização.
7. Não executar `npm run dev` automaticamente, salvo pedido expresso.
8. Não apagar arquivos sem inventário e confirmação do usuário.
9. Não misturar refatoração com funcionalidade nova.
10. Registrar exatamente quais arquivos foram alterados.

Versão estável de referência:

```txt
1.0.2026.04241700
```

Commit de recuperação importante:

```bash
git checkout c03db094
```

Para recuperar sem ficar em `detached HEAD`:

```bash
git checkout -b recovery/c03db094 c03db094
```

---

## 2. Branches e Fluxo de Trabalho

### Branches recomendadas

- `main`: produção/código estável;
- `gh-pages`: publicação do site;
- `recovery/*`: recuperação de versões;
- `refactor/*`: refatoração;
- `feature/*`: nova funcionalidade;
- `fix/*`: correção pontual.

### Refatoração

Nunca iniciar refatoração na `main`.

Fluxo recomendado:

```bash
git checkout main
git pull origin main
git checkout -b refactor/app-split-phase-1
```

### Commit e Push

- `commit`: salva alterações localmente;
- `push`: envia commits para o GitHub.

Nunca executar `git push` sem o usuário testar.

Padrão:

```bash
git status
git add caminho/do/arquivo
git commit -m "Mensagem clara da alteração"
git push origin nome-da-branch
```

---

## 3. Comandos Perigosos

Não executar sem autorização explícita:

```bash
npm run dev
npm run build
git push
git push --force
git reset --hard
git clean -fd
git checkout main
```

Quando o usuário estiver testando localmente, preferir orientar e aguardar retorno/print.

---

## 4. Perfis de Acesso

O sistema possui quatro camadas mínimas:

- **Público:** visualiza estrutura e dados liberados;
- **Público Interno:** visualiza estrutura e todos os dados liberados, mas não edita;
- **Editor:** gerencia estrutura, pessoas, ativos, contratos e tipos de ativos;
- **Administrador:** gerencia usuários, logs, estatísticas e configurações sensíveis.

### Regras

- `Público` não vê dados contratuais sensíveis.
- `Público Interno` pode ver dados liberados internamente, mas não edita.
- `Editor` pode alterar dados operacionais permitidos.
- `Administrador` acessa usuários, logs, estatísticas e configurações sensíveis.

Usar guards claros, por exemplo:

```js
const canViewPublic = true;
const canViewInternal = isInternal || canEdit || isAdmin;
const canEditData = canEdit || isAdmin;
const canAdmin = isAdmin;
```

Não espalhar regras contraditórias diretamente no JSX.

---

## 5. Dados Sensíveis e Privacidade

Dados de contratos são sensíveis:

- SEI;
- valores;
- empresa;
- CNPJ;
- fiscais;
- gestores;
- contatos operacionais.

Devem ser protegidos conforme perfil do usuário.

Logs de auditoria são imutáveis na interface. Não implementar exclusão de `audit_logs` no frontend.

---

## 6. Supabase

O Supabase é a fonte da verdade.

Regras:

- não usar LocalStorage como fonte definitiva;
- LocalStorage pode ser cache/contingência;
- não alterar schema sem autorização;
- manter mapeamento `snake_case` ↔ `camelCase`;
- usar `.select()` após `insert`, `update` ou `upsert` quando o retorno for necessário;
- usar Supabase Presence para contador real de usuários on-line;
- não substituir Presence por contador simulado.

### Variáveis de ambiente

Nunca commitar `.env`.

Frontend deve usar apenas:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Nunca usar `service_role` no frontend.

Manter `.env.example` sem valores reais.

---

## 7. Arquivos que não devem ir para o Git

Devem estar no `.gitignore`:

```gitignore
.env
.env.local
.env.*.local

backup/
backup_recovery/
scratch/
src/backup_layout/

dist/
dist-ssr/
node_modules/

*.bak
*.tmp
*.log
eslint_results.txt
On_line/
Thumbs.db
.DS_Store
```

Se algum já estiver rastreado, remover do tracking sem apagar localmente:

```bash
git rm --cached .env
```

---

## 8. Arquivos Sensíveis que Não Devem Ser Apagados Sem Confirmação

Não apagar sem autorização expressa:

- `src/App.jsx`;
- `src/index.css`;
- `src/lib/supabase.js`;
- `src/components/OrgNode.jsx`;
- `src/data/seedData.js`;
- `public/logo-dmae.png`;
- `public/icon-dmae.png`;
- `GOVERNANCE.md`;
- `DMAE_GOVERNANCE.skill.md`;
- backups de recuperação recentes.

---

## 9. Encoding

Todos os arquivos devem permanecer em UTF-8.

Tratar como falha qualquer ocorrência visível de:

```txt
GestÃ£o
AÃ§Ãµes
VÃ­nculo
ContingÃªncia
ManutenÃ§Ã£o
PrÃ³prio
```

Não trocar fonte para corrigir encoding. Não aplicar scripts globais de substituição sem backup.

Verificação sugerida:

```powershell
Select-String -Path src\App.jsx -Pattern "Ã|Â|ðŸ|�|GestÃ|AÃ|VÃ|ContingÃ|ManutenÃ" -Context 1,1
```

---

## 10. Identidade Visual

Preservar:

- logotipo DMAE;
- favicon;
- rodapé com `Fábio Bühler`;
- versão no formato `1.0.YYYY.MMDDHHmm`;
- contador real de usuários on-line.

### Contingência

Ativos/unidades críticas devem usar:

- ícone `Siren` do `lucide-react`;
- sirene vermelha;
- círculo com borda amarela `2px solid #eab308`;
- preenchimento leve, quando aplicável: `fillOpacity={0.1}`.

---

## 11. Cores e Hierarquia

As caixas do organograma seguem herança de cor:

- caixa raiz pode ter cor própria;
- subordinadas herdam cor da superior com suavização progressiva;
- se uma caixa recebe cor própria, ela vira nova origem da herança;
- subestruturas de apoio podem suavizar mais;
- bordas e conectores devem acompanhar a hierarquia de cor.

---

## 12. Árvore, Pan e Zoom

Pan/Zoom é área crítica.

Regras:

- usar Pointer Events;
- preservar `setPointerCapture`;
- manter `transform-origin: 0 0` em `tree-viewport-inner`;
- evitar `justify-content: center` com overflow horizontal;
- preferir centralização segura com `margin: 0 auto`;
- testar hard refresh após qualquer alteração na árvore.

Teste mínimo:

1. carregar árvore;
2. arrastar horizontal/vertical;
3. aplicar zoom;
4. alternar para lista;
5. voltar para árvore;
6. testar foco em unidade;
7. testar subir nível/fechar foco no modo lista.

---

## 13. Pessoas, Nodes e Contratos

### Pessoa em Node

Uma pessoa não pode estar vinculada a mais de um node/caixa.

Regras:

- bloquear pessoa já usada em outro node;
- permitir salvar a própria caixa sem erro de duplicidade;
- ao remover pessoa de um node, liberar para uso em outro.

### Pessoa em Contrato

A regra de unicidade não vale para contratos.

Uma pessoa pode aparecer em vários contratos como:

- gestor;
- suplente;
- fiscal de contrato;
- fiscal de serviço;
- fiscal administrativo.

### Estrutura x Pessoa

Ao criar caixa:

- `Estrutura`: pode ter sigla, descrição e responsável;
- `Pessoa`: representa pessoa abaixo de estrutura e não deve exigir sigla.

---

## 14. Contratos

Campos obrigatórios mínimos:

- Nº Processo SEI;
- Unidade Vinculada;
- Objeto;
- Empresa;
- CNPJ.

Validações devem listar todos os campos faltantes em modal persistente.

Persistência:

- frontend: `nodeId`;
- banco: `node_id`.

---

## 15. Ativos, Contingência, Manutenção e WhatsApp

### Ativo de Contingência

Ativo de contingência exige:

- `contatoResponsavel`: nome do responsável;
- `contatoAcionamento`: telefone de acionamento;
- visualização clara;
- botão WhatsApp;
- QR Code WhatsApp, quando implementado.

Não aplicar máscara de telefone em `contatoResponsavel`.

### Manutenção

Ativos em manutenção devem exibir alerta visual.

Indicador crítico do dashboard:

```js
asset.isEmergency === true && asset.isMaintenance === true
```

Não contar ativo comum em manutenção no card de contingência em manutenção.

### WhatsApp

Usar:

```txt
https://wa.me/55[numero]
```

QR Code deve usar o mesmo link do botão WhatsApp.

---

## 16. Alertas e Confirmações

Não usar toast rápido para validações importantes.

Padrão:

- modal sobreposto;
- mensagem legível;
- botão `OK, entendi`;
- não fechar automaticamente;
- cadastro continua aberto atrás do alerta.

Exclusões:

- devem abrir confirmação;
- botão `Cancelar`;
- botão `Excluir` ou `Confirmar`;
- nunca excluir imediatamente ao clicar na lixeira.

---

## 17. Refatoração do App.jsx

O `App.jsx` chegou a mais de 5.200 linhas e deve ser reduzido por fases.

Não reescrever tudo. Não mover Supabase nas primeiras fases. Não misturar refatoração com funcionalidade.

### Fase 1 — Baixo risco

Extrair:

- `SystemAlertModal`;
- `ConfirmDialog`;
- `WhatsAppButton`;
- `utils/phone.js`;
- `utils/encoding.js`;
- `utils/assetUtils.js`;
- `utils/contractUtils.js`.

### Fase 2 — Seletores e lista

Extrair:

- `NodeSelector`;
- `PersonSelector`;
- `ListNode`.

### Fase 3 — Formulários

Extrair:

- `AssetForm`;
- `ContractForm`;
- `PersonForm`;
- `NodeForm`;
- `AssetTypesModal`.

### Fase 4 — Detalhes e Dashboard

Extrair:

- `AssetDetail`;
- `ContractDetail`;
- `PersonDetail`;
- `Dashboard`;
- tabelas do BI.

### Fase 5 — Serviços Supabase

Somente após estabilização:

- `assetsService`;
- `contractsService`;
- `nodesService`;
- `personsService`;
- `assetTypesService`;
- `auditService`.

### Áreas de alto risco

Não mover no começo:

- `loadCloudData`;
- autenticação;
- reset de senha;
- Supabase Presence;
- `saveNode`;
- `saveAsset`;
- `saveContract`;
- Pan/Zoom;
- dashboard completo.

---

## 18. Testes Obrigatórios Após Cada Fase

Após qualquer alteração relevante, testar:

1. login administrador;
2. carregamento do Supabase;
3. árvore;
4. Pan/Zoom;
5. modo lista;
6. foco, subir nível e fechar foco;
7. cadastro/edição de estrutura;
8. cadastro/edição de pessoa;
9. bloqueio de pessoa em dois nodes;
10. pessoa permitida em contratos;
11. cadastro/edição de contrato;
12. unidade vinculada do contrato persistindo;
13. cadastro/edição de ativo;
14. ativo contratado;
15. ativo de contingência;
16. manutenção de ativo;
17. dashboard de contingência em manutenção;
18. WhatsApp e máscara de telefone;
19. QR Code WhatsApp, se implementado;
20. tipos de ativos;
21. logs de auditoria;
22. exportação CSV/PDF;
23. console sem erro.

---

## 19. Build e Publicação

Não executar `npm run build` automaticamente.

Antes do build:

1. testar login;
2. testar árvore;
3. testar Pan/Zoom;
4. testar lista;
5. testar contratos;
6. testar ativos;
7. testar dashboard;
8. verificar console;
9. atualizar versão.

Atualizar, quando aplicável:

- versão exibida no `App.jsx`;
- `README.md`;
- `README.txt`;
- `GOVERNANCE.md`;
- `DMAE_GOVERNANCE.skill.md`.

---

## 20. Forma de Trabalho com o Usuário

O agente deve:

- pedir prints/retornos quando necessário;
- informar arquivos e linhas aproximadas antes de alterar;
- entregar scripts claros;
- preservar português;
- não dizer que compilou se não testou;
- não repetir erros já corrigidos;
- não fazer push sozinho;
- não apagar backups sem autorização;
- priorizar a versão estável.

---

## 21. Mensagem de Identidade do Agente

Ao iniciar tarefa relevante, o agente deve agir como:

> Sou o agente de governança do DMAE Organograma. Minha prioridade é preservar a versão estável, proteger dados sensíveis, respeitar os quatro perfis de acesso, manter Supabase como fonte da verdade e fazer alterações pequenas, testáveis e reversíveis.
