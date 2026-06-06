# Reestruturacao para Hexagonal + DDD

Este documento define a migracao incremental aplicada no repositorio para o padrao Hexagonal (Ports and Adapters) com DDD.

## Estrutura introduzida

### Backend

```text
/backend
  /src
    /domain
      /models
      /repositories
      /services
    /application
    /infrastructure
      /persistence
      /gateways
    /interfaces
      /http
  /api
```

- O entrypoint principal da API local agora esta em `backend/src/interfaces/http/server.ts`.
- A composicao HTTP esta em `backend/src/interfaces/http/expressApp.ts` e `backend/src/interfaces/http/http.routes.ts`.
- O adapter serverless de deploy esta em `backend/api/index.ts`.
- O backend recebeu exemplos de `port` e `application service` no contexto de iniciativas.

### Frontend

```text
/frontend
  /src
    /core
      /http
    /modules
      /dashboard
      /auth
      /organization
      /inventory
      /initiatives
      /vendors
      /tasks
      /allocations
      /admin
    /shared
      /ui
    /pages
  /public
```

- O roteamento principal esta em `frontend/src/App.tsx`.
- A base modular do frontend convive com paginas em `frontend/src/pages`, que estao sendo migradas de forma incremental para `frontend/src/modules/*`.

## Principios para as proximas fases

1. Mover regras de negocio de `expressApp.ts` para `domain/services` e `application`.
2. Manter DTOs somente nas bordas HTTP (`interfaces/http`).
3. Implementar repositorios concretos em `infrastructure/persistence` e injetar no `application`.
4. Migrar cada feature do frontend para `frontend/src/modules/<feature>` com `components/hooks/services/store`.
5. Usar `frontend/src/shared` apenas para elementos realmente reutilizaveis entre modulos.

## Ordem sugerida de migracao

1. Iniciativas (backend + frontend).
2. Organizacao (teams/collaborators/skills).
3. Inventario e fornecedores.
4. Admin e cadastros mestres.

## Observacao

A fase atual prioriza estabilidade e baixo risco: foi feita uma migracao estrutural inicial sem alterar comportamento funcional dos endpoints ou paginas.

## Progresso fase 2 (Iniciativas)

