# Oraculo

Plataforma web para gestao de portfolio de iniciativas de tecnologia, organizacao de times e colaboradores, inventario de sistemas, fornecedores, contratos e alocacoes.

Este README foi revisado para refletir o estado atual do codigo apos a migracao para web + API NestJS em src com arquitetura Hexagonal + DDD.

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

- Frontend: SPA React + Vite em web/src.
- Backend: API NestJS + Prisma em src.
- Banco: PostgreSQL via Prisma Client.
- Deploy: Vercel com handler serverless em src/presentation/http/serverless.handler.ts.

```mermaid
flowchart LR
  A[Browser - React SPA] -->|HTTP /api| B[NestJS API]
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
- Infrastructure: implementacoes Prisma/Oracle/InMemory, logging e observabilidade.
- Presentation HTTP: controllers, modules e DTOs com NestJS.

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
- Banco acessivel conforme provider selecionado:
  - Supabase/PostgreSQL
  - Oracle Database

### 4.2 Variaveis de ambiente

Crie .env.local na raiz:

```env
DB_PROVIDER="supabase" # supabase | oracle

# Supabase/PostgreSQL
DATABASE_URL="postgresql://usuario:senha@host:5432/postgres"
DIRECT_URL="postgresql://usuario:senha@host:5432/postgres"

# Oracle (obrigatorio quando DB_PROVIDER=oracle)
ORACLE_USER="oracle_user"
ORACLE_PASSWORD="oracle_password"
ORACLE_CONNECTION_STRING="host:1521/service_name"
ORACLE_POOL_MIN=1
ORACLE_POOL_MAX=10
ORACLE_POOL_TIMEOUT_SECONDS=60
ORACLE_POOL_PING_INTERVAL_SECONDS=60

