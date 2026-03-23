import React from 'react';
import { Bell, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

import { mockInitiatives } from '../../data/mockDb';
import type { Initiative } from '../../types';

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [initiatives, setInitiatives] = React.useState<Initiative[]>([]);

  React.useEffect(() => {
    const saved = localStorage.getItem('oraculo_initiatives_v1');
    const localInits = saved ? JSON.parse(saved) : [];
    
    const merged = [...localInits];
    mockInitiatives.forEach(mock => {
      if (!merged.some(it => it.id === mock.id)) {
        merged.push(mock as any);
      }
    });
    setInitiatives(merged);
  }, []);

  const hasPendency = React.useMemo(() => {
    if (!user) return false;
    
    if (user.role === 'Director') {
      return initiatives.some(it => it.status === '1- Em Avaliação');
    }
    if (user.role === 'Manager') {
      return initiatives.some(it => it.status === '2- Em Backlog');
    }
    if (user.role === 'Lead Engineer') {
      return initiatives.some(it => it.status === '3- Em Planejamento');
    }
    return false;
  }, [user, initiatives]);
  return (
    <div style={{ position: 'relative', cursor: 'pointer' }}>
      <Bell size={20} color="#94A3B8" />
      {hasPendency && (
        <span style={{ 
          position: 'absolute', 
          top: -2, 
          right: -2, 
          width: 8, 
          height: 8, 
          borderRadius: '50%', 
          background: 'var(--accent-base)', 
          border: '1.5px solid var(--bg-header-dark)',
          boxShadow: '0 0 10px var(--accent-base)'
        }}></span>
      )}
    </div>
  );
};

const Header: React.FC = () => {
  const { user, switchUser } = useAuth();

  return (
    <header className="top-header flex-between">
      <div />

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {/* Role Switcher for Testing */}
        <div className="glass-panel" style={{ 
          padding: '0.4rem 1rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.6rem', 
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 'var(--radius-full)'
        }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Simular:</span>
          <select 
            value={user?.role || 'Director'} 
            onChange={(e) => switchUser(e.target.value as any)}
            style={{ background: 'transparent', border: 'none', color: '#FFFFFF', fontSize: '0.8rem', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
          >
            <option value="Director" style={{ background: '#000', color: '#fff' }}>Diretor</option>
            <option value="Manager" style={{ background: '#000', color: '#fff' }}>Gerente</option>
            <option value="Lead Engineer" style={{ background: '#000', color: '#fff' }}>Líder Técnico</option>
            <option value="Engineer/Analyst" style={{ background: '#000', color: '#fff' }}>Engenheiro</option>
          </select>
        </div>

        {/* Notification Bell Removed */}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '-3px' }}>{user?.name || 'Niraldo Rocha Granado Junior'}</p>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
              {user?.role === 'Director' ? 'ADMIN' : user?.role === 'Manager' ? 'GERENTE' : user?.role === 'Lead Engineer' ? 'ESPECIALISTA' : 'USUÁRIO'}
            </p>
          </div>
          <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-full)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            {user?.photoUrl ? (
              <img src={user.photoUrl} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={16} color="#94A3B8" />
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;
