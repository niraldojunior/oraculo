# Guidelines de UI

> Não há componentes core React empacotados (tipo `Button.jsx`/`Card.jsx` reutilizáveis com `.prompt.md`, como no design system do Nexus). O padrão de UI do Oraculo é feito de **classes utilitárias CSS globais** em `web/src/index.css`, consumidas diretamente nos componentes de página. Este documento cataloga essas classes para reuso consistente — antes de escrever CSS novo, verifique se já existe uma classe aqui.

## 1. Estrutura de página

| Classe | Uso |
|---|---|
| `.app-container` | Container raiz — sidebar + conteúdo, `display: flex`, `height: 100vh` |
| `.sidebar` / `.sidebar.collapsed` | Navegação lateral (dark), largura controlada por `--sidebar-width`/`--sidebar-collapsed-width`. Abaixo de 768px vira barra de navegação inferior (ver §11.5) |
| `.main-content` | Área de conteúdo principal |
| `.top-header` | Barra superior fixa (`--header-height`) |
| `.page-content` | Wrapper de conteúdo de página com scroll próprio |
| `.page-layout` | Layout de página em coluna com gap padrão |

## 2. Superfícies (cards/painéis)

| Classe | Uso |
|---|---|
| `.glass-panel` | Card estático — fundo branco, borda sutil, sombra média |
| `.glass-panel-interactive` | Igual ao anterior + hover com elevação e glow dourado (`--shadow-gold`) — usar em cards clicáveis |
| `.hierarchy-view` | Container do organograma (`.org-tree`), com cursor grab/pan. Sem `border-radius`/borda própria — o wrapper `.hierarchy-tab-shell` (ver §6) já preenche toda a área de conteúdo, então o painel branco vai até a borda |

## 3. Botões

| Classe | Uso |
|---|---|
| `.btn` | Base de todo botão (padding, radius, transição) |
| `.btn-primary` | Ação primária — fundo `--accent-base`, texto `--accent-text` |
| `.btn-glass` | Ação secundária — fundo translúcido |
| `.btn-danger` | Ação destrutiva — fundo `--status-red` |
| `.btn-danger-dim` | Ação destrutiva de baixa ênfase (ex.: item de menu) |
| `.btn-icon` | Botão icon-only, circular no hover |
| `.btn-close` | Botão de fechar modal (canto superior direito, gira 90° no hover) |

## 4. Badges e status

| Classe | Uso |
|---|---|
| `.badge` | Base — pill, uppercase, letter-spacing |
| `.badge-green` / `.badge-amber` / `.badge-red` / `.badge-accent` / `.badge-dark` | Variantes de status — mapear semanticamente (verde=ok/ativo, âmbar=atenção, vermelho=crítico/erro, accent=destaque, dark=especial) |
| `StatusIcon.tsx` (`web/src/components/common/`) | Componente React que decide qual variante de badge/ícone usar a partir de um status de domínio — reusar em vez de reimplementar mapeamento status→cor |

## 5. Formulários

| Classe | Uso |
|---|---|
| `.form-container` | Wrapper de formulário, coluna com gap |
| `.form-group` | Par label+input |
| `.form-actions` / `.form-actions-stack` | Linha ou coluna de botões de ação do formulário |
| Seletores globais `.form-group input/select/textarea` | Estilo padrão de campo (fundo `--bg-app`, borda `--glass-border`, focus com `--accent-base` + `--accent-dim`) — não redefinir estilo de input por componente |

## 6. Tabelas

