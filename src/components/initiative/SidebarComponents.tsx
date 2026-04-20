import React from 'react';
import { 
  Clock, 
  AlertCircle, 
  Building2, 
  User, 
  Users, 
  Database, 
  Calendar, 
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  GripVertical,
  Edit2,
  Trash2,
  Plus,
  Zap,
  Briefcase,
  Diamond,
  LayoutGrid,
  Bug,
  Layers,
  X
} from 'lucide-react';
import type { Initiative, Collaborator, System, MilestoneStatus } from '../../types';
import { StatusIcon } from '../common/StatusIcon';
import { PriorityIcon } from '../common/PriorityPicker';

// --- Shared Types ---
interface SidebarSectionProps {
  formData: Initiative;
  setFormData: (data: Initiative) => void;
  allCollaborators: Collaborator[];
  allSystems: System[];
}

// --- Helper Components ---
export const getTypeIcon = (type: string, size: number = 20, color?: string) => {
  let defaultColor = color || 'inherit';
  if (!color) {
    if (type === '1- Estratégico') defaultColor = '#EF4444'; // Red-500
    else if (type === '2- Projeto') defaultColor = '#3B82F6'; // Blue-500
    else if (type === '3- Fast Track') defaultColor = '#10B981'; // Emerald-500
    else if (type === '4- PBI') defaultColor = '#D97706'; // Amber-600
  }
  const iconStyle = { color: defaultColor };
  switch (type) {
    case '1- Estratégico': return <Diamond size={size} style={iconStyle} />;
    case '2- Projeto': return <Briefcase size={size} style={iconStyle} />;
    case '3- Fast Track': return <Zap size={size} style={iconStyle} />;
    case '4- PBI': return <Bug size={size} style={iconStyle} />;
    default: return <LayoutGrid size={size} style={iconStyle} />;
  }
};

