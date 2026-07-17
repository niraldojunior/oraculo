# Glossário

Termos e siglas usados no domínio do Oraculo. Nomes de entidade/campo estão em inglês (como no código); a definição é em português.

| Termo | Definição |
|---|---|
| **Initiative (Iniciativa)** | Projeto ou demanda de TI, do pedido (`requestDate`) até a entrega. Entidade central do sistema. |
| **Milestone** | Marco dentro de uma iniciativa, associado a um `System`, com data-base (`baselineDate`) e data real (`realDate`). Contém tarefas. |
| **MilestoneTask (Task)** | Unidade de trabalho dentro de um milestone. Status: `Backlog`, `In Progress`, `Done`. Tipo: `Feature`, `Melhoria`, `Bug`, `Debito Técnico`, `Enabler`. |
| **InitiativeHistory** | Trilha de auditoria de mudanças de status de uma iniciativa (quem, quando, de/para qual status, notas). |
| **InitiativeComment** | Comentário livre associado a uma iniciativa. |
| **priority** | Inteiro que posiciona a iniciativa numa fila de prioridade dentro do escopo (departamento). Setado manualmente via `PATCH /initiatives/:id/priority` — não há algoritmo de cálculo automático. |
| **Company** | Empresa — nível mais alto de escopo/particionamento de dados. |
| **Department** | Departamento dentro de uma empresa — unidade operacional de escopo (a maioria das listagens filtra por `companyId` + `departmentId`). |
| **Team (Squad)** | Time dentro de um departamento. Pode ter hierarquia (`parentTeamId`) e líder (`leaderId`). Campo `receivesInitiatives` indica se o time é elegível a receber iniciativas atribuídas. |
| **Collaborator** | Pessoa vinculada a uma empresa/departamento. É também o único tipo de usuário autenticável do sistema. Campo `isAdmin` dá acesso à área `/admin`. |
| **Skill** | Competência técnica, associada a colaboradores via `CollaboratorSkill` (N:N). |
| **Absence** | Período de ausência de um colaborador (férias, folga, licença médica etc.), com `startDate`/`endDate`/`type`. |
| **System** | Sistema/aplicação do inventário de TI. Campos: `criticality`, `lifecycleStatus`, `debtScore` (dívida técnica, hoje não calculada automaticamente), `ownerTeamId`. |
| **Vendor** | Fornecedor externo. Pode ter contratos vinculados a sistemas. |
| **Contract** | Contrato com um `Vendor`, opcionalmente vinculado a um `System`, com custo anual (`annualCost`) e status (default `"Ativo"`). |
| **Allocation** | Alocação de um `Collaborator` a uma `Initiative`/`System` por um percentual (`percentage`) e período (`startDate`/`endDate`). |
| **Holiday** | Feriado — nacional (sem `companyId`) ou corporativo (com `companyId`). |
| **DB_PROVIDER** | Variável de ambiente que seleciona o backend de persistência ativo: `supabase` (Prisma/PostgreSQL, produção), `oracle` (experimental), `inmemory` (dev/teste sem banco). |
| **SWR (Stale-While-Revalidate)** | Estratégia de cache: serve o valor cacheado imediatamente (mesmo expirado quanto a "stale", mas dentro do TTL), disparando um refresh em background. Implementação própria em `src/infrastructure/cache/cache.service.ts`. |
| **traceId / spanId** | Identificadores de rastreamento distribuído (OpenTelemetry), propagados em toda resposta de erro e em todo log estruturado. |
| **_img** | Prefixo de rota (`/api/_img/...`) que serve imagens binárias armazenadas (foto de colaborador, logo de empresa/fornecedor, ícone de skill). |

---

## Controle de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-07-16 | Agente de IA (Claude) | Criação inicial. |
