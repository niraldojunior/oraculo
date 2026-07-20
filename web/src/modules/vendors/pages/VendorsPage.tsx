import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Building, FileText, Shield, Package, X as CloseIcon, Camera, Upload, Pencil, Trash2, Loader2, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useView } from '@/context/ViewContext';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { VENDOR_LOGOS } from '@/data/mockDb';
import type { Vendor, Contract, Company, Department, Collaborator } from '../../../types';
import {
  deleteVendor as deleteVendorApi,
  fetchVendorsPageData,
  saveVendor as saveVendorApi,
  saveContract as saveContractApi,
  deleteContract as deleteContractApi,
} from '../services/vendorsApi';

// ─── VendorLogo ──────────────────────────────────────────────────────────────
const VendorLogo: React.FC<{
  vendor: Pick<Vendor, 'id' | 'companyName' | 'logoUrl'>;
  iconSize: number;
}> = ({ vendor, iconSize }) => {
  const fallback = VENDOR_LOGOS[vendor.id] || '';
  const initial = vendor.logoUrl || fallback;
  const [src, setSrc] = useState<string>(initial);
  const [failed, setFailed] = useState<boolean>(!initial);

  if (failed || !src) return <Building size={iconSize} color="var(--text-tertiary)" />;
  return (
    <img
      loading="lazy"
      src={src}
      alt={vendor.companyName}
      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
      onError={() => {
        if (fallback && src !== fallback) { setSrc(fallback); return; }
        setFailed(true);
      }}
    />
  );
};

