# Oráculo

Plataforma web para gestão de portfólio de iniciativas de tecnologia, governança organizacional, inventário de sistemas, fornecedores, contratos e alocação de pessoas.

O produto integra visão executiva (dashboard), operação tática (kanban/timeline/listas), e manutenção de dados mestres (administração de companhias e departamentos), com persistência em PostgreSQL via Prisma.

## 1. O que é a solução

O Oráculo centraliza o ciclo de gestão de tecnologia em um único sistema:

- Planejamento e acompanhamento de iniciativas, milestones e tarefas.
- Visibilidade de times, colaboradores, skills e capacidade.
- Catálogo técnico de sistemas e contexto operacional.
- Governança de fornecedores e contratos.
- Visões analíticas para liderança e operação.

A aplicação é multiempresa/multidepartamento e usa escopo por usuário para filtrar dados de forma contextual.

## 2. Funcionalidades da aplicação

### 2.1 Autenticação e contexto

- Login com e-mail/senha via API.
- Sessão local com restauração automática do usuário.
- Suporte a perfil administrador.
- Troca de departamento no menu do usuário.
- Escopo de dados por companhia e departamento.

### 2.2 Dashboard executivo

- KPIs e indicadores operacionais.
- Gráficos de funil, forecast e distribuição.
- Tooltips ricos com detalhamento de listas.
- Consolidação de iniciativas, times, sistemas e fornecedores.

### 2.3 Organização (Times, Pessoas, Skills, Capacidade, Clientes)

- Visualização hierárquica de times com nós expandíveis.
- Gestão de colaboradores (perfil, foto, contatos, papel).
- Gestão de skills e associação colaborador-skill.
- Visões por capacidade e composição de equipes.
- Ações administrativas condicionadas por perfil.

### 2.4 Inventário de sistemas

- Cadastro e edição de sistemas com domínio/subdomínio.
- Classificação por criticidade e ciclo de vida.
- Vinculação com time, SME e fornecedor.
- Registro de stack técnica, repositório e ambientes.
- Upload de arquivos de contexto do sistema.
- Página de detalhe com edição aprofundada.

### 2.5 Iniciativas

- Criação rápida de iniciativa com metadados essenciais.
- Múltiplos modos de visualização:
  - Cartões por gestor, diretoria, tipo, status, sistema ou colaborador.
  - Tabela com filtros e ordenação.
  - Timeline avançada com dimensão temporal.
- Drag and drop entre colunas (quando aplicável).
- Sidebar de edição rápida (propriedades, milestones, comentários, histórico).
- Priorização e ícones de status.
- Abertura do editor completo por duplo clique.
- Exclusão em lote de iniciativas.

### 2.6 Editor avançado de iniciativas

- Edição completa da iniciativa em layout dedicado.
- Abas de descrição e tarefas.
- Edição rich text de escopo (TipTap).
- Gestão de milestones com ordenação e ações rápidas.
- Task board com modos lista, board e timeline.
- Importação e exportação de tarefas via planilha (XLSX).
- Histórico de alterações e comentários por tarefa.
- Link externo da iniciativa (ex.: Azure/Jira).

### 2.7 Minhas tarefas

- Consolidação de tarefas atribuídas ao usuário logado.
- Busca textual por tarefa/iniciativa/milestone.
- Agrupamento por iniciativa + milestone.
- Edição inline e modal de tarefa.
- Atualização de status, prioridade, responsável, datas e tipo.

### 2.8 Alocações

- Timeline de alocação por colaborador.
- Filtros por gestor e dimensão temporal.
- Cálculo visual de sobreposição e carga por faixas.
- Navegação para iniciativa a partir da barra de alocação.

### 2.9 Fornecedores e contratos

- Cadastro de fornecedores com logo e dados fiscais.
- Vínculo de diretor/gestor responsável.
- Cadastro do contrato principal (datas, custo, modelo).
- Consolidação com dados de sistemas e contexto organizacional.

### 2.10 Administração

- Gestão de companhias.
- Gestão de departamentos por companhia.
- Ações de criar, editar e excluir entidades mestres.
- Tela separada com acesso restrito a administradores.

### 2.11 Utilitários e UX

- Cabeçalho contextual com controles por tela.
- Persistência de preferências de visualização em localStorage.
- Hook padrão para fechamento de modais com tecla Esc.
- Otimização de imagens base64 no backend (Sharp + WebP).

## 3. Como a aplicação funciona

## 3.1 Arquitetura

- Frontend SPA em React + Vite.
- API HTTP em Express (Node) no mesmo repositório.
- Prisma como camada de acesso a dados.
- PostgreSQL (recomendado Supabase para ambiente local).
- Deploy serverless compatível com Vercel (roteamento via api/index.ts).

