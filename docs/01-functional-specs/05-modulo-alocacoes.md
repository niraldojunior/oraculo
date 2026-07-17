# Módulo 5 — Alocações

> Status: **Produção** (funcionalidade mínima). Entidade: `Allocation`.

## 1. Propósito do módulo

Registrar o percentual de tempo de um colaborador dedicado a uma iniciativa (e opcionalmente a um sistema) num período. É o módulo mais simples do sistema hoje — praticamente sem regra de negócio própria.

## 2. Entidade

```
Allocation
  ├── companyId, departmentId
  ├── collaboratorId                  (Collaborator)
  ├── initiativeId                    (Initiative)
  ├── systemId?                       (System)
  ├── percentage: Int
  ├── startDate, endDate
```

## 3. Regras de negócio

Fonte: `src/application/services/allocation.service.ts`.

- **`allocation.service.ts` expõe apenas `listAllocations()`** — um passthrough de leitura para o repositório, sem filtro de escopo explícito no service (o controller/repositório é quem trata escopo, se tratar).
- **Nenhuma validação de negócio existe na camada de aplicação**: sem checagem de percentual máximo (ex.: soma > 100% por colaborador/período), sem checagem de sobreposição de datas, sem validação cruzada de que `initiativeId`/`systemId` existem.

## 4. Endpoints

| Método | Rota | Query | Descrição |
|---|---|---|---|
| GET | `/allocations`, `/api/allocations` | — | Lista todas as alocações |

Não há endpoints de criação/edição/remoção expostos por controller dedicado hoje — a tela `AllocationsPage` do frontend deve ser tratada como consumidora somente-leitura deste endpoint até que operações de escrita sejam confirmadas/adicionadas (ver [open-questions.md](../04-delivery-plan/open-questions.md)).

## 5. Fluxo ilustrativo

```
1. Colaborador é alocado a uma Initiative (e opcionalmente a um System específico dentro dela) por um percentual e período.
2. AllocationsPage consome GET /allocations para exibir a distribuição de capacidade da equipe.
```

## 6. Contratos com outros módulos

| Módulo | Tipo de consumo | Detalhe |
|---|---|---|
| Organização | Referência | `collaboratorId` |
| Iniciativas | Referência | `initiativeId` |
| Inventário | Referência | `systemId` (opcional) |

## 7. Questões em aberto / dívida técnica conhecida

- **Confirmar se existem endpoints de escrita** (`POST`/`PATCH`/`DELETE`) para `Allocation` que não foram cobertos nesta varredura — se não existirem, `AllocationsPage` provavelmente monta alocações via outro caminho (ex.: parte do payload de `Initiative`) que merece investigação antes de qualquer mudança neste módulo.
- Sem validação de capacidade (percentual total por colaborador/período) — risco de sobrealocação silenciosa.

---

## Controle de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-07-16 | Agente de IA (Claude) | Criação inicial. |
