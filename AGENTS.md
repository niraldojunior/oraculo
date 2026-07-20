# AGENTS.md — Guia para agentes de IA no repositório Oraculo

Este arquivo instrui qualquer agente de IA (Claude e outros) que trabalhe neste repositório. O objetivo é **produzir código e documentação consistentes com a arquitetura e as convenções já estabelecidas** — mesma camada, mesmo padrão de persistência, mesma terminologia. Leia este arquivo **antes de editar código ou criar/editar documentação**.

Para descrição funcional resumida do produto e passos de setup local, veja [README.md](README.md). Este documento vai mais fundo: decisões arquiteturais, taxonomia de documentação e guardrails.

---

## 1. O que é este repositório

O **Oraculo** é uma plataforma web de **gestão de portfólio de TI** — iniciativas, times, colaboradores, sistemas, fornecedores, contratos e alocações — construída como aplicação full-stack:

- **Backend** (`src/`) — API NestJS 11 + TypeScript, Clean Architecture / DDD, fonte de verdade dos dados.
- **Frontend** (`web/`) — React 19 + Vite + React Router 7, consumindo a API via `apiClient`.

Diferente de um repositório de especificação (spec-first), este é um **produto em produção**: a documentação em `docs/` descreve o sistema **como ele existe hoje** no código, não um design aspiracional. Ao escrever ou atualizar `docs/`, a fonte de verdade é sempre o código — se houver divergência, o código vence e a doc deve ser corrigida.

---

## 2. Estrutura do repositório

```
AGENTS.md
README.md

src/                               # Backend — API NestJS (fonte de verdade dos dados)
├── main.ts                        # Bootstrap: logger, Swagger, OpenTelemetry
├── app.module.ts                  # Composition root
├── advice/                        # Filtros globais (HttpExceptionFilter)
├── config/                        # env.config.ts — configuração via ConfigModule
├── domain/
│   ├── entities/                  # Tipos de domínio (sem framework)
│   ├── repositories/              # Interfaces (ports) + tokens de DI
│   └── services/                  # Regras de domínio puras (ex.: PrioritizeInitiative)
├── application/
│   ├── services/                  # Casos de uso — orquestram domain + repositório
│   └── dtos/                      # DTOs de entrada validados (class-validator)
├── infrastructure/
│   ├── cache/                     # CacheService — Stale-While-Revalidate in-memory
│   ├── log/                       # Logger estruturado (Pino) + middleware de traceId
│   ├── telemetry/                 # OpenTelemetry + exportação OTLP
│   └── persistence/
│       ├── prisma/                # Repositórios PostgreSQL/Supabase — produção
│       ├── oracle/                # Repositórios Oracle — experimental
│       └── inmemory/              # Repositórios em memória — testes/dev sem banco
├── presentation/http/
│   ├── controllers/                # Controllers NestJS — sem regra de negócio
│   └── modules/                    # Módulos NestJS por domínio (DI wiring)
└── test/                           # Specs Jest, espelhando a estrutura de src/

web/                                # Frontend — React + Vite
└── src/
    ├── config/navigation.ts        # Registro de menu, rotas e visões (fonte de verdade da navegação — D13)
    ├── modules/<feature>/          # Entrada por feature: pages/ + services/
    ├── components/                 # Componentes reutilizáveis (common, layout, initiative)
    ├── context/                    # AuthContext, ViewContext
    ├── shared/
    │   ├── http/                   # apiClient HTTP
    │   └── pwa/                    # Install/update prompts do PWA
    └── data/mockDb.ts              # Mock de dados só para dev do frontend

scripts/                            # Utilitários de banco Oracle (schema, sync)

docs/
├── 00-visao-geral/
│   ├── product-overview.md         # Visão de produto, módulos, personas, roadmap
│   ├── business-rules.md           # Regras de negócio transversais e decisões arquiteturais
│   └── glossary.md                 # Termos e siglas do domínio
│
├── 01-functional-specs/            # Uma spec por módulo funcional
│   ├── 01-modulo-iniciativas.md
│   ├── 02-modulo-organizacao.md
│   ├── 03-modulo-inventario.md
│   ├── 04-modulo-fornecedores-contratos.md
│   ├── 05-modulo-alocacoes.md
│   └── 06-modulo-admin-auth.md
│
├── 02-system-design/
│   ├── architecture.md             # Camadas, fluxo de request, multi-provider, cache, observabilidade
│   ├── data-model.md               # ERD + schema Prisma comentado
│   ├── integrations.md             # Azure DevOps, OpenTelemetry/OTLP
│   ├── non-functional-requirements.md
│   └── security.md                 # Auth, autorização, dados sensíveis, gaps conhecidos
│
├── 03-design-system/
│   ├── tokens.md                   # Paleta, tipografia, espaçamento (fonte: web/src/index.css)
│   └── guidelines.md               # Componentes, padrões de layout, convenções de UI
│
└── 04-delivery-plan/
    ├── roadmap.md
    ├── technical-backlog.md
    └── open-questions.md
```