## 3.2 Fluxo de execução

1. O navegador carrega a SPA (Vite no dev, build estático em produção).
2. O frontend chama endpoints em /api.
3. Em desenvolvimento, o Vite faz proxy para http://localhost:3001.
4. A API Express processa regras, caching SWR e persistência.
5. Prisma executa queries no PostgreSQL.
6. O frontend renderiza as visões e persiste preferências locais.

## 3.3 Camadas principais

- Camada de UI: páginas, layout e componentes reutilizáveis.
- Camada de estado de sessão: AuthContext e ViewContext.
- Camada de dados: fetch para endpoints REST.
- Camada de API: rotas Express por domínio.
- Camada de persistência: Prisma + schema relacional.

## 3.4 Endpoints da API por domínio

Domínios implementados em src/app.ts:

- Saúde e imagens: health, _img para collaborator/company/vendor/skill.
- Auth: login.
- Colaboradores: listagem, consulta por e-mail, CRUD, skills toggle.
- Times: CRUD.
- Sistemas: CRUD + inventory-context.
- Iniciativas: CRUD, histórico, comentários.
- Fornecedores: CRUD + vendors-context.
- Contratos: CRUD.
- Alocações: listagem.
- Departamentos: listagem e manutenção.
- Companhias: CRUD.
- Skills: CRUD.
- Ausências: CRUD básico.
- Feriados: CRUD básico.

## 4. Stack e dependências

### 4.1 Frontend

- React 19
- TypeScript
- Vite
- React Router
- Recharts
- Lucide React
- TipTap

### 4.2 Backend

- Node.js
- Express
- Prisma Client
- PostgreSQL
- Sharp (otimização de imagem)

### 4.3 Ferramentas

- ESLint
- TSX (execução TS no servidor local)
- Prisma CLI
- XLSX

## 5. Execução local

## 5.1 Pré-requisitos

- Node.js 18+
- Banco PostgreSQL (ex.: Supabase)

## 5.2 Variáveis de ambiente

Crie .env.local na raiz com:

```env
DATABASE_URL="postgresql://usuario:senha@host:5432/postgres"
DIRECT_URL="postgresql://usuario:senha@host:5432/postgres"
PORT=3001
```

## 5.3 Scripts principais

- npm run dev: inicia frontend (Vite).
- npm run server: inicia API local (tsx src/server.ts).
- npm run build: gera Prisma Client, compila TS e builda frontend.
- npm run preview: preview do build.
- npm run lint: lint do projeto.

## 5.4 Atalho para subir frontend + backend

Windows:

- start-dev.ps1
- start-dev.bat

Ambos validam ambiente, geram Prisma Client e iniciam os dois processos.

## 6. Estrutura de pastas e arquivos

## 6.1 Raiz do projeto

| Caminho | Responsabilidade |
|---|---|
| index.html | Shell HTML da SPA. |
| package.json | Dependências e scripts NPM. |
| vite.config.ts | Config do Vite e proxy /api para backend local. |
| vercel.json | Rewrites para API serverless e fallback SPA. |
| eslint.config.js | Regras de lint para TS/React. |
| tsconfig.json | Projeto TS raiz (referências). |
| tsconfig.app.json | Config TS do frontend. |
| tsconfig.node.json | Config TS de Node/Vite/API. |
| start-dev.ps1 | Bootstrap local via PowerShell (frontend + backend). |
| start-dev.bat | Bootstrap local via CMD (frontend + backend). |
| SETUP-LOCAL.md | Guia alternativo de setup local com Supabase. |
| README.md | Esta documentação. |

## 6.2 Pasta api

| Caminho | Responsabilidade |
|---|---|
| api/index.ts | Entry point serverless (exporta app Express). |

## 6.3 Pasta prisma

| Caminho | Responsabilidade |
|---|---|
| prisma/schema.prisma | Modelo relacional completo do domínio. |
| prisma/seed.ts | Seed legado de dados iniciais (precisa revisão para o schema atual). |

## 6.4 Pasta src (visão geral)

| Caminho | Responsabilidade |
|---|---|
| src/main.tsx | Bootstrap React e montagem da aplicação. |
| src/App.tsx | Rotas e guards de autenticação/admin. |
| src/app.ts | API Express com rotas e regras de backend. |
| src/server.ts | Inicialização do servidor HTTP local. |
| src/index.css | Design tokens, tema e estilos globais. |
| src/App.css | Estilos remanescentes do template base (uso reduzido). |
| src/imageOptimizer.ts | Otimização de imagens base64 para WebP. |

## 6.5 src/components/common

| Caminho | Responsabilidade |
|---|---|
| src/components/common/PriorityPicker.tsx | Componentes de prioridade (ícone e seletor). |
| src/components/common/StatusIcon.tsx | Ícones de status de iniciativas por estágio. |

