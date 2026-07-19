# Roadmap

> Este roadmap reflete o que se observa em andamento pelo estado do repositório (branch ativa, commits recentes), não um plano formal aprovado. Atualize conforme decisões reais de priorização forem tomadas com o usuário.

## Em andamento

- **Suporte a Oracle como segundo provider de banco** (branch `Oracle-Support`) — repositórios Oracle já existem para todas as entidades (`src/infrastructure/persistence/oracle/`), scripts de schema/sync (`npm run oracle:schema`, `npm run oracle:sync`) já existem. Tratar como **experimental** até paridade de comportamento com o provider Prisma ser validada por teste (ver [technical-backlog.md](technical-backlog.md)).
- **PWA** — shell offline e prompt de instalação (`web/src/shared/pwa/`) já implementados; ícones em `web/public/pwa-icons/`. Atualização de versão é silenciosa (`autoUpdate`); o antigo prompt "Nova versão disponível" foi removido por causar loop de refresh em produção.

## Concluído recentemente (histórico de commits)

- Seletor de períodos no dashboard para iniciativas encerradas.
- Testes unitários para `OracleService`, `PrismaService` e diversos controllers.
- Refatoração para Clean Architecture (commit "Refatoração para clean arch") — base da estrutura atual documentada em [architecture.md](../02-system-design/architecture.md).
- Mecanismo de cache (`CacheService`, SWR).

## Candidatos a próximo ciclo (não confirmados — ver open-questions.md)

- Fechar o gap de autenticação (hash de senha + guard de autorização no backend) — ver [security.md](../02-system-design/security.md).
- Validar/expor operações de escrita para `Allocation` (hoje só leitura) — ver [05-modulo-alocacoes.md](../01-functional-specs/05-modulo-alocacoes.md).
- Definir e implementar cálculo de `debtScore` para `System`, se o produto depende desse indicador.
- Confirmar status do módulo `topology` (não roteado hoje).

---

## Controle de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-07-19 | Agente de IA (Claude) | PWA: prompt de atualização removido em favor de `autoUpdate` silencioso. |
| 2026-07-16 | Agente de IA (Claude) | Criação inicial, a partir do estado do git e da estrutura do código. |
