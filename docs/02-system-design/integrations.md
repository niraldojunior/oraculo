# Integrações Externas

## 1. Azure DevOps

- **Endpoint**: `GET /azure/workitems`, `/api/azure/workitems` (`AzureController`).
- **Query param**: `url` — URL de um work item (epic) do Azure DevOps.
- **Autenticação**: Personal Access Token via env `AZURE_PAT` (obrigatório, sem default — a chamada falha se ausente).
- **Comportamento**: busca o epic informado e seus work items descendentes.
- **Uso no frontend**: `AzureWorkItemsTab.tsx` (`web/src/components/initiative/`), exibido dentro do editor de iniciativa — é uma visão somente-leitura, não há vínculo persistido entre `Initiative` e work items do Azure no schema (`schema.prisma` não tem coluna para isso).
- **Cobertura de teste**: `azure.controller.ts` está explicitamente **excluído** de `collectCoverageFrom` no `jest.config.ts` — não é coberto pelo gate de cobertura obrigatório.

## 2. OpenTelemetry / OTLP

- **Config**: `OTEL_SERVICE_NAME` (default `oraculo-api`), `OTEL_EXPORTER_OTLP_ENDPOINT` (default `http://localhost:4318/v1/traces`), `OTEL_LOG_LEVEL`.
- **Setup**: `src/infrastructure/telemetry/` — instrumentação automática de Express e HTTP (`@opentelemetry/instrumentation-express`, `-http`).
- **Uso**: todo `traceId`/`spanId` em logs estruturados e em respostas de erro (`HttpExceptionFilter`) vem do span ativo desta instrumentação — não há propagação manual de trace id via header customizado.
- **Destino**: qualquer coletor compatível com OTLP HTTP (ex.: Jaeger, Tempo, um coletor OTel local) — não há um backend de observabilidade específico assumido no código; é configurável via endpoint.

## 3. Provedores de banco (não é "integração" no sentido de API externa, mas é conexão externa)

| Provider | Conexão | Env relevantes |
|---|---|---|
| Supabase (Postgres) | Prisma (`DATABASE_URL`, `DIRECT_URL`) | — |
| Oracle Database | Driver `oracledb` direto | `ORACLE_USER`, `ORACLE_PASSWORD`, `ORACLE_CONNECTION_STRING`, `ORACLE_POOL_MIN/MAX/TIMEOUT_SECONDS/PING_INTERVAL_SECONDS` |

Ver [architecture.md §3](architecture.md#3-multi-provider-de-persistência) para a mecânica de cada provider.

## 4. Sem integrações adicionais hoje

Não há, no código atual: SSO/OAuth externo, webhook de saída, fila de mensagens, serviço de email, storage de objeto externo (imagens são servidas via `/api/_img/*`, cuja origem de armazenamento deve ser confirmada em `image.service.ts` antes de assumir S3/blob externo — não investigado nesta varredura).

---

## Controle de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-07-16 | Agente de IA (Claude) | Criação inicial. |
