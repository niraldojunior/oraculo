import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import * as XLSX from 'xlsx';
import { 
  Plus, 
  Trash2, 
  GripVertical,
  Clock,
  User,
  Database,
  Calendar,
  Check,  
  Tag,
  CheckCircle2,
  Edit2,
  ChevronDown,
  ChevronRight,
  X,
  Download,
  Upload,
  AlertCircle
} from 'lucide-react';
import type { 
  Initiative, 
  Collaborator, 
  System,
  MilestoneTask,
  MilestoneTaskType 
} from '../../types';
import { renderAvatar } from './SidebarComponents';

type ImportChange =
  | { type: 'create'; milestoneId: string; taskData: Omit<MilestoneTask, 'id'> }
  | { type: 'update'; milestoneId: string; taskId: string; fields: Partial<MilestoneTask> };

interface InitiativeTaskBoardProps {
  formData: Initiative;
  allCollaborators: Collaborator[];
  allSystems: System[];
  onTaskUpdate: (milestoneId: string, taskId: string, field: string, value: any) => void;
  onTaskDelete: (milestoneId: string, taskId: string) => void;
  onTaskAdd: (milestoneId: string, name: string) => void;
  onTaskReorder: (milestoneId: string, sourceId: string, targetId: string) => void;
  onMilestoneUpdate: () => void;
  onMilestoneDelete: (id: string) => void;
  onMilestoneReorder: (s: string, t: string) => void;
  setEditingMilestoneId: (id: string | null) => void;
  editingMilestoneId: string | null;
  setEditMilestoneText: (text: string) => void;
  editMilestoneText: string;
  activeMilestoneId?: string | null;
  onBulkImport?: (changes: ImportChange[]) => void;
}