| Classe | Uso |
|---|---|
| `.data-table` | Tabela padrão — header sticky, hover de linha |
| `.table-row-premium` | Linha com fade-in de `.btn-icon` no hover (ações aparecem só ao passar o mouse) |
| `.table-view-shell` | Wrapper "full-bleed" de uma tabela de listagem que é o único filho de `.page-layout` (ou do wrapper equivalente) na visão: preenche toda a largura e altura da área de conteúdo (margem negativa de `-10px` cancela o padding de `.page-content` nos quatro lados), sem cantos arredondados/borda/sombra — substitui o antigo padrão de "janela" (`.glass-panel` com `border-radius`) para tabelas de listagem. Requer que o container pai tenha `overflow: 'visible'` nessa visão (em vez de `'hidden'`), senão o bleed é cortado. Usado hoje em: Iniciativas › Lista, Pessoas › Colaboradores/Skills, Produtos › Aplicações (Tabela) e Produtos › Serviços › Contratos. O `<thead>` correspondente segue o mesmo padrão em todos: `borderCollapse: 'separate'`/`borderSpacing: 0` na `<table>`, cada `<th>` (não a `<tr>`) sticky com `background: var(--control-surface)`, `color: var(--text-secondary)`, `borderBottom: '2px solid var(--glass-border-strong)'` e `height: var(--table-header-height)` (20% mais baixa que `--subheader-height`, para não competir visualmente com a sub-header logo acima — token dedicado em vez de reduzir `--subheader-height`, que também dimensiona a própria `.sub-header`) — border na `<tr>` some ao rolar o scroll com células sticky, por isso vai na célula. A coluna de rótulo primário (nome/título) usa `fontWeight: 400` (não negrito). Visões com grid próprio (não `<table>`) — Capacidade, Alocação — replicam só o "bleed" do container externo (`margin: -10px`, sem `border-radius`/borda) e a paleta do cabeçalho da grade (`var(--control-surface)`/`var(--text-secondary)`/`var(--glass-border-strong)`), não a estrutura de `<th>`. O Kanban de Iniciativas também ganha o mesmo bleed no `.kanban-board` |
| `.hierarchy-tab-shell` | Mesmo truque de `margin: -10px` do `.table-view-shell`, aplicado ao wrapper da visão Pessoas › Times › Hierarquia (o painel do organograma, `.hierarchy-view`, some com `border-radius`/borda para preencher a área de conteúdo até a borda em vez de "flutuar" com respiro cinza ao redor) |

## 7. Modais

| Classe | Uso |
|---|---|
| `.modal-overlay` | Overlay full-screen (`top: 0`/`height: 100vh`, `z-index: 3000` — acima de `.top-header`/`.sub-header`, D14) com blur. Não sobrescreva `top`/`z-index` por página: vários modais tinham `zIndex` inline arbitrário (`10000`, `999999`, `1000000`...) ou um `<style>` local redeclarando `.modal-overlay`, herança de quando o overlay parava no header — hoje é redundante e arrisca reintroduzir o corte visual sob o sub-header |
| `.modal-content` | Container do modal — usa `--radius-lg`, `--shadow-lg` |
| `.confirm-delete` | Padrão de modal de confirmação de exclusão (título + texto centralizados) |

## 8. Outros padrões

| Classe | Uso |
|---|---|
| `.avatar-small` | Avatar circular pequeno (24px), usado em listas/tabelas |
| `.has-tooltip` / `[data-tooltip]` | Tooltip via CSS puro (`::after` com `content: attr(data-tooltip)`) — não usar lib de tooltip externa para casos simples |
| `.search-box-premium` | Campo de busca com pill radius e glow no focus |
| `.spinner` / `.spinner-container` | Loading state padrão |
| `.flex-center`, `.flex-between`, `.gap-sm/md/lg` | Utilitários de flexbox — preferir a CSS inline ad-hoc |
| Seletor de visão do dashboard | Reusa as classes `.view-menu-trigger--icon-only` / `.view-menu` / `.view-menu-item` do `ViewMenu` — o dashboard não usa o componente porque suas visões não são roteadas, mas o visual é idêntico ao das demais páginas. O menu é **plano, com três opções** (Geral, Indicadores, Portfólio) e a descrição de cada visão em `title` (hint). **Não há submenu em cascata**: o recorte de cada visão (Abertas/Fechadas, período, Área de Negócio) fica em combos `HeaderSelect` no sub-header (D14). O menu fecha após a escolha, clique externo ou tecla `Esc`. |
| `.portfolio-*` | Visão consolidada do dashboard: totais compactos na faixa 2 do cabeçalho (pílulas de 21px, dimensionadas para a altura de 31px do sub-header), grade responsiva de Áreas Cliente, cartões escuros e tipografia compacta alinhada à escala de tabelas/sidebar para as seções de entregues e backlog/andamento. A `.portfolio-initiative-list` dentro de cada cartão de Área Cliente é sempre **coluna única** (sem `column-width`/multicolumn) — a leitura da lista numerada segue de cima para baixo; a densidade vem da grade de cartões, não de quebrar a lista em colunas. |

## 9. Cabeçalho: menu de visões e filtros

> **Não use *segmented control* (pílula) para trocar de visão.** Até 2026-07-20 esse padrão era reescrito inline em nove lugares, com cores hardcoded. Foi substituído pelo menu suspenso `ViewMenu`, alimentado por [`web/src/config/navigation.ts`](../../web/src/config/navigation.ts).

