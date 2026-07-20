# Módulo 1 — Iniciativas

> Status: **Produção**. Entidades: `Initiative`, `InitiativeMilestone`, `MilestoneTask`, `InitiativeHistory`, `InitiativeComment`.

## 1. Propósito do módulo

Gerenciar o ciclo de vida de uma demanda/projeto de TI: do pedido (`requestDate`) à entrega, passando por planejamento em milestones e tarefas, com trilha de auditoria de status e espaço para discussão (comentários). É a entidade mais rica do domínio e o principal objeto de trabalho diário de líderes de iniciativa.

**Telas:** `/iniciativas/lista`, `/iniciativas/kanban` e `/iniciativas/timeline` (`InitiativesPage`, visão vinda da rota — D13; a Timeline é ocultada no mobile), mais o editor em `/iniciativas/:id/edit` (`InitiativeEditPage`). Ver [business-rules.md §10](../00-visao-geral/business-rules.md).

## 2. Entidades e relacionamentos

```
Initiative
  ├── companyId, departmentId          (escopo)
  ├── leaderId, technicalLeadId        (Collaborator)
  ├── impactedSystemIds[]              (System)
  ├── executingTeamId                  (Team)
  ├── memberIds[]                      (Collaborator)
  ├── clientTeamId: String?            (FK para área cliente / demandante — ver §3.1)
  ├── priority: Int                    (fila manual)
  ├── status, previousStatus: String   (sem enum/state machine)
  ├── InitiativeMilestone[]
  │     └── MilestoneTask[]
  ├── InitiativeHistory[]
  └── InitiativeComment[]
```

Ver schema completo em `src/infrastructure/persistence/prisma/schema.prisma` (models `Initiative`, `InitiativeMilestone`, `MilestoneTask`, `InitiativeHistory`, `InitiativeComment`).

## 3. Regras de negócio

