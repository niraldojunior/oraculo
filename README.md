# Oraculo

Plataforma web de gestão de portfólio de TI — iniciativas, times, colaboradores, sistemas, fornecedores, contratos e alocações. Backend NestJS com Clean Architecture + DDD; frontend React + Vite.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Módulos e Endpoints](#módulos-e-endpoints)
- [Modelo de Dados](#modelo-de-dados)
- [Configuração](#configuração)
- [Executando Localmente](#executando-localmente)
- [Scripts npm](#scripts-npm)
- [Testes](#testes)
- [Banco de Dados](#banco-de-dados)
- [Tecnologias](#tecnologias)

---

## Visão Geral

O Oraculo centraliza a governança e operação de tecnologia em uma única aplicação:

- Dashboard executivo com indicadores consolidados
- Gestão de iniciativas com visões de cards, tabela, timeline, milestones e tarefas
- Editor avançado de iniciativa com histórico e comentários
- Gestão de organização — times, colaboradores, skills e capacidade
- Inventário de sistemas com detalhe técnico e governança
- Gestão de fornecedores e contratos
- Gestão de alocações por colaborador e período
- Área administrativa para empresas e departamentos
- PWA instalável (offline shell, prompt de instalação e atualização)

---

## Arquitetura

```
oraculo-git/
├── src/                          # Backend — API NestJS (fonte de verdade)
│   ├── main.ts                   # Bootstrap: logger, Swagger, OpenTelemetry
│   ├── app.module.ts             # Composition root
│   ├── domain/                   # Entidades e contratos de repositório (ports)
│   ├── application/              # Casos de uso e DTOs
│   ├── infrastructure/
│   │   ├── cache/                # CacheService — Stale-While-Revalidate in-memory
│   │   ├── log/                  # Logger estruturado com traceId (Pino)
│   │   ├── persistence/
│   │   │   ├── prisma/           # Repositórios PostgreSQL/Supabase
│   │   │   ├── oracle/           # Repositórios Oracle (experimental)
│   │   │   └── inmemory/         # Repositórios in-memory (testes/dev)
│   │   └── telemetry/            # OpenTelemetry + exportação OTLP
│   └── presentation/http/
│       ├── controllers/          # Controllers NestJS (sem regra de negócio)
│       └── modules/              # Módulos por domínio
├── web/                          # Frontend React + Vite
│   └── src/
│       ├── modules/              # Entrada por feature (pages + services)
│       ├── components/           # Componentes reutilizáveis
│       ├── context/              # AuthContext, ViewContext
│       ├── shared/
│       │   ├── http/             # apiClient HTTP
│       │   └── pwa/              # Install/update prompts do PWA
│       └── hooks/
└── scripts/                      # Utilitários de banco Oracle
```

**Princípios aplicados:**

- Controllers apenas orquestram — sem regra de negócio
- Domain desacoplado de frameworks (sem imports NestJS)
- Provider de banco configuravel via `DB_PROVIDER` fora de producao; em `NODE_ENV=production`, usa sempre `supabase`
- Cache SWR in-memory: respostas servidas imediatamente, refresh em background
- Log estruturado com `traceId` em todas as requisições
- Filtro global de exceções com resposta padronizada

---

## Módulos e Endpoints

Base URL: `/api`
Documentação interativa: `http://localhost:3001/api/docs` (Swagger)

| Grupo            | Endpoints principais                                          |
|------------------|---------------------------------------------------------------|
| **Auth**         | `POST /api/auth/login`                                        |
| **Initiatives**  | `GET/POST /api/initiatives`, `GET/PATCH/DELETE /api/initiatives/:id`, `GET /api/initiatives/:id/history`, `PATCH /api/initiatives/:id/priority` |
| **Organization** | `/api/collaborators`, `/api/teams`                            |
| **Systems**      | `GET/POST/PATCH/DELETE /api/systems`                          |
| **Inventory**    | `GET /api/inventory-context`                                  |
| **Vendors**      | `/api/vendors`, `/api/vendors-context`                        |
| **Contracts**    | `/api/contracts`                                              |
| **Allocations**  | `/api/allocations`                                            |
| **Skills**       | `/api/skills`                                                 |
| **Departments**  | `/api/departments`                                            |
| **Companies**    | `/api/companies`                                              |
| **Absences**     | `/api/absences`                                               |
| **Holidays**     | `/api/holidays`                                               |
| **Images**       | `GET /api/_img/collaborator/:id`, `/company/:id`, `/vendor/:id`, `/skill/:id` |
| **Azure**        | `GET /api/azure/workitems`                                    |
| **Health**       | `GET /api/health`, `GET /healthz`                             |

---

## Modelo de Dados

```
Company
  └── Department
        └── Collaborator ──── CollaboratorSkill ──── Skill
              └── Absence
              └── Allocation

Team
  └── System ──── Vendor ──── Contract

Initiative
  └── InitiativeMilestone
        └── MilestoneTask
  └── InitiativeHistory
  └── InitiativeComment
```

Schema Prisma: `src/infrastructure/persistence/prisma/schema.prisma`

---

## Configuração

Crie `.env.local` na raiz do projeto:

```env
# Provider de banco local: oracle | supabase | inmemory
# Em NODE_ENV=production, a aplicacao ignora DB_PROVIDER e usa supabase.
DB_PROVIDER="oracle"

# PostgreSQL / Supabase (obrigatório quando DB_PROVIDER=supabase)
DATABASE_URL="postgresql://usuario:senha@host:5432/postgres"
DIRECT_URL="postgresql://usuario:senha@host:5432/postgres"

# Oracle (obrigatório quando DB_PROVIDER=oracle)
ORACLE_USER="oracle_user"
ORACLE_PASSWORD="oracle_password"
ORACLE_CONNECTION_STRING="host:1521/service_name"
ORACLE_POOL_MIN=1
ORACLE_POOL_MAX=10
ORACLE_POOL_TIMEOUT_SECONDS=60
ORACLE_POOL_PING_INTERVAL_SECONDS=60

# API
PORT=3001

# Cache Stale-While-Revalidate (opcional)
API_CACHE_STALE_MS=60000
API_CACHE_TTL_MS=300000

# Observabilidade (opcional)
OTEL_SERVICE_NAME="oraculo-api"
OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318/v1/traces"

# Integrações (opcional)
AZURE_PAT="personal-access-token-azure-devops"
```

| Variável | Padrão | Descrição |
|---|---|---|
| `DB_PROVIDER` | `oracle` fora de producao; `supabase` em producao | Engine de banco ativo |
| `PORT` | `3001` | Porta HTTP da API |
| `API_CACHE_STALE_MS` | `60000` | Tempo até o cache ficar stale (ms) |
| `API_CACHE_TTL_MS` | `300000` | Tempo até o cache expirar (ms) |
| `OTEL_SERVICE_NAME` | `oraculo-api` | Nome do serviço no trace |

---

## Executando Localmente

### Pré-requisitos

- Node.js 18+
- Banco acessível conforme `DB_PROVIDER` configurado

### Instalação

```powershell
git clone https://github.com/niraldojunior/oraculo
cd oraculo-git
npm install
# configure .env.local conforme seção Configuração
```

### Desenvolvimento

```powershell
# Supabase (PostgreSQL) — frontend + backend
.\start-dev-supabase.ps1

# Oracle — frontend + backend
.\start-dev-oracle.ps1
```

Ou separadamente:

```powershell
npm run server   # backend (porta 3001)
npm run dev      # frontend (porta 5173)
```

Swagger disponível em `http://localhost:3001/api/docs` após subir a API.

---

## Scripts npm

| Comando | Descrição |
|---|---|
| `npm run dev` | Sobe o frontend (Vite, porta 5173) |
| `npm run server` / `npm run api:dev` | Compila e sobe a API (porta 3001) |
| `npm run api:build` | Apenas compila o TypeScript da API |
| `npm run api:test` | Testes unitários Jest (jest.config.ts) |
| `npm run api:test:e2e` | Testes E2E de API com DB in-memory (jest.e2e.config.ts) |
| `npm run api:test:integration` | Testes de integração Prisma contra Postgres real (jest.integration.config.ts) |
| `npm run api:test:performance` | Testes de performance Oracle — latência, throughput, pool (jest.performance.config.ts) |
| `npm run precommit` | `api:test --coverage` + `build` — gate local antes de commit |
| `npm run build` | Gera Prisma Client, compila TS e builda frontend |
| `npm run lint` | Revisa qualidade do codigo em todo o projeto |
| `npm run preview` | Serve o build do frontend localmente |
| `npm run oracle:schema` | Cria a estrutura de tabelas no Oracle (DDL) |
| `npm run oracle:sync` | Limpa o Oracle e recarrega dados do Supabase |

---

## Testes

### Testes unitários

```powershell
# Roda todos os testes unitários
npm run api:test

# Watch mode
npx jest --config jest.config.ts --watch

# Com cobertura (mínimo 95% linhas/funções, 70% branches)
npx jest --config jest.config.ts --coverage
```

Specs: `src/test/**/*.spec.ts` — testes rápidos com dependências fake (sem banco real).

### Testes E2E

```powershell
# Testes E2E da API com DB in-memory
npm run api:test:e2e
```

Specs: `src/test/e2e/**/*.e2e-spec.ts` — sobem o AppModule real, sem banco externo.

### Testes de integração

```powershell
# Testes contra Postgres real (requer .env.test.local)
npm run api:test:integration
```

Specs: `src/test/integration/**/*.integration-spec.ts` — exercitam Prisma*Repository contra Postgres dedicado. Ver `docs/02-system-design/architecture.md` para setup.

### Testes de performance (Oracle)

```powershell
# Testes de performance contra Oracle real (requer credenciais em .env.local)
npm run api:test:performance
```

Specs: `src/test/performance/**/*.performance-spec.ts` — mede latência (CRUD, bulk ops, pool) com SLA < 50ms. Exporta relatório JSON em `./test-results/oracle-performance-report.json`. Ver `docs/02-system-design/performance-testing.md` para detalhes.

### Gate local (antes de commit)

```powershell
npm run precommit
```

Roda `api:test --coverage` + `build` — falha se cobertura < 95% ou TS/build errados.

---

## Banco de Dados

### Providers disponíveis

| `DB_PROVIDER` | Status | Descrição |
|---|---|---|
| `supabase` | **Produção** — fonte de verdade | PostgreSQL via Prisma |
| `oracle` | Experimental | Oracle Database via `oracledb` |
| `inmemory` | Dev / testes | Repositórios em memória sem persistência |

### Operações Oracle

```powershell
# Criar schema em nova instância Oracle
npm run oracle:schema

# Sincronizar Oracle a partir do Supabase (limpa e recarrega)
npm run oracle:sync
```

O sync limpa as tabelas na ordem inversa de FK e recarrega todos os dados do Supabase, exibindo contagem por tabela ao final.

### Prisma

```powershell
npx prisma generate        # Gera o client
npx prisma migrate dev     # Aplica migrações
npx prisma studio          # UI de visualização
```

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Framework API | NestJS 11 |
| Linguagem | TypeScript 5 |
| Frontend | React 19 + Vite |
| Persistência principal | Prisma 6 + PostgreSQL (Supabase) |
| Persistência experimental | oracledb 6 + Oracle Database |
| Cache | SWR in-memory (implementação própria) |
| Roteamento frontend | React Router 7 |
| Observabilidade | Pino (logs), OpenTelemetry + OTLP |
| Validação | class-validator + class-transformer |
| Documentação | Swagger (`@nestjs/swagger`) |
| Testes | Jest + ts-jest |
| Imagens | Sharp |
| Editor rich text | TipTap |
| Gráficos | Recharts |
| PWA | vite-plugin-pwa (Workbox) |