- Frontend: a pagina de iniciativas passou a consumir um servico de modulo em `frontend/src/modules/initiatives/services/initiativesApi.ts`.
- Backend: o saneamento de DTO de iniciativas foi movido para a borda HTTP em `backend/src/interfaces/http/dto/initiativeDto.ts`.
- Backend: os endpoints de iniciativas foram extraidos para `backend/src/interfaces/http/initiatives/initiatives.routes.ts` e `backend/src/interfaces/http/initiatives/initiatives.controller.ts`, reduzindo acoplamento no `expressApp.ts`.
- Backend: endpoints de times e colaboradores foram extraidos para `backend/src/interfaces/http/organization/organization.routes.ts` e `backend/src/interfaces/http/organization/organization.controller.ts`.
- Backend: endpoints residuais de colaboradores (`/api/collaborators/email/:email` e `/api/collaborators/skills/toggle`) foram movidos para o modulo de organizacao (Lote A1).
- Backend: sanitizacao de Teams/Collaborators foi extraida para DTO de organizacao em `backend/src/interfaces/http/organization/organization.dto.ts` (Lote A2).
- Backend: camada de aplicacao/porta/repositorio para Organizacao concluida (`OrganizationApplicationService`, `OrganizationRepository`, `PrismaOrganizationRepository`) e operacoes de leitura/escrita do controller passaram a usar esse fluxo (Lote A3).
- Backend: contexto de Systems foi extraido de `expressApp.ts` para modulo dedicado com `systems.routes.ts`, `systems.controller.ts` e `systems.dto.ts` (Lote B1).
- Backend: contexto de Vendors foi extraido de `expressApp.ts` para modulo dedicado com `vendors.routes.ts`, `vendors.controller.ts` e `vendors.dto.ts` (Lote B2), incluindo `vendors-context`.
- Backend: contexto de Contracts foi extraido de `expressApp.ts` para modulo dedicado com `contracts.routes.ts`, `contracts.controller.ts` e `contracts.dto.ts` (Lote B3).
- Backend: contexto de Allocations foi extraido de `expressApp.ts` para modulo dedicado com `allocations.routes.ts` e `allocations.controller.ts` (Lote B4).
- Backend: contexto de Departments foi extraido de `expressApp.ts` para modulo dedicado com `departments.routes.ts` e `departments.controller.ts` (Lote B5).
- Backend: contexto de Companies foi extraido de `expressApp.ts` para modulo dedicado com `companies.routes.ts`, `companies.controller.ts` e `companies.dto.ts` (Lote B6).
- Backend: contexto de Skills foi extraido de `expressApp.ts` para modulo dedicado com `skills.routes.ts`, `skills.controller.ts` e `skills.dto.ts` (Lote B7).
- Backend: contexto de Absences foi extraido de `expressApp.ts` para modulo dedicado com `absences.routes.ts` e `absences.controller.ts` (Lote B8).
- Backend: contexto de Holidays foi extraido de `expressApp.ts` para modulo dedicado com `holidays.routes.ts` e `holidays.controller.ts` (Lote B9).
- Backend: endpoints Core (`/api/health`, `/api/auth/login`) foram extraidos para modulo dedicado com `core.routes.ts` e `core.controller.ts` (Lote B10).
- Backend: endpoints dedicados de imagem (`/api/_img/*`) foram extraidos para modulo dedicado com `images.routes.ts` e `images.controller.ts` (Lote B11).
- Backend: endpoint `inventory-context` foi extraido de `expressApp.ts` para modulo dedicado com `inventory.routes.ts` e `inventory.controller.ts` (Lote B12).
- Backend: helpers de escopo compartilhados (`getCommonWhere`, `ensureCompanyMatchesDept`) foram extraidos para `shared/scope.helpers.ts` e removidos do `expressApp.ts` (Lote B13).
- Backend: helpers de transformacao de imagem (`transform*Image`) foram extraidos para `shared/image.helpers.ts` e removidos do `expressApp.ts` (Lote B14).
- Backend: helpers de cache/SWR (API e imagem) foram extraidos para `shared/cache.helpers.ts` e removidos do `expressApp.ts` (Lote B15).
- Backend: helpers de serving de imagem (`serveEntityImage`, parsing e ETag) foram extraidos para `shared/image-serving.helpers.ts` e removidos do `expressApp.ts` (Lote B16).
- Backend: selects/omits compartilhados e normalizadores de ordenacao foram extraidos para `shared/query-shapes.ts`, reduzindo mais o `expressApp.ts` ao papel de composition root (Lote B17).
- Backend: bootstrap operacional do Prisma (pool tuning, query logging, keepalive, warmup e repairs de startup) foi extraido para `infrastructure/persistence/prisma.runtime.ts` (Lote B18).
- Backend: middlewares HTTP compartilhados (request logging e global error handler) foram extraidos para `shared/http.middlewares.ts` (Lote B19).
- Backend: montagem dos routers e respectivas dependencias de feature foi extraida para `interfaces/http/http.routes.ts`, reduzindo o `expressApp.ts` a bootstrap HTTP e composição de alto nivel (Lote B20).
- Backend: contexto de `vendors` passou a usar `VendorApplicationService`, `VendorRepository` e adapter `PrismaVendorRepository`, removendo acesso direto a Prisma do controller (Lote C1).
- Backend: contexto de `companies` passou a usar `CompanyApplicationService`, `CompanyRepository` e `PrismaCompanyRepository` (Lote C2).
- Backend: contexto de `contracts` passou a usar `ContractApplicationService`, `ContractRepository` e `PrismaContractRepository` (Lote C3).
- Backend: contexto de `skills` passou a usar `SkillApplicationService`, `SkillRepository` e `PrismaSkillRepository`, preservando a transacao de membros no adapter (Lote C4).
- Backend: contexto de `departments` passou a usar `DepartmentApplicationService`, `DepartmentRepository` e `PrismaDepartmentRepository`, preservando a regiao de transacao para master user (Lote C5).
- Frontend: pagina de Organizacao passou a consumir `frontend/src/modules/organization/services/organizationApi.ts` para carga inicial e CRUD principal, reduzindo chamadas `fetch` diretas no componente (Lote F1).
- Frontend: paginas de Allocations, Topology, Inventory, InventoryDetail, InitiativeEdit e Tasks passaram a consumir services de modulo em `frontend/src/modules/*/services`, removendo `fetch` direto de pagina (Lote F2).
- Resultado: contratos de transporte ficam mais isolados e a pagina deixa de conhecer detalhes de montagem de querystring/fetch direto.
