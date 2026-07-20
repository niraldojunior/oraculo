import {
  BarChart3,
  Boxes,
  Building,
  Building2,
  CalendarRange,
  CheckSquare,
  Clock,
  FileText,
  GanttChartSquare,
  GraduationCap,
  Handshake,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  List,
  Network,
  Table as TableIcon,
  Users as UsersIcon,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Identificador interno de visão, consumido pelas páginas via `useView().activeView`.
 * Os ids são reaproveitados dos que as páginas já usavam, para evitar churn — em
 * particular `'table'`, que significa *Tabela* em Produtos › Aplicações e *Lista*
 * em Iniciativas. A ambiguidade é inofensiva porque a resolução é sempre feita a
 * partir do pathname completo (ver `findViewByPath`), nunca pelo id isolado.
 */
export type ViewType =
  // Rede
  | 'hierarchy'
  | 'skills'
  | 'clientes'
  | 'people'
  | 'capacity'
  | 'allocation'
  // Produtos
  | 'landscape'
  | 'table'
  | 'services'
  | 'vendors'
  | 'contracts'
  // Iniciativas
  | 'status'
  | 'newTimeline'
  // Tarefas
  | 'tasks-list'
  | 'tasks-card';

/** Qual variante do filtro de líder a visão exibe no header (`false` = nenhuma). */
export type LeaderFilterMode = false | 'user' | 'all' | 'all-naoti';

export interface ToolbarFlags {
  add?: boolean;
  search?: boolean;
  settings?: boolean;
  delete?: boolean;
}

export interface ViewDef {
  /** Rota absoluta da visão. Chave real de identificação. */
  path: string;
  view: ViewType;
  label: string;
  icon: LucideIcon;
  leaderFilter: LeaderFilterMode;
  toolbar: ToolbarFlags;
  /** Onde o `headerContent` injetado pela página é renderizado. */
  headerContentSlot: 'left' | 'center';
  /** Visões inviáveis em telas pequenas (ex.: Timeline) somem do menu no mobile. */
  hideOnMobile?: boolean;
}

export interface ViewGroup {
  /** Ausente = grupo plano, renderizado sem cabeçalho. */
  label?: string;
  items: ViewDef[];
}

export interface NavSection {
  key: string;
  basePath: string;
  label: string;
  icon: LucideIcon;
  groups: ViewGroup[];
}

const DEFAULT_TOOLBAR: ToolbarFlags = { add: true, search: true, delete: true };

export const REDE: NavSection = {
  key: 'rede',
  basePath: '/rede',
  label: 'Rede',
  icon: Network,
  groups: [
    {
      items: [
        { path: '/rede/hierarquia', view: 'hierarchy', label: 'Hierarquia', icon: Building2, leaderFilter: false, toolbar: DEFAULT_TOOLBAR, headerContentSlot: 'center' },
        { path: '/rede/skills', view: 'skills', label: 'Skills', icon: GraduationCap, leaderFilter: false, toolbar: DEFAULT_TOOLBAR, headerContentSlot: 'center' },
        { path: '/rede/demandantes', view: 'clientes', label: 'Demandantes', icon: Handshake, leaderFilter: false, toolbar: DEFAULT_TOOLBAR, headerContentSlot: 'center' },
        { path: '/rede/colaboradores', view: 'people', label: 'Colaboradores', icon: UsersIcon, leaderFilter: 'user', toolbar: { add: true, search: true }, headerContentSlot: 'center' },
        { path: '/rede/capacidade', view: 'capacity', label: 'Capacidade', icon: BarChart3, leaderFilter: 'user', toolbar: { add: true, search: true }, headerContentSlot: 'center' },
        { path: '/rede/alocacao', view: 'allocation', label: 'Alocação', icon: CalendarRange, leaderFilter: false, toolbar: {}, headerContentSlot: 'left' },
      ],
    },
  ],
};

export const PRODUTOS: NavSection = {
  key: 'produtos',
  basePath: '/produtos',
  label: 'Produtos',
  icon: Boxes,
  groups: [
    {
      label: 'Aplicações',
      items: [
        { path: '/produtos/aplicacoes/landscape', view: 'landscape', label: 'Landscape', icon: LayoutGrid, leaderFilter: 'all-naoti', toolbar: DEFAULT_TOOLBAR, headerContentSlot: 'center' },
        { path: '/produtos/aplicacoes/tabela', view: 'table', label: 'Tabela', icon: TableIcon, leaderFilter: 'all-naoti', toolbar: DEFAULT_TOOLBAR, headerContentSlot: 'center' },
      ],
    },
    {
      label: 'Serviços',
      items: [
        { path: '/produtos/servicos', view: 'services', label: 'Serviços', icon: Wrench, leaderFilter: false, toolbar: {}, headerContentSlot: 'center' },
        { path: '/produtos/servicos/fornecedores', view: 'vendors', label: 'Fornecedores', icon: Building, leaderFilter: 'all', toolbar: { add: true, search: true }, headerContentSlot: 'center' },
        { path: '/produtos/servicos/contratos', view: 'contracts', label: 'Contratos', icon: FileText, leaderFilter: 'all', toolbar: { add: true, search: true }, headerContentSlot: 'center' },
      ],
    },
  ],
};

export const INICIATIVAS: NavSection = {
  key: 'iniciativas',
  basePath: '/iniciativas',
  label: 'Iniciativas',
  icon: Layers,
  groups: [
    {
      items: [
        { path: '/iniciativas/lista', view: 'table', label: 'Lista', icon: List, leaderFilter: 'user', toolbar: { add: true, search: true, settings: true, delete: true }, headerContentSlot: 'center' },
        { path: '/iniciativas/kanban', view: 'status', label: 'Kanban', icon: Clock, leaderFilter: 'user', toolbar: { add: true, search: true, settings: true, delete: true }, headerContentSlot: 'center' },
        { path: '/iniciativas/timeline', view: 'newTimeline', label: 'Timeline', icon: GanttChartSquare, leaderFilter: 'user', toolbar: { add: true, search: true, settings: true, delete: true }, headerContentSlot: 'center', hideOnMobile: true },
      ],
    },
  ],
};

export const TAREFAS: NavSection = {
  key: 'tarefas',
  basePath: '/tarefas',
  label: 'Tarefas',
  icon: CheckSquare,
  groups: [
    {
      items: [
        { path: '/tarefas/lista', view: 'tasks-list', label: 'Lista', icon: List, leaderFilter: false, toolbar: { search: true }, headerContentSlot: 'center' },
        { path: '/tarefas/cartoes', view: 'tasks-card', label: 'Cartões', icon: LayoutGrid, leaderFilter: false, toolbar: { search: true }, headerContentSlot: 'center' },
      ],
    },
  ],
};

/** Seções que expõem menu suspenso de visões. Dashboard não tem visões roteadas. */
export const NAV_SECTIONS: NavSection[] = [REDE, PRODUTOS, INICIATIVAS, TAREFAS];

/** Itens do menu lateral, na ordem em que aparecem. */
export const MENU_ITEMS: { path: string; label: string; icon: LucideIcon }[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: REDE.basePath, label: REDE.label, icon: REDE.icon },
  { path: PRODUTOS.basePath, label: PRODUTOS.label, icon: PRODUTOS.icon },
  { path: INICIATIVAS.basePath, label: INICIATIVAS.label, icon: INICIATIVAS.icon },
  { path: TAREFAS.basePath, label: TAREFAS.label, icon: TAREFAS.icon },
];

export const sectionViews = (section: NavSection): ViewDef[] =>
  section.groups.flatMap(g => g.items);

/** Primeira visão da seção — destino do redirect de índice. */
export const defaultViewOf = (section: NavSection): ViewDef => sectionViews(section)[0];

export function findSectionByPath(pathname: string): NavSection | null {
  return (
    NAV_SECTIONS.find(s => pathname === s.basePath || pathname.startsWith(`${s.basePath}/`)) ?? null
  );
}

/** Resolve a visão pelo pathname exato. Retorna `null` em rotas de detalhe (ex.: `/iniciativas/:id/edit`). */
export function findViewByPath(pathname: string): ViewDef | null {
  const section = findSectionByPath(pathname);
  if (!section) return null;
  return sectionViews(section).find(v => v.path === pathname) ?? null;
}

/** Caminho da visão `view` dentro da seção que contém `pathname`. */
export function pathForView(pathname: string, view: ViewType): string | null {
  const section = findSectionByPath(pathname);
  if (!section) return null;
  return sectionViews(section).find(v => v.view === view)?.path ?? null;
}
