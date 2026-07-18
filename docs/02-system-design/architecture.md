# Arquitetura de Sistema

## 1. Visão geral

```
┌─────────────────────────────┐        HTTP/JSON        ┌──────────────────────────────────┐
│  web/ (React 19 + Vite)     │ ───────────────────────▶ │  src/ (NestJS 11, porta 3001)     │
│  React Router 7, apiClient  │ ◀─────────────────────── │  ValidationPipe + ExceptionFilter │
└─────────────────────────────┘                          └───────────────┬──────────────────┘
                                                                           │
                                            ┌──────────────────────────────┼──────────────────────────────┐
                                            │                              │                              │
                                   presentation/http              application/services         infrastructure/*
                                   controllers + modules          casos de uso, DTOs        cache · log · telemetry
                                            │                              │                              │
                                            └──────────────────────────────┼──────────────────────────────┘
                                                                           │
                                                                  domain/repositories (ports)
                                                                           │
                                        ┌──────────────────────────────────┼──────────────────────────────────┐
                                        │                                  │                                  │
                              infrastructure/persistence/prisma  infrastructure/persistence/oracle  infrastructure/persistence/inmemory
                              PostgreSQL/Supabase (produção)     Oracle Database (experimental)      Map em memória (dev/teste)
```

Servidor único (`main.ts`) expõe a API sob `/api` **e**, em produção, serve o build estático do frontend (`ServeStaticModule`, `rootPath: dist`) com fallback SPA (`SpaFallbackController`) — um único processo Node atende API e frontend compilado.

## 2. Camadas (Clean Architecture)

| Camada | Responsabilidade | Regra de dependência |
|---|---|---|
| `domain/entities` | Tipos de dado puros do negócio | Não importa nada de fora do domínio |
| `domain/repositories` | Interfaces (ports) + tokens de DI (`tokens.ts`) | Não importa `infrastructure`/`presentation` |
| `domain/services` | Regras de domínio puras (ex.: `prioritizeInitiative`) | Só depende de `domain/entities` |
| `application/services` | Casos de uso — orquestram repositório (via interface) + cache | Depende de `domain`, não de `infrastructure` concreta (recebe via DI) |
| `application/dtos` | Contratos de entrada validados (`class-validator`) | — |
| `infrastructure/persistence/*` | Implementações concretas das interfaces de `domain/repositories` | Implementa `domain`, não é importado por `domain` |
| `presentation/http` | Controllers NestJS + módulos (wiring de DI) | Depende de `application/services`, nunca de `infrastructure/persistence` diretamente |

Cada `*.module.ts` em `presentation/http/modules/` faz o binding do token de repositório (`domain/repositories/tokens.ts`) para a implementação concreta selecionada por `DB_PROVIDER` — esse é o ponto de inversão de controle que permite trocar o backend de persistência sem tocar em `application/services` ou controllers.

## 3. Multi-provider de persistência

`DB_PROVIDER` seleciona, em tempo de bootstrap, qual implementação de cada `Repository` interface é injetada fora de produção. Em `NODE_ENV=production`, `env.config.ts` força `supabase` para preservar o Supabase/PostgreSQL como fonte de verdade de PRD; fora de produção, o default local é `oracle` quando `DB_PROVIDER` não é informado.

| Provider | Implementação | Uso | Mecânica |
|---|---|---|---|
| `supabase` | `infrastructure/persistence/prisma/` | **Produção** | Prisma Client (ORM type-safe), pooling e mapeamento de tipos gerenciados pela lib |
| `oracle` | `infrastructure/persistence/oracle/` | Experimental | SQL parametrizado manual via driver `oracledb`, sem ORM |
| `inmemory` | `infrastructure/persistence/inmemory/` | Dev/testes | Estruturas em memória, sem persistência real |

### Diferenças mecânicas Prisma × Oracle

