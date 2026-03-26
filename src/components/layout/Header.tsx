import React, { useState, useRef, useEffect } from 'react';
import { User as UserIcon, LogOut, Settings, ChevronDown, Building } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UserPreferencesModal from './UserPreferencesModal';
import CompanyInfoModal from './CompanyInfoModal';

const Header: React.FC = () => {
  const { user, currentCompany, currentDepartment, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isCompanyInfoOpen, setIsCompanyInfoOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const routeTitles: Record<string, string> = {
    '/': 'Executive Dashboard',
    '/organizacao': 'Organização e Desenvolvimento',
    '/inventario': 'Inventário de Sistemas',
    '/iniciativas': 'Iniciativas',
    '/roadmap': 'Roadmap',
    '/fornecedores': 'Fornecedores e Contratos',
    '/iniciativas/pendencias': 'Minhas Pendências',
  };

  let currentTitle = routeTitles[location.pathname] || '';
  
  // Handle detail pages
  if (!currentTitle) {
    if (location.pathname.startsWith('/inventario/')) currentTitle = 'Detalhes do Sistema';
    if (location.pathname.startsWith('/iniciativas/') && !location.pathname.includes('/pendencias')) {
      if (location.pathname.includes('/editar/') || location.pathname.includes('/nova')) {
        currentTitle = location.pathname.includes('/nova') ? 'Nova Iniciativa' : 'Editar Iniciativa';
      } else {
        currentTitle = 'Detalhes da Iniciativa';
      }
    }
  }

  return (
    <header className="top-header flex-between" style={{ padding: '0 1.5rem', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <h1 style={{ 
            fontSize: '1.4rem', 
            color: 'var(--text-primary)', 
            fontWeight: 800,
            margin: 0,
            letterSpacing: '-0.02em'
          }}>
            Oráculo
          </h1>
        </div>
      </div>

      <div style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center'
      }}>
        <h2 style={{ 
          fontSize: '1.6rem', 
          fontWeight: 800, 
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          margin: 0 
        }}>
          {currentTitle}
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {/* Company Logo - Clickable */}
        {currentCompany && (
          <div 
            onClick={() => {
              if ((user as any)?.isAdmin) setIsCompanyInfoOpen(true);
            }}
            style={{ 
              height: '36px', 
              display: 'flex', 
              alignItems: 'center', 
              padding: '6px 14px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              border: '1px solid var(--glass-border)',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.08)';
              e.currentTarget.style.borderColor = 'var(--accent-base)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
              e.currentTarget.style.borderColor = 'var(--glass-border)';
            }}
            title={`Organização: ${currentCompany.fantasyName}${!(user as any)?.isAdmin ? ' (Somente Leitura)' : ''}`}
          >
            {currentCompany.logo ? (
              <img 
                src={currentCompany.logo} 
                alt={currentCompany.fantasyName} 
                style={{ height: '18px', maxWidth: '80px', objectFit: 'contain' }} 
              />
            ) : (
              <Building size={18} color="var(--accent-base)" />
            )}
          </div>
        )}
        {/* Department Info */}
        {currentDepartment && (
          <div style={{ 
            fontSize: '0.8rem', 
            fontWeight: 700, 
            color: 'var(--text-secondary)',
            padding: '6px 14px',
            background: 'white',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            display: 'flex',
            alignItems: 'center'
          }}>
            {currentDepartment.name}
          </div>
        )}

        {/* Profile Section */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <div 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              cursor: 'pointer',
              padding: '4px',
              borderRadius: 'var(--radius-full)',
              transition: 'background 0.2s',
              background: isMenuOpen ? 'rgba(0,0,0,0.05)' : 'transparent'
            }}
          >
            <div style={{ 
              width: 36, 
              height: 36, 
              borderRadius: 'var(--radius-full)', 
              overflow: 'hidden', 
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#F1F5F9'
            }}>
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <UserIcon size={20} color="var(--text-tertiary)" />
              )}
            </div>
            <ChevronDown size={14} color="var(--text-tertiary)" style={{ transform: isMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>

          {/* Floating Dropdown Menu */}
          {isMenuOpen && (
            <div style={{
              position: 'absolute',
              top: '120%',
              right: 0,
              width: '240px',
              background: 'white',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              border: '1px solid var(--glass-border)',
              overflow: 'hidden',
              zIndex: 1000
            }}>
              <div style={{ padding: '1.25rem', background: '#F8FAFC', borderBottom: '1px solid var(--glass-border)' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.1rem' }}>
                  {(user as any)?.fullName || (user as any)?.name || 'Usuário'}
                </p>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  {user?.role === 'Director' ? 'Administrador' : user?.role || 'Usuário'}
                </p>
              </div>
              
              <div style={{ padding: '0.5rem' }}>
                <button 
                  className="dropdown-item" 
                  onClick={() => {
                    setIsPreferencesOpen(true);
                    setIsMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'left',
                    transition: 'background 0.2s'
                  }}
                >
                  <Settings size={16} />
                  <span>Preferências</span>
                </button>
                
                <div style={{ height: '1px', background: 'var(--glass-border)', margin: '0.5rem 0' }}></div>
                
                <button 
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--status-red)',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'left',
                    transition: 'background 0.2s'
                  }}
                >
                  <LogOut size={16} />
                  <span>Logoff</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
      {isPreferencesOpen && (
        <UserPreferencesModal onClose={() => setIsPreferencesOpen(false)} />
      )}
      {isCompanyInfoOpen && (
        <CompanyInfoModal onClose={() => setIsCompanyInfoOpen(false)} />
      )}
    </header>
  );
};

export default Header;
