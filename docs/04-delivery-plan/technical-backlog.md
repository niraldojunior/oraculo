# Backlog Técnico

> Itens de dívida técnica identificados por leitura direta do código, organizados por módulo/camada. Não são compromissos — são candidatos a priorização.

## Segurança (ver [security.md](../02-system-design/security.md))

- [ ] Hash de senha de colaborador (hoje texto plano em `auth.service.ts`) — requer script de migração de dados existentes.
- [ ] Guard de autenticação/autorização no backend — hoje toda proteção de rota é só no frontend (`ProtectedRoute`).

## Persistência multi-provider

- [ ] Teste de contrato compartilhado entre `prisma`, `oracle` e `inmemory` para cada `Repository` interface — hoje não há garantia automática de paridade (ver [business-rules.md §7](../00-visao-geral/business-rules.md#7-providers-de-persistência--paridade-obrigatória-não-automática)).
- [ ] Confirmar estratégia de mapeamento de `String[]` (arrays nativos do Postgres) no provider Oracle, que não tem array nativo — verificar `OracleInitiativeRepository.ts`.

## Módulo Iniciativas

- [ ] Avaliar se `status`/`previousStatus` deveriam ter uma máquina de estados explícita (hoje qualquer transição é aceita).
- [ ] Avaliar critério de cálculo de `priority` (hoje puramente manual, sem scoring).

## Módulo Inventário

- [ ] Definir e implementar cálculo de `debtScore` (hoje persistido mas nunca calculado pela aplicação).
- [ ] Validar schema dos campos `Json` livres (`environments`, `contextFiles`, `technicalSkills`, `responsibleCollaborators`) — hoje sem validação de shape.

## Módulo Fornecedores & Contratos

- [ ] Derivar `Contract.status` de `endDate` (hoje campo livre, não reflete vencimento automaticamente).
- [ ] Alerta de contrato próximo do vencimento.

## Módulo Organização

- [ ] Validação de sobreposição de datas em `Absence`.
- [ ] Mover lógica de atribuição de `masterUserId` do departamento da camada de repositório para `application/services`, por consistência com o restante do módulo.

## Módulo Alocações

- [ ] Confirmar se existem endpoints de escrita para `Allocation` fora do que foi encontrado nesta varredura (hoje só `GET /allocations`).
- [ ] Validação de capacidade (percentual total por colaborador/período).

## Observabilidade

- [ ] Considerar cache compartilhado (Redis) se o backend rodar com múltiplas réplicas — hoje o cache SWR é in-memory por processo.
- [ ] Paginação em endpoints de listagem de alto volume.

---

## Controle de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-07-16 | Agente de IA (Claude) | Criação inicial. |
