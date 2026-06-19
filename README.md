# Oraculo

Plataforma web para gestao de portfolio de iniciativas de tecnologia, organizacao de times e colaboradores, inventario de sistemas, fornecedores, contratos e alocacoes.

Este README foi revisado para refletir o estado atual do codigo apos a migracao estrutural para frontend/backend e arquitetura Hexagonal + DDD no backend.

## 1. Visao funcional (o que o sistema faz)

O Oraculo concentra, em uma unica aplicacao, a gestao de operacao e governanca de tecnologia:

- Dashboard executivo com indicadores e consolidacao de dados.
- Gestao de iniciativas com visoes de cards, tabela, timeline, milestones e tarefas.
- Editor avancado de iniciativa com historico e comentarios.
- Gestao de organizacao (times, colaboradores, skills, capacidade).
- Inventario de sistemas com detalhe tecnico e governanca.
- Gestao de fornecedores e contratos.
- Gestao de alocacoes por colaborador/periodo.
- Area administrativa para companhias e departamentos.

## 2. Como o codigo-fonte esta construido

### 2.1 Arquitetura de alto nivel

- Frontend: SPA React + Vite em frontend/src.
- Backend: API Express + Prisma em backend/src.
- Banco: PostgreSQL via Prisma Client.
- Deploy: Vercel com adapter serverless em api/index.ts.

```mermaid
flowchart LR
  A[Browser - React SPA] -->|HTTP /api| B[Express API]
  B --> C[Application Services]
  C --> D[Domain Repositories]
  D --> E[Prisma Repositories]
  E --> F[(PostgreSQL)]
  B --> G[Image endpoints /api/_img/*]
```

### 2.2 Linhas principais de arquitetura de sistemas

Backend (Hexagonal + DDD):
- Domain: modelos e contratos de repositorio.
- Application: casos de uso por contexto (Company, Contract, Department, etc.).
- Infrastructure: implementacoes Prisma e runtime de conexao.
- Interfaces/HTTP: controllers, rotas, DTOs, helpers de borda e composition root.

Frontend (modular e otimizado):
- modules: ponto de entrada por feature (ex: initiatives, organization), contendo `pages` e `services`.
- components: componentes React reutilizáveis, divididos em `common` (genéricos) e `layout`.
- context: provedores de estado global (ex: `AuthContext`, `ViewContext`).
- shared: código compartilhado não-visual (ex: `http` para `apiClient`).
- hooks: hooks customizados reutilizáveis.
- types: definições de tipos globais da aplicação.
- Otimização: as rotas usam `React.lazy` para code-splitting, e os imports utilizam o alias `@/` para caminhos mais limpos.

### 2.3 Fluxo de execucao

1. O usuario acessa a SPA servida pelo Vite (dev) ou build estatico (prod).
2. O frontend chama endpoints em /api.
3. Em dev, o Vite faz proxy para http://localhost:3001.
4. O backend aplica validacoes, regras de escopo, cache e orquestracao de services.
5. Repositorios Prisma executam operacoes no PostgreSQL.
6. A resposta volta para o frontend e atualiza a UI.

## 3. Tecnologias usadas

Frontend:
- React 19
- TypeScript
- Vite
- React Router
- Recharts
- Lucide React
- TipTap

Backend:
- Node.js
- Express
- Prisma Client
- PostgreSQL
- Sharp (otimizacao de imagens)

Ferramentas:
- ESLint
- TSX
- Prisma CLI
- XLSX

## 4. Setup e execucao local

### 4.1 Pre-requisitos

- Node.js 18+
- PostgreSQL acessivel (ex.: Supabase)

### 4.2 Variaveis de ambiente

Crie .env.local na raiz:

```env
DATABASE_URL="postgresql://usuario:senha@host:5432/postgres"
DIRECT_URL="postgresql://usuario:senha@host:5432/postgres"
PORT=3001
AZURE_PAT="seu-personal-access-token-azure-devops"  # opcional; necessario para integracao com Azure DevOps
```

### 4.3 Scripts principais

- npm run dev: sobe o frontend (Vite).
- npm run server: sobe a API local (backend/src/interfaces/http/server.ts).
- npm run build: gera prisma client, compila TS e builda frontend.
- npm run preview: preview da build.
- npm run lint: lint do projeto.

Atalhos Windows:
- start-dev.ps1
- start-dev.bat

## 5. Estrutura da aplicacao e papel de cada pasta

### 5.1 Raiz

- frontend: aplicacao React.
- backend: API e camadas de dominio/aplicacao/infraestrutura/interfaces.
- dist: saida de build do frontend.