> Não crie arquivos fora desta taxonomia sem motivo explícito.

---

## 3. O modelo de domínio (decore isto)

Toda entidade do Oraculo pendura de uma **hierarquia organizacional de dois níveis**, que é o eixo de escopo (multi-tenant) do sistema inteiro:

```
Company (empresa)
  └── Department (departamento) ── unidade de escopo operacional
        ├── Collaborator ──── CollaboratorSkill ──── Skill
        │     └── Absence (ausências/férias)
        │     └── Allocation (alocação em iniciativa/sistema, % e período)
        ├── Team (time) ── pode ter hierarquia (parentTeamId) e líder
        ├── System (sistema) ── criticidade, lifecycle, debtScore, time dono
        │     └── Contract ──── Vendor
        └── Initiative (iniciativa)
              ├── InitiativeMilestone
              │     └── MilestoneTask (Backlog/In Progress/Done)
              ├── InitiativeHistory (trilha de mudança de status)
              └── InitiativeComment
```

Praticamente toda entidade carrega `companyId` (+ a maioria também `departmentId`) e os repositórios filtram por esse escopo (`listByScope`). **Nunca** adicione uma entidade nova sem `companyId` a menos que ela seja genuinamente global (ex.: `Holiday` tem `companyId` opcional para feriados nacionais vs. corporativos).

`Initiative` é a entidade mais rica do domínio: guarda histórico de status (`InitiativeHistory`), milestones com tarefas (`MilestoneTask`), comentários e uma fila de prioridade (`priority: Int`) manipulada via `POST /api/initiatives/:id/priority`.

---

## 4. Decisões arquiteturais — como o sistema é hoje

Estas não são "regras a impor", são **o que o código já faz**. Ao estender o sistema, siga o padrão; ao encontrar uma exceção, ela provavelmente é dívida técnica — não a espalhe.

