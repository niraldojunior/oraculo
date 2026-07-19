# Product Overview — Oraculo

> Status: **Produção** (provider Supabase/Prisma) + **Experimental** (provider Oracle). Última revisão: ver [Controle de revisões](#controle-de-revisões).

## 1. O que é o Oraculo

O Oraculo é uma plataforma web de **gestão de portfólio de TI**. Centraliza, para uma organização de tecnologia, a governança de:

- **Iniciativas** — projetos/demandas de TI, do pedido até a entrega, com milestones, tarefas, histórico de status e comentários.
- **Organização** — empresas, departamentos, times e colaboradores, com skills e ausências.
- **Inventário de sistemas** — aplicações mantidas, com criticidade, ciclo de vida e dívida técnica.
- **Fornecedores e contratos** — vendors, contratos vinculados a sistemas, custo anual.
- **Alocações** — percentual de tempo de um colaborador dedicado a uma iniciativa/sistema num período.

O sistema é usado internamente por uma organização de TI (não é multi-cliente/SaaS externo) — o particionamento de dados é por **Company → Department**, refletindo a estrutura organizacional de quem opera o Oraculo, não uma base de clientes externos.

## 2. Personas

| Persona | O que faz no sistema | Rota principal |
|---|---|---|
| **Colaborador comum** | Vê dashboard, iniciativas do seu departamento, board de tarefas atribuídas a ele, inventário e organograma. | `/`, `/iniciativas`, `/tarefas` |
| **Líder / gestor de iniciativa** | Cria e edita iniciativas, gerencia milestones/tarefas, reprioriza a fila do departamento, aprova histórico de status. | `/iniciativas/:id/edit` |
| **Admin** (`isAdmin: true` no colaborador) | Acesso à área administrativa: empresas, departamentos, fornecedores, alocações. | `/admin` (rota protegida por `adminOnly`) |

A autenticação identifica apenas colaboradores (`type: 'collaborator'` fixo em `LoginResult` — não há hoje um segundo tipo de usuário/persona no domínio de auth).

## 3. Módulos funcionais

| Módulo | Entidade raiz | Spec funcional |
|---|---|---|
| Iniciativas | `Initiative` (+ Milestone, MilestoneTask, History, Comment) | [01-modulo-iniciativas.md](../01-functional-specs/01-modulo-iniciativas.md) |
| Organização | `Company`, `Department`, `Team`, `Collaborator`, `Skill`, `Absence` | [02-modulo-organizacao.md](../01-functional-specs/02-modulo-organizacao.md) |
| Inventário | `System` | [03-modulo-inventario.md](../01-functional-specs/03-modulo-inventario.md) |
| Fornecedores & Contratos | `Vendor`, `Contract` | [04-modulo-fornecedores-contratos.md](../01-functional-specs/04-modulo-fornecedores-contratos.md) |
| Alocações | `Allocation` | [05-modulo-alocacoes.md](../01-functional-specs/05-modulo-alocacoes.md) |
| Admin & Auth | `Auth`, área `/admin` | [06-modulo-admin-auth.md](../01-functional-specs/06-modulo-admin-auth.md) |

## 4. Telas do frontend (rotas)

| Rota | Página | Módulo |
|---|---|---|
| `/` | `DashboardPage` | Indicadores consolidados e visão de portfólio por Unidade de Negócio / Área Cliente |
| `/organizacao` | `OrganizationPage` | Organograma de times |
| `/colaboradores` | `CollaboratorsPage` | Listagem de colaboradores |
| `/inventario` | `InventoryPage` / `InventoryDetailPage` | Inventário de sistemas |
| `/iniciativas` | `InitiativesPage` | Cards/tabela/timeline de iniciativas |
| `/iniciativas/:id/edit` | `InitiativeEditPage` | Editor de iniciativa (milestones, tarefas, histórico, comentários) |
| `/fornecedores` | `VendorsPage` | Fornecedores e contratos |
| `/tarefas` | `TasksPage` | Board de tarefas (`MilestoneTask`) |
| `/alocacoes` | `AllocationsPage` | Alocação de colaboradores |
| `/admin` | `AdminPage` | Área administrativa (`adminOnly`) |
| `/login` | `LoginPage` | Autenticação |

Há também um módulo `topology` (`web/src/modules/topology/`) sem rota registrada em `App.tsx` no momento — trate como funcionalidade em desenvolvimento, não como tela ativa (ver [open-questions.md](../04-delivery-plan/open-questions.md)).

## 5. Como o sistema é operado

- **Banco ativo trocável em runtime** via `DB_PROVIDER` (`supabase` | `oracle` | `inmemory`) — ver [architecture.md](../02-system-design/architecture.md).
- **PWA instalável** — offline shell, prompt de instalação/atualização (`web/src/shared/pwa/`).
- **Integração com Azure DevOps** — `GET /api/azure/workitems` busca um epic e seus work items descendentes via PAT (`AZURE_PAT`).
- **Observabilidade** — OpenTelemetry + exportação OTLP, logs estruturados Pino com `traceId`.

## 6. Fora de escopo (não existe hoje)

- Autenticação multi-tenant externa / SSO — auth é local, colaborador único (ver [security.md](../02-system-design/security.md)).
- Motor de priorização automática de iniciativas — `priority` é um inteiro setado manualmente via `PATCH /initiatives/:id/priority` (ver [PrioritizeInitiative.ts](../../src/domain/services/PrioritizeInitiative.ts)), sem algoritmo de scoring.
- Cálculo automático de `debtScore` de sistemas — o campo existe no schema mas não há lógica de cômputo na camada de aplicação hoje.
- Validação de sobreposição de datas em ausências/alocações.

---

## Controle de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-07-18 | Codex | Registro da visão de portfólio no dashboard, agrupada por Unidade de Negócio e Área Cliente. |
| 2026-07-16 | Agente de IA (Claude) | Criação inicial do documento, derivado do código em `src/` e `web/src/` na branch `Oracle-Support`. |
