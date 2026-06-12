import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useView } from '@/context/ViewContext';
import {
  Cpu,
  Users,
  CheckCircle2,
  TrendingUp,
  Filter,
  Layers,
  Diamond,
  Briefcase,
  Zap,
  Bug
} from 'lucide-react';
import { 
  ComposedChart,
  BarChart, 
  Bar,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Initiative, Collaborator, System, Team, Vendor } from '../../../types';
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{    
        background: 'rgba(255, 255, 255, 0.98)', 
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--glass-border)',
        padding: '1rem',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-lg)',
        minWidth: '240px',
        maxWidth: '350px',
        zIndex: 1000
      }}>
        <p style={{ 
          fontWeight: 800, 
          marginBottom: '0.75rem', 
          fontSize: '0.9rem', 
          color: 'var(--text-primary)',
          borderBottom: '1px solid var(--glass-border)',
          paddingBottom: '0.4rem'
        }}>{label}</p>
        
        {data.listConcluido.length > 0 && (
          <div style={{ marginBottom: '0.8rem' }}>
            <p style={{ 
              color: '#059669', 
              fontWeight: 700, 
              fontSize: '0.7rem', 
              marginBottom: '0.35rem', 
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
              Concluído ({data.concluido})
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {data.listConcluido.map((t: string, i: number) => (
                <li key={i} style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--text-secondary)', 
                  fontWeight: 500,
                  lineHeight: '1.2'
                }}>• {t}</li>
              ))}
            </ul>
          </div>
        )}
        
        {data.listPlanejado.length > 0 && (
          <div>
            <p style={{ 
              color: '#D97706', 
              fontWeight: 700, 
              fontSize: '0.7rem', 
              marginBottom: '0.35rem', 
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFD919' }} />
              Planejado ({data.planejado})
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {data.listPlanejado.map((t: string, i: number) => (
                <li key={i} style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--text-secondary)', 
                  fontWeight: 500,
                  lineHeight: '1.2'
                }}>• {t}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const ManagerTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const entry = payload[0].payload;
    return (
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.98)', 
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--glass-border)',
        padding: '1rem',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-lg)',
        minWidth: '240px',
        maxWidth: '350px',
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
           {entry.photoUrl ? (
             <img loading="lazy" src={entry.photoUrl} alt={entry.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #E2E8F0' }} />
           ) : (
             <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#F1F5F9', border: '1.5px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Users size={16} color="#64748B" />
             </div>
           )}
           <div>
             <p style={{ fontWeight: 800, fontSize: '0.9rem', color: '#000', margin: 0 }}>{entry.name}</p>
             <p style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-tertiary)', margin: 0, textTransform: 'uppercase' }}>Forecast de Entregas</p>
           </div>
        </div>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
          Entregas Concluídas ({entry.total})
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {entry.list?.map((t: string, i: number) => (
            <li key={i} style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-secondary)', 
              fontWeight: 500,
              lineHeight: '1.2'
            }}>• {t}</li>
          ))}
        </ul>
      </div>
    );
  }
  return null;
};

const AreaTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const entry = payload[0].payload;
    return (
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.98)', 
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--glass-border)',
        padding: '1rem',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-lg)',
        minWidth: '240px',
        maxWidth: '350px',
        zIndex: 1000
      }}>
        <p style={{ 
          fontWeight: 800, 
          marginBottom: '0.5rem', 
          fontSize: '0.9rem', 
          color: '#000',
          borderBottom: '1px solid var(--glass-border)',
          paddingBottom: '0.4rem'
        }}>{label}</p>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '0.6rem', textTransform: 'uppercase' }}>
          Iniciativas ({entry.total})
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {entry.list.map((t: string, i: number) => (
            <li key={i} style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-secondary)', 
              fontWeight: 500,
              lineHeight: '1.2'
            }}>• {t}</li>
          ))}
        </ul>
      </div>
    );
  }
  return null;
};

const FunnelTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const entry = payload[0].payload;
    return (
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.98)', 
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--glass-border)',
        padding: '1rem',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-lg)',
        minWidth: '240px',
        maxWidth: '350px',
        zIndex: 1000
      }}>
        <p style={{ 
          fontWeight: 800, 
          marginBottom: '0.5rem', 
          fontSize: '0.9rem', 
          color: '#000',
          borderBottom: '1px solid var(--glass-border)',
          paddingBottom: '0.4rem'
        }}>{label}</p>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '0.6rem', textTransform: 'uppercase' }}>
          Total na etapa: <span style={{ color: 'var(--text-primary)' }}>{entry.total}</span>
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {entry.list.map((t: string, i: number) => (
            <li key={i} style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-secondary)', 
              fontWeight: 500,
              lineHeight: '1.2'
            }}>• {t}</li>
          ))}
        </ul>
      </div>
    );
  }
  return null;
};

const ManagerTick = (props: any) => {
  const { x, y, index, data } = props;
  const manager = data && data[index];
  if (!manager) return null;
  
  // Use a fallback avatar service if manager.photoUrl is missing
  const avatarUrl = manager.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(manager.name)}&background=random&color=fff`;

  return (
    <g transform={`translate(${x},${y + 15})`}>
      <defs>
        <clipPath id={`circleView-${index}`}>
          <circle cx="-15" cy="12" r="12" />
        </clipPath>
      </defs>
      <image
        x="-27"
        y="0"
        width="24"
        height="24"
        href={avatarUrl}
        clipPath={`url(#circleView-${index})`}
        preserveAspectRatio="xMidYMid slice"
      />
      <circle cx="-15" cy="12" r="12" fill="none" stroke="#E2E8F0" strokeWidth="1.5" />
      <text
        x="5"
        y="17"
        textAnchor="start"
        fill="#000000"
        fontSize="13"
        fontWeight="500"
      >
        {manager.name.split(' ')[0]}
      </text>
    </g>
  );
};