| # | Decisão | Onde se manifesta |
|---|---|---|
| **D1** | **Clean Architecture em 4 camadas** — `domain` nunca importa `infrastructure`/`presentation`; dependências fluem para dentro. | `src/domain/*` sem imports `@nestjs/*` |
| **D2** | **Controllers são finos** — sem regra de negócio, apenas mapeiam request → service. | `src/presentation/http/controllers/*.controller.ts` |
| **D3** | **Multi-provider de persistência via `DB_PROVIDER`** (`supabase` \| `oracle` \| `inmemory`), trocável sem recompilar. Toda interface em `domain/repositories/` precisa de implementação nos **três** providers. | `src/infrastructure/persistence/{prisma,oracle,inmemory}/` |
| **D4** | **Prisma/Supabase é a fonte de verdade em produção.** Oracle é um provider paralelo experimental — mudanças de schema não migram automaticamente entre os dois; scripts próprios (`npm run oracle:schema`, `npm run oracle:sync`) fazem a ponte manual. | `scripts/create-oracle-schema.ts`, `scripts/sync-supabase-to-oracle.ts` |
| **D5** | **Cache Stale-While-Revalidate in-memory, implementação própria** (não é uma lib como `swr`/`react-query`). `getOrFetch` retorna valor cacheado (mesmo stale) e dispara refresh em background com singleflight; `invalidatePrefix` limpa por prefixo de chave após toda escrita. | `src/infrastructure/cache/cache.service.ts` |
| **D6** | **Exceções viram JSON padronizado**: `{ statusCode, message, path, timestamp, traceId }`, com `details` extra só fora de produção para erros não-HTTP. `traceId` vem do span ativo do OpenTelemetry. | `src/advice/http-exception.filter.ts` |
| **D7** | **Log estruturado com `traceId`** via Pino + middleware; não usar `console.log` no backend (exceto fallback de erro no próprio `cache.service.ts`, que é caso conhecido). | `src/infrastructure/log/` |
| **D8** | **Validação de entrada via `class-validator`/`class-transformer`**, com `ValidationPipe` global (`whitelist: true`, `transform: true`, `forbidUnknownValues: false`). | `app.module.ts`, `src/application/dtos/*.dto.ts` |
| **D9** | **Cobertura de testes é gate obrigatório**: 95% linhas/funções/statements, 70% branches sobre os arquivos listados em `collectCoverageFrom` do Jest (services, cache, repositórios prisma/oracle/inmemory, controllers exceto `health` e `azure`). `npm run precommit` roda testes com cobertura + build. | `jest.config.ts` |
| **D10** | **ESM nativo** — imports internos usam extensão `.js` mesmo em arquivos `.ts` (necessário para Node ESM; `moduleNameMapper` do Jest resolve de volta para `.ts` em teste). | Qualquer import relativo em `src/` |
| **D13** | **Menu de 5 itens e visões endereçáveis por rota** — o menu lateral tem Dashboard, Rede, Produtos, Iniciativas e Tarefas; cada visão dentro de uma seção tem rota própria (`/rede/hierarquia`, `/produtos/servicos/contratos`, `/iniciativas/kanban`, …), trocada por um **menu suspenso** (`ViewMenu`), nunca por *segmented control*. `ViewContext` mantém a API `activeView`/`setActiveView` mas deriva a visão do `location.pathname` — sem `localStorage`. Para adicionar uma visão, edite `navigation.ts` + `App.tsx`; não há condicional por pathname espalhada. | `web/src/config/navigation.ts`, `web/src/context/ViewContext.tsx`, `web/src/components/common/{ViewMenu,LeaderFilter}.tsx` |
| **D11** | **Área cliente associada por FK; nome e Unidade de Negócio derivados** — a iniciativa guarda `Initiative.clientTeamId` (FK nullable para `ClientTeam.id`). O nome atual e a `BusinessUnit` são derivados da relação; `originDirectorate` existe apenas como alias temporário de resposta. Renomes propagam sem atualizar iniciativas e áreas em uso não podem ser excluídas. | `schema.prisma` (models `Initiative`/`ClientTeam`), `initiative.service.ts`, `client-team.service.ts` |

### Ponto de atenção conhecido (não é decisão, é dívida técnica)

- **Senha em texto plano**: `auth.service.ts` compara `user.password !== password` diretamente, sem hashing. Não trate isso como padrão a replicar — é um gap de segurança já mapeado em `docs/02-system-design/security.md`. Não "conserte" silenciosamente sem alinhar com o usuário, pois pode exigir migração de dados existentes.

---

## 5. Onde escrever cada tipo de conteúdo

| Tipo de conteúdo | Pasta / arquivo |
|---|---|
| Propósito do produto, módulos, personas, roadmap de alto nível | `docs/00-visao-geral/product-overview.md` |
| Regras de negócio transversais, decisões arquiteturais (D1–D10 e futuras) | `docs/00-visao-geral/business-rules.md` |
| Glossário de termos e siglas do domínio | `docs/00-visao-geral/glossary.md` |
| Especificação funcional de um módulo (entidades, regras, endpoints) | `docs/01-functional-specs/0N-modulo-<nome>.md` |
| Arquitetura de sistema, fluxo de request, camadas | `docs/02-system-design/architecture.md` |
| Modelo de dados, ERD, schema Prisma comentado | `docs/02-system-design/data-model.md` |
| Integrações externas (Azure DevOps, OTLP) | `docs/02-system-design/integrations.md` |
| Requisitos não-funcionais (performance, cache, escala) | `docs/02-system-design/non-functional-requirements.md` |
| Autenticação, autorização, dados sensíveis, gaps de segurança | `docs/02-system-design/security.md` |
| Tokens visuais, componentes, padrões de UI | `docs/03-design-system/` |
| Roadmap detalhado, backlog técnico, questões em aberto | `docs/04-delivery-plan/` |
| Contexto operacional para agentes de IA (este arquivo) | `AGENTS.md` na raiz |

