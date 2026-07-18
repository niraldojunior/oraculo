# Regras de negócio transversais e decisões arquiteturais

> Todas as regras abaixo são **extraídas do código atual**, com referência ao arquivo/linha de origem. Se uma regra aqui descrita não corresponder mais ao código, o código está certo — corrija este documento. Para as decisões arquiteturais de mais alto nível (D1–D10), ver [AGENTS.md](../../AGENTS.md#4-decisões-arquiteturais--como-o-sistema-é-hoje).

## 1. Escopo multi-departamento (Company → Department)

Praticamente toda listagem é filtrada por `{ companyId, departmentId }` opcionais — quando omitidos, retornam todos os registros visíveis ao usuário. Não há enforcement de autorização por escopo na camada de serviço: o filtro é uma conveniência de consulta, não um controle de acesso (o frontend decide o que passar). Ver `initiative.service.ts` (`listByScope`), controllers de `absence`, `contract`, `initiative`, `skill`, `system`, `vendor`.

## 2. Iniciativas (`initiative.service.ts`)

- **Sem máquina de estados de status.** Não há tabela de transições permitidas/proibidas — `status` é sobrescrito livremente em qualquer `PATCH /initiatives/:id`, junto com qualquer outro campo do payload (spread bruto: `{ ...current, ...payload }`).
- **Histórico é append-only com dedup por `id`.** `update()` mescla `payload.history` no histórico atual, adicionando apenas entradas cujo `id` ainda não existe (`initiative.service.ts:59-73`). Não existe endpoint dedicado para "adicionar entrada de histórico" — é sempre parte do payload de update.
- **Milestones são mescladas por `id`, com suporte a remoção via `removedMilestoneIds`.** O merge usa um `Map` chaveado por id; milestones cujo id está em `payload.removedMilestoneIds` são removidas tanto do conjunto atual quanto do incoming antes do merge; resultado final ordenado por campo `order` (`initiative.service.ts:63-89`).
- **Reprioritização é um setter puro.** `PATCH /initiatives/:id/priority` chama `prioritizeInitiative()`, que apenas faz `{ ...initiative, priority: nextPriority }` — não existe reordenação automática de outras iniciativas da mesma fila (`src/domain/services/PrioritizeInitiative.ts`).
- **Toda escrita invalida o cache** com prefixo `initiatives` (`create`, `update`, `delete`, `reprioritize`).

## 3. Sanitização de payload (padrão repetido em vários services)

Vários `application/services/*.service.ts` aplicam um sanitizador antes de persistir — não é regra de negócio no sentido de validação, é normalização de dados vindos do formulário:

| Service | Regra |
|---|---|
| `organization.service.ts` (`sanitizeTeam`) | `parentTeamId`/`leaderId` com string vazia → `null` |
| `organization.service.ts` (`sanitizeCollaborator`) | Campos de data vazios (`squadId`, `vacationStart`, `startDate`, `endDate`, `birthday`) → `null`; normalização de `role`: `'VP'` → `'Head'`, `'Engineer/Analyst'`/`'ENGINEER/ANALYST'` → `'Engineer'` (aplicada também na leitura via `listCollaboratorsByScope`) |
| `organization.service.ts`, `company.service.ts`, `vendor.service.ts` | Se `photoUrl`/`logo`/`logoUrl` já aponta para `/api/_img/...` (URL servida pelo próprio backend), o campo é removido do payload de update — evita persistir a própria URL de leitura como se fosse um novo upload |
| `system.service.ts` (`sanitize`) | `ownerTeamId` com string vazia → `null` |

## 4. Ausências de validação conhecidas (não é bug a "descobrir" — é estado atual documentado)

Estas services são **CRUD puro, sem regra de negócio**, apesar de o domínio sugerir que poderiam ter:

- `allocation.service.ts` — sem checagem de percentual máximo por colaborador/período, sem checagem de sobreposição de datas.
- `absence.service.ts` — sem checagem de sobreposição de ausências para o mesmo colaborador, sem validação `startDate < endDate`.
- `holiday.service.ts` — sem checagem de duplicidade de data.
- `contract.service.ts` — sem lógica de expiração/renovação; `status` (default `"Ativo"` no schema) é um campo livre, não derivado de `endDate`.
- `system.service.ts` — sem cômputo de `debtScore`; campo existe no schema (`Float @default(0)`) mas é setado manualmente/via seed, não calculado pela aplicação.

Se uma dessas regras for implementada no futuro, ela deve ser documentada aqui e referenciada na spec funcional do módulo correspondente.

## 5. Cache — invalidação, não revalidação seletiva

Toda operação de escrita invalida **o prefixo inteiro** da entidade (`cache.invalidatePrefix('initiatives')`, etc.), não uma chave específica. Isso significa que uma escrita em uma iniciativa invalida todas as listagens cacheadas daquela entidade (todos os escopos), forçando refresh no próximo `getOrFetch`. Ver [architecture.md §Cache](../02-system-design/architecture.md#cache-swr) para o mecanismo completo.

## 6. Autenticação — estado atual (ver também [security.md](../02-system-design/security.md))

- `AuthService.login()` compara senha em **texto plano** (`user.password !== password`), sem hashing.
- Não há emissão de token/sessão no backend — `login()` retorna o objeto do usuário diretamente; a persistência de sessão (ex.: localStorage) é responsabilidade do frontend (`AuthContext`).
- Existe apenas um tipo de usuário (`type: 'collaborator'` fixo em `LoginResult`).

## 7. Providers de persistência — paridade obrigatória, não automática

Toda interface em `domain/repositories/` precisa de implementação em `prisma/`, `oracle/` e `inmemory/`. **Não há checagem automática de paridade** (nenhum teste de contrato compartilhado entre os três providers no momento) — a consistência depende de disciplina manual ao estender uma interface. Isso é um risco conhecido: um método adicionado só no Prisma quebra silenciosamente em runtime com `DB_PROVIDER=oracle`.

## 8. Área cliente e Unidade de Negócio — associação por nome, unidade derivada (D11)

- A **área cliente** (entidade `ClientTeam`, rotulada "Demandante") pode pertencer a uma **Unidade de Negócio** (`BusinessUnit`) via `ClientTeam.businessUnitId` (opcional).
- **Uma iniciativa NÃO referencia a área cliente por FK**: guarda apenas o **nome** da área no campo string `Initiative.originDirectorate`. A Unidade de Negócio é **derivada em tempo de exibição** através da `ClientTeam` de mesmo nome — **nunca** é gravada na iniciativa. Isso preserva as iniciativas legadas (que já gravavam o nome livre) e evita migração de dados de iniciativas.
- Exibição/seleção montam o rótulo `"Unidade de Negócio > Cliente"` no frontend (`web/src/modules/initiatives/clientAreaLabel.ts` + `useClientAreas.ts`), com fallback para o nome cru quando a área não tem unidade ou não é encontrada.
- Fonte: `src/application/services/client-team.service.ts`, `business-unit.service.ts`; schema em `src/infrastructure/persistence/prisma/schema.prisma` (models `BusinessUnit`, `ClientTeam`).

---

## Controle de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-07-16 | Agente de IA (Claude) | Criação inicial, extraída de `src/application/services/*.service.ts` e `src/domain/services/PrioritizeInitiative.ts`. |
| 2026-07-17 | Agente de IA (Claude) | Adição de §8 / decisão **D11** — área cliente (`ClientTeam`) agrupada por Unidade de Negócio (`BusinessUnit`); iniciativa associa-se por nome (`originDirectorate`), unidade derivada. |
