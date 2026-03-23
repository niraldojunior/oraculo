import React from 'react';
import { mockVendors, mockContracts } from '../data/mockDb';
import { AlertTriangle, Building, FileText, DollarSign } from 'lucide-react';
import { differenceInDays } from 'date-fns';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
};

const Vendors: React.FC = () => {
  const today = new Date('2026-03-22');

  const totalOpex = mockContracts.reduce((sum, c) => sum + c.annualCost, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="flex-between">
        <div>
          <h1>Governança de Terceiros e TCO</h1>
          <p className="text-secondary">Gestão de Fornecedores, Contratos e Custos Atribuídos (RF09).</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="text-secondary" style={{ fontSize: '0.875rem' }}>CAPEX / OPEX Anual</span>
          <h2 style={{ color: 'var(--accent-light)' }}>{formatCurrency(totalOpex)}</h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {mockVendors.map(vendor => {
          const contracts = mockContracts.filter(c => c.vendorId === vendor.id);

          return (
            <div key={vendor.id} className="glass-panel" style={{ padding: '0', overflow: 'hidden', background: '#FFFFFF' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', background: '#F8FAFC' }}>
                <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)' }}>
                      <Building size={24} className="text-secondary" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.25rem' }}>{vendor.companyName}</h3>
                      <p className="text-tertiary" style={{ fontSize: '0.875rem' }}>CNPJ: {vendor.taxId}</p>
                    </div>
                  </div>
                  <span className="badge-dark" style={{ 
                    background: '#181919', 
                    color: '#FFD919', 
                    padding: '0.4rem 0.75rem', 
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}>{vendor.type}</span>
                </div>
              </div>

              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={16} /> Contratos Ativos ({contracts.length})
                </h4>
                
                {contracts.map(contract => {
                  const end = new Date(contract.endDate);
                  const daysLeft = differenceInDays(end, today);
                  const isExpiring = daysLeft <= 90 && daysLeft >= 0;
                  const isExpired = daysLeft < 0;

                  return (
                    <div key={contract.id} style={{ padding: '1rem', background: '#F1F5F9', borderRadius: 'var(--radius-sm)', border: '1px solid', borderColor: isExpired ? 'hsla(0, 80%, 60%, 0.5)' : isExpiring ? 'hsla(40, 90%, 55%, 0.5)' : 'var(--glass-border)' }}>
                      <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                        <div style={{ fontWeight: 600 }}>{contract.number}</div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <span className="badge" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border-strong)' }}>
                            {contract.model}
                          </span>
                          {(isExpiring || isExpired) && (
                            <span className={isExpired ? 'badge badge-red' : 'badge badge-amber'} style={{ display: 'flex', gap: '0.25rem' }}>
                              <AlertTriangle size={12} /> {isExpired ? 'Vencido' : `Vence em ${daysLeft} dias`}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-between" style={{ fontSize: '0.875rem' }}>
                        <span className="text-secondary">Vigência: {contract.startDate} a {contract.endDate}</span>
                        <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-light)' }}>
                          <DollarSign size={14} /> {formatCurrency(contract.annualCost)}/ano
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Vendors;