> Não crie arquivos fora desta taxonomia sem motivo explícito. Se um assunto não se encaixa em nenhuma pasta, pergunte antes de inventar uma nova categoria.

---

## 6. Anatomia de uma functional spec (`docs/01-functional-specs/`)

Ao criar ou editar a spec de um módulo, siga esta espinha:

1. **Cabeçalho** — módulo, entidades principais, endpoints cobertos, status (Produção / Experimental).
2. **Propósito do módulo** — o que ele resolve, posição no domínio (§3 deste arquivo).
3. **Entidades e relacionamentos** — tabela de entidades Prisma envolvidas + trecho do ERD relevante.
4. **Regras de negócio** — o que o `application/services/*.service.ts` correspondente realmente faz (não invente regra que o código não impõe).
5. **Endpoints** — tabela: Método | Rota | Request DTO | Regras de validação | Resposta.
6. **Fluxos ilustrativos** — 1–2 cenários ponta a ponta (ex.: "criar iniciativa → aprovar milestone → mover task para Done").
7. **Contratos com outros módulos** — quem referencia quem (ex.: `Contract` referencia `Vendor` e `System`).
8. **Questões em aberto / dívida técnica conhecida.**
9. **Controle de revisões.**

Toda afirmação de regra de negócio numa spec deve ser rastreável a um trecho de `application/services/` ou `domain/services/` — se não está no código, é proposta futura e deve ir para `docs/04-delivery-plan/open-questions.md`, não para a spec como se já existisse.

---

## 7. Comandos essenciais

| Comando | Uso |
|---|---|
| `npm run dev` | Frontend (Vite, porta 5173) |
| `npm run server` / `npm run api:dev` | Compila e sobe a API (porta 3001) |
| `npm run api:build` | Apenas compila o TypeScript da API |
| `npm run api:test` | Testes unitários Jest do backend (`jest.config.ts`) |
| `npm run api:test:e2e` | Testes E2E de API — sobe o `AppModule` completo via supertest, `DB_PROVIDER=inmemory` (`jest.e2e.config.ts`) |
| `npm run api:test:integration` | Testes de integração Prisma contra Postgres local real (`jest.integration.config.ts`) — requer `.env.test.local`, ver `docs/02-system-design/architecture.md` §7 |
| `npm run api:test:performance` | Testes de performance Oracle — mede latência CRUD, bulk ops, pool de conexões (SLA < 50ms) contra instância Oracle real — requer credenciais (`.env.local`) |
| `npm run precommit` | `api:test --coverage` + `build` — gate local antes de commit/PR em mudanças de backend |
| `npm run lint` | ESLint em todo o projeto |
| `npm run build` | `prisma generate` + `tsc -b` + `vite build` |
| `npm run oracle:schema` | Cria o schema (DDL) numa instância Oracle nova |
| `npm run oracle:sync` | Limpa o Oracle e recarrega dados a partir do Supabase |
| `.\start-dev-supabase.ps1` / `.\start-dev-oracle.ps1` | Sobe frontend + backend juntos (Windows/PowerShell) |

Não existe `npm test` — os testes são `npm run api:test` (unitário), `npm run api:test:e2e` (E2E de API) e `npm run api:test:integration` (integração Prisma + Postgres real). O frontend não tem suíte de testes própria neste momento.

## 8. Testes

