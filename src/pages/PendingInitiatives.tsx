import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Initiative } from '../types';

const PendingInitiatives: React.FC = () => {
  const navigate = useNavigate();
  const { user, currentCompany, currentDepartment } = useAuth();
  
  const [pending, setPending] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (currentCompany) params.append('companyId', currentCompany.id);
    if (currentDepartment) params.append('departmentId', currentDepartment.id);
    const query = params.toString() ? `?${params.toString()}` : '';

    fetch(`/api/initiatives${query}`)
      .then(res => res.json())
      .then((list: Initiative[]) => {
        if (!Array.isArray(list)) list = [];
        
        // Filter initiatives where current user role is responsible
        const relevant = list.filter(item => {
          if (item.status === '1- Em Avaliação' && user?.role === 'Director') return true;
          if (item.status === '2- Em Backlog' && (user?.role === 'Manager' || user?.role === 'Director')) return true;
          if (item.status === '3- Em Planejamento' && (user?.role === 'Lead Engineer' || user?.role === 'Manager')) return true;
          return false;
        });
        setPending(relevant);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch pending initiatives:', err);
        setLoading(false);
      });
  }, [user, currentCompany, currentDepartment]);

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '50vh' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

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
