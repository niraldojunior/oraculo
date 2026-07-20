import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useView } from '@/context/ViewContext';
import {
  Cpu, Users, CheckCircle2, TrendingUp, Layers,
  Diamond, Briefcase, Zap, Bug, Calendar, Gift, FileText,
  BarChart3, Activity, X, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, ChevronsUpDown,
  Map as MapIcon, AlertTriangle, List,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, LabelList
} from 'recharts';
import { format, parseISO, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Initiative, Collaborator, System, Team, Vendor, Contract, BusinessUnit, ClientTeam } from '../../../types';
import { fetchDashboardData } from '../services/dashboardApi';
import { useClientAreas } from '../../initiatives/useClientAreas';
import HeaderSelect from '@/components/common/HeaderSelect';
import SegmentedToggle from '@/components/common/SegmentedToggle';
import { sortDrilldownInitiatives, type DrilldownSortConfig, type DrilldownSortKey } from '../../../../../src/shared/dashboardDrilldownSort';

const oldToNewMap: Record<string, string> = {
  '1- Em Avaliação': '2- Discovery',
  '1- Avaliação': '2- Discovery',
  '2- Em Backlog': '1- Backlog',
  '2- Backlog': '1- Backlog',
  'Backlog': '1- Backlog',
  '3- Em Planejamento': '3- Planejamento',
  '3- Discovery': '2- Discovery',
  '4- Em Execução': '5- Construção',
  '4- Execução': '5- Construção',
  '4- Planejamento': '3- Planejamento',
  '4- Construção': '5- Construção',
  'Aguardando Capacidade': '4- Aguardando Capacidade',
  '3- Aguardando Capacidade': '4- Aguardando Capacidade',
  '5- Entregue': '9- Concluído',
  '5- Execução': '5- Construção',
  '5- Implantação': '8- Implantação',
  '5- QA': '6- QA',
  '5- Concluído': '9- Concluído',
  '6- UAT': '7- UAT',
  '6- Concluído': '9- Concluído',
  '7- Implantação': '8- Implantação',
  '8- Concluído': '9- Concluído'
};

// ─── Tooltips ─────────────────────────────────────────────────────────────────

const tooltipBox: React.CSSProperties = {
  background: 'rgba(255,255,255,0.98)',
  backdropFilter: 'blur(10px)',
  border: '1px solid var(--glass-border)',
  padding: '1rem',
  borderRadius: '12px',
  boxShadow: 'var(--shadow-lg)',
  minWidth: '240px',
  maxWidth: '350px',
  zIndex: 1000,
};

const CycleTimeTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload;
  return (
    <div style={tooltipBox}>
      <p style={{ fontWeight: 800, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#000', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.4rem' }}>{label}</p>
      {entry.avgDays > 0 ? (
        <>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6366F1', marginBottom: '0.3rem' }}>Cycle time médio: {entry.avgDays} dias</p>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Baseado em {entry.count} iniciativa{entry.count !== 1 ? 's' : ''} com data de início</p>
        </>
      ) : (
        <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Sem dados de início neste mês</p>
      )}
    </div>
  );
};

const ClosedMonthTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload;
  const pct = entry.total > 0 ? Math.round(entry.noPrazo / entry.total * 100) : 0;
  return (
    <div style={tooltipBox}>
      <p style={{ fontWeight: 800, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#000', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.4rem' }}>{label}</p>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Total encerradas: {entry.total}</p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669' }}>✓ No prazo: {entry.noPrazo} ({pct}%)</span>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#EF4444' }}>✗ Atrasado: {entry.atrasado}</span>
      </div>
    </div>
  );
};

const ClosedAreaTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload;
  const pct = entry.total > 0 ? Math.round(entry.noPrazo / entry.total * 100) : 0;
  return (
    <div style={tooltipBox}>
      <p style={{ fontWeight: 800, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#000', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.4rem' }}>{label}</p>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Total encerradas: {entry.total}</p>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: entry.initiatives?.length ? '0.6rem' : 0 }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669' }}>✓ No prazo: {entry.noPrazo} ({pct}%)</span>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#EF4444' }}>✗ Atrasado: {entry.atrasado}</span>
      </div>
      {entry.initiatives?.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {entry.initiatives.map((it: any, i: number) => <li key={i} style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: '1.2' }}>• {it.title}</li>)}
        </ul>
      )}
    </div>
  );
};

const ClosedSystemTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload;
  return (
    <div style={tooltipBox}>
      <p style={{ fontWeight: 800, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#000', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.4rem' }}>{label}</p>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Total iniciativas: {entry.total}</p>
      {entry.initiatives?.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {entry.initiatives.map((it: any, i: number) => <li key={i} style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: '1.2' }}>• {it.title}</li>)}
        </ul>
      )}
    </div>
  );
};

const ClosedCollaboratorTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload;
  return (
    <div style={tooltipBox}>
      <p style={{ fontWeight: 800, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#000', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.4rem' }}>{label}</p>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Participações: {entry.total}</p>
      {entry.initiatives?.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {entry.initiatives.map((it: any, i: number) => <li key={i} style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: '1.2' }}>• {it.title}</li>)}
        </ul>
      )}
    </div>
  );
};

const TypeTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload;
  return (
    <div style={tooltipBox}>
      <p style={{ fontWeight: 800, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#000', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.4rem' }}>{label}</p>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Total: {entry.total}</p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669' }}>✓ No prazo: {entry.noPrazo} ({entry.pctOnTime}%)</span>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#EF4444' }}>✗ Atrasado: {entry.atrasado}</span>
      </div>
    </div>
  );
};

const LeaderOnTimeTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload;
  const pct = entry.total > 0 ? Math.round(entry.noPrazo / entry.total * 100) : 0;
  return (
    <div style={tooltipBox}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.4rem' }}>
        {entry.photoUrl
          ? <img loading="lazy" src={entry.photoUrl} alt={entry.name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
          : <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={14} color="#64748B" /></div>
        }
        <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{entry.name}</span>
      </div>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '0.4rem' }}>Total encerradas: {entry.total}</p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669' }}>✓ No prazo: {entry.noPrazo} ({pct}%)</span>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#EF4444' }}>✗ Atrasado: {entry.atrasado}</span>
      </div>
    </div>
  );
};

const CompactPercentLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  if (!value || value <= 0) return null;
  const text = `${value}%`;
  const fontSize = 9;
  const horizontalPadding = 4;
  const minTextWidth = text.length * (fontSize * 0.56) + horizontalPadding * 2;
  const minTextHeight = fontSize + 4;
  if (height < minTextHeight || width < minTextWidth) return null;
  return (
    <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="9" fontWeight="700">
      {text}
    </text>
  );
};

const CompactPercentLabelH = (props: any) => {
  const { x, y, width, height, value } = props;
  if (!value || value <= 0) return null;
  const text = `${value}%`;
  const fontSize = 9;
  const horizontalPadding = 4;
  const minTextWidth = text.length * (fontSize * 0.56) + horizontalPadding * 2;
  const minTextHeight = fontSize + 4;
  if (width < minTextWidth || height < minTextHeight) return null;
  return (
    <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="9" fontWeight="700">
      {text}
    </text>
  );
};

// ─── ManagerTick ──────────────────────────────────────────────────────────────

const ManagerTick = (props: any) => {
  const { x, y, index, data } = props;
  const manager = data?.[index];
  if (!manager) return null;
  const avatarUrl = manager.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(manager.name)}&background=random&color=fff`;
  const showName = (data?.length ?? 0) <= 4;
  // When showing name: avatar offset left + name text; when not: avatar centered under bar
  const cx = showName ? -15 : 0;
  const imgX = showName ? -27 : -12;
  return (
    <g transform={`translate(${x},${y + 15})`}>
      <defs>
        <clipPath id={`circleView-${index}`}>
          <circle cx={cx} cy="12" r="12" />
        </clipPath>
      </defs>
      <image x={imgX} y="0" width="24" height="24" href={avatarUrl} clipPath={`url(#circleView-${index})`} preserveAspectRatio="xMidYMid slice" />
      <circle cx={cx} cy="12" r="12" fill="none" stroke="#E2E8F0" strokeWidth="1.5" />
      {showName && (
        <text x="5" y="17" textAnchor="start" fill="#000000" fontSize="10" fontWeight="500">
          {manager.name.split(' ')[0]}
        </text>
      )}
    </g>
  );
};

// ─── TypeTick ─────────────────────────────────────────────────────────────────

const CollaboratorTick = (props: any) => {
  const { x, y, payload, collabData } = props;
  if (!payload?.value) return null;
  const entry = collabData?.find((d: any) => d.name === payload.value);
  const avatarUrl = entry?.photoUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.value)}&background=random&color=fff&size=32`;
  const idKey = payload.value.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
  return (
    <g transform={`translate(${x},${y})`}>
      <defs>
        <clipPath id={`cc-${idKey}`}>
          <circle cx="-16" cy="0" r="11" />
        </clipPath>
      </defs>
      <image x="-27" y="-11" width="22" height="22" href={avatarUrl}
        clipPath={`url(#cc-${idKey})`} preserveAspectRatio="xMidYMid slice" />
      <circle cx="-16" cy="0" r="11" fill="none" stroke="#E2E8F0" strokeWidth="1.5" />
      <text x="-31" y="4" textAnchor="end" fill="#000" fontSize="10" fontWeight="500">
        {payload.value.split(' ')[0]}
      </text>
    </g>
  );
};

// ─── TypeTick ─────────────────────────────────────────────────────────────────

const TYPE_TICK_META: Record<string, { Icon: React.ComponentType<{ size?: number; color?: string }>; color: string }> = {
  'Estratégico': { Icon: Diamond,  color: '#EF4444' },
  'Projeto':     { Icon: Briefcase, color: '#3B82F6' },
  'Fast Track':  { Icon: Zap,      color: '#10B981' },
  'PBI':         { Icon: Bug,      color: '#D97706' },
};

const isAzureExternalType = (type?: string) => type === 'Microsoft Azure' || type === 'Azure';
const getAzureWorkItemNumber = (initiative: Initiative) => {
  if (!isAzureExternalType(initiative.externalLinkType)) return '';
  const fromName = (initiative.externalLinkName || '').match(/\d+/)?.[0];
  if (fromName) return fromName;
  const fromUrl = (initiative.externalLinkUrl || '').match(/(?:edit|workitems)\/(\d+)/i)?.[1];
  return fromUrl || '';
};

