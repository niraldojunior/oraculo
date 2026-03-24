import React, { useState, useEffect } from 'react';
import { Building, FileText, Shield, Package, LayoutGrid, X as CloseIcon } from 'lucide-react';
import type { Vendor, Contract, System } from '../types';

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

// Removed redundant global formatCurrency

const VendorDetailModal: React.FC<{ 
  vendor: Vendor; 
  onClose: () => void;
  allContracts: Contract[];
  allSystems: System[];
}> = ({ vendor, onClose, allContracts, allSystems }) => {
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
              {VENDOR_LOGOS[vendor.id] ? (
                <img src={VENDOR_LOGOS[vendor.id]} alt={vendor.companyName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
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
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/vendors').then(res => res.json()),
      fetch('/api/contracts').then(res => res.json()),
      fetch('/api/systems').then(res => res.json())
    ])
    .then(([vendorsData, contractsData, systemsData]) => {
      setVendors(Array.isArray(vendorsData) ? vendorsData : []);
      setContracts(Array.isArray(contractsData) ? contractsData : []);
      setSystems(Array.isArray(systemsData) ? systemsData : []);
      setLoading(false);
    })
    .catch(err => {
      console.error('Failed to fetch vendors data', err);
      setLoading(false);
    });
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
      {/* Empty space for header alignment */}
      <div style={{ marginBottom: '1rem' }}></div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '1.5rem' 
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
                gap: '0.5rem',
                minHeight: '110px',
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
                {VENDOR_LOGOS[vendor.id] ? (
                  <img src={VENDOR_LOGOS[vendor.id]} alt={vendor.companyName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
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

              {/* Systems list hidden for compactness, visible in modal */}
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
        />
      )}
    </div>
  );
};

export default Vendors;
