# Módulo 2 — Organização

> Status: **Produção**. Entidades: `Company`, `Department`, `Team`, `Collaborator`, `Skill`, `CollaboratorSkill`, `Absence`, `Holiday`, `BusinessUnit`, `ClientTeam`.

## 1. Propósito do módulo

Modelar a estrutura organizacional que serve de eixo de escopo para todo o sistema (§3 do [AGENTS.md](../../AGENTS.md)), além de gerenciar pessoas, competências (skills), ausências e as **áreas cliente** (demandantes) agrupadas por **Unidade de Negócio**.

## 2. Entidades e relacionamentos

```
Company
  └── Department (masterUserId → Collaborator responsável)
        ├── Team (parentTeamId hierárquico, leaderId, receivesInitiatives)
        ├── Collaborator ── CollaboratorSkill ── Skill
        │     └── Absence
        ├── Skill
        └── BusinessUnit (Unidade de Negócio)
              └── ClientTeam (área cliente / demandante, businessUnitId opcional)
```

`Collaborator.associatedCompanyIds[]` permite que um colaborador seja visível/associável em empresas além da sua principal (`companyId`). `Collaborator.squadId` (mapeado para coluna `teamId` no schema) vincula o colaborador a um `Team`.

### Área cliente e Unidade de Negócio

- **`ClientTeam`** (`{ id, name, companyId, departmentId, businessUnitId? }`) é a **área cliente** — também rotulada como "Demandante" na UI. Representa quem solicita/patrocina uma iniciativa. Antes vivia apenas em `localStorage`; hoje é entidade de backend (Prisma/Oracle/inmemory).
- **`BusinessUnit`** (`{ id, name, companyId, departmentId }`) é a **Unidade de Negócio** que agrupa áreas cliente (ex.: `Atacado & B2B > Operações`). O vínculo é opcional: uma `ClientTeam` pode não ter Unidade (`businessUnitId = null`).
- Uma iniciativa referencia a área por `Initiative.clientTeamId` (FK nullable). Nome e Unidade de Negócio são derivados da `ClientTeam`; o frontend usa o ID e monta o rótulo `"Unidade de Negócio > Cliente"` via `clientAreaLabel.ts`.

## 3. Regras de negócio

Fonte: `src/application/services/organization.service.ts`, `company.service.ts`, `department.service.ts`, `skill.service.ts`, `absence.service.ts`, `holiday.service.ts`, `business-unit.service.ts`, `client-team.service.ts`.

- **Sanitização de `Team`**: `parentTeamId`/`leaderId` com string vazia viram `null`.
- **Sanitização de `Collaborator`**: campos de data vazios (`squadId`, `vacationStart`, `startDate`, `endDate`, `birthday`) viram `null`; normalização de `role` (`'VP'` → `'Head'`; `'Engineer/Analyst'`/`'ENGINEER/ANALYST'` → `'Engineer'`), reaplicada também na leitura de listagem.
- **`photoUrl`/`logo` self-referencing**: se o valor já é uma URL servida pelo próprio backend (`/api/_img/...`), o campo é removido do payload de update para não persistir a própria URL de leitura.
- **Toggle de skill**: `POST /collaborators/skills/toggle` ativa/desativa a relação `CollaboratorSkill` (N:N) para um colaborador.
- **Sem validação de sobreposição em `Absence`** — múltiplas ausências do mesmo colaborador podem ter datas conflitantes sem erro.
- **`Department` com atualização em duas camadas**: `PATCH /departments/:id/basic` atualiza campos básicos; criação/update completos passam por lógica de atribuição de `masterUserId` na camada de repositório.
- **`BusinessUnit` é CRUD simples por escopo**. `ClientTeamService` também invalida o cache de iniciativas, impede mudança de `companyId`/`departmentId` e bloqueia a exclusão quando a área possui iniciativas vinculadas.
- **Excluir uma `BusinessUnit` não apaga suas áreas cliente**: as `ClientTeam` associadas têm `businessUnitId` zerado para `null` (ver `PrismaBusinessUnitRepository.deleteBusinessUnit` / `OracleBusinessUnitRepository`).
- **Migração one-time no frontend**: ao abrir a aba "clientes" com o backend vazio, a tela ainda pode importar as áreas do antigo `localStorage['oraculo_client_teams']`; novos vínculos de iniciativa, porém, são sempre gravados por ID.

## 4. Endpoints

