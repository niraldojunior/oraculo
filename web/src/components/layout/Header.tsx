import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { Collaborator } from '../../types';
import { useView } from '@/context/ViewContext';
import LeaderFilter from '@/components/common/LeaderFilter';
import ViewMenu from '@/components/common/ViewMenu';
import { findSectionByPath, findViewByPath } from '@/config/navigation';
import { ViewToolbar } from './HeaderControls';

const Header: React.FC = () => {
  const { user, currentCompany, currentDepartment } = useAuth();
  const location = useLocation();

  const {
    selectedManagerId,
    setSelectedManagerId,
    headerContent,
    headerLeftActions,
    headerActions,
  } = useView();

  const [leaders, setLeaders] = useState<Collaborator[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const section = findSectionByPath(location.pathname);
  const currentView = findViewByPath(location.pathname);
  const isDashboard = location.pathname === '/';
  const isInitiativeDetail = /\/iniciativas\/.+/.test(location.pathname) && !currentView;
  const leaderFilterMode = isDashboard ? 'user' : currentView?.leaderFilter ?? false;
  // Visões com `toolbarPlacement: 'subheader'` (D14) delegam as ações ao SubHeader.
  const toolbar = currentView?.toolbarPlacement === 'subheader' ? {} : currentView?.toolbar ?? {};

  useEffect(() => {
    if (!leaderFilterMode) return;
    if (!currentCompany) {
      setLeaders([]);
      return;
    }

    const fetchLeaders = async () => {
      try {
        const params = new URLSearchParams();
        params.append('companyId', currentCompany.id);
        if (currentDepartment) params.append('departmentId', currentDepartment.id);

        const res = await fetch(`/api/collaborators?${params.toString()}`, { cache: 'no-store' });
        if (res.ok) {
          const data: Collaborator[] = await res.json();
          const filtered = data
            .filter(c => ['Director', 'Head', 'Manager', 'Master'].includes(c.role))
            .sort((a, b) => {
              const order: Record<string, number> = { Head: 0, Director: 1, Manager: 2, Master: 3 };
              const oa = order[a.role] ?? 4;
              const ob = order[b.role] ?? 4;
              if (oa !== ob) return oa - ob;
              return a.name.localeCompare(b.name);
            });
          setLeaders(filtered);
        }
      } catch (e) {
        console.error('Error fetching leaders for header:', e);
      }
    };
    fetchLeaders();
  }, [leaderFilterMode, currentCompany, currentDepartment]);

  // Pre-select the correct manager whenever the logged-in user changes
  const prevUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user || leaders.length === 0) return;
    if (prevUserIdRef.current === user.id) return;
    prevUserIdRef.current = user.id;

    const isLeader = leaders.some(l => l.id === user.id);
    if (isLeader) {
      setSelectedManagerId(user.id);
      return;
    }

    // Not a leader — find their direct team leader
    if (user.squadId) {
      const params = new URLSearchParams();
      if (currentCompany) params.append('companyId', currentCompany.id);
      fetch(`/api/teams?${params.toString()}`, { cache: 'no-store' })
        .then(r => (r.ok ? r.json() : []))
        .then((teams: { id: string; leaderId: string | null }[]) => {
          const userTeam = teams.find(t => t.id === user.squadId);
          if (userTeam?.leaderId && leaders.some(l => l.id === userTeam.leaderId)) {
            setSelectedManagerId(userTeam.leaderId);
          } else {
            setSelectedManagerId('all');
          }
        })
        .catch(() => setSelectedManagerId('all'));
    } else {
      setSelectedManagerId('all');
    }
  }, [user, leaders, currentCompany, setSelectedManagerId]);

  const currentTitle = isDashboard
    ? 'Executive Dashboard'
    : isInitiativeDetail
      ? 'Editar Iniciativa'
      : section?.label ?? '';

  const headerContentSlot = isInitiativeDetail
    ? 'detail'
    : currentView?.headerContentSlot ?? 'center';

  return (
    <header className="top-header flex-between">
      <div className="header-left">
        {/* Alocação injeta seus próprios filtros à esquerda; detalhe de iniciativa ocupa a faixa toda */}
        {headerContent && headerContentSlot === 'left' && (
          <div style={{ marginRight: '1rem' }}>{headerContent}</div>
        )}
        {headerContent && headerContentSlot === 'detail' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>{headerContent}</div>
        )}

        {isDashboard && headerLeftActions}

        {section && currentView && (
          <ViewMenu section={section} currentView={currentView} isMobile={isMobile} />
        )}

        {/* Ações e seletor de gestor ancorados à direita da faixa */}
        <div className="header-right">
          {(isDashboard || currentView) && (
            <div className="header-actions">
              {isDashboard ? (
                headerActions
              ) : (
                <>
                  {headerActions}
                  <ViewToolbar
                    toolbar={toolbar}
                    isMobile={isMobile}
                    isSearchOpen={isSearchOpen}
                    setIsSearchOpen={setIsSearchOpen}
                  />
                </>
              )}
            </div>
          )}

          {leaderFilterMode && (
            <LeaderFilter
              mode={leaderFilterMode}
              leaders={leaders}
              selectedManagerId={selectedManagerId}
              onChange={setSelectedManagerId}
              fallbackUser={user ? { name: user.name, photoUrl: user.photoUrl } : null}
              compact
              align="right"
            />
          )}
        </div>
      </div>

      <div
        className="header-center"
        style={{
          opacity: isMobile && isSearchOpen ? 0 : 1,
          pointerEvents: isMobile && isSearchOpen ? 'none' : 'auto',
        }}
      >
        {headerContent && headerContentSlot === 'center' ? (
          headerContent
        ) : !headerContent && !isMobile ? (
          <h2 className="header-title">{currentTitle}</h2>
        ) : null}
      </div>
    </header>
  );
};

export default Header;