const SystemsBacklogChart: React.FC<{
  sysData: any[];
  statusKeys: string[];
  statusColors: Record<string, string>;
}> = ({ sysData, statusKeys, statusColors }) => {
  const [hoveredStatus, setHoveredStatus] = React.useState<string | null>(null);
  const chartH = Math.max(280, sysData.length * 32 + 60);

  const INIT_TYPE_META: Record<string, { Icon: React.FC<{ size?: number; style?: React.CSSProperties }>; color: string }> = {
    '1- Estratégico': { Icon: Diamond,   color: '#EF4444' },
    '2- Projeto':     { Icon: Briefcase, color: '#3B82F6' },
    '3- Fast Track':  { Icon: Zap,       color: '#10B981' },
    '4- PBI':         { Icon: Bug,        color: '#D97706' },
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
              <LabelList
                dataKey={key}
                position="center"
                style={{ fill: '#fff', fontSize: '10px', fontWeight: 700 }}
                formatter={(v: any) => v > 0 ? v : ''}
              />
            </Bar>
          ))}
          <Bar dataKey="_phantom" stackId="a" fill="transparent" legendType="none" isAnimationActive={false}>
            <LabelList
              content={(props: any) => {
                const { x, y, width, height, index } = props;
                const entry = sysData[index];
                const total = entry?.total;
                if (!total) return null;
                return (
                  <text x={x + width + 8} y={y + height / 2} textAnchor="start" dominantBaseline="central" style={{ fill: '#1a202c', fontSize: '11px', fontWeight: 700 }}>
                    {total}
                  </text>
                );
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { currentCompany, currentDepartment, user } = useAuth();

  const [data, setData] = React.useState<{
    systems: System[];
    collaborators: Collaborator[];
    initiatives: Initiative[];
    teams: Team[];
    vendors: Vendor[];
  }>({
    systems: [],
    collaborators: [],
    initiatives: [],
    teams: [],
    vendors: []
  });
  const { selectedManagerId } = useView();
  const [loading, setLoading] = React.useState(true);

  const selectedManager = selectedManagerId !== 'all'
    ? data.collaborators.find(c => c.id === selectedManagerId)
    : null;
  const effectiveRole = selectedManager?.role ?? user?.role;
  const isDirector = effectiveRole === 'Master' || effectiveRole === 'Director' || effectiveRole === 'Head';

  React.useEffect(() => {
    if (!currentCompany) {
      setData({ systems: [], collaborators: [], initiatives: [], teams: [], vendors: [] });
      setLoading(true);
      return;
    }

    const fetchData = async () => {
      try {
        const dashboardData = await fetchDashboardData({
          companyId: currentCompany.id,
          departmentId: currentDepartment?.id
        });
        
        const normalizedInits: Initiative[] = dashboardData.initiatives.map(it => ({
          ...it,
          status: (oldToNewMap[it.status] || it.status) as Initiative['status']
        }));
        
        setData({
          systems: dashboardData.systems,
          collaborators: dashboardData.collaborators,
          initiatives: normalizedInits,
          teams: dashboardData.teams,
          vendors: dashboardData.vendors
        });
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentCompany, currentDepartment]);

  // --- Hierarchy Logic ---
  const getManagerHierarchy = (managerId: string) => {
    if (managerId === 'all') return null;

    const getSubtreeTeams = (pId: string): string[] => {
      const children = data.teams.filter(t => t.parentTeamId === pId);
      return [pId, ...children.flatMap(c => getSubtreeTeams(c.id))];
    };

    // Find all teams led by this manager
    const rootTeams = data.teams.filter(t => t.leaderId === managerId);
    const allTeamIdsInSubtree = rootTeams.flatMap(rt => getSubtreeTeams(rt.id));
    
    // All leaders of these teams (subordinate managers)
    const leaderIds = Array.from(new Set(
      data.teams
        .filter(t => allTeamIdsInSubtree.includes(t.id))
        .map(t => t.leaderId)
        .filter(Boolean) as string[]
    ));

    // Ensure the selected manager is in the list
    if (!leaderIds.includes(managerId)) leaderIds.push(managerId);

    return {
      teamIds: allTeamIdsInSubtree,
      leaderIds: leaderIds
    };
  };

  const hierarchy = getManagerHierarchy(selectedManagerId);

  // --- Filtered Data Context ---
  const filtered = React.useMemo(() => {
    if (!hierarchy) return data;

    const hInits = data.initiatives.filter(it => 
      hierarchy.leaderIds.includes(it.leaderId) || 
      (it.assignedManagerId && hierarchy.leaderIds.includes(it.assignedManagerId))
    );

    const hCollabs = data.collaborators.filter(c => 
      hierarchy.leaderIds.includes(c.id) || 
      (c.squadId && hierarchy.teamIds.includes(c.squadId))
    );

    const hSystems = data.systems.filter(s => 
      s.ownerTeamId && hierarchy.teamIds.includes(s.ownerTeamId)
    );

    return {
      ...data,
      initiatives: hInits,
      collaborators: hCollabs,
      systems: hSystems,
    };
  }, [data, hierarchy]);

  if (loading) return (
    <div className="spinner-container">
      <div className="spinner"></div>
      <span>Carregando ecossistema...</span>
    </div>
  );

  // --- Logic for Forecast (Deliveries per Month) ---
  const getForecastData = () => {
    const monthsData: Record<string, { 
      concluido: number; 
      planejado: number; 
      total: number;
      listConcluido: string[];
      listPlanejado: string[];
    }> = {};
    const monthsList = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    monthsList.forEach(m => monthsData[m] = { 
      concluido: 0, 
      planejado: 0, 
      total: 0,
      listConcluido: [],
      listPlanejado: []
    });

    filtered.initiatives.forEach(it => {
      const dateStr = it.actualEndDate || it.endDate || it.businessExpectationDate;
      if (!dateStr) return;
      
      try {
        const date = parseISO(dateStr);
        if (date.getFullYear() !== new Date().getFullYear()) return;
        
        // Month key in Portuguese ('Jan', 'Fev', etc.)
        const monthKey = format(date, 'MMM', { locale: ptBR }).replace('.', '');
        // Normalize monthKey to match our monthsList (case and dots)
        const normalizedKey = monthsList.find(m => m.toLowerCase() === monthKey.toLowerCase()) || monthKey;

        if (monthsData[normalizedKey]) {
          if (it.status === '9- Concluído') {
            monthsData[normalizedKey].concluido++;
            monthsData[normalizedKey].listConcluido.push(it.title);
          } else if (['3- Planejamento', '4- Aguardando Capacidade', '5- Construção', '6- QA', '7- UAT', '8- Implantação'].includes(it.status)) {
            monthsData[normalizedKey].planejado++;
            monthsData[normalizedKey].listPlanejado.push(it.title);
          }
          monthsData[normalizedKey].total = monthsData[normalizedKey].concluido + monthsData[normalizedKey].planejado;
        }
      } catch (e) {}
    });

    return monthsList.map(name => ({ 
      name, 
      ...monthsData[name] 
    }));
  };

  // --- Logic for Funnel ---
  const getFunnelData = () => {
    const statuses = [
      '1- Backlog', '2- Discovery', '3- Planejamento', '4- Aguardando Capacidade',
      '5- Construção', '6- QA', '7- UAT', '8- Implantação', '9- Concluído'
    ];
    return statuses.map(s => {
      const initiatives = filtered.initiatives.filter(it => it.status === s);
      return {
        name: s.split('- ')[1] || s,
        total: initiatives.length,
        list: initiatives.map(it => it.title)
      };
    });
  };

  // --- Logic for Area Ranking ---
  const getAreaRanking = () => {
    const areas: Record<string, { total: number; name: string; list: string[] }> = {};
    filtered.initiatives.forEach(it => {
      const area = it.originDirectorate || 'Não Definida';
      if (!areas[area]) areas[area] = { name: area, total: 0, list: [] };
      areas[area].total++;
      areas[area].list.push(it.title);
    });
    return Object.values(areas).sort((a, b) => b.total - a.total);
  };

  // --- Logic for Manager Ranking ---
  const getManagerRanking = () => {
    const managers: Record<string, { total: number; name: string; photoUrl: string | null; list: string[] }> = {};
    filtered.initiatives
      .filter(it => it.status === '9- Concluído')
      .forEach(it => {
        const collab = data.collaborators.find(c => c.id === it.leaderId);
        const name = collab?.name || 'Desconhecido';
        if (!managers[name]) managers[name] = { total: 0, name, photoUrl: collab?.photoUrl || null, list: [] };
        managers[name].total++;
        managers[name].list.push(it.title);
      });
    return Object.values(managers).sort((a, b) => b.total - a.total).slice(0, 5);
  };

  // --- Logic for Systems Backlog ---
  const OPEN_STATUSES = ['1- Backlog','2- Discovery','3- Planejamento','4- Aguardando Capacidade','5- Construção','6- QA','7- UAT','8- Implantação'];
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




  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        {[
          { 
            label: 'Sistemas Suportados', 
            val: filtered.systems.length, 
            subtext: `${filtered.systems.filter(s => s.criticality === 'Tier 1').length} Tier 1 Críticos`,
            icon: Cpu, 
            color: '#FFD919' 
          },
          { 
            label: 'Colaboradores Ativos', 
            val: filtered.collaborators.length, 
            subtext: `${filtered.collaborators.filter(c => c.role === 'Engineer').length} Engenheiros`,
            icon: Users, 
            color: '#3B82F6' 
          },
          (() => {
            const delivered = filtered.initiatives.filter(it => it.status === '9- Concluído');
            const typeMap: Record<string, string> = { '1- Estratégico': 'Estratégico', '2- Projeto': 'Projeto', '3- Fast Track': 'Fast Track', '4- PBI': 'PBI' };
            const breakdown = Object.entries(typeMap)
              .map(([k, label]) => ({ label, val: delivered.filter(it => it.type === k).length }))
              .filter(b => b.val > 0);
            return {
              label: 'Iniciativas Entregues',
              val: delivered.length,
              subtext: 'Acumulado do ano',
              icon: CheckCircle2,
              color: '#10B981',
              breakdown
            };
          })(),
          (() => {
            const CLOSED = ['9- Concluído', 'Suspenso', 'Cancelado'];
            const openInits = filtered.initiatives.filter(it => !CLOSED.includes(it.status));
            const aguardando = filtered.initiatives.filter(it =>
              (it.status as string) === '4- Aguardando Capacidade' || (it.status as string) === 'Aguardando Capacidade'
            ).length;
            const typeMap: Record<string, string> = { '1- Estratégico': 'Estratégico', '2- Projeto': 'Projeto', '3- Fast Track': 'Fast Track', '4- PBI': 'PBI' };
            const breakdown = Object.entries(typeMap)
              .map(([k, label]) => ({ label, val: openInits.filter(it => it.type === k).length }))
              .filter(b => b.val > 0);
            return {
              label: 'Iniciativas em Aberto',
              val: openInits.length,
              subtext: `${aguardando} Aguardando capacidade`,
              icon: Layers,
              color: '#8B5CF6',
              breakdown
            };
          })()
        ].map((kpi, i) => (
          <div key={i} style={{ 
            background: 'var(--bg-card)',
            padding: '1.25rem', 
            borderRadius: '12px',
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.75rem',
            borderTop: `4px solid ${kpi.color}`,
            boxShadow: 'var(--shadow-md)',
          }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
        {/* Volume de Entregas 2026 Chart */}
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--shadow-md)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <TrendingUp size={18} /> Forecast de Entregas
          </h3>
          <div style={{ height: 280, marginLeft: '-15px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={getForecastData()} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradConcluido" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#059669" stopOpacity={1}/>
                  </linearGradient>
                  <linearGradient id="gradPlanejado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFD919" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={1}/>
                  </linearGradient>
                  <filter id="shadowDropdown" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                    <feOffset dx="0" dy="2" result="offsetblur" />
                    <feComponentTransfer>
                      <feFuncA type="linear" slope="0.2" />
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} dy={10} stroke="#94A3B8" />
                <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#94A3B8" />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  content={<CustomTooltip />}
                />
                <Bar dataKey="concluido" name="Concluído" stackId="a" fill="url(#gradConcluido)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="planejado" name="Planejado" stackId="a" fill="url(#gradPlanejado)" radius={[4, 4, 0, 0]} />
                
                {/* Invisible line to show totals consistently on top of stacked bars */}
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="none" 
                  dot={false} 
                  activeDot={false}
                  isAnimationActive={false}
                >
                  <LabelList 
                    dataKey="total" 
                    position="top" 
                    offset={10}
                    style={{ fill: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700 }} 
                    formatter={(val: any) => (Number(val) > 0 ? val : '')}
                  />
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funil de Iniciativas Chart */}
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--shadow-md)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Filter size={18} /> Funil de Iniciativas (Status)
          </h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getFunnelData()} layout="vertical" margin={{ left: 20, right: 40 }}>
                <defs>
                  <linearGradient id="gradBacklog" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8884d8" />
                    <stop offset="100%" stopColor="#6d69b3" />
                  </linearGradient>
                  <linearGradient id="gradDiscovery" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#82ca9d" />
                    <stop offset="100%" stopColor="#68a67d" />
                  </linearGradient>
                  <linearGradient id="gradPlanning" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ffc658" />
                    <stop offset="100%" stopColor="#e6af45" />
                  </linearGradient>
                  <linearGradient id="gradWaiting" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#94a3b8" />
                    <stop offset="100%" stopColor="#64748b" />
                  </linearGradient>
                  <linearGradient id="gradExecution" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ff8042" />
                    <stop offset="100%" stopColor="#e66a2e" />
                  </linearGradient>
                  <linearGradient id="gradQA" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                  <linearGradient id="gradUAT" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f472b6" />
                    <stop offset="100%" stopColor="#db2777" />
                  </linearGradient>
                  <linearGradient id="gradDeployment" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0088fe" />
                    <stop offset="100%" stopColor="#006ecb" />
                  </linearGradient>
                  <linearGradient id="gradConcluded" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#00C49F" />
                    <stop offset="100%" stopColor="#00a283" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" fontSize={11} hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  fontSize={11} 
                  width={100} 
                  tickLine={false} 
                  axisLine={false} 
                  stroke="#000000"
                  style={{ fontWeight: 600 }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  content={<FunnelTooltip />}
                />
                <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                  {getFunnelData().map((_, index) => {
                    const statusGradients = [
                      'url(#gradBacklog)', 'url(#gradDiscovery)', 'url(#gradPlanning)', 'url(#gradWaiting)',
                      'url(#gradExecution)', 'url(#gradQA)', 'url(#gradUAT)', 'url(#gradDeployment)', 'url(#gradConcluded)'
                    ];
                    return <Cell key={`cell-${index}`} fill={statusGradients[index % statusGradients.length]} />;
                  })}
                  <LabelList 
                    dataKey="total" 
                    position="right" 
                    offset={10} 
                    style={{ fill: '#000', fontSize: '0.8rem', fontWeight: 700 }} 
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {isDirector && (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
        {/* Middle Row Rankings */}
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.5rem' }}>Ranking de Entregas por Líder (Forecast)</h3>
          <div style={{ height: 260, flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getManagerRanking()} margin={{ bottom: 10, top: 40 }}>
                <defs>
                  <linearGradient id="gradManager" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#94A3B8" />
                    <stop offset="100%" stopColor="#1E293B" />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  height={80}
                  tick={<ManagerTick data={getManagerRanking()} />} 
                  axisLine={false} 
                  tickLine={false} 
                  interval={0} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  content={<ManagerTooltip />}
                />
                <Bar dataKey="total" fill="url(#gradManager)" radius={[6, 6, 0, 0]} barSize={50}>
                  <LabelList 
                    dataKey="total" 
                    position="top" 
                    offset={10} 
                    style={{ fill: '#000', fontSize: '1rem', fontWeight: 900 }} 
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {(() => { const areaData = getAreaRanking(); const areaH = Math.max(220, areaData.length * 36 + 40); return (
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--shadow-md)' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.5rem' }}>Distribuição por Área Cliente</h3>
          <div style={{ height: areaH }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaData} layout="vertical" margin={{ right: 40, left: 20 }}>
                <defs>
                  <linearGradient id="gradArea" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#A855F7" />
                    <stop offset="100%" stopColor="#6D28D9" />
                  </linearGradient>
                </defs>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" fontSize={11} width={160} tickLine={false} axisLine={false} stroke="#000000" style={{ fontWeight: 500 }} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} content={<AreaTooltip />} />
                <Bar dataKey="total" fill="url(#gradArea)" radius={[0, 6, 6, 0]} barSize={22}>
                  <LabelList dataKey="total" position="right" offset={12} style={{ fill: '#000', fontSize: '0.9rem', fontWeight: 800 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        ); })()}
      </div>
      )}

      {/* Backlog por Sistema */}
      {(() => { const sysData = getSystemsBacklogData(); if (sysData.length === 0) return null;
        const statusKeys = ['Backlog','Discovery','Planejamento','Aguardando Capacidade','Construção','QA','UAT','Implantação'];
        return (
        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--shadow-md)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Layers size={18} /> Backlog por Sistema
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>
            Iniciativas ativas (excluindo Concluídas, Canceladas e Suspensas) agrupadas por sistema impactado
          </p>
          <SystemsBacklogChart sysData={sysData} statusKeys={statusKeys} statusColors={STATUS_COLORS} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
            {statusKeys.map(key => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: STATUS_COLORS[key], flexShrink: 0 }} />
                {key}
              </div>
            ))}
          </div>
        </div>
        ); })()}
    </div>
  );
};

export default Dashboard;