// ─── ContractModal ────────────────────────────────────────────────────────────
const ContractModal: React.FC<{
  contract?: Contract;
  defaultVendorId?: string;
  vendors: Vendor[];
  directors: Collaborator[];
  companyId: string;
  departmentId: string;
  onClose: () => void;
  onSaved: (c: Contract) => void;
  onDeleted?: (id: string) => void;
  canManageEntities: boolean;
}> = ({ contract, defaultVendorId, vendors, directors, companyId, departmentId, onClose, onSaved, onDeleted, canManageEntities }) => {
  useEscapeKey(onClose);
  const isEdit = Boolean(contract?.id);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [form, setForm] = useState({
    vendorId: contract?.vendorId || defaultVendorId || '',
    leaderId: contract?.leaderId || '',
    name: contract?.name || '',
    model: contract?.model || 'SaaS',
    annualCost: contract?.annualCost ?? 0,
    description: contract?.description || '',
    startDate: contract?.startDate || '',
    endDate: contract?.endDate || '',
    status: contract?.status || 'Ativo',
  });

  const set = (field: string, value: string | number) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vendorId) { alert('Selecione um fornecedor.'); return; }
    setSaving(true);
    try {
      const saved = await saveContractApi({
        id: contract?.id,
        companyId,
        departmentId,
        vendorId: form.vendorId,
        number: contract?.number,
        name: form.name || undefined,
        model: form.model,
        annualCost: Number(form.annualCost) || 0,
        description: form.description || undefined,
        startDate: form.startDate,
        endDate: form.endDate,
        status: form.status,
        leaderId: form.leaderId || undefined,
      });
      onSaved(saved);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar contrato.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!contract?.id) return;
    try {
      await deleteContractApi(contract.id);
      onDeleted?.(contract.id);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir contrato.');
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 10001 }}>
      <div className="glass-panel modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 620, width: '95%', background: 'white', maxHeight: '92vh', overflowY: 'auto', position: 'relative', padding: '1.4rem 1.8rem' }}>

        {/* Header */}
        <div className="flex-between" style={{ marginBottom: '1.4rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} color="var(--accent-base)" />
            {isEdit ? 'Editar Contrato' : 'Novo Contrato'}
          </h2>
          <button onClick={onClose} className="btn-icon" style={{ background: 'rgba(0,0,0,0.05)', borderRadius: '50%', padding: '0.3rem' }}>
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Delete confirm */}
        {showDeleteConfirm && (
          <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid #FCA5A5', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <span style={{ fontWeight: 600, color: '#991B1B', fontSize: '0.875rem' }}>Confirmar exclusão deste contrato?</span>
            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              <button onClick={handleDelete} className="btn btn-danger" style={{ padding: '0.35rem 0.9rem', fontSize: '0.8rem' }}>Excluir</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-glass" style={{ padding: '0.35rem 0.9rem', fontSize: '0.8rem' }}>Cancelar</button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {/* Row 1: Fornecedor (full width) */}
          <div className="form-group">
            <label>Fornecedor *</label>
            <select required value={form.vendorId} onChange={e => set('vendorId', e.target.value)}>
              <option value="">Selecione um fornecedor...</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.companyName}</option>)}
            </select>
          </div>

          {/* Row 2: Título | Modelo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Título do Contrato</label>
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Licença Enterprise 2025" />
            </div>
            <div className="form-group">
              <label>Modelo</label>
              <select value={form.model} onChange={e => set('model', e.target.value)}>
                {['SaaS', 'Licença', 'Serviços', 'Suporte', 'Hardware', 'Consultoria', 'Outro'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Diretor | Valor Anual */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Diretor Responsável</label>
              <select value={form.leaderId} onChange={e => set('leaderId', e.target.value)}>
                <option value="">Selecione um diretor...</option>
                {directors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Valor Anual (R$)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.annualCost}
                onChange={e => set('annualCost', e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Row 4: Início | Fim Vigência */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Início da Vigência</label>
              <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Fim da Vigência</label>
              <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} />
            </div>
          </div>

          {/* Row 5: Status (full width toggle) */}
          <div className="form-group">
            <label>Status</label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {['Ativo', 'Inativo'].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set('status', s)}
                  style={{
                    flex: 1, padding: '0.45rem', borderRadius: 'var(--radius-sm)',
                    border: `2px solid ${form.status === s ? (s === 'Ativo' ? '#16A34A' : '#DC2626') : 'var(--glass-border)'}`,
                    background: form.status === s ? (s === 'Ativo' ? '#F0FDF4' : '#FEF2F2') : 'var(--bg-app)',
                    color: form.status === s ? (s === 'Ativo' ? '#16A34A' : '#DC2626') : 'var(--text-secondary)',
                    fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.15s'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Row 6: Descrição (full width) */}
          <div className="form-group">
            <label>Descrição</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Descreva o escopo e detalhes do contrato..."
              rows={2}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="form-actions" style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', justifyContent: 'space-between' }}>
            <div>
              {isEdit && canManageEntities && !showDeleteConfirm && (
                <button type="button" className="btn btn-danger-dim" onClick={() => setShowDeleteConfirm(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Trash2 size={14} /> Excluir
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn btn-glass" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: saving ? 0.7 : 1 }}>
                {saving ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : <><Save size={14} /> {isEdit ? 'Salvar' : 'Criar Contrato'}</>}
              </button>
            </div>
          </div>
        </form>

        <style>{`
          .form-group label { font-size: 0.75rem; }
          .form-group input, .form-group select, .form-group textarea { font-size: 0.875rem; padding: 0.5rem 0.75rem; }
        `}</style>
      </div>
    </div>
  );
};

// ─── VendorForm ───────────────────────────────────────────────────────────────
const VendorForm: React.FC<{
  companies: Company[];
  departments: Department[];
  vendor?: Vendor;
  onClose: () => void;
  onSuccess: (saved: Vendor) => void;
}> = ({ companies, departments, vendor, onClose, onSuccess }) => {
  useEscapeKey(onClose);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    companyId: vendor?.companyId || companies[0]?.id || '',
    departmentId: vendor?.departmentId || departments[0]?.id || '',
    companyName: vendor?.companyName || '',
    taxId: vendor?.taxId || '',
    type: vendor?.type || 'Software House',
    logoUrl: vendor?.logoUrl || '',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await saveVendorApi({
        id: vendor?.id,
        companyId: formData.companyId,
        departmentId: formData.departmentId || departments[0]?.id || '',
        companyName: formData.companyName,
        taxId: formData.taxId,
        type: formData.type,
        logoUrl: formData.logoUrl,
      });
      onSuccess(saved);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar fornecedor.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 10001 }}>
      <div className="glass-panel modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 640, width: '95%', background: 'white', position: 'relative', padding: '1.4rem 1.8rem' }}>

        {/* Header */}
        <div className="flex-between" style={{ marginBottom: '1.4rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building size={18} color="var(--accent-base)" />
            {vendor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </h2>
          <button onClick={onClose} className="btn-icon" style={{ background: 'rgba(0,0,0,0.05)', borderRadius: '50%', padding: '0.3rem' }}>
            <CloseIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '148px 1fr', gap: '2rem' }}>
            {/* Logo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{ width: 130, height: 130, borderRadius: '12px', background: 'var(--bg-app)', border: '2px dashed var(--glass-border-strong)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative', boxShadow: 'var(--shadow-md)' }}
              >
                {formData.logoUrl ? (
                  <>
                    <img loading="lazy" src={formData.logoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.5)', padding: '4px', display: 'flex', justifyContent: 'center' }}>
                      <Camera size={14} color="white" />
                    </div>
                  </>
                ) : (
                  <>
                    <Upload size={26} color="var(--text-tertiary)" />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '8px', textAlign: 'center' }}>Carregar Logo</span>
                  </>
                )}
              </div>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', margin: 0, textAlign: 'center' }}>PNG, JPG ou SVG</p>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
            </div>

            {/* Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Nome do Fornecedor *</label>
                <input type="text" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} placeholder="Ex: Oracle, AWS, Huawei" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>CNPJ *</label>
                  <input type="text" value={formData.taxId} onChange={e => setFormData({ ...formData, taxId: e.target.value })} placeholder="00.000.000/0001-00" required />
                </div>
                <div className="form-group">
                  <label>Tipo</label>
                  <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                    <option value="Software House">Software House</option>
                    <option value="Cloud Provider">Cloud Provider</option>
                    <option value="Managed Services">Managed Services</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Consultoria">Consultoria</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions" style={{ paddingTop: '1.25rem', borderTop: '1px solid var(--glass-border)', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-glass" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: saving ? 0.7 : 1 }}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : 'Salvar Fornecedor'}
            </button>
          </div>
        </form>

        <style>{`
          .form-group label { font-size: 0.75rem; }
          .form-group input, .form-group select, .form-group textarea { font-size: 0.875rem; padding: 0.5rem 0.75rem; }
        `}</style>
      </div>
    </div>
  );
};

// ─── VendorDetailModal ────────────────────────────────────────────────────────
const VendorDetailModal: React.FC<{
  vendor: Vendor;
  onClose: () => void;
  onEdit: (vendor: Vendor) => void;
  onDelete: (id: string) => void;
  allContracts: Contract[];
  allCollaborators: Collaborator[];
  canManageEntities: boolean;
  onNewContract: () => void;
}> = ({ vendor, onClose, onEdit, onDelete, allContracts, allCollaborators, canManageEntities, onNewContract }) => {
  useEscapeKey(onClose);
  const contracts = allContracts.filter(c => c.vendorId === vendor.id);
  const fmtDate = (d: string) => { if (!d) return '—'; try { return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR'); } catch { return d; } };
  const statusColor = (s: string) => s === 'Ativo' ? '#16A34A' : '#DC2626';

  return (
    <div className="modal-overlay" style={{ zIndex: 10000 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', padding: 0, overflow: 'hidden' }}>
        <button onClick={onClose} className="btn-close"><CloseIcon size={20} /></button>

        {/* Header */}
        <div style={{ padding: '2rem', background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <div style={{ width: 96, height: 96, background: '#FFFFFF', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--glass-border)', flexShrink: 0 }}>
              <VendorLogo key={`${vendor.id}:${vendor.logoUrl || ''}`} vendor={vendor} iconSize={40} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.6rem', margin: '0 0 0.4rem' }}>{vendor.companyName}</h2>
              <div style={{ display: 'flex', gap: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Shield size={14} /> {vendor.taxId}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Package size={14} /> {vendor.type}</span>
              </div>
            </div>
          </div>
          {canManageEntities && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
              <button className="btn btn-secondary" onClick={() => onEdit(vendor)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Pencil size={14} /> Editar Fornecedor</button>
              <button onClick={onNewContract} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--accent-base)', color: 'white', border: 'none', borderRadius: 8, padding: '0.45rem 0.9rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                <FileText size={14} /> Novo Contrato
              </button>
              <button onClick={() => { if (window.confirm('Excluir este fornecedor?')) onDelete(vendor.id); }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto', background: '#FEE2E2', border: 'none', borderRadius: 8, padding: '0.45rem 0.9rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', color: '#DC2626' }}>
                <Trash2 size={14} /> Excluir
              </button>
            </div>
          )}
        </div>

        {/* Contracts */}
        <div style={{ padding: '1.5rem 2rem', maxHeight: '55vh', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <FileText size={14} /> Contratos ({contracts.length})
          </h3>
          {contracts.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', fontStyle: 'italic' }}>Nenhum contrato registrado para este fornecedor.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {contracts.map(c => {
                const leader = allCollaborators.find(x => x.id === c.leaderId);
                return (
                  <div key={c.id} style={{ padding: '1rem', background: '#F8FAFC', borderRadius: 10, border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{c.name || c.number}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: statusColor(c.status), background: `${statusColor(c.status)}15`, padding: '0.15rem 0.55rem', borderRadius: 20 }}>{c.status}</span>
                    </div>
                    {c.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0.4rem' }}>{c.description}</p>}
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-tertiary)', flexWrap: 'wrap' }}>
                      <span>Início: {fmtDate(c.startDate)}</span>
                      <span>Fim: {fmtDate(c.endDate)}</span>
                      {leader && <span>Diretor: <strong style={{ color: 'var(--text-secondary)' }}>{leader.name}</strong></span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Vendors (main) ───────────────────────────────────────────────────────────
type SubView = 'fornecedores' | 'contratos';

const thStyle: React.CSSProperties = {
  position: 'sticky', top: 0, zIndex: 10,
  padding: '0.75rem', textAlign: 'left', fontWeight: 800,
  textTransform: 'uppercase', fontSize: '0.68rem',
  color: 'var(--text-tertiary)', background: '#F9FAFB',
  letterSpacing: '0.04em'
};

interface VendorsProps {
  /** Aba ativa, vinda da rota (/produtos/servicos/fornecedores | /contratos). */
  tab: SubView;
}

const Vendors: React.FC<VendorsProps> = ({ tab }) => {
  const { currentCompany, currentDepartment, canManageEntities } = useAuth();
  const { registerAddAction, searchTerm, selectedManagerId } = useView();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);

  const activeSubView = tab;
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [showVendorForm, setShowVendorForm] = useState(false);

  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [newContractVendorId, setNewContractVendorId] = useState<string | undefined>(undefined);

  const fetchData = useCallback(async () => {
    if (!currentCompany) return;
    try {
      const data = await fetchVendorsPageData({ companyId: currentCompany.id, departmentId: currentDepartment?.id });
      setVendors(data.vendors);
      setContracts(data.contracts);
      setCompanies(data.companies);
      setDepartments(data.departments);
      setCollaborators(data.collaborators);
    } catch (err) {
      console.error('Failed to fetch vendors data', err);
      setCompanies(currentCompany ? [currentCompany] : []);
    } finally {
      setLoading(false);
    }
  }, [currentCompany, currentDepartment]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    document.title = 'Fornecedores | Oráculo';
    return () => { document.title = 'Oráculo'; };
  }, []);

  // + button
  useEffect(() => {
    if (!canManageEntities) { registerAddAction(null); return; }
    if (activeSubView === 'fornecedores') {
      registerAddAction(() => { setEditingVendor(null); setShowVendorForm(true); });
    } else {
      registerAddAction(() => { setEditingContract(null); setNewContractVendorId(undefined); setShowContractModal(true); });
    }
    return () => registerAddAction(null);
  }, [registerAddAction, canManageEntities, activeSubView]);

  const handleDeleteVendor = async (id: string) => {
    try {
      await deleteVendorApi(id);
      setSelectedVendor(null);
      setVendors(prev => prev.filter(v => v.id !== id));
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir fornecedor.');
    }
  };

  const normalizedRole = (r: string) => (r || '').trim().toLowerCase();
  const directors = useMemo(() =>
    collaborators.filter(c => { const r = normalizedRole(c.role); return r === 'director' || r === 'diretor'; }),
    [collaborators]
  );

  // Filters
  const filteredVendors = useMemo(() => vendors.filter(v => {
    if (searchTerm && !v.companyName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  }), [vendors, searchTerm]);

  const filteredContracts = useMemo(() => contracts.filter(c => {
    if (searchTerm) {
      const vendor = vendors.find(v => v.id === c.vendorId);
      const matchVendor = vendor?.companyName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchTitle = (c.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchVendor && !matchTitle) return false;
    }
    if (selectedManagerId && selectedManagerId !== 'all') {
      if (c.leaderId !== selectedManagerId) return false;
    }
    return true;
  }), [contracts, vendors, searchTerm, selectedManagerId]);

  const fmtDate = (d: string) => { if (!d) return '—'; try { return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR'); } catch { return d; } };
  const statusColor = (s: string) => s === 'Ativo' ? '#16A34A' : '#DC2626';

  if (loading) return <div className="spinner-container"><div className="spinner"></div><span>Carregando Fornecedores...</span></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>

      {/* ── FORNECEDORES VIEW ── */}
      {activeSubView === 'fornecedores' && (
        <>
          {filteredVendors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
              {vendors.length === 0 ? 'Nenhum fornecedor cadastrado.' : 'Nenhum fornecedor corresponde à busca.'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
              {filteredVendors.map(vendor => {
                const vendorContracts = contracts.filter(c => c.vendorId === vendor.id);
                const activeCount = vendorContracts.filter(c => c.status === 'Ativo').length;
                return (
                  <div
                    key={vendor.id}
                    className="glass-panel-interactive"
                    onClick={() => setSelectedVendor(vendor)}
                    style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#FFFFFF', borderRadius: '14px', border: '1px solid var(--glass-border)', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: 52, height: 52, borderRadius: '10px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', border: '1px solid var(--glass-border)', flexShrink: 0 }}>
                        <VendorLogo key={`${vendor.id}:${vendor.logoUrl || ''}`} vendor={vendor} iconSize={26} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 0.15rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vendor.companyName}</h3>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>{vendor.type}</span>
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>
                        <Shield size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        {vendor.taxId || '—'}
                      </span>
                      <span style={{ fontWeight: 700, color: activeCount > 0 ? '#16A34A' : 'var(--text-tertiary)' }}>
                        {vendorContracts.length} contrato{vendorContracts.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── CONTRATOS VIEW ── */}
      {activeSubView === 'contratos' && (
        <div className="glass-panel" style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--glass-border-strong)', boxShadow: 'var(--shadow-md)', overflow: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E5E7EB', background: '#F9FAFB' }}>
                <th style={thStyle}>Fornecedor</th>
                <th style={thStyle}>Título</th>
                <th style={thStyle}>Diretor Responsável</th>
                <th style={thStyle}>Início</th>
                <th style={thStyle}>Fim Vigência</th>
                <th style={thStyle}>Status</th>
                {canManageEntities && <th style={{ ...thStyle, width: '5%' }}></th>}
              </tr>
            </thead>
            <tbody>
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={canManageEntities ? 7 : 6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                    {contracts.length === 0 ? 'Nenhum contrato cadastrado.' : 'Nenhum contrato corresponde à busca.'}
                  </td>
                </tr>
              ) : (
                filteredContracts.map(contract => {
                  const vendor = vendors.find(v => v.id === contract.vendorId);
                  const director = collaborators.find(c => c.id === contract.leaderId);
                  return (
                    <tr
                      key={contract.id}
                      className="table-row-premium"
                      style={{ cursor: canManageEntities ? 'pointer' : 'default', borderBottom: '1px solid #F1F5F9' }}
                      onClick={() => { if (canManageEntities) { setEditingContract(contract); setShowContractModal(true); } }}
                    >
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{ width: 30, height: 30, borderRadius: 6, background: '#F8FAFC', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {vendor ? <VendorLogo key={vendor.id} vendor={vendor} iconSize={16} /> : <Building size={14} color="var(--text-tertiary)" />}
                          </div>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{vendor?.companyName || '—'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{contract.name || contract.number || '—'}</td>
                      <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-secondary)' }}>{director?.name || '—'}</td>
                      <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-secondary)' }}>{fmtDate(contract.startDate)}</td>
                      <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-secondary)' }}>{fmtDate(contract.endDate)}</td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: statusColor(contract.status), background: `${statusColor(contract.status)}15`, padding: '0.2rem 0.6rem', borderRadius: 20 }}>
                          {contract.status || 'Ativo'}
                        </span>
                      </td>
                      {canManageEntities && (
                        <td style={{ padding: '0.85rem 0.75rem' }} onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => { setEditingContract(contract); setShowContractModal(true); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', borderRadius: 6, display: 'flex', color: 'var(--text-tertiary)' }}
                            title="Editar contrato"
                          >
                            <Pencil size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODALS ── */}
      {selectedVendor && (
        <VendorDetailModal
          vendor={selectedVendor}
          allContracts={contracts}
          allCollaborators={collaborators}
          onClose={() => setSelectedVendor(null)}
          onEdit={v => { setEditingVendor(v); setSelectedVendor(null); setShowVendorForm(true); }}
          onDelete={handleDeleteVendor}
          canManageEntities={canManageEntities}
          onNewContract={() => {
            setNewContractVendorId(selectedVendor.id);
            setEditingContract(null);
            setSelectedVendor(null);
            setShowContractModal(true);
          }}
        />
      )}

      {showVendorForm && (
        <VendorForm
          companies={companies}
          departments={departments}
          vendor={editingVendor || undefined}
          onClose={() => { setShowVendorForm(false); setEditingVendor(null); }}
          onSuccess={saved => {
            setVendors(prev => {
              const idx = prev.findIndex(v => v.id === saved.id);
              return idx >= 0 ? prev.map(v => v.id === saved.id ? saved : v) : [...prev, saved];
            });
            setShowVendorForm(false);
            setEditingVendor(null);
          }}
        />
      )}

      {showContractModal && (
        <ContractModal
          contract={editingContract || undefined}
          defaultVendorId={newContractVendorId}
          vendors={vendors}
          directors={directors}
          companyId={currentCompany?.id || ''}
          departmentId={currentDepartment?.id || departments[0]?.id || ''}
          canManageEntities={canManageEntities}
          onClose={() => { setShowContractModal(false); setEditingContract(null); setNewContractVendorId(undefined); }}
          onSaved={saved => {
            setContracts(prev => {
              const idx = prev.findIndex(c => c.id === saved.id);
              return idx >= 0 ? prev.map(c => c.id === saved.id ? saved : c) : [...prev, saved];
            });
            setShowContractModal(false);
            setEditingContract(null);
            setNewContractVendorId(undefined);
          }}
          onDeleted={id => {
            setContracts(prev => prev.filter(c => c.id !== id));
          }}
        />
      )}
    </div>
  );
};

export default Vendors;