- **Prisma**: cliente gerado a partir de `schema.prisma`, pooling e serialização automáticos, migrações via `prisma migrate`.
- **Oracle** (`oracle.service.ts`):
  - Carrega o módulo `oracledb` via `import()` dinâmico (evita dependência/binding nativo carregado quando Oracle não é o provider ativo).
  - Gerencia o próprio pool de conexões manualmente (`createPool`, configurável via `ORACLE_POOL_MIN/MAX/TIMEOUT_SECONDS/PING_INTERVAL_SECONDS`).
  - Formata explicitamente `outFormat = OUT_FORMAT_OBJECT` e `fetchAsString = [CLOB]`.
  - Expõe apenas dois primitivos — `query<T>(sql, binds)` e `execute(sql, binds)` (com `autoCommit: true` fixo) — sem query builder nem API de transação.
  - Cada chamada abre e fecha (`finally`) uma conexão do pool (`withConnection`).
  - `onModuleDestroy()` drena o pool com timeout de 5s.
  - Repositórios Oracle são hand-rolled SQL por método — sensivelmente maiores que o equivalente Prisma e **sem checagem automática de paridade** entre os dois providers (risco: método novo só implementado no Prisma quebra silenciosamente com `DB_PROVIDER=oracle`).
- **Sincronização Oracle ← Supabase**: `npm run oracle:schema` cria o DDL; `npm run oracle:sync` limpa as tabelas (ordem inversa de FK) e recarrega todos os dados do Supabase — é uma cópia unidirecional, não uma replicação contínua.

## 4. Cache SWR

Implementação própria (não é uma lib) em `src/infrastructure/cache/cache.service.ts`:

- Armazenamento: `Map<string, CacheEntry>` **em memória, por processo** — não é compartilhado entre instâncias (sem Redis).
- `CacheEntry`: `{ value, staleAt, expiresAt, refreshing }`.
- Config via env: `API_CACHE_STALE_MS` (default `60_000`ms) e `API_CACHE_TTL_MS` (default `300_000`ms).
- `getOrFetch(key, factory)`:
  1. Entrada existe e não expirou (`expiresAt`) → retorna imediatamente, mesmo se stale.
  2. Se stale e não há refresh em andamento para a chave → dispara refresh em background via `singleflight`, retorna o valor antigo na mesma chamada.
  3. Sem entrada → executa `factory` de forma síncrona (bloqueia o caller) e armazena o resultado.
- **Singleflight**: chamadas concorrentes para a mesma chave compartilham uma única promise em andamento (`Map` separado `inflight`), evitando N chamadas paralelas ao banco.
- **Invalidação**: `invalidatePrefix(prefix)` remove todas as chaves com prefixo `${prefix}:` — toda escrita em um `application/service` invalida o prefixo inteiro da entidade (não há invalidação seletiva por chave).
- **Eviction**: lazy — uma entrada expirada só é removida no próximo `get()` daquela chave exata; não há sweep/timer de fundo.

## 5. Observabilidade

- **Logs estruturados**: `JsonLoggerService` (Pino) — payload `{ message, context, traceId, spanId, stack }`; `traceId`/`spanId` vêm do span ativo do OpenTelemetry (`trace.getActiveSpan()`).
- **Log de requisição HTTP**: `RequestLoggingMiddleware` loga um evento `http_request` por request finalizado (`method`, `path`, `statusCode`, `durationMs`, `contentLength`).
- **Tracing**: OpenTelemetry + exportação OTLP (`OTEL_EXPORTER_OTLP_ENDPOINT`, default `http://localhost:4318/v1/traces`; `OTEL_SERVICE_NAME`, default `oraculo-api`).
- **Erros**: `HttpExceptionFilter` global padroniza toda resposta de erro em `{ statusCode, message, details?, path, timestamp, traceId }` — `details` só aparece fora de produção para erros que não são `HttpException`.
- **Health checks**: `GET /healthz` (Terminus, inclui indicador de banco) e `GET /health` (legado, `CoreController`).

## 6. Validação de entrada

`ValidationPipe` global (`app.module.ts`): `whitelist: true` (remove campos não declarados no DTO), `transform: true` (converte tipos), `forbidUnknownValues: false`, `enableImplicitConversion: true`. DTOs usam `class-validator`/`class-transformer` em `src/application/dtos/`.

## 7. Camadas de teste

