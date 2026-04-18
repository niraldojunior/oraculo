import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  FileText,
  MessageCircle,
  Tag,
  Server,
  Calendar,
  Trash2,
  User,
  X,
} from 'lucide-react';
import type {
  Initiative,
  InitiativeMilestone,
  MilestoneTask,
  Collaborator,
  System,
  TaskStatus,
} from '../types';
import { TASK_STATUS_ORDER } from '../types';
import { useAuth } from '../context/AuthContext';
import { useView } from '../context/ViewContext';
import { TaskEditModal, TASK_STATUS_CONFIG, TYPE_STYLES, ALL_TYPES } from '../components/initiative/InitiativeTaskBoard';
import { PRIORITY_OPTIONS } from '../components/common/PriorityPicker';
import { PriorityPicker } from '../components/common/PriorityPicker';
import type { PriorityValue } from '../components/common/PriorityPicker';
import { renderAvatar } from '../components/initiative/SidebarComponents';

// ─── Types ───────────────────────────────────────────────────────────────────

type ActivePickerType = 'priority' | 'status' | 'type' | 'systems' | 'assignee' | 'startDate' | 'targetDate';

interface ActivePicker {
  initiativeId: string;
  milestoneId: string;
  taskId: string;
  impactedSystemIds: string[];
  memberIds: string[];
  type: ActivePickerType;
  position: { top: number; left?: number; right?: number };
}

interface FlatTask {
  task: MilestoneTask;
  milestone: InitiativeMilestone;
  initiative: Initiative;
}