- Specs unitárias em `src/test/**/*.spec.ts`, espelhando a estrutura de `src/` (`application/services`, `infrastructure/persistence/*`, `presentation/http/controllers`, etc.). Toda dependência é fake (`jest.fn()`/`as any`) — nenhum teste unitário sobe o Nest ou toca banco real.
- Specs E2E em `src/test/e2e/*.e2e-spec.ts`, sobem o `AppModule` real via `@nestjs/testing` + `supertest`, rodando com `DB_PROVIDER=inmemory` (sem banco real, sem Docker). Ver `docs/02-system-design/architecture.md` §7.
- Specs de integração em `src/test/integration/*.integration-spec.ts`, exercitam `Prisma*Repository` reais contra um Postgres local dedicado a testes (nunca o Supabase de produção — D4). Cobrem hoje BusinessUnit, ClientTeam e Initiative; setup e reprodução em `docs/02-system-design/architecture.md` §7.
- **Specs de performance em `src/test/performance/*.performance-spec.ts`** — exercitam `OracleService` e `Oracle*Repository` reais contra uma instância Oracle dedicada, medindo latência (ms), throughput e pool efficiency. Configuração via `jest.performance.config.ts`. SLA: < 50ms para operações CRUD individuais, < 100ms para bulk ops. Requer credenciais Oracle em `.env.local`. Rode via `npm run api:test:performance`.
- **Lacuna conhecida**: sem testes de integração para os demais `Prisma*Repository`, sem testes de performance para Prisma/Supabase.
- Cobertura mínima exigida (`jest.config.ts`): 95% linhas/funções/statements, 70% branches — ver D9 em §4.
- Ao adicionar um método/service novo dentro do escopo de `collectCoverageFrom`, escreva o spec correspondente — a cobertura é enforced, o build falha sem ela.
- Ao mudar um método de repositório, verifique se `src/test/infrastructure/persistence/{prisma,oracle,inmemory}/` cobre a nova assinatura nos três providers.

---

## 9. Convenções de código

- TypeScript estrito; sem `any` desnecessário.
- ESLint: `js.configs.recommended` + `typescript-eslint recommended` + `react-hooks` + `react-refresh` (para `.ts`/`.tsx`).
- Sem regra de negócio em controllers; sem chamadas diretas a banco fora dos repositórios de `infrastructure/persistence`.
- Log estruturado via Pino com `traceId` — não usar `console.log` no backend.
- Toda escrita em `application/services/*.service.ts` que muda dados deve invalidar o prefixo de cache correspondente (`this.cache.invalidatePrefix(...)`) — ver padrão em `initiative.service.ts`.
- Frontend: organização por feature (`modules/<feature>/{pages,services}`), sem estado global (Redux/Zustand) — cada módulo chama a API via `apiClient` diretamente.

---

## 10. Design system — como trabalhar em `docs/03-design-system/`

O Oraculo **não tem um design system formal empacotado** (sem tokens `.json`/`.css` isolados nem componentes core publicados) — os tokens vivem embutidos em `web/src/index.css` como variáveis CSS (`:root`). `docs/03-design-system/tokens.md` documenta esses valores para consulta rápida por agentes; **a fonte de verdade continua sendo `web/src/index.css`** — se o CSS mudar, o doc precisa ser atualizado, não o contrário.

Paleta base (identidade V.tal — accent amarelo):

| Papel | Variável CSS | Valor |
|---|---|---|
| Fundo da aplicação | `--bg-app` | `#E5E7EB` |
| Card / superfície elevada | `--bg-card` | `#FFFFFF` |
| Sidebar (dark) | `--bg-sidebar-dark` | `#2E3238` |
| Accent primário | `--accent-base` | `#FFD919` |
| Texto sobre accent | `--accent-text` | `#181919` |
| Texto primário | `--text-primary` | `#181919` |
| Texto secundário | `--text-tertiary` | `#4B5563` / `#9CA3AF` |
| Status sucesso/aviso/erro | `--status-green` / `--status-amber` / `--status-red` | `#10B981` / `#F59E0B` / `#EF4444` |

Não hardcode cor, espaçamento ou raio de borda em componentes novos — use as variáveis CSS existentes (`--radius-*`, `--shadow-*`, `--transition-*`, `--control-surface*`). Classes utilitárias reaproveitáveis (`.glass-panel`, `.btn-primary`, `.badge-*`, `.data-table`, `.modal-content`, `.view-menu-*`, `.leader-filter-*`, `.header-*`) já existem em `web/src/index.css` — prefira reusá-las a criar CSS novo por página.

**Navegação (D13):** para adicionar/alterar uma visão de página, edite `web/src/config/navigation.ts` (registro de seções, rotas, ícones, filtro de líder e flags de toolbar) e a rota correspondente em `web/src/App.tsx`. `Sidebar`, `Header` e `ViewMenu` derivam tudo do registro — **não** adicione condicional por `location.pathname` no `Header`, e **não** use *segmented control* (pílula) para trocar de visão.

