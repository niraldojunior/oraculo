# Módulo 4 — Fornecedores & Contratos

> Status: **Produção**. Entidades: `Vendor`, `Contract`.

## 1. Propósito do módulo

Gerenciar fornecedores externos (vendors) e os contratos firmados com eles, opcionalmente vinculados a um sistema do inventário, com custo anual e responsável (líder do contrato).

**Telas (item de menu "Produtos" › grupo Serviços):** `/produtos/servicos/fornecedores` e `/produtos/servicos/contratos`, servidas por `VendorsPage` com a aba vinda da rota via prop `tab` (D13). O mesmo grupo abriga `/produtos/servicos`, uma visão "Serviços" ainda **não especificada** (placeholder `ServicesPage`) — ver [open-questions.md](../04-delivery-plan/open-questions.md).

## 2. Entidades e relacionamentos

```
Vendor
  ├── companyId, departmentId
  ├── companyName, taxId, type, logoUrl
  ├── directorId, managerId          (Collaborator)
  └── Contract[]

Contract
  ├── companyId, departmentId
  ├── vendorId                        (Vendor)
  ├── systemId?                       (System)
  ├── leaderId?                       (Collaborator)
  ├── number, startDate, endDate, model
  ├── annualCost: Float
  └── status: String (default "Ativo")
```

## 3. Regras de negócio

Fonte: `src/application/services/vendor.service.ts`, `contract.service.ts`.

- **`contract.service.ts` é CRUD puro** — sem sanitização, sem lógica de expiração/renovação. `status` é um campo livre (default `"Ativo"` no schema), não derivado de `endDate` — um contrato vencido não muda de status automaticamente.
- **`vendor.service.ts`**: sanitiza `logoUrl` da mesma forma que `photoUrl`/`logo` em outros módulos (remove do payload se já for uma URL `/api/_img/...`). Expõe `getVendorsContext(scope)` para leitura agregada.

## 4. Endpoints

| Método | Rota | Query / Body | Descrição |
|---|---|---|---|
| GET | `/vendors`, `/api/vendors` | `companyId?`, `departmentId?` | Lista fornecedores |
| GET | `/vendors/context`, `/vendors-context`, `/api/vendors-context` | `companyId?`, `departmentId?` | Contexto agregado (rotas de compatibilidade) |
| POST/PATCH/DELETE | `/vendors/:id` | — | Cria/atualiza/remove fornecedor |
| GET | `/contracts`, `/api/contracts` | `companyId?`, `departmentId?` | Lista contratos |
| POST/PATCH/DELETE | `/contracts/:id` | — | Cria/atualiza/remove contrato |

## 5. Fluxo ilustrativo

```
1. Admin cadastra Vendor (companyName, taxId, type).
2. Time de TI cria Contract vinculado ao Vendor, opcionalmente a um System, com annualCost e datas.
3. Renovação/encerramento de contrato é feita manualmente via PATCH — sem alerta automático de vencimento.
```

## 6. Contratos com outros módulos

| Módulo | Tipo de consumo | Detalhe |
|---|---|---|
| Inventário | Referência | `Contract.systemId` aponta para `System` |
| Organização | Referência | `Contract.leaderId`, `Vendor.directorId`/`managerId` apontam para `Collaborator` |

## 7. Questões em aberto / dívida técnica conhecida

- Sem lógica de expiração automática — `status` de contrato não reflete `endDate` passado.
- Sem alerta de contrato próximo do vencimento (funcionalidade comum em módulos de gestão de contratos, ausente aqui).

---

## Controle de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-07-16 | Agente de IA (Claude) | Criação inicial. |
| 2026-07-20 | Agente de IA (Claude) | §1: telas movidas de `/fornecedores` para `/produtos/servicos/{fornecedores,contratos}`; aba passa a vir da rota por prop `tab`; registro da visão "Serviços" pendente (D13). |