const TypeTick = (props: any) => {
  const { x, y, payload } = props;
  const meta = TYPE_TICK_META[payload?.value];
  const { Icon, color } = meta ?? { Icon: null, color: '#000' };
  return (
    <g transform={`translate(${x},${y + 4})`}>
      <foreignObject x={-43} y={0} width={86} height={28}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', fontSize: '10px', fontWeight: 600, color: '#000', whiteSpace: 'nowrap', overflow: 'hidden' }}>
          {Icon && <Icon size={11} color={color} />}
          <span>{payload?.value}</span>
        </div>
      </foreignObject>
    </g>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

type DashboardView = 'overview' | 'closed' | 'open' | 'portfolio' | 'roadmap';
type ClosedPeriod = 12 | 6 | 3;

const PORTFOLIO_OPEN_STATUSES = new Set([
  '1- Backlog',
  '2- Discovery',
  '3- Planejamento',
  '4- Aguardando Capacidade',
  '5- Construção',
  '6- QA',
  '7- UAT',
  '8- Implantação',
]);

interface PortfolioViewProps {
  businessUnit: BusinessUnit | null;
  clientTeams: ClientTeam[];
  initiatives: Initiative[];
}

const PortfolioView: React.FC<PortfolioViewProps> = ({ businessUnit, clientTeams, initiatives }) => {
  const columns = React.useMemo(() => {
    if (!businessUnit) return [];

    const sortInitiatives = (items: Initiative[]) => [...items].sort((a, b) => {
      const priorityA = a.priority ?? Number.MAX_SAFE_INTEGER;
      const priorityB = b.priority ?? Number.MAX_SAFE_INTEGER;
      return priorityA - priorityB || a.title.localeCompare(b.title, 'pt-BR');
    });

    return clientTeams
      .filter(team => team.businessUnitId === businessUnit.id)
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      .map(team => {
        const teamInitiatives = initiatives.filter(initiative => initiative.clientTeamId === team.id);
        return {
          id: team.id,
          name: team.name,
          delivered: sortInitiatives(teamInitiatives.filter(initiative => initiative.status === '9- Concluído')),
          inProgress: sortInitiatives(teamInitiatives.filter(initiative => PORTFOLIO_OPEN_STATUSES.has(initiative.status))),
        };
      });
  }, [businessUnit, clientTeams, initiatives]);

  if (!businessUnit) {
    return (
      <div className="portfolio-empty-state">
        <Briefcase size={28} aria-hidden="true" />
        <strong>Selecione uma Área de Negócio</strong>
        <span>Abra o seletor de visão e escolha uma opção dentro de Portfólio.</span>
      </div>
    );
  }

  return (
    <section className="portfolio-view" aria-label={`Portfólio ${businessUnit.name}`}>
      {columns.length === 0 ? (
        <div className="portfolio-empty-state">
          <Briefcase size={28} aria-hidden="true" />
          <strong>Nenhuma Área Cliente vinculada</strong>
          <span>Vincule Áreas Cliente a {businessUnit.name} na tela de Organização.</span>
        </div>
      ) : (
        <div className="portfolio-board">
          {columns.map(column => (
            <article className="portfolio-column" key={column.id}>
              <h2>{column.name}</h2>

              <div className="portfolio-section portfolio-section--delivered">
                <div className="portfolio-section-header">
                  <h3>Entregues</h3>
                  <span>{column.delivered.length}</span>
                </div>
                {column.delivered.length > 0 ? (
                  <ol className="portfolio-initiative-list">
                    {column.delivered.map(initiative => (
                      <li key={initiative.id} title={initiative.title}>
                        <a
                          className="portfolio-initiative-link"
                          href={`/iniciativas/${initiative.id}/edit`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {initiative.title}
                        </a>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="portfolio-section-empty">Nenhuma iniciativa concluída.</p>
                )}
              </div>

              <div className="portfolio-section portfolio-section--progress">
                <div className="portfolio-section-header">
                  <h3>Backlog / andamento</h3>
                  <span>{column.inProgress.length}</span>
                </div>
                {column.inProgress.length > 0 ? (
                  <ol className="portfolio-initiative-list">
                    {column.inProgress.map(initiative => (
                      <li key={initiative.id} title={initiative.title}>
                        <a
                          className="portfolio-initiative-link"
                          href={`/iniciativas/${initiative.id}/edit`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {initiative.title}
                        </a>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="portfolio-section-empty">Nenhuma iniciativa em aberto.</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

// ─── Roadmap ──────────────────────────────────────────────────────────────
// Uma coluna por mês (mais "Sem Data"), com uma seção por tipo de demanda —
// mesmo esqueleto de coluna do PortfolioView, trocando ClientTeam por mês.

const ROADMAP_TERMINAL_STATUSES = new Set(['9- Concluído', 'Suspenso', 'Cancelado']);
const ROADMAP_HIDDEN_STATUSES = new Set(['Suspenso', 'Cancelado']);

// Metadados por tipo de demanda — fonte única de ícone/cor/rótulo, reusada tanto
// no agrupamento por tipo quanto no ícone ao lado do nome de cada iniciativa.
const ROADMAP_TYPE_META: Record<string, { Icon: LucideIcon; color: string; label: string; short: string }> = {
  '1- Estratégico': { Icon: Diamond, color: 'var(--status-red)', label: 'Estruturantes', short: 'Estruturante' },
  '2- Projeto': { Icon: Briefcase, color: 'var(--status-blue)', label: 'Projetos', short: 'Projeto' },
  '3- Fast Track': { Icon: Zap, color: 'var(--status-green)', label: 'Fast Tracks', short: 'Fast Track' },
};

// Tipos de demanda que o roadmap acompanha — define a população exibida,
// independente do agrupamento escolhido.
const ROADMAP_TRACKED_TYPES = new Set(Object.keys(ROADMAP_TYPE_META));

type RoadmapGroupMode = 'type' | 'status' | 'none';

interface RoadmapGroupDef {
  key: string;
  label: string;
  color: string;
  Icon: LucideIcon;
  match: (initiative: Initiative) => boolean;
}

// Agrupamento por tipo de demanda (padrão).
const ROADMAP_TYPE_GROUPS: RoadmapGroupDef[] = Object.entries(ROADMAP_TYPE_META).map(([type, meta]) => ({
  key: type,
  label: meta.label,
  color: meta.color,
  Icon: meta.Icon,
  match: it => it.type === type,
}));

// Agrupamento por situação — abertas (qualquer status não concluído, já que
// Suspenso/Cancelado ficam de fora) vs. fechadas (concluídas).
const ROADMAP_STATUS_GROUPS: RoadmapGroupDef[] = [
  { key: 'abertas', label: 'Abertas', color: 'var(--status-blue)', Icon: Activity, match: it => it.status !== '9- Concluído' },
  { key: 'fechadas', label: 'Fechadas', color: 'var(--status-green)', Icon: CheckCircle2, match: it => it.status === '9- Concluído' },
];

// Sem agrupamento — uma seção única sem cabeçalho, listando tudo em ordem.
const ROADMAP_NO_GROUPS: RoadmapGroupDef[] = [
  { key: 'todas', label: '', color: 'var(--text-tertiary)', Icon: Diamond, match: () => true },
];

const ROADMAP_GROUPS_BY_MODE: Record<RoadmapGroupMode, RoadmapGroupDef[]> = {
  type: ROADMAP_TYPE_GROUPS,
  status: ROADMAP_STATUS_GROUPS,
  none: ROADMAP_NO_GROUPS,
};

const parseRoadmapDate = (value?: string | null): Date | null => {
  if (!value) return null;
  try {
    const parsed = parseISO(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
};

// Data efetiva: real se preenchida, planejada como fallback.
const getRoadmapEffectiveDate = (initiative: Initiative): Date | null =>
  parseRoadmapDate(initiative.actualEndDate) ?? parseRoadmapDate(initiative.endDate);

const isRoadmapOverdue = (initiative: Initiative, effectiveDate: Date | null): boolean => {
  if (ROADMAP_TERMINAL_STATUSES.has(initiative.status) || !effectiveDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return effectiveDate < today;
};

// Primeiro mês disponível nos combos do roadmap — Jan/2026 (não há histórico
// anterior a exibir). O intervalo vai até 24 meses à frente do mês corrente.
const ROADMAP_FIRST_MONTH = new Date(2026, 0, 1);

const buildRoadmapMonthOptions = (): { id: string; label: string }[] => {
  const base = new Date();
  const end = addMonths(new Date(base.getFullYear(), base.getMonth(), 1), 24);
  const options: { id: string; label: string }[] = [];
  for (let d = ROADMAP_FIRST_MONTH; d <= end; d = addMonths(d, 1)) {
    const label = format(d, 'MMMM/yy', { locale: ptBR });
    options.push({ id: format(d, 'yyyy-MM'), label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return options;
};

interface RoadmapViewProps {
  initiatives: Initiative[];
  systems: System[];
  startMonth: string;
  endMonth: string;
  groupMode: RoadmapGroupMode;
}

const RoadmapView: React.FC<RoadmapViewProps> = ({ initiatives, systems, startMonth, endMonth, groupMode }) => {
  const systemById = React.useMemo(() => new Map(systems.map(s => [s.id, s] as const)), [systems]);

  const columns = React.useMemo(() => {
    const [orderedStart, orderedEnd] = startMonth <= endMonth ? [startMonth, endMonth] : [endMonth, startMonth];

    const monthKeys: string[] = [];
    let cursor = parseISO(`${orderedStart}-01`);
    const limit = parseISO(`${orderedEnd}-01`);
    for (let guard = 0; cursor <= limit && guard < 60; guard++) {
      monthKeys.push(format(cursor, 'yyyy-MM'));
      cursor = addMonths(cursor, 1);
    }

    const groupDefs = ROADMAP_GROUPS_BY_MODE[groupMode];
    const scoped = initiatives
      .filter(it => ROADMAP_TRACKED_TYPES.has(it.type) && !ROADMAP_HIDDEN_STATUSES.has(it.status))
      .map(it => ({ initiative: it, effectiveDate: getRoadmapEffectiveDate(it) }));

    const buildColumn = (id: string, label: string, items: typeof scoped) => ({
      id,
      label,
      total: items.length,
      groups: groupDefs.map(group => ({
        ...group,
        items: items
          .filter(({ initiative }) => group.match(initiative))
          .sort((a, b) => {
            const dateA = a.effectiveDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
            const dateB = b.effectiveDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
            return dateA - dateB || a.initiative.title.localeCompare(b.initiative.title, 'pt-BR');
          }),
      })),
    });

    const monthColumns = monthKeys.map(monthKey => {
      const items = scoped.filter(({ effectiveDate }) => effectiveDate && format(effectiveDate, 'yyyy-MM') === monthKey);
      const label = format(parseISO(`${monthKey}-01`), 'MMMM/yy', { locale: ptBR });
      return buildColumn(monthKey, label.charAt(0).toUpperCase() + label.slice(1), items);
    });

    const noDateColumn = buildColumn('sem-data', 'Sem Data', scoped.filter(({ effectiveDate }) => !effectiveDate));

    return [...monthColumns, noDateColumn];
  }, [initiatives, startMonth, endMonth, groupMode]);

  const formatItemDate = (date: Date | null) => (date ? format(date, "dd/MM'.'") : '—');
  const showGroupHeaders = groupMode !== 'none';

  return (
    <section className="roadmap-view" aria-label="Roadmap de iniciativas">
      <div className="roadmap-board">
        {columns.map(column => (
          <article className="roadmap-column" key={column.id}>
            <div className="roadmap-column-header">
              <h2>{column.label}</h2>
              <span className="roadmap-column-count">{column.total}</span>
            </div>

            {column.total === 0 && (
              <p className="roadmap-section-empty">Nenhuma iniciativa.</p>
            )}

            {column.groups.filter(group => group.items.length > 0).map(group => (
              <div className="roadmap-section" key={group.key}>
                {showGroupHeaders && (
                  <div className="roadmap-section-header" style={{ color: group.color }}>
                    <group.Icon size={13} color={group.color} />
                    <h3>{group.label}</h3>
                    <span className="roadmap-section-count">{group.items.length}</span>
                  </div>
                )}
                <ul className="roadmap-initiative-list">
                    {group.items.map(({ initiative, effectiveDate }, index) => {
                      const systemIds = Array.isArray(initiative.impactedSystemIds) ? initiative.impactedSystemIds : [];
                      const relatedSystems = systemIds
                        .map(id => systemById.get(id))
                        .filter((s): s is System => Boolean(s));
                      const systemsHint = relatedSystems.length > 0
                        ? `Sistemas: ${relatedSystems.map(sys => sys.acronym || sys.name).join(', ')}`
                        : '';
                      const isConcluded = initiative.status === '9- Concluído';
                      const overdue = isRoadmapOverdue(initiative, effectiveDate);
                      const typeMeta = ROADMAP_TYPE_META[initiative.type];
                      const formattedDate = formatItemDate(effectiveDate);
                      const previousItem = index > 0 ? group.items[index - 1] : null;
                      // Datas repetidas em sequência só aparecem na primeira linha; as demais
                      // mantêm o mesmo texto (oculto por visibility) para o título continuar alinhado.
                      const isRepeatedDate = Boolean(
                        effectiveDate && previousItem?.effectiveDate && formatItemDate(previousItem.effectiveDate) === formattedDate
                      );
                      return (
                        <li key={initiative.id} className="roadmap-item">
                          <a
                            className="roadmap-item-link"
                            href={`/iniciativas/${initiative.id}/edit`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={systemsHint || 'Sem sistemas associados'}
                          >
                            <span
                              className={`roadmap-item-date${isRepeatedDate ? ' roadmap-item-date--repeated' : ''}`}
                              aria-hidden={isRepeatedDate || undefined}
                            >
                              {formattedDate}
                            </span>
                            {typeMeta && (
                              <typeMeta.Icon size={12} color={typeMeta.color} className="roadmap-item-type-icon" aria-label={typeMeta.short} />
                            )}
                            <span className="roadmap-item-body">
                              <span
                                className={`roadmap-item-title${isConcluded ? ' roadmap-item-title--concluded' : ''}${overdue ? ' roadmap-item-title--overdue' : ''}`}
                              >
                                {initiative.title}
                              </span>
                              {isConcluded && <CheckCircle2 size={13} className="roadmap-item-check" aria-label="Concluída" />}
                              {overdue && (
                                <AlertTriangle size={13} className="overdue-alert-icon roadmap-item-alert" aria-label="Em atraso" />
                              )}
                            </span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
              </div>
            ))}
          </article>
        ))}
      </div>
    </section>
  );
};

const Dashboard: React.FC = () => {
  const { currentCompany, currentDepartment, user } = useAuth();
  const {
    selectedManagerId,
    setHeaderContent,
    setHeaderLeftActions,
    setSubHeaderContent,
    setSubHeaderActions,
  } = useView();
  const { clientTeams, businessUnits } = useClientAreas();

  const [dashboardView, setDashboardView] = React.useState<DashboardView>(
    () => (localStorage.getItem('dashboard_view') as DashboardView) || 'overview'
  );
  const [selectedPortfolioBusinessUnitId, setSelectedPortfolioBusinessUnitId] = React.useState(
    () => localStorage.getItem('dashboard_portfolio_business_unit_id') || ''
  );
  const [closedPeriodMonths, setClosedPeriodMonths] = React.useState<ClosedPeriod>(
    () => {
      const saved = Number(localStorage.getItem('dashboard_closed_period_months'));
      return saved === 6 || saved === 3 ? saved : 12;
    }
  );
  const [roadmapStartMonth, setRoadmapStartMonth] = React.useState<string>(
    () => localStorage.getItem('dashboard_roadmap_start_month') || '2026-01'
  );
  const [roadmapEndMonth, setRoadmapEndMonth] = React.useState<string>(
    () => localStorage.getItem('dashboard_roadmap_end_month') || format(addMonths(new Date(), 1), 'yyyy-MM')
  );
  // Enquanto o usuário não escolher um "Até" manualmente (sem valor salvo), ele
  // acompanha a maior data de término cadastrada na base — recalculada ao carregar.
  const roadmapEndIsAutoRef = React.useRef(!localStorage.getItem('dashboard_roadmap_end_month'));
  const [roadmapGroupMode, setRoadmapGroupMode] = React.useState<RoadmapGroupMode>(() => {
    const stored = localStorage.getItem('dashboard_roadmap_group_mode');
    return stored === 'type' || stored === 'status' ? stored : 'none';
  });
  const roadmapMonthOptions = React.useMemo(() => buildRoadmapMonthOptions(), []);
  // "Até" só lista meses a partir do mês escolhido em "De" — nunca um intervalo invertido.
  const roadmapEndMonthOptions = React.useMemo(
    () => roadmapMonthOptions.filter(option => option.id >= roadmapStartMonth),
    [roadmapMonthOptions, roadmapStartMonth]
  );

  React.useEffect(() => {
    if (roadmapEndMonth < roadmapStartMonth) {
      setRoadmapEndMonth(roadmapStartMonth);
      localStorage.setItem('dashboard_roadmap_end_month', roadmapStartMonth);
    }
  }, [roadmapStartMonth, roadmapEndMonth]);

  const [data, setData] = React.useState<{
    systems: System[];
    collaborators: Collaborator[];
    initiatives: Initiative[];
    teams: Team[];
    vendors: Vendor[];
    contracts: Contract[];
  }>({ systems: [], collaborators: [], initiatives: [], teams: [], vendors: [], contracts: [] });

  const [loading, setLoading] = React.useState(true);
  const [drilldownModal, setDrilldownModal] = React.useState<{ title: string; initiatives: Array<Initiative & { cycleTime: number | null }> } | null>(null);
  const [drilldownSort, setDrilldownSort] = React.useState<DrilldownSortConfig>(null);
  const [isDashboardViewOpen, setIsDashboardViewOpen] = React.useState(false);
  const dashboardViewMenuRef = React.useRef<HTMLDivElement | null>(null);
  const hoveredDrilldownRef = React.useRef<any>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrilldownModal(null);
        setIsDashboardViewOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  React.useEffect(() => {
    if (drilldownModal) {
      setDrilldownSort(null);
    }
  }, [drilldownModal]);

  // "Até" default = maior data de término (real ou planejada) cadastrada entre as
  // iniciativas do roadmap. Só enquanto o usuário não fixar um mês manualmente.
  React.useEffect(() => {
    if (!roadmapEndIsAutoRef.current || data.initiatives.length === 0) return;
    let maxKey: string | null = null;
    for (const it of data.initiatives) {
      if (!ROADMAP_TRACKED_TYPES.has(it.type) || ROADMAP_HIDDEN_STATUSES.has(it.status)) continue;
      const eff = getRoadmapEffectiveDate(it);
      if (!eff) continue;
      const key = format(eff, 'yyyy-MM');
      if (!maxKey || key > maxKey) maxKey = key;
    }
    if (!maxKey) return;
    // Não ultrapassa o último mês disponível nos combos.
    const lastOption = roadmapMonthOptions[roadmapMonthOptions.length - 1]?.id;
    if (lastOption && maxKey > lastOption) maxKey = lastOption;
    setRoadmapEndMonth(prev => (prev === maxKey ? prev : maxKey as string));
  }, [data.initiatives, roadmapMonthOptions]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dashboardViewMenuRef.current && !dashboardViewMenuRef.current.contains(e.target as Node)) {
        setIsDashboardViewOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedPortfolioBusinessUnit = React.useMemo(
    () => businessUnits.find(unit => unit.id === selectedPortfolioBusinessUnitId) ?? null,
    [businessUnits, selectedPortfolioBusinessUnitId]
  );

  React.useEffect(() => {
    if (dashboardView !== 'portfolio' || businessUnits.length === 0 || selectedPortfolioBusinessUnit) return;
    const firstUnit = [...businessUnits].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))[0];
    setSelectedPortfolioBusinessUnitId(firstUnit.id);
    localStorage.setItem('dashboard_portfolio_business_unit_id', firstUnit.id);
  }, [businessUnits, dashboardView, selectedPortfolioBusinessUnit]);

  const selectedManager = selectedManagerId !== 'all'
    ? data.collaborators.find(c => c.id === selectedManagerId)
    : null;
  const effectiveRole = selectedManager?.role ?? user?.role;
  const isDirector = effectiveRole === 'Master' || effectiveRole === 'Director' || effectiveRole === 'Head';

  const getDrilldownPayload = React.useCallback((state: any) => {
    return state?.activePayload?.[0]?.payload ?? hoveredDrilldownRef.current;
  }, []);

  const handleBarHover = React.useCallback((state: any) => {
    hoveredDrilldownRef.current = state?.activePayload?.[0]?.payload ?? null;
  }, []);

  const handleBarLeave = React.useCallback(() => {
    hoveredDrilldownRef.current = null;
  }, []);

  const openDrilldownFromState = React.useCallback((state: any) => {
    const payload = getDrilldownPayload(state);
    if (payload?.initiatives?.length > 0) {
      setDrilldownModal({ title: payload.drilldownTitle, initiatives: payload.initiatives });
    }
  }, [getDrilldownPayload]);

  const handleDrilldownSort = React.useCallback((key: DrilldownSortKey) => {
    setDrilldownSort(current => {
      if (current?.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  }, []);

  const renderDrilldownSortIcon = React.useCallback((key: DrilldownSortKey) => {
    if (drilldownSort?.key !== key) {
      return <ChevronDown size={11} style={{ opacity: 0.3 }} />;
    }
    return drilldownSort.direction === 'asc'
      ? <ChevronUp size={11} />
      : <ChevronDown size={11} />;
  }, [drilldownSort]);

  const formatDrilldownTitle = React.useCallback((title?: string | null) => {
    const value = (title || '—').trim();
    if (value.length <= 53) return value;

    const breakAt = value.lastIndexOf(' ', 53);
    if (breakAt > 0) {
      return `${value.slice(0, breakAt)}\n${value.slice(breakAt + 1)}`;
    }

    return `${value.slice(0, 53)}\n${value.slice(53)}`;
  }, []);

  // ── Header view selector ───────────────────────────────────────────────────
  // Faixa 1: só as três visões (Geral, Indicadores, Portfólio). O recorte de
  // cada visão — Abertas/Fechadas, período, Área de Negócio — desceu para a
  // faixa 2 (D14), eliminando os submenus em cascata que existiam aqui.
  React.useEffect(() => {
    const titleByView: Record<DashboardView, string> = {
      overview: 'Geral',
      closed: 'Indicadores',
      open: 'Indicadores',
      portfolio: 'Portfólio',
      roadmap: 'Roadmap',
    };
    const iconByView: Record<DashboardView, typeof BarChart3> = {
      overview: BarChart3,
      closed: TrendingUp,
      open: TrendingUp,
      portfolio: Briefcase,
      roadmap: MapIcon,
    };
    const viewOptions = [
      {
        id: 'overview' as const,
        label: 'Geral',
        description: 'KPIs, contratos, férias e aniversariantes',
        icon: BarChart3,
      },
      {
        id: 'indicadores' as const,
        label: 'Indicadores',
        description: 'Iniciativas abertas e fechadas',
        icon: TrendingUp,
      },
      {
        id: 'portfolio' as const,
        label: 'Portfólio',
        description: 'Consolidado por Área de Negócio',
        icon: Briefcase,
      },
      {
        id: 'roadmap' as const,
        label: 'Roadmap',
        description: 'Cronograma mensal por tipo de demanda',
        icon: MapIcon,
      },
    ];
    const SelectedViewIcon = iconByView[dashboardView];
    const selectedViewLabel = titleByView[dashboardView];
    const isIndicadoresView = dashboardView === 'open' || dashboardView === 'closed';
    const set = (v: DashboardView) => {
      setDashboardView(v);
      localStorage.setItem('dashboard_view', v);
      setIsDashboardViewOpen(false);
    };

    setHeaderContent(
      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
        {selectedViewLabel}
      </div>
    );
    setHeaderLeftActions(
      <div
        ref={dashboardViewMenuRef}
        style={{ position: 'relative', flexShrink: 0 }}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Mesmas classes do `ViewMenu` das demais seções — o dashboard não usa
            o componente porque suas visões não são roteadas, mas o visual é o
            mesmo trigger icon-only. */}
        <button
          type="button"
          className="view-menu-trigger view-menu-trigger--icon-only"
          aria-haspopup="menu"
          aria-expanded={isDashboardViewOpen}
          aria-label={`Trocar visão. Visão atual: ${selectedViewLabel}`}
          title={selectedViewLabel}
          onClick={() => setIsDashboardViewOpen(open => !open)}
        >
          <SelectedViewIcon size={15} aria-hidden="true" />
          <ChevronsUpDown size={12} className="view-menu-trigger-chevron" aria-hidden="true" />
        </button>

        {isDashboardViewOpen && (
          <div className="view-menu" role="menu" aria-label="Tipos de visão do dashboard">
            {viewOptions.map(option => {
              const OptionIcon = option.icon;
              const active = option.id === 'indicadores' ? isIndicadoresView : option.id === dashboardView;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  title={option.description}
                  className={`view-menu-item ${active ? 'is-active' : ''}`}
                  // "Indicadores" abre no recorte corrente; a troca Abertas/Fechadas
                  // fica no combo da faixa 2.
                  onClick={() => set(option.id === 'indicadores' ? (isIndicadoresView ? dashboardView : 'open') : option.id)}
                >
                  <OptionIcon size={14} aria-hidden="true" />
                  <span className="view-menu-item-label">{option.label}</span>
                  {active && <CheckCircle2 size={14} className="view-menu-item-check" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
    return () => {
      setHeaderContent(null);
      setHeaderLeftActions(null);
    };
  }, [dashboardView, isDashboardViewOpen, setHeaderContent, setHeaderLeftActions]);


  // ── Fetch ──────────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!currentCompany) {
      setData({ systems: [], collaborators: [], initiatives: [], teams: [], vendors: [], contracts: [] });
      setLoading(true);
      return;
    }
    const fetchData = async () => {
      try {
        const d = await fetchDashboardData({ companyId: currentCompany.id, departmentId: currentDepartment?.id });
        const normalizedInits: Initiative[] = d.initiatives.map(it => ({
          ...it,
          status: (oldToNewMap[it.status] || it.status) as Initiative['status']
        }));
        setData({
          systems: d.systems,
          collaborators: d.collaborators,
          initiatives: normalizedInits,
          teams: d.teams,
          vendors: d.vendors,
          contracts: d.contracts,
        });
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentCompany, currentDepartment]);

  // ── Hierarchy ──────────────────────────────────────────────────────────────
  const getManagerHierarchy = (managerId: string) => {
    if (managerId === 'all') return null;
    const getSubtreeTeams = (pId: string): string[] => {
      const children = data.teams.filter(t => t.parentTeamId === pId);
      return [pId, ...children.flatMap(c => getSubtreeTeams(c.id))];
    };
    const rootTeams = data.teams.filter(t => t.leaderId === managerId);
    const allTeamIdsInSubtree = rootTeams.flatMap(rt => getSubtreeTeams(rt.id));
    const leaderIds = Array.from(new Set(
      data.teams
        .filter(t => allTeamIdsInSubtree.includes(t.id))
        .map(t => t.leaderId)
        .filter(Boolean) as string[]
    ));
    if (!leaderIds.includes(managerId)) leaderIds.push(managerId);
    return { teamIds: allTeamIdsInSubtree, leaderIds };
  };

  const hierarchy = getManagerHierarchy(selectedManagerId);

  const leaderParentMap = React.useMemo(() => {
    const map = new Map<string, string>();
    if (!hierarchy) return map;

    const teamById = new Map(data.teams.map(team => [team.id, team] as const));
    const scope = new Set(hierarchy.teamIds);

    const walk = (teamId: string, ancestorLeaderId: string | null) => {
      const team = teamById.get(teamId);
      if (!team || !scope.has(teamId)) return;

      const currentLeaderId = team.leaderId ?? ancestorLeaderId;
      const childTeams = data.teams.filter(child => child.parentTeamId === teamId && scope.has(child.id));

      for (const child of childTeams) {
        if (child.leaderId && currentLeaderId) {
          map.set(child.leaderId, currentLeaderId);
        }
        walk(child.id, currentLeaderId);
      }
    };

    data.teams
      .filter(team => team.leaderId === selectedManagerId && scope.has(team.id))
      .forEach(rootTeam => walk(rootTeam.id, rootTeam.leaderId));

    return map;
  }, [data.teams, hierarchy, selectedManagerId]);

  const getLeaderVolumeBucket = React.useCallback((leaderId: string) => {
    if (!hierarchy || leaderId === selectedManagerId || !hierarchy.leaderIds.includes(leaderId)) {
      return leaderId;
    }

    let currentLeaderId = leaderId;
    const visited = new Set<string>([leaderId]);

    while (true) {
      const parentLeaderId = leaderParentMap.get(currentLeaderId);
      if (!parentLeaderId || parentLeaderId === selectedManagerId || visited.has(parentLeaderId)) {
        return currentLeaderId;
      }
      visited.add(parentLeaderId);
      currentLeaderId = parentLeaderId;
    }
  }, [hierarchy, leaderParentMap, selectedManagerId]);

  const asStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value.filter((v): v is string => typeof v === 'string');
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter((v): v is string => typeof v === 'string');
        }
      } catch {
        return [];
      }
    }

    return [];
  };

  const filtered = React.useMemo(() => {
    if (!hierarchy) return data;
    const hierarchySysIds = new Set(
      data.systems
        .filter(s => s.ownerTeamId && hierarchy.teamIds.includes(s.ownerTeamId))
        .map(s => s.id)
    );
    return {
      ...data,
      initiatives: data.initiatives.filter(it =>
        hierarchy.leaderIds.includes(it.leaderId) ||
        (it.assignedManagerId && hierarchy.leaderIds.includes(it.assignedManagerId)) ||
        asStringArray(it.impactedSystemIds).some(sysId => hierarchySysIds.has(sysId))
      ),
      collaborators: data.collaborators.filter(c =>
        hierarchy.leaderIds.includes(c.id) ||
        (c.squadId && hierarchy.teamIds.includes(c.squadId))
      ),
      systems: data.systems.filter(s =>
        s.ownerTeamId && hierarchy.teamIds.includes(s.ownerTeamId)
      ),
      contracts: data.contracts.filter(c =>
        !c.leaderId || hierarchy.leaderIds.includes(c.leaderId)
      ),
    };
  }, [data, hierarchy]);

  const portfolioHeaderTotals = React.useMemo(() => {
    if (!selectedPortfolioBusinessUnit) return { delivered: 0, inProgress: 0 };

    const clientTeamIds = new Set(
      clientTeams
        .filter(team => team.businessUnitId === selectedPortfolioBusinessUnit.id)
        .map(team => team.id)
    );
    const portfolioInitiatives = filtered.initiatives.filter(initiative =>
      Boolean(initiative.clientTeamId && clientTeamIds.has(initiative.clientTeamId))
    );

    return {
      delivered: portfolioInitiatives.filter(initiative => initiative.status === '9- Concluído').length,
      inProgress: portfolioInitiatives.filter(initiative => PORTFOLIO_OPEN_STATUSES.has(initiative.status)).length,
    };
  }, [clientTeams, filtered.initiatives, selectedPortfolioBusinessUnit]);

  // ── Sub-header por visão (D14) ─────────────────────────────────────────────
  // Faixa 2 sem título: à esquerda os combos que recortam a visão corrente, à
  // direita os totais consolidados do Portfólio.
  React.useEffect(() => {
    const isIndicadoresView = dashboardView === 'open' || dashboardView === 'closed';

    if (isIndicadoresView) {
      setSubHeaderContent(
        <>
          <HeaderSelect<DashboardView>
            value={dashboardView}
            options={[
              { id: 'open', label: 'Iniciativas Abertas', icon: Activity, description: 'Forecast, funil, área e backlog' },
              { id: 'closed', label: 'Iniciativas Fechadas', icon: CheckCircle2, description: 'Histórico, prazo, área e tipo' },
            ]}
            onChange={view => {
              setDashboardView(view);
              localStorage.setItem('dashboard_view', view);
            }}
            ariaLabel="Recorte dos indicadores"
            minWidth={186}
          />
          {/* O período só faz sentido no histórico de fechadas */}
          {dashboardView === 'closed' && (
            <HeaderSelect<ClosedPeriod>
              value={closedPeriodMonths}
              options={[
                { id: 12, label: '12 meses' },
                { id: 6, label: '6 meses' },
                { id: 3, label: '3 meses' },
              ]}
              onChange={months => {
                setClosedPeriodMonths(months);
                localStorage.setItem('dashboard_closed_period_months', String(months));
              }}
              ariaLabel="Período da visão de iniciativas encerradas"
              minWidth={116}
            />
          )}
        </>
      );
      return () => setSubHeaderContent(null);
    }

    if (dashboardView === 'portfolio') {
      setSubHeaderContent(
        <HeaderSelect<string>
          value={selectedPortfolioBusinessUnitId || null}
          options={[...businessUnits]
            .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
            .map(unit => ({ id: unit.id, label: unit.name, icon: Briefcase }))}
          onChange={id => {
            setSelectedPortfolioBusinessUnitId(id);
            localStorage.setItem('dashboard_portfolio_business_unit_id', id);
          }}
          ariaLabel="Área de Negócio do portfólio"
          placeholder="Área de Negócio"
          emptyLabel="Nenhuma Área de Negócio cadastrada."
          minWidth={200}
        />
      );
      setSubHeaderActions(
        <div className="portfolio-header-totals" aria-label="Resumo do portfólio">
          <div
            className="portfolio-header-total portfolio-header-total--delivered"
            title={`Entregues: ${portfolioHeaderTotals.delivered}`}
          >
            <span>Entregues</span>
            <strong>{portfolioHeaderTotals.delivered}</strong>
          </div>
          <div
            className="portfolio-header-total portfolio-header-total--progress"
            title={`Backlog / andamento: ${portfolioHeaderTotals.inProgress}`}
          >
            <span>Backlog / andamento</span>
            <strong>{portfolioHeaderTotals.inProgress}</strong>
          </div>
        </div>
      );
      return () => {
        setSubHeaderContent(null);
        setSubHeaderActions(null);
      };
    }

    if (dashboardView === 'roadmap') {
      const monthLabelStyle: React.CSSProperties = {
        fontSize: '0.68rem',
        fontWeight: 400,
        color: 'var(--text-primary)',
        textTransform: 'none',
        textDecoration: 'none',
      };
      setSubHeaderContent(
        <>
          <span style={monthLabelStyle}>Agrupamento</span>
          <SegmentedToggle<RoadmapGroupMode>
            value={roadmapGroupMode}
            iconOnly
            options={[
              { id: 'none', label: 'Nenhum', icon: List, title: 'Sem agrupamento' },
              { id: 'status', label: 'Situação', icon: CheckCircle2, title: 'Agrupar por situação: Abertas e Fechadas' },
              { id: 'type', label: 'Tipo', icon: Layers, title: 'Agrupar por tipo: Estruturantes, Projetos e Fast Tracks' },
            ]}
            onChange={mode => {
              setRoadmapGroupMode(mode);
              localStorage.setItem('dashboard_roadmap_group_mode', mode);
            }}
            ariaLabel="Agrupamento do roadmap"
          />
        </>
      );
      setSubHeaderActions(
        <>
          <span style={monthLabelStyle}>De</span>
          <HeaderSelect<string>
            value={roadmapStartMonth}
            options={roadmapMonthOptions}
            onChange={month => {
              setRoadmapStartMonth(month);
              localStorage.setItem('dashboard_roadmap_start_month', month);
            }}
            ariaLabel="Mês inicial do roadmap"
            minWidth={140}
          />
          <span style={monthLabelStyle}>Até</span>
          <HeaderSelect<string>
            value={roadmapEndMonth}
            options={roadmapEndMonthOptions}
            onChange={month => {
              roadmapEndIsAutoRef.current = false;
              setRoadmapEndMonth(month);
              localStorage.setItem('dashboard_roadmap_end_month', month);
            }}
            ariaLabel="Mês final do roadmap"
            minWidth={140}
          />
        </>
      );
      return () => {
        setSubHeaderContent(null);
        setSubHeaderActions(null);
      };
    }

    // Geral não tem recorte próprio — a faixa 2 some.
    return undefined;
  }, [
    businessUnits,
    closedPeriodMonths,
    dashboardView,
    portfolioHeaderTotals.delivered,
    portfolioHeaderTotals.inProgress,
    roadmapEndMonth,
    roadmapEndMonthOptions,
    roadmapGroupMode,
    roadmapMonthOptions,
    roadmapStartMonth,
    selectedPortfolioBusinessUnitId,
    setSubHeaderActions,
    setSubHeaderContent,
  ]);


  const currentYear = new Date().getFullYear();
  const closedPeriodWindow = React.useMemo(() => {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end.getFullYear(), end.getMonth() - (closedPeriodMonths - 1), 1);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }, [closedPeriodMonths]);
  const inClosedPeriod = React.useCallback((it: Initiative) => {
    const dateStr = it.actualEndDate || it.endDate;
    if (!dateStr) return false;
    try {
      const d = parseISO(dateStr);
      return d >= closedPeriodWindow.start && d <= closedPeriodWindow.end;
    } catch {
      return false;
    }
  }, [closedPeriodWindow]);

  if (loading) return (
    <div className="spinner-container">
      <div className="spinner"></div>
      <span>Carregando ecossistema...</span>
    </div>
  );

  // ── Helpers ────────────────────────────────────────────────────────────────

  const isOnTime = (it: Initiative): boolean => {
    const actual = it.actualEndDate || it.endDate;
    const planned = it.endDate;
    if (!actual || !planned) return true;
    return actual <= planned;
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n);

  // ── View 1: Visão Geral ────────────────────────────────────────────────────

  const getUpcomingVacations = () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const limit = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
    return filtered.collaborators
      .filter(c => {
        if (!c.vacationStart) return false;
        try { const d = parseISO(c.vacationStart); return d >= today && d <= limit; }
        catch { return false; }
      })
      .sort((a, b) => parseISO(a.vacationStart!).getTime() - parseISO(b.vacationStart!).getTime());
  };

  const getUpcomingBirthdays = (): Array<Collaborator & { nextBirthday: Date }> => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const limit = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
    const result: Array<Collaborator & { nextBirthday: Date }> = [];
    filtered.collaborators.forEach(c => {
      if (!c.birthday) return;
      const [mm, dd] = c.birthday.split('-').map(Number);
      const thisYear = new Date(today.getFullYear(), mm - 1, dd);
      const nextYear = new Date(today.getFullYear() + 1, mm - 1, dd);
      const next = thisYear >= today && thisYear <= limit ? thisYear
        : nextYear >= today && nextYear <= limit ? nextYear
        : null;
      if (next) result.push({ ...c, nextBirthday: next });
    });
    return result.sort((a, b) => a.nextBirthday.getTime() - b.nextBirthday.getTime());
  };

  // ── View 2: Iniciativas Encerradas ─────────────────────────────────────────

  const computeCycleTime = (it: Initiative): number | null => {
    if (!it.startDate) return null;
    try {
      const start = parseISO(it.startDate);
      const end = parseISO(it.actualEndDate || it.endDate!);
      return Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    } catch { return null; }
  };

  const getLast12MonthsClosedData = () => {
    const today = new Date();
    const months = Array.from({ length: closedPeriodMonths }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - (closedPeriodMonths - 1 - i), 1);
      return { year: d.getFullYear(), month: d.getMonth(), label: format(d, 'MMM/yy', { locale: ptBR }).replace('.', '') };
    });
    const concluded = filtered.initiatives.filter(it => it.status === '9- Concluído' && inClosedPeriod(it));
    return months.map(m => {
      const inits = concluded.filter(it => {
        const dateStr = it.actualEndDate || it.endDate;
        if (!dateStr) return false;
        try { const d = parseISO(dateStr); return d.getFullYear() === m.year && d.getMonth() === m.month; }
        catch { return false; }
      });
      const noPrazo = inits.filter(it => isOnTime(it)).length;
      const total = inits.length;
      const atrasado = total - noPrazo;
      const pctNoPrazo = total > 0 ? Math.round(noPrazo / total * 100) : 0;
      return { name: m.label, noPrazo, atrasado, total, list: inits.map(it => it.title), pctNoPrazo, pctAtrasado: total > 0 ? 100 - pctNoPrazo : 0, totalWhenPerfect: atrasado === 0 ? total : 0, initiatives: inits.map(it => ({ ...it, cycleTime: computeCycleTime(it) })), drilldownTitle: `Encerradas em ${m.label}` };
    });
  };

  const getCycleTimeData = () => {
    const today = new Date();
    const months = Array.from({ length: closedPeriodMonths }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - (closedPeriodMonths - 1 - i), 1);
      return { year: d.getFullYear(), month: d.getMonth(), label: format(d, 'MMM/yy', { locale: ptBR }).replace('.', '') };
    });
    const concluded = filtered.initiatives.filter(it => it.status === '9- Concluído' && inClosedPeriod(it));
    return months.map(m => {
      const inits = concluded.filter(it => {
        const dateStr = it.actualEndDate || it.endDate;
        if (!dateStr) return false;
        try { const d = parseISO(dateStr); return d.getFullYear() === m.year && d.getMonth() === m.month; }
        catch { return false; }
      });
      const initData = inits.map(it => {
        if (!it.startDate) return { ...it, cycleTime: null as number | null };
        try {
          const start = parseISO(it.startDate);
          const end = parseISO(it.actualEndDate || it.endDate!);
          return { ...it, cycleTime: Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))) };
        } catch { return { ...it, cycleTime: null as number | null }; }
      });
      const withCycle = initData.filter(it => it.cycleTime !== null);
      const avgDays = withCycle.length > 0
        ? Math.round(withCycle.reduce((sum, it) => sum + (it.cycleTime ?? 0), 0) / withCycle.length)
        : 0;
      return { name: m.label, avgDays, count: withCycle.length, initiatives: initData, drilldownTitle: `Cycle Time — ${m.label}` };
    });
  };

  const getClosedAreaData = () => {
    const areas: Record<string, { name: string; noPrazo: number; atrasado: number; total: number; list: string[]; initiatives: Array<Initiative & { cycleTime: number | null }> }> = {};
    filtered.initiatives.filter(it => it.status === '9- Concluído' && inClosedPeriod(it)).forEach(it => {
      const area = it.originDirectorate || 'Não Definida';
      if (!areas[area]) areas[area] = { name: area, noPrazo: 0, atrasado: 0, total: 0, list: [], initiatives: [] };
      areas[area].total++;
      areas[area].list.push(it.title);
      areas[area].initiatives.push({ ...it, cycleTime: computeCycleTime(it) });
      if (isOnTime(it)) areas[area].noPrazo++; else areas[area].atrasado++;
    });
    return Object.values(areas).sort((a, b) => b.total - a.total).map(a => ({
      ...a,
      pctNoPrazo: a.total > 0 ? Math.round(a.noPrazo / a.total * 100) : 0,
      pctAtrasado: a.total > 0 ? Math.round(a.atrasado / a.total * 100) : 0,
      totalWhenPerfect: a.atrasado === 0 ? a.total : 0,
      drilldownTitle: `Área: ${a.name}`,
    }));
  };

  const getClosedSystemData = () => {
    const systems: Record<string, { name: string; total: number; list: string[]; initiatives: Array<Initiative & { cycleTime: number | null }> }> = {};
    filtered.initiatives.filter(it => it.status === '9- Concluído' && inClosedPeriod(it)).forEach(it => {
      (it.impactedSystemIds || []).forEach(sysId => {
        const sys = data.systems.find(s => s.id === sysId);
        if (!sys) return;
        if (!systems[sysId]) systems[sysId] = { name: sys.name, total: 0, list: [], initiatives: [] };
        systems[sysId].total++;
        systems[sysId].list.push(it.title);
        systems[sysId].initiatives.push({ ...it, cycleTime: computeCycleTime(it) });
      });
    });
    return Object.values(systems)
      .sort((a, b) => b.total - a.total)
      .map(s => ({ ...s, drilldownTitle: `Sistema: ${s.name}` }));
  };

  const getClosedCollaboratorData = () => {
    const ENGINEER_ROLES = new Set(['Engineer', 'Analyst']);
    const collabs: Record<string, { name: string; photoUrl: string | null; total: number; list: string[]; initiatives: Array<Initiative & { cycleTime: number | null }> }> = {};
    filtered.initiatives.filter(it => it.status === '9- Concluído' && inClosedPeriod(it)).forEach(it => {
      const ids = new Set<string>([...(it.memberIds || [])]);
      if (it.leaderId) ids.add(it.leaderId);
      ids.forEach(collabId => {
        const c = data.collaborators.find(col => col.id === collabId);
        if (!c || !ENGINEER_ROLES.has(c.role)) return;
        if (!collabs[collabId]) collabs[collabId] = { name: c.name, photoUrl: c.photoUrl || null, total: 0, list: [], initiatives: [] };
        collabs[collabId].total++;
        collabs[collabId].list.push(it.title);
        collabs[collabId].initiatives.push({ ...it, cycleTime: computeCycleTime(it) });
      });
    });
    return Object.values(collabs)
      .sort((a, b) => b.total - a.total)
      .slice(0, 15)
      .map(c => ({ ...c, drilldownTitle: `Colaborador: ${c.name}` }));
  };

  const getTypeComparisonData = () => {
    const types = [
      { key: '1- Estratégico', label: 'Estratégico' },
      { key: '2- Projeto',     label: 'Projeto' },
      { key: '3- Fast Track',  label: 'Fast Track' },
      { key: '4- PBI',         label: 'PBI' },
    ];
    const concluded = filtered.initiatives.filter(it => it.status === '9- Concluído' && inClosedPeriod(it));
    return types.map(t => {
      const inits = concluded.filter(it => it.type === t.key);
      const noPrazo = inits.filter(it => isOnTime(it)).length;
      const atrasado = inits.length - noPrazo;
      const pctOnTime = inits.length > 0 ? Math.round(noPrazo / inits.length * 100) : 0;
      return { name: t.label, noPrazo, atrasado, total: inits.length, pctOnTime, pctAtrasado: inits.length > 0 ? 100 - pctOnTime : 0, totalWhenPerfect: atrasado === 0 ? inits.length : 0, initiatives: inits.map(it => ({ ...it, cycleTime: computeCycleTime(it) })), drilldownTitle: `Tipo: ${t.label}` };
    }).filter(t => t.total > 0);
  };

  const getLeaderOnTimeData = () => {
    const mgrs: Record<string, { id: string; name: string; photoUrl: string | null; noPrazo: number; atrasado: number; total: number; list: string[]; initiatives: Array<Initiative & { cycleTime: number | null }> }> = {};
    const bucketSeenInitiatives = new Map<string, Set<string>>();

    // System IDs owned by teams in the current hierarchy scope
    const hierarchySysIds = new Set(filtered.systems.map(s => s.id));

    // Base pool: concluded initiatives within the hierarchy scope
    const poolIds = new Set<string>();
    const pool: Initiative[] = [];
    filtered.initiatives.filter(it => it.status === '9- Concluído' && inClosedPeriod(it)).forEach(it => {
      poolIds.add(it.id);
      pool.push(it);
    });

    // Also include concluded initiatives outside the scope that impact a hierarchy-owned system
    // (e.g. an initiative led by another leader that impacts Quelly's team's systems)
    if (hierarchy) {
      data.initiatives
        .filter(it => it.status === '9- Concluído' && !poolIds.has(it.id) && inClosedPeriod(it))
        .forEach(it => {
          if ((it.impactedSystemIds || []).some(sid => hierarchySysIds.has(sid))) {
            poolIds.add(it.id);
            pool.push(it);
          }
        });
    }

    pool.forEach(it => {
      // Collect unique manager IDs: primary leader + leaders of teams that own impacted systems
      const managerIds = new Set<string>();
      if (it.leaderId) managerIds.add(it.leaderId);
      (it.impactedSystemIds || []).forEach(sysId => {
        const sys = data.systems.find(s => s.id === sysId);
        if (!sys) return;
        const team = data.teams.find(t => t.id === sys.ownerTeamId);
        if (team?.leaderId) managerIds.add(team.leaderId);
      });
      managerIds.forEach(managerId => {
        // Only credit managers who belong to the current hierarchy scope
        if (hierarchy && !hierarchy.leaderIds.includes(managerId)) return;
        const bucketId = getLeaderVolumeBucket(managerId);
        const seen = bucketSeenInitiatives.get(bucketId) ?? new Set<string>();
        if (seen.has(it.id)) return;
        seen.add(it.id);
        bucketSeenInitiatives.set(bucketId, seen);
        const c = data.collaborators.find(col => col.id === bucketId);
        const name = c?.name || 'Desconhecido';
        if (!mgrs[bucketId]) mgrs[bucketId] = { id: bucketId, name, photoUrl: c?.photoUrl || null, noPrazo: 0, atrasado: 0, total: 0, list: [], initiatives: [] };
        mgrs[bucketId].total++;
        mgrs[bucketId].list.push(it.title);
        mgrs[bucketId].initiatives.push({ ...it, cycleTime: computeCycleTime(it) });
        if (isOnTime(it)) mgrs[bucketId].noPrazo++; else mgrs[bucketId].atrasado++;
      });
    });
    return Object.values(mgrs).sort((a, b) => b.total - a.total).slice(0, 6).map(m => ({
      ...m,
      pctNoPrazo: m.total > 0 ? Math.round(m.noPrazo / m.total * 100) : 0,
      pctAtrasado: m.total > 0 ? Math.round(m.atrasado / m.total * 100) : 0,
      totalWhenPerfect: m.atrasado === 0 ? m.total : 0,
      drilldownTitle: `Gestor: ${m.name}`,
    }));
  };

  const getCycleTimeByTypeData = () => {
    const types = [
      { key: '1- Estratégico', label: 'Estratégico' },
      { key: '2- Projeto',     label: 'Projeto' },
      { key: '3- Fast Track',  label: 'Fast Track' },
      { key: '4- PBI',         label: 'PBI' },
    ];
    const concluded = filtered.initiatives.filter(it => it.status === '9- Concluído' && inClosedPeriod(it));
    return types.map(t => {
      const inits = concluded.filter(it => it.type === t.key);
      const initData = inits.map(it => ({ ...it, cycleTime: computeCycleTime(it) }));
      const withCycle = initData.filter(it => it.cycleTime !== null);
      const avgDays = withCycle.length > 0
        ? Math.round(withCycle.reduce((sum, it) => sum + (it.cycleTime ?? 0), 0) / withCycle.length)
        : 0;
      return { name: t.label, avgDays, count: withCycle.length, initiatives: initData, drilldownTitle: `Cycle Time — ${t.label}` };
    }).filter(t => t.initiatives.length > 0);
  };

  // ── View 3: Iniciativas Abertas ────────────────────────────────────────────

  const OPEN_STATUSES = [
    '1- Backlog',
    '2- Discovery',
    '3- Planejamento',
    '4- Aguardando Capacidade',
    '5- Construção',
    '6- QA',
    '7- UAT',
    '8- Implantação',
  ];

  const getOpenInitiatives = () =>
    filtered.initiatives.filter(it => OPEN_STATUSES.includes(it.status));

  const isOpenOnTime = (it: Initiative): boolean => {
    if (!it.endDate) return true;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const planned = parseISO(it.endDate);
      planned.setHours(0, 0, 0, 0);
      return planned.getTime() >= today.getTime();
    } catch {
      return true;
    }
  };

  const computeOpenCycleTime = (it: Initiative): number | null => {
    if (!it.startDate) return null;
    try {
      const start = parseISO(it.startDate);
      const end = new Date();
      return Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    } catch {
      return null;
    }
  };

  const getLast12MonthsOpenData = () => {
    const inScope = getOpenInitiatives();
    // Collect all months where open initiatives have a planned end date
    const monthSet = new Set<string>();
    inScope.forEach(it => {
      const dateStr = it.actualEndDate || it.endDate || it.businessExpectationDate;
      if (!dateStr) return;
      try {
        const d = parseISO(dateStr);
        monthSet.add(`${d.getFullYear()}-${d.getMonth()}`);
      } catch { /* ignore */ }
    });
    if (monthSet.size === 0) return [];
    // Build sorted month list from min to max
    const parsed = Array.from(monthSet).map(k => {
      const [y, m] = k.split('-').map(Number);
      return { year: y, month: m };
    }).sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
    const months = parsed.map(({ year, month }) => ({
      year, month,
      label: format(new Date(year, month, 1), 'MMM/yy', { locale: ptBR }).replace('.', ''),
    }));
    return months.map(m => {
      const inits = inScope.filter(it => {
        const dateStr = it.actualEndDate || it.endDate || it.businessExpectationDate;
        if (!dateStr) return false;
        try {
          const d = parseISO(dateStr);
          return d.getFullYear() === m.year && d.getMonth() === m.month;
        } catch { return false; }
      });
      const noPrazo = inits.filter(it => isOpenOnTime(it)).length;
      const total = inits.length;
      const atrasado = total - noPrazo;
      const pctNoPrazo = total > 0 ? Math.round(noPrazo / total * 100) : 0;
      return {
        name: m.label,
        noPrazo,
        atrasado,
        total,
        pctNoPrazo,
        pctAtrasado: total > 0 ? 100 - pctNoPrazo : 0,
        totalWhenPerfect: atrasado === 0 ? total : 0,
        initiatives: inits.map(it => ({ ...it, cycleTime: computeOpenCycleTime(it) })),
        drilldownTitle: `Abertas — ${m.label}`,
      };
    });
  };

  const getOpenCycleTimeData = () => {
    const inScope = getOpenInitiatives();
    // Use the same dynamic month range as the volume chart
    const monthSet = new Set<string>();
    inScope.forEach(it => {
      const dateStr = it.actualEndDate || it.endDate || it.businessExpectationDate;
      if (!dateStr) return;
      try {
        const d = parseISO(dateStr);
        monthSet.add(`${d.getFullYear()}-${d.getMonth()}`);
      } catch { /* ignore */ }
    });
    if (monthSet.size === 0) return [];
    const months = Array.from(monthSet).map(k => {
      const [y, m] = k.split('-').map(Number);
      return { year: y, month: m };
    }).sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
      .map(({ year, month }) => ({
        year, month,
        label: format(new Date(year, month, 1), 'MMM/yy', { locale: ptBR }).replace('.', ''),
      }));
    return months.map(m => {
      const inits = inScope.filter(it => {
        const dateStr = it.actualEndDate || it.endDate || it.businessExpectationDate;
        if (!dateStr) return false;
        try {
          const d = parseISO(dateStr);
          return d.getFullYear() === m.year && d.getMonth() === m.month;
        } catch { return false; }
      });
      const initData = inits.map(it => ({ ...it, cycleTime: computeOpenCycleTime(it) }));
      const withCycle = initData.filter(it => it.cycleTime !== null);
      const avgDays = withCycle.length > 0
        ? Math.round(withCycle.reduce((sum, it) => sum + (it.cycleTime ?? 0), 0) / withCycle.length)
        : 0;
      return { name: m.label, avgDays, count: withCycle.length, initiatives: initData, drilldownTitle: `Cycle Time — ${m.label}` };
    });
  };

  const getOpenAreaDataDetailed = () => {
    const areas: Record<string, { name: string; noPrazo: number; atrasado: number; total: number; initiatives: Array<Initiative & { cycleTime: number | null }> }> = {};
    getOpenInitiatives().forEach(it => {
      const area = it.originDirectorate || 'Não Definida';
      if (!areas[area]) areas[area] = { name: area, noPrazo: 0, atrasado: 0, total: 0, initiatives: [] };
      areas[area].total++;
      areas[area].initiatives.push({ ...it, cycleTime: computeOpenCycleTime(it) });
      if (isOpenOnTime(it)) areas[area].noPrazo++; else areas[area].atrasado++;
    });
    return Object.values(areas).sort((a, b) => b.total - a.total).map(a => ({
      ...a,
      pctNoPrazo: a.total > 0 ? Math.round(a.noPrazo / a.total * 100) : 0,
      pctAtrasado: a.total > 0 ? Math.round(a.atrasado / a.total * 100) : 0,
      totalWhenPerfect: a.atrasado === 0 ? a.total : 0,
      drilldownTitle: `Área: ${a.name}`,
    }));
  };

  const getOpenSystemData = () => {
    const systems: Record<string, { name: string; total: number; initiatives: Array<Initiative & { cycleTime: number | null }> }> = {};
    getOpenInitiatives().forEach(it => {
      (it.impactedSystemIds || []).forEach(sysId => {
        const sys = data.systems.find(s => s.id === sysId);
        if (!sys) return;
        if (!systems[sysId]) systems[sysId] = { name: sys.name, total: 0, initiatives: [] };
        systems[sysId].total++;
        systems[sysId].initiatives.push({ ...it, cycleTime: computeOpenCycleTime(it) });
      });
    });
    return Object.values(systems)
      .sort((a, b) => b.total - a.total)
      .map(s => ({ ...s, drilldownTitle: `Sistema: ${s.name}` }));
  };

  const getOpenCollaboratorData = () => {
    const ENGINEER_ROLES = new Set(['Engineer', 'Analyst']);
    const collabs: Record<string, { name: string; photoUrl: string | null; total: number; initiatives: Array<Initiative & { cycleTime: number | null }> }> = {};
    getOpenInitiatives().forEach(it => {
      const ids = new Set<string>([...(it.memberIds || [])]);
      if (it.leaderId) ids.add(it.leaderId);
      ids.forEach(collabId => {
        const c = data.collaborators.find(col => col.id === collabId);
        if (!c || !ENGINEER_ROLES.has(c.role)) return;
        if (!collabs[collabId]) collabs[collabId] = { name: c.name, photoUrl: c.photoUrl || null, total: 0, initiatives: [] };
        collabs[collabId].total++;
        collabs[collabId].initiatives.push({ ...it, cycleTime: computeOpenCycleTime(it) });
      });
    });
    return Object.values(collabs)
      .sort((a, b) => b.total - a.total)
      .slice(0, 15)
      .map(c => ({ ...c, drilldownTitle: `Colaborador: ${c.name}` }));
  };

  const getOpenTypeComparisonData = () => {
    const types = [
      { key: '1- Estratégico', label: 'Estratégico' },
      { key: '2- Projeto', label: 'Projeto' },
      { key: '3- Fast Track', label: 'Fast Track' },
      { key: '4- PBI', label: 'PBI' },
    ];
    const inScope = getOpenInitiatives();
    return types.map(t => {
      const inits = inScope.filter(it => it.type === t.key);
      const noPrazo = inits.filter(it => isOpenOnTime(it)).length;
      const atrasado = inits.length - noPrazo;
      const pctOnTime = inits.length > 0 ? Math.round(noPrazo / inits.length * 100) : 0;
      return {
        name: t.label,
        noPrazo,
        atrasado,
        total: inits.length,
        pctOnTime,
        pctAtrasado: inits.length > 0 ? 100 - pctOnTime : 0,
        totalWhenPerfect: atrasado === 0 ? inits.length : 0,
        initiatives: inits.map(it => ({ ...it, cycleTime: computeOpenCycleTime(it) })),
        drilldownTitle: `Tipo: ${t.label}`,
      };
    }).filter(t => t.total > 0);
  };

  const getOpenLeaderOnTimeData = () => {
    const mgrs: Record<string, { id: string; name: string; photoUrl: string | null; noPrazo: number; atrasado: number; total: number; initiatives: Array<Initiative & { cycleTime: number | null }> }> = {};
    const bucketSeenInitiatives = new Map<string, Set<string>>();
    const hierarchySysIds = new Set(filtered.systems.map(s => s.id));
    const poolIds = new Set<string>();
    const pool: Initiative[] = [];

    getOpenInitiatives().forEach(it => {
      poolIds.add(it.id);
      pool.push(it);
    });

    if (hierarchy) {
      data.initiatives
        .filter(it => OPEN_STATUSES.includes(it.status) && !poolIds.has(it.id))
        .forEach(it => {
          if ((it.impactedSystemIds || []).some(sid => hierarchySysIds.has(sid))) {
            poolIds.add(it.id);
            pool.push(it);
          }
        });
    }

    pool.forEach(it => {
      const managerIds = new Set<string>();
      if (it.leaderId) managerIds.add(it.leaderId);
      (it.impactedSystemIds || []).forEach(sysId => {
        const sys = data.systems.find(s => s.id === sysId);
        if (!sys) return;
        const team = data.teams.find(t => t.id === sys.ownerTeamId);
        if (team?.leaderId) managerIds.add(team.leaderId);
      });
      managerIds.forEach(managerId => {
        if (hierarchy && !hierarchy.leaderIds.includes(managerId)) return;
        const bucketId = getLeaderVolumeBucket(managerId);
        const seen = bucketSeenInitiatives.get(bucketId) ?? new Set<string>();
        if (seen.has(it.id)) return;
        seen.add(it.id);
        bucketSeenInitiatives.set(bucketId, seen);
        const c = data.collaborators.find(col => col.id === bucketId);
        const name = c?.name || 'Desconhecido';
        if (!mgrs[bucketId]) mgrs[bucketId] = { id: bucketId, name, photoUrl: c?.photoUrl || null, noPrazo: 0, atrasado: 0, total: 0, initiatives: [] };
        mgrs[bucketId].total++;
        mgrs[bucketId].initiatives.push({ ...it, cycleTime: computeOpenCycleTime(it) });
        if (isOpenOnTime(it)) mgrs[bucketId].noPrazo++; else mgrs[bucketId].atrasado++;
      });
    });

    return Object.values(mgrs).sort((a, b) => b.total - a.total).slice(0, 6).map(m => ({
      ...m,
      pctNoPrazo: m.total > 0 ? Math.round(m.noPrazo / m.total * 100) : 0,
      pctAtrasado: m.total > 0 ? Math.round(m.atrasado / m.total * 100) : 0,
      totalWhenPerfect: m.atrasado === 0 ? m.total : 0,
      drilldownTitle: `Gestor: ${m.name}`,
    }));
  };

  const getOpenCycleTimeByTypeData = () => {
    const types = [
      { key: '1- Estratégico', label: 'Estratégico' },
      { key: '2- Projeto', label: 'Projeto' },
      { key: '3- Fast Track', label: 'Fast Track' },
      { key: '4- PBI', label: 'PBI' },
    ];
    const inScope = getOpenInitiatives();
    return types.map(t => {
      const inits = inScope.filter(it => it.type === t.key);
      const initData = inits.map(it => ({ ...it, cycleTime: computeOpenCycleTime(it) }));
      const withCycle = initData.filter(it => it.cycleTime !== null);
      const avgDays = withCycle.length > 0
        ? Math.round(withCycle.reduce((sum, it) => sum + (it.cycleTime ?? 0), 0) / withCycle.length)
        : 0;
      return { name: t.label, avgDays, count: withCycle.length, initiatives: initData, drilldownTitle: `Cycle Time — ${t.label}` };
    }).filter(t => t.initiatives.length > 0);
  };

  const getOpenStatusVolumeData = () => {
    const statuses: Record<string, { name: string; total: number; initiatives: Array<Initiative & { cycleTime: number | null }> }> = {};
    filtered.initiatives
      .filter(it => OPEN_STATUSES.includes(it.status))
      .forEach(it => {
        const statusLabel = it.status.split('- ')[1] || it.status;
        if (!statuses[statusLabel]) statuses[statusLabel] = { name: statusLabel, total: 0, initiatives: [] };
        statuses[statusLabel].total++;
        statuses[statusLabel].initiatives.push({ ...it, cycleTime: computeOpenCycleTime(it) });
      });

    const STATUS_ORDER = [
      'Backlog', 'Discovery', 'Planejamento', 'Aguardando Capacidade',
      'Construção', 'QA', 'UAT', 'Implantação',
    ];
    return Object.values(statuses)
      .sort((a, b) => {
        const ia = STATUS_ORDER.indexOf(a.name);
        const ib = STATUS_ORDER.indexOf(b.name);
        if (ia === -1 && ib === -1) return a.name.localeCompare(b.name);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      })
      .map(s => ({ ...s, drilldownTitle: `Status: ${s.name}` }));
  };

  // ── Derived values for View 1 ──────────────────────────────────────────────
  const concludedThisYear = filtered.initiatives.filter(it => {
    if (it.status !== '9- Concluído') return false;
    const dateStr = it.actualEndDate || it.endDate;
    if (!dateStr) return false;
    try { return parseISO(dateStr).getFullYear() === currentYear; } catch { return false; }
  });
  const CLOSED_STATUSES = ['9- Concluído', 'Suspenso', 'Cancelado'];
  const openInits = filtered.initiatives.filter(it => !CLOSED_STATUSES.includes(it.status));
  const activeContracts = filtered.contracts.filter(c => c.status === 'Ativo');
  const totalOpex = activeContracts.reduce((sum, c) => sum + (c.annualCost || 0), 0);
  const upcomingVacations = getUpcomingVacations();
  const upcomingBirthdays = getUpcomingBirthdays();

  // ── Card style helper ──────────────────────────────────────────────────────
  const card: React.CSSProperties = { background: 'var(--bg-card)', borderRadius: '12px', boxShadow: 'var(--shadow-md)' };

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>

      {/* ── VIEW 4: PORTFÓLIO POR ÁREA DE NEGÓCIO ────────────────────── */}
      {dashboardView === 'portfolio' && (
        <PortfolioView
          businessUnit={selectedPortfolioBusinessUnit}
          clientTeams={clientTeams}
          initiatives={filtered.initiatives}
        />
      )}

      {/* ── VIEW 5: ROADMAP MENSAL POR TIPO DE DEMANDA ──────────────── */}
      {dashboardView === 'roadmap' && (
        <RoadmapView
          initiatives={filtered.initiatives}
          systems={filtered.systems}
          startMonth={roadmapStartMonth}
          endMonth={roadmapEndMonth}
          groupMode={roadmapGroupMode}
        />
      )}

      {/* ── VIEW 1: VISÃO GERAL ─────────────────────────────────────────── */}
      {dashboardView === 'overview' && (<>

        {/* KPI Row */}
        <div className="dashboard-grid">
          {[
            {
              label: 'Sistemas Suportados',
              val: filtered.systems.length,
              subtext: `${filtered.systems.filter(s => s.criticality === 'Tier 1').length} Tier 1 Críticos`,
              icon: Cpu,
              color: 'var(--accent-base)'
            },
            {
              label: 'Colaboradores Ativos',
              val: filtered.collaborators.length,
              subtext: `${filtered.collaborators.filter(c => c.role === 'Engineer').length} Engenheiros`,
              icon: Users,
              color: 'var(--status-blue)'
            },
            {
              label: 'Contratos Responsáveis',
              val: activeContracts.length,
              subtext: `OPEX: ${formatCurrency(totalOpex)}/ano`,
              icon: FileText,
              color: 'var(--status-purple)'
            },
            (() => {
              const typeMap: Record<string, string> = { '1- Estratégico': 'Estratégico', '2- Projeto': 'Projeto', '3- Fast Track': 'Fast Track', '4- PBI': 'PBI' };
              const breakdown = Object.entries(typeMap)
                .map(([k, label]) => ({ label, val: concludedThisYear.filter(it => it.type === k).length }))
                .filter(b => b.val > 0);
              return { label: 'Encerradas no Ano', val: concludedThisYear.length, subtext: `Acumulado ${currentYear}`, icon: CheckCircle2, color: 'var(--status-green)', breakdown };
            })(),
            (() => {
              const aguardando = openInits.filter(it => (it.status as string) === '4- Aguardando Capacidade').length;
              const typeMap: Record<string, string> = { '1- Estratégico': 'Estratégico', '2- Projeto': 'Projeto', '3- Fast Track': 'Fast Track', '4- PBI': 'PBI' };
              const breakdown = Object.entries(typeMap)
                .map(([k, label]) => ({ label, val: openInits.filter(it => it.type === k).length }))
                .filter(b => b.val > 0);
              return { label: 'Iniciativas em Aberto', val: openInits.length, subtext: `${aguardando} Aguardando capacidade`, icon: Layers, color: 'var(--status-amber)', breakdown };
            })(),
          ].map((kpi, i) => (
            <div
              key={i}
              className="dashboard-card"
              style={{ borderTop: `4px solid ${kpi.color}` }}
            >
              <div className="flex-between">
                <span className="dashboard-card-title">{kpi.label}</span>
                <kpi.icon size={18} style={{ opacity: 0.8 }} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-extrabold)', color: 'var(--text-primary)', margin: 'var(--space-2) 0 0 0', lineHeight: 1 }}>
                  {kpi.val}
                </div>
                <div className="dashboard-card-detail">{kpi.subtext}</div>
                {(kpi as any).breakdown?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2) var(--space-4)', marginTop: 'var(--space-2)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--glass-border)' }}>
                    {(kpi as any).breakdown.map((b: { label: string; val: number }, bi: number) => (
                      <div key={bi} style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-1)' }}>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 'var(--font-medium)' }}>{b.label}</span>
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-extrabold)', color: 'var(--text-primary)' }}>{b.val}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Férias + Aniversariantes */}
        <div className="dashboard-wide-section">
          {/* Férias */}
          <div className="dashboard-chart-container">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)' }}>
              <Calendar size={18} /> Férias — próximos 3 meses
              <span style={{ marginLeft: 'auto', background: 'var(--status-blue-dim)', color: 'var(--status-blue)', fontWeight: 'var(--font-bold)', fontSize: 'var(--text-xs)', padding: '2px 10px', borderRadius: 'var(--radius-full)' }}>
                {upcomingVacations.length}
              </span>
            </h4>
            {upcomingVacations.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', textAlign: 'center', padding: 'var(--space-6) 0' }}>
                Nenhuma férias prevista nos próximos 3 meses.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {upcomingVacations.map((c) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                    {c.photoUrl ? (
                      <img loading="lazy" src={c.photoUrl} alt={c.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--neutral-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Users size={14} color="var(--text-secondary)" />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 'var(--font-bold)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.name}
                      </p>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0 }}>
                        A partir de {format(parseISO(c.vacationStart!), "dd 'de' MMMM", { locale: ptBR })}
                      </p>
                    </div>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-bold)', color: 'var(--status-blue)', background: 'var(--status-blue-dim)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}>
                      {format(parseISO(c.vacationStart!), 'dd/MM')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Aniversariantes */}
          <div className="dashboard-chart-container">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)' }}>
              <Gift size={18} /> Aniversariantes — próximos 3 meses
              <span style={{ marginLeft: 'auto', background: 'var(--status-amber-dim)', color: 'var(--status-amber)', fontWeight: 'var(--font-bold)', fontSize: 'var(--text-xs)', padding: '2px 10px', borderRadius: 'var(--radius-full)' }}>
                {upcomingBirthdays.length}
              </span>
            </h4>
            {upcomingBirthdays.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', textAlign: 'center', padding: 'var(--space-6) 0' }}>
                Nenhum aniversário nos próximos 3 meses.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {upcomingBirthdays.map((c) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                    {c.photoUrl ? (
                      <img loading="lazy" src={c.photoUrl} alt={c.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--neutral-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Users size={14} color="var(--text-secondary)" />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 'var(--font-bold)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.name}
                      </p>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0 }}>
                        {format(c.nextBirthday, "dd 'de' MMMM", { locale: ptBR })}
                        {c.nextBirthday.getFullYear() !== currentYear && ` de ${c.nextBirthday.getFullYear()}`}
                      </p>
                    </div>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-bold)', color: 'var(--status-amber)', background: 'var(--status-amber-dim)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}>
                      {format(c.nextBirthday, 'dd/MM')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </>)}

      {/* ── VIEW 2: INICIATIVAS ENCERRADAS ─────────────────────────────── */}
      {dashboardView === 'closed' && (() => {
        const last12 = getLast12MonthsClosedData();
        const cycleTimeData = getCycleTimeData();
        const areaData = getClosedAreaData();
        const typeData = getTypeComparisonData();
        const leaderData = getLeaderOnTimeData();
        const ctByTypeData = getCycleTimeByTypeData();
        const systemData = getClosedSystemData();
        const collabData = getClosedCollaboratorData();
        const totalConcluded = filtered.initiatives.filter(it => it.status === '9- Concluído');
        const totalOnTime = totalConcluded.filter(it => isOnTime(it)).length;
        const pctOnTime = totalConcluded.length > 0 ? Math.round(totalOnTime / totalConcluded.length * 100) : 0;
        const areaH = Math.max(220, areaData.length * 36 + 40);
        const systemH = Math.max(220, systemData.length * 36 + 40);
        const collabH = Math.max(220, collabData.length * 36 + 40);

        return (<>
          {/* Row 1: Volume Total + Tipo + Cycle Time por Tipo */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            <div style={{ ...card, padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <CheckCircle2 size={18} /> Volume Total
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>
                {isDirector ? 'Comparativo por líder' : 'Acumulado com % entregue no prazo'}
              </p>
              {!isDirector ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{totalConcluded.length}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>encerradas</div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'center' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10B981' }}>{totalOnTime}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>no prazo</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#EF4444' }}>{totalConcluded.length - totalOnTime}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>com atraso</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 64, height: 200, borderRadius: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid var(--glass-border)' }}>
                      {(100 - pctOnTime) > 0 && (
                        <div style={{ width: '100%', height: `${100 - pctOnTime}%`, background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 20 }}>
                          {(100 - pctOnTime) >= 12 && <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#fff' }}>{100 - pctOnTime}%</span>}
                        </div>
                      )}
                      <div style={{ width: '100%', height: `${pctOnTime}%`, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 20 }}>
                        {pctOnTime >= 12 && <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#fff' }}>{pctOnTime}%</span>}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10B981' }}>{pctOnTime}% no prazo</span>
                  </div>
                </div>
              ) : (
                <div style={{ height: 240, cursor: 'pointer' }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                    <BarChart data={leaderData} margin={{ bottom: 10, top: 12, right: 20, left: -5 }} onMouseMove={handleBarHover} onMouseLeave={handleBarLeave} onClick={openDrilldownFromState}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" height={80} tick={<ManagerTick data={leaderData} />} axisLine={false} tickLine={false} interval={0} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#94A3B8" width={35} />
                      <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} content={<LeaderOnTimeTooltip />} />
                      <Bar dataKey="noPrazo" name="No prazo" stackId="a" fill="#10B981" radius={[0,0,0,0]} onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}>
                        <LabelList dataKey="pctNoPrazo" content={<CompactPercentLabel />} />
                        <LabelList dataKey="totalWhenPerfect" position="top" offset={8} style={{ fill: '#000', fontSize: '0.85rem', fontWeight: 900 }} formatter={(v: any) => v > 0 ? v : ''} />
                      </Bar>
                      <Bar dataKey="atrasado" name="Atrasado" stackId="a" fill="#EF4444" radius={[6,6,0,0]} onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}>
                        <LabelList dataKey="pctAtrasado" content={<CompactPercentLabel />} />
                        <LabelList dataKey="total" position="top" offset={8} style={{ fill: '#000', fontSize: '0.85rem', fontWeight: 900 }} formatter={(v: any) => v > 0 ? v : ''} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div style={{ ...card, padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.5rem' }}>Volume por Tipo de Iniciativa</h3>
              {typeData.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', textAlign: 'center', padding: '1.5rem 0' }}>Sem dados de tipo.</p>
              ) : (
                <div style={{ height: 240, cursor: 'pointer' }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                    <BarChart data={typeData} margin={{ top: 12, right: 20, bottom: 10, left: 2 }} onMouseMove={handleBarHover} onMouseLeave={handleBarLeave} onClick={openDrilldownFromState}>
                      <defs>
                        <linearGradient id="gradOnTime" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" /><stop offset="100%" stopColor="#059669" /></linearGradient>
                        <linearGradient id="gradLate" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#EF4444" /><stop offset="100%" stopColor="#DC2626" /></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" height={44} tickLine={false} axisLine={false} interval={0} tick={<TypeTick />} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#94A3B8" width={36} />
                      <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} content={<TypeTooltip />} />
                      <Bar dataKey="noPrazo" name="No prazo" stackId="a" fill="url(#gradOnTime)" radius={[0,0,0,0]} onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}>
                        <LabelList dataKey="pctOnTime" content={<CompactPercentLabel />} />
                        <LabelList dataKey="totalWhenPerfect" position="top" offset={8} style={{ fill: '#000', fontSize: '0.9rem', fontWeight: 900 }} formatter={(v: any) => v > 0 ? v : ''} />
                      </Bar>
                      <Bar dataKey="atrasado" name="Atrasado" stackId="a" fill="url(#gradLate)" radius={[6,6,0,0]} onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}>
                        <LabelList dataKey="pctAtrasado" content={<CompactPercentLabel />} />
                        <LabelList dataKey="total" position="top" offset={8} style={{ fill: '#000', fontSize: '0.9rem', fontWeight: 900 }} formatter={(v: any) => v > 0 ? v : ''} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div style={{ ...card, padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}><Clock size={16} /> Cycle Time Médio</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>Média de dias por tipo de iniciativa</p>
              {ctByTypeData.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', textAlign: 'center', padding: '1.5rem 0' }}>Sem dados de ciclo disponíveis.</p>
              ) : (
                <div style={{ height: 240, cursor: 'pointer' }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                    <BarChart data={ctByTypeData} margin={{ top: 12, right: 20, bottom: 10, left: -10 }} onMouseMove={handleBarHover} onMouseLeave={handleBarLeave} onClick={openDrilldownFromState}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" height={44} tickLine={false} axisLine={false} interval={0} tick={<TypeTick />} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#94A3B8" width={35} />
                      <Tooltip cursor={{ fill: 'rgba(99,102,241,0.08)' }} content={<CycleTimeTooltip />} />
                      <Bar dataKey="avgDays" fill="#6366F1" radius={[4,4,0,0]} onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}>
                        <LabelList dataKey="avgDays" position="top" offset={6} style={{ fill: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 700 }} formatter={(v: any) => v > 0 ? `${v}d` : ''} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Volume Entrega Mensal + Cycle Time Mensal */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
            <div style={{ ...card, padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}><TrendingUp size={18} /> Volume Entrega Mensal</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>Entregue no prazo vs. com atraso</p>
              <div style={{ height: 260, cursor: 'pointer' }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                  <BarChart data={last12} margin={{ top: 20, right: 20, left: 0, bottom: 0 }} onMouseMove={handleBarHover} onMouseLeave={handleBarLeave} onClick={openDrilldownFromState}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} dy={8} stroke="#94A3B8" />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#94A3B8" />
                    <Tooltip cursor={{ fill: 'rgba(16,185,129,0.06)' }} content={<ClosedMonthTooltip />} />
                    <Bar dataKey="noPrazo" name="No prazo" stackId="a" fill="#10B981" radius={[0,0,0,0]} onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}>
                      <LabelList dataKey="pctNoPrazo" content={<CompactPercentLabel />} />
                      <LabelList dataKey="totalWhenPerfect" position="top" offset={8} style={{ fill: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 700 }} formatter={(v: any) => v > 0 ? v : ''} />
                    </Bar>
                    <Bar dataKey="atrasado" name="Atrasado" stackId="a" fill="#EF4444" radius={[4,4,0,0]} onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}>
                      <LabelList dataKey="pctAtrasado" content={<CompactPercentLabel />} />
                      <LabelList dataKey="total" position="top" offset={8} style={{ fill: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 700 }} formatter={(v: any) => v > 0 ? v : ''} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}><div style={{ width: 10, height: 10, borderRadius: 2, background: '#10B981' }} /> No prazo</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}><div style={{ width: 10, height: 10, borderRadius: 2, background: '#EF4444' }} /> Com atraso</div>
              </div>
            </div>
            <div style={{ ...card, padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}><Activity size={18} /> Cycle Time Médio Mensal</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>Média de dias do início ao encerramento — clique em uma barra para ver os detalhes</p>
              <div style={{ height: 260, cursor: 'pointer' }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                  <BarChart data={cycleTimeData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }} onMouseMove={handleBarHover} onMouseLeave={handleBarLeave} onClick={openDrilldownFromState}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} dy={8} stroke="#94A3B8" />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#94A3B8" />
                    <Tooltip cursor={{ fill: 'rgba(99,102,241,0.08)' }} content={<CycleTimeTooltip />} />
                    <Bar dataKey="avgDays" fill="#6366F1" radius={[4,4,0,0]} onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}>
                      <LabelList dataKey="avgDays" position="top" offset={6} style={{ fill: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 700 }} formatter={(v: any) => v > 0 ? `${v}d` : ''} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 3: mantenha os gráficos atuais */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
            <div style={{ ...card, padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.5rem' }}>Volume por Demandante</h3>
              {areaData.length === 0 ? (<p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', textAlign: 'center', padding: '1.5rem 0' }}>Sem dados de área.</p>) : (
                <div style={{ height: areaH, cursor: 'pointer' }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                    <BarChart data={areaData} layout="vertical" margin={{ right: 50, left: 20 }} onMouseMove={handleBarHover} onMouseLeave={handleBarLeave} onClick={openDrilldownFromState}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" fontSize={11} width={160} tickLine={false} axisLine={false} stroke="#000" style={{ fontWeight: 500 }} />
                      <Tooltip cursor={{ fill: 'rgba(16,185,129,0.06)' }} content={<ClosedAreaTooltip />} />
                      <Bar dataKey="noPrazo" name="No prazo" stackId="a" fill="#10B981" radius={[0,0,0,0]} onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}>
                        <LabelList dataKey="pctNoPrazo" content={<CompactPercentLabelH />} />
                        <LabelList dataKey="totalWhenPerfect" position="right" offset={10} style={{ fill: '#000', fontSize: '0.82rem', fontWeight: 800 }} formatter={(v: any) => v > 0 ? v : ''} />
                      </Bar>
                      <Bar dataKey="atrasado" name="Atrasado" stackId="a" fill="#EF4444" radius={[0,6,6,0]} onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}>
                        <LabelList dataKey="pctAtrasado" content={<CompactPercentLabelH />} />
                        <LabelList dataKey="total" position="right" offset={10} style={{ fill: '#000', fontSize: '0.82rem', fontWeight: 800 }} formatter={(v: any) => v > 0 ? v : ''} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            <div style={{ ...card, padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.5rem' }}>Volume por Sistema</h3>
              {systemData.length === 0 ? (<p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', textAlign: 'center', padding: '1.5rem 0' }}>Sem dados de sistema.</p>) : (
                <div style={{ height: systemH, cursor: 'pointer' }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                    <BarChart data={systemData} layout="vertical" margin={{ right: 50, left: 20 }} onMouseMove={handleBarHover} onMouseLeave={handleBarLeave} onClick={openDrilldownFromState}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" fontSize={11} width={160} tickLine={false} axisLine={false} stroke="#000" style={{ fontWeight: 500 }} />
                      <Tooltip cursor={{ fill: 'rgba(99,102,241,0.06)' }} content={<ClosedSystemTooltip />} />
                      <Bar dataKey="total" fill="#6366F1" radius={[0,6,6,0]} onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}>
                        <LabelList dataKey="total" position="right" offset={10} style={{ fill: '#000', fontSize: '0.82rem', fontWeight: 800 }} formatter={(v: any) => v > 0 ? v : ''} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Row 4: mantenha os gráficos atuais */}
          <div style={{ ...card, padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.5rem' }}>Volume por Colaborador</h3>
            {collabData.length === 0 ? (<p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', textAlign: 'center', padding: '1.5rem 0' }}>Sem dados de colaboradores.</p>) : (
              <div style={{ height: collabH, cursor: 'pointer' }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                  <BarChart data={collabData} layout="vertical" margin={{ right: 50, left: 20 }} onMouseMove={handleBarHover} onMouseLeave={handleBarLeave} onClick={openDrilldownFromState}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={170} tickLine={false} axisLine={false} tick={<CollaboratorTick collabData={collabData} />} />
                    <Tooltip cursor={{ fill: 'rgba(245,158,11,0.06)' }} content={<ClosedCollaboratorTooltip />} />
                    <Bar dataKey="total" fill="#F59E0B" radius={[0,6,6,0]} onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}>
                      <LabelList dataKey="total" position="right" offset={10} style={{ fill: '#000', fontSize: '0.82rem', fontWeight: 800 }} formatter={(v: any) => v > 0 ? v : ''} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>);
      })()}

      {/* ── VIEW 3: INICIATIVAS ABERTAS ─────────────────────────────────── */}
      {dashboardView === 'open' && (() => {
        const last12 = getLast12MonthsOpenData();
        const cycleTimeData = getOpenCycleTimeData();
        const areaData = getOpenAreaDataDetailed();
        const typeData = getOpenTypeComparisonData();
        const leaderData = getOpenLeaderOnTimeData();
        const ctByTypeData = getOpenCycleTimeByTypeData();
        const systemData = getOpenSystemData();
        const collabData = getOpenCollaboratorData();
        const statusData = getOpenStatusVolumeData();
        const totalOpen = getOpenInitiatives();
        const totalOnTime = totalOpen.filter(it => isOpenOnTime(it)).length;
        const pctOnTime = totalOpen.length > 0 ? Math.round(totalOnTime / totalOpen.length * 100) : 0;
        const areaH = Math.max(220, areaData.length * 36 + 40);
        const systemH = Math.max(220, systemData.length * 36 + 40);
        const collabH = Math.max(220, collabData.length * 36 + 40);
        const statusH = Math.max(220, statusData.length * 36 + 40);

        return (<>
          {/* Row 1: Volume Total + Tipo + Cycle Time por Tipo */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            <div style={{ ...card, padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <CheckCircle2 size={18} /> Volume Total Abertas
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>
                {isDirector ? 'Comparativo por líder' : 'Acumulado com % no prazo previsto'}
              </p>
              {!isDirector ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{totalOpen.length}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>ativas</div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'center' }}>
                      <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10B981' }}>{totalOnTime}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>no prazo</div></div>
                      <div style={{ textAlign: 'center' }}><div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#EF4444' }}>{totalOpen.length - totalOnTime}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>em atraso</div></div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 64, height: 200, borderRadius: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid var(--glass-border)' }}>
                      {(100 - pctOnTime) > 0 && (<div style={{ width: '100%', height: `${100 - pctOnTime}%`, background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 20 }}>{(100 - pctOnTime) >= 12 && <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#fff' }}>{100 - pctOnTime}%</span>}</div>)}
                      <div style={{ width: '100%', height: `${pctOnTime}%`, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 20 }}>{pctOnTime >= 12 && <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#fff' }}>{pctOnTime}%</span>}</div>
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10B981' }}>{pctOnTime}% no prazo</span>
                  </div>
                </div>
              ) : (
                <div style={{ height: 240, cursor: 'pointer' }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                    <BarChart data={leaderData} margin={{ bottom: 10, top: 12, right: 20, left: -5 }} onMouseMove={handleBarHover} onMouseLeave={handleBarLeave} onClick={openDrilldownFromState}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" height={80} tick={<ManagerTick data={leaderData} />} axisLine={false} tickLine={false} interval={0} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#94A3B8" width={35} />
                      <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} content={<LeaderOnTimeTooltip />} />
                      <Bar dataKey="noPrazo" name="No prazo" stackId="a" fill="url(#gradOnTimeOpen)" radius={[0,0,0,0]} onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}><LabelList dataKey="pctNoPrazo" content={<CompactPercentLabel />} /><LabelList dataKey="totalWhenPerfect" position="top" offset={8} style={{ fill: '#000', fontSize: '0.85rem', fontWeight: 900 }} formatter={(v: any) => v > 0 ? v : ''} /></Bar>
                      <Bar dataKey="atrasado" name="Atrasado" stackId="a" fill="#EF4444" radius={[6,6,0,0]} onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}><LabelList dataKey="pctAtrasado" content={<CompactPercentLabel />} /><LabelList dataKey="total" position="top" offset={8} style={{ fill: '#000', fontSize: '0.85rem', fontWeight: 900 }} formatter={(v: any) => v > 0 ? v : ''} /></Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div style={{ ...card, padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.5rem' }}>Abertas por Tipo de Iniciativa</h3>
              {typeData.length === 0 ? (<p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', textAlign: 'center', padding: '1.5rem 0' }}>Sem dados de tipo.</p>) : (
                <div style={{ height: 240, cursor: 'pointer' }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                    <BarChart data={typeData} margin={{ top: 12, right: 20, bottom: 10, left: 2 }} onMouseMove={handleBarHover} onMouseLeave={handleBarLeave} onClick={openDrilldownFromState}>
                      <defs><linearGradient id="gradOnTimeOpen" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FBBF24" /><stop offset="100%" stopColor="#F59E0B" /></linearGradient><linearGradient id="gradLateOpen" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#EF4444" /><stop offset="100%" stopColor="#DC2626" /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" height={44} tickLine={false} axisLine={false} interval={0} tick={<TypeTick />} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#94A3B8" width={36} />
                      <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} content={<TypeTooltip />} />
                      <Bar dataKey="noPrazo" name="Dentro do Planejado" stackId="a" fill="url(#gradOnTimeOpen)" radius={[0,0,0,0]} onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}><LabelList dataKey="pctOnTime" content={<CompactPercentLabel />} /><LabelList dataKey="totalWhenPerfect" position="top" offset={8} style={{ fill: '#000', fontSize: '0.72rem', fontWeight: 700 }} formatter={(v: any) => v > 0 ? v : ''} /></Bar>
                      <Bar dataKey="atrasado" name="Atrasado" stackId="a" fill="url(#gradLateOpen)" radius={[6,6,0,0]} onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}><LabelList dataKey="pctAtrasado" content={<CompactPercentLabel />} /><LabelList dataKey="total" position="top" offset={8} style={{ fill: '#000', fontSize: '0.72rem', fontWeight: 700 }} formatter={(v: any) => v > 0 ? v : ''} /></Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div style={{ ...card, padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}><Clock size={16} /> Cycle Time Projetado</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>Média de dias por tipo de iniciativa</p>
              {ctByTypeData.length === 0 ? (<p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', textAlign: 'center', padding: '1.5rem 0' }}>Sem dados de ciclo disponíveis.</p>) : (
                <div style={{ height: 240, cursor: 'pointer' }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                    <BarChart data={ctByTypeData} margin={{ top: 12, right: 20, bottom: 10, left: -10 }} onMouseMove={handleBarHover} onMouseLeave={handleBarLeave} onClick={openDrilldownFromState}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" height={44} tickLine={false} axisLine={false} interval={0} tick={<TypeTick />} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#94A3B8" width={35} />
                      <Tooltip cursor={{ fill: 'rgba(99,102,241,0.08)' }} content={<CycleTimeTooltip />} />
                      <Bar dataKey="avgDays" fill="#6366F1" radius={[4,4,0,0]} onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}><LabelList dataKey="avgDays" position="top" offset={6} style={{ fill: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 700 }} formatter={(v: any) => v > 0 ? `${v}d` : ''} /></Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Volume Entrega Mensal + Cycle Time Mensal */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
            <div style={{ ...card, padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}><TrendingUp size={18} /> Volume de Entregas Previstas por Mês</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>Demandas abertas por mês planejado — passado ou futuro</p>
              <div style={{ height: 260, cursor: 'pointer' }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                  <BarChart data={last12} margin={{ top: 20, right: 20, left: 0, bottom: 0 }} onMouseMove={handleBarHover} onMouseLeave={handleBarLeave} onClick={openDrilldownFromState}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} dy={8} stroke="#94A3B8" />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#94A3B8" />
                    <Tooltip cursor={{ fill: 'rgba(234,179,8,0.08)' }} content={<ClosedMonthTooltip />} />
                    <Bar dataKey="noPrazo" name="Dentro do Planejado" stackId="a" fill="#FBBF24" radius={[0,0,0,0]} onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}><LabelList dataKey="pctNoPrazo" content={<CompactPercentLabel />} /><LabelList dataKey="totalWhenPerfect" position="top" offset={8} style={{ fill: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 700 }} formatter={(v: any) => v > 0 ? v : ''} /></Bar>
                    <Bar dataKey="atrasado" name="Atrasado" stackId="a" fill="#EF4444" radius={[4,4,0,0]} onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}><LabelList dataKey="pctAtrasado" content={<CompactPercentLabel />} /><LabelList dataKey="total" position="top" offset={8} style={{ fill: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 700 }} formatter={(v: any) => v > 0 ? v : ''} /></Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ ...card, padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}><Activity size={18} /> Cycle Time Médio Projetado por Mês</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>Média de dias do início ao encerramento — clique em uma barra para ver os detalhes</p>
              <div style={{ height: 260, cursor: 'pointer' }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                  <BarChart data={cycleTimeData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }} onMouseMove={handleBarHover} onMouseLeave={handleBarLeave} onClick={openDrilldownFromState}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} dy={8} stroke="#94A3B8" />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#94A3B8" />
                    <Tooltip cursor={{ fill: 'rgba(99,102,241,0.08)' }} content={<CycleTimeTooltip />} />
                    <Bar dataKey="avgDays" fill="#6366F1" radius={[4,4,0,0]} onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}><LabelList dataKey="avgDays" position="top" offset={6} style={{ fill: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 700 }} formatter={(v: any) => v > 0 ? `${v}d` : ''} /></Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 3: mantenha os gráficos atuais */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
            <div style={{ ...card, padding: '1.5rem' }}><h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.5rem' }}>Volume Iniciativas Abertas por Demandante</h3>{areaData.length === 0 ? (<p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', textAlign: 'center', padding: '1.5rem 0' }}>Sem dados de área.</p>) : (<div style={{ height: areaH, cursor: 'pointer' }}><ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}><BarChart data={areaData} layout="vertical" margin={{ right: 50, left: 20 }} onMouseMove={handleBarHover} onMouseLeave={handleBarLeave} onClick={openDrilldownFromState}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" /><XAxis type="number" hide /><YAxis dataKey="name" type="category" fontSize={11} width={160} tickLine={false} axisLine={false} stroke="#000" style={{ fontWeight: 500 }} /><Tooltip cursor={{ fill: 'rgba(251,191,36,0.08)' }} content={<ClosedAreaTooltip />} /><Bar dataKey="noPrazo" name="Dentro do Planejado" stackId="a" fill="#FBBF24" radius={[0,0,0,0]} onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}><LabelList dataKey="pctNoPrazo" content={<CompactPercentLabelH />} /><LabelList dataKey="totalWhenPerfect" position="right" offset={10} style={{ fill: '#000', fontSize: '0.82rem', fontWeight: 800 }} formatter={(v: any) => v > 0 ? v : ''} /></Bar><Bar dataKey="atrasado" name="Atrasado" stackId="a" fill="#EF4444" radius={[0,6,6,0]} onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}><LabelList dataKey="pctAtrasado" content={<CompactPercentLabelH />} /><LabelList dataKey="total" position="right" offset={10} style={{ fill: '#000', fontSize: '0.82rem', fontWeight: 800 }} formatter={(v: any) => v > 0 ? v : ''} /></Bar></BarChart></ResponsiveContainer></div>)}</div>
            <div style={{ ...card, padding: '1.5rem' }}><h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.5rem' }}>Volume Iniciatvas Abertas por Sistema</h3>{systemData.length === 0 ? (<p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', textAlign: 'center', padding: '1.5rem 0' }}>Sem dados de sistema.</p>) : (<div style={{ height: systemH, cursor: 'pointer' }}><ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}><BarChart data={systemData} layout="vertical" margin={{ right: 50, left: 20 }} onMouseMove={handleBarHover} onMouseLeave={handleBarLeave} onClick={openDrilldownFromState}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" /><XAxis type="number" hide /><YAxis dataKey="name" type="category" fontSize={11} width={160} tickLine={false} axisLine={false} stroke="#000" style={{ fontWeight: 500 }} /><Tooltip cursor={{ fill: 'rgba(99,102,241,0.06)' }} content={<ClosedSystemTooltip />} /><Bar dataKey="total" fill="#6366F1" radius={[0,6,6,0]} onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}><LabelList dataKey="total" position="right" offset={10} style={{ fill: '#000', fontSize: '0.82rem', fontWeight: 800 }} formatter={(v: any) => v > 0 ? v : ''} /></Bar></BarChart></ResponsiveContainer></div>)}</div>
          </div>

          {/* Row 4: mantenha os gráficos atuais */}
          <div style={{ ...card, padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.5rem' }}>Volume Inicativas Abertas por Colaborador</h3>
            {collabData.length === 0 ? (<p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', textAlign: 'center', padding: '1.5rem 0' }}>Sem dados de colaboradores.</p>) : (
              <div style={{ height: collabH, cursor: 'pointer' }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                  <BarChart data={collabData} layout="vertical" margin={{ right: 50, left: 20 }} onMouseMove={handleBarHover} onMouseLeave={handleBarLeave} onClick={openDrilldownFromState}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" /><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={170} tickLine={false} axisLine={false} tick={<CollaboratorTick collabData={collabData} />} /><Tooltip cursor={{ fill: 'rgba(245,158,11,0.06)' }} content={<ClosedCollaboratorTooltip />} /><Bar dataKey="total" fill="#F59E0B" radius={[0,6,6,0]} onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}><LabelList dataKey="total" position="right" offset={10} style={{ fill: '#000', fontSize: '0.82rem', fontWeight: 800 }} formatter={(v: any) => v > 0 ? v : ''} /></Bar></BarChart></ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Row 5: Iniciativas abertas mantidas */}
          <div style={{ ...card, padding: '1.5rem' }}><h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.5rem' }}>Funil Iniciativas Abertas</h3>{statusData.length === 0 ? (<p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', textAlign: 'center', padding: '1.5rem 0' }}>Sem dados de status.</p>) : (<div style={{ height: statusH, cursor: 'pointer' }}><ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}><BarChart data={statusData} layout="vertical" margin={{ right: 50, left: 20 }} onMouseMove={handleBarHover} onMouseLeave={handleBarLeave} onClick={openDrilldownFromState}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" /><XAxis type="number" hide /><YAxis dataKey="name" type="category" fontSize={11} width={200} tickLine={false} axisLine={false} stroke="#000" style={{ fontWeight: 500 }} /><Tooltip cursor={{ fill: 'rgba(2,132,199,0.06)' }} content={<ClosedSystemTooltip />} /><Bar dataKey="total" fill="#0284C7" radius={[0,6,6,0]} onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}><LabelList dataKey="total" position="right" offset={10} style={{ fill: '#000', fontSize: '0.82rem', fontWeight: 800 }} formatter={(v: any) => v > 0 ? v : ''} /></Bar></BarChart></ResponsiveContainer></div>)}</div>
        </>);
      })()}

    </div>

    {/* ── Cycle Time Detail Modal ──────────────────────────────────────────── */}
    {drilldownModal && (
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1.5rem' }}
        onClick={() => setDrilldownModal(null)}
      >
        <div
          style={{ background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '16px', boxShadow: '0 24px 64px rgba(0,0,0,0.28)', width: '100%', maxWidth: '900px', maxHeight: '82vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={17} color="#6366F1" /> {drilldownModal.title}
              </h2>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                {drilldownModal.initiatives.length} iniciativa{drilldownModal.initiatives.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button onClick={() => setDrilldownModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '4px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
              <X size={18} />
            </button>
          </div>
          {/* List */}
          <div style={{ overflowY: 'auto', padding: '0.5rem 1.5rem 1.5rem', background: '#ffffff' }}>
            <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0 }}>
              <colgroup>
                <col style={{ width: '26ch' }} />
                <col style={{ width: '10ch' }} />
                <col style={{ width: '10ch' }} />
                <col style={{ width: '12ch' }} />
                <col style={{ width: '12ch' }} />
                <col style={{ width: '14ch' }} />
                <col style={{ width: '14ch' }} />
                <col style={{ width: '12ch' }} />
                <col style={{ width: '12ch' }} />
              </colgroup>
              <thead>
                <tr>
                  {[
                    { key: 'title' as const, label: 'Iniciativa', align: 'left' as const },
                    { key: 'type' as const, label: 'Tipo', align: 'left' as const },
                    { key: 'startDate' as const, label: 'Data Início', align: 'center' as const },
                    { key: 'endDate' as const, label: 'Data Fim Planejada', align: 'center' as const },
                    { key: 'actualEndDate' as const, label: 'Data Fim Real', align: 'center' as const },
                    { key: 'status' as const, label: 'Situação', align: 'center' as const },
                    { key: 'cycleTime' as const, label: 'Cycle Time', align: 'center' as const },
                    { key: 'leader' as const, label: 'Líder', align: 'left' as const },
                    { key: 'demandante' as const, label: 'Demandante', align: 'left' as const }
                  ].map(col => (
                    <th
                      key={col.key}
                      style={{ textAlign: col.align, padding: '0.75rem 0.5rem', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B', borderBottom: '1px solid #E2E8F0' }}
                    >
                      <button
                        type="button"
                        onClick={() => handleDrilldownSort(col.key)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: col.align === 'center' ? 'center' : 'flex-start',
                          gap: '0.35rem',
                          border: 'none',
                          background: 'transparent',
                          padding: 0,
                          width: '100%',
                          cursor: 'pointer',
                          color: 'inherit',
                          font: 'inherit',
                          textTransform: 'inherit',
                          letterSpacing: 'inherit',
                          fontWeight: 700
                        }}
                      >
                        <span>{col.label}</span>
                        {renderDrilldownSortIcon(col.key)}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortDrilldownInitiatives(drilldownModal.initiatives, drilldownSort).map((it, i) => {
                  const typeLabel = (it.type || '').replace(/^\d+-\s*/, '');
                  const meta = TYPE_TICK_META[typeLabel] ?? { Icon: null, color: '#94A3B8' };
                  const leaderName = it.leaderId ? (data.collaborators.find(c => c.id === it.leaderId)?.name ?? it.leaderId) : '—';
                  const onTime = !it.actualEndDate || !it.endDate ? true : it.actualEndDate <= it.endDate;
                  const startDate = it.startDate ? (() => { try { return format(parseISO(it.startDate), 'dd/MM/yyyy', { locale: ptBR }); } catch { return '—'; } })() : '—';
                  const plannedEnd = it.endDate ? (() => { try { return format(parseISO(it.endDate), 'dd/MM/yyyy', { locale: ptBR }); } catch { return '—'; } })() : '—';
                  const actualEnd = it.actualEndDate ? (() => { try { return format(parseISO(it.actualEndDate), 'dd/MM/yyyy', { locale: ptBR }); } catch { return '—'; } })() : '—';
                  const actualIsLater = Boolean(it.actualEndDate && it.endDate && parseISO(it.actualEndDate).getTime() > parseISO(it.endDate).getTime());

                  return (
                    <tr key={it.id ?? i} style={{ borderBottom: i < drilldownModal.initiatives.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                      <td style={{ padding: '0.9rem 0.5rem', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.25, color: '#0F172A', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                              {formatDrilldownTitle(it.title)}
                              {getAzureWorkItemNumber(it) ? ` #${getAzureWorkItemNumber(it)}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.9rem 0.5rem', verticalAlign: 'top', width: '10ch', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '3px 8px', borderRadius: '20px', background: `${meta.color}14`, color: meta.color, fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {meta.Icon && <meta.Icon size={11} color={meta.color} />}
                          {typeLabel || 'Sem tipo'}
                        </span>
                      </td>
                      <td style={{ padding: '0.9rem 0.5rem', fontSize: '0.8rem', color: '#475569', verticalAlign: 'top', textAlign: 'center', width: '12ch', whiteSpace: 'nowrap' }}>{startDate}</td>
                      <td style={{ padding: '0.9rem 0.5rem', fontSize: '0.8rem', color: '#475569', verticalAlign: 'top', textAlign: 'center', width: '12ch', whiteSpace: 'nowrap' }}>{plannedEnd}</td>
                      <td style={{ padding: '0.9rem 0.5rem', fontSize: '0.8rem', verticalAlign: 'top', textAlign: 'center', width: '12ch', whiteSpace: 'nowrap' }}>
                        <span style={{ color: actualIsLater ? '#DC2626' : '#059669', fontWeight: 700 }}>{actualEnd}</span>
                      </td>
                      <td style={{ padding: '0.9rem 0.75rem 0.9rem 0.5rem', textAlign: 'center', verticalAlign: 'top', width: '10ch', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '3px 8px', borderRadius: '20px', background: onTime ? '#DCFCE7' : '#FEE2E2', color: onTime ? '#15803D' : '#DC2626', fontSize: '0.7rem', fontWeight: 700 }}>
                          {onTime ? <CheckCircle size={11} /> : <XCircle size={11} />}
                          {onTime ? 'No prazo' : 'Atrasado'}
                        </span>
                      </td>
                      <td style={{ padding: '0.9rem 0.5rem 0.9rem 0.75rem', textAlign: 'center', verticalAlign: 'top', width: '12ch', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '3px 8px', borderRadius: '20px', background: '#EEF2FF', color: '#4F46E5', fontSize: '0.7rem', fontWeight: 700, minWidth: 56, justifyContent: 'center' }}>
                          <Clock size={11} />
                          {it.cycleTime !== null ? `${it.cycleTime}d` : 'N/A'}
                        </span>
                      </td>
                      <td style={{ padding: '0.9rem 0.5rem', fontSize: '0.78rem', color: '#0F172A', verticalAlign: 'top', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {leaderName}
                      </td>
                      <td style={{ padding: '0.9rem 0.5rem', fontSize: '0.78rem', color: '#0F172A', verticalAlign: 'top', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '14ch' }}>
                        {it.originDirectorate || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default Dashboard;
