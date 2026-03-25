import React, { useState, useEffect } from 'react';
import { Building, FileText, Shield, Package, LayoutGrid, X as CloseIcon, Plus, Camera, Upload } from 'lucide-react';
import type { Vendor, Contract, System, Company, Department } from '../types';

const VENDOR_LOGOS: Record<string, string> = {
  v_vtal: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/V.tal_Logo.png/800px-V.tal_Logo.png',
  v_oracle: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Oracle_logo.svg/512px-Oracle_logo.svg.png',
  v_salesforce: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Salesforce.com_logo.svg/512px-Salesforce.com_logo.svg.png',
  v_google: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/512px-Google_2015_logo.svg.png',
  v_huawei: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Huawei_logo.svg/512px-Huawei_logo.svg.png',
  v_nokia: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Nokia_logo.svg/512px-Nokia_logo.svg.png',
  v_zte: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/ZTE_Logo.svg/512px-ZTE_Logo.svg.png',
  v_ericsson: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Ericsson_logo.svg/512px-Ericsson_logo.svg.png',
  v_pega: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Pegasystems_logo.svg/512px-Pegasystems_logo.svg.png',
  v_hexagon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Hexagon_AB_logo.svg/512px-Hexagon_AB_logo.svg.png',
};

const VendorForm: React.FC<{
  companies: Company[];
  departments: Department[];
  vendor?: Vendor; // For editing
  onClose: () => void;
  onSuccess: () => void;
}> = ({ companies, departments, vendor, onClose, onSuccess }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    companyId: vendor?.companyId || companies[0]?.id || '',
    departmentId: vendor?.departmentId || departments[0]?.id || '',
    companyName: vendor?.companyName || '',
    taxId: vendor?.taxId || '',
    type: vendor?.type || 'Software House',
    logoUrl: vendor?.logoUrl || '',
    contractNumber: '',
    startDate: '',
    endDate: '',
    model: 'SaaS',
    annualCost: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method: string = vendor ? 'PATCH' : 'POST';
      const url: string = vendor ? `/api/vendors/${vendor.id}` : '/api/vendors';
      
      const vendorRes = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: formData.companyId,
          departmentId: formData.departmentId,
          companyName: formData.companyName,
          taxId: formData.taxId,
          type: formData.type,
          logoUrl: formData.logoUrl
        })
      });
      const result = await vendorRes.json();

      if (formData.contractNumber) {
        await fetch('/api/contracts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId: formData.companyId,
            departmentId: formData.departmentId,
            vendorId: result.id,
            number: formData.contractNumber,
            startDate: formData.startDate,
            endDate: formData.endDate,
            model: formData.model,
            annualCost: parseFloat(formData.annualCost) || 0
          })
        });
      }

      onSuccess();
    } catch (err) {
      console.error('Failed to create vendor/contract:', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10001 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2>{vendor ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h2>
          <button onClick={onClose} className="btn-close"><CloseIcon size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="standard-form">
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '12px' }}>
            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{ 
                width: 80, 
                height: 80, 
                borderRadius: '12px', 
                background: 'white', 
                border: '2px dashed var(--glass-border-strong)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                overflow: 'hidden',
                position: 'relative',
                flexShrink: 0,
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {formData.logoUrl ? (
                <>
                  <img src={formData.logoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.5)', padding: '2px', display: 'flex', justifyContent: 'center' }}>
                    <Camera size={12} color="white" />
                  </div>
                </>
              ) : (
                <>
                  <Upload size={20} className="text-secondary" />
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Logo</span>
                </>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Upload do logotipo do fornecedor. Formatos aceitos: PNG, JPG, SVG.
              </p>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
             <div className="form-group">
                <label>Empresa</label>
                <select value={formData.companyId} onChange={e => setFormData({...formData, companyId: e.target.value})} required>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.fantasyName}</option>)}
                </select>
             </div>
             <div className="form-group">
                <label>Departamento</label>
                <select value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})} required>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
             </div>
          </div>

          <div className="form-group">
            <label>Nome do Fornecedor</label>
            <input type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} placeholder="Ex: Oracle, AWS, Huawei" required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label>CNPJ</label>
              <input type="text" value={formData.taxId} onChange={e => setFormData({...formData, taxId: e.target.value})} placeholder="00.000.000/0001-00" required />
            </div>
            <div className="form-group">
              <label>Tipo</label>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="Software House">Software House</option>
                <option value="Cloud Provider">Cloud Provider</option>
                <option value="Managed Services">Managed Services</option>
                <option value="Hardware">Hardware</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={16} color="var(--accent-base)" /> Dados do Contrato Principal
            </h3>
            <div className="form-group">
              <label>Número do Contrato</label>
              <input type="text" value={formData.contractNumber} onChange={e => setFormData({...formData, contractNumber: e.target.value})} placeholder="CTR-2024-XXXX" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <label>Data Início</label>
                <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Data Fim</label>
                <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <label>Modelo</label>
                <select value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})}>
                  <option value="SaaS">SaaS</option>
                  <option value="On-premise">On-premise</option>
                  <option value="Professional Services">Prof. Services</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
              <div className="form-group">
                <label>Custo Anual (BRL)</label>
                <input type="number" value={formData.annualCost} onChange={e => setFormData({...formData, annualCost: e.target.value})} placeholder="0.00" />
              </div>
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Salvar Fornecedor</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const VendorDetailModal: React.FC<{ 
  vendor: Vendor; 
  onClose: () => void;
  onEdit: (vendor: Vendor) => void;
  onDelete: (id: string) => void;
  allContracts: Contract[];
  allSystems: System[];
}> = ({ vendor, onClose, onEdit, onDelete, allContracts, allSystems }) => {
  const contracts = allContracts.filter(c => c.vendorId === vendor.id);
  const systems = allSystems.filter(s => s.vendorId === vendor.id);
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', padding: 0, overflow: 'hidden' }}>
        <button onClick={onClose} className="btn-close"><CloseIcon size={20} /></button>
        
        <div style={{ padding: '2.5rem', background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
            <div style={{ 
              width: 120, 
              height: 120, 
              background: '#FFFFFF', 
              borderRadius: 'var(--radius-lg)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '1.5rem',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--glass-border)'
            }}>
              {VENDOR_LOGOS[vendor.id] || vendor.logoUrl ? (
                <img src={VENDOR_LOGOS[vendor.id] || vendor.logoUrl || ''} alt={vendor.companyName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              ) : (
                <Building size={48} color="var(--text-tertiary)" />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>{vendor.companyName}</h2>
                  <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Shield size={16} /> {vendor.taxId}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Package size={16} /> {vendor.type}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TCO Anual</p>
                  <h3 style={{ fontSize: '1.8rem', color: 'var(--status-green)' }}>
                    {formatCurrency(contracts.reduce((sum: number, c: Contract) => sum + c.annualCost, 0))}
                  </h3>
                </div>
              </div>
            
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => onEdit(vendor)}
                  style={{ flex: 1, minWidth: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  Editar Fornecedor
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={() => {
                    if (window.confirm('Tem certeza que deseja excluir este fornecedor?')) {
                      onDelete(vendor.id);
                    }
                  }}
                  style={{ flex: 1, minWidth: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#ef4444', color: 'white' }}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', padding: '2.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FileText size={18} color="var(--accent-base)" /> Contratos e Vigência
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {contracts.map((contract: Contract) => (
                <div key={contract.id} style={{ 
                  padding: '1.25rem', 
                  background: '#FFFFFF', 
                  borderRadius: 'var(--radius-md)', 
                  border: '1px solid var(--glass-border)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div className="flex-between" style={{ marginBottom: '1rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{contract.number}</span>
                    <span className="badge-dark">{contract.model}</span>
                  </div>
                  <div className="flex-between" style={{ fontSize: '0.875rem' }}>
                    <span className="text-secondary">Início: {contract.startDate}</span>
                    <span className="text-secondary">Fim: {contract.endDate}</span>
                  </div>
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--glass-border)', textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent-base)' }}>{formatCurrency(contract.annualCost)}/ano</span>
                  </div>
                </div>
              ))}
              {contracts.length === 0 && <p className="text-tertiary">Nenhum contrato registrado.</p>}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <LayoutGrid size={18} color="var(--accent-base)" /> Sistemas Atendidos
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {systems.map(system => (
                <div key={system.id} className="glass-panel" style={{ 
                  padding: '0.6rem 1rem', 
                  fontSize: '0.85rem', 
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'white'
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-base)' }}></div>
                  {system.name}
                </div>
              ))}
              {systems.length === 0 && <p className="text-tertiary">Nenhum sistema vinculado.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Vendors: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/vendors').then(res => res.json()),
      fetch('/api/contracts').then(res => res.json()),
      fetch('/api/systems').then(res => res.json()),
      fetch('/api/companies').then(res => res.json()),
      fetch('/api/departments').then(res => res.json())
    ])
    .then(([vendorsData, contractsData, systemsData, companiesData, departmentsData]) => {
      setVendors(Array.isArray(vendorsData) ? vendorsData : []);
      setContracts(Array.isArray(contractsData) ? contractsData : []);
      setSystems(Array.isArray(systemsData) ? systemsData : []);
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
      setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
      setLoading(false);
    })
    .catch(err => {
      console.error('Failed to fetch vendors data', err);
      setLoading(false);
    });
  };

  const handleDeleteVendor = async (id: string) => {
    try {
      const res = await fetch(`/api/vendors/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete vendor');
      setSelectedVendor(null);
      fetchData();
    } catch (err) {
      console.error('Error deleting vendor:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '50vh' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="flex-between">
         <div></div>
         <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Novo Fornecedor
         </button>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
        gap: '1rem' 
      }}>
        {vendors.map((vendor: Vendor) => {
          const vendorSystems = systems.filter(s => s.vendorId === vendor.id);

          return (
            <div 
              key={vendor.id} 
              className="glass-panel-interactive" 
              onClick={() => setSelectedVendor(vendor)}
              style={{ 
                padding: '0.75rem', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                textAlign: 'center',
                gap: '0.4rem',
                minHeight: '100px',
                background: '#FFFFFF'
              }}
            >
              <div style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 'var(--radius-md)', 
                background: '#F8FAFC', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '0.4rem',
                border: '1px solid var(--glass-border)'
              }}>
                {VENDOR_LOGOS[vendor.id] || vendor.logoUrl ? (
                  <img src={VENDOR_LOGOS[vendor.id] || vendor.logoUrl || ''} alt={vendor.companyName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                ) : (
                  <Building size={32} color="var(--text-tertiary)" />
                )}
              </div>
              
              <div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: 0 }}>{vendor.companyName}</h3>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                  {vendorSystems.length} Sistema(s)
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {selectedVendor && (
        <VendorDetailModal 
          vendor={selectedVendor} 
          allContracts={contracts}
          allSystems={systems}
          onClose={() => setSelectedVendor(null)} 
          onEdit={(vendor) => {
            setEditingVendor(vendor);
            setSelectedVendor(null);
            setShowForm(true);
          }}
          onDelete={handleDeleteVendor}
        />
      )}

      {showForm && (
        <VendorForm 
          companies={companies}
          departments={departments}
          vendor={editingVendor || undefined}
          onClose={() => {
            setShowForm(false);
            setEditingVendor(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingVendor(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default Vendors;
