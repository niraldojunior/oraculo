# Questões em Aberto

Perguntas que não têm resposta definitiva no código atual e precisam de decisão do usuário/produto antes de qualquer implementação relacionada.

| # | Questão | Onde impacta | Status |
|---|---|---|---|
| Q-001 | O módulo `topology` (`web/src/modules/topology/`) existe mas não está roteado em `App.tsx`. É funcionalidade em desenvolvimento, abandonada, ou deveria ser roteada? | Frontend, navegação | Aberta |
| Q-002 | `Allocation` só tem endpoint de leitura (`GET /allocations`). Como alocações são de fato criadas/editadas hoje — via outro fluxo (ex.: parte do payload de `Initiative`), ou é uma lacuna real de CRUD? | [05-modulo-alocacoes.md](../01-functional-specs/05-modulo-alocacoes.md) | Aberta |
| Q-003 | O gap de senha em texto plano (ver [security.md](../02-system-design/security.md)) deve ser corrigido? Se sim, qual a estratégia de migração para usuários já cadastrados? | Auth, `Collaborator` | Aberta |
| Q-004 | `debtScore` de `System` — existe intenção de produto de calculá-lo automaticamente, ou o campo é só um placeholder para preenchimento manual/futuro? | [03-modulo-inventario.md](../01-functional-specs/03-modulo-inventario.md) | Aberta |
| Q-005 | O provider Oracle deve alcançar paridade total com o Prisma/Supabase (viabilizando troca de produção), ou é permanentemente experimental/paralelo para outro caso de uso (ex.: integração com sistemas legados Oracle)? | [architecture.md](../02-system-design/architecture.md) | Aberta |
| Q-006 | `status` de `Contract` (default `"Ativo"`) deveria ser derivado automaticamente de `endDate`, ou continuar sendo um campo editável manualmente? | [04-modulo-fornecedores-contratos.md](../01-functional-specs/04-modulo-fornecedores-contratos.md) | Aberta |

---

## Controle de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-07-16 | Agente de IA (Claude) | Criação inicial. |
