# Módulo 1 — Iniciativas

> Status: **Produção**. Entidades: `Initiative`, `InitiativeMilestone`, `MilestoneTask`, `InitiativeHistory`, `InitiativeComment`.

## 1. Propósito do módulo

Gerenciar o ciclo de vida de uma demanda/projeto de TI: do pedido (`requestDate`) à entrega, passando por planejamento em milestones e tarefas, com trilha de auditoria de status e espaço para discussão (comentários). É a entidade mais rica do domínio e o principal objeto de trabalho diário de líderes de iniciativa.

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

- No cabeçalho do `DashboardPage`, **Portfólio** é uma opção hierárquica: o submenu lista as `BusinessUnit` cadastradas no escopo atual através de `useClientAreas`.
- Após selecionar uma `BusinessUnit`, a visão cria uma coluna para cada `ClientTeam` vinculada por `businessUnitId`. As iniciativas entram na coluna quando `Initiative.clientTeamId` é igual ao ID da área, sem ambiguidade entre nomes iguais.
- Cada coluna separa **Entregues** (`status === "9- Concluído"`) de **Backlog / andamento** (status de `"1- Backlog"` até `"8- Implantação"`). Iniciativas suspensas ou canceladas não entram em nenhum desses dois totais.
- O cabeçalho global exibe o nome da `BusinessUnit` selecionada e os totais de **Entregues** e **Backlog / andamento**; a área de conteúdo começa diretamente pelas colunas de `ClientTeam`, sem repetir título ou resumo.
- O filtro de líder do dashboard continua sendo aplicado antes do agrupamento. A `BusinessUnit` selecionada é persistida em `localStorage` (`dashboard_portfolio_business_unit_id`).
- Esta é uma regra de apresentação implementada em `web/src/modules/dashboard/pages/DashboardPage.tsx`; não altera schema, DTOs ou endpoints.

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
| 2026-07-16 | Agente de IA (Claude) | Criação inicial. |
| 2026-07-17 | Agente de IA (Claude) | Documentação de `originDirectorate` como área cliente (nome) e exibição "Unidade de Negócio > Cliente" (§3.1, D11). |
| 2026-07-18 | Codex | Inclusão da visão de Portfólio no dashboard, agrupada por `BusinessUnit` e `ClientTeam`, com separação entre entregues e backlog/andamento (§3.2). |
| 2026-07-19 | Codex | Consolidação do título e dos totais do Portfólio no cabeçalho global, removendo o resumo duplicado da área de conteúdo. |
| 2026-07-19 | Codex | Migração da área demandante para `Initiative.clientTeamId`, reconciliação de legados, alias de resposta e agrupamentos por ID. |
