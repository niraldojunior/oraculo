import React, { useState, useEffect } from 'react';
import { 
  X, 
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
};export const CreateInitiativeModal: React.FC<CreateInitiativeModalProps> = ({
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
  // Enhanced Escape key handling - robust and minimalist
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc, true);
    return () => window.removeEventListener('keydown', handleEsc, true);
  }, [isOpen, onClose]);
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

  // Focus title on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        document.getElementById('init-title-input')?.focus();
      }, 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.title?.trim()) return;
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 999999 }}>
      <div 
        onClick={e => e.stopPropagation()}
        style={{ 
          background: '#FFFFFF', 
          width: '740px', 
          borderRadius: '16px', 
          boxShadow: '0 20px 60px -10px rgba(0, 0, 0, 0.2)', 
          display: 'flex', 
          flexDirection: 'column', 
          maxHeight: '92vh',
          animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative'
        }}
      >
        {/* Minimalist Header */}
        <div style={{ padding: '1.5rem 2rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 400, opacity: 0.6 }}>+</span> Nova Iniciativa
          </h2>
          <button 
            onClick={onClose}
            style={{ 
              border: 'none', 
              background: '#F1F3F5', 
              color: '#495057', 
              cursor: 'pointer', 
              padding: '0.4rem', 
              borderRadius: '50%', 
              display: 'flex'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Grid - Denser padding */}
        <form 
          id="create-init-form" 
          onSubmit={handleSubmit} 
          style={{ 
            padding: '1rem 2rem 2rem', 
            display: 'grid', 
            gridTemplateColumns: '1.05fr 0.95fr', 
            gap: '1.75rem', 
            overflowY: 'auto' 
          }}
        >
          
          {/* Left Column: Core Identity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4A5568' }}>Nome da iniciativa</label>
              <input 
                id="init-title-input"
                type="text" 
                value={formData.title} 
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Novo Fluxo de Checkout"
                style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '8px', border: 'none', background: '#F1F3F5', fontSize: '0.85rem', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4A5568' }}>Gestor responsável</label>
              <select 
                value={formData.leaderId || ''} 
                onChange={e => setFormData({ ...formData, leaderId: e.target.value })}
                style={{ width: '100%', border: 'none', background: '#F1F3F5', padding: '0.65rem 0.9rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 500, outline: 'none', cursor: 'pointer' }}
              >
                <option value="">Selecione...</option>
                {allCollaborators
                  .filter(c => ['Head', 'Director', 'Manager', 'Lead Engineer', 'CEO'].includes(c.role))
                  .sort((a,b)=>a.name.localeCompare(b.name))
                  .map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                }
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4A5568' }}>Equipe</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.15rem' }}>
                {formData.memberIds?.map(mid => (
                  <div key={mid} style={{ background: '#FFF', color: '#111827', padding: '0.15rem 0.4rem', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 600, border: '1px solid #DEE2E6', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                     {renderAvatar(mid, allCollaborators, 16)}
                     <span>{allCollaborators.find(c => c.id === mid)?.name?.split(' ')[0]}</span>
                     <X size={10} style={{ cursor: 'pointer', color: '#ADB5BD' }} onClick={() => setFormData({ ...formData, memberIds: formData.memberIds?.filter(id => id !== mid) })} />
                  </div>
                ))}
              </div>
              <select 
                value=""
                onChange={e => e.target.value && !formData.memberIds?.includes(e.target.value) && setFormData({ ...formData, memberIds: [...(formData.memberIds || []), e.target.value] })}
                style={{ border: 'none', background: '#F1F3F5', fontSize: '0.75rem', padding: '0.6rem 0.9rem', borderRadius: '8px', color: '#6C757D', outline: 'none' }}
              >
                <option value="">Adicionar membro...</option>
                {allCollaborators.filter(c => !formData.memberIds?.includes(c.id)).sort((a,b)=>a.name.localeCompare(b.name)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4A5568' }}>Tipo de iniciativa</label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                 {['1- Estratégico', '2- Projeto', '3- Fast Track'].map(t => (
                   <button 
                     key={t}
                     type="button"
                     onClick={() => setFormData({ ...formData, type: t as any })}
                     style={{ flex: 1, padding: '0.5rem 0.35rem', borderRadius: '8px', border: formData.type === t ? '1.5px solid #212529' : '1px solid #DEE2E6', background: 'white', color: '#212529', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                   >
                     {getTypeIcon(t, 14)}
                     {t.split('- ')[1]}
                   </button>
                 ))}
              </div>
            </div>
          </div>

          {/* Right Column: Narrative & Metadata */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4A5568' }}>Apresentação</label>
              <textarea 
                value={formData.benefit} 
                onChange={e => setFormData({ ...formData, benefit: e.target.value })}
                placeholder="Conte um pouco sobre o objetivo..." 
                style={{ width: '100%', padding: '0.8rem 0.9rem', borderRadius: '8px', border: 'none', background: '#F1F3F5', fontSize: '0.85rem', outline: 'none', minHeight: '130px', resize: 'none', fontFamily: 'inherit', color: '#495057' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4A5568' }}>Sistemas afetados</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.15rem' }}>
                {formData.impactedSystemIds?.map(sid => (
                  <div key={sid} style={{ background: '#F1F3F5', color: '#495057', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 600, border: '1px solid #DEE2E6', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                     {allSystems.find(s => s.id === sid)?.name || sid}
                     <X size={10} style={{ cursor: 'pointer', color: '#ADB5BD' }} onClick={() => setFormData({ ...formData, impactedSystemIds: formData.impactedSystemIds?.filter(id => id !== sid) })} />
                  </div>
                ))}
              </div>
              <select 
                value=""
                onChange={e => e.target.value && !formData.impactedSystemIds?.includes(e.target.value) && setFormData({ ...formData, impactedSystemIds: [...(formData.impactedSystemIds || []), e.target.value] })}
                style={{ border: 'none', background: '#F1F3F5', fontSize: '0.75rem', padding: '0.6rem 0.9rem', borderRadius: '8px', color: '#6C757D', outline: 'none' }}
              >
                <option value="">Vincular sistema...</option>
                {allSystems.sort((a,b)=>a.name.localeCompare(b.name)).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

          </div>
        </form>

        {/* Footer */}
        <div style={{ padding: '0 2rem 1.75rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            type="submit"
            form="create-init-form"
            disabled={isSaving || !formData.title}
            style={{ 
              padding: '0.75rem 1.5rem', 
              borderRadius: '8px', 
              border: 'none', 
              background: isSaving || !formData.title ? '#FDE68A' : '#FFD21E', 
              color: '#000000', 
              fontSize: '0.85rem', 
              fontWeight: 700, 
              cursor: 'pointer',
              minWidth: '180px'
            }}
          >
            {isSaving ? 'Salvando...' : 'Salvar Iniciativa'}
          </button>
        </div>

        <style>{`
          @keyframes modalSlideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }
          select {
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%234A5568' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 1rem center;
            background-size: 14px;
          }
        `}</style>
      </div>
    </div>
  );
};
