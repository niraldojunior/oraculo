import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useView } from '../context/ViewContext';
import { 
  Cpu, 
  Users, 
  Briefcase, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Filter, 
  Gift, 
  Plane
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
import { format, addDays, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Initiative, Collaborator, System, Contract, Team, Vendor } from '../types';

const oldToNewMap: Record<string, string> = {
  '1- Em Avaliação': '2- Discovery',
  '1- Avaliação': '2- Discovery',
  '2- Em Backlog': '1- Backlog',
  '2- Backlog': '1- Backlog',
  '3- Em Planejamento': '3- Planejamento',
  '3- Discovery': '2- Discovery',
  '4- Em Execução': '4- Execução',
  '4- Planejamento': '3- Planejamento',
  '5- Entregue': '6- Concluído',
  '5- Execução': '4- Execução',
  '5- Concluído': '6- Concluído',
  '6- Concluído': '6- Concluído'
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
             <img src={entry.photoUrl} alt={entry.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #E2E8F0' }} />
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

const Dashboard: React.FC = () => {
  const { currentCompany, currentDepartment } = useAuth();
  
  const [data, setData] = React.useState<{
    systems: System[];
    collaborators: Collaborator[];
    initiatives: Initiative[];
    contracts: Contract[];
    teams: Team[];
    vendors: Vendor[];
  }>({
    systems: [],
    collaborators: [],
    initiatives: [],
    contracts: [],
    teams: [],
    vendors: []
  });
  const { selectedManagerId } = useView();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!currentCompany) {
      setData({ systems: [], collaborators: [], initiatives: [], contracts: [], teams: [], vendors: [] });
      setLoading(true);
      return;
    }

    const params = new URLSearchParams();
    if (currentCompany) params.append('companyId', currentCompany.id);
    if (currentDepartment) params.append('departmentId', currentDepartment.id);
    const query = params.toString() ? `?${params.toString()}` : '';

    const fetchData = async () => {
      try {
        const [sys, collabs, inits, contracts, teams, vendors] = await Promise.all([
          fetch(`/api/systems${query}`).then(res => res.json()),
          fetch(`/api/collaborators${query}`).then(res => res.json()),
          fetch(`/api/initiatives${query}`).then(res => res.json()),
          fetch(`/api/contracts${query}`).then(res => res.json()),
          fetch(`/api/teams${query}`).then(res => res.json()),
          fetch(`/api/vendors${query}`).then(res => res.json())
        ]);
        
        const normalizedInits = (Array.isArray(inits) ? inits : []).map(it => ({
          ...it,
          status: oldToNewMap[it.status] || it.status
        }));
        
        setData({
          systems: Array.isArray(sys) ? sys : [],
          collaborators: Array.isArray(collabs) ? collabs : [],
          initiatives: normalizedInits,
          contracts: Array.isArray(contracts) ? contracts : [],
          teams: Array.isArray(teams) ? teams : [],
          vendors: Array.isArray(vendors) ? vendors : []
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

    const hContracts = data.contracts.filter(c => {
      const vendor = data.vendors.find(v => v.id === c.vendorId);
      return vendor && (
        (vendor.managerId && hierarchy.leaderIds.includes(vendor.managerId)) ||
        (vendor.directorId && hierarchy.leaderIds.includes(vendor.directorId))
      );
    });

    return {
      ...data,
      initiatives: hInits,
      collaborators: hCollabs,
      systems: hSystems,
      contracts: hContracts
    };
  }, [data, hierarchy]);

  if (loading) return (
    <div className="spinner-container">
      <div className="spinner"></div>
      <span>Carregando ecossistema...</span>
    </div>
  );

  // --- Logic for Metrics ---
  const deliveredCount = filtered.initiatives.filter(it => it.status === '6- Concluído').length;
  const activeContractsCount = filtered.contracts.filter(c => new Date(c.endDate) >= new Date()).length;

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
      const dateStr = it.endDate || it.businessExpectationDate;
      if (!dateStr) return;
      
      try {
        const date = parseISO(dateStr);
        if (date.getFullYear() !== new Date().getFullYear()) return;
        
        // Month key in Portuguese ('Jan', 'Fev', etc.)
        const monthKey = format(date, 'MMM', { locale: ptBR }).replace('.', '');
        // Normalize monthKey to match our monthsList (case and dots)
        const normalizedKey = monthsList.find(m => m.toLowerCase() === monthKey.toLowerCase()) || monthKey;

        if (monthsData[normalizedKey]) {
          if (it.status === '6- Concluído') {
            monthsData[normalizedKey].concluido++;
            monthsData[normalizedKey].listConcluido.push(it.title);
          } else if (['3- Planejamento', '4- Execução', '5- Implantação'].includes(it.status)) {
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
      '1- Backlog', '2- Discovery', '3- Planejamento', 
      '4- Execução', '5- Implantação', '6- Concluído'
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
      if (!areas[area]) {
        areas[area] = { name: area, total: 0, list: [] };
      }
      areas[area].total++;
      areas[area].list.push(it.title);
    });
    return Object.values(areas)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  };

  // --- Logic for Manager Ranking ---
  const getManagerRanking = () => {
    const managers: Record<string, { total: number; name: string; photoUrl: string | null; list: string[] }> = {};
    filtered.initiatives
      .filter(it => it.status === '6- Concluído')
      .forEach(it => {
        const collab = data.collaborators.find(c => c.id === it.leaderId);
        const name = collab?.name || 'Desconhecido';
        if (!managers[name]) {
          managers[name] = { 
            total: 0, 
            name, 
            photoUrl: collab?.photoUrl || null,
            list: []
          };
        }
        managers[name].total++;
        managers[name].list.push(it.title);
      });
    return Object.values(managers)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  };

  // --- Logic for Alerts ---
  const now = new Date();
  const next60Days = addDays(now, 60);
  const next30Days = addDays(now, 30);

  const vacationAlerts = filtered.collaborators.filter(c => {
    if (!c.vacationStart) return false;
    try {
      const start = parseISO(c.vacationStart);
      return isWithinInterval(start, { start: now, end: next60Days });
    } catch (e) { return false; }
  });

  const birthdayAlerts = filtered.collaborators.filter(c => {
    if (!c.birthday) return false; // format: MM-DD
    try {
      const [month, day] = c.birthday.split('-').map(Number);
      const birthdayDate = new Date(now.getFullYear(), month - 1, day);
      if (birthdayDate < now) birthdayDate.setFullYear(now.getFullYear() + 1);
      return isWithinInterval(birthdayDate, { start: now, end: next30Days });
    } catch (e) { return false; }
  });

  const contractAlerts = filtered.contracts.filter(c => {
    try {
      const end = new Date(c.endDate);
      return end < now || isWithinInterval(end, { start: now, end: addDays(now, 90) });
    } catch (e) { return false; }
  });




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
          { 
            label: 'Iniciativas Entregues', 
            val: deliveredCount, 
            subtext: 'Acumulado do ano',
            icon: CheckCircle2, 
            color: '#10B981' 
          },
          { 
            label: 'Contratos Vigentes', 
            val: activeContractsCount, 
            subtext: `${contractAlerts.length} Próximos do vencimento`,
            icon: Briefcase, 
            color: '#8B5CF6' 
          }
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
                  <linearGradient id="gradExecution" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ff8042" />
                    <stop offset="100%" stopColor="#e66a2e" />
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
                      'url(#gradBacklog)', 'url(#gradDiscovery)', 'url(#gradPlanning)', 
                      'url(#gradExecution)', 'url(#gradDeployment)', 'url(#gradConcluded)'
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

        <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', boxShadow: 'var(--shadow-md)' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.5rem' }}>Distribuição por Área</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getAreaRanking()} layout="vertical" margin={{ right: 40, left: 20 }}>
                <defs>
                  <linearGradient id="gradArea" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#A855F7" />
                    <stop offset="100%" stopColor="#6D28D9" />
                  </linearGradient>
                </defs>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  fontSize={12} 
                  width={160} 
                  tickLine={false} 
                  axisLine={false} 
                  stroke="#000000" 
                  style={{ fontWeight: 500 }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  content={<AreaTooltip />} 
                />
                <Bar dataKey="total" fill="url(#gradArea)" radius={[0, 6, 6, 0]} barSize={24}>
                  <LabelList 
                    dataKey="total" 
                    position="right" 
                    offset={12} 
                    style={{ fill: '#000', fontSize: '0.9rem', fontWeight: 800 }} 
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Alerts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Férias */}
        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '12px', boxShadow: 'var(--shadow-md)' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plane size={16} /> Férias (60 dias)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {vacationAlerts.length > 0 ? vacationAlerts.map((c, i) => (
              <div key={i} style={{ 
                padding: '0.75rem', 
                background: 'rgba(59, 130, 246, 0.05)', 
                border: '1px solid rgba(59, 130, 246, 0.15)', 
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{c.name}</span>
                <span style={{ fontSize: '0.75rem', color: '#3B82F6', fontWeight: 700 }}>{format(parseISO(c.vacationStart!), 'dd/MM')}</span>
              </div>
            )) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>Nenhum alerta</p>
            )}
          </div>
        </div>

        {/* Aniversários */}
        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '12px', boxShadow: 'var(--shadow-md)' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Gift size={16} /> Aniversários (30 dias)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {birthdayAlerts.length > 0 ? birthdayAlerts.map((c, i) => (
              <div key={i} style={{ 
                padding: '0.75rem', 
                background: 'rgba(16, 185, 129, 0.05)', 
                border: '1px solid rgba(16, 185, 129, 0.15)', 
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{c.name}</span>
                <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>{c.birthday?.split('-').reverse().join('/')}</span>
              </div>
            )) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>Nenhum alerta</p>
            )}
          </div>
        </div>

        {/* Contratos Críticos */}
        <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '12px', boxShadow: 'var(--shadow-md)' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={16} /> Contratos Críticos
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {contractAlerts.length > 0 ? contractAlerts.map((c, i) => {
              const isExpired = new Date(c.endDate) < now;
              return (
                <div key={i} style={{ 
                  padding: '0.75rem', 
                  background: isExpired ? 'rgba(239, 68, 68, 0.05)' : 'rgba(245, 158, 11, 0.05)', 
                  border: isExpired ? '1px solid rgba(239, 68, 68, 0.15)' : '1px solid rgba(245, 158, 11, 0.15)', 
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>C/N: {c.number}</span>
                    <span style={{ fontSize: '0.65rem' }}>{isExpired ? 'Vencido' : 'Expira em breve'}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isExpired ? '#EF4444' : '#F59E0B' }}>
                    {format(new Date(c.endDate), 'dd/MM/yy')}
                  </span>
                </div>
              );
            }) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>Nenhum alerta</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