O backend tem duas suítes Jest independentes, com configs e propósitos distintos:

| Suíte | Config | Comando | O que valida |
|---|---|---|---|
| **Unitária** | `jest.config.ts` | `npm run api:test` | Cada classe (service, repositório, controller) isolada, com dependências fake (`jest.fn()`, objetos `as any`). Gate de cobertura obrigatório — ver D9 em `business-rules.md`. Não sobe o Nest, não bate HTTP, não toca banco real. |
| **E2E de API** | `jest.e2e.config.ts` | `npm run api:test:e2e` | Sobe o `AppModule` completo via `@nestjs/testing` + `supertest`, batendo requisições HTTP reais nas rotas (`DTO → controller → service → repositório`). Roda com `DB_PROVIDER=inmemory` (forçado em `src/test/e2e/bootstrap.ts`) — sem banco real, sem Docker. Specs em `src/test/e2e/*.e2e-spec.ts`. |
| **Integração (Prisma + Postgres real)** | `jest.integration.config.ts` | `npm run api:test:integration` | Instancia um `PrismaClient` real e exercita `Prisma*Repository` contra um Postgres local, validando FKs, cascades e JOINs que o mock do Prisma nos testes unitários não captura. Specs em `src/test/integration/*.integration-spec.ts`. |

### Rodando os testes de integração (Prisma + Postgres real)

Requer um Postgres local dedicado a testes — **nunca aponte para o Supabase de produção** (D4). Setup (uma vez, sem precisar de admin — via [Scoop](https://scoop.sh/)):

```powershell
scoop install postgresql   # instala sem privilégio de admin
pg_ctl -D "$(scoop prefix postgresql)\..\..\persist\postgresql\data" start
psql -U postgres -h 127.0.0.1 -c "CREATE DATABASE oraculo_test;"
```

Crie `.env.test.local` (git-ignorado, via padrão `*.local`) na raiz do repo:

```dotenv
DATABASE_URL="postgresql://postgres@127.0.0.1:5432/oraculo_test"
DIRECT_URL="postgresql://postgres@127.0.0.1:5432/oraculo_test"
```

Aplique o schema no banco de teste (não usa migrations — projeto é schema-first via `db push`):

```powershell
$env:DATABASE_URL="postgresql://postgres@127.0.0.1:5432/oraculo_test"
$env:DIRECT_URL="postgresql://postgres@127.0.0.1:5432/oraculo_test"
npx prisma db push --schema=src/infrastructure/persistence/prisma/schema.prisma --skip-generate
```

Depois disso, `npm run api:test:integration` carrega `.env.test.local` automaticamente (via `src/test/integration/env-setup.ts`) e roda `--runInBand` (serial, já que os specs truncam as tabelas entre testes — paralelismo causaria corrida entre suítes).

**Limitação conhecida:** cobre apenas os repositórios Prisma (BusinessUnit, ClientTeam, Initiative até o momento — os demais `Prisma*Repository` seguem sem cobertura de integração). Não há testes de integração com Oracle real nem suíte de performance/carga. Ver `docs/04-delivery-plan/technical-backlog.md`.

## 8. Referências

- Modelo de dados completo: [data-model.md](data-model.md)
- Integrações externas: [integrations.md](integrations.md)
- Segurança e gaps conhecidos: [security.md](security.md)

---

## Controle de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-07-18 | Agente de IA (Claude) | Adiciona à §7 a suíte de integração Prisma + Postgres real (`jest.integration.config.ts`, `src/test/integration/`), com setup reproduzível via Scoop (sem admin). |
| 2026-07-18 | Agente de IA (Codex) | Documenta a resolução de provider: produção força `supabase`; ambientes não produtivos podem usar `oracle` via `DB_PROVIDER` e têm default local Oracle. |
| 2026-07-18 | Agente de IA (Claude) | Adiciona §7 Camadas de teste, documentando a suíte E2E de API (`jest.e2e.config.ts`, `src/test/e2e/`) introduzida sobre o provider `inmemory`. |
| 2026-07-16 | Agente de IA (Claude) | Criação inicial. |