**A troca de visão é um único padrão visual em todo o produto:** trigger `.view-menu-trigger--icon-only` (30px de altura, **sem borda e sem fundo**) exibindo o ícone da visão ativa + o chevron de combo — sem rótulo; o nome vai para `title`/`aria-label`. O menu é `.view-menu` com itens `.view-menu-item`. Vale inclusive para o Dashboard, que monta o menu à mão por não ter visões roteadas. **Não** reestilize o trigger por página nem volte a exibir o rótulo nele.

### Indicador de combo — um só ícone nos dois controles

Os dois seletores do header usam **o mesmo** indicador: `ChevronsUpDown` (lucide) de **12px** em **`--text-primary`**. A única diferença é o lado:

| Controle | Posição do chevron | Por quê |
|---|---|---|
| Seletor de gestor (`.leader-filter-trigger--compact`) | **Esquerda** do avatar | mantém o avatar encostado na borda direita do header |
| Seletor de visão (`.view-menu-trigger--icon-only`) | **Direita** do ícone | ordem de leitura natural a partir da borda esquerda |

Nenhum dos dois gira ao abrir: um indicador bidirecional já mostra as duas direções, diferente do `ChevronDown` simples do `LeaderFilter` não-compacto, onde a virada para cima é o sinal de "aberto".

Ícone e chevron herdam `--text-primary`. **Não** aplique `--text-tertiary` (ou qualquer cinza de baixa ênfase) a eles: sem moldura, cinza faz o controle inteiro ler como desabilitado. O tom de baixa ênfase só vale para chevrons *dentro* de controles que ainda têm borda e fundo (ex.: `HeaderSelect`, `LeaderFilter` não-compacto).

| Classe | Uso |
|---|---|
| `.header-left` / `.header-center` / `.header-right` | Três faixas do `.top-header`: controles à esquerda, título/`headerContent` centralizado (absoluto), grupo ancorado à direita |
| `.header-actions` | Ações da visão dentro de `.header-right` (quando não delegadas ao sub-header) |
| `.header-title` | Título da seção quando a página não injeta `headerContent` |
| `.header-icon-btn` / `.header-icon-btn--danger` | Botões de ação icon-only do header (adicionar, configurações, excluir). Variante `--labeled` (+ `<span class="header-icon-btn-label">`) troca o formato quadrado por um pill com o texto da função ao lado do ícone — hoje só no sub-header de Iniciativas (ver §9.1) |
| `.header-search` (+ `.is-open`) | Campo de busca que expande de 32px para 216px. Variante `--labeled` (+ `.header-search-toggle-label`) mostra um rótulo textual ao lado do ícone enquanto fechada; o rótulo some quando `.is-open` (o campo assume o espaço) |
| `.view-menu-trigger` / `.view-menu` / `.view-menu-group-label` / `.view-menu-item` | Menu suspenso de visões; grupos com label viram cabeçalho de seção (usado por Produtos: Aplicações/Serviços) |
| `.leader-filter-trigger` / `.leader-filter-menu` / `.leader-filter-item` | Filtro de líder; variante `--naoti` para a opção "Não TI" de Produtos › Aplicações |
| `.leader-filter-trigger--compact` / `.leader-filter-menu--right` | Filtro de líder no canto direito do header: trigger com `ChevronsUpDown` de 12px **à esquerda** do avatar (28px) — o avatar encosta na borda direita do header (nome vai para o `title`) e menu ancorado pela direita. **Sem moldura** — o avatar é o próprio alvo de clique; borda e fundo do trigger seriam uma segunda circunferência competindo com a foto, encolhendo-a. Hover é `opacity`, não fundo. Chevron em `--text-primary`, igual ao do seletor de visão — ver §9 |
| `.header-filter-btn` / `.header-filter-menu` / `.header-filter-section` / `.header-filter-option` | Filtro de tipo/status das Iniciativas (`InitiativeFilterMenu.tsx`), com seções expansíveis e checkbox. Prop `openTo` (`'left'` \| `'right'`) escolhe para qual lado o menu flutuante abre (`.header-filter-menu--left`/`--right`) — `'right'` quando o botão fica perto da borda esquerda do sub-header, para não estourar a viewport. Variante `--labeled` (+ `.header-filter-btn-label`) mostra o texto "Filtro" ao lado do ícone |
| `.dropdown-item-hover` | Hover de itens de dropdown genéricos (AllocationsPage, OrganizationPage) |
| `.view-placeholder` | Estado "em construção" de uma visão ainda não implementada |
| `.sub-header` / `.sub-header-lead` / `.sub-header-actions` | Segunda faixa de cabeçalho, específica da visão (D14): busca da visão (e/ou conteúdo injetado) à esquerda, demais ações à direita. Não repete o rótulo da visão (já está no `ViewMenu` da faixa 1) — por isso não há mais um elemento de título/`.sub-header-title` nesta faixa; quando `toolbar.search` está ligado, a busca ocupa esse canto esquerdo no lugar dele. As duas faixas têm o mesmo padding lateral, então `.sub-header-lead` **não** leva recuo próprio — a borda do combo/busca cai sobre a do trigger de visão da faixa 1 |
| `.header-select-*` (`HeaderSelect.tsx`) | Combo de texto das faixas de cabeçalho — trigger com rótulo + chevron e menu de opções. Substitui dropdowns montados inline com estilo hardcoded |
| `.segmented-toggle` / `.segmented-toggle-btn` (`SegmentedToggle.tsx`) | Chavinha de botões para alternar poucas opções mutuamente exclusivas visíveis lado a lado (item ativo com `.is-active`). Para **recorte interno de uma visão** (ex.: agrupamento do Roadmap), **nunca** para trocar de visão (D13 continua sendo `ViewMenu`) |
| `.view-menu-trigger--icon-only` / `.view-menu-trigger-chevron` | Variante icon-only do trigger — **padrão único** de troca de visão em todas as páginas. Sem borda e sem fundo cinza; `ChevronsUpDown` de 12px **à direita** do ícone da visão sinaliza o combo |

