import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Layers, 
  User, 
  Users, 
  Database, 
  FileText,
  Loader2,
  Diamond,
  Briefcase,
  Zap,
  LayoutGrid
} from 'lucide-react';
import type { Initiative, Collaborator, System } from '../../types';
import { renderAvatar } from './SidebarComponents';

interface CreateInitiativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Initiative>) => Promise<void>;
  allCollaborators: Collaborator[];
  allSystems: System[];
  initialStatus?: string;
  companyId: string;
  departmentId: string;
  createdById?: string;
}

const getTypeIcon = (type: string, size: number = 18) => {
  const iconStyle = { 
    color: type === '1- Estratégico' ? '#EF4444' : 
           type === '2- Projeto' ? '#3B82F6' : 
           type === '3- Fast Track' ? '#10B981' : '#64748B' 
  };
  switch (type) {
    case '1- Estratégico': return <Diamond size={size} style={iconStyle} />;
    case '2- Projeto': return <Briefcase size={size} style={iconStyle} />;
    case '3- Fast Track': return <Zap size={size} style={iconStyle} />;
    default: return <LayoutGrid size={size} style={iconStyle} />;
  }
};

export const CreateInitiativeModal: React.FC<CreateInitiativeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  allCollaborators,
  allSystems,
  initialStatus = '1- Backlog',
  companyId,
  departmentId,
  createdById
}) => {
  const [formData, setFormData] = useState<Partial<Initiative>>({
    title: '',
    type: '2- Projeto',
    status: initialStatus as any,
    benefit: '',
    leaderId: '',
    memberIds: [],
    impactedSystemIds: [],
    companyId,
    departmentId,
    createdById
  });

  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!formData.title?.trim()) {
      alert('O título é obrigatório.');
      return;
    }
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error creating initiative:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '2rem' }}>
      <div 
        onClick={e => e.stopPropagation()}
        style={{ 
          background: '#FFFFFF', 
          width: '540px', 
          borderRadius: '16px', 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden',
          animation: 'modalSlideIn 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)' 
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
             <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <Save size={18} />
             </div>
             <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#1E293B', margin: 0, letterSpacing: '-0.01em' }}>Nova Iniciativa</h2>
                <p style={{ fontSize: '0.7rem', color: '#64748B', margin: 0 }}>Preencha os campos abaixo para criar no roadmap</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', display: 'flex', transition: 'all 0.2s' }}
            className="hover-bg-slate"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', maxHeight: '70vh' }}>
          
          {/* Título */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Título da Iniciativa</label>
            <input 
              autoFocus
              type="text" 
              placeholder="Ex: Novo Fluxo de Checkout..." 
              value={formData.title} 
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s', fontWeight: 500 }}
              className="focus-border-blue"
            />
          </div>

          {/* Properties Grid - Matching Sidebar Aesthetic */}
          <div style={{ background: '#F8FAFC', borderRadius: '12px', border: '1px solid #F1F5F9', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            
            {/* Tipo */}
            <div style={{ display: 'flex', alignItems: 'center', minHeight: '2.5rem' }}>
              <div style={{ width: '120px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#64748B' }}>
                <Layers size={14} />
                <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Tipo</span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 {['1- Estratégico', '2- Projeto', '3- Fast Track'].map(t => (
                   <button 
                     key={t}
                     onClick={() => setFormData({ ...formData, type: t as any })}
                     style={{ 
                       padding: '0.4rem 0.75rem', 
                       borderRadius: '8px', 
                       border: formData.type === t ? '1px solid transparent' : '1px solid #E2E8F0', 
                       background: formData.type === t ? (t === '1- Estratégico' ? '#FEE2E2' : t === '2- Projeto' ? '#DBEAFE' : '#D1FAE5') : 'white',
                       color: formData.type === t ? (t === '1- Estratégico' ? '#B91C1C' : t === '2- Projeto' ? '#1D4ED8' : '#047857') : '#64748B',
                       fontSize: '0.7rem',
                       fontWeight: 700,
                       display: 'flex',
                       alignItems: 'center',
                       gap: '0.4rem',
                       cursor: 'pointer',
                       transition: 'all 0.2s'
                     }}
                   >
                     {getTypeIcon(t, 14)} {t.split('- ')[1]}
                   </button>
                 ))}
              </div>
            </div>

            {/* Líder */}
            <div style={{ display: 'flex', alignItems: 'center', minHeight: '2.5rem' }}>
              <div style={{ width: '120px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#64748B' }}>
                <User size={14} />
                <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Líder</span>
              </div>
              <select 
                value={formData.leaderId || ''} 
                onChange={e => setFormData({ ...formData, leaderId: e.target.value })}
                style={{ flex: 1, border: '1px solid #E2E8F0', background: 'white', fontSize: '0.8rem', padding: '0.5rem', borderRadius: '8px', fontWeight: 500, outline: 'none' }}
              >
                <option value="">Selecione um líder...</option>
                {allCollaborators.filter(c => ['Head', 'Director', 'Manager', 'Lead Engineer', 'CEO'].includes(c.role)).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

             {/* Sistemas */}
             <div style={{ display: 'flex', alignItems: 'flex-start', paddingTop: '0.3rem' }}>
              <div style={{ width: '120px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#64748B', paddingTop: '0.4rem' }}>
                <Database size={14} />
                <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Sistemas</span>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {formData.impactedSystemIds?.map(sid => (
                      <div key={sid} style={{ background: '#EEF2FF', color: '#4F46E5', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 600, border: '1px solid #E0E7FF', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                         {allSystems.find(s => s.id === sid)?.name || sid}
                         <X size={10} style={{ cursor: 'pointer' }} onClick={() => setFormData({ ...formData, impactedSystemIds: formData.impactedSystemIds?.filter(id => id !== sid) })} />
                      </div>
                    ))}
                 </div>
                 <select 
                   value=""
                   onChange={e => {
                     if (!e.target.value) return;
                     if (!formData.impactedSystemIds?.includes(e.target.value)) {
                       setFormData({ ...formData, impactedSystemIds: [...(formData.impactedSystemIds || []), e.target.value] });
                     }
                   }}
                   style={{ border: '1px dashed #CBD5E1', background: 'white', fontSize: '0.75rem', padding: '0.3rem 0.5rem', borderRadius: '6px', cursor: 'pointer', color: '#64748B', outline: 'none' }}
                 >
                   <option value="">+ Vincular Sistema</option>
                   {allSystems.sort((a,b)=>a.name.localeCompare(b.name)).map(s => (
                     <option key={s.id} value={s.id}>{s.name}</option>
                   ))}
                 </select>
              </div>
            </div>

            {/* Membros */}
            <div style={{ display: 'flex', alignItems: 'flex-start', paddingTop: '0.3rem' }}>
              <div style={{ width: '120px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#64748B', paddingTop: '0.4rem' }}>
                <Users size={14} />
                <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Equipe</span>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {formData.memberIds?.map(mid => (
                      <div key={mid} style={{ background: '#F1F5F9', color: '#334155', padding: '0.2rem 0.4rem', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 600, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                         {renderAvatar(mid, allCollaborators, 18)}
                         <span>{allCollaborators.find(c => c.id === mid)?.name.split(' ')[0]}</span>
                         <X size={10} style={{ cursor: 'pointer' }} onClick={() => setFormData({ ...formData, memberIds: formData.memberIds?.filter(id => id !== mid) })} />
                      </div>
                    ))}
                 </div>
                 <select 
                   value=""
                   onChange={e => {
                     if (!e.target.value) return;
                     if (!formData.memberIds?.includes(e.target.value)) {
                       setFormData({ ...formData, memberIds: [...(formData.memberIds || []), e.target.value] });
                     }
                   }}
                   style={{ border: '1px dashed #CBD5E1', background: 'white', fontSize: '0.75rem', padding: '0.3rem 0.5rem', borderRadius: '6px', cursor: 'pointer', color: '#64748B', outline: 'none' }}
                 >
                   <option value="">+ Adicionar Membro</option>
                   {allCollaborators.sort((a,b)=>a.name.localeCompare(b.name)).map(c => (
                     <option key={c.id} value={c.id}>{c.name}</option>
                   ))}
                 </select>
              </div>
            </div>
          </div>

          {/* Objetivo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              <FileText size={12} /> Objetivo / Benefício
            </label>
            <textarea 
              placeholder="Descreva brevemente o que esta iniciativa fará e qual o benefício esperado..." 
              value={formData.benefit} 
              onChange={e => setFormData({ ...formData, benefit: e.target.value })}
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.85rem', outline: 'none', minHeight: '80px', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
              className="focus-border-blue"
            />
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #F1F5F9', background: '#F8FAFC', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button 
            onClick={onClose}
            style={{ padding: '0.6rem 1.25rem', borderRadius: '10px', border: '1px solid #E2E8F0', background: 'white', color: '#475569', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            style={{ 
              padding: '0.6rem 1.75rem', 
              borderRadius: '10px', 
              border: 'none', 
              background: '#2563EB', 
              color: 'white', 
              fontSize: '0.8rem', 
              fontWeight: 700, 
              cursor: isSaving ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            disabled={isSaving || !formData.title}
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Salvar Iniciativa'}
          </button>
        </div>

        <style>{`
          @keyframes modalSlideIn {
            from { opacity: 0; transform: translateY(20px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .hover-bg-slate:hover { background: #F1F5F9; color: #1E293B !important; }
          .focus-border-blue:focus { border-color: #3B82F6 !important; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
          .animate-spin { animation: spin 1s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
};
