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
  ├── originDirectorate: String        (nome da área cliente / demandante — ver §3.1)
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

- O campo **`originDirectorate`** guarda o **nome** da área cliente (`ClientTeam`) que demanda a iniciativa — é uma **string livre, não FK**. A associação por nome preserva iniciativas legadas e evita migração de dados.
- Na UI, ao **exibir ou selecionar** a área cliente, o frontend monta o rótulo `"Unidade de Negócio > Cliente"` (ex.: `Atacado & B2B > Operações`), derivando a Unidade através da `ClientTeam` de mesmo nome. Helpers: `web/src/modules/initiatives/clientAreaLabel.ts` (`formatClientArea`) e `useClientAreas.ts`. Seletores afetados: `CreateInitiativeModal`, `InitiativeEditor`/`SidebarComponents`, `InitiativesPage` (colunas/filtro "Demandante").
- **Fallback**: se `originDirectorate` não casar com nenhuma `ClientTeam` (dado legado) ou a área não tiver Unidade, exibe-se apenas o nome cru. Ver decisão **D11** em [business-rules.md §8](../00-visao-geral/business-rules.md) e o módulo de Organização em [02-modulo-organizacao.md](02-modulo-organizacao.md).

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