Para adicionar uma visão nova a uma seção existente, **edite apenas `navigation.ts`**: acrescente um `ViewDef` (rota, id de visão, rótulo, ícone, variante de filtro de líder, flags de toolbar) e registre a rota correspondente em `App.tsx`. O `Header`, o `SubHeader`, o `ViewMenu` e o `Sidebar` derivam tudo do registro — não há condicional por pathname a atualizar.

### 9.1 Cabeçalho em duas faixas (D14)

O cabeçalho separa **escopo** de **visão**:

- **`.top-header`** — o que é amplo e vale para a seção inteira: `ViewMenu`, título ou `headerContent` da página, e — ancorado no **canto direito** (`.header-right`) — o seletor de gestor em variante *icon-only* (`compact`: avatar de 28px sem moldura + chevron duplo de combo; o nome vai para o `title`/`aria-label`).
- **`.sub-header`** — o que é da visão atual: as ações `ViewToolbar` (adicionar, buscar, configurar, excluir selecionados). O rótulo da visão não se repete aqui — já está no `ViewMenu` da faixa 1 — então quando `toolbar.search` está ligado, a busca migra para o canto esquerdo da faixa (`.sub-header-lead`), no lugar onde o rótulo ficava antes; as demais ações (add/settings/delete) continuam à direita. Nas três visões de Iniciativas (`domainFilter: 'initiative'`), o `InitiativeFilterMenu` (ícone de filtro de tipo/status) acompanha a busca em `.sub-header-lead` em vez de ficar do lado das demais ações — os dois controles de "refinar o que está na tela" ficam juntos, à esquerda.

A segunda faixa é **opt-in por visão**: marque o `ViewDef` com `toolbarPlacement: 'subheader'` em `navigation.ts`. Sem a flag, `SubHeader` renderiza `null` e o layout permanece de faixa única. Hoje usam o sub-header as três visões de **Iniciativas** (Lista, Kanban, Timeline), as visões de **Pessoas** (Times, Colaboradores, Skills, Demandantes, Capacidade, Alocação) e a visão **Portfólio** do Dashboard.

Páginas sem `ViewDef` (o Dashboard, cuja visão não é roteada) participam da faixa injetando `subHeaderContent` (esquerda, `.sub-header-lead`) e `subHeaderActions` (direita) pelo `ViewContext` — com conteúdo injetado, `SubHeader` renderiza mesmo sem `toolbarPlacement`. É assim que o Dashboard coloca os combos de recorte de Indicadores, Portfólio e Roadmap na faixa 2, com os totais consolidados do Portfólio à direita. No Roadmap, a **esquerda** traz o rótulo "Agrupamento:" + uma chavinha `SegmentedToggle` **icon-only** de 3 modos (Nenhum → Situação → Tipo, default Nenhum) e a **direita** (`subHeaderActions`) os combos de intervalo de meses (De/Até). Os controles herdados do header principal (`.header-icon-btn`, `.header-search`, `.header-filter-btn`) recebem override de tamanho/superfície dentro de `.sub-header` para caberem na faixa e contrastarem com o fundo `--bg-card-hover` dela.