- SETUP-LOCAL.md: setup local alternativo.

Arquivos de configuracao importantes:
- package.json: scripts e dependencias.
- vite.config.ts: root do frontend, proxy /api e build.
- vercel.json: rewrites para api/index.ts e fallback SPA.
- prisma.config.ts: configuracao Prisma apontando schema no backend.
- tsconfig.json, tsconfig.app.json, tsconfig.node.json: configuracao TypeScript.
- eslint.config.js: configuracao ESLint.
- start-dev.ps1, start-dev.bat: bootstrap local.

### 5.2 Frontend - mapa de arquivos fonte

#### frontend/src (arquivos raiz)

- frontend/src/main.tsx: bootstrap React e montagem da App.
- frontend/src/App.tsx: roteamento principal, rotas protegidas e adminOnly.
- frontend/src/index.css: estilos globais e tokens visuais.
- frontend/src/App.css: estilos complementares.
- frontend/src/types/index.ts: tipos de dominio usados pela UI.

#### frontend/src/context

- frontend/src/context/AuthContext.tsx: autenticacao, usuario logado e escopo atual.
- frontend/src/context/ViewContext.tsx: estado de busca, visao ativa e header contextual.

#### frontend/src/shared

- frontend/src/shared/http/apiClient.ts: helper de requisicoes HTTP (GET/POST/PUT/DELETE) com querystring e tratamento de erros.

#### frontend/src/hooks

- frontend/src/hooks/useEscapeKey.ts: hook para fechar modais com Esc.

#### frontend/src/data

- frontend/src/data/mockDb.ts: constantes e estruturas auxiliares de UI.

#### frontend/src/components/common

- frontend/src/components/common/PriorityPicker.tsx: seletor e render de prioridade.
- frontend/src/components/common/StatusIcon.tsx: icones/cores de status.

#### frontend/src/components/layout

- frontend/src/components/layout/MainLayout.tsx: shell da aplicacao (sidebar + header + outlet).
- frontend/src/components/layout/Sidebar.tsx: menu lateral e dados do usuario.
- frontend/src/components/layout/Header.tsx: cabecalho contextual por pagina.
- frontend/src/components/layout/CompanyInfoModal.tsx: modal de informacoes da companhia.
- frontend/src/components/layout/UserPreferencesModal.tsx: modal de preferencias do usuario.

#### frontend/src/components/initiative

- frontend/src/components/initiative/CreateInitiativeModal.tsx: criacao rapida de iniciativa.
- frontend/src/components/initiative/SidebarComponents.tsx: blocos reutilizaveis da sidebar.
- frontend/src/components/initiative/InitiativeTaskBoard.tsx: board/list/timeline de tarefas.
- frontend/src/components/initiative/InitiativeEditor.tsx: editor completo de iniciativa.

#### frontend/src/modules (entrada modular por feature)

Pages:
- frontend/src/modules/auth/pages/LoginPage.tsx
- frontend/src/modules/dashboard/pages/DashboardPage.tsx
- frontend/src/modules/organization/pages/OrganizationPage.tsx
- frontend/src/modules/organization/pages/CollaboratorsPage.tsx: listagem e gestao de colaboradores.
- frontend/src/modules/inventory/pages/InventoryPage.tsx
- frontend/src/modules/inventory/pages/InventoryDetailPage.tsx
- frontend/src/modules/initiatives/pages/InitiativesPage.tsx
- frontend/src/modules/initiatives/pages/InitiativeEditPage.tsx
- frontend/src/modules/vendors/pages/VendorsPage.tsx
- frontend/src/modules/tasks/pages/TasksPage.tsx
- frontend/src/modules/allocations/pages/AllocationsPage.tsx
- frontend/src/modules/admin/pages/AdminPage.tsx

Services por feature:
- frontend/src/modules/admin/services/adminApi.ts: APIs de administracao.
- frontend/src/modules/allocations/services/allocationsApi.ts: dados da tela de alocacoes.
- frontend/src/modules/dashboard/services/dashboardApi.ts: dados do dashboard.
- frontend/src/modules/inventory/services/inventoryApi.ts: contexto/CRUD de systems no frontend.
- frontend/src/modules/initiatives/services/initiativesApi.ts: CRUD e contexto de iniciativas.
- frontend/src/modules/organization/services/organizationApi.ts: CRUD/contexto de organizacao.
- frontend/src/modules/tasks/services/tasksApi.ts: carga e persistencia de tarefas.
- frontend/src/modules/topology/services/topologyApi.ts: dados de systems/integrations para topologia.
- frontend/src/modules/vendors/services/vendorsApi.ts: APIs de fornecedores/contexto.