export const renderAvatar = (collaboratorId: string | null | undefined, allCollaborators: Collaborator[], size: number = 20) => {
  const collaborator = allCollaborators.find(c => c.id === collaboratorId);
  if (!collaborator) return <div style={{ width: size, height: size, background: '#D1D5DB', borderRadius: '50%' }} />;
  
  if (collaborator.photoUrl) {
    return <img src={collaborator.photoUrl} alt={collaborator.name} title={collaborator.name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />;
  }
  
  const initials = collaborator.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div title={collaborator.name} style={{ width: size, height: size, background: '#3B82F6', color: '#FFF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: `${size / 2.5}px`, fontWeight: 700 }}>
      {initials}
    </div>
  );
};

// --- Main Components ---

export const InitiativeProperties: React.FC<SidebarSectionProps & { 
  editingField: string | null;
  setEditingField: (field: string | null) => void;
  isRequester?: boolean;
  isNew?: boolean;
  handleStatusChange: (status: MilestoneStatus, action: string) => void;
  setShowPriorityMenu: (pos: { top: number; left: number } | null) => void;
  demandantDirectorates: string[];
}> = ({ 
  formData, 
  setFormData, 
  allCollaborators, 
  allSystems,
  editingField,
  setEditingField,
  handleStatusChange,
  setShowPriorityMenu,
  demandantDirectorates
}) => {
  return (
    <div style={{ padding: '0 1rem 0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      {/* Data de Solicitação */}
      <div style={{ display: 'flex', alignItems: 'center', minHeight: '2.1rem' }}>
        <div style={{ width: '110px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#64748B' }}>
          <CalendarCheck size={14} />
          <span style={{ fontSize: '0.7rem', fontWeight: 400 }}>Solicitação</span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <input
            type="date"
            value={formData.requestDate || ''}
            onChange={e => setFormData({ ...formData, requestDate: e.target.value })}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#1E293B',
              fontSize: '0.78rem',
              padding: 0,
              outline: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              width: '115px'
            }}
          />
        </div>
      </div>

      {/* Tipo de Demanda */}
      <div style={{ display: 'flex', alignItems: 'center', minHeight: '1.9rem' }}>
        <div style={{ width: '110px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#64748B' }}>
          <Layers size={14} />
          <span style={{ fontSize: '0.7rem', fontWeight: 400 }}>Tipo</span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          {editingField === 'type' ? (
            <select 
              autoFocus
              value={formData.type}
              onBlur={() => setEditingField(null)}
              onChange={e => setFormData({ ...formData, type: e.target.value as any })}
              style={{ border: 'none', background: '#F8FAFC', fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', width: '100%', fontWeight: 500 }}
            >
              {['1- Estratégico', '2- Projeto', '3- Fast Track', '4- PBI'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          ) : (
            <div 
              onClick={() => setEditingField('type')}
              style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#1E293B', fontSize: '0.75rem' }}
            >
              {getTypeIcon(formData.type, 16)} <span style={{ whiteSpace: 'nowrap' }}>{formData.type.split('- ')[1] || formData.type}</span>
            </div>
          )}
        </div>
      </div>

      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', minHeight: '1.9rem' }}>
        <div style={{ width: '110px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#64748B' }}>
          <Clock size={14} />
          <span style={{ fontSize: '0.7rem', fontWeight: 400 }}>Status</span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          {editingField === 'status' ? (
            <select 
              autoFocus
              value={formData.status}
              onBlur={() => setEditingField(null)}
              onChange={e => handleStatusChange(e.target.value as MilestoneStatus, 'Edição rápida')}
              style={{ border: 'none', background: '#F8FAFC', fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', width: '100%', fontWeight: 500 }}
            >
              {['1- Backlog', '2- Discovery', '3- Planejamento', '4- Execução', '5- Implantação', '6- Concluído', 'Suspenso', 'Cancelado'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          ) : (
            <div 
              onClick={() => setEditingField('status')}
              style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#1E293B', fontSize: '0.75rem' }}
            >
              <StatusIcon status={formData.status} size={16} /> <span style={{ whiteSpace: 'nowrap' }}>{formData.status.split('- ')[1] || formData.status}</span>
            </div>
          )}
        </div>
      </div>

      {/* Prioridade */}
      <div style={{ display: 'flex', alignItems: 'center', minHeight: '1.9rem' }}>
        <div style={{ width: '110px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#64748B' }}>
          <AlertCircle size={14} />
          <span style={{ fontSize: '0.7rem', fontWeight: 400 }}>Prioridade</span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <div 
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setShowPriorityMenu({ top: rect.top + rect.height + 5, left: rect.left });
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500, color: '#1E293B', fontSize: '0.75rem' }}
          >
            <PriorityIcon value={formData.priority} size={14} /> 
            <span>{formData.priority === 1 ? 'Crítica' : formData.priority === 2 ? 'Alta' : formData.priority === 3 ? 'Média' : formData.priority === 4 ? 'Baixa' : 'Nenhuma'}</span>
          </div>
        </div>
      </div>

      {/* Demandante */}
      <div style={{ display: 'flex', alignItems: 'center', minHeight: '1.9rem' }}>
        <div style={{ width: '110px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#64748B' }}>
          <Building2 size={14} />
          <span style={{ fontSize: '0.7rem', fontWeight: 400 }}>Demandante</span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          {editingField === 'origin' ? (
            <select 
              autoFocus
              value={formData.originDirectorate || ''}
              onBlur={() => setEditingField(null)}
              onChange={e => setFormData({ ...formData, originDirectorate: e.target.value })}
              style={{ border: 'none', background: '#F8FAFC', fontSize: '0.75rem', padding: '2px 6px', width: '100%', borderRadius: '4px', fontWeight: 500 }}
            >
              <option value="">Selecione...</option>
              {[...demandantDirectorates].sort((a, b) => a.localeCompare(b)).map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          ) : (
            <div onClick={() => setEditingField('origin')} style={{ cursor: 'pointer', width: '100%', fontWeight: 500, color: '#1E293B', fontSize: '0.75rem', padding: 0 }}>
              {formData.originDirectorate || '-'}
            </div>
          )}
        </div>
      </div>

      {/* Owner */}
      <div style={{ display: 'flex', alignItems: 'center', minHeight: '1.9rem' }}>
        <div style={{ width: '110px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#64748B' }}>
          <User size={14} />
          <span style={{ fontSize: '0.7rem', fontWeight: 400 }}>Owner</span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          {editingField === 'owner' ? (
            <input 
              autoFocus
              type="text"
              value={formData.customerOwner || ''}
              onBlur={() => setEditingField(null)}
              onChange={e => setFormData({ ...formData, customerOwner: e.target.value })}
              style={{ border: 'none', background: '#F8FAFC', fontSize: '0.75rem', padding: '2px 6px', width: '100%', borderRadius: '4px', fontWeight: 500 }}
            />
          ) : (
            <div onClick={() => setEditingField('owner')} style={{ cursor: 'pointer', width: '100%', fontWeight: 500, color: '#1E293B', fontSize: '0.75rem', textTransform: 'uppercase', padding: 0 }}>
              {formData.customerOwner || '-'}
            </div>
          )}
        </div>
      </div>

      {/* Líder */}
      <div style={{ display: 'flex', alignItems: 'center', minHeight: '1.9rem' }}>
        <div style={{ width: '110px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#64748B' }}>
          <User size={14} />
          <span style={{ fontSize: '0.7rem', fontWeight: 400 }}>Líder</span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          {editingField === 'leader' ? (
            <select 
              autoFocus
              value={formData.leaderId || ''}
              onBlur={() => setEditingField(null)}
              onChange={e => setFormData({ ...formData, leaderId: e.target.value })}
              style={{ border: 'none', background: '#F8FAFC', fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', width: '100%', fontWeight: 500 }}
            >
              <option value="">Selecione...</option>
              {allCollaborators.filter(c => ['Head', 'Director', 'Manager', 'Lead Engineer'].includes(c.role)).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          ) : (
            <div 
              onClick={() => setEditingField('leader')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', width: '100%', fontWeight: 500, color: '#1E293B', fontSize: '0.75rem' }}
            >
              {renderAvatar(formData.leaderId, allCollaborators, 22)}
              <span style={{ whiteSpace: 'nowrap' }}>{allCollaborators.find(c => c.id === formData.leaderId)?.name || '-'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Membros */}
      <div style={{ display: 'flex', alignItems: 'flex-start', padding: '0.2rem 0' }}>
        <div style={{ width: '110px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#64748B', minHeight: '1.5rem' }}>
          <Users size={14} />
          <span style={{ fontSize: '0.7rem', fontWeight: 400 }}>Membros</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {(formData.memberIds || []).map(mid => (
              <div key={mid} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F1F5F9', padding: '0.3rem 0.6rem', borderRadius: '16px', fontSize: '0.72rem', border: '1px solid #E2E8F0', fontWeight: 400 }}>
                {renderAvatar(mid, allCollaborators, 18)}
                <span>{allCollaborators.find(c => c.id === mid)?.name.split(' ')[0]}</span>
                <X size={12} style={{ cursor: 'pointer', color: '#94A3B8' }} onClick={(e) => {
                  e.stopPropagation();
                  setFormData({ ...formData, memberIds: (formData.memberIds || []).filter(id => id !== mid) });
                }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', width: '100%' }}>
            <select 
              value=""
              onChange={e => {
                if (!e.target.value) return;
                if (!(formData.memberIds || []).includes(e.target.value)) {
                  setFormData({ ...formData, memberIds: [...(formData.memberIds || []), e.target.value] });
                }
              }}
              style={{ border: 'none', background: 'transparent', fontSize: '0.8rem', color: '#64748B', padding: 0, outline: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <option value="">+ Adicionar Membro</option>
              {allCollaborators
                .filter(c => !(formData.memberIds || []).includes(c.id))
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sistemas Envolvidos */}
      <div style={{ display: 'flex', alignItems: 'flex-start', padding: '0.2rem 0' }}>
        <div style={{ width: '110px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#64748B', minHeight: '1.5rem' }}>
          <Database size={14} />
          <span style={{ fontSize: '0.7rem', fontWeight: 400 }}>Sistemas</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {(formData.impactedSystemIds || []).map(sid => {
              const sys = allSystems.find(s => s.id === sid);
              return (
                <div key={sid} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#EEF2FF', color: '#4F46E5', padding: '0.3rem 0.6rem', borderRadius: '16px', fontSize: '0.72rem', border: '1px solid #E0E7FF', fontWeight: 500 }}>
                  <span>{sys?.name || sid}</span>
                  <X size={12} style={{ cursor: 'pointer', color: '#94A3B8' }} onClick={(e) => {
                    e.stopPropagation();
                    setFormData({ ...formData, impactedSystemIds: (formData.impactedSystemIds || []).filter(id => id !== sid) });
                  }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', width: '100%' }}>
            <select 
              value=""
              onChange={e => {
                if (!e.target.value) return;
                if (!(formData.impactedSystemIds || []).includes(e.target.value)) {
                  setFormData({ ...formData, impactedSystemIds: [...(formData.impactedSystemIds || []), e.target.value] });
                }
              }}
              style={{ border: 'none', background: 'transparent', fontSize: '0.8rem', color: '#64748B', padding: 0, outline: 'none', cursor: 'pointer' }}
            >
              <option value="">+ Adicionar Sistema</option>
              {allSystems
                .filter(s => !(formData.impactedSystemIds || []).includes(s.id))
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Datas */}
      <div style={{ display: 'flex', alignItems: 'center', minHeight: '2.1rem' }}>
        <div style={{ width: '110px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#64748B' }}>
          <Calendar size={14} />
          <span style={{ fontSize: '0.7rem', fontWeight: 400 }}>Datas</span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <input 
            type="date" 
            value={formData.startDate || ''} 
            readOnly={['4- Execução', '5- Implantação', '6- Concluído'].includes(formData.status)}
            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
            style={{ 
              border: 'none', 
              background: 'transparent', 
              color: '#1E293B', 
              fontSize: '0.78rem', 
              padding: 0, 
              outline: 'none', 
              cursor: ['4- Execução', '5- Implantação', '6- Concluído'].includes(formData.status) ? 'default' : 'pointer', 
              fontWeight: 500, 
              width: '95px' 
            }}
          />
          <span style={{ color: '#9CA3AF', margin: '0 2px' }}>→</span>
          <input 
            type="date" 
            value={formData.endDate || ''} 
            readOnly={['4- Execução', '5- Implantação', '6- Concluído'].includes(formData.status)}
            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
            style={{ 
              border: 'none', 
              background: 'transparent', 
              color: '#1E293B', 
              fontSize: '0.78rem', 
              padding: 0, 
              outline: 'none', 
              cursor: ['4- Execução', '5- Implantação', '6- Concluído'].includes(formData.status) ? 'default' : 'pointer', 
              fontWeight: 500, 
              width: '95px' 
            }}
          />
        </div>
      </div>

      {/* Fim Real - Only shown for Execução, Implantação or Concluído */}
      {['4- Execução', '5- Implantação', '6- Concluído'].includes(formData.status) && (
        <div style={{ display: 'flex', alignItems: 'center', minHeight: '2.1rem' }}>
          <div style={{ width: '110px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#64748B' }}>
            <CalendarCheck size={14} />
            <span style={{ fontSize: '0.7rem', fontWeight: 400 }}>Fim Real</span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <input 
              type="date" 
              value={formData.actualEndDate || ''} 
              onChange={e => setFormData({ ...formData, actualEndDate: e.target.value })}
              style={{ 
                border: 'none', 
                background: 'transparent', 
                color: formData.actualEndDate ? '#EF4444' : '#64748B', 
                fontWeight: 500, 
                fontSize: '0.78rem', 
                padding: 0, 
                outline: 'none', 
                cursor: 'pointer',
                width: '95px'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const InitiativeIndicators: React.FC<Pick<SidebarSectionProps, 'formData'>> = ({ formData }) => {
  const milestones = formData.milestones || [];
  const tasks = milestones.flatMap(m => m.tasks || []);
  const totalTasks = tasks.length;
  const deliveredTasks = tasks.filter(t => t.status === 'Done').length;
  const completedMilestones = milestones.filter(m => {
    const milestoneTasks = m.tasks || [];
    return milestoneTasks.length > 0 && milestoneTasks.every(t => t.status === 'Done');
  }).length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parseDate = (value?: string | null) => {
    if (!value) return null;
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const calcDays = (start?: string | null, end?: string | null) => {
    const startDate = parseDate(start);
    const endDate = parseDate(end) || today;
    if (!startDate) return null;
    return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const leadTime = calcDays(formData.requestDate || formData.createdAt?.slice(0, 10), formData.actualEndDate || undefined);
  const cycleTime = calcDays(formData.startDate, formData.actualEndDate || undefined);
  const overdueTasks = tasks.filter(t => {
    const target = parseDate(t.targetDate);
    return target && target < today && !['Done', 'Canceled', 'Duplicate'].includes(t.status);
  }).length;
  const deliveredPercent = totalTasks > 0 ? Math.round((deliveredTasks / totalTasks) * 100) : 0;

  const baselineEnd = parseDate(formData.endDate);
  const actualEnd = parseDate(formData.actualEndDate);
  const plannedDelta = baselineEnd && actualEnd ? Math.round((actualEnd.getTime() - baselineEnd.getTime()) / (1000 * 60 * 60 * 24)) : null;

  let deliveryStatus = 'Em andamento';
  if (baselineEnd && actualEnd) {
    deliveryStatus = plannedDelta! <= 0 ? 'Entregue no prazo' : `Replanejado em ${plannedDelta} dia(s)`;
  } else if (baselineEnd && baselineEnd < today && !actualEnd) {
    const lateDays = Math.round((today.getTime() - baselineEnd.getTime()) / (1000 * 60 * 60 * 24));
    deliveryStatus = `Atrasado em ${lateDays} dia(s)`;
  }

  const items = [
    { label: 'Lead time', value: leadTime != null ? `${leadTime} dias` : '-' },
    { label: 'Cycle time', value: cycleTime != null ? `${cycleTime} dias` : '-' },
    { label: 'Entrega', value: deliveryStatus },
    { label: 'Total de tarefas', value: String(totalTasks) },
    { label: '% entregues', value: `${deliveredPercent}%` },
    { label: 'Milestones concluídos', value: `${completedMilestones}/${milestones.length}` },
    { label: 'Tarefas em atraso', value: String(overdueTasks) },
  ];

  return (
    <div style={{ padding: '0.85rem 1rem 1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
      {items.map(item => (
        <div key={item.label} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '0.7rem 0.75rem' }}>
          <div style={{ fontSize: '0.64rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>{item.label}</div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.35 }}>{item.value}</div>
        </div>
      ))}
    </div>
  );
};

export const InitiativeMilestones: React.FC<SidebarSectionProps & {
  editingMilestoneId: string | null;
  setEditingMilestoneId: (id: string | null) => void;
  editMilestoneText: string;
  setEditMilestoneText: (text: string) => void;
  handleUpdateMilestoneName: () => void;
  handleRemoveMilestone: (id: string) => void;
  handleMilestoneReorder: (s: string, t: string) => void;
  setActiveTab?: (tab: 'descricao' | 'tarefas') => void;
  setActiveMilestoneTaskViewId: (id: string | ((prev: string | null) => string | null)) => void;
  activeMilestoneTaskViewId: string | null;
  newMilestoneName: string;
  setNewMilestoneName: (name: string) => void;
  handleAddMilestone: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleTaskAdd: (milestoneId: string, text: string) => void;
  handleTaskDelete: (milestoneId: string, taskId: string) => void;
  handleTaskUpdate: (milestoneId: string, taskId: string, field: string, value: any) => void;
  handleTaskToggle: (milestoneId: string, taskId: string) => void;
  isRequester: boolean;
  isNew: boolean;
  readOnlyMilestones?: boolean;
}> = ({
  formData,
  editingMilestoneId,
  setEditingMilestoneId,
  editMilestoneText,
  setEditMilestoneText,
  handleUpdateMilestoneName,
  handleRemoveMilestone,
  handleMilestoneReorder,
  setActiveTab,
  setActiveMilestoneTaskViewId,
  activeMilestoneTaskViewId,
  newMilestoneName,
  setNewMilestoneName,
  handleAddMilestone,
  isRequester,
  isNew,
  readOnlyMilestones
}) => {
  const [draggedMilestoneSidebarId, setDraggedMilestoneSidebarId] = React.useState<string | null>(null);

  return (
    <div style={{ padding: '0.6rem 1rem 0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {(formData.milestones || []).map((m) => (
        <React.Fragment key={m.id}>
          <div 
            draggable={!editingMilestoneId && !readOnlyMilestones}
            onDragStart={() => !readOnlyMilestones && setDraggedMilestoneSidebarId(m.id)}
            onDragOver={(e) => !readOnlyMilestones && e.preventDefault()}
            onDrop={() => {
              if (draggedMilestoneSidebarId && !readOnlyMilestones) {
                handleMilestoneReorder(draggedMilestoneSidebarId, m.id);
              }
              setDraggedMilestoneSidebarId(null);
            }}
            onClick={(e) => {
              if (editingMilestoneId === m.id) return;
              if ((e.target as HTMLElement).closest('button')) return;
              if (setActiveTab) setActiveTab('tarefas');
              setActiveMilestoneTaskViewId(prev => prev === m.id ? null : m.id);
            }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.6rem', 
              background: activeMilestoneTaskViewId === m.id ? '#F1F5F9' : '#F8FAFC', 
              padding: '0.5rem 0.8rem', 
              borderRadius: '8px', 
              border: activeMilestoneTaskViewId === m.id ? '1px solid #CBD5E1' : '1px solid #E2E8F0',
              cursor: 'pointer',
              opacity: draggedMilestoneSidebarId === m.id ? 0.4 : 1,
              transition: 'all 0.15s ease',
              position: 'relative'
            }}
          >
            {!readOnlyMilestones && (
              <GripVertical 
                size={13} 
                style={{ 
                  color: '#94A3B8', 
                  cursor: 'grab', 
                  marginLeft: '-0.2rem',
                  flexShrink: 0
                }} 
              />
            )}
            {editingMilestoneId === m.id ? (
              <div style={{ display: 'flex', flex: 1, gap: '0.4rem', alignItems: 'center' }}>
                <input 
                  autoFocus
                  value={editMilestoneText}
                  onChange={e => setEditMilestoneText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && handleUpdateMilestoneName) handleUpdateMilestoneName();
                    if (e.key === 'Escape') setEditingMilestoneId(null);
                  }}
                  onBlur={handleUpdateMilestoneName}
                  style={{ flex: 1, border: '1px solid #3B82F6', borderRadius: '6px', fontSize: '0.85rem', padding: '4px 8px', outline: 'none', background: 'white' }}
                />
              </div>
            ) : (
              <>
                {(() => {
                  const _tasks = m.tasks || [];
                  const _progress = _tasks.length > 0 ? Math.round(_tasks.filter(t => t.status === 'Done').length / _tasks.length * 100) : 0;
                  const _today = new Date().toISOString().split('T')[0];
                  const _complete = _progress === 100;
                  const _overdue = !_complete && !!m.endDate && m.endDate < _today;
                  if (_complete) return <CheckCircle2 size={18} fill="#10B981" color="#FFF" strokeWidth={2.5} style={{ flexShrink: 0 }} />;
                  if (_overdue) return <AlertTriangle size={15} style={{ color: '#F59E0B', flexShrink: 0 }} />;
                  return <CheckCircle2 size={15} style={{ color: activeMilestoneTaskViewId === m.id ? '#3B82F6' : '#94A3B8', flexShrink: 0 }} />;
                })()}
                <span style={{ 
                  fontSize: '0.8rem', 
                  color: '#334155', 
                  flex: 1, 
                  textOverflow: 'ellipsis', 
                  overflow: 'hidden', 
                  whiteSpace: 'nowrap', 
                  fontWeight: activeMilestoneTaskViewId === m.id ? 700 : 500 
                }}>
                  {m.name}
                </span>
                {(m.tasks || []).length > 0 && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginRight: '0.5rem' }}>
                    {Math.round(((m.tasks || []).filter(t => t.status === 'Done').length / (m.tasks || []).length) * 100)}%
                  </span>
                )}
                {!readOnlyMilestones && (
                  <div draggable={false} onDragStart={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <button 
                      draggable={false}
                      onMouseDown={e => { e.stopPropagation(); e.preventDefault(); }}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setEditingMilestoneId(m.id); 
                        setEditMilestoneText(m.name);
                      }} 
                      style={{ background: 'transparent', border: 'none', color: '#3B82F6', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', borderRadius: '4px' }}
                      className="btn-icon-hover"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      draggable={false}
                      onMouseDown={e => { e.stopPropagation(); e.preventDefault(); }}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleRemoveMilestone(m.id); 
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', borderRadius: '4px' }}
                      className="btn-icon-hover"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

        </React.Fragment>
      ))}
      
      {(isRequester || isNew) && !readOnlyMilestones && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', padding: '0 0.5rem' }}>
          <Plus size={14} style={{ color: '#9CA3AF' }} />
          <input 
            type="text" 
            placeholder="Adicionar milestone..." 
            value={newMilestoneName}
            onChange={e => setNewMilestoneName(e.target.value)}
            onKeyDown={handleAddMilestone}
            style={{ border: 'none', background: 'transparent', fontSize: '0.8rem', outline: 'none', width: '100%', color: '#111827' }}
          />
        </div>
      )}
    </div>
  );
};