Os botões são renderizados pelo componente compartilhado `ViewToolbar` em `web/src/components/layout/HeaderControls.tsx` — as duas faixas consomem o mesmo componente, então **não** reimplemente add/search/settings/delete numa página. Use `ToolbarFlags.addLabel` para rotular o botão de adicionar por visão (ex.: *"Criar Iniciativa"*).

`ViewToolbar` aceita `showLabels` (default `false`): quando `true`, os botões icon-only viram pills com o texto da função ao lado do ícone ("Criar", "Config", "Excluir" — e, via `SearchBox`/`InitiativeFilterMenu` renderizados separadamente em `.sub-header-lead`, "Pesquisar"/"Filtro"). `SubHeader.tsx` liga `showLabels` sempre que `toolbarPlacement === 'subheader'` (`showLabels = hasViewToolbar`), então **toda** visão com sub-header mostra o texto — hoje Iniciativas (Lista, Kanban, Timeline) e Pessoas (Times, Colaboradores, Skills, Demandantes). O header principal nunca mostra rótulo (D13: trigger de visão e demais controles ali seguem icon-only); só o `ViewToolbar` renderizado dentro de `.sub-header` recebe `showLabels`. Botões injetados fora do `ViewToolbar` (`subHeaderActions` com `<button className="header-icon-btn">` cru, ex.: "Nova Unidade"/"Nova Área" em Demandantes, "Feriado" em Capacidade) precisam do rótulo adicionado manualmente (`header-icon-btn--labeled` + `<span className="header-icon-btn-label">`) para não destoarem dos botões vizinhos do `ViewToolbar`.

O texto de `.header-search-toggle-label` sobrescreve `color` para `--text-primary`: o botão de busca (`.header-search-toggle`) usa `--text-secondary` (cinza) para o ícone quando fechado, mas o rótulo ao lado precisa do mesmo preto dos demais botões da faixa — sem o override ele herdava o cinza do pai e destoava.

## 10. Componentes React reutilizáveis existentes

Diferente do CSS (utilitário/global), há alguns componentes React genéricos em `web/src/components/common/`:

| Componente | Arquivo | Uso |
|---|---|---|
| `Avatar` | `Avatar.tsx` | Avatar de colaborador (foto ou iniciais) |
| `ViewMenu` | `ViewMenu.tsx` | Menu suspenso de visões da seção atual, montado a partir de `navigation.ts`. Suporta grupos com cabeçalho e oculta visões marcadas com `hideOnMobile` |
| `LeaderFilter` | `LeaderFilter.tsx` | Filtro de líder do header; `mode` define o rótulo do item "todos" (`'user'` → "Usuário Logado", `'all'` → "Todos") e se a opção "Não TI" aparece (`'all-naoti'`). `compact` reduz o trigger ao avatar e `align="right"` ancora o menu pela direita — combinação usada no canto direito do header |
| `HeaderSelect` | `HeaderSelect.tsx` | Combo de texto genérico das faixas de cabeçalho (genérico em `T extends string \| number`): opções com ícone/descrição, item ativo marcado, fecha por clique externo ou `Esc`. Usado pelos recortes do Dashboard (Abertas/Fechadas, período, Área de Negócio, intervalo de meses do Roadmap) |
| `SegmentedToggle` | `SegmentedToggle.tsx` | Chavinha de botões (genérico em `T extends string`) para alternar poucas opções mutuamente exclusivas visíveis lado a lado; prop `iconOnly` mostra só o ícone (rótulo em `title`/`aria-label`). Recorte interno de visão, não troca de visão (D13) — usado no agrupamento do Roadmap |
| `PriorityPicker` | `PriorityPicker.tsx` | Seletor de prioridade de `MilestoneTask`/`Initiative` |
| `StatusIcon` | `StatusIcon.tsx` | Ícone/cor por status de domínio |
| `ChunkErrorBoundary` | `ChunkErrorBoundary.tsx` | Error boundary em volta do `Suspense` de rotas (`App.tsx`) — fallback quando um `React.lazy` falha ao carregar (chunk 404 pós-deploy); ver [architecture.md §8](../02-system-design/architecture.md#8-entrega-do-frontend-service-worker-e-cache-de-borda) |

Componentes específicos de iniciativa (editor, board, modais) vivem em `web/src/components/initiative/` e não são genéricos — não reusar fora do contexto de iniciativas sem antes avaliar se vale extrair para `common/`.

## 11. Regra geral para agentes gerando UI nova

1. Procure uma classe existente nesta página antes de escrever CSS novo.
2. Nunca hardcode cor/espaçamento/raio — use as variáveis CSS de [tokens.md](tokens.md).
3. Se precisar de um padrão visual novo e reutilizável (ex.: um novo tipo de card), adicione a classe em `web/src/index.css` perto de blocos análogos existentes, e documente aqui.
4. Mobile: teste contra o breakpoint único `768px` (ver [tokens.md §6](tokens.md#6-breakpoint-responsivo)) — o layout muda de sidebar lateral para navegação inferior (ver §12 para o detalhe dos itens).

## 12. Navegação mobile (barra inferior + menu do usuário)

Abaixo de 768px, `Sidebar.tsx` não é só CSS reposicionado — o próprio componente lê `window.innerWidth` (`isMobile`, com listener de `resize`) para decidir o que renderiza, porque o menu do usuário muda de conteúdo:

- **Barra inferior**: quatro itens (Dashboard, Pessoas, Produtos, Iniciativas) — **"Tarefas" não aparece aqui**, ver abaixo. Ícones sobem de 16px para 22px (`size={isMobile ? 22 : 16}`) e o texto/ícone ficam em `#FFFFFF` sólido (`.sidebar .nav-link` no `@media (max-width: 768px)`) em vez do cinza apagado do sidebar desktop — a barra é mais estreita que a coluna lateral, então precisa de mais contraste.
- **Trigger do usuário**: só a foto — o primeiro nome (`!isCollapsed && !isMobile`) some no mobile por falta de espaço na barra.
- **Menu do usuário** (o mesmo dropdown do desktop, aberto ao clicar na foto): no mobile ganha dois itens extras no topo, antes do divisor e do "Logoff" — "Profile" (reaproveita a ação de `Preferências`: mesmo modal, rótulo trocado só no mobile) e, logo abaixo, "Tarefas" (rota `TAREFAS.basePath`, movida para cá em vez de ocupar um quinto slot na barra). No desktop os dois continuam como estão hoje: "Tarefas" é item próprio da sidebar e o menu do usuário mostra "Preferências".
- **Posicionamento do dropdown**: `left` é calculado a partir de `getBoundingClientRect()` do trigger e *clampado* a `window.innerWidth - menuWidth - 8` — no desktop o trigger fica na coluna estreita e o clamp nunca age; no mobile o trigger fica na ponta direita da barra cheia, então sem o clamp o menu (280px) abriria fora da tela.

Ao alterar `MENU_ITEMS`/`TAREFAS` em `navigation.ts`, revise `Sidebar.tsx` — a lista mobile é derivada por `filter`, não hardcoded.

---

## Controle de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-07-21 | Agente de IA (Claude) | `.portfolio-initiative-list` (Dashboard › Portfólio, cartão de Área Cliente) deixa de quebrar em múltiplas colunas: removidos `column-width: 190px` / `column-gap` da lista e o `break-inside: avoid` dos itens, que só existia por causa do multicolumn. A lista de iniciativas de cada Área Cliente passa a ser sempre coluna única. |
| 2026-07-20 | Agente de IA (Claude) | Padrão de rótulo do sub-header (ver entrada anterior) estendido de Iniciativas para **todas** as visões com `toolbarPlacement: 'subheader'`: `showLabels` em `SubHeader.tsx` passa de `domainFilter === 'initiative'` para `hasViewToolbar` — Pessoas (Times, Colaboradores, Skills, Demandantes) passam a mostrar texto nos botões do `ViewToolbar` também. Botões injetados fora do `ViewToolbar` via `subHeaderActions` (crus, `<button className="header-icon-btn">`) em Demandantes ("Nova Unidade de Negócio", "Nova Área Cliente") e Capacidade ("Adicionar Feriado") ganham a variante `--labeled` manualmente, para não destoar dos botões vizinhos. Corrigida também a cor do rótulo de busca (`.header-search-toggle-label`), que herdava o cinza `--text-secondary` do botão de busca fechado em vez do preto `--text-primary` dos demais rótulos da faixa. |
| 2026-07-20 | Agente de IA (Claude) | Sub-header de Iniciativas: `InitiativeFilterMenu` movido de `.sub-header-actions` para `.sub-header-lead`, ao lado da busca (`openTo="right"`, nova variante `.header-filter-menu--right` — o menu flutuante passa a abrir para a direita em vez de esquerda, já que o botão agora fica perto da borda esquerda da faixa). Nas mesmas três visões (`domainFilter: 'initiative'`), os botões do sub-header (`ViewToolbar` + `SearchBox` + `InitiativeFilterMenu`) ganham a variante `--labeled`: texto da função ao lado do ícone ("Filtro", "Pesquisar", "Criar", "Config", "Excluir") em vez de icon-only — controlado por um novo prop `showLabels` em `ViewToolbar`, ligado só quando `domainFilter === 'initiative'`; as demais visões com sub-header (Pessoas, Dashboard › Portfólio) continuam icon-only. |
| 2026-07-20 | Agente de IA (Claude) | Nova `.hierarchy-tab-shell` (§6): a visão Pessoas › Times › Hierarquia passa a preencher toda a área de conteúdo (mesmo truque de `margin: -10px` do `.table-view-shell`), em vez de sobrar respiro cinza do `.page-content` ao redor do painel do organograma; `.hierarchy-view` perde `border-radius`/borda própria, que ficavam redundantes com o painel indo até a borda. |
| 2026-07-20 | Agente de IA (Claude) | Nova §12: no mobile (<768px), "Tarefas" sai da barra inferior (que passa a ter 4 itens) e vira o segundo item do menu do usuário, junto de um novo "Profile" (mesma ação de "Preferências", só o rótulo muda no mobile); trigger do usuário fica só com a foto (nome escondido); ícones da barra sobem para 22px e ganham texto/ícone `#FFFFFF` sólido; posição do dropdown do usuário passa a ser clampada ao viewport para não abrir fora da tela quando o trigger está na ponta direita da barra. |
| 2026-07-20 | Agente de IA (Claude) | Novo token `--table-header-height` (`calc(var(--subheader-height) * 0.8)`) — a linha de título (`<th>`) das tabelas de listagem (Iniciativas, Pessoas, Produtos, Fornecedores/Contratos) usa esse valor em vez de `--subheader-height` diretamente, para não competir visualmente com a sub-header sem também encolher a própria `.sub-header`, que reusa a mesma variável. |
| 2026-07-20 | Agente de IA (Claude) | Padrão "full-bleed" da tabela de Iniciativas › Lista replicado para as demais visões tabulares: Pessoas › Colaboradores/Skills (`.table-view-shell`, thead com `--control-surface`/`--text-secondary`/`--glass-border-strong`, nome sem negrito), Produtos › Aplicações (Tabela) e Produtos › Serviços › Contratos (idem). Pessoas › Capacidade e › Alocação (grids próprios, não `<table>`) ganham o mesmo bleed do container externo e a paleta de cabeçalho, sem a estrutura de `<th>`. Kanban de Iniciativas ganha o mesmo bleed no `.kanban-board`. Removida a regra órfã `.people-view .glass-panel` (não usada mais por nenhuma página). |
| 2026-07-20 | Agente de IA (Claude) | `.sub-header-title` removido (em todas as visões com sub-header) — o rótulo da visão já aparece no `ViewMenu` da faixa 1, então virou repetição. A busca (`toolbar.search`) migra para o canto esquerdo da faixa (`.sub-header-lead`), no lugar onde o rótulo ficava. Header principal de Iniciativas passa a exibir o nome da visão ativa em vez de "Iniciativas" fixo: "Lista (N)", "Kanban (N)" ou "Timeline (N com plano)". |
| 2026-07-20 | Agente de IA (Claude) | Fundo da `.sub-header` trocado de `--control-surface` para `--bg-card-hover` (`#F8FAFC`) — meio exato entre o branco do header (`--bg-card`) e o `--control-surface` do título da tabela logo abaixo, criando um degradê de 3 passos em vez de dois tons iguais colados. |
| 2026-07-20 | Agente de IA (Claude) | `.modal-overlay`/`.admin-modal-overlay` cobrem a viewport inteira (`top: 0`) em vez de parar no header, e sobem de `z-index: 1000` para `3000` — acima de `.top-header`/`.sub-header` (2000/1500, D14); removidos overrides redundantes de `zIndex` inline e um `<style>` local duplicado em `CreateInitiativeModal`/`CompanyInfoModal` que reintroduziam o corte. |
| 2026-07-20 | Agente de IA (Claude) | Roadmap do Dashboard: `.roadmap-item-link` passa a `display: grid` de 3 colunas (data \| ícone do tipo \| nome), com o nome + ícones de status agrupados em `.roadmap-item-body` — quando o nome quebra em mais de uma linha, as linhas de continuação mantêm o alinhamento do nome (não voltam ao x da data). |
| 2026-07-20 | Agente de IA (Claude) | Roadmap do Dashboard: `.roadmap-board` limitado a no máximo 3 colunas por linha (`minmax(max(300px, (100% - 2 gaps)/3), 1fr)`); `.roadmap-item-date` com largura fixa (`3rem`) + `tabular-nums` e ícone do tipo de demanda (`.roadmap-item-type-icon`) ao lado do nome para os títulos alinharem no mesmo x; fonte da lista reduzida para `0.68rem`. Novo componente `SegmentedToggle` (`.segmented-toggle*`, variante `--icon-only`) para o agrupamento na faixa 2 — 3 modos icon-only (Nenhum → Situação → Tipo, default Nenhum), com volume parcial por seção (`.roadmap-section-count`); combos de intervalo de meses movidos para o canto direito (`subHeaderActions`). |
| 2026-07-20 | Agente de IA (Claude) | Altura do título da tabela de Iniciativas (thead) igualada à `--subheader-height` (antes tinha padding vertical próprio, ficando mais alta que a sub-header); negrito removido do nome da iniciativa na visão Lista (`fontWeight` de `800` para `400`). |
| 2026-07-20 | Agente de IA (Claude) | Fundo do título da tabela de Iniciativas (thead) trocado de `--bg-app` para `--control-surface` (mesmo tom da `.sub-header`, dando continuidade visual entre as duas faixas em vez de um cinza neutro "pesado"). |
| 2026-07-20 | Agente de IA (Claude) | Linhas de separação entre faixas escurecidas de `--glass-border` para `--glass-border-strong`: `.top-header` (header/sub-header) e `.sub-header` (sub-header/título da tabela); título da tabela de Iniciativas (thead) ganha fundo `--bg-app` e texto `--text-secondary` para contraste; borda do thead movida da `tr` para cada `th` (com `border-collapse: separate`) porque sumia ao rolar o scroll. |
| 2026-07-20 | Agente de IA (Claude) | Nova `.table-view-shell` (§6): a tabela da visão Lista de Iniciativas deixa de ser uma "janela" com cantos arredondados e respiro lateral/inferior dentro da área de conteúdo — passa a preencher toda a largura e a base disponíveis, sem `border-radius`/borda/sombra. |
| 2026-07-20 | Agente de IA (Claude) | Seletores do header sem moldura, com indicador de combo único (nova §9, "Indicador de combo"): `.leader-filter-trigger--compact` e `.view-menu-trigger--icon-only` perdem borda/fundo; avatar do gestor sobe de 22px para 28px; `ChevronsUpDown` de 12px em `--text-primary` nos dois — à esquerda no gestor, à direita na visão. |
| 2026-07-20 | Agente de IA (Claude) | Padronização do seletor de visão: trigger icon-only único em todas as páginas (Dashboard passa a reusar `.view-menu-*`); ícone do trigger herda `--text-primary` (a regra de chevron `svg:last-child` estava acinzentando o ícone). |
| 2026-07-20 | Agente de IA (Claude) | Menu do dashboard reduzido a 3 visões planas; novo `HeaderSelect` (`.header-select-*`) para os combos de recorte na faixa 2; `.sub-header-lead`; `ViewMenu` icon-only nas visões com sub-header. |
| 2026-07-20 | Agente de IA (Claude) | Nova §9.1 / decisão **D14** — cabeçalho em duas faixas (`.top-header` = escopo, `.sub-header` = visão), opt-in por `toolbarPlacement`; `ViewToolbar` extraído para `HeaderControls.tsx`; seletor de gestor movido para `.header-right` em variante icon-only. |
| 2026-07-20 | Agente de IA (Claude) | Nova §9 (cabeçalho: menu de visões e filtros): *segmented control* substituído pelo `ViewMenu`; registro de `ViewMenu` e `LeaderFilter` como componentes comuns; tokens `--control-surface*`. |
| 2026-07-19 | Agente de IA (Claude) | Menu de visões do dashboard reduzido a 3 opções: Geral, Indicadores (submenu com Iniciativas Abertas/Fechadas) e Portfólio. |
| 2026-07-19 | Agente de IA (Claude) | §9: registra `ChunkErrorBoundary` como componente comum novo. |
| 2026-07-19 | Codex | Totais do Portfólio no cabeçalho global, conteúdo harmonizado e submenu de Áreas de Negócio aberto por hover. |
| 2026-07-18 | Codex | Seletor hierárquico com botão icon-only, descrições em hint e padrão visual da visão de Portfólio. |
| 2026-07-16 | Agente de IA (Claude) | Criação inicial, catalogando classes de `web/src/index.css` e componentes de `web/src/components/`. |
