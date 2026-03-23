import React from 'react';
import { User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';




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
