import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useView } from '@/context/ViewContext';
import {
  Cpu, Users, CheckCircle2, TrendingUp, Filter, Layers,
  Diamond, Briefcase, Zap, Bug, Calendar, Gift, FileText,
  BarChart3, Activity, X, Clock, CheckCircle, XCircle,
} from 'lucide-react';
import {
  ComposedChart, BarChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Initiative, Collaborator, System, Team, Vendor, Contract } from '../../../types';
import { fetchDashboardData } from '../services/dashboardApi';

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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div style={tooltipBox}>
      <p style={{ fontWeight: 800, marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.4rem' }}>{label}</p>
      {data.listConcluido?.length > 0 && (
        <div style={{ marginBottom: '0.8rem' }}>
          <p style={{ color: '#059669', fontWeight: 700, fontSize: '0.7rem', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} /> Concluído ({data.concluido})
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {data.listConcluido.map((t: string, i: number) => <li key={i} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: '1.2' }}>• {t}</li>)}
          </ul>
        </div>
      )}
      {data.listPlanejado?.length > 0 && (
        <div>
          <p style={{ color: '#D97706', fontWeight: 700, fontSize: '0.7rem', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFD919' }} /> Planejado ({data.planejado})
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {data.listPlanejado.map((t: string, i: number) => <li key={i} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: '1.2' }}>• {t}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};


const AreaTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload;
  return (
    <div style={tooltipBox}>
      <p style={{ fontWeight: 800, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#000', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.4rem' }}>{label}</p>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Iniciativas ({entry.total})</p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {entry.list?.map((t: string, i: number) => <li key={i} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: '1.2' }}>• {t}</li>)}
      </ul>
    </div>
  );
};

const FunnelTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload;
  return (
    <div style={tooltipBox}>
      <p style={{ fontWeight: 800, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#000', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.4rem' }}>{label}</p>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '0.6rem', textTransform: 'uppercase' }}>
        Total na etapa: <span style={{ color: 'var(--text-primary)' }}>{entry.total}</span>
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {entry.list?.map((t: string, i: number) => <li key={i} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: '1.2' }}>• {t}</li>)}
      </ul>
    </div>
  );
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
  return (
    <div style={tooltipBox}>
      <p style={{ fontWeight: 800, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#000', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.4rem' }}>{label} — {entry.total} encerradas</p>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: entry.list?.length ? '0.6rem' : 0 }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669' }}>✓ No prazo: {entry.noPrazo}</span>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#EF4444' }}>✗ Atrasado: {entry.atrasado}</span>
      </div>
      {entry.list?.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {entry.list.map((t: string, i: number) => <li key={i} style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: '1.2' }}>• {t}</li>)}
        </ul>
      )}
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
      <div style={{ display: 'flex', gap: '1rem' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669' }}>✓ No prazo: {entry.noPrazo} ({pct}%)</span>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#EF4444' }}>✗ Atrasado: {entry.atrasado}</span>
      </div>
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

// ─── ManagerTick ──────────────────────────────────────────────────────────────

const ManagerTick = (props: any) => {
  const { x, y, index, data } = props;
  const manager = data?.[index];
  if (!manager) return null;
  const avatarUrl = manager.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(manager.name)}&background=random&color=fff`;
  return (
    <g transform={`translate(${x},${y + 15})`}>
      <defs>
        <clipPath id={`circleView-${index}`}>
          <circle cx="-15" cy="12" r="12" />
        </clipPath>
      </defs>
      <image x="-27" y="0" width="24" height="24" href={avatarUrl} clipPath={`url(#circleView-${index})`} preserveAspectRatio="xMidYMid slice" />
      <circle cx="-15" cy="12" r="12" fill="none" stroke="#E2E8F0" strokeWidth="1.5" />
      <text x="5" y="17" textAnchor="start" fill="#000000" fontSize="13" fontWeight="500">
        {manager.name.split(' ')[0]}
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

const TypeTick = (props: any) => {
  const { x, y, payload } = props;
  const meta = TYPE_TICK_META[payload?.value];
  const { Icon, color } = meta ?? { Icon: null, color: '#000' };
  return (
    <g transform={`translate(${x},${y + 6})`}>
      <foreignObject x={-58} y={0} width={116} height={26}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: '#000', whiteSpace: 'nowrap' }}>
          {Icon && <Icon size={13} color={color} />}
          <span>{payload?.value}</span>
        </div>
      </foreignObject>
    </g>
  );
};

// ─── SystemsBacklogChart ──────────────────────────────────────────────────────

const SystemsBacklogChart: React.FC<{
  sysData: any[];
  statusKeys: string[];
  statusColors: Record<string, string>;
}> = ({ sysData, statusKeys, statusColors }) => {
  const [hoveredStatus, setHoveredStatus] = React.useState<string | null>(null);
  const chartH = Math.max(280, sysData.length * 32 + 60);

  const INIT_TYPE_META: Record<string, { Icon: React.FC<{ size?: number; style?: React.CSSProperties }>; color: string }> = {
    '1- Estratégico': { Icon: Diamond, color: '#EF4444' },
    '2- Projeto':     { Icon: Briefcase, color: '#3B82F6' },
    '3- Fast Track':  { Icon: Zap, color: '#10B981' },
    '4- PBI':         { Icon: Bug, color: '#D97706' },
  };

  const BacklogTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length || !hoveredStatus) return null;
    const entry = payload[0]?.payload;
    if (!entry) return null;
    const count: number = entry[hoveredStatus] || 0;
    const list: { title: string; type: string }[] = entry.listByStatus?.[hoveredStatus] || [];
    return (
      <div style={{ background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(10px)', border: '1px solid var(--glass-border)', padding: '0.85rem 1rem', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', minWidth: '220px', maxWidth: '360px', zIndex: 1000 }}>
        <p style={{ fontWeight: 800, marginBottom: '0.35rem', fontSize: '0.82rem', color: '#000', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.3rem' }}>{entry.name}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: list.length ? '0.5rem' : 0 }}>
          <div style={{ width: 9, height: 9, borderRadius: 2, background: statusColors[hoveredStatus], flexShrink: 0 }} />
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{hoveredStatus}: {count}</span>
        </div>
        {list.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.22rem' }}>
            {list.map((item, i) => {
              const meta = INIT_TYPE_META[item.type];
              return (
                <li key={i} style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: '1.3', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  {meta && <meta.Icon size={11} style={{ color: meta.color, flexShrink: 0 }} />}
                  {item.title}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div style={{ height: chartH }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sysData} layout="vertical" margin={{ right: 50, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
          <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis dataKey="name" type="category" fontSize={11} width={110} tickLine={false} axisLine={false} stroke="#000" style={{ fontWeight: 600 }} />
          <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} content={<BacklogTooltip />} />
          {statusKeys.map(key => (
            <Bar key={key} dataKey={key} stackId="a" fill={statusColors[key]}
              onMouseEnter={() => setHoveredStatus(key)}
              onMouseLeave={() => setHoveredStatus(null)}
            >
              <LabelList dataKey={key} position="center" style={{ fill: '#fff', fontSize: '10px', fontWeight: 700 }} formatter={(v: any) => v > 0 ? v : ''} />
            </Bar>
          ))}
          <Bar dataKey="_phantom" stackId="a" fill="transparent" legendType="none" isAnimationActive={false}>
            <LabelList
              content={(props: any) => {
                const { x, y, width, height, index } = props;
                const entry = sysData[index];
                const total = entry?.total;
                if (!total) return null;
                return <text x={x + width + 8} y={y + height / 2} textAnchor="start" dominantBaseline="central" style={{ fill: '#1a202c', fontSize: '11px', fontWeight: 700 }}>{total}</text>;
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

type DashboardView = 'overview' | 'closed' | 'open';

const Dashboard: React.FC = () => {
  const { currentCompany, currentDepartment, user } = useAuth();
  const { selectedManagerId, setHeaderContent } = useView();

  const [dashboardView, setDashboardView] = React.useState<DashboardView>(
    () => (localStorage.getItem('dashboard_view') as DashboardView) || 'overview'
  );

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

  const selectedManager = selectedManagerId !== 'all'
    ? data.collaborators.find(c => c.id === selectedManagerId)
    : null;
  const effectiveRole = selectedManager?.role ?? user?.role;
  const isDirector = effectiveRole === 'Master' || effectiveRole === 'Director' || effectiveRole === 'Head';

  // ── Header toggle ──────────────────────────────────────────────────────────
  React.useEffect(() => {
    const btn = (active: boolean): React.CSSProperties => ({
      height: '26px',
      padding: '0 8px',
      borderRadius: '8px',
      border: 'none',
      background: active ? 'white' : 'transparent',
      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
      cursor: 'pointer',
      boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '32px',
    });
    const set = (v: DashboardView) => {
      setDashboardView(v);
      localStorage.setItem('dashboard_view', v);
    };
    setHeaderContent(
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#F1F5F9', padding: '3px', borderRadius: '10px' }}>
        <button onClick={() => set('overview')} title="Visão Geral — KPIs, contratos, férias e aniversariantes" style={btn(dashboardView === 'overview')}>
          <BarChart3 size={16} />
        </button>
        <button onClick={() => set('closed')} title="Iniciativas Encerradas — histórico, % no prazo, distribuição por área e tipo" style={btn(dashboardView === 'closed')}>
          <CheckCircle2 size={16} />
        </button>
        <button onClick={() => set('open')} title="Iniciativas Abertas — forecast, funil, distribuição por área e backlog por sistema" style={btn(dashboardView === 'open')}>
          <Activity size={16} />
        </button>
      </div>
    );
    return () => setHeaderContent(null);
  }, [dashboardView, setHeaderContent]);

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

  const filtered = React.useMemo(() => {
    if (!hierarchy) return data;
    return {
      ...data,
      initiatives: data.initiatives.filter(it =>
        hierarchy.leaderIds.includes(it.leaderId) ||
        (it.assignedManagerId && hierarchy.leaderIds.includes(it.assignedManagerId))
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

  const currentYear = new Date().getFullYear();

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
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1);
      return { year: d.getFullYear(), month: d.getMonth(), label: format(d, 'MMM/yy', { locale: ptBR }).replace('.', '') };
    });
    const concluded = filtered.initiatives.filter(it => it.status === '9- Concluído');
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
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1);
      return { year: d.getFullYear(), month: d.getMonth(), label: format(d, 'MMM/yy', { locale: ptBR }).replace('.', '') };
    });
    const concluded = filtered.initiatives.filter(it => it.status === '9- Concluído');
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
    filtered.initiatives.filter(it => it.status === '9- Concluído').forEach(it => {
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

  const getTypeComparisonData = () => {
    const types = [
      { key: '1- Estratégico', label: 'Estratégico' },
      { key: '2- Projeto',     label: 'Projeto' },
      { key: '3- Fast Track',  label: 'Fast Track' },
      { key: '4- PBI',         label: 'PBI' },
    ];
    const concluded = filtered.initiatives.filter(it => it.status === '9- Concluído');
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
    filtered.initiatives.filter(it => it.status === '9- Concluído').forEach(it => {
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
        const c = data.collaborators.find(col => col.id === managerId);
        const name = c?.name || 'Desconhecido';
        if (!mgrs[managerId]) mgrs[managerId] = { id: managerId, name, photoUrl: c?.photoUrl || null, noPrazo: 0, atrasado: 0, total: 0, list: [], initiatives: [] };
        mgrs[managerId].total++;
        mgrs[managerId].list.push(it.title);
        mgrs[managerId].initiatives.push({ ...it, cycleTime: computeCycleTime(it) });
        if (isOnTime(it)) mgrs[managerId].noPrazo++; else mgrs[managerId].atrasado++;
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
    const concluded = filtered.initiatives.filter(it => it.status === '9- Concluído');
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

  const getForecastData = () => {
    const monthsList = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthsData: Record<string, { concluido: number; planejado: number; total: number; listConcluido: string[]; listPlanejado: string[] }> = {};
    monthsList.forEach(m => monthsData[m] = { concluido: 0, planejado: 0, total: 0, listConcluido: [], listPlanejado: [] });
    filtered.initiatives.forEach(it => {
      const dateStr = it.actualEndDate || it.endDate || it.businessExpectationDate;
      if (!dateStr) return;
      try {
        const date = parseISO(dateStr);
        if (date.getFullYear() !== currentYear) return;
        const monthKey = format(date, 'MMM', { locale: ptBR }).replace('.', '');
        const normalizedKey = monthsList.find(m => m.toLowerCase() === monthKey.toLowerCase()) || monthKey;
        if (!monthsData[normalizedKey]) return;
        if (it.status === '9- Concluído') {
          monthsData[normalizedKey].concluido++;
          monthsData[normalizedKey].listConcluido.push(it.title);
        } else if (['3- Planejamento', '4- Aguardando Capacidade', '5- Construção', '6- QA', '7- UAT', '8- Implantação'].includes(it.status)) {
          monthsData[normalizedKey].planejado++;
          monthsData[normalizedKey].listPlanejado.push(it.title);
        }
        monthsData[normalizedKey].total = monthsData[normalizedKey].concluido + monthsData[normalizedKey].planejado;
      } catch (e) {}
    });
    return monthsList.map(name => ({ name, ...monthsData[name] }));
  };

  const getFunnelData = () => {
    const statuses = ['1- Backlog', '2- Discovery', '3- Planejamento', '4- Aguardando Capacidade', '5- Construção', '6- QA', '7- UAT', '8- Implantação', '9- Concluído'];
    return statuses.map(s => {
      const inits = filtered.initiatives.filter(it => it.status === s);
      return { name: s.split('- ')[1] || s, total: inits.length, list: inits.map(it => it.title) };
    });
  };

  const getOpenAreaData = () => {
    const CLOSED = ['9- Concluído', 'Suspenso', 'Cancelado'];
    const areas: Record<string, { name: string; total: number; list: string[] }> = {};
    filtered.initiatives.filter(it => !CLOSED.includes(it.status)).forEach(it => {
      const area = it.originDirectorate || 'Não Definida';
      if (!areas[area]) areas[area] = { name: area, total: 0, list: [] };
      areas[area].total++;
      areas[area].list.push(it.title);
    });
    return Object.values(areas).sort((a, b) => b.total - a.total);
  };


  const OPEN_STATUSES = ['1- Backlog', '2- Discovery', '3- Planejamento', '4- Aguardando Capacidade', '5- Construção', '6- QA', '7- UAT', '8- Implantação'];
  const STATUS_COLORS: Record<string, string> = {
    'Backlog': '#8884d8', 'Discovery': '#82ca9d', 'Planejamento': '#ffc658',
    'Aguardando Capacidade': '#94a3b8', 'Construção': '#ff8042', 'QA': '#a78bfa',
    'UAT': '#f472b6', 'Implantação': '#0088fe'
  };

  const getSystemsBacklogData = () => {
    const openInits = filtered.initiatives.filter(it => OPEN_STATUSES.includes(it.status));
    const sysMap: Record<string, any> = {};
    openInits.forEach(it => {
      const statusKey = it.status.split('- ')[1] || it.status;
      (it.impactedSystemIds || []).forEach(sysId => {
        const sys = filtered.systems.find(s => s.id === sysId);
        if (!sys) return;
        if (!sysMap[sysId]) sysMap[sysId] = { name: sys.acronym || sys.name, total: 0, listByStatus: {} as Record<string, string[]>, Backlog: 0, Discovery: 0, Planejamento: 0, 'Aguardando Capacidade': 0, Construção: 0, QA: 0, UAT: 0, Implantação: 0 };
        sysMap[sysId].total++;
        sysMap[sysId][statusKey] = (sysMap[sysId][statusKey] || 0) + 1;
        if (!sysMap[sysId].listByStatus[statusKey]) sysMap[sysId].listByStatus[statusKey] = [];
        sysMap[sysId].listByStatus[statusKey].push({ title: it.title, type: it.type || '' });
      });
    });
    return Object.values(sysMap).sort((a: any, b: any) => b.total - a.total).slice(0, 20);
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

      {/* ── VIEW 1: VISÃO GERAL ─────────────────────────────────────────── */}
      {dashboardView === 'overview' && (<>

        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          {[
            {
              label: 'Sistemas Suportados',
              val: filtered.systems.length,
              subtext: `${filtered.systems.filter(s => s.criticality === 'Tier 1').length} Tier 1 Críticos`,
              icon: Cpu, color: '#FFD919'
            },
            {
              label: 'Colaboradores Ativos',
              val: filtered.collaborators.length,
              subtext: `${filtered.collaborators.filter(c => c.role === 'Engineer').length} Engenheiros`,
              icon: Users, color: '#3B82F6'
            },
            {
              label: 'Contratos Responsáveis',
              val: activeContracts.length,
              subtext: `OPEX: ${formatCurrency(totalOpex)}/ano`,
              icon: FileText, color: '#8B5CF6'
            },
            (() => {
              const typeMap: Record<string, string> = { '1- Estratégico': 'Estratégico', '2- Projeto': 'Projeto', '3- Fast Track': 'Fast Track', '4- PBI': 'PBI' };
              const breakdown = Object.entries(typeMap)
                .map(([k, label]) => ({ label, val: concludedThisYear.filter(it => it.type === k).length }))
                .filter(b => b.val > 0);
              return { label: 'Encerradas no Ano', val: concludedThisYear.length, subtext: `Acumulado ${currentYear}`, icon: CheckCircle2, color: '#10B981', breakdown };
            })(),
            (() => {
              const aguardando = openInits.filter(it => (it.status as string) === '4- Aguardando Capacidade').length;
              const typeMap: Record<string, string> = { '1- Estratégico': 'Estratégico', '2- Projeto': 'Projeto', '3- Fast Track': 'Fast Track', '4- PBI': 'PBI' };
              const breakdown = Object.entries(typeMap)
                .map(([k, label]) => ({ label, val: openInits.filter(it => it.type === k).length }))
                .filter(b => b.val > 0);
              return { label: 'Iniciativas em Aberto', val: openInits.length, subtext: `${aguardando} Aguardando capacidade`, icon: Layers, color: '#F59E0B', breakdown };
            })(),
          ].map((kpi, i) => (
            <div key={i} style={{ ...card, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: `4px solid ${kpi.color}` }}>
              <div className="flex-between">
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.025em' }}>{kpi.label}</span>
                <kpi.icon size={18} style={{ opacity: 0.8 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{kpi.val}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-tertiary)' }}>{kpi.subtext}</span>
                {(kpi as any).breakdown?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem 0.65rem', marginTop: '0.5rem', paddingTop: '0.45rem', borderTop: '1px solid var(--glass-border)' }}>
                    {(kpi as any).breakdown.map((b: { label: string; val: number }, bi: number) => (
                      <div key={bi} style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>{b.label}</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>{b.val}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Férias + Aniversariantes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>

          {/* Férias */}
          <div style={{ ...card, padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Calendar size={18} /> Férias — próximos 3 meses
              <span style={{ marginLeft: 'auto', background: '#EFF6FF', color: '#3B82F6', fontWeight: 700, fontSize: '0.75rem', padding: '2px 10px', borderRadius: '20px' }}>{upcomingVacations.length}</span>
            </h3>
            {upcomingVacations.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', textAlign: 'center', padding: '1.5rem 0' }}>Nenhuma férias prevista nos próximos 3 meses.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {upcomingVacations.map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.55rem 0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    {c.photoUrl
                      ? <img loading="lazy" src={c.photoUrl} alt={c.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Users size={14} color="#64748B" /></div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: '0.83rem', color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: 0 }}>A partir de {format(parseISO(c.vacationStart!), "dd 'de' MMMM", { locale: ptBR })}</p>
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#3B82F6', background: '#EFF6FF', padding: '2px 8px', borderRadius: '12px', flexShrink: 0 }}>
                      {format(parseISO(c.vacationStart!), 'dd/MM')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Aniversariantes */}
          <div style={{ ...card, padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Gift size={18} /> Aniversariantes — próximos 3 meses
              <span style={{ marginLeft: 'auto', background: '#FFF7ED', color: '#F59E0B', fontWeight: 700, fontSize: '0.75rem', padding: '2px 10px', borderRadius: '20px' }}>{upcomingBirthdays.length}</span>
            </h3>
            {upcomingBirthdays.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', textAlign: 'center', padding: '1.5rem 0' }}>Nenhum aniversário nos próximos 3 meses.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {upcomingBirthdays.map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.55rem 0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    {c.photoUrl
                      ? <img loading="lazy" src={c.photoUrl} alt={c.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Users size={14} color="#64748B" /></div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: '0.83rem', color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: 0 }}>
                        {format(c.nextBirthday, "dd 'de' MMMM", { locale: ptBR })}
                        {c.nextBirthday.getFullYear() !== currentYear && ` de ${c.nextBirthday.getFullYear()}`}
                      </p>
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#F59E0B', background: '#FFF7ED', padding: '2px 8px', borderRadius: '12px', flexShrink: 0 }}>
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
        const totalConcluded = filtered.initiatives.filter(it => it.status === '9- Concluído');
        const totalOnTime = totalConcluded.filter(it => isOnTime(it)).length;
        const pctOnTime = totalConcluded.length > 0 ? Math.round(totalOnTime / totalConcluded.length * 100) : 0;
        const areaH = Math.max(220, areaData.length * 36 + 40);
        const typeH = Math.max(200, typeData.length * 60 + 60);

        return (<>
          {/* Row 1: Volume últimos 12 meses + Total/% on time */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>

            {/* Volume últimos 12 meses */}
            <div style={{ ...card, padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <TrendingUp size={18} /> Volume Encerrado — últimos 12 meses
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>Entregue no prazo vs. com atraso</p>
              <div style={{ height: 260, cursor: 'pointer' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={last12} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} dy={8} stroke="#94A3B8" />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#94A3B8" />
                    <Tooltip cursor={{ fill: 'rgba(16,185,129,0.06)' }} content={<ClosedMonthTooltip />} />
                    <Bar dataKey="noPrazo" name="No prazo" stackId="a" fill="#10B981" radius={[0,0,0,0]}
                      onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}>
                      <LabelList dataKey="pctNoPrazo" position="center" style={{ fill: '#fff', fontSize: '10px', fontWeight: 700 }} formatter={(v: any) => v > 0 ? `${v}%` : ''} />
                      <LabelList dataKey="totalWhenPerfect" position="top" offset={8} style={{ fill: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 700 }} formatter={(v: any) => v > 0 ? v : ''} />
                    </Bar>
                    <Bar dataKey="atrasado" name="Atrasado" stackId="a" fill="#EF4444" radius={[4,4,0,0]}
                      onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}>
                      <LabelList dataKey="pctAtrasado" position="center" style={{ fill: '#fff', fontSize: '10px', fontWeight: 700 }} formatter={(v: any) => v > 0 ? `${v}%` : ''} />
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

            {/* Cycle Time médio por mês */}
            <div style={{ ...card, padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Activity size={18} /> Cycle Time Médio — últimos 12 meses
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>Média de dias do início ao encerramento — clique em uma barra para ver os detalhes</p>
              <div style={{ height: 260, cursor: 'pointer' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cycleTimeData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} dy={8} stroke="#94A3B8" />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#94A3B8" />
                    <Tooltip cursor={{ fill: 'rgba(99,102,241,0.08)' }} content={<CycleTimeTooltip />} />
                    <Bar dataKey="avgDays" fill="#6366F1" radius={[4,4,0,0]}
                      onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}>
                      <LabelList dataKey="avgDays" position="top" offset={6} style={{ fill: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 700 }} formatter={(v: any) => v > 0 ? `${v}d` : ''} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Row 2: Volume por Líder + Tipo + Cycle Time por Tipo */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>

            {/* Volume por Líder */}
            <div style={{ ...card, padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <CheckCircle2 size={18} /> Volume por Líder
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>
                {isDirector ? 'Comparativo por líder' : 'Acumulado com % entregue no prazo'}
              </p>

              {!isDirector ? (
                /* Non-director: single visual */
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
                  {/* Vertical bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 64, height: 200, borderRadius: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid var(--glass-border)' }}>
                      <div style={{ width: '100%', height: `${100 - pctOnTime}%`, background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 20 }}>
                        {(100 - pctOnTime) >= 12 && <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#fff' }}>{100 - pctOnTime}%</span>}
                      </div>
                      <div style={{ width: '100%', height: `${pctOnTime}%`, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 20 }}>
                        {pctOnTime >= 12 && <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#fff' }}>{pctOnTime}%</span>}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10B981' }}>{pctOnTime}% no prazo</span>
                  </div>
                </div>
              ) : (
                /* Director: bar chart per leader */
                <div style={{ height: 240, cursor: 'pointer' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leaderData} margin={{ bottom: 10, top: 30, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis
                        dataKey="name"
                        height={80}
                        tick={<ManagerTick data={leaderData} />}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                      />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#94A3B8" />
                      <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} content={<LeaderOnTimeTooltip />} />
                      <Bar dataKey="noPrazo" name="No prazo" stackId="a" fill="#10B981" radius={[0,0,0,0]}
                        onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}>
                        <LabelList dataKey="pctNoPrazo" position="center" style={{ fill: '#fff', fontSize: '10px', fontWeight: 700 }} formatter={(v: any) => v > 0 ? `${v}%` : ''} />
                        <LabelList dataKey="totalWhenPerfect" position="top" offset={8} style={{ fill: '#000', fontSize: '0.85rem', fontWeight: 900 }} formatter={(v: any) => v > 0 ? v : ''} />
                      </Bar>
                      <Bar dataKey="atrasado" name="Atrasado" stackId="a" fill="#EF4444" radius={[6,6,0,0]}
                        onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}>
                        <LabelList dataKey="pctAtrasado" position="center" style={{ fill: '#fff', fontSize: '10px', fontWeight: 700 }} formatter={(v: any) => v > 0 ? `${v}%` : ''} />
                        <LabelList dataKey="total" position="top" offset={8} style={{ fill: '#000', fontSize: '0.85rem', fontWeight: 900 }} formatter={(v: any) => v > 0 ? v : ''} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Tipo de iniciativa */}
            <div style={{ ...card, padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.5rem' }}>Comparação por Tipo de Iniciativa</h3>
              {typeData.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', textAlign: 'center', padding: '1.5rem 0' }}>Sem dados de tipo.</p>
              ) : (
                <div style={{ height: typeH, cursor: 'pointer' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={typeData} margin={{ top: 30, right: 20, bottom: 10 }}>
                      <defs>
                        <linearGradient id="gradOnTime" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" /><stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient id="gradLate" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#EF4444" /><stop offset="100%" stopColor="#DC2626" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" height={36} tickLine={false} axisLine={false} interval={0} tick={<TypeTick />} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#94A3B8" />
                      <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} content={<TypeTooltip />} />
                      <Bar dataKey="noPrazo" name="No prazo" stackId="a" fill="url(#gradOnTime)" radius={[0,0,0,0]}
                        onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}>
                        <LabelList dataKey="pctOnTime" position="center" style={{ fill: '#fff', fontSize: '10px', fontWeight: 700 }} formatter={(v: any) => v > 0 ? `${v}%` : ''} />
                        <LabelList dataKey="totalWhenPerfect" position="top" offset={8} style={{ fill: '#000', fontSize: '0.9rem', fontWeight: 900 }} formatter={(v: any) => v > 0 ? v : ''} />
                      </Bar>
                      <Bar dataKey="atrasado" name="Atrasado" stackId="a" fill="url(#gradLate)" radius={[6,6,0,0]}
                        onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}>
                        <LabelList dataKey="pctAtrasado" position="center" style={{ fill: '#fff', fontSize: '10px', fontWeight: 700 }} formatter={(v: any) => v > 0 ? `${v}%` : ''} />
                        <LabelList dataKey="total" position="top" offset={8} style={{ fill: '#000', fontSize: '0.9rem', fontWeight: 900 }} formatter={(v: any) => v > 0 ? v : ''} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}><div style={{ width: 10, height: 10, borderRadius: 2, background: '#10B981' }} /> No prazo</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}><div style={{ width: 10, height: 10, borderRadius: 2, background: '#EF4444' }} /> Com atraso</div>
              </div>
            </div>

            {/* Cycle Time por Tipo */}
            <div style={{ ...card, padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Clock size={16} /> Cycle Time por Tipo
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>Média de dias por tipo de iniciativa</p>
              {ctByTypeData.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', textAlign: 'center', padding: '1.5rem 0' }}>Sem dados de ciclo disponíveis.</p>
              ) : (
                <div style={{ height: typeH, cursor: 'pointer' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ctByTypeData} margin={{ top: 20, right: 20, bottom: 10, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" height={36} tickLine={false} axisLine={false} interval={0} tick={<TypeTick />} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#94A3B8" />
                      <Tooltip cursor={{ fill: 'rgba(99,102,241,0.08)' }} content={<CycleTimeTooltip />} />
                      <Bar dataKey="avgDays" fill="#6366F1" radius={[4,4,0,0]}
                        onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}>
                        <LabelList dataKey="avgDays" position="top" offset={6} style={{ fill: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 700 }} formatter={(v: any) => v > 0 ? `${v}d` : ''} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Distribuição por Área Cliente */}
          <div style={{ ...card, padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.5rem' }}>Distribuição por Área Cliente</h3>
            {areaData.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', textAlign: 'center', padding: '1.5rem 0' }}>Sem dados de área.</p>
            ) : (
              <div style={{ height: areaH, cursor: 'pointer' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={areaData} layout="vertical" margin={{ right: 50, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" fontSize={11} width={160} tickLine={false} axisLine={false} stroke="#000" style={{ fontWeight: 500 }} />
                    <Tooltip cursor={{ fill: 'rgba(16,185,129,0.06)' }} content={<ClosedAreaTooltip />} />
                    <Bar dataKey="noPrazo" name="No prazo" stackId="a" fill="#10B981" radius={[0,0,0,0]}
                      onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}>
                      <LabelList dataKey="pctNoPrazo" position="center" style={{ fill: '#fff', fontSize: '10px', fontWeight: 700 }} formatter={(v: any) => v > 0 ? `${v}%` : ''} />
                      <LabelList dataKey="totalWhenPerfect" position="right" offset={10} style={{ fill: '#000', fontSize: '0.82rem', fontWeight: 800 }} formatter={(v: any) => v > 0 ? v : ''} />
                    </Bar>
                    <Bar dataKey="atrasado" name="Atrasado" stackId="a" fill="#EF4444" radius={[0,6,6,0]}
                      onClick={(d: any) => { if (d?.initiatives?.length > 0) setDrilldownModal({ title: d.drilldownTitle, initiatives: d.initiatives }); }}>
                      <LabelList dataKey="pctAtrasado" position="center" style={{ fill: '#fff', fontSize: '10px', fontWeight: 700 }} formatter={(v: any) => v > 0 ? `${v}%` : ''} />
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
      {dashboardView === 'open' && (<>

        {/* Row 1: Forecast + Funil */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>

          <div style={{ ...card, padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <TrendingUp size={18} /> Forecast de Entregas {currentYear}
            </h3>
            <div style={{ height: 280, marginLeft: '-15px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={getForecastData()} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradConcluido" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" /><stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="gradPlanejado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFD919" /><stop offset="100%" stopColor="#F59E0B" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} dy={10} stroke="#94A3B8" />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#94A3B8" />
                  <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                  <Bar dataKey="concluido" name="Concluído" stackId="a" fill="url(#gradConcluido)" radius={[0,0,0,0]} />
                  <Bar dataKey="planejado" name="Planejado" stackId="a" fill="url(#gradPlanejado)" radius={[4,4,0,0]} />
                  <Line type="monotone" dataKey="total" stroke="none" dot={false} activeDot={false} isAnimationActive={false}>
                    <LabelList dataKey="total" position="top" offset={10} style={{ fill: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700 }} formatter={(val: any) => (Number(val) > 0 ? val : '')} />
                  </Line>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ ...card, padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Filter size={18} /> Funil de Iniciativas (Status)
            </h3>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getFunnelData()} layout="vertical" margin={{ left: 20, right: 40 }}>
                  <defs>
                    {[['Backlog','#8884d8','#6d69b3'],['Discovery','#82ca9d','#68a67d'],['Planning','#ffc658','#e6af45'],['Waiting','#94a3b8','#64748b'],['Execution','#ff8042','#e66a2e'],['QA','#a78bfa','#7c3aed'],['UAT','#f472b6','#db2777'],['Deployment','#0088fe','#006ecb'],['Concluded','#00C49F','#00a283']].map(([id, c1, c2]) => (
                      <linearGradient key={id} id={`grad${id}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={c1} /><stop offset="100%" stopColor={c2} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" fontSize={11} hide />
                  <YAxis dataKey="name" type="category" fontSize={11} width={100} tickLine={false} axisLine={false} stroke="#000000" style={{ fontWeight: 600 }} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} content={<FunnelTooltip />} />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                    {getFunnelData().map((_, index) => (
                      <Cell key={`cell-${index}`} fill={['url(#gradBacklog)','url(#gradDiscovery)','url(#gradPlanning)','url(#gradWaiting)','url(#gradExecution)','url(#gradQA)','url(#gradUAT)','url(#gradDeployment)','url(#gradConcluded)'][index % 9]} />
                    ))}
                    <LabelList dataKey="total" position="right" offset={10} style={{ fill: '#000', fontSize: '0.8rem', fontWeight: 700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Row 2: Distribuição por área (open) */}
        {(() => {
          const openAreaData = getOpenAreaData();
          if (openAreaData.length === 0) return null;
          const h = Math.max(220, openAreaData.length * 36 + 40);
          return (
            <div style={{ ...card, padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.5rem' }}>Distribuição por Área Cliente — Iniciativas Abertas</h3>
              <div style={{ height: h }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={openAreaData} layout="vertical" margin={{ right: 50, left: 20 }}>
                    <defs>
                      <linearGradient id="gradAreaOpen" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#A855F7" /><stop offset="100%" stopColor="#6D28D9" />
                      </linearGradient>
                    </defs>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" fontSize={11} width={160} tickLine={false} axisLine={false} stroke="#000000" style={{ fontWeight: 500 }} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} content={<AreaTooltip />} />
                    <Bar dataKey="total" fill="url(#gradAreaOpen)" radius={[0, 6, 6, 0]} barSize={22}>
                      <LabelList dataKey="total" position="right" offset={12} style={{ fill: '#000', fontSize: '0.9rem', fontWeight: 800 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })()}

        {/* Row 3: Backlog por Sistema */}
        {(() => {
          const sysData = getSystemsBacklogData();
          if (sysData.length === 0) return null;
          const statusKeys = ['Backlog','Discovery','Planejamento','Aguardando Capacidade','Construção','QA','UAT','Implantação'];
          return (
            <div style={{ ...card, padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Layers size={18} /> Backlog por Sistema
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>
                Iniciativas ativas agrupadas por sistema impactado
              </p>
              <SystemsBacklogChart sysData={sysData} statusKeys={statusKeys} statusColors={STATUS_COLORS} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                {statusKeys.map(key => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: STATUS_COLORS[key], flexShrink: 0 }} />{key}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </>)}

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
            {[...drilldownModal.initiatives].sort((a, b) => {
              const da = a.actualEndDate || a.endDate;
              const db = b.actualEndDate || b.endDate;
              if (!da && !db) return 0;
              if (!da) return 1;
              if (!db) return -1;
              try { return parseISO(da).getTime() - parseISO(db).getTime(); } catch { return 0; }
            }).map((it, i) => {
              const typeLabel = (it.type || '').replace(/^\d+-\s*/, '');
              const meta = TYPE_TICK_META[typeLabel] ?? { Icon: null, color: '#94A3B8' };
              const onTime = isOnTime(it);
              const leader = data.collaborators.find(c => c.id === it.leaderId);
              const leaderName = leader?.name ?? 'Sem líder';
              const leaderAvatar = leader?.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(leaderName)}&background=E2E8F0&color=64748B&size=64`;
              const endDateStr = it.actualEndDate || it.endDate;
              const implantMonth = endDateStr ? (() => { try { return format(parseISO(endDateStr), 'MMM/yy', { locale: ptBR }).replace('.', ''); } catch { return '—'; } })() : '—';
              return (
                <div key={it.id ?? i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', borderBottom: i < drilldownModal.initiatives.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                  {/* Type icon */}
                  <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: '8px', background: `${meta.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {meta.Icon && <meta.Icon size={15} color={meta.color} />}
                  </div>
                  {/* Title + type */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.title}</p>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.7rem', color: '#94A3B8' }}>{typeLabel || 'Tipo não definido'}</p>
                  </div>
                  {/* Implantation month */}
                  <div style={{ flexShrink: 0, padding: '3px 8px', borderRadius: '20px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', fontSize: '0.7rem', fontWeight: 600, minWidth: 56, textAlign: 'center' }}>
                    {implantMonth}
                  </div>
                  {/* Leader avatar */}
                  <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }} title={leaderName}>
                    <img src={leaderAvatar} alt={leaderName} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', border: '1px solid #E2E8F0' }} />
                    <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 500, maxWidth: 80, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{leaderName.split(' ')[0]}</span>
                  </div>
                  {/* On time badge */}
                  <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '3px 8px', borderRadius: '20px', background: onTime ? '#DCFCE7' : '#FEE2E2', color: onTime ? '#15803D' : '#DC2626', fontSize: '0.7rem', fontWeight: 700 }}>
                    {onTime ? <CheckCircle size={11} /> : <XCircle size={11} />}
                    {onTime ? 'No prazo' : 'Atrasado'}
                  </div>
                  {/* Cycle time */}
                  <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '3px 8px', borderRadius: '20px', background: '#EEF2FF', color: '#4F46E5', fontSize: '0.7rem', fontWeight: 700, minWidth: 56, justifyContent: 'center' }}>
                    <Clock size={11} />
                    {it.cycleTime !== null ? `${it.cycleTime}d` : 'N/A'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default Dashboard;