### 5.3 Backend - mapa de arquivos fonte

#### api (entrypoint serverless)

- api/index.ts: adapter serverless para Vercel (importa e exporta o app Express).
- backend/api/index.ts: alias interno referenciado pelos imports do backend.

#### backend/src/interfaces/http/azure

- backend/src/interfaces/http/azure/azure.routes.ts: integracao com Azure DevOps; busca work items vinculados a iniciativas via PAT.

#### backend/src/interfaces/http (borda HTTP)

Arquivos raiz:
- backend/src/interfaces/http/server.ts: sobe servidor local na porta configurada.
- backend/src/interfaces/http/expressApp.ts: cria app Express e injeta dependencias globais.
- backend/src/interfaces/http/http.routes.ts: composition root das rotas e servicos.

Core e imagens:
- backend/src/interfaces/http/core/core.routes.ts: rotas de health/auth.
- backend/src/interfaces/http/core/core.controller.ts: handlers de health/auth.
- backend/src/interfaces/http/images/images.routes.ts: rotas /api/_img/*.
- backend/src/interfaces/http/images/images.controller.ts: leitura de imagens e fallback.

Initiatives:
- backend/src/interfaces/http/initiatives/initiatives.routes.ts
- backend/src/interfaces/http/initiatives/initiatives.controller.ts
- backend/src/interfaces/http/dto/initiativeDto.ts

Organization:
- backend/src/interfaces/http/organization/organization.routes.ts
- backend/src/interfaces/http/organization/organization.controller.ts
- backend/src/interfaces/http/organization/organization.dto.ts

Systems / Inventory:
- backend/src/interfaces/http/systems/systems.routes.ts
- backend/src/interfaces/http/systems/systems.controller.ts
- backend/src/interfaces/http/systems/systems.dto.ts
- backend/src/interfaces/http/inventory/inventory.routes.ts
- backend/src/interfaces/http/inventory/inventory.controller.ts

Vendors / Contracts:
- backend/src/interfaces/http/vendors/vendors.routes.ts
- backend/src/interfaces/http/vendors/vendors.controller.ts
- backend/src/interfaces/http/vendors/vendors.dto.ts
- backend/src/interfaces/http/contracts/contracts.routes.ts
- backend/src/interfaces/http/contracts/contracts.controller.ts
- backend/src/interfaces/http/contracts/contracts.dto.ts

Demais contextos:
- backend/src/interfaces/http/allocations/allocations.routes.ts
- backend/src/interfaces/http/allocations/allocations.controller.ts
- backend/src/interfaces/http/departments/departments.routes.ts
- backend/src/interfaces/http/departments/departments.controller.ts
- backend/src/interfaces/http/companies/companies.routes.ts
- backend/src/interfaces/http/companies/companies.controller.ts
- backend/src/interfaces/http/companies/companies.dto.ts
- backend/src/interfaces/http/skills/skills.routes.ts
- backend/src/interfaces/http/skills/skills.controller.ts
- backend/src/interfaces/http/skills/skills.dto.ts
- backend/src/interfaces/http/absences/absences.routes.ts
- backend/src/interfaces/http/absences/absences.controller.ts
- backend/src/interfaces/http/holidays/holidays.routes.ts
- backend/src/interfaces/http/holidays/holidays.controller.ts

Helpers compartilhados HTTP:
- backend/src/interfaces/http/shared/cache.helpers.ts: cache API e cache de imagem.
- backend/src/interfaces/http/shared/http.middlewares.ts: logging e error handler.
- backend/src/interfaces/http/shared/image-serving.helpers.ts: serve de imagem com cache.
- backend/src/interfaces/http/shared/image.helpers.ts: transformacao de refs de imagem.
- backend/src/interfaces/http/shared/query-shapes.ts: select/omit e normalizadores.
- backend/src/interfaces/http/shared/scope.helpers.ts: regras de escopo company/department.

#### backend/src/application (casos de uso)

- backend/src/application/CompanyApplicationService.ts
- backend/src/application/ContractApplicationService.ts
- backend/src/application/DepartmentApplicationService.ts
- backend/src/application/InitiativeApplicationService.ts
- backend/src/application/OrganizationApplicationService.ts
- backend/src/application/SkillApplicationService.ts
- backend/src/application/VendorApplicationService.ts

Responsabilidade: orquestrar operacoes por contexto usando contratos do dominio.

#### backend/src/domain

Models:
- backend/src/domain/models/Allocation.ts
- backend/src/domain/models/Collaborator.ts
- backend/src/domain/models/Company.ts
- backend/src/domain/models/Contract.ts
- backend/src/domain/models/Department.ts
- backend/src/domain/models/Initiative.ts
- backend/src/domain/models/Skill.ts
- backend/src/domain/models/System.ts
- backend/src/domain/models/Team.ts
- backend/src/domain/models/Vendor.ts

Repositories (ports):
- backend/src/domain/repositories/CompanyRepository.ts
- backend/src/domain/repositories/ContractRepository.ts
- backend/src/domain/repositories/DepartmentRepository.ts
- backend/src/domain/repositories/InitiativeRepository.ts
- backend/src/domain/repositories/OrganizationRepository.ts
- backend/src/domain/repositories/SkillRepository.ts
- backend/src/domain/repositories/VendorRepository.ts

Domain service:
- backend/src/domain/services/PrioritizeInitiative.ts: regra de priorizacao de iniciativas.

#### backend/src/infrastructure

Persistence (adapters Prisma):
- backend/src/infrastructure/persistence/PrismaCompanyRepository.ts
- backend/src/infrastructure/persistence/PrismaContractRepository.ts
- backend/src/infrastructure/persistence/PrismaDepartmentRepository.ts
- backend/src/infrastructure/persistence/PrismaInitiativeRepository.ts
- backend/src/infrastructure/persistence/PrismaOrganizationRepository.ts
- backend/src/infrastructure/persistence/PrismaSkillRepository.ts
- backend/src/infrastructure/persistence/PrismaVendorRepository.ts
- backend/src/infrastructure/persistence/prisma.runtime.ts

Schema:
- backend/src/infrastructure/persistence/prisma/schema.prisma

Gateway:
- backend/src/infrastructure/gateways/imageOptimizer.ts: otimizacao de imagem base64.

## 6. Endpoints da API (por dominio)

Principais grupos:

- /api/health
- /api/auth/login
- /api/_img/collaborator/:id
- /api/_img/company/:id
- /api/_img/vendor/:id
- /api/_img/skill/:id
- /api/initiatives
- /api/teams
- /api/collaborators
- /api/systems
- /api/inventory-context
- /api/vendors
- /api/vendors-context
- /api/contracts
- /api/allocations
- /api/departments
- /api/companies
- /api/skills
- /api/absences
- /api/holidays
- /api/azure/workitems: busca work items do Azure DevOps vinculados a uma iniciativa.

## 7. Modelo de dados (resumo)

Entidades no schema Prisma:

- Company
- Department
- Collaborator
- Absence
- Holiday
- Skill
- CollaboratorSkill
- Team
- System
- Vendor
- Contract
- Initiative
- InitiativeMilestone
- MilestoneTask
- InitiativeHistory
- InitiativeComment
- Allocation

## 8. Estado atual da refatoracao

Concluido:
- Frontend fisicamente separado em frontend/src e frontend/public.
- Backend consolidado em backend/src e adapter serverless em api/index.ts.
- Migracao de varias paginas para services de modulo (reduzindo fetch direto em pagina).
- Backend com composition root HTTP e contexto organizado por modulos.
- Dominio backend expandido com modelos principais e contratos de repositorio tipados.

Em evolucao:
- reduzir any/unknown residuais em controllers/adapters.
- ampliar automacao de smoke tests.

## 9. Troubleshooting rapido

Fotos/avatar nao aparecem:
- validar se backend esta rodando em http://localhost:3001.
- testar endpoint de imagem: /api/_img/collaborator/{id}.
- conferir se vite.config.ts mantem proxy /api para localhost:3001.

Problemas de build:
- rodar npx tsc -b.
- rodar npm run build.

## 10. Scripts operacionais (scripts/)

Utilitarios para operacoes de manutencao e importacao de dados. **Usar com cautela em ambiente com banco de producao.**

- scripts/import-pbi-from-xlsx.mjs: importa itens de backlog (PBIs) a partir de planilha XLSX.
- scripts/report-pbi-without-systems.mjs: gera relatorio de PBIs sem sistemas associados.
- scripts/assign-teams-by-domain.ts: atribui times automaticamente com base no dominio de cada item.
- scripts/restore-categories.ts: restaura categorias perdidas ou inconsistentes no banco.
- scripts/check-domain-systems.ts: verifica integridade de sistemas por dominio.
- scripts/fix-pbi-ricardo-leader.mjs: correcao pontual de lideranca em PBIs.

## 11. Referencias internas

- SETUP-LOCAL.md: passo a passo adicional para setup local.
