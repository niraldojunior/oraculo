import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { mockInitiatives } from '../data/mockDb';
import type { Initiative } from '../types';

const PendingInitiatives: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [pending, setPending] = React.useState<Initiative[]>([]);

  React.useEffect(() => {
    const saved = localStorage.getItem('oraculo_initiatives_v1');
    const localInits = saved ? JSON.parse(saved) as Initiative[] : [];
    
    // Merge: local initiatives take precedence over mock ones with same ID
    const list = [...localInits];
    mockInitiatives.forEach(mock => {
      if (!list.some(it => it.id === mock.id)) {
        list.push(mock);
      }
    });
    
    // Filter initiatives where current user role is responsible
    const relevant = list.filter(item => {
      if (item.status === '1- Em Avaliação' && user?.role === 'Director') return true;
      if (item.status === '2- Em Backlog' && (user?.role === 'Manager' || user?.role === 'Director')) return true;
      if (item.status === '3- Em Planejamento' && (user?.role === 'Lead Engineer' || user?.role === 'Manager')) return true;
      return false;
    });
    setPending(relevant);
  }, [user]);

  return (
    <div className="page-layout">
      <div style={{ marginBottom: '2rem' }}>
        <p className="text-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={16} className="text-secondary" /> Iniciativas que aguardam sua ação ou aprovação
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {pending.length > 0 ? (
          pending.map(item => (
            <div key={item.id} className="glass-panel-interactive" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ marginBottom: '0.25rem' }}>{item.title}</h3>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                  <span className="badge" style={{ background: 'var(--glass-light)' }}>{item.status}</span>
                  <span className="text-tertiary">Tipo: {item.type}</span>
                </div>
              </div>
              <button 
                className="btn" 
                onClick={() => navigate(`/iniciativas/editar/${item.id}`)}
                style={{ 
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', 
                  color: 'white', 
                  border: 'none',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
                }}
              >
                Avançar <ArrowRight size={16} />
              </button>
            </div>
          ))
        ) : (
          <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            Não há pendências registradas para o seu perfil no momento.
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingInitiatives;
