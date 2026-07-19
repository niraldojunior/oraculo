# Modelo de Dados

Fonte de verdade: `src/infrastructure/persistence/prisma/schema.prisma` (provider `postgresql`, datasource Supabase). O provider Oracle replica o mesmo modelo lógico via DDL próprio (`npm run oracle:schema`), sem gerar-se automaticamente a partir do Prisma.

## 1. ERD (visão lógica)

```
Company
  ├── Department (1:N, masterUserId → Collaborator)
  │     ├── Team (1:N, parentTeamId hierárquico, leaderId → Collaborator)
  │     ├── Collaborator (1:N)
  │     │     ├── CollaboratorSkill (N:N com Skill)
  │     │     ├── Absence (1:N)
  │     │     └── Contract (1:N via leaderId, relação "ContractLeader")
  │     ├── Skill (1:N)
  │     ├── BusinessUnit (1:N) ── Unidade de Negócio
  │     │     └── ClientTeam (1:N, businessUnitId? opcional) ── área cliente / demandante
  │     │           └── Initiative (1:N via clientTeamId?, exclusão restrita)
  │     ├── System (1:N, ownerTeamId → Team)
  │     ├── Vendor (1:N, directorId/managerId → Collaborator)
  │     ├── Contract (1:N, vendorId → Vendor, systemId? → System)
  │     ├── Initiative (1:N)
  │     │     ├── InitiativeMilestone (1:N, systemId → System)
  │     │     │     └── MilestoneTask (1:N)
  │     │     ├── InitiativeHistory (1:N)
  │     │     └── InitiativeComment (1:N)
  │     └── Allocation (1:N, collaboratorId → Collaborator, initiativeId → Initiative, systemId? → System)
  └── Holiday (companyId opcional — feriado nacional se nulo)
```

## 2. Convenções observadas no schema

- **IDs**: `String @id @default(uuid())` (UUID v4) em todos os models.
- **Escopo**: quase todo model tem `companyId` (+ a maioria também `departmentId`), com índice composto `@@index([companyId, departmentId])`.
- **Datas como String**: campos de data de negócio (`startDate`, `endDate`, `baselineDate`, `vacationStart`, `birthday` etc.) são **`String`** no formato `YYYY-MM-DD` (ou `MM-DD` para `birthday`), não `DateTime`. Só timestamps de sistema (`createdAt`, `updatedAt`, `InitiativeHistory.timestamp`, `InitiativeComment.timestamp`) usam `DateTime`.
- **Arrays nativos do Postgres**: `String[]` usado para `impactedSystemIds`, `memberIds`, `macroScope`, `associatedCompanyIds`, `systemIds` (task) — sem tabela de junção, aproveitando o tipo array do Postgres (não portável 1:1 para Oracle, que não tem array nativo — ver nota abaixo).
- **`Json` livre**: `System.environments`/`contextFiles`/`technicalSkills`/`responsibleCollaborators`, `MilestoneTask.taskHistory` — sem schema tipado, estrutura definida pelo consumidor (frontend/DTO).
- **Cascade delete parcial**: `Absence`, `MilestoneTask`, `InitiativeComment` têm `onDelete: Cascade` a partir do pai imediato (`Collaborator`, `InitiativeMilestone`, `Initiative`, respectivamente). A maioria das outras relações **não** tem cascade explícito — deletar um `Company`/`Department` com filhos pode falhar por FK ou deixar órfãos, dependendo do provider.

## 3. Nota sobre portabilidade Prisma → Oracle

Dois pontos exigem atenção manual ao manter os dois schemas em paridade:

1. **Arrays nativos** (`String[]`) não existem em Oracle da mesma forma — a implementação Oracle precisa de uma estratégia equivalente (coluna serializada, tabela associativa, ou tipo `VARRAY`/`JSON`). Verifique `OracleInitiativeRepository.ts` para ver a estratégia adotada antes de assumir paridade de comportamento.
2. **`Json`** também não é um tipo nativo idêntico em Oracle — normalmente mapeado para `CLOB`/`JSON` do Oracle 21c+, com serialização manual no repositório (`fetchAsString = [CLOB]`, ver [architecture.md](architecture.md)).

## 4. Models — referência rápida

| Model | Campos-chave além de `id`/escopo | Relações |
|---|---|---|
| `Company` | `fantasyName`, `realName`, `logo`, `description` | raiz de tudo |
| `Department` | `name`, `masterUserId?` | pertence a `Company` |
| `Collaborator` | `email` (unique), `role`, `squadId` (→ `teamId`), `isAdmin`, `password` (texto plano — ver [security.md](security.md)), `associatedCompanyIds[]` | `CollaboratorSkill`, `Absence`, `Contract` (líder) |
| `Absence` | `startDate`, `endDate`, `type`, `reason?` | `Collaborator` (cascade) |
| `Holiday` | `date`, `name`, `companyId?` | — |
| `Skill` | `name`, `description`, `familia?`, `icon?` | `CollaboratorSkill` |
| `CollaboratorSkill` | chave composta `(collaboratorId, skillId)` | N:N |
| `BusinessUnit` | `name` (Unidade de Negócio) | `ClientTeam` (1:N) |
| `ClientTeam` | `name` (área cliente / demandante), `businessUnitId?` | `BusinessUnit?`, `Initiative[]` via `Initiative.clientTeamId` (`ON DELETE RESTRICT`) |
| `Team` | `type`, `parentTeamId?`, `leaderId?`, `receivesInitiatives` | hierarquia própria |
| `System` | `criticality`, `lifecycleStatus`, `debtScore` (não calculado), `ownerTeamId?` | `Contract` |
| `Vendor` | `companyName`, `taxId`, `type`, `directorId?`, `managerId?` | `Contract` |
| `Contract` | `number`, `startDate`, `endDate`, `model`, `annualCost`, `status` (default `"Ativo"`) | `Vendor`, `System?`, `Collaborator?` (líder) |
| `Initiative` | `title`, `type`, `status`, `previousStatus?`, `priority: Int`, `clientTeamId?`, `impactedSystemIds[]`, `memberIds[]` | `ClientTeam?`, `Milestone`, `History`, `Comment` |
| `InitiativeMilestone` | `name`, `systemId`, `baselineDate`, `realDate?`, `order?` | `Initiative`, `MilestoneTask` |
| `MilestoneTask` | `status` (default `"Backlog"`), `type?`, `priority?` (0–4), `taskHistory: Json?`, `order` | `InitiativeMilestone` (cascade) |
| `InitiativeHistory` | `user`, `action`, `fromStatus?`, `toStatus?`, `notes?` | `Initiative` |
| `InitiativeComment` | `content`, `userId`, `userName` | `Initiative` (cascade) |
| `Allocation` | `collaboratorId`, `initiativeId`, `systemId?`, `percentage: Int`, `startDate`, `endDate` | — |

## 5. Referências

- Regras de negócio por entidade: [business-rules.md](../00-visao-geral/business-rules.md)
- Specs funcionais por módulo: [01-functional-specs/](../01-functional-specs/)

---

## Controle de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-07-16 | Agente de IA (Claude) | Criação inicial, derivada de `schema.prisma`. |
| 2026-07-17 | Agente de IA (Claude) | Adição dos models `BusinessUnit` e `ClientTeam` (área cliente agrupada por Unidade de Negócio). |
| 2026-07-19 | Agente de IA (Codex) | Adição da FK nullable `Initiative.clientTeamId`, índice e restrição de exclusão da `ClientTeam`. |