## 6.6 src/components/initiative

| Caminho | Responsabilidade |
|---|---|
| src/components/initiative/CreateInitiativeModal.tsx | Modal de criação rápida de iniciativa. |
| src/components/initiative/SidebarComponents.tsx | Blocos reutilizáveis da sidebar da iniciativa. |
| src/components/initiative/InitiativeTaskBoard.tsx | Quadro de tarefas, modal de tarefa e import/export XLSX. |
| src/components/initiative/InitiativeEditor.tsx | Editor completo de iniciativa (descrição + tarefas). |

## 6.7 src/components/layout

| Caminho | Responsabilidade |
|---|---|
| src/components/layout/MainLayout.tsx | Estrutura principal (sidebar + header + outlet). |
| src/components/layout/Sidebar.tsx | Navegação lateral e menu do usuário. |
| src/components/layout/Header.tsx | Barra superior contextual com controles por página. |
| src/components/layout/CompanyInfoModal.tsx | Modal para informações de companhia/departamento. |
| src/components/layout/UserPreferencesModal.tsx | Modal de preferências do usuário logado. |

## 6.8 src/context

| Caminho | Responsabilidade |
|---|---|
| src/context/AuthContext.tsx | Sessão, login, escopo e atualização de usuário. |
| src/context/ViewContext.tsx | Estado de visualização global (filtros, busca, ações de header). |

## 6.9 src/data

| Caminho | Responsabilidade |
|---|---|
| src/data/mockDb.ts | Constantes auxiliares e mocks vazios (dados reais via API). |
| src/data/importedInitiatives.ts | Dataset importado de iniciativas (legado/migração). |

## 6.10 src/hooks

| Caminho | Responsabilidade |
|---|---|
| src/hooks/useEscapeKey.ts | Hook utilitário para fechar UI com tecla Esc. |

## 6.11 src/pages

| Caminho | Responsabilidade |
|---|---|
| src/pages/Login.tsx | Tela de autenticação. |
| src/pages/Dashboard.tsx | Painel executivo com indicadores e gráficos. |
| src/pages/Organization.tsx | Gestão e visualização de times e pessoas. |
| src/pages/Inventory.tsx | Catálogo e gestão de sistemas. |
| src/pages/InventoryDetail.tsx | Detalhamento e edição de sistema. |
| src/pages/Initiatives.tsx | Gestão de iniciativas em múltiplos modos de visualização. |
| src/pages/InitiativeEdit.tsx | Página do editor avançado da iniciativa. |
| src/pages/Tasks.tsx | Minhas tarefas com edição e filtros. |
| src/pages/Allocations.tsx | Timeline de alocações por colaborador. |
| src/pages/Vendors.tsx | Gestão de fornecedores e contrato principal. |
| src/pages/Admin.tsx | Administração de companhias/departamentos. |
| src/pages/Topology.tsx | Visual de topologia/impacto (não roteado atualmente no App.tsx). |

## 6.12 src/types

| Caminho | Responsabilidade |
|---|---|
| src/types/index.ts | Contratos de tipos do domínio (entidades, enums e DTOs de UI). |

## 7. Modelo de dados (resumo)

Entidades principais no Prisma:

- Company
- Department
- Collaborator
- Skill e CollaboratorSkill
- Team
- System
- Vendor
- Contract
- Initiative
- InitiativeMilestone
- MilestoneTask
- InitiativeHistory
- InitiativeComment
- Allocation
- Absence
- Holiday

Observações:

- Várias entidades são escopadas por companyId e departmentId.
- Iniciativa possui histórico e comentários vinculados.
- MilestoneTask suporta trilha de histórico em JSON.

## 8. Convenções e decisões importantes

- A aplicação privilegia fetch direto para API REST local.
- A API usa estratégias de cache SWR para aliviar consultas repetidas.
- Upload de imagens em base64 é otimizado no backend quando possível.
- Modos de visualização e filtros são persistidos em localStorage.

## 9. Deploy

Estratégia prevista:

- Frontend estático hospedado com suporte a SPA fallback.
- API exposta via endpoint serverless api/index.ts.
- Banco PostgreSQL externo (Supabase ou equivalente).

Arquivo de suporte:

- vercel.json

## 10. Próximos pontos de manutenção recomendados

- Revisar prisma/seed.ts para alinhar com o schema atual (usa modelo legado em alguns trechos).
- Consolidar SETUP-LOCAL.md com os scripts efetivos start-dev.ps1 e start-dev.bat.
- Documentar exemplos de payload para principais endpoints.

---

Oráculo foi desenhado para unir visão executiva e execução operacional em um fluxo único, mantendo governança de dados e rastreabilidade de mudanças nas iniciativas.
