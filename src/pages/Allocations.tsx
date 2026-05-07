import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronDown, Calendar } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useView } from '../context/ViewContext';
import type { Collaborator, Initiative, Team } from '../types';
import { StatusIcon } from '../components/common/StatusIcon';

type Dimension = 'Ano' | 'Trimestre' | 'Mês' | 'Semana';

const STATUS_COLOR: Record<string, string> = {
  '1- Backlog': '#94A3B8',
  '2- Discovery': '#82CA9D',
  '3- Planejamento': '#FBBF24',
  '4- Aguardando Capacidade': '#64748B',
  '5- Construção': '#FB923C',
  '6- QA': '#A78BFA',
  '7- UAT': '#F472B6',
  '8- Implantação': '#0EA5E9',
  '9- Concluído': '#10B981',
  'Suspenso': '#F59E0B',
  'Cancelado': '#EF4444',
};

const Allocations: React.FC = () => {
  const navigate = useNavigate();
  const { currentCompany, currentDepartment } = useAuth();
  const { setHeaderContent } = useView();

  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const [dimension, setDimension] = useState<Dimension>('Mês');
  const [managerFilter, setManagerFilter] = useState<string>('Todos');
  const [isManagerMenuOpen, setIsManagerMenuOpen] = useState(false);
  const [isDimMenuOpen, setIsDimMenuOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const [timelineViewportWidth, setTimelineViewportWidth] = useState(960);

  // Hide page-level header content (this page renders its own controls)
  useEffect(() => {
    setHeaderContent(null);
    return () => setHeaderContent(null);
  }, [setHeaderContent]);

  // Fetch data
  useEffect(() => {
    if (!currentCompany) {
      setInitiatives([]);
      setCollaborators([]);
      setTeams([]);
      setLoading(true);
      return;
    }

    const params = new URLSearchParams();
    params.append('companyId', currentCompany.id);
    if (currentDepartment) params.append('departmentId', currentDepartment.id);
    const query = `?${params.toString()}`;

    const collabParams = new URLSearchParams();
    collabParams.append('companyId', currentCompany.id);
    const collabQuery = `?${collabParams.toString()}`;

    Promise.all([
      fetch(`/api/initiatives${query}`).then(r => r.json()),
      fetch(`/api/collaborators${collabQuery}`).then(r => r.json()),
      fetch(`/api/teams${query}`).then(r => r.json()),
    ])
      .then(([initData, collabsData, teamsData]) => {
        setInitiatives(Array.isArray(initData) ? initData : []);
        setCollaborators(Array.isArray(collabsData) ? collabsData : []);
        setTeams(Array.isArray(teamsData) ? teamsData : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch allocations data:', err);
        setInitiatives([]);
        setCollaborators([]);
        setTeams([]);
        setLoading(false);
      });
  }, [currentCompany, currentDepartment]);

  // Sync vertical scroll between left column and timeline
  useEffect(() => {
    const left = leftColRef.current;
    const right = scrollRef.current;
    if (!left || !right) return;
    const onRightScroll = () => { left.scrollTop = right.scrollTop; };
    right.addEventListener('scroll', onRightScroll);
    return () => right.removeEventListener('scroll', onRightScroll);
  }, []);

  useEffect(() => {
    const timeline = scrollRef.current;
    if (!timeline) return;
    const updateWidth = () => {
      if (timeline.clientWidth > 0) setTimelineViewportWidth(timeline.clientWidth);
    };
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(timeline);
    return () => ro.disconnect();
  }, []);

  // Helpers for manager-based filtering (mirrors CapacityView)
  const getAllTeamIdsUnderLeader = (leaderId: string): string[] => {
    const directTeams = teams.filter(t => t.leaderId === leaderId);
    const allTeamIds: string[] = [];
    const addChildren = (parentId: string) => {
      const childTeams = teams.filter(t => t.parentTeamId === parentId);
      for (const child of childTeams) {
        if (!allTeamIds.includes(child.id)) {
          allTeamIds.push(child.id);
          addChildren(child.id);
        }
      }
    };
    for (const team of directTeams) {
      allTeamIds.push(team.id);
      addChildren(team.id);
    }
    return allTeamIds;
  };

  const roleOrder: Record<string, number> = {
    'Director': 1, 'Head': 1, 'Manager': 2, 'Lead Engineer': 3, 'Analyst': 4, 'Engineer': 5, 'QA': 6
  };
  const sortByRole = (list: Collaborator[]) =>
    [...list].sort((a, b) => (roleOrder[a.role] ?? 99) - (roleOrder[b.role] ?? 99));

  const filteredCollabs = useMemo(() => {
    if (managerFilter === 'Todos') return sortByRole(collaborators);
    const selected = collaborators.find(c => c.id === managerFilter);
    const allTeamIds = getAllTeamIdsUnderLeader(managerFilter);
    const inOrg = collaborators.filter(c => c.squadId && allTeamIds.includes(c.squadId));
    if (selected?.role === 'Director') {
      return sortByRole(inOrg.filter(c => c.role === 'Director' || c.role === 'Manager'));
    }
    return sortByRole(inOrg);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managerFilter, collaborators, teams]);

  // Build allocation map: collaboratorId -> Initiative[]
  const allocationsByCollab = useMemo(() => {
    const map = new Map<string, Initiative[]>();
    initiatives.forEach(it => {
      if (it.status === 'Cancelado') return;
      const ids = new Set<string>([
        ...(it.memberIds || []).filter((x): x is string => !!x),
      ]);
      ids.forEach(cid => {
        if (!map.has(cid)) map.set(cid, []);
        map.get(cid)!.push(it);
      });
    });
    return map;
  }, [initiatives]);

  // Timeline range
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(today);
  if (dimension === 'Semana') startDate.setDate(today.getDate() - 14);
  else if (dimension === 'Mês') startDate.setMonth(today.getMonth() - 1);
  else if (dimension === 'Trimestre') startDate.setMonth(today.getMonth() - 3);
  else startDate.setMonth(today.getMonth() - 12);
  startDate.setDate(1);

  const endDate = new Date(startDate);
  if (dimension === 'Semana') endDate.setDate(startDate.getDate() + 42);
  else if (dimension === 'Mês') endDate.setMonth(startDate.getMonth() + 4);
  else if (dimension === 'Trimestre') endDate.setMonth(startDate.getMonth() + 12);
  else endDate.setFullYear(startDate.getFullYear() + 2);

  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const visibleDays = dimension === 'Semana' ? 20 : dimension === 'Mês' ? 40 : null;
  const pxPerDay = visibleDays
    ? Math.max(timelineViewportWidth / visibleDays, dimension === 'Semana' ? 32 : 24)
    : dimension === 'Trimestre' ? 10 : 4;
  const gridWidth = totalDays * pxPerDay;
  const showDayHeader = dimension === 'Semana' || dimension === 'Mês';
  const topHeaderHeight = dimension === 'Mês' ? 34 : 40;
  const dayHeaderHeight = showDayHeader ? 32 : 0;
  const totalHeaderHeight = topHeaderHeight + dayHeaderHeight;

  // Top headers
  const headers: { label: string; width: number; isCurrent?: boolean }[] = [];
  let curr = new Date(startDate);
  while (curr < endDate) {
    let next: Date;
    let label: string;
    if (dimension === 'Semana') {
      next = new Date(curr);
      next.setDate(curr.getDate() + 7);
      label = `Semana ${Math.ceil(curr.getDate() / 7)} - ${curr.toLocaleDateString('pt-BR', { month: 'short' })}`;
    } else {
      next = new Date(curr);
      next.setMonth(curr.getMonth() + 1);
      label = curr.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
    const widthMs = Math.min(next.getTime(), endDate.getTime()) - curr.getTime();
    headers.push({
      label,
      width: (widthMs / (1000 * 60 * 60 * 24)) * pxPerDay,
      isCurrent: today >= curr && today < next,
    });
    curr = next;
  }

  const dayHeaders = useMemo(() => Array.from({ length: totalDays }).map((_, di) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + di);
    const dateIso = date.toISOString().split('T')[0];
    return {
      key: date.toISOString(),
      iso: dateIso,
      label: date.toLocaleDateString('pt-BR', { day: '2-digit' }),
      weekday: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      isToday: dateIso === today.toISOString().split('T')[0],
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [totalDays, pxPerDay, dimension]);

  // Scroll to "today" on mount/dimension change
  useEffect(() => {
    if (scrollRef.current) {
      const diffDays = (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      scrollRef.current.scrollLeft = (diffDays * pxPerDay) - 300;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimension, pxPerDay]);

  // Bar layout: split overlapping initiatives into rows per collaborator
  const ROW_BASE_HEIGHT = 28;
  const BAR_HEIGHT = 18;
  const BAR_VERTICAL_GAP = 4;

  const layoutForCollab = (its: Initiative[]) => {
    const sorted = [...its]
      .filter(it => it.startDate || it.endDate)
      .map(it => {
        const s = it.startDate ? new Date(it.startDate) : new Date(it.endDate as string);
        const e = it.endDate ? new Date(it.endDate) : new Date(it.startDate as string);
        return { it, s, e };
      })
      .sort((a, b) => a.s.getTime() - b.s.getTime());

    const lanes: { end: number }[] = [];
    const placed = sorted.map(({ it, s, e }) => {
      const startTime = s.getTime();
      const endTime = e.getTime();
      let lane = lanes.findIndex(l => l.end <= startTime);
      if (lane === -1) {
        lanes.push({ end: endTime });
        lane = lanes.length - 1;
      } else {
        lanes[lane].end = endTime;
      }
      return { it, s, e, lane };
    });
    return { placed, laneCount: Math.max(1, lanes.length) };
  };

  const rowHeightFor = (its: Initiative[]) => {
    const { laneCount } = layoutForCollab(its);
    return Math.max(
      ROW_BASE_HEIGHT * 1.6,
      laneCount * (BAR_HEIGHT + BAR_VERTICAL_GAP) + BAR_VERTICAL_GAP
    );
  };

  const handleLeftPanelWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    event.preventDefault();
    scrollRef.current.scrollTop += event.deltaY;
  };

  // Manager dropdown contents (Directors and Managers from teams)
  const directorIds = Array.from(new Set(teams.map(t => t.leaderId).filter(id => {
    const role = collaborators.find(c => c.id === id)?.role; return role === 'Director';
  })));
  const managerIds = Array.from(new Set(teams.map(t => t.leaderId).filter(id => {
    const role = collaborators.find(c => c.id === id)?.role; return role === 'Manager';
  })));

  const fmtD = (iso?: string | null) => {
    if (!iso) return '—';
    const p = iso.split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso;
  };

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '10px 14px', height: '100%' }}>
      <div className="capacity-view" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--glass-border-strong)', position: 'relative' }}>

        {/* Top Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 15px', borderBottom: '1px solid #E2E8F0', height: '48px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setIsManagerMenuOpen(v => !v)} className="btn btn-glass" style={{ fontSize: '0.75rem', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={14} /> Gestor: {managerFilter === 'Todos' ? 'Todos' : collaborators.find(c => c.id === managerFilter)?.name.split(' ')[0]} <ChevronDown size={14} />
              </button>
              {isManagerMenuOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1000, background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: 'var(--shadow-lg)', minWidth: '200px', padding: '4px 0', marginTop: '4px', maxHeight: 320, overflowY: 'auto' }}>
                  <div onClick={() => { setManagerFilter('Todos'); setIsManagerMenuOpen(false); }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '0.75rem' }} className="dropdown-item-hover">Todos</div>
                  {directorIds.map(id => (
                    <div key={id} onClick={() => { setManagerFilter(id!); setIsManagerMenuOpen(false); }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '0.75rem' }} className="dropdown-item-hover">
                      <span style={{ color: '#64748B', fontSize: '0.65rem', marginRight: 4 }}>DIR</span>{collaborators.find(c => c.id === id)?.name}
                    </div>
                  ))}
                  {managerIds.map(id => (
                    <div key={id} onClick={() => { setManagerFilter(id!); setIsManagerMenuOpen(false); }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '0.75rem' }} className="dropdown-item-hover">
                      <span style={{ color: '#94A3B8', fontSize: '0.65rem', marginRight: 4 }}>GER</span>{collaborators.find(c => c.id === id)?.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
              {loading ? 'Carregando…' : `${filteredCollabs.length} colaboradores · ${initiatives.length} iniciativas`}
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <button onClick={() => setIsDimMenuOpen(v => !v)} className="btn btn-glass" style={{ fontSize: '0.75rem', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} /> Visão: {dimension} <ChevronDown size={14} />
            </button>
            {isDimMenuOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1000, background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: 'var(--shadow-lg)', minWidth: '120px', padding: '4px 0', marginTop: '4px' }}>
                {(['Ano', 'Trimestre', 'Mês', 'Semana'] as Dimension[]).map(d => (
                  <div key={d} onClick={() => { setDimension(d); setIsDimMenuOpen(false); }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '0.75rem' }} className="dropdown-item-hover">{d}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Grid */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Left Frozen Column */}
          <div
            style={{ width: '260px', borderRight: '1px solid #E2E8F0', background: '#F8FAFC', zIndex: 50, flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}
            onWheel={handleLeftPanelWheel}
          >
            <div style={{ height: totalHeaderHeight, borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', padding: '0 15px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Colaborador</div>
            <div ref={leftColRef} style={{ flex: 1, minHeight: 0, overflowY: 'hidden' }}>
              {filteredCollabs.map(c => {
                const its = allocationsByCollab.get(c.id) || [];
                const h = rowHeightFor(its);
                return (
                  <div key={c.id} style={{ height: h, borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 15px', background: 'white' }}>
                    {c.photoUrl
                      ? <img src={c.photoUrl} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                      : <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E2E8F0' }} />}
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.role}</span>
                        <span style={{ fontWeight: 700, color: its.length ? 'var(--accent-base)' : 'var(--text-tertiary)' }}>{its.length}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scrollable Timeline */}
          <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowX: 'auto', overflowY: 'auto' }}>
            <div style={{ width: gridWidth, position: 'relative' }}>

              {/* Top Header */}
              <div style={{ display: 'flex', height: `${topHeaderHeight}px`, position: 'sticky', top: 0, zIndex: 40, background: 'white' }}>
                {headers.map((h, i) => (
                  <div key={i} style={{ width: h.width, flexShrink: 0, borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: '0.68rem', fontWeight: 700, background: h.isCurrent ? '#E2E8F0' : 'white' }}>
                    {h.label}
                  </div>
                ))}
              </div>

              {showDayHeader && (
                <div style={{ display: 'flex', height: `${dayHeaderHeight}px`, position: 'sticky', top: `${topHeaderHeight}px`, zIndex: 39, background: 'white' }}>
                  {dayHeaders.map((day, index) => (
                    <div
                      key={`${day.key}-${index}`}
                      style={{
                        width: pxPerDay,
                        flexShrink: 0,
                        borderRight: '1px solid rgba(226,232,240,0.5)',
                        borderBottom: '1px solid #E2E8F0',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: day.isToday ? '#FFF7ED' : day.isWeekend ? '#CBD5E1' : 'white',
                        color: day.isToday ? '#C2410C' : day.isWeekend ? '#334155' : '#64748B',
                        lineHeight: 1.1,
                      }}
                    >
                      <span style={{ fontSize: '0.68rem', fontWeight: 800 }}>{day.label}</span>
                      <span style={{ fontSize: '0.58rem', textTransform: 'uppercase' }}>{day.weekday.replace('.', '')}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Rows */}
              <div style={{ position: 'relative' }}>
                {filteredCollabs.map(c => {
                  const its = allocationsByCollab.get(c.id) || [];
                  const h = rowHeightFor(its);
                  const { placed } = layoutForCollab(its);
                  return (
                    <div key={c.id} style={{ display: 'flex', height: h, borderBottom: '1px solid #E2E8F0', position: 'relative' }}>

                      {/* Background day cells */}
                      {dayHeaders.map((day, di) => (
                        <div
                          key={di}
                          style={{
                            width: pxPerDay,
                            flexShrink: 0,
                            borderRight: '1px solid rgba(226,232,240,0.5)',
                            background: day.isWeekend ? '#F1F5F9' : 'white',
                            position: 'relative',
                          }}
                        >
                          {day.isToday && (
                            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '2px', background: 'var(--accent-base)', zIndex: 5 }} />
                          )}
                        </div>
                      ))}

                      {/* Initiative bars */}
                      {placed.map(({ it, s, e, lane }) => {
                        const clampedStart = s < startDate ? startDate : s;
                        const clampedEnd = e > endDate ? endDate : e;
                        if (clampedEnd < startDate || clampedStart > endDate) return null;
                        const offsetDays = (clampedStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
                        const durationDays = Math.max(1, (clampedEnd.getTime() - clampedStart.getTime()) / (1000 * 60 * 60 * 24) + 1);
                        const left = offsetDays * pxPerDay;
                        const width = durationDays * pxPerDay - 2;
                        const top = BAR_VERTICAL_GAP + lane * (BAR_HEIGHT + BAR_VERTICAL_GAP);
                        const color = STATUS_COLOR[it.status] || '#94A3B8';
                        const showLabel = width > 60;
                        return (
                          <div
                            key={it.id}
                            onClick={() => navigate(`/iniciativas/${it.id}/edit`)}
                            title={`${it.title}\n${it.status}\n${fmtD(it.startDate)} → ${fmtD(it.endDate)}`}
                            style={{
                              position: 'absolute',
                              left,
                              top,
                              width,
                              height: BAR_HEIGHT,
                              background: color,
                              borderRadius: 6,
                              boxShadow: '0 1px 2px rgba(15,23,42,0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '0 8px',
                              color: 'white',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              zIndex: 10,
                            }}
                          >
                            <StatusIcon status={it.status} size={12} style={{ filter: 'brightness(0) invert(1)' }} />
                            {showLabel && (
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.title}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

                {filteredCollabs.length === 0 && !loading && (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Nenhum colaborador encontrado para o filtro selecionado.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Allocations;
