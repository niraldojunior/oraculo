# Módulo 3 — Inventário de Sistemas

> Status: **Produção**. Entidade: `System`.

## 1. Propósito do módulo

Manter o inventário de sistemas/aplicações mantidos pela organização de TI, com metadados de governança: criticidade, ciclo de vida, dívida técnica, time responsável e documentação técnica associada.

## 2. Entidade

```
System
  ├── companyId, departmentId       (escopo)
  ├── name, category, description
  ├── criticality                    (string livre)
  ├── lifecycleStatus                (string livre)
  ├── debtScore: Float (default 0)   (não calculado pela aplicação hoje)
  ├── ownerTeamId                    (Team)
  ├── environments: Json?
  ├── contextFiles: Json?
  ├── technicalSkills: Json?
  ├── responsibleCollaborators: Json?
  └── Contract[]
```

Os campos `environments`, `contextFiles`, `technicalSkills` e `responsibleCollaborators` são `Json` livres — não têm schema tipado no Prisma; a estrutura interna é definida pelo frontend (`InventoryDetailPage`) e pelos DTOs em `src/application/dtos/inventory.dto.ts` / `system.dto.ts`.

## 3. Regras de negócio

Fonte: `src/application/services/system.service.ts`.

- `getSystemById` lança `NotFoundException('System not found')` se o id não existir.
- Sanitização única: `ownerTeamId` com string vazia vira `null`.
- **Sem cômputo de `debtScore`** — o campo existe e é persistido, mas nenhuma regra de negócio no `application/services` calcula ou atualiza seu valor automaticamente (setado manualmente/via seed ou pelo próprio payload de update).
- **Sem validação de `criticality`/`lifecycleStatus` contra uma lista fechada** — são strings livres vindas do frontend.

## 4. Endpoints

| Método | Rota | Query / Body | Descrição |
|---|---|---|---|
| GET | `/systems`, `/api/systems` | `companyId?`, `departmentId?` | Lista sistemas |
| GET | `/systems/:id` | — | Detalhe de um sistema |
| POST | `/systems` | `CreateSystemDto` | Cria sistema |
| PATCH | `/systems/:id` | — | Atualiza sistema |
| DELETE | `/systems/:id` | — | Remove sistema |
| GET | `/inventory-context`, `/api/inventory-context` | `companyId?`, `departmentId?` | Contexto agregado de inventário (usado por telas de listagem/dashboard) |

## 5. Fluxo ilustrativo — cadastro e ciclo de vida de um sistema

```
1. Time cadastra System com criticality, lifecycleStatus e ownerTeamId (POST /systems).
2. Contratos de fornecedores são vinculados ao sistema (Contract.systemId).
3. Iniciativas referenciam o sistema via impactedSystemIds / milestone.systemId.
4. Alterações de ciclo de vida (ex.: "Em Produção" → "Descontinuado") são feitas via PATCH manual — sem workflow guiado.
```

## 6. Contratos com outros módulos

| Módulo | Tipo de consumo | Detalhe |
|---|---|---|
| Fornecedores & Contratos | Referência | `Contract.systemId` |
| Iniciativas | Referência | `Initiative.impactedSystemIds[]`, `InitiativeMilestone.systemId`, `MilestoneTask.systemId`/`systemIds[]` |
| Organização | Referência | `System.ownerTeamId` aponta para `Team` |

## 7. Questões em aberto / dívida técnica conhecida

- `debtScore` sem lógica de cálculo — se o produto pretende exibi-lo como indicador confiável, precisa de uma regra explícita (ex.: derivada de idade do sistema, número de incidentes, cobertura de testes).
- Campos `Json` livres (`environments`, `contextFiles`, `technicalSkills`, `responsibleCollaborators`) não têm validação de shape no backend — divergências de formato entre registros são possíveis.

---

## Controle de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-07-16 | Agente de IA (Claude) | Criação inicial. |
