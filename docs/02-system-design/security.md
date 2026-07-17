# Segurança

> Este documento descreve o estado **atual** de segurança do sistema, incluindo gaps conhecidos. Não é um plano de hardening — mudanças aqui listadas como "gap" exigem alinhamento explícito com o usuário antes de implementação, pois algumas envolvem migração de dados (ver [AGENTS.md §12](../../AGENTS.md#12-guardrails--o-que-não-fazer)).

## 1. Autenticação

- Mecanismo: `POST /auth/login` (`AuthService.login`), compara email (normalizado) e senha contra o registro de `Collaborator`.
- **Gap crítico: senha em texto plano.** `user.password !== password` — não há hashing (bcrypt/argon2/scrypt) em nenhum ponto do fluxo de login nem de criação/atualização de colaborador (`organization.service.ts` não trata `password` de forma especial). Isso significa que a senha é armazenada e comparada em claro no banco.
  - **Impacto**: qualquer acesso de leitura ao banco (dump, backup exposto, acesso indevido) expõe todas as senhas diretamente.
  - **Ação recomendada** (não implementada): migrar para hash (ex.: bcrypt) com um script de migração único que re-hasheia senhas existentes — mudança sensível, não fazer sem alinhamento explícito.
- **Sem emissão de token/sessão no backend.** Não há JWT, cookie de sessão assinado, ou refresh token. O backend não tem estado de sessão — cada request é, na prática, não-autenticado do ponto de vista do servidor (ver §2).

## 2. Autorização

- **Não há guard de autenticação/autorização no backend.** Nenhum dos controllers investigados usa `@UseGuards`, JWT middleware ou verificação de header `Authorization`. A "proteção" de rotas (`/admin`, área autenticada) é feita **inteiramente no frontend** (`ProtectedRoute` em `App.tsx`, baseado em `isAdmin`/`user` mantidos em `AuthContext`, presumivelmente `localStorage`).
- **Implicação prática**: qualquer cliente HTTP que conheça a URL da API pode chamar todos os endpoints (listar/criar/editar/remover `Company`, `Department`, `Initiative`, etc.) sem apresentar credencial alguma — a API não distingue usuário autenticado de anônimo, nem admin de colaborador comum.
- Isso é adequado apenas se a API não for exposta publicamente (ex.: atrás de VPN/rede interna) — se houver plano de exposição externa, este é o gap prioritário a fechar antes de qualquer outra melhoria de segurança.

## 3. Dados sensíveis

- `Collaborator.password` — texto plano (ver §1).
- `Collaborator.phone`, `.bio`, `.birthday`, `.uf` — dados pessoais sem classificação/mascaramento especial na API (retornados integralmente em `GET /collaborators`, exceto quando `lite=true`, que retorna payload reduzido — verificar `organization.service.ts` para o shape exato do modo `lite`).
- `Contract.annualCost` — dado financeiro sem controle de visibilidade por papel (qualquer chamada de `GET /contracts` retorna o valor).

## 4. Validação de entrada

- `ValidationPipe` global com `whitelist: true` remove campos não declarados no DTO — proteção básica contra mass assignment de campos inesperados, mas `forbidUnknownValues: false` significa que valores desconhecidos não geram erro explícito (apenas são descartados).
- DTOs cobrem os campos declarados; regras de negócio mais finas (ex.: formato de data, unicidade) não são sempre validadas na camada de DTO — ver [business-rules.md](../00-visao-geral/business-rules.md) para o que efetivamente é ou não validado por entidade.

## 5. Erros e vazamento de informação

- `HttpExceptionFilter` esconde `details` (mensagem de erro interna) em produção (`NODE_ENV === 'production'`) para exceções que não são `HttpException` — comportamento correto, evita vazar stack trace/mensagem interna para o cliente em produção.
- `traceId` é incluído em toda resposta de erro — útil para correlação, não é sensível por si só.

## 6. Segredos / configuração

- Segredos de banco e integrações (`DATABASE_URL`, `ORACLE_PASSWORD`, `AZURE_PAT`) são lidos via variáveis de ambiente (`.env.local`, não versionado) — sem integração com um cofre de segredos (Vault, AWS Secrets Manager etc.) identificada no código.

## 7. Resumo — prioridade dos gaps

| # | Gap | Severidade | Requer migração de dados? |
|---|---|---|---|
| 1 | Senha em texto plano | Crítica | Sim |
| 2 | Sem autorização/autenticação real no backend (proteção só de UI) | Crítica se exposto externamente | Não (é adição de guard, não migração) |
| 3 | Sem paginação em listagens grandes (ver [non-functional-requirements.md](non-functional-requirements.md)) | Baixa (operacional, não segurança) | Não |

---

## Controle de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-07-16 | Agente de IA (Claude) | Criação inicial, a partir de `auth.service.ts`, controllers e `App.tsx`. |