const Tasks: React.FC = () => {
  const { user, currentCompany, currentDepartment } = useAuth();
  const { activeView, setActiveView, searchTerm, setHeaderContent } = useView();

  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingTask, setEditingTask] = useState<{
    task: MilestoneTask;
    milestoneId: string;
    initiative: Initiative;
  } | null>(null);

  const [activePicker, setActivePicker] = useState<ActivePicker | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Default to list view on mount
  useEffect(() => {
    setActiveView('tasks-list');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!currentCompany || !currentDepartment) return;
      setLoading(true);
      try {
        const [initRes, ctxRes] = await Promise.all([
          fetch('/api/initiatives'),
          fetch('/api/inventory-context'),
        ]);
        if (initRes.ok) {
          const data = await initRes.json();
          setInitiatives(data || []);
        }
        if (ctxRes.ok) {
          const ctx = await ctxRes.json();
          setCollaborators(ctx.collaborators || []);
          setSystems(ctx.systems || []);
        }
      } catch (err) {
        console.error('Tasks fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentCompany, currentDepartment]);

  // Compute my tasks
  const myTasks = useMemo((): FlatTask[] => {
    const result: FlatTask[] = [];
    for (const initiative of initiatives) {
      for (const milestone of initiative.milestones || []) {
        for (const task of milestone.tasks || []) {
          if (task.assigneeId === user?.id) {
            result.push({ task, milestone, initiative });
          }
        }
      }
    }
    return result;
  }, [initiatives, user?.id]);

  // Filter by search
  const filteredTasks = useMemo(() => {
    let result = myTasks;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = myTasks.filter(
        ({ task, initiative, milestone }) =>
          task.name.toLowerCase().includes(q) ||
          initiative.title.toLowerCase().includes(q) ||
          milestone.name.toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) => {
      const aEnd = a.task.targetDate ? new Date(a.task.targetDate).getTime() : Infinity;
      const bEnd = b.task.targetDate ? new Date(b.task.targetDate).getTime() : Infinity;
      return aEnd - bEnd;
    });
  }, [myTasks, searchTerm]);

  // Header badge
  useEffect(() => {
    const badgeStyle: React.CSSProperties = { display: 'inline-block', background: '#E5E7EB', color: '#374151', borderRadius: '999px', padding: '2px 10px', fontSize: '0.78rem', fontWeight: 700, marginLeft: '0.5rem' };
    setHeaderContent(<div style={{ display: 'flex', alignItems: 'center', fontWeight: 800 }}>Minhas Tarefas <span style={badgeStyle}>{filteredTasks.length}</span></div>);
    return () => setHeaderContent(null);
  }, [filteredTasks.length, setHeaderContent]);

  // Group by "initiative.id + milestone.id"
  const groups = useMemo(() => {
    const map = new Map<string, { label: string; items: FlatTask[] }>();
    for (const ft of filteredTasks) {
      const key = `${ft.initiative.id}__${ft.milestone.id}`;
      if (!map.has(key)) {
        map.set(key, {
          label: `${ft.initiative.title} | ${ft.milestone.name}`,
          items: [],
        });
      }
      map.get(key)!.items.push(ft);
    }
    return Array.from(map.entries()).map(([key, val]) => ({ key, ...val }));
  }, [filteredTasks]);

  // Initialize all groups expanded
  useEffect(() => {
    if (groups.length > 0 && expandedGroups.size === 0) {
      setExpandedGroups(new Set(groups.map(g => g.key)));
    }
  }, [groups]);

  const toggleGroup = useCallback((key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // Update task in state + save via API
  const handleTaskUpdate = useCallback(async (
    milestoneId: string,
    taskId: string,
    field: string,
    value: any
  ) => {
    if (!editingTask) return;
    const initiativeId = editingTask.initiative.id;

    setInitiatives(prev =>
      prev.map(ini => {
        if (ini.id !== initiativeId) return ini;
        return {
          ...ini,
          milestones: (ini.milestones || []).map(m => {
            if (m.id !== milestoneId) return m;
            return {
              ...m,
              tasks: (m.tasks || []).map(t => {
                if (t.id !== taskId) return t;
                if (field === '__textFields') return { ...t, ...(value as Partial<MilestoneTask>) };
                return { ...t, [field]: value };
              }),
            };
          }),
        };
      })
    );

    // Also update editingTask so modal reflects changes
    setEditingTask(prev => {
      if (!prev) return null;
      let updatedTask = prev.task;
      if (field === '__textFields') updatedTask = { ...updatedTask, ...(value as Partial<MilestoneTask>) };
      else updatedTask = { ...updatedTask, [field]: value };
      // milestoneId used for task lookup above
      const updatedInitiative = {
        ...prev.initiative,
        milestones: prev.initiative.milestones.map(m =>
          m.id === milestoneId
            ? { ...m, tasks: (m.tasks || []).map(t => t.id === taskId ? updatedTask : t) }
            : m
        ),
      };
      return { task: updatedTask, milestoneId: prev.milestoneId, initiative: updatedInitiative };
    });

    // Save to API
    try {
      const latestIni = initiatives.find(i => i.id === initiativeId);
      if (!latestIni) return;
      const updatedIni = {
        ...latestIni,
        milestones: (latestIni.milestones || []).map(m => {
          if (m.id !== milestoneId) return m;
          return {
            ...m,
            tasks: (m.tasks || []).map(t => {
              if (t.id !== taskId) return t;
              if (field === '__textFields') return { ...t, ...(value as Partial<MilestoneTask>) };
              return { ...t, [field]: value };
            }),
          };
        }),
      };
      await fetch(`/api/initiatives/${initiativeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedIni),
      });
    } catch (err) {
      console.error('Task update error:', err);
    }
  }, [editingTask, initiatives]);

  const handleTaskDelete = useCallback(async (milestoneId: string, taskId: string) => {
    if (!editingTask) return;
    const initiativeId = editingTask.initiative.id;
    setInitiatives(prev =>
      prev.map(ini => {
        if (ini.id !== initiativeId) return ini;
        return {
          ...ini,
          milestones: (ini.milestones || []).map(m =>
            m.id !== milestoneId
              ? m
              : { ...m, tasks: (m.tasks || []).filter(t => t.id !== taskId) }
          ),
        };
      })
    );
    setEditingTask(null);
    try {
      const latestIni = initiatives.find(i => i.id === initiativeId);
      if (!latestIni) return;
      const updatedIni = {
        ...latestIni,
        milestones: (latestIni.milestones || []).map(m =>
          m.id !== milestoneId ? m : { ...m, tasks: (m.tasks || []).filter(t => t.id !== taskId) }
        ),
      };
      await fetch(`/api/initiatives/${initiativeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedIni),
      });
    } catch (err) {
      console.error('Task delete error:', err);
    }
  }, [editingTask, initiatives]);

  const openTask = useCallback((ft: FlatTask) => {
    setEditingTask({ task: ft.task, milestoneId: ft.milestone.id, initiative: ft.initiative });
  }, []);

  // Inline field update (from task row, no modal open)
  const handleInlineUpdate = useCallback(async (initiativeId: string, milestoneId: string, taskId: string, field: string, value: any) => {
    setInitiatives(prev => prev.map(ini => {
      if (ini.id !== initiativeId) return ini;
      return {
        ...ini,
        milestones: (ini.milestones || []).map(m => {
          if (m.id !== milestoneId) return m;
          return { ...m, tasks: (m.tasks || []).map(t => t.id !== taskId ? t : { ...t, [field]: value }) };
        }),
      };
    }));
    try {
      const latestIni = initiatives.find(i => i.id === initiativeId);
      if (!latestIni) return;
      const updatedIni = {
        ...latestIni,
        milestones: (latestIni.milestones || []).map(m => {
          if (m.id !== milestoneId) return m;
          return { ...m, tasks: (m.tasks || []).map(t => t.id !== taskId ? t : { ...t, [field]: value }) };
        }),
      };
      await fetch(`/api/initiatives/${initiativeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedIni),
      });
    } catch (err) {
      console.error('Inline task update error:', err);
    }
  }, [initiatives]);

  const handleInlineDelete = useCallback(async (ft: FlatTask) => {
    const { initiative, milestone, task } = ft;
    setInitiatives(prev => prev.map(ini => {
      if (ini.id !== initiative.id) return ini;
      return {
        ...ini,
        milestones: (ini.milestones || []).map(m =>
          m.id !== milestone.id ? m : { ...m, tasks: (m.tasks || []).filter(t => t.id !== task.id) }
        ),
      };
    }));
    try {
      const latestIni = initiatives.find(i => i.id === initiative.id);
      if (!latestIni) return;
      const updatedIni = {
        ...latestIni,
        milestones: (latestIni.milestones || []).map(m =>
          m.id !== milestone.id ? m : { ...m, tasks: (m.tasks || []).filter(t => t.id !== task.id) }
        ),
      };
      await fetch(`/api/initiatives/${initiative.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedIni),
      });
    } catch (err) {
      console.error('Inline task delete error:', err);
    }
  }, [initiatives]);

  if (loading) return <div className="spinner-container"><div className="spinner"></div><span>Carregando Tarefas...</span></div>;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)', overflow: 'hidden' }}>
      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0' }}>
        {filteredTasks.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem', color: '#64748B' }}>
            <div style={{ fontSize: '2.5rem' }}>✓</div>
            <div style={{ fontSize: '1rem', fontWeight: 600 }}>Nenhuma tarefa atribuída a você</div>
            <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>As tarefas dos projetos em que você é responsável aparecem aqui</div>
          </div>
        ) : activeView === 'tasks-card' ? (
          <KanbanView flatTasks={filteredTasks} onOpenTask={openTask} onStatusChange={(ft, newStatus) => handleInlineUpdate(ft.initiative.id, ft.milestone.id, ft.task.id, 'status', newStatus)} />
        ) : (
          <ListView
            groups={groups}
            expandedGroups={expandedGroups}
            onToggleGroup={toggleGroup}
            onOpenTask={openTask}
            collaborators={collaborators}
            systems={systems}
            onSetPicker={setActivePicker}
            onDeleteTask={handleInlineDelete}
          />
        )}
      </div>

      {/* Task Edit Modal */}
      {editingTask && (
        <TaskEditModal
          task={editingTask.task}
          milestoneId={editingTask.milestoneId}
          allCollaborators={collaborators}
          allSystems={systems}
          formData={editingTask.initiative}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
          onClose={() => setEditingTask(null)}
          user={user}
        />
      )}

      {/* ── Floating Pickers ─────────────────────────────────────────────── */}
      {activePicker?.type === 'priority' && (() => {
        const ini = initiatives.find(i => i.id === activePicker.initiativeId);
        const task = ini?.milestones?.find(m => m.id === activePicker.milestoneId)?.tasks?.find(t => t.id === activePicker.taskId);
        return (
          <PriorityPicker
            value={(task?.priority ?? 0) as PriorityValue}
            onSelect={(v: PriorityValue) => {
              handleInlineUpdate(activePicker.initiativeId, activePicker.milestoneId, activePicker.taskId, 'priority', v);
              setActivePicker(null);
            }}
            onClose={() => setActivePicker(null)}
            position={{ top: activePicker.position.top, left: activePicker.position.left ?? 0 }}
          />
        );
      })()}

      {activePicker?.type === 'status' && (() => {
        const ini = initiatives.find(i => i.id === activePicker.initiativeId);
        const task = ini?.milestones?.find(m => m.id === activePicker.milestoneId)?.tasks?.find(t => t.id === activePicker.taskId);
        const currentStatus = task?.status || 'Backlog';
        return (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000001 }} onClick={() => setActivePicker(null)} />
            <div style={{ position: 'fixed', top: activePicker.position.top, left: activePicker.position.left, background: 'white', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)', padding: '4px', minWidth: '170px', zIndex: 1000002 }}>
              <div style={{ padding: '8px 12px', fontSize: '12px', color: '#64748B', borderBottom: '1px solid #F1F5F9', marginBottom: '4px' }}>Altere o Status</div>
              {TASK_STATUS_ORDER.map(s => {
                const cfg = TASK_STATUS_CONFIG[s];
                const isSel = currentStatus === s;
                return (
                  <button key={s}
                    onClick={() => { handleInlineUpdate(activePicker.initiativeId, activePicker.milestoneId, activePicker.taskId, 'status', s); setActivePicker(null); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.45rem 0.7rem', borderRadius: '6px', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', background: isSel ? '#F1F5F9' : 'transparent', fontSize: '12px' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = isSel ? '#F1F5F9' : 'transparent'}
                  >
                    {cfg.icon}
                    <span style={{ flex: 1 }}>{cfg.label}</span>
                    {isSel && <span style={{ color: '#6366F1', fontSize: 11 }}>&#10003;</span>}
                  </button>
                );
              })}
            </div>
          </>
        );
      })()}

      {activePicker?.type === 'type' && (() => {
        const ini = initiatives.find(i => i.id === activePicker.initiativeId);
        const task = ini?.milestones?.find(m => m.id === activePicker.milestoneId)?.tasks?.find(t => t.id === activePicker.taskId);
        const currentType = task?.type || null;
        return (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000001 }} onClick={() => setActivePicker(null)} />
            <div style={{ position: 'fixed', top: activePicker.position.top, left: activePicker.position.left, background: 'white', borderRadius: '6px', padding: '2px', minWidth: '120px', zIndex: 1000002, boxShadow: '0 6px 14px rgba(0,0,0,0.09), 0 0 0 1px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '4px 8px', fontSize: '10px', color: '#94A3B8', borderBottom: '1px solid #F1F5F9', marginBottom: '2px' }}>Altere o Tipo</div>
              <button onClick={() => { handleInlineUpdate(activePicker.initiativeId, activePicker.milestoneId, activePicker.taskId, 'type', null); setActivePicker(null); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 8px', border: 'none', background: !currentType ? '#F1F5F9' : 'transparent', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontSize: '11px', color: '#94A3B8' }}>
                <X size={9} /><span style={{ flex: 1 }}>Nenhum</span>{!currentType && <span style={{ color: '#2563EB', fontSize: 10 }}>&#10003;</span>}
              </button>
              {ALL_TYPES.map(t => {
                const style = TYPE_STYLES[t] || TYPE_STYLES['Feature'];
                const isSel = currentType === t;
                return (
                  <button key={t} onClick={() => { handleInlineUpdate(activePicker.initiativeId, activePicker.milestoneId, activePicker.taskId, 'type', t); setActivePicker(null); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 8px', border: 'none', background: isSel ? '#F1F5F9' : 'transparent', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontSize: '11px', color: '#1E293B' }}>
                    <span style={{ color: style.text, display: 'flex', flexShrink: 0 }}>{style.icon}</span>
                    <span style={{ flex: 1 }}>{t}</span>
                    {isSel && <span style={{ color: '#2563EB', fontSize: 10 }}>&#10003;</span>}
                  </button>
                );
              })}
            </div>
          </>
        );
      })()}

      {activePicker?.type === 'systems' && (() => {
        const ini = initiatives.find(i => i.id === activePicker.initiativeId);
        const task = ini?.milestones?.find(m => m.id === activePicker.milestoneId)?.tasks?.find(t => t.id === activePicker.taskId);
        const sysIds = task ? (task.systemIds?.length ? task.systemIds : task.systemId ? [task.systemId] : []) : [];
        const scopedSystems = systems.filter(s => activePicker.impactedSystemIds.includes(String(s.id)));
        const displaySystems = scopedSystems.length > 0 ? scopedSystems : systems;
        return (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000001 }} onClick={() => setActivePicker(null)} />
            <div style={{ position: 'fixed', top: activePicker.position.top, left: activePicker.position.left, background: 'white', borderRadius: '6px', padding: '2px', minWidth: '140px', zIndex: 1000002, boxShadow: '0 6px 14px rgba(0,0,0,0.09), 0 0 0 1px rgba(0,0,0,0.05)', maxHeight: '260px', overflowY: 'auto' }}>
              <div style={{ padding: '4px 8px', fontSize: '10px', color: '#94A3B8', borderBottom: '1px solid #F1F5F9', marginBottom: '2px' }}>Altere os Sistemas</div>
              <button onClick={() => { handleInlineUpdate(activePicker.initiativeId, activePicker.milestoneId, activePicker.taskId, 'systemIds', []); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 8px', border: 'none', background: sysIds.length === 0 ? '#F1F5F9' : 'transparent', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontSize: '11px', color: '#94A3B8' }}>
                <X size={9} /><span style={{ flex: 1 }}>Nenhum</span>{sysIds.length === 0 && <span style={{ color: '#2563EB', fontSize: 10 }}>&#10003;</span>}
              </button>
              {displaySystems.map(s => {
                const sel = sysIds.includes(String(s.id));
                return (
                  <button key={s.id} onClick={() => {
                    const newIds = sel ? sysIds.filter(id => id !== String(s.id)) : [...sysIds, String(s.id)];
                    handleInlineUpdate(activePicker.initiativeId, activePicker.milestoneId, activePicker.taskId, 'systemIds', newIds);
                  }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 8px', border: 'none', background: sel ? '#F1F5F9' : 'transparent', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontSize: '11px', color: '#1E293B' }}>
                    <div style={{ width: 13, height: 13, borderRadius: '3px', border: `1.5px solid ${sel ? '#6366F1' : '#CBD5E1'}`, background: sel ? '#6366F1' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {sel && <span style={{ color: '#fff', fontSize: 9, lineHeight: 1 }}>&#10003;</span>}
                    </div>
                    <span style={{ flex: 1 }}>{s.acronym || s.name}</span>
                  </button>
                );
              })}
            </div>
          </>
        );
      })()}

      {activePicker?.type === 'assignee' && (() => {
        const ini = initiatives.find(i => i.id === activePicker.initiativeId);
        const task = ini?.milestones?.find(m => m.id === activePicker.milestoneId)?.tasks?.find(t => t.id === activePicker.taskId);
        const currentAssignee = task?.assigneeId || null;
        const scopedMembers = collaborators.filter(c => activePicker.memberIds.includes(c.id));
        const members = scopedMembers.length > 0 ? scopedMembers : collaborators;
        return (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000001 }} onClick={() => setActivePicker(null)} />
            <div style={{ position: 'fixed', top: activePicker.position.top, left: activePicker.position.left, background: 'white', borderRadius: '6px', padding: '2px', minWidth: '140px', zIndex: 1000002, boxShadow: '0 6px 14px rgba(0,0,0,0.09), 0 0 0 1px rgba(0,0,0,0.05)', maxHeight: '260px', overflowY: 'auto' }}>
              <div style={{ padding: '4px 8px', fontSize: '10px', color: '#94A3B8', borderBottom: '1px solid #F1F5F9', marginBottom: '2px' }}>Altere o Responsável</div>
              <button onClick={() => { handleInlineUpdate(activePicker.initiativeId, activePicker.milestoneId, activePicker.taskId, 'assigneeId', null); setActivePicker(null); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 8px', border: 'none', background: !currentAssignee ? '#F1F5F9' : 'transparent', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontSize: '11px', color: '#94A3B8' }}>
                <User size={10} /><span style={{ flex: 1 }}>Nenhum</span>{!currentAssignee && <span style={{ color: '#2563EB', fontSize: 10 }}>&#10003;</span>}
              </button>
              {members.map(c => {
                const isSel = currentAssignee === c.id;
                return (
                  <button key={c.id} onClick={() => { handleInlineUpdate(activePicker.initiativeId, activePicker.milestoneId, activePicker.taskId, 'assigneeId', c.id); setActivePicker(null); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 8px', border: 'none', background: isSel ? '#F1F5F9' : 'transparent', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontSize: '11px', color: '#1E293B' }}>
                    {renderAvatar(c.id, collaborators, 16)}
                    <span style={{ flex: 1 }}>{c.name}</span>
                    {isSel && <span style={{ color: '#2563EB', fontSize: 10 }}>&#10003;</span>}
                  </button>
                );
              })}
            </div>
          </>
        );
      })()}

      {activePicker?.type === 'startDate' && (() => {
        const ini = initiatives.find(i => i.id === activePicker.initiativeId);
        const task = ini?.milestones?.find(m => m.id === activePicker.milestoneId)?.tasks?.find(t => t.id === activePicker.taskId);
        const currentDate = task?.startDate || '';
        return (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000001 }} onClick={() => setActivePicker(null)} />
            <div style={{ position: 'fixed', top: activePicker.position.top, right: activePicker.position.right, background: 'white', borderRadius: '6px', padding: '10px 12px', zIndex: 1000002, minWidth: '180px', boxShadow: '0 6px 14px rgba(0,0,0,0.09), 0 0 0 1px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Data Início</div>
              <input type="date" defaultValue={currentDate}
                onChange={e => handleInlineUpdate(activePicker.initiativeId, activePicker.milestoneId, activePicker.taskId, 'startDate', e.target.value || null)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setActivePicker(null); }}
                style={{ fontSize: '11px', border: '1px solid #E2E8F0', borderRadius: '5px', padding: '5px 8px', outline: 'none', width: '100%', boxSizing: 'border-box', color: '#1E293B' }}
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                {currentDate ? <button onClick={() => { handleInlineUpdate(activePicker.initiativeId, activePicker.milestoneId, activePicker.taskId, 'startDate', null); setActivePicker(null); }} style={{ fontSize: '10px', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>Limpar data</button> : <span />}
                <button onClick={() => setActivePicker(null)} style={{ fontSize: '10px', color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Confirmar</button>
              </div>
            </div>
          </>
        );
      })()}

      {activePicker?.type === 'targetDate' && (() => {
        const ini = initiatives.find(i => i.id === activePicker.initiativeId);
        const task = ini?.milestones?.find(m => m.id === activePicker.milestoneId)?.tasks?.find(t => t.id === activePicker.taskId);
        const currentDate = task?.targetDate || '';
        return (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000001 }} onClick={() => setActivePicker(null)} />
            <div style={{ position: 'fixed', top: activePicker.position.top, right: activePicker.position.right, background: 'white', borderRadius: '6px', padding: '10px 12px', zIndex: 1000002, minWidth: '180px', boxShadow: '0 6px 14px rgba(0,0,0,0.09), 0 0 0 1px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Data Fim</div>
              <input type="date" defaultValue={currentDate}
                onChange={e => handleInlineUpdate(activePicker.initiativeId, activePicker.milestoneId, activePicker.taskId, 'targetDate', e.target.value || null)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setActivePicker(null); }}
                style={{ fontSize: '11px', border: '1px solid #E2E8F0', borderRadius: '5px', padding: '5px 8px', outline: 'none', width: '100%', boxSizing: 'border-box', color: '#1E293B' }}
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                {currentDate ? <button onClick={() => { handleInlineUpdate(activePicker.initiativeId, activePicker.milestoneId, activePicker.taskId, 'targetDate', null); setActivePicker(null); }} style={{ fontSize: '10px', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>Limpar data</button> : <span />}
                <button onClick={() => setActivePicker(null)} style={{ fontSize: '10px', color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Confirmar</button>
              </div>
            </div>
          </>
        );
      })()}

      <style>{`
        .tasks-group-header:hover { background: #F8FAFC !important; }
        .tasks-task-row:hover { background: #F8FAFC !important; cursor: pointer; }
        .tasks-task-row:hover .tasks-drag-handle { opacity: 1 !important; }
        .tasks-task-row:hover .tasks-row-actions { opacity: 1 !important; }
        .tasks-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important; border-color: #CBD5E1 !important; }
        .tasks-icon-hover:hover { background: #F1F5F9 !important; border-radius: 3px; }
      `}</style>
    </div>
  );
};

// ─── List View ───────────────────────────────────────────────────────────────

interface ListViewProps {
  groups: { key: string; label: string; items: FlatTask[] }[];
  expandedGroups: Set<string>;
  onToggleGroup: (key: string) => void;
  onOpenTask: (ft: FlatTask) => void;
  collaborators: Collaborator[];
  systems: System[];
  onSetPicker: (picker: ActivePicker | null) => void;
  onDeleteTask: (ft: FlatTask) => void;
}

const ListView: React.FC<ListViewProps> = ({ groups, expandedGroups, onToggleGroup, onOpenTask, collaborators, systems, onSetPicker, onDeleteTask }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {groups.map(group => {
        const isExpanded = expandedGroups.has(group.key);
        const totalTasks = group.items.length;
        const doneTasks = group.items.filter(ft => ft.task.status === 'Done').length;
        const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

        return (
          <div key={group.key} style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            {/* Group header */}
            <div className="tasks-group-header" onClick={() => onToggleGroup(group.key)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 1rem', cursor: 'pointer', background: 'white', transition: 'background 0.15s', userSelect: 'none' }}>
              {isExpanded ? <ChevronDown size={15} color="#94A3B8" /> : <ChevronRight size={15} color="#94A3B8" />}
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E293B', flex: 1 }}>{group.label}</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8' }}>{progress}%</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#F1F5F9', color: '#64748B', borderRadius: '999px', padding: '2px 8px' }}>{totalTasks}</span>
            </div>

            {/* Task rows */}
            {isExpanded && (
              <div style={{ borderTop: '1px solid #F1F5F9' }}>
                {group.items.map(ft => (
                  <TaskRow
                    key={ft.task.id}
                    ft={ft}
                    onOpen={onOpenTask}
                    collaborators={collaborators}
                    systems={systems}
                    onSetPicker={onSetPicker}
                    onDelete={onDeleteTask}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Task Row ────────────────────────────────────────────────────────────────

interface TaskRowProps {
  ft: FlatTask;
  onOpen: (ft: FlatTask) => void;
  collaborators: Collaborator[];
  systems: System[];
  onSetPicker: (picker: ActivePicker | null) => void;
  onDelete: (ft: FlatTask) => void;
}

const TaskRow: React.FC<TaskRowProps> = ({ ft, onOpen, collaborators, systems, onSetPicker, onDelete }) => {
  const { task, initiative, milestone } = ft;
  const statusCfg = TASK_STATUS_CONFIG[task.status || 'Backlog'];
  const typeStyle = task.type ? TYPE_STYLES[task.type] : null;
  const priorityOpt = PRIORITY_OPTIONS[task.priority ?? 0];
  const systemIds: string[] = task.systemIds?.length ? task.systemIds : task.systemId ? [task.systemId] : [];
  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);
  React.useEffect(() => {
    const handler = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const isMobile = windowWidth < 640;

  const formatDate = (d?: string | null) => {
    if (!d) return null;
    try {
      const [, month, day] = d.split('-');
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return `${parseInt(day)} ${months[parseInt(month, 10) - 1]}`;
    } catch { return d; }
  };

  const openPicker = (e: React.MouseEvent, type: ActivePickerType, anchorRight = false) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    onSetPicker({
      initiativeId: initiative.id,
      milestoneId: milestone.id,
      taskId: task.id,
      impactedSystemIds: (initiative.impactedSystemIds || []).map(String),
      memberIds: initiative.memberIds || [],
      type,
      position: anchorRight
        ? { top: rect.bottom + 4, right: window.innerWidth - rect.right }
        : { top: rect.bottom + 4, left: rect.left },
    });
  };

  return (
    <div
      className="tasks-task-row"
      onClick={() => onOpen(ft)}
      style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', background: 'white', minHeight: '34px', borderBottom: '1px solid #F8FAFC', transition: 'background 0.1s', cursor: 'pointer' }}
    >
      {/* Drag handle placeholder (spacing) */}
      {!isMobile && <div className="tasks-drag-handle" style={{ width: 13, flexShrink: 0, opacity: 0, display: 'flex' }}>
        <GripVertical size={13} color="#CBD5E1" />
      </div>}

      {/* Priority icon */}
      {!isMobile && <div
        onClick={e => openPicker(e, 'priority')}
        className="tasks-icon-hover"
        title={priorityOpt?.label}
        style={{ width: 16, flexShrink: 0, display: 'flex', alignItems: 'center', margin: '0 6px', cursor: 'pointer', borderRadius: '3px', padding: '2px' }}
      >
        {task.priority != null && task.priority > 0
          ? <span style={{ color: priorityOpt?.color, display: 'flex' }}>{priorityOpt?.icon}</span>
          : <span style={{ color: '#E2E8F0', display: 'flex' }}>{PRIORITY_OPTIONS[0]?.icon}</span>
        }
      </div>}

      {/* Status icon */}
      <div
        onClick={e => openPicker(e, 'status')}
        className="tasks-icon-hover"
        title={statusCfg.label}
        style={{ width: 14, flexShrink: 0, display: 'flex', alignItems: 'center', marginRight: '8px', cursor: 'pointer', borderRadius: '3px', padding: '2px' }}
      >
        {statusCfg.icon}
      </div>

      {/* Title */}
      <span style={{
        flex: 1, fontSize: '0.78rem', fontWeight: 450, lineHeight: 1.4,
        color: task.status === 'Done' ? '#94A3B8' : '#1E293B',
        textDecoration: task.status === 'Done' ? 'line-through' : 'none',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {task.name}
      </span>

      {/* Right metadata */}
      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, gap: '6px', marginLeft: '8px' }}>
        {/* Notes / comments indicators */}
        {!isMobile && (task.notes || (task.comments?.length ?? 0) > 0) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {task.notes && <span title={task.notes} style={{ display: 'inline-flex' }}><FileText size={12} color="#3B82F6" /></span>}
            {(task.comments?.length ?? 0) > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#3B82F6' }}>
                <MessageCircle size={12} /><span style={{ fontSize: '0.65rem', fontWeight: 700 }}>{task.comments!.length}</span>
              </span>
            )}
          </div>
        )}

        {/* Type */}
        {!isMobile && <div onClick={e => openPicker(e, 'type')} className="tasks-icon-hover" title={task.type || 'Definir tipo'} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          {task.type && typeStyle ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '2px 10px 2px 8px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 500, color: '#475569', whiteSpace: 'nowrap', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <span style={{ color: typeStyle.text, display: 'flex', flexShrink: 0 }}>{typeStyle.icon}</span>
              {task.type}
            </span>
          ) : (
            <span style={{ display: 'flex', padding: '2px', borderRadius: '4px' }}><Tag size={14} color="#CBD5E1" /></span>
          )}
        </div>}

        {/* Systems */}
        {!isMobile && <div
          onClick={e => openPicker(e, 'systems')}
          className="tasks-icon-hover"
          title={systemIds.length > 0 ? systemIds.map(sid => { const s = systems.find(s => String(s.id) === sid); return s ? (s.acronym || s.name) : sid; }).join(', ') : 'Definir sistema'}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
        >
          {systemIds.length > 0 ? (
            <>
              {systemIds.slice(0, 1).map(sid => {
                const sys = systems.find(s => String(s.id) === sid);
                return sys ? (
                  <span key={sid} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '2px 10px 2px 8px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 500, color: '#475569', whiteSpace: 'nowrap', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366F1', flexShrink: 0 }} />
                    {sys.acronym || sys.name}
                  </span>
                ) : null;
              })}
              {systemIds.length > 1 && <span style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 700 }}>+{systemIds.length - 1}</span>}
            </>
          ) : (
            <span style={{ display: 'flex', padding: '2px', borderRadius: '4px' }}><Server size={14} color="#CBD5E1" /></span>
          )}
        </div>}

        {/* Assignee */}
        {!isMobile && <div onClick={e => openPicker(e, 'assignee')} className="tasks-icon-hover" title={task.assigneeId ? (collaborators.find(c => c.id === task.assigneeId)?.name || 'Responsável') : 'Definir responsável'} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          {task.assigneeId
            ? renderAvatar(task.assigneeId, collaborators, 20)
            : <span style={{ display: 'flex', padding: '2px', borderRadius: '4px' }}><User size={14} color="#CBD5E1" /></span>
          }
        </div>}

        {/* Start date */}
        <div onClick={e => openPicker(e, 'startDate', true)} className="tasks-icon-hover" title={task.startDate ? `Início: ${formatDate(task.startDate)}` : 'Definir data início'} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          {task.startDate ? (
            <span style={{ fontSize: '0.7rem', color: '#64748B', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Calendar size={11} color="#94A3B8" />{formatDate(task.startDate)}
            </span>
          ) : (
            <span style={{ display: 'flex', padding: '2px', borderRadius: '4px' }}><Calendar size={14} color="#CBD5E1" /></span>
          )}
        </div>

        {/* Arrow */}
        <span style={{ color: '#CBD5E1', fontSize: '0.7rem' }}>&rarr;</span>

        {/* Target date */}
        <div onClick={e => openPicker(e, 'targetDate', true)} className="tasks-icon-hover" title={task.targetDate ? `Fim: ${formatDate(task.targetDate)}` : 'Definir data fim'} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          {task.targetDate ? (
            <span style={{ fontSize: '0.7rem', color: '#64748B', whiteSpace: 'nowrap' }}>
              {formatDate(task.targetDate)}
            </span>
          ) : (
            <span style={{ display: 'flex', padding: '2px', borderRadius: '4px' }}><Calendar size={14} color="#CBD5E1" /></span>
          )}
        </div>

        {/* Delete (hover only) */}
        {!isMobile && <div className="tasks-row-actions" style={{ display: 'flex', alignItems: 'center', opacity: 0, transition: 'opacity 0.15s' }}>
          <button
            onClick={e => { e.stopPropagation(); onDelete(ft); }}
            title="Excluir"
            style={{ background: 'transparent', border: 'none', color: '#EF4444', padding: '4px', cursor: 'pointer', borderRadius: '4px', display: 'flex' }}
          >
            <Trash2 size={13} />
          </button>
        </div>}
      </div>
    </div>
  );
};

// ─── Kanban View ─────────────────────────────────────────────────────────────

interface KanbanViewProps {
  flatTasks: FlatTask[];
  onOpenTask: (ft: FlatTask) => void;
  onStatusChange: (ft: FlatTask, newStatus: TaskStatus) => void;
}

const KANBAN_STATUSES = ['Backlog', 'Todo', 'In Progress', 'In Review', 'Done'] as const;

const KanbanView: React.FC<KanbanViewProps> = ({ flatTasks, onOpenTask, onStatusChange }) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);

  const byStatus = useMemo(() => {
    const map = new Map<string, FlatTask[]>();
    KANBAN_STATUSES.forEach(s => map.set(s, []));
    for (const ft of flatTasks) {
      const s = ft.task.status || 'Backlog';
      if (!map.has(s)) map.set(s, []);
      map.get(s)!.push(ft);
    }
    // Sort each column by targetDate ascending (no date = end)
    map.forEach((items, key) => {
      map.set(key, [...items].sort((a, b) => {
        const aDate = a.task.targetDate ? new Date(a.task.targetDate).getTime() : Infinity;
        const bDate = b.task.targetDate ? new Date(b.task.targetDate).getTime() : Infinity;
        return aDate - bDate;
      }));
    });
    return map;
  }, [flatTasks]);

  const draggedFt = draggedTaskId
    ? flatTasks.find(ft => ft.task.id === draggedTaskId) ?? null
    : null;

  const handleDrop = (status: string) => {
    if (draggedFt && draggedFt.task.status !== status) {
      onStatusChange(draggedFt, status as TaskStatus);
    }
    setDraggedTaskId(null);
    setDragOverStatus(null);
  };

  return (
    <div style={{ display: 'flex', gap: '0.8rem', overflowX: 'auto', height: '100%', padding: '0 0 0.5rem 0', alignItems: 'flex-start' }}>
      {KANBAN_STATUSES.map(status => {
        const items = byStatus.get(status) || [];
        const cfg = TASK_STATUS_CONFIG[status];
        const isOver = dragOverStatus === status;
        return (
          <div
            key={status}
            onDragOver={e => { e.preventDefault(); setDragOverStatus(status); }}
            onDragLeave={() => setDragOverStatus(null)}
            onDrop={() => handleDrop(status)}
            style={{
              minWidth: '219px',
              maxWidth: '219px',
              flex: '0 0 219px',
              background: isOver ? '#EFF6FF' : '#F8FAFC',
              borderRadius: '12px',
              border: isOver ? '1.5px dashed #93C5FD' : '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              transition: 'background 0.15s, border-color 0.15s',
            }}
          >
            {/* Column header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.75rem 1rem',
              borderBottom: '1px solid #E2E8F0',
              background: 'white',
            }}>
              {cfg.icon}
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1E293B', flex: 1 }}>
                {cfg.label}
              </span>
              <span style={{
                fontSize: '0.7rem', fontWeight: 700,
                background: '#F1F5F9', color: '#64748B',
                borderRadius: '999px', padding: '2px 8px',
              }}>
                {items.length}
              </span>
            </div>

            {/* Cards */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', minHeight: '60px' }}>
              {items.map(ft => (
                <KanbanCard
                  key={ft.task.id}
                  ft={ft}
                  onOpen={onOpenTask}
                  isDragging={draggedTaskId === ft.task.id}
                  onDragStart={() => setDraggedTaskId(ft.task.id)}
                  onDragEnd={() => { setDraggedTaskId(null); setDragOverStatus(null); }}
                />
              ))}
              {items.length === 0 && (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#CBD5E1', fontSize: '0.75rem' }}>
                  Sem tarefas
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Kanban Card ─────────────────────────────────────────────────────────────

interface KanbanCardProps {
  ft: FlatTask;
  onOpen: (ft: FlatTask) => void;
  isDragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ ft, onOpen, isDragging, onDragStart, onDragEnd }) => {
  const { task, initiative, milestone } = ft;
  const typeStyle = task.type ? TYPE_STYLES[task.type] : null;

  // Date urgency
  const dateUrgency: 'overdue' | 'warning' | 'normal' | null = (() => {
    if (!task.targetDate || task.status === 'Done') return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.targetDate + 'T00:00:00');
    const diffDays = Math.floor((due.getTime() - today.getTime()) / 86400000);
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 2) return 'warning';
    return 'normal';
  })();

  const dateBadgeStyle: React.CSSProperties = (() => {
    if (dateUrgency === 'overdue') return { background: '#FEE2E2', color: '#DC2626', fontWeight: 700 };
    if (dateUrgency === 'warning') return { background: '#FEF3C7', color: '#D97706', fontWeight: 700 };
    return { background: '#F1F5F9', color: '#64748B', fontWeight: 500 };
  })();

  const formatDate = (d: string) => {
    try {
      const [, month, day] = d.split('-');
      const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
      return `${parseInt(day)} ${months[parseInt(month, 10) - 1]}`;
    } catch { return d; }
  };

  return (
    <div
      className="tasks-card"
      draggable
      onDragStart={e => { e.stopPropagation(); onDragStart?.(); }}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(ft)}
      style={{
        background: 'white',
        borderRadius: '8px',
        border: dateUrgency === 'overdue' ? '1px solid #FECACA' : dateUrgency === 'warning' ? '1px solid #FDE68A' : '1px solid #E2E8F0',
        padding: '0.6rem 0.75rem',
        cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        transition: 'box-shadow 0.15s, border-color 0.15s, opacity 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
      }}
    >
      {/* Top row: Type badge + date */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
        {typeStyle && task.type ? (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '3px',
            background: typeStyle.bg, color: typeStyle.text,
            borderRadius: '5px', fontSize: '0.62rem', fontWeight: 700,
            padding: '2px 6px',
          }}>
            {typeStyle.icon}{task.type}
          </span>
        ) : <span />}
        {task.targetDate && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '3px',
            fontSize: '0.62rem', borderRadius: '5px', padding: '2px 6px',
            flexShrink: 0,
            ...dateBadgeStyle,
          }}>
            {dateUrgency === 'overdue' && <span style={{ fontSize: '0.6rem' }}>{'\u26a0 '}</span>}
            {dateUrgency === 'warning' && <span style={{ fontSize: '0.6rem' }}>{'\u23f0 '}</span>}
            {formatDate(task.targetDate)}
          </span>
        )}
      </div>

      {/* Task name */}
      <div style={{
        fontSize: '0.78rem',
        fontWeight: 400,
        color: task.status === 'Done' ? '#94A3B8' : '#1E293B',
        textDecoration: task.status === 'Done' ? 'line-through' : 'none',
        lineHeight: 1.4,
      }}>
        {task.name}
      </div>

      {/* Project | Milestone */}
      <div style={{
        fontSize: '0.68rem',
        color: '#94A3B8',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {initiative.title} | {milestone.name}
      </div>
    </div>
  );
};

export default Tasks;
