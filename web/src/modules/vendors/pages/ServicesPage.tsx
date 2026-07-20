import React, { useEffect } from 'react';
import { Wrench } from 'lucide-react';

/**
 * Visão "Serviços" de Produtos — placeholder. O conteúdo funcional ainda não
 * foi especificado; ver docs/04-delivery-plan/open-questions.md.
 */
const Services: React.FC = () => {
  useEffect(() => {
    document.title = 'Serviços | Oráculo';
    return () => {
      document.title = 'Oráculo';
    };
  }, []);

  return (
    <div className="page-layout">
      <div className="glass-panel view-placeholder">
        <Wrench size={32} color="var(--text-tertiary)" />
        <h3>Serviços</h3>
        <p>Esta visão ainda está em construção.</p>
      </div>
    </div>
  );
};

export default Services;