Extraídas de `src/application/services/initiative.service.ts` e `src/domain/services/PrioritizeInitiative.ts` — ver detalhamento em [business-rules.md §2](../00-visao-geral/business-rules.md#2-iniciativas-initiativeservicets).

- Sem máquina de estados: `status` é sobrescrito livremente em qualquer update.
- Histórico é append-only, deduplicado por `id` do evento.
- Milestones são mescladas por `id`; remoção explícita via `removedMilestoneIds` no payload; resultado ordenado por `order`.
- `priority` é um setter puro (`PATCH /initiatives/:id/priority`) — não há renumeração automática de outras iniciativas da fila.
- Toda leitura passa por cache SWR (`initiatives:list:*`, `initiatives:id:*`); toda escrita invalida o prefixo `initiatives`.
- `getById`/`reprioritize` retornam 404 (`NotFoundException`) se o id não existir.

### 3.1 Área cliente (demandante) e Unidade de Negócio

- O campo **`clientTeamId`** é uma FK nullable para a `ClientTeam` demandante. A API retorna também `clientTeam` e o alias temporário `originDirectorate`, sempre derivado do nome atual da relação.
- A atribuição por ID exige o mesmo `companyId`/`departmentId`; `null` representa "Sem demandante". Durante o rollout, o backend aceita o nome legado somente quando ele identifica uma única área no escopo.
- Na UI, seletores, filtros, drag-and-drop e agrupamentos usam o ID. O rótulo `"Unidade de Negócio > Cliente"` continua sendo montado por `clientAreaLabel.ts`/`useClientAreas.ts`.
- Renomear a `ClientTeam` reflete automaticamente nas iniciativas. Excluir uma área em uso é bloqueado até que seus vínculos sejam removidos ou reatribuídos. Ver decisão **D11** em [business-rules.md §8](../00-visao-geral/business-rules.md).

### 3.2 Visão de Portfólio no dashboard

- No cabeçalho do `DashboardPage`, **Portfólio** é uma das quatro opções do menu de visões (Geral, Indicadores, Portfólio, Roadmap — ver §3.4). A escolha da `BusinessUnit` fica num combo (`HeaderSelect`) no canto esquerdo do sub-header, alimentado pelas `BusinessUnit` do escopo atual via `useClientAreas`.
- Após selecionar uma `BusinessUnit`, a visão cria uma coluna para cada `ClientTeam` vinculada por `businessUnitId`. As iniciativas entram na coluna quando `Initiative.clientTeamId` é igual ao ID da área, sem ambiguidade entre nomes iguais.
- Cada coluna separa **Entregues** (`status === "9- Concluído"`) de **Backlog / andamento** (status de `"1- Backlog"` até `"8- Implantação"`). Iniciativas suspensas ou canceladas não entram em nenhum desses dois totais.
- A **segunda faixa** (`.sub-header`, D14) concentra o recorte da visão: à esquerda o combo de `BusinessUnit`, à direita os totais de **Entregues** e **Backlog / andamento** (injetados via `subHeaderContent`/`subHeaderActions` do `ViewContext`). A faixa 1 fica com o título "Portfólio" e o seletor de gestor; a área de conteúdo começa diretamente pelas colunas de `ClientTeam`, sem repetir título ou resumo.
- O filtro de líder do dashboard continua sendo aplicado antes do agrupamento. A `BusinessUnit` selecionada é persistida em `localStorage` (`dashboard_portfolio_business_unit_id`).
- Cada iniciativa listada nas colunas é um link (`<a target="_blank">`) para `/iniciativas/:id/edit`, abrindo a edição em nova aba; o link reaproveita a tipografia/cor do texto original (classe `.portfolio-initiative-link` em `web/src/index.css`, sem sublinhado nem mudança de cor).
- Esta é uma regra de apresentação implementada em `web/src/modules/dashboard/pages/DashboardPage.tsx`; não altera schema, DTOs ou endpoints.

### 3.3 Cabeçalho em duas faixas (D14)

- As três visões de Iniciativas (Lista, Kanban, Timeline) usam o **cabeçalho em duas faixas** — são as únicas do sistema com `toolbarPlacement: 'subheader'` em `web/src/config/navigation.ts`.
- Faixa 1 (`.top-header`) — escopo amplo: `ViewMenu` para trocar de visão, o título com a contagem de iniciativas visíveis injetado pela `InitiativesPage` e, ancorado no canto direito (`.header-right`), o seletor de gestor em variante *icon-only*.
- Faixa 2 (`.sub-header`) — específica da visão: ícone + rótulo da visão à esquerda (alinhado ao conteúdo do `ViewMenu` da faixa 1); à direita o **filtro de tipo/status** (`InitiativeFilterMenu`), **Criar Iniciativa**, **Buscar**, **Configurações** e **Excluir selecionados** (este último só aparece com `selectedCount > 0`).
- O filtro de tipo/status mantém a convenção de estado "lista vazia = todos selecionados": o primeiro clique num item **exclui** aquele item em vez de selecionar só ele.
- Trocar de visão dentro da seção mantém as duas faixas; o conteúdo da faixa 2 muda apenas de rótulo, já que as três visões compartilham as mesmas ações.
- O painel de espiada rápida (`.peek-sidebar-container`) é renderizado via `createPortal` no `body`: `.page-content` tem `z-index: 0`, criando um stacking context que o prendia atrás das duas faixas.
- Regra de apresentação implementada em `web/src/components/layout/SubHeader.tsx` + `HeaderControls.tsx`; não altera schema, DTOs ou endpoints. Ver decisão **D14** em [business-rules.md §11](../00-visao-geral/business-rules.md).

### 3.4 Visão de Roadmap no dashboard

- **Roadmap** é a quarta opção do menu de visões do `DashboardPage` (ícone `Map`). A faixa 2 traz dois combos (`HeaderSelect<string>`), **De** e **Até**, cada um listando meses no formato `yyyy-MM` (rótulo `"Mês/aa"`) — por padrão **De** abre no mês vigente e **Até** no mês seguinte; ambos ficam persistidos em `localStorage` (`dashboard_roadmap_start_month`/`dashboard_roadmap_end_month`).
- O conteúdo é um quadro com **uma coluna por mês** dentro do intervalo `[De, Até]` (inclusive, min/max se o usuário inverter a seleção), mais uma coluna final **"Sem Data"** para iniciativas do escopo sem data planejada nem real.
- Cada coluna tem três seções fixas, por `Initiative.type` — **Estruturantes** (`"1- Estratégico"`, vermelho, ícone `Diamond`), **Projetos** (`"2- Projeto"`, azul, ícone `Briefcase`) e **Fast Tracks** (`"3- Fast Track"`, verde, ícone `Zap`), mesmas cores/ícones usados em `getTypeIcon`/`TYPE_TICK_META` no resto do dashboard; iniciativas do tipo `"4- PBI"` não entram no Roadmap. Iniciativas com `status === "Suspenso"` ou `"Cancelado"` também ficam de fora de todas as colunas (`ROADMAP_HIDDEN_STATUSES`); apenas `"9- Concluído"` continua aparecendo, com o marcador de check.
- A iniciativa cai no mês da sua **data efetiva** = `actualEndDate` se preenchida, senão `endDate` (planejada) — mesma regra de "data real prevalece sobre planejada" usada no restante do dashboard (`isOnTime`, cycle time). Dentro de cada seção, a lista é ordenada por essa data em ordem crescente.
- Cada linha mostra a data efetiva (`dd/MM.`) e o título (link para `/iniciativas/:id/edit` em nova aba, mesmo padrão do Portfólio em §3.2). Quando duas ou mais linhas seguidas de uma mesma seção têm a mesma data efetiva, só a primeira exibe o texto da data — as seguintes mantêm o mesmo texto oculto por `visibility: hidden` (`.roadmap-item-date--repeated`) só para preservar a largura e manter o início do título alinhado.
- Os sistemas relacionados (`Initiative.impactedSystemIds`, resolvidos via `System.acronym`/`name`) não aparecem mais como badges ao lado do título — por serem muitos, poluíam a linha. Eles viram um **hint**: o atributo `title` do link concatena o título da iniciativa com `"Sistemas: <lista separada por vírgula>"`, exibido pelo navegador ao passar o mouse.
- Iniciativas com `status === "9- Concluído"` recebem um ícone de check e o título fica em cinza escuro/negrito (`.roadmap-item-title--concluded`); iniciativas fora de status terminal (`"9- Concluído"`, `"Suspenso"`, `"Cancelado"`) cuja data efetiva já passou recebem um ícone de alerta com animação de piscar (`.overdue-alert-icon`) e o título em vermelho (`.roadmap-item-title--overdue`) — os dois grupos são mutuamente exclusivos, já que `isRoadmapOverdue` já exclui status terminal.
- O filtro de líder do dashboard (hierarquia de gestor) é aplicado antes do agrupamento, igual às demais visões.
- Esta é uma regra de apresentação implementada em `web/src/modules/dashboard/pages/DashboardPage.tsx` (componente `RoadmapView`); não altera schema, DTOs ou endpoints.

## 4. Endpoints

| Método | Rota | DTO / Body | Descrição |
|---|---|---|---|
| GET | `/initiatives`, `/api/initiatives` | Query: `companyId?`, `departmentId?` | Lista iniciativas por escopo (cacheado) |
| GET | `/initiatives/:id` | — | Detalhe de uma iniciativa (cacheado) |
| GET | `/initiatives/:id/history` | — | Retorna apenas o array `history` |
| POST | `/initiatives` | `CreateInitiativeDto` | Cria iniciativa |
| PATCH | `/initiatives/:id` | Payload livre (`Record<string, unknown>`) | Atualiza — merge de `history`/`milestones`, spread do restante |
| PATCH | `/initiatives/:id/priority` | `{ priority: number }` | Reprioriza |
| DELETE | `/initiatives/:id` | — | Remove iniciativa (hard delete) |

## 5. Fluxo ilustrativo — criação até entrega

```
1. Líder cria iniciativa (POST /initiatives) — status inicial, escopo, leaderId, impactedSystemIds.
2. Editor de iniciativa (web: InitiativeEditPage) adiciona milestones vinculados a Systems.
3. Cada milestone recebe MilestoneTask (Backlog → In Progress → Done), visíveis no board (/tarefas).
4. Mudança de status da iniciativa é registrada manualmente como entrada em `history` no payload do PATCH.
5. Colaboradores comentam via InitiativeComment.
6. Líder ajusta `priority` da fila do departamento via PATCH /initiatives/:id/priority.
```

## 6. Contratos com outros módulos

| Módulo | Tipo de consumo | Detalhe |
|---|---|---|
| Inventário | Referência | `Initiative.impactedSystemIds[]` e `InitiativeMilestone.systemId`/`MilestoneTask.systemIds[]` apontam para `System` |
| Organização | Referência | `leaderId`, `technicalLeadId`, `memberIds[]`, `assignedEngineerId` (milestone), `assigneeId` (task) apontam para `Collaborator`; `executingTeamId` aponta para `Team` |
| Alocações | Referência indireta | `Allocation.initiativeId` referencia `Initiative`, mas não há validação cruzada no `initiative.service.ts` |
| Azure DevOps | Integração externa | `AzureWorkItemsTab.tsx` (frontend) consome `GET /api/azure/workitems` para trazer work items espelhados — não há vínculo persistido entre `Initiative` e work item do Azure no schema |

## 7. Questões em aberto / dívida técnica conhecida

- **Sem validação de transição de status** — qualquer status pode ir para qualquer status. Se isso for um requisito de negócio, precisa ser implementado (ver [open-questions.md](../04-delivery-plan/open-questions.md)).
- **`priority` sem algoritmo** — hoje é puramente manual; não há critério objetivo (ex.: benefício × esforço) calculado pelo sistema.
- **Módulo Topology** (`web/src/modules/topology/`) sugere uma visão de dependências entre iniciativas/sistemas, mas não está roteado em `App.tsx` nem documentado — status real desconhecido.

---

## Controle de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-07-20 | Agente de IA (Claude) | §3.2/§3.3 — cabeçalho em duas faixas (D14): ações e filtro das Iniciativas no sub-header; no Portfólio do dashboard, combo de `BusinessUnit` à esquerda e totais consolidados à direita da faixa 2. |
| 2026-07-16 | Agente de IA (Claude) | Criação inicial. |
| 2026-07-17 | Agente de IA (Claude) | Documentação de `originDirectorate` como área cliente (nome) e exibição "Unidade de Negócio > Cliente" (§3.1, D11). |
| 2026-07-18 | Codex | Inclusão da visão de Portfólio no dashboard, agrupada por `BusinessUnit` e `ClientTeam`, com separação entre entregues e backlog/andamento (§3.2). |
| 2026-07-19 | Codex | Consolidação do título e dos totais do Portfólio no cabeçalho global, removendo o resumo duplicado da área de conteúdo. |
| 2026-07-19 | Codex | Migração da área demandante para `Initiative.clientTeamId`, reconciliação de legados, alias de resposta e agrupamentos por ID. |
| 2026-07-19 | Agente de IA (Claude) | Iniciativas listadas no Portfólio do dashboard viram link para edição em nova aba, sem alterar a tipografia (§3.2). |
| 2026-07-20 | Agente de IA (Claude) | §1: visões passam a ter rota própria (`/iniciativas/lista\|kanban\|timeline`); retorno do editor usa `returnPath` em vez de `restoreView` (D13). |
| 2026-07-20 | Agente de IA (Claude) | Novo §3.3 — cabeçalho em duas faixas (D14): ações e filtro de tipo/status movidos para o sub-header, seletor de gestor icon-only à direita da faixa 1, peek sidebar via `createPortal`. |
| 2026-07-20 | Agente de IA (Claude) | Novo §3.4 — visão de Roadmap no dashboard (4ª opção do menu): coluna por mês + "Sem Data", seções por tipo de demanda, badges de sistema com overflow `+N`, marcador de concluída e alerta piscante de atraso. |
| 2026-07-20 | Agente de IA (Claude) | §3.4 — Roadmap passa a ocultar iniciativas com `status` `"Suspenso"` ou `"Cancelado"` em todas as colunas. |
| 2026-07-20 | Agente de IA (Claude) | §3.4 — cabeçalho de cada seção do Roadmap ganha o ícone do tipo de demanda (`Diamond`/`Briefcase`/`Zap`) ao lado do rótulo, na mesma cor do texto. |
| 2026-07-20 | Agente de IA (Claude) | §3.4 — datas repetidas em sequência dentro de uma seção do Roadmap só aparecem na primeira linha; as demais ocultam o texto por `visibility` mantendo o título alinhado. |