export const InitiativeTaskBoard: React.FC<InitiativeTaskBoardProps> = ({
  formData,
  allCollaborators,
  allSystems,
  onTaskUpdate,
  onTaskDelete,
  onTaskAdd,
  onTaskReorder,
  onMilestoneUpdate,
  onMilestoneDelete,
  onMilestoneReorder,
  setEditingMilestoneId,
  editingMilestoneId,
  setEditMilestoneText,
  editMilestoneText,
  activeMilestoneId,
  onBulkImport
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<{ milestoneId: string; taskId: string } | null>(null);
  const [draggedMilestoneId, setDraggedMilestoneId] = useState<string | null>(null);
  const [expandedMilestoneIds, setExpandedMilestoneIds] = useState<Set<string>>(new Set());
  const [activePicker, setActivePicker] = useState<{ taskId: string; type: 'assignee' | 'system' | 'type' | 'dates' } | null>(null);
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<{ milestoneId: string; task: MilestoneTask } | null>(null);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize with all milestones expanded
  useEffect(() => {
    if (formData.milestones && expandedMilestoneIds.size === 0) {
      setExpandedMilestoneIds(new Set(formData.milestones.map(m => m.id)));
    }
  }, [formData.milestones]);

  // Ensure active milestone is expanded when filtered
  useEffect(() => {
    if (activeMilestoneId) {
      const next = new Set(expandedMilestoneIds);
      next.add(activeMilestoneId);
      setExpandedMilestoneIds(next);
    }
  }, [activeMilestoneId]);

  const toggleMilestone = (id: string) => {
    const next = new Set(expandedMilestoneIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedMilestoneIds(next);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      const [, month, day] = parts;
      const months = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
      return `${parseInt(day)} de ${months[parseInt(month) - 1]}`;
    } catch {
      return dateStr;
    }
  };

  const getTypeStyle = (type: MilestoneTaskType) => {
    switch (type) {
      case 'Melhoria': return { bg: '#F5F3FF', text: '#7C3AED', icon: <Tag size={10} /> };
      case 'Bug': return { bg: '#FEF2F2', text: '#DC2626', icon: <Tag size={10} /> };
      case 'Debito Técnico': return { bg: '#EFF6FF', text: '#2563EB', icon: <Tag size={10} /> };
      case 'Enabler': return { bg: '#F0FDFA', text: '#0D9488', icon: <Tag size={10} /> };
      case 'Feature': return { bg: '#EEF2FF', text: '#4F46E5', icon: <Tag size={10} /> };
      default: return { bg: '#F8FAFC', text: '#64748B', icon: <Tag size={10} /> };
    }
  };

  const milestonesToRender = activeMilestoneId 
    ? (formData.milestones || []).filter(m => m.id === activeMilestoneId)
    : (formData.milestones || []);

  const PRIORITY_LABELS: Record<number, string> = { 0: 'Sem Prioridade', 1: 'Urgente', 2: 'Alta', 3: 'Média', 4: 'Baixa' };

  const exportToExcel = () => {
    const headers = ['Milestone', 'Tarefa', 'Status', 'Prioridade', 'Tipo', 'Responsável', 'Sistemas', 'Data Início', 'Data Fim', 'Observação'];
    const rows: (string | null)[][] = [headers];

    (formData.milestones || []).forEach(milestone => {
      (milestone.tasks || []).forEach(task => {
        const assignee = allCollaborators.find(c => c.id === task.assigneeId);
        const taskSystemIds = task.systemIds?.length ? task.systemIds : task.systemId ? [task.systemId] : [];
        const systemNames = taskSystemIds
          .map(sid => allSystems.find(s => String(s.id) === String(sid)))
          .filter(Boolean)
          .map(s => s!.acronym || s!.name)
          .join(', ');

        rows.push([
          milestone.name,
          task.name,
          task.status || 'Backlog',
          PRIORITY_LABELS[task.priority ?? 0] || 'Sem Prioridade',
          task.type || '',
          assignee?.name || '',
          systemNames,
          task.startDate || '',
          task.targetDate || '',
          task.notes || ''
        ]);
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 30 }, { wch: 60 }, { wch: 15 }, { wch: 18 }, { wch: 18 },
      { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 40 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tarefas');
    const safeTitle = (formData.title || 'iniciativa').replace(/[/\\?%*:|"<>]/g, '_');
    XLSX.writeFile(wb, `${safeTitle}_tarefas.xlsx`);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const PRIORITY_LABEL_TO_VALUE: Record<string, number> = {
      'sem prioridade': 0, 'urgente': 1, 'alta': 2, 'média': 3, 'media': 3, 'baixa': 4
    };
    const VALID_STATUSES = ['Backlog', 'Todo', 'In Progress', 'In Review', 'Done', 'Canceled', 'Duplicate'];
    const VALID_TYPES = ['Feature', 'Melhoria', 'Bug', 'Debito Técnico', 'Enabler', 'DRI', 'Ambiente'];

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });

      if (rows.length < 2) { setImportSummary('Arquivo vazio ou sem dados.'); return; }

      const changes: ImportChange[] = [];
      let updated = 0, created = 0, skipped = 0;
      const errors: string[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !row[0] || !row[1]) continue;

        const milestoneName = String(row[0]).trim();
        const taskName = String(row[1]).trim();
        const statusStr = String(row[2] || '').trim();
        const prioridadeStr = String(row[3] || '').trim().toLowerCase();
        const tipoStr = String(row[4] || '').trim();
        const responsavelName = String(row[5] || '').trim();
        const sistemasStr = String(row[6] || '').trim();
        const startDate = String(row[7] || '').trim();
        const targetDate = String(row[8] || '').trim();
        const notes = String(row[9] || '').trim();

        const milestone = (formData.milestones || []).find(
          m => m.name.toLowerCase().trim() === milestoneName.toLowerCase()
        );
        if (!milestone) {
          errors.push(`Linha ${i + 1}: milestone "${milestoneName}" não encontrado`);
          skipped++;
          continue;
        }

        const assignee = responsavelName
          ? allCollaborators.find(c => c.name.toLowerCase().trim() === responsavelName.toLowerCase())
          : null;

        // Multi-system: parse comma-separated acronyms/names
        const resolvedSystemIds: string[] = sistemasStr
          ? sistemasStr.split(',').map(s => s.trim()).filter(Boolean).map(token => {
              const found = allSystems.find(s =>
                (s.acronym || '').toLowerCase() === token.toLowerCase() ||
                s.name.toLowerCase() === token.toLowerCase()
              );
              return found?.id;
            }).filter((id): id is string => !!id)
          : [];

        const finalStatus = VALID_STATUSES.includes(statusStr) ? statusStr as MilestoneTask['status'] : 'Backlog' as MilestoneTask['status'];
        const finalPriority = prioridadeStr in PRIORITY_LABEL_TO_VALUE ? PRIORITY_LABEL_TO_VALUE[prioridadeStr] as 0|1|2|3|4 : 0 as 0|1|2|3|4;
        const finalType = VALID_TYPES.includes(tipoStr) ? tipoStr as MilestoneTaskType : null;

        const existingTask = (milestone.tasks || []).find(
          t => t.name.toLowerCase().trim() === taskName.toLowerCase()
        );

        if (existingTask) {
          const fields: Partial<MilestoneTask> = {};
          if (statusStr && existingTask.status !== finalStatus) fields.status = finalStatus;
          if (prioridadeStr && (existingTask.priority ?? 0) !== finalPriority) fields.priority = finalPriority;
          if (tipoStr && existingTask.type !== finalType) fields.type = finalType;
          if (responsavelName && existingTask.assigneeId !== (assignee?.id ?? null)) fields.assigneeId = assignee?.id ?? null;
          if (sistemasStr && JSON.stringify(existingTask.systemIds || []) !== JSON.stringify(resolvedSystemIds)) {
            fields.systemIds = resolvedSystemIds;
            fields.systemId = resolvedSystemIds[0] || null;
          }
          if (startDate !== (existingTask.startDate || '')) fields.startDate = startDate || null;
          if (targetDate !== (existingTask.targetDate || '')) fields.targetDate = targetDate || null;
          if (notes !== (existingTask.notes || '')) fields.notes = notes || undefined;

          if (Object.keys(fields).length > 0) {
            changes.push({ type: 'update', milestoneId: milestone.id, taskId: existingTask.id, fields });
            updated++;
          }
        } else {
          changes.push({
            type: 'create',
            milestoneId: milestone.id,
            taskData: {
              name: taskName,
              status: finalStatus,
              priority: finalPriority,
              type: finalType,
              milestoneId: milestone.id,
              assigneeId: assignee?.id ?? null,
              systemId: resolvedSystemIds[0] || null,
              systemIds: resolvedSystemIds,
              startDate: startDate || null,
              targetDate: targetDate || null,
              notes: notes || undefined,
            }
          });
          created++;
        }
      }

      if (changes.length > 0 && onBulkImport) onBulkImport(changes);

      const summaryLines = [
        `Importação concluída:`,
        `• ${updated} tarefa(s) atualizada(s)`,
        `• ${created} tarefa(s) criada(s)`,
        skipped > 0 ? `• ${skipped} linha(s) ignorada(s)` : null,
        errors.length > 0 ? `\nAvisos:\n${errors.slice(0, 5).join('\n')}` : null,
      ].filter(Boolean).join('\n');
      setImportSummary(summaryLines);
    } catch {
      setImportSummary('Erro ao processar o arquivo. Verifique o formato.');
    }

    e.target.value = '';
  };

  const updateEditingTaskField = (field: keyof MilestoneTask, value: any) => {
    if (!editingTask) return;
    onTaskUpdate(editingTask.milestoneId, editingTask.task.id, field as string, value);
    setEditingTask(prev => (prev ? { ...prev, task: { ...prev.task, [field]: value } } : prev));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingBottom: '4rem', width: '100%', padding: '0.75rem 0' }}>

      {editingTask && ReactDOM.createPortal(
        <div
          onClick={() => setEditingTask(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.45)',
            zIndex: 1000003,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(760px, 95vw)',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#fff',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
              padding: '1rem 1rem 1.25rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#0F172A' }}>Editar tarefa</h3>
              <button onClick={() => setEditingTask(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <label style={{ display: 'grid', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>Título</span>
                <textarea
                  value={editingTask.task.name || ''}
                  onChange={(e) => updateEditingTaskField('name', e.target.value)}
                  rows={2}
                  style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0.6rem', fontFamily: 'inherit' }}
                />
              </label>

              <label style={{ display: 'grid', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>Descrição</span>
                <textarea
                  value={editingTask.task.notes || ''}
                  onChange={(e) => updateEditingTaskField('notes', e.target.value || undefined)}
                  rows={6}
                  style={{ width: '100%', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0.6rem', fontFamily: 'inherit' }}
                />
              </label>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Toolbar: Export / Import */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', padding: '0 1rem 0.5rem 1rem' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={handleImportFile}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Importar tarefas de planilha Excel"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '7px',
            padding: '0.3rem 0.7rem', fontSize: '0.72rem', fontWeight: 600,
            color: '#475569', cursor: 'pointer', transition: 'all 0.15s'
          }}
        >
          <Upload size={13} /> Importar
        </button>
        <button
          onClick={exportToExcel}
          title="Exportar tarefas para Excel"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '7px',
            padding: '0.3rem 0.7rem', fontSize: '0.72rem', fontWeight: 600,
            color: '#475569', cursor: 'pointer', transition: 'all 0.15s'
          }}
        >
          <Download size={13} /> Exportar
        </button>
      </div>

      {/* Import Summary Banner */}
      {importSummary && (
        <div style={{
          margin: '0 1rem 0.5rem 1rem', padding: '0.6rem 0.85rem',
          background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px',
          display: 'flex', alignItems: 'flex-start', gap: '0.5rem'
        }}>
          <AlertCircle size={14} color="#16A34A" style={{ marginTop: '2px', flexShrink: 0 }} />
          <pre style={{ margin: 0, fontSize: '0.72rem', color: '#166534', fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>
            {importSummary}
          </pre>
          <button onClick={() => setImportSummary(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#166534', padding: 0, flexShrink: 0 }}>
            <X size={13} />
          </button>
        </div>
      )}

      {/* Milestones and Tasks Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {milestonesToRender.map(milestone => {
          const isExpanded = expandedMilestoneIds.has(milestone.id);
          const tasks = milestone.tasks || [];
          const doneTasks = tasks.filter(t => t.status === 'Done').length;
          const progress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

          return (
            <div key={milestone.id} style={{ display: 'flex', flexDirection: 'column' }}>
              
              {/* Milestone Card Header */}
              <div 
                draggable
                onDragStart={() => setDraggedMilestoneId(milestone.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedMilestoneId && draggedMilestoneId !== milestone.id) {
                    onMilestoneReorder(draggedMilestoneId, milestone.id);
                  }
                  setDraggedMilestoneId(null);
                }}
                className="milestone-card"
                onClick={() => toggleMilestone(milestone.id)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  background: '#F8FAFC', 
                  padding: '0.55rem 0.85rem', 
                  borderRadius: '10px', 
                  border: isExpanded ? '1px solid #CBD5E1' : '1px solid #E2E8F0',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  opacity: draggedMilestoneId === milestone.id ? 0.4 : 1,
                  boxShadow: isExpanded ? '0 2px 4px rgba(0,0,0,0.02)' : 'none',
                  marginLeft: '1rem',
                  marginRight: '1rem'
                }}
              >
                <div style={{ color: '#94A3B8', cursor: 'grab', display: 'flex' }} className="milestone-drag">
                  <GripVertical size={14} />
                </div>
                
                <div style={{ color: progress === 100 ? '#10B981' : '#3B82F6', display: 'flex' }}>
                  <CheckCircle2 size={18} fill={progress === 100 ? '#10B981' : 'transparent'} color={progress === 100 ? '#FFF' : '#3B82F6'} strokeWidth={2.5} />
                </div>

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {editingMilestoneId === milestone.id ? (
                    <input 
                      autoFocus
                      value={editMilestoneText}
                      onChange={e => setEditMilestoneText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') onMilestoneUpdate();
                        if (e.key === 'Escape') setEditingMilestoneId(null);
                      }}
                      onClick={e => e.stopPropagation()}
                      onBlur={onMilestoneUpdate}
                      style={{ border: '1px solid #3B82F6', borderRadius: '4px', fontSize: '0.9rem', padding: '2px 8px', width: '100%', outline: 'none' }}
                    />
                  ) : (
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1E293B' }}>{milestone.name}</span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748B' }}>{progress}%</span>
                  <div className="milestone-actions" style={{ display: 'flex', gap: '0.4rem', opacity: 0, transition: 'opacity 0.2s' }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingMilestoneId(milestone.id); setEditMilestoneText(milestone.name); }}
                      style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                      className="btn-icon-hover"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onMilestoneDelete(milestone.id); }}
                      style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                      className="btn-icon-hover"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {isExpanded ? <ChevronDown size={16} color="#94A3B8" /> : <ChevronRight size={16} color="#94A3B8" />}
                </div>
              </div>

              {/* Collapsible Task List with Indentation and Guide Line */}
              {isExpanded && (
                <div style={{ 
                  marginTop: '-2px', 
                  paddingLeft: '1rem', 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0' 
                }}>
                  {/* Task rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', paddingTop: '0.2rem', paddingBottom: '0.25rem' }}>
                    {tasks.map((task) => {
                      const typeStyle = task.type ? getTypeStyle(task.type) : null;
                      return (
                        <div
                          key={task.id}
                          draggable
                          onClick={() => setEditingTask({ milestoneId: milestone.id, task })}
                          onDragStart={() => setDraggedTaskId({ milestoneId: milestone.id, taskId: task.id })}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (draggedTaskId && draggedTaskId.milestoneId === milestone.id) {
                              onTaskReorder(milestone.id, draggedTaskId.taskId, task.id);
                            }
                            setDraggedTaskId(null);
                          }}
                          style={{
                            display: 'flex',
                            padding: '1px 0.5rem',
                            background: draggedTaskId?.taskId === task.id ? '#F1F5F9' : 'transparent',
                            gap: '0.5rem',
                            alignItems: 'center',
                            transition: 'all 0.15s ease',
                            position: 'relative',
                            opacity: draggedTaskId?.taskId === task.id ? 0.5 : 1,
                            minHeight: '24px'
                          }}
                          className="task-hover-row"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <div className="drag-handle" style={{ color: '#CBD5E1', cursor: 'grab', opacity: 0 }}>
                              <GripVertical size={13} />
                            </div>
                            <div 
                              onClick={(e) => { e.stopPropagation(); onTaskUpdate(milestone.id, task.id, 'status', task.status === 'Done' ? 'Backlog' : 'Done'); }}
                              style={{ 
                                width: '14px', height: '14px', borderRadius: '3px', border: task.status === 'Done' ? 'none' : '1.5px solid #CBD5E1',
                                background: task.status === 'Done' ? '#3B82F6' : '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                              }}
                            >
                              {task.status === 'Done' && <Check size={10} color="white" strokeWidth={4} />}
                            </div>
                          </div>

                          <textarea
                            value={task.name}
                            title={focusedTaskId !== task.id ? task.name : undefined}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => onTaskUpdate(milestone.id, task.id, 'name', e.target.value)}
                            onFocus={() => setFocusedTaskId(task.id)}
                            onBlur={() => setFocusedTaskId(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.currentTarget.blur();
                              }
                            }}
                            rows={1}
                            style={{ 
                              fontSize: '0.875rem', 
                              fontWeight: 450, 
                              color: task.status === 'Done' ? '#94A3B8' : '#334155',
                              textDecoration: task.status === 'Done' ? 'line-through' : 'none', 
                              background: 'transparent',
                              border: 'none', 
                              outline: 'none', 
                              flex: 1, 
                              padding: 0, 
                              fontFamily: 'inherit',
                              resize: 'none',
                              lineHeight: '1.4',
                              height: focusedTaskId === task.id ? 'auto' : '20px',
                              whiteSpace: focusedTaskId === task.id ? 'normal' : 'nowrap',
                              textOverflow: focusedTaskId === task.id ? 'unset' : 'ellipsis',
                              overflow: focusedTaskId === task.id ? 'visible' : 'hidden',
                              wordBreak: 'break-word',
                              marginTop: '2px'
                            }}
                          />

                          <div className="task-tools" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: 'auto', paddingRight: '0.5rem' }}>
                            <div className="task-edit-tools" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', opacity: 0, transition: 'opacity 0.2s', position: 'relative' }}>
                              <button onClick={(e) => { e.stopPropagation(); setActivePicker(activePicker?.taskId === task.id && activePicker?.type === 'assignee' ? null : { taskId: task.id, type: 'assignee' }); }} style={{ background: 'transparent', border: 'none', color: '#94A3B8', padding: '2px', cursor: 'pointer' }} title="Responsável"><User size={13} /></button>
                              <button onClick={(e) => { e.stopPropagation(); setActivePicker(activePicker?.taskId === task.id && activePicker?.type === 'system' ? null : { taskId: task.id, type: 'system' }); }} style={{ background: 'transparent', border: 'none', color: '#94A3B8', padding: '2px', cursor: 'pointer' }} title="Sistema"><Database size={13} /></button>
                              <button onClick={(e) => { e.stopPropagation(); setActivePicker(activePicker?.taskId === task.id && activePicker?.type === 'type' ? null : { taskId: task.id, type: 'type' }); }} style={{ background: 'transparent', border: 'none', color: '#94A3B8', padding: '2px', cursor: 'pointer' }} title="Tipo"><Tag size={13} /></button>
                              <button onClick={(e) => { e.stopPropagation(); setActivePicker(activePicker?.taskId === task.id && activePicker?.type === 'dates' ? null : { taskId: task.id, type: 'dates' }); }} style={{ background: 'transparent', border: 'none', color: '#94A3B8', padding: '2px', cursor: 'pointer' }} title="Datas"><Calendar size={13} /></button>

                              {/* Picker Popovers */}
                              {activePicker?.taskId === task.id && (
                                <div 
                                  onClick={(e) => e.stopPropagation()}
                                  style={{ 
                                    position: 'absolute', 
                                    top: '100%', 
                                    right: 0, 
                                    marginTop: '5px',
                                    background: 'white', 
                                    border: '1px solid #E2E8F0', 
                                    borderRadius: '8px', 
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', 
                                    zIndex: 100,
                                    padding: '0.5rem',
                                    minWidth: '180px'
                                  }}
                                >
                                  {activePicker.type === 'assignee' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', padding: '2px 8px', marginBottom: '4px', textTransform: 'uppercase' }}>Atribuir a</div>
                                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                        {/* Clear option */}
                                        <div 
                                          onClick={() => { onTaskUpdate(milestone.id, task.id, 'assigneeId', null); setActivePicker(null); }}
                                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9', marginBottom: '2px' }}
                                          className="picker-item-hover"
                                        >
                                          <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <X size={10} color="#94A3B8" />
                                          </div>
                                          <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 500 }}>Nenhum</span>
                                        </div>

                                        {allCollaborators.filter(c => (formData.memberIds || []).includes(c.id)).map(c => (
                                          <div 
                                            key={c.id} 
                                            onClick={() => { onTaskUpdate(milestone.id, task.id, 'assigneeId', c.id); setActivePicker(null); }}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', background: task.assigneeId === c.id ? '#F1F5F9' : 'transparent' }}
                                            className="picker-item-hover"
                                          >
                                            {renderAvatar(c.id, allCollaborators, 18)}
                                            <span style={{ fontSize: '0.75rem', color: '#1E293B' }}>{c.name}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {activePicker.type === 'system' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', padding: '2px 8px', marginBottom: '4px', textTransform: 'uppercase' }}>Sistema Impactado</div>
                                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                        {/* Clear option */}
                                        <div 
                                          onClick={() => { onTaskUpdate(milestone.id, task.id, 'systemId', null); setActivePicker(null); }}
                                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9', marginBottom: '2px' }}
                                          className="picker-item-hover"
                                        >
                                          <X size={12} color="#94A3B8" />
                                          <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 500 }}>Nenhum</span>
                                        </div>

                                        {allSystems.filter(s => (formData.impactedSystemIds || []).includes(s.id)).map(s => (
                                          <div 
                                            key={s.id} 
                                            onClick={() => { onTaskUpdate(milestone.id, task.id, 'systemId', s.id); setActivePicker(null); }}
                                            style={{ padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', background: task.systemId === s.id ? '#F1F5F9' : 'transparent' }}
                                            className="picker-item-hover"
                                          >
                                            <span style={{ fontSize: '0.75rem', color: '#1E293B' }}>{s.name}{s.acronym ? ` (${s.acronym})` : ''}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {activePicker.type === 'type' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', padding: '2px 8px', marginBottom: '4px', textTransform: 'uppercase' }}>Tipo de Tarefa</div>
                                      
                                      {/* Clear option */}
                                      <div 
                                        onClick={() => { onTaskUpdate(milestone.id, task.id, 'type', null); setActivePicker(null); }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9', marginBottom: '2px' }}
                                        className="picker-item-hover"
                                      >
                                        <X size={12} color="#94A3B8" />
                                        <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 500 }}>Nenhuma</span>
                                      </div>

                                      {['Feature', 'Melhoria', 'Bug', 'Debito Técnico', 'Enabler'].map(t => {
                                        const style = getTypeStyle(t as any);
                                        return (
                                          <div 
                                            key={t} 
                                            onClick={() => { onTaskUpdate(milestone.id, task.id, 'type', t); setActivePicker(null); }}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', background: task.type === t ? '#F1F5F9' : 'transparent' }}
                                            className="picker-item-hover"
                                          >
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: style.text }} />
                                            <span style={{ fontSize: '0.75rem', color: '#1E293B' }}>{t}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {activePicker.type === 'dates' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '4px' }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8' }}>INÍCIO</span>
                                        <input 
                                          type="date" 
                                          value={task.startDate || ''} 
                                          onChange={e => onTaskUpdate(milestone.id, task.id, 'startDate', e.target.value)}
                                          style={{ border: '1px solid #E2E8F0', borderRadius: '4px', padding: '4px', fontSize: '0.75rem', width: '100%' }}
                                        />
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8' }}>PRAZO FINAL</span>
                                        <input 
                                          type="date" 
                                          value={task.targetDate || ''} 
                                          onChange={e => onTaskUpdate(milestone.id, task.id, 'targetDate', e.target.value)}
                                          style={{ border: '1px solid #E2E8F0', borderRadius: '4px', padding: '4px', fontSize: '0.75rem', width: '100%' }}
                                        />
                                      </div>
                                      <button 
                                        onClick={() => setActivePicker(null)}
                                        style={{ background: '#3B82F6', color: 'white', border: 'none', borderRadius: '4px', padding: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                      >
                                        Pronto
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <div style={{ width: '1px', height: '12px', background: '#E2E8F0', margin: '0 0.2rem' }} className="task-edit-tools" />

                            {(task.startDate || task.targetDate) && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#64748B', background: '#F1F5F9', padding: '3px 8px', borderRadius: '4px' }}>
                                <Clock size={14} />
                                {task.startDate && formatDate(task.startDate)}
                                {task.startDate && task.targetDate && '-'}
                                {task.targetDate && formatDate(task.targetDate)}
                              </div>
                            )}
                            
                            {task.type && typeStyle && (
                              <div style={{ background: typeStyle.bg, color: typeStyle.text, padding: '3px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 800 }}>{task.type}</div>
                            )}
                            {task.systemId && (() => {
                              const sys = allSystems.find(s => String(s.id) === String(task.systemId));
                              return (
                                <div style={{ background: '#EEF2FF', color: '#4F46E5', padding: '3px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 800 }}>
                                  {sys?.acronym || sys?.name || 'SYS'}
                                </div>
                              );
                            })()}
                            {task.assigneeId && renderAvatar(task.assigneeId, allCollaborators, 18)}
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', paddingLeft: '0.2rem' }}>
                              <button onClick={(e) => { e.stopPropagation(); onTaskDelete(milestone.id, task.id); }} className="delete-task-btn" style={{ background: 'transparent', border: 'none', color: '#EF4444', padding: '2px', cursor: 'pointer', opacity: 0 }}><Trash2 size={13} /></button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add task Input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '4px 0.5rem 1rem 0', marginLeft: '0' }}>
                    <Plus size={13} color="#94A3B8" />
                    <input
                      placeholder="Nova tarefa..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          onTaskAdd(milestone.id, e.currentTarget.value.trim());
                          e.currentTarget.value = '';
                        }
                      }}
                      style={{ background: 'transparent', border: 'none', outline: 'none', flex: 1, fontSize: '0.8125rem', color: '#94A3B8' }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .milestone-card:hover { border-color: #3B82F6 !important; background: #FFF !important; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .milestone-card:hover .milestone-actions { opacity: 1 !important; }
        .task-hover-row:hover { background: #F8FAFC !important; box-shadow: 0 0 0 1px #E2E8F0; z-index: 1; }
        .task-hover-row:hover .drag-handle { opacity: 1 !important; }
        .task-hover-row:hover .delete-task-btn { opacity: 1 !important; }
        .task-hover-row:hover .task-edit-tools { opacity: 1 !important; }
        .btn-icon-hover:hover { background: #F1F5F9; }
        .picker-item-hover:hover { background: #F8FAFC !important; }
      `}</style>
    </div>
  );
};