| Método | Rota | DTO / Query | Descrição |
|---|---|---|---|
| GET/POST | `/teams`, `/api/teams` | list: `companyId?`, `departmentId?` | Lista/cria times |
| PATCH/DELETE | `/teams/:id` | — | Atualiza/remove time |
| GET | `/collaborators` | `companyId?`, `departmentId?`, `lite?` | Lista colaboradores (`lite` retorna payload reduzido) |
| GET | `/collaborators/email/:email` | — | Busca colaborador por email |
| POST/PATCH/DELETE | `/collaborators/:id` | — | Cria/atualiza/remove colaborador |
| POST | `/collaborators/skills/toggle` | `{ collaboratorId, skillId, active }` | Ativa/desativa skill do colaborador |
| GET | `/companies`, `/api/companies` | — | Lista empresas |
| POST/PATCH/DELETE | `/companies/:id` | — | Cria/atualiza/remove empresa |
| GET | `/departments`, `/api/departments` | — | Lista departamentos |
| POST/PATCH `:id` | `/departments` | — | Cria/atualiza departamento (com master-user) |
| PATCH | `/departments/:id/basic` | — | Atualiza campos básicos (sem tocar master-user) |
| GET | `/skills`, `/api/skills` | `companyId?`, `departmentId?` | Lista skills |
| POST/PATCH/DELETE | `/skills/:id` | `memberIds` | Cria/atualiza/remove skill |
| GET | `/absences`, `/api/absences` | `companyId?`, `departmentId?`, `teamId?` | Lista ausências |
| POST/DELETE | `/absences/:id` | — | Cria/remove ausência |
| GET | `/holidays`, `/api/holidays` | `companyId?` | Lista feriados |
| POST/DELETE | `/holidays/:id` | — | Cria/remove feriado |
| GET | `/business-units`, `/api/business-units` | `companyId?`, `departmentId?` | Lista Unidades de Negócio |
| POST/PATCH/DELETE | `/business-units/:id` | `{ name, companyId, departmentId }` | Cria/atualiza/remove Unidade de Negócio |
| GET | `/client-teams`, `/api/client-teams` | `companyId?`, `departmentId?` | Lista áreas cliente (com `businessUnitId`/`businessUnitName`) |
| POST/PATCH/DELETE | `/client-teams/:id` | `{ name, companyId, departmentId, businessUnitId? }` | Cria/atualiza/remove área cliente |

## 5. Fluxo ilustrativo — onboarding de colaborador

```
1. Admin cria Department (se novo) via /admin.
2. Admin/gestor cria Collaborator vinculado a Company + Department.
3. Colaborador recebe skills via toggle individual (POST /collaborators/skills/toggle).
4. Colaborador é vinculado a um Team (squadId) e passa a aparecer no organograma (/organizacao).
5. Ausências (férias, licenças) são lançadas conforme ocorrem, sem validação de sobreposição.
```

## 6. Contratos com outros módulos

| Módulo | Tipo de consumo | Detalhe |
|---|---|---|
| Iniciativas | Referência | `leaderId`, `technicalLeadId`, `memberIds`, `assigneeId` apontam para `Collaborator`; `executingTeamId` para `Team`; `clientTeamId` é FK nullable para `ClientTeam` |
| Inventário | Referência | `System.ownerTeamId` aponta para `Team` |
| Fornecedores & Contratos | Referência | `Contract.leaderId` aponta para `Collaborator`; `Vendor.directorId`/`managerId` idem |
| Alocações | Referência | `Allocation.collaboratorId` |

## 7. Questões em aberto / dívida técnica conhecida

- Sem checagem de sobreposição de datas em `Absence`.
- Sem enforcement de autorização por escopo — qualquer chamada pode listar/editar fora do departamento do usuário logado se souber o id.
- Lógica de atribuição de `masterUserId` do departamento vive na camada de repositório, não no service — vale revisar se deveria subir para `application/services` por consistência com o restante do módulo.

---

## Controle de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-07-16 | Agente de IA (Claude) | Criação inicial. |
| 2026-07-17 | Agente de IA (Claude) | Adição das entidades `BusinessUnit` (Unidade de Negócio) e `ClientTeam` (área cliente) ao backend; agrupamento cliente→unidade; endpoints e regras correspondentes. |
| 2026-07-19 | Agente de IA (Codex) | Associação de iniciativas por `clientTeamId`, propagação de renomes, validação de escopo e bloqueio de exclusão de áreas em uso. |