PORT=3001
AZURE_PAT="seu-personal-access-token-azure-devops"  # opcional; necessario para integracao com Azure DevOps
```

### 4.3 Scripts principais

- npm run dev: sobe o frontend (Vite).
- npm run server: sobe a API local (src/main.ts).
- npm run build: gera prisma client, compila TS e builda web.
- npm run preview: preview da build.
- npm run lint: lint do projeto.

Atalhos Windows:
- start-dev.ps1
- start-dev.bat

## 5. Estrutura da aplicacao e papel de cada pasta

### 5.1 Raiz

- web: aplicacao React.
- backend: API e camadas de dominio/aplicacao/infraestrutura/interfaces.
- dist: saida de build do frontend.

- SETUP-LOCAL.md: setup local alternativo.

Arquivos de configuracao importantes:
- package.json: scripts e dependencias.
- vite.config.ts: root do web, proxy /api e build.
- vercel.json: rewrites para src/presentation/http/serverless.handler.ts e fallback SPA.
- prisma.config.ts: configuracao Prisma apontando schema no backend.
- tsconfig.json, tsconfig.app.json, tsconfig.node.json: configuracao TypeScript.
- eslint.config.js: configuracao ESLint.
- start-dev.ps1, start-dev.bat: bootstrap local.

### 5.2 Frontend - mapa de arquivos fonte

#### web/src (arquivos raiz)

- web/src/main.tsx: bootstrap React e montagem da App.
- web/src/App.tsx: roteamento principal, rotas protegidas e adminOnly.
- web/src/index.css: estilos globais e tokens visuais.
- web/src/App.css: estilos complementares.
- web/src/types/index.ts: tipos de dominio usados pela UI.

#### web/src/context

- web/src/context/AuthContext.tsx: autenticacao, usuario logado e escopo atual.
- web/src/context/ViewContext.tsx: estado de busca, visao ativa e header contextual.

#### web/src/shared

- web/src/shared/http/apiClient.ts: helper de requisicoes HTTP (GET/POST/PUT/DELETE) com querystring e tratamento de erros.

#### web/src/hooks

- web/src/hooks/useEscapeKey.ts: hook para fechar modais com Esc.

#### web/src/data

- web/src/data/mockDb.ts: constantes e estruturas auxiliares de UI.

#### web/src/components/common

- web/src/components/common/PriorityPicker.tsx: seletor e render de prioridade.
- web/src/components/common/StatusIcon.tsx: icones/cores de status.

#### web/src/components/layout

- web/src/components/layout/MainLayout.tsx: shell da aplicacao (sidebar + header + outlet).
- web/src/components/layout/Sidebar.tsx: menu lateral e dados do usuario.
- web/src/components/layout/Header.tsx: cabecalho contextual por pagina.
- web/src/components/layout/CompanyInfoModal.tsx: modal de informacoes da companhia.
- web/src/components/layout/UserPreferencesModal.tsx: modal de preferencias do usuario.

#### web/src/components/initiative

- web/src/components/initiative/CreateInitiativeModal.tsx: criacao rapida de iniciativa.
- web/src/components/initiative/SidebarComponents.tsx: blocos reutilizaveis da sidebar.
- web/src/components/initiative/InitiativeTaskBoard.tsx: board/list/timeline de tarefas.
- web/src/components/initiative/InitiativeEditor.tsx: editor completo de iniciativa.

#### web/src/modules (entrada modular por feature)

Pages:
- web/src/modules/auth/pages/LoginPage.tsx
- web/src/modules/dashboard/pages/DashboardPage.tsx
- web/src/modules/organization/pages/OrganizationPage.tsx
- web/src/modules/organization/pages/CollaboratorsPage.tsx: listagem e gestao de colaboradores.
- web/src/modules/inventory/pages/InventoryPage.tsx
- web/src/modules/inventory/pages/InventoryDetailPage.tsx
- web/src/modules/initiatives/pages/InitiativesPage.tsx
- web/src/modules/initiatives/pages/InitiativeEditPage.tsx
- web/src/modules/vendors/pages/VendorsPage.tsx
- web/src/modules/tasks/pages/TasksPage.tsx
- web/src/modules/allocations/pages/AllocationsPage.tsx
- web/src/modules/admin/pages/AdminPage.tsx

Services por feature:
- web/src/modules/admin/services/adminApi.ts: APIs de administracao.
- web/src/modules/allocations/services/allocationsApi.ts: dados da tela de alocacoes.
- web/src/modules/dashboard/services/dashboardApi.ts: dados do dashboard.
- web/src/modules/inventory/services/inventoryApi.ts: contexto/CRUD de systems no frontend.
- web/src/modules/initiatives/services/initiativesApi.ts: CRUD e contexto de iniciativas.
- web/src/modules/organization/services/organizationApi.ts: CRUD/contexto de organizacao.
- web/src/modules/tasks/services/tasksApi.ts: carga e persistencia de tarefas.
- web/src/modules/topology/services/topologyApi.ts: dados de systems/integrations para topologia.
- web/src/modules/vendors/services/vendorsApi.ts: APIs de fornecedores/contexto.

### 5.3 Backend - mapa de arquivos fonte

Observacao importante:
- Runtime ativo da API: src (NestJS).
- O backend legado foi removido; toda a operacao de API esta centralizada em src.

#### src/presentation/http (entrypoint serverless)

- src/presentation/http/serverless.handler.ts: handler serverless para Vercel (bootstrap Nest com cache por instancia).

#### src (API NestJS)

Camadas principais:
- src/domain: entidades e contratos (ports) de repositorio.
- src/application: casos de uso, DTOs e servicos de aplicacao.
- src/infrastructure: adaptadores de persistencia (Prisma/Oracle/InMemory), logging e telemetria.
- src/presentation/http: controllers e modules HTTP.
- src/health: endpoint /healthz e indicadores de saude.

Arquivos de entrada e composicao:
- src/main.ts: bootstrap da API (logger, Swagger e telemetria).
- src/app.module.ts: composition root da aplicacao.
- src/infrastructure/persistence/prisma/schema.prisma: schema Prisma oficial.

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
- Frontend fisicamente separado em web/src e web/public.
- Backend consolidado em src (NestJS) e handler serverless em src/presentation/http/serverless.handler.ts.
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
