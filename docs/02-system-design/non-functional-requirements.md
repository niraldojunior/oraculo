# Requisitos Não-Funcionais

> Este documento descreve o que o sistema **efetivamente garante hoje**, não metas aspiracionais de SLA. Onde não há garantia mecanizada, isso está marcado explicitamente.

## 1. Performance / Cache

- Cache SWR in-memory por processo (ver [architecture.md §4](architecture.md#4-cache-swr)): leituras servidas imediatamente do cache (mesmo stale) dentro do TTL (`API_CACHE_TTL_MS`, default 5min); refresh em background após `API_CACHE_STALE_MS` (default 60s).
- **Não há cache compartilhado entre instâncias** — se o backend rodar com múltiplas réplicas, cada uma mantém seu próprio cache in-memory, podendo servir dados stale de forma inconsistente entre réplicas até a próxima escrita/expiração local.
- Singleflight evita chamadas duplicadas ao banco para a mesma chave sob concorrência.

## 2. Escala

- Sem particionamento/sharding de dados — todo o volume de uma organização vive num único banco (Postgres/Supabase em produção).
- Sem paginação nos endpoints de listagem investigados (`GET /initiatives`, `/systems`, `/collaborators` etc. retornam a lista completa filtrada por escopo) — em volumes grandes, isso é um limite de escala conhecido a observar.
- Provider Oracle usa pool de conexões configurável (`ORACLE_POOL_MIN/MAX`), mas sem retry/circuit breaker explícito em `oracle.service.ts`.

## 3. Disponibilidade

- Health checks: `GET /healthz` (Terminus + indicador de banco) e `GET /health` (legado).
- Sem circuit breaker, retry automático ou fallback entre providers de banco — se `DB_PROVIDER` aponta para um banco indisponível, a aplicação falha nas chamadas até o banco voltar.
- Servidor único processa API + assets estáticos do frontend — não há separação de processo entre os dois no runtime de produção padrão.

## 4. Observabilidade

- Tracing distribuído via OpenTelemetry/OTLP; logs estruturados com `traceId` correlacionado ao span ativo (ver [architecture.md §5](architecture.md#5-observabilidade)).
- Sem métricas de negócio expostas (ex.: Prometheus `/metrics`) identificadas no código — apenas tracing e logs.

## 5. Testabilidade

- Cobertura de testes é gate obrigatório: 95% linhas/funções/statements, 70% branches sobre o escopo definido em `collectCoverageFrom` do `jest.config.ts` (ver [AGENTS.md §4, D9](../../AGENTS.md#4-decisões-arquiteturais--como-o-sistema-é-hoje)).
- `azure.controller.ts` e `health.controller.ts` estão fora do gate de cobertura.
- Provider `inmemory` existe especificamente para permitir testes/dev sem dependência de banco real.

## 6. Compatibilidade de dispositivo (frontend)

- PWA instalável com shell offline (`vite-plugin-pwa`/Workbox) e prompts de instalação/atualização (`web/src/shared/pwa/`).
- Layout responsivo com breakpoint mobile em `768px` — sidebar vira navegação inferior fixa (ver `web/src/index.css`, bloco `@media (max-width: 768px)`).

## 7. Portabilidade de banco

- Multi-provider por design (`DB_PROVIDER`), mas **sem teste de contrato compartilhado** garantindo paridade de comportamento entre `prisma`, `oracle` e `inmemory` — a paridade depende de disciplina manual (ver [business-rules.md §7](../00-visao-geral/business-rules.md#7-providers-de-persistência--paridade-obrigatória-não-automática)).

---

## Controle de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-07-16 | Agente de IA (Claude) | Criação inicial. |
