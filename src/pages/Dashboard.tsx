import React from 'react';
import { useAuth } from '../context/AuthContext';

import { Activity, ShieldAlert, Cpu, Building, AlertTriangle, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Format currency
const formatCurrency = (value: number) => {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  return `R$ ${(value / 1000).toFixed(1)}k`;
};

// Generate some mock history data for the chart
const historyData = [
  { name: 'Set', incidents: 40 },
  { name: 'Out', incidents: 30 },
  { name: 'Nov', incidents: 20 },
  { name: 'Dez', incidents: 27 },
  { name: 'Jan', incidents: 18 },
  { name: 'Fev', incidents: 23 },
  { name: 'Mar', incidents: 14 },
];

import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, isAdmin, currentCompany, currentDepartment } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAdmin) {
      navigate('/admin');
    }
  }, [isAdmin, navigate]);
  
  const [systems, setSystems] = React.useState<any[]>([]);
  const [initiatives, setInitiatives] = React.useState<any[]>([]);
  const [contracts, setContracts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (isAdmin) return;
    
    const params = new URLSearchParams();
    if (currentCompany) params.append('companyId', currentCompany.id);
    if (currentDepartment) params.append('departmentId', currentDepartment.id);
    const query = params.toString() ? `?${params.toString()}` : '';

    Promise.all([
      fetch(`/api/systems${query}`).then(res => res.json()),
      fetch(`/api/initiatives${query}`).then(res => res.json()),
      fetch(`/api/contracts${query}`).then(res => res.json())
    ]).then(([sysData, initData, contractData]) => {
      setSystems(Array.isArray(sysData) ? sysData : []);
      setInitiatives(Array.isArray(initData) ? initData : []);
      setContracts(Array.isArray(contractData) ? contractData : []);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to fetch data', err);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="spinner-container">
      <div className="spinner"></div>
      <span>Carregando Dashboard...</span>
    </div>
  );

  const totalSystems = systems.length;
  const criticalSystems = systems.filter(s => s.criticality === 'Tier 1');
  const activeRoadmaps = initiatives.filter(i => (i as any).healthStatus !== 'Red').length;
  const legacySystems = systems.filter(s => s.lifecycleStatus === 'Legacy').length;
  const tco = contracts.reduce((sum, c) => sum + (c.annualCost || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="flex-between">
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.2rem' }}>
            Bem-vindo, <strong>{(user as any)?.fullName || (user as any)?.name || 'Niraldo'}</strong>. Visão geral em tempo real do ecossistema.
          </p>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.6rem', 
          background: 'rgba(0,0,0,0.05)', 
          padding: '0.6rem 1rem', 
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          border: '1px solid var(--glass-border)'
        }}>
          <Calendar size={14} />
          <span>Ãšltimo log: {new Date().toLocaleDateString('pt-BR')}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '3px solid var(--accent-base)' }}>
          <div className="flex-between">
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Ativos & Sistemas</h3>
            <Cpu size={20} className="text-tertiary" />
          </div>
          <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>{totalSystems}</h2>
          <div style={{ fontSize: '0.875rem', color: 'var(--status-amber)' }}>{criticalSystems.length} Tier 1 Críticos</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '3px solid var(--status-green)' }}>
          <div className="flex-between">
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Iniciativas (Roadmap)</h3>
            <Activity size={20} className="text-tertiary" />
          </div>
          <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>{activeRoadmaps}</h2>
          <div style={{ fontSize: '0.875rem', color: 'var(--status-green)' }}>100% On-Track (Green)</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '3px solid var(--status-red)' }}>
          <div className="flex-between">
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Débito Técnico</h3>
            <ShieldAlert size={20} className="text-tertiary" />
          </div>
          <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0', color: 'var(--status-red)' }}>{legacySystems}</h2>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Sistemas categorizados como Legacy</div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '3px solid var(--status-purple)' }}>
          <div className="flex-between">
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>TCO Atual</h3>
            <Building size={20} className="text-tertiary" />
          </div>
          <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>{formatCurrency(tco)}</h2>
          <div style={{ fontSize: '0.875rem', color: 'var(--status-red)' }}>1 Vencimento a {'<'} 90 dias</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} /> Incidentes N3 (Volume/Mês)
          </h3>
          <div style={{ height: 250, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--status-red)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--status-red)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--glass-border-strong)', borderRadius: 'var(--radius-sm)' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Area type="monotone" dataKey="incidents" stroke="var(--status-red)" strokeWidth={2} fillOpacity={1} fill="url(#colorIncidents)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} color="var(--status-amber)" /> Atenção Requerida
          </h3>
          
          <div style={{ padding: '1rem', background: 'hsla(0, 80%, 60%, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid hsla(0, 80%, 60%, 0.3)' }}>
            <strong style={{ color: 'var(--status-red)' }}>Overbooking de Capacidade:</strong>
            <p className="text-secondary" style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              O engenheiro <strong>Juliana Torres</strong> possui 130% de alocação no período Q2 de 2026, conflitando com Sustentação BAU.
            </p>
          </div>
          
          <div style={{ padding: '1rem', background: 'hsla(40, 90%, 55%, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid hsla(40, 90%, 55%, 0.3)' }}>
            <strong style={{ color: 'var(--status-amber)' }}>Risco de Vendor Lock-in:</strong>
            <p className="text-secondary" style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              A licença SaaS de Amazon Web Services vence em 71 dias. Necessário notificar suprimentos para renovação.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

