# Regras de negócio transversais e decisões arquiteturais

> Todas as regras abaixo são **extraídas do código atual**, com referência ao arquivo/linha de origem. Se uma regra aqui descrita não corresponder mais ao código, o código está certo — corrija este documento. Para as decisões arquiteturais de mais alto nível (D1–D10), ver [AGENTS.md](../../AGENTS.md#4-decisões-arquiteturais--como-o-sistema-é-hoje).

## 1. Escopo multi-departamento (Company → Department)

Praticamente toda listagem é filtrada por `{ companyId, departmentId }` opcionais — quando omitidos, retornam todos os registros visíveis ao usuário. Não há enforcement de autorização por escopo na camada de serviço: o filtro é uma conveniência de consulta, não um controle de acesso (o frontend decide o que passar). Ver `initiative.service.ts` (`listByScope`), controllers de `absence`, `contract`, `initiative`, `skill`, `system`, `vendor`.

## 2. Iniciativas (`initiative.service.ts`)

- **Sem máquina de estados de status.** Não há tabela de transições permitidas/proibidas — `status` é sobrescrito livremente em qualquer `PATCH /initiatives/:id`, junto com qualquer outro campo do payload (spread bruto: `{ ...current, ...payload }`).
- **Histórico é append-only com dedup por `id`.** `update()` mescla `payload.history` no histórico atual, adicionando apenas entradas cujo `id` ainda não existe (`initiative.service.ts:59-73`). Não existe endpoint dedicado para "adicionar entrada de histórico" — é sempre parte do payload de update.
- **Milestones são mescladas por `id`, com suporte a remoção via `removedMilestoneIds`.** O merge usa um `Map` chaveado por id; milestones cujo id está em `payload.removedMilestoneIds` são removidas tanto do conjunto atual quanto do incoming antes do merge; resultado final ordenado por campo `order` (`initiative.service.ts:63-89`).
- **Reprioritização é um setter puro.** `PATCH /initiatives/:id/priority` chama `prioritizeInitiative()`, que apenas faz `{ ...initiative, priority: nextPriority }` — não existe reordenação automática de outras iniciativas da mesma fila (`src/domain/services/PrioritizeInitiative.ts`).
- **Toda escrita invalida o cache** com prefixo `initiatives` (`create`, `update`, `delete`, `reprioritize`).
- **Criação aceita os status numerados do domínio.** `CreateInitiativeDto.status` valida contra `INITIATIVE_STATUSES` (`src/domain/entities/Initiative.ts`) — os 11 status do fluxo (`"1- Backlog"` … `"9- Concluído"`, `Suspenso`, `Cancelado`) mais os legados `Backlog`/`In Progress`/`Done`. `priority` é opcional e vira `0` no service.
- **DTO de criação precisa declarar todo campo do formulário.** Com `whitelist: true` (D8), campo não declarado no DTO é descartado em silêncio antes do service — não gera erro, só sai vazio no banco. Ao adicionar um campo ao `CreateInitiativeModal`, ele precisa entrar no `CreateInitiativeDto` **e** no `create` dos três providers, que persistem o payload em vez de literais.
- **Área demandante nula não exige escopo.** `resolveClientTeam` só cobra `companyId`/`departmentId` quando há de fato uma área a resolver; `clientTeamId: null` (ou `originDirectorate: ''`) apenas limpa o vínculo.

## 3. Sanitização de payload (padrão repetido em vários services)

Vários `application/services/*.service.ts` aplicam um sanitizador antes de persistir — não é regra de negócio no sentido de validação, é normalização de dados vindos do formulário:

| Service | Regra |
|---|---|
| `organization.service.ts` (`sanitizeTeam`) | `parentTeamId`/`leaderId` com string vazia → `null` |
| `organization.service.ts` (`sanitizeCollaborator`) | Campos de data vazios (`squadId`, `vacationStart`, `startDate`, `endDate`, `birthday`) → `null`; normalização de `role`: `'VP'` → `'Head'`, `'Engineer/Analyst'`/`'ENGINEER/ANALYST'` → `'Engineer'` (aplicada também na leitura via `listCollaboratorsByScope`) |
| `organization.service.ts`, `company.service.ts`, `vendor.service.ts` | Se `photoUrl`/`logo`/`logoUrl` já aponta para `/api/_img/...` (URL servida pelo próprio backend), o campo é removido do payload de update — evita persistir a própria URL de leitura como se fosse um novo upload |
| `system.service.ts` (`sanitize`) | `ownerTeamId` com string vazia → `null` |

## 4. Ausências de validação conhecidas (não é bug a "descobrir" — é estado atual documentado)

Estas services são **CRUD puro, sem regra de negócio**, apesar de o domínio sugerir que poderiam ter:

- `allocation.service.ts` — sem checagem de percentual máximo por colaborador/período, sem checagem de sobreposição de datas.
- `absence.service.ts` — sem checagem de sobreposição de ausências para o mesmo colaborador, sem validação `startDate < endDate`.
- `holiday.service.ts` — sem checagem de duplicidade de data.
- `contract.service.ts` — sem lógica de expiração/renovação; `status` (default `"Ativo"` no schema) é um campo livre, não derivado de `endDate`.
- `system.service.ts` — sem cômputo de `debtScore`; campo existe no schema (`Float @default(0)`) mas é setado manualmente/via seed, não calculado pela aplicação.

Se uma dessas regras for implementada no futuro, ela deve ser documentada aqui e referenciada na spec funcional do módulo correspondente.

## 5. Cache — invalidação, não revalidação seletiva

Toda operação de escrita invalida **o prefixo inteiro** da entidade (`cache.invalidatePrefix('initiatives')`, etc.), não uma chave específica. Isso significa que uma escrita em uma iniciativa invalida todas as listagens cacheadas daquela entidade (todos os escopos), forçando refresh no próximo `getOrFetch`. Ver [architecture.md §Cache](../02-system-design/architecture.md#cache-swr) para o mecanismo completo.

## 6. Autenticação — estado atual (ver também [security.md](../02-system-design/security.md))

- `AuthService.login()` compara senha em **texto plano** (`user.password !== password`), sem hashing.
- Não há emissão de token/sessão no backend — `login()` retorna o objeto do usuário diretamente; a persistência de sessão (ex.: localStorage) é responsabilidade do frontend (`AuthContext`).
- Existe apenas um tipo de usuário (`type: 'collaborator'` fixo em `LoginResult`).

## 7. Providers de persistência — paridade obrigatória, não automática

Toda interface em `domain/repositories/` precisa de implementação em `prisma/`, `oracle/` e `inmemory/`. **Não há checagem automática de paridade** (nenhum teste de contrato compartilhado entre os três providers no momento) — a consistência depende de disciplina manual ao estender uma interface. Isso é um risco conhecido: um método adicionado só no Prisma quebra silenciosamente em runtime com `DB_PROVIDER=oracle`.

## 8. Área cliente e Unidade de Negócio — associação por FK (D11)

- A **área cliente** (entidade `ClientTeam`, rotulada "Demandante") pode pertencer a uma **Unidade de Negócio** (`BusinessUnit`) via `ClientTeam.businessUnitId` (opcional).
- `Initiative.clientTeamId` é uma FK nullable para `ClientTeam.id`; nome e Unidade de Negócio são derivados da relação e nunca duplicados na iniciativa. `originDirectorate` é mantido apenas como alias temporário de resposta para compatibilidade.
- A atribuição valida que iniciativa e `ClientTeam` pertencem aos mesmos `companyId`/`departmentId`. Nomes iguais em Unidades de Negócio diferentes são permitidos porque seletores, filtros e agrupamentos usam o ID.
- Renomear uma `ClientTeam` invalida o cache de iniciativas e o novo nome passa a ser exibido sem atualizar cada iniciativa. Excluir uma área com iniciativas vinculadas retorna conflito; primeiro é necessário reatribuir ou remover os vínculos.
- Exibição/seleção montam o rótulo `"Unidade de Negócio > Cliente"` no frontend (`web/src/modules/initiatives/clientAreaLabel.ts` + `useClientAreas.ts`) a partir de `clientTeamId`.
- Fonte: `src/application/services/client-team.service.ts`, `initiative.service.ts`; schema em `src/infrastructure/persistence/prisma/schema.prisma` (models `BusinessUnit`, `ClientTeam`, `Initiative`).

## 9. Provider de banco por ambiente (D12)

- Em `NODE_ENV=production`, a aplicação força `dbProvider = "supabase"` em `src/config/env.config.ts`, mesmo que `DB_PROVIDER` esteja definido como `oracle`.
- Fora de produção, `DB_PROVIDER` continua selecionando `oracle`, `supabase` ou `inmemory`; quando omitido, o default local é `oracle`.
- Motivo operacional: PRD deve continuar usando Supabase/PostgreSQL como fonte de verdade; Oracle é uso local/experimental.

## 10. Visões de página são endereçáveis por rota (D13)

- O menu lateral tem **cinco itens**: Dashboard, Pessoas, Produtos, Iniciativas, Tarefas. "Pessoas" (rotas `/rede/*`, mantidas por compatibilidade) unifica Organização, Colaboradores e Alocações; "Produtos" unifica Sistemas (grupo Aplicações) e Fornecedores/Contratos (grupo Serviços).
- A área administrativa (`/admin`) **não aparece no menu, nem para usuários com `isAdmin`** — é acessível apenas por URL direta, mantendo o guard `ProtectedRoute adminOnly`. É redução de exposição na UI, não controle de acesso (ver [security.md](../02-system-design/security.md)).
- Cada visão dentro de uma seção tem **rota própria** (`/rede/hierarquia`, `/produtos/servicos/contratos`, `/iniciativas/kanban`, …). A troca de visão é uma navegação, não uma mudança de estado.
- `ViewContext` mantém a API pública (`activeView` / `setActiveView`) mas passou a **derivar `activeView` do `location.pathname`**; `setActiveView` resolve a rota equivalente na seção atual e navega. Não há mais persistência de visão em `localStorage` (chaves `org_active_view`, `init_active_view`, `inv_active_view`, `organization_active_view`, `collaborators_active_view`, `oraculo_vendors_subview` e `initiative_view_mode` foram removidas).
- Consequência: link direto, botão voltar do browser e refresh preservam a visão — antes nenhum dos três funcionava.
- O id interno de visão **não é único globalmente** (`'table'` é *Tabela* em Produtos e *Lista* em Iniciativas). A resolução é sempre escopada pela seção do pathname (`findViewByPath`), nunca pelo id isolado.
- Fonte: `web/src/config/navigation.ts` (registro de seções, rotas e visões), `web/src/context/ViewContext.tsx`, `web/src/App.tsx`.

## 11. Cabeçalho em duas faixas — escopo vs. visão (D14)

- O cabeçalho pode ser dividido em **duas faixas** com responsabilidades distintas:
  - **Header principal** (`.top-header`) — escopo amplo: menu de troca de visão (`ViewMenu`), título/contagem injetados pela página e, ancorado no canto direito (`.header-right`), o seletor de gestor.
  - **Sub-header** (`.sub-header`) — específico da visão atual: identificação (ícone + rótulo da visão) à esquerda; à direita o filtro de domínio da visão (tipo/status, nas Iniciativas) e as ações — criar, buscar, configurar e excluir selecionados.
- O filtro de tipo/status das Iniciativas virou o componente `InitiativeFilterMenu` e é declarado no registro via `ViewDef.domainFilter: 'initiative'`, em vez do antigo `if (section.key === 'iniciativas')` dentro do `Header`. O botão fica em `.sub-header-lead`, ao lado da busca; seu menu abre **para a direita** do trigger (`openTo="right"` → `.header-filter-menu--right`), já que a faixa é baixa demais para um menu caindo para baixo e o botão fica perto da borda esquerda (o `--left` original, ainda suportado pelo componente, era para quando o botão ficava perto da borda direita).
- Todo botão do sub-header — do `ViewToolbar` compartilhado ou injetado por página via `subHeaderActions` — mostra o texto da função ao lado do ícone ("Filtro", "Pesquisar", "Criar", "Config", "Excluir", etc.), em vez de icon-only; o header principal não muda (trigger de visão e seletor de gestor continuam icon-only, D13).
- O título do sub-header é alinhado ao conteúdo do `ViewMenu` do header principal (9px de recuo, compensando a borda e o padding interno do trigger), para as duas faixas lerem como uma coluna só.
- O **seletor de gestor** fica no canto direito do header principal em variante *icon-only* (`compact`): só o avatar, sem nome nem chevron. O nome permanece acessível via `title`/`aria-label`, e o menu abre ancorado à direita (`align="right"`) para não estourar a borda da viewport.
- Altura: `--subheader-height: 31px` — ~30% menor que `--header-height: 44px`. Fundo `--control-surface`, um degrau abaixo do branco do header e acima do cinza da área de conteúdo; os controles internos invertem para `--bg-card` para continuarem legíveis.
- Páginas **sem `ViewDef` no registro** (hoje só o Dashboard, cuja visão não é roteada) participam da faixa 2 injetando `subHeaderContent` (esquerda), `subHeaderActions` (direita) e `subHeaderTitle` (opcional) via `ViewContext`. Quando há conteúdo injetado, `SubHeader` renderiza mesmo sem `toolbarPlacement`.
- A troca de visão tem **um único padrão visual** em todo o produto: trigger icon-only (`.view-menu-trigger--icon-only`), sem rótulo e sem chevron, com o nome em `title`/`aria-label`. O Dashboard reusa as mesmas classes, ainda que monte o menu à mão por não ter visões roteadas.

### 11.2 Pessoas — faixa 2 em todas as visões

Ordem das visões no menu: **Times, Colaboradores, Skills, Demandantes, Capacidade, Alocação**.

| Visão | Faixa 2 |
|---|---|
| Times | buscar, criar |
| Colaboradores | buscar, criar, excluir (só com ≥1 selecionado) |
| Skills | buscar, criar, excluir (só com ≥1 selecionado) |
| Demandantes | buscar + dois "criar" injetados: Unidade de Negócio (ícone de prédio) e Área Cliente (ícone de aperto de mão) |
| Capacidade | combo de recorte de tempo + adicionar feriado |
| Alocação | combo de gestor + combo de recorte de tempo + contagem de colaboradores/iniciativas |

- **Seleção múltipla** foi introduzida em Colaboradores e Skills (checkbox por linha + selecionar todos no cabeçalho da tabela). Antes só havia exclusão linha a linha, que continua existindo. A seleção é limpa ao trocar de visão — o botão de excluir sai da faixa junto, então ids marcados viraram estado invisível.
- **Demandantes** tem dois "criar", o que não cabe no `add` único do `ViewToolbar`; ambos são injetados em `subHeaderActions` e `toolbar.add` fica desligado. O botão "+ Nova unidade" que ficava no corpo da página foi removido para não duplicar a ação.
- **Capacidade** e **Alocação** perderam a barra de controles interna que ficava acima do Gantt; seus controles migraram para a faixa 2. Na Capacidade, o seletor de gestor daquela barra era código morto (a rota `/rede/capacidade` sempre monta `OrganizationPage` com `mode="collaborators"`, que o ocultava) e foi removido — quem filtra é o seletor de gestor do header.

### 11.1 Dashboard — menu de 4 visões e recorte na faixa 2

- O menu do cabeçalho do Dashboard tem **exatamente quatro opções**: Geral, Indicadores, Portfólio e Roadmap. Os submenus em cascata (Abertas/Fechadas dentro de Indicadores; lista de Áreas de Negócio dentro de Portfólio) foram removidos — junto deles, os timers de hover e o estado `isPortfolioSubmenuOpen`/`isIndicadoresSubmenuOpen`/`isClosedPeriodOpen`.
- O **recorte de cada visão** desceu para a faixa 2, sem título, como combos de texto (`HeaderSelect`) alinhados à esquerda:
  - **Indicadores** — combo Iniciativas Abertas / Iniciativas Fechadas. Com *Fechadas* selecionada, aparece ao lado o combo de período (12/6/3 meses), que antes ficava no header principal.
  - **Portfólio** — combo de Área de Negócio; os totais consolidados de *Entregues* e *Backlog / andamento* ficam à direita da mesma faixa.
  - **Roadmap** — dois combos `HeaderSelect<string>` (**De**/**Até**), com meses no formato `yyyy-MM`; default é o mês vigente até o mês seguinte. Ver detalhe em [functional-specs/01-modulo-iniciativas.md §3.4](../01-functional-specs/01-modulo-iniciativas.md).
  - **Geral** — sem recorte próprio; a faixa 2 não é renderizada.
- `DashboardView` tem cinco valores internos (`overview`, `open`, `closed`, `portfolio`, `roadmap`); "Indicadores" é a agregação de `open`/`closed` na UI, e escolher Indicadores no menu preserva o recorte corrente (ou cai em `open`).
- A divisão é **opt-in por visão**, via `toolbarPlacement` em `ViewDef` (`web/src/config/navigation.ts`): `'subheader'` move as ações de `toolbar` para a segunda faixa; ausente ou `'header'` (default) mantém o comportamento de faixa única. Visões sem `'subheader'` não renderizam a faixa — `SubHeader` retorna `null` e o layout fica idêntico ao anterior.
- Hoje usam `'subheader'` as três visões de **Iniciativas** (Lista, Kanban, Timeline) e as visões de **Pessoas** listadas em §11.2 (Times, Colaboradores, Skills, Demandantes, Capacidade, Alocação).
- As ações são renderizadas pelo componente compartilhado `ViewToolbar` (`web/src/components/layout/HeaderControls.tsx`), consumido tanto pelo `Header` quanto pelo `SubHeader` — não há duplicação da lógica de add/search/settings/delete.
- `ToolbarFlags.addLabel` permite rotular o botão de adicionar por visão (ex.: *"Criar Iniciativa"*); default `'Adicionar Novo'`.
- **Stacking context**: `.page-content` tem `z-index: 0`, o que prende qualquer overlay renderizado dentro dela **atrás** das duas faixas, por mais alto que seja o seu `z-index`. Overlays de página que precisam cobrir os cabeçalhos (como o *peek sidebar* de iniciativa) devem usar `createPortal(..., document.body)`.
- Fonte: `web/src/config/navigation.ts`, `web/src/components/layout/{SubHeader,Header,HeaderControls,MainLayout}.tsx`, `web/src/components/common/InitiativeFilterMenu.tsx`.

## 12. Peek panel de iniciativa compartilhado entre visões (D15)

- **Toda visão que lista iniciativas usa o `InitiativePeekPanel` para edição rápida em vez de linkar direto para o editor completo.** O painel (`web/src/components/initiative/InitiativePeekPanel.tsx`) foi extraído da `InitiativesPage` para um componente autocontido — estado de UI (seções abertas, edição inline, modais de exclusão de milestone/comentário), hidratação sob demanda (`fetchInitiativeById` quando milestones/comentários ainda não vieram na listagem) e persistência (`saveInitiativeWithHistory`, `web/src/modules/initiatives/services/saveInitiative.ts`) vivem dentro dele; o host só passa `initiative`/`collaborators`/`systems` e recebe `onChange`/`onClose`.
- **Hoje é consumido por**: `InitiativesPage` (Lista/Kanban/Timeline, clique no card) e `DashboardPage` (visões Portfólio e Roadmap, clique numa demanda). Antes, Portfólio/Roadmap eram só `<a target="_blank">` para `/iniciativas/:id/edit`; o link continua existindo (Ctrl/⌘/Shift/clique do meio abrem em nova aba), mas o clique simples abre o peek.
- **`saveInitiativeWithHistory`** também é usada fora do peek — pelo drag-and-drop do quadro kanban de Iniciativas (`InitiativesPage.handleColumnDrop`), que precisa do mesmo diff de histórico ao mudar status/coluna sem passar pelo peek.
- Fonte: `web/src/components/initiative/InitiativePeekPanel.tsx`, `web/src/modules/initiatives/services/saveInitiative.ts`, `web/src/components/initiative/externalLinkMeta.tsx` (metadados de link externo Azure/BMC Helix, compartilhados entre a página e o peek).

---

## Controle de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-07-22 | Agente de IA (Claude) | Adição de §12 / decisão **D15** — `InitiativePeekPanel` extraído da `InitiativesPage` para componente compartilhado; Portfólio e Roadmap do Dashboard passam a abrir o peek no clique em vez de navegar direto para o editor completo. |
| 2026-07-16 | Agente de IA (Claude) | Criação inicial, extraída de `src/application/services/*.service.ts` e `src/domain/services/PrioritizeInitiative.ts`. |
| 2026-07-17 | Agente de IA (Claude) | Adição de §8 / decisão **D11** — área cliente (`ClientTeam`) agrupada por Unidade de Negócio (`BusinessUnit`); iniciativa associa-se por nome (`originDirectorate`), unidade derivada. |
| 2026-07-18 | Agente de IA (Codex) | Adição de §9 / decisão **D12** — produção força Supabase; Oracle fica restrito a uso local/não produtivo. |
| 2026-07-19 | Agente de IA (Codex) | Revisão da decisão **D11**: substituição da associação por nome pela FK nullable `Initiative.clientTeamId`, com renome derivado e exclusão restrita. |
| 2026-07-20 | Agente de IA (Claude) | Adição de §10 / decisão **D13** — menu simplificado para 5 itens e visões endereçáveis por rota; `ViewContext` deriva `activeView` da URL. |
| 2026-07-20 | Agente de IA (Claude) | Adição de §11 / decisão **D14** — cabeçalho em duas faixas (escopo vs. visão), opt-in por `toolbarPlacement`; ações das Iniciativas movidas para o sub-header. |
| 2026-07-20 | Agente de IA (Claude) | Renomes de UI: item de menu "Rede" → **Pessoas** e visão "Hierarquia" → **Times**. Só rótulos — as rotas seguem em `/rede/*` e `/rede/hierarquia` para não quebrar links já compartilhados. |
| 2026-07-21 | Agente de IA (Claude) | §2 — correção da criação de iniciativas: `CreateInitiativeDto` alinhado ao formulário e aos status numerados, `priority` opcional, área demandante nula sem exigência de escopo, `create` dos três providers persistindo o payload. |
| 2026-07-20 | Agente de IA (Claude) | Adição de §11.2 — faixa 2 em todas as visões de Pessoas; nova seleção múltipla em Colaboradores e Skills; controles internos do Gantt de Capacidade e Alocação migrados para o sub-header; reordenação das visões. |
| 2026-07-20 | Agente de IA (Claude) | Adição de §11.1 — menu do Dashboard reduzido a 3 visões (Geral, Indicadores, Portfólio), com submenus em cascata substituídos por combos `HeaderSelect` na faixa 2; `ViewMenu` icon-only nas visões com sub-header. |
| 2026-07-20 | Agente de IA (Claude) | Revisão de §11: todo botão do sub-header (Iniciativas e Pessoas, não só Iniciativas) passa a mostrar o texto da função ao lado do ícone; `InitiativeFilterMenu` migra para `.sub-header-lead` (ao lado da busca) e seu menu passa a abrir para a direita em vez de esquerda. |
| 2026-07-20 | Agente de IA (Claude) | Revisão de §11.1: menu do Dashboard passa de 3 para 4 visões com a nova **Roadmap** (cronograma mensal por tipo de demanda, combos De/Até na faixa 2); `DashboardView` ganha o valor `roadmap`. Detalhe funcional em [functional-specs/01-modulo-iniciativas.md §3.4](../01-functional-specs/01-modulo-iniciativas.md). |
