# Copilot Instructions

Estas instrucoes devem guiar qualquer alteracao no repositorio.

## Objetivo

- Preservar Clean Architecture + Arquitetura Hexagonal + DDD.
- Evitar regressao para estrutura legada.
- Priorizar compatibilidade de rotas usadas pelo frontend.

## Estrutura obrigatoria

- O backend deve ficar em `src/` na raiz do repositorio.
- Nao recriar `backend/` nem `api/` como origem principal de codigo.
- O frontend deve ficar em `web/`.
- Artefatos de build (`dist/`, `dist-api/`) nao sao fonte de verdade.

## Backend (NestJS)

- Manter API REST com NestJS.
- Manter separacao por camadas:
  - `domain`: entidades e contratos (ports).
  - `application`: casos de uso e services.
  - `infrastructure`: adapters (db, logger, telemetry, gateways).
  - `presentation/http`: controllers e modules.
- Nao introduzir regra de negocio em controller.
- Nao acoplar `domain` a frameworks.

## Rotas e compatibilidade

- Toda rota consumida pelo frontend deve funcionar com prefixo `/api`.
- Evitar quebrar compatibilidade de endpoints legados em migracoes.
- Validar sempre os endpoints criticos apos mudancas:
  - `POST /api/auth/login`
  - `GET /api/collaborators/email/:email`
  - `GET /api/health` ou `GET /healthz`

## Observabilidade e confiabilidade

- Log estruturado com `traceId` (e `spanId` quando disponivel).
- Manter filtro global de excecao.
- Manter OpenTelemetry com exportacao OTLP.
- Manter endpoint de health check (`/healthz`).

## Qualidade

- Atualizar Swagger em mudancas de contrato HTTP.
- Incluir/ajustar testes Jest para novas regras de negocio e rotas.
- Rodar build e testes antes de concluir alteracoes.

## Ambiente local (Windows)

- Em desenvolvimento com Vite, preferir proxy para `http://127.0.0.1:3001`.
- Evitar `localhost` quando houver conflito IPv6 (`::1`) com outro processo.

## DevOps

- Preservar fluxo com Docker e GitHub Actions.
- Nao introduzir dependencia de execucao manual que quebre CI.

## Diretriz de mudanca

- Fazer alteracoes pequenas, focadas e incrementais.
- Nao reformatar codigo sem necessidade.
- Se houver ambiguidade de regra de dominio, documentar suposicao no PR.