---

## 11. Convenções de escrita e idioma

- **Idioma:** prosa em **português (pt-BR)**; nomes de entidade/campo/rota permanecem em **inglês** (como estão no código — `Initiative`, `Collaborator`, `debtScore`); rótulos de UI e domínio de negócio em português.
- **Formato:** Markdown. Tabelas para mapeamentos e endpoints; prosa para racional; ASCII art para hierarquias.
- **Exemplos de payload:** sempre extraídos ou fielmente baseados nos DTOs reais em `src/application/dtos/`, nunca inventados.
- **Terminologia assumida (sem definir):** iniciativa, milestone, squad/team, debtScore, lifecycle status, SWR (stale-while-revalidate), multi-tenant.

---

## 12. `docs/` é parte da entrega, não um extra opcional

**Toda alteração de código — bugfix, feature nova, refatoração, mudança de endpoint, mudança de regra de negócio — só está completa quando `docs/` reflete o novo estado do sistema.** Isso vale mesmo para tarefas pedidas como "só código" — atualizar a doc correspondente faz parte de terminar a tarefa, não é um passo extra a perguntar depois.

Antes de considerar qualquer tarefa concluída, pergunte-se:

1. **Mudei uma regra de negócio, endpoint, DTO ou entidade?** → atualize a spec funcional correspondente em `docs/01-functional-specs/` (§5, §6 acima) e, se a mudança afeta o schema, `docs/02-system-design/data-model.md`.
2. **Mudei algo estrutural (camada, provider de banco, cache, observabilidade)?** → atualize `docs/02-system-design/architecture.md`.
3. **Corrigi ou introduzi um gap de segurança/dado sensível?** → atualize `docs/02-system-design/security.md`.
4. **Resolvi um item de `technical-backlog.md` ou `open-questions.md`?** → remova/marque o item lá, não deixe a lista mentir sobre o estado atual.
5. **Mudei uma variável CSS, classe utilitária global ou componente comum do frontend?** → atualize `docs/03-design-system/`.
6. **A mudança introduz uma decisão arquitetural nova (padrão a repetir)?** → adicione como nova entrada `D11`, `D12`... em `docs/00-visao-geral/business-rules.md` e/ou na tabela de §4 deste arquivo.

Se nenhuma dessas perguntas se aplica (ex.: correção de digitação, ajuste de estilo sem impacto de contrato), não é necessário mexer em `docs/` — mas essa deve ser uma decisão consciente, não uma omissão por padrão. Em caso de dúvida sobre se algo é "documentável", prefira atualizar a doc a deixá-la desatualizada.

Ao atualizar qualquer arquivo em `docs/`, sempre atualize também a tabela **Controle de revisões** ao final do arquivo.

---

## 13. Guardrails — o que NÃO fazer

- ❌ Não adicione um método de repositório em apenas um provider — os três (`prisma`, `oracle`, `inmemory`) precisam implementar a mesma interface.
- ❌ Não coloque regra de negócio em controller — vai em `application/services`.
- ❌ Não escreva direto no banco fora de `infrastructure/persistence/*`.
- ❌ Não documente uma regra de negócio como existente sem apontar para o trecho de código que a implementa.
- ❌ Não hardcode tokens visuais (cores, espaçamentos, fontes) no frontend — use as variáveis CSS de `web/src/index.css`.
- ❌ Não crie rota, item de menu ou visão fora de `web/src/config/navigation.ts` (D13) — e não volte a usar *segmented control* para troca de visão.
- ❌ Não crie arquivos fora da taxonomia de pastas definida em §2.
- ❌ Não "silencie" o gap de senha em texto plano (§4) sem alinhar com o usuário — é uma mudança sensível (migração de dados).
- ❌ Não entregue uma mudança de código como "pronta" sem passar pelo checklist de §12 — código sem doc atualizada é uma tarefa incompleta, não uma tarefa "só de código".
- ✅ Ao editar uma functional spec, atualize o **Controle de revisões** ao final do arquivo.
- ✅ Ao adicionar uma entidade/campo novo, propague: `schema.prisma` → os três repositórios → DTO → controller → spec funcional relevante.
