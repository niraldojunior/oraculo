import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { BusinessUnit, ClientTeam } from '@/types';
import { fetchBusinessUnits, fetchClientTeams } from '@/modules/organization/services/organizationApi';
import { formatClientArea } from './clientAreaLabel';

export interface ClientAreaOption {
  value: string;
  label: string;
}

/**
 * Carrega as áreas cliente (ClientTeam) e suas Unidades de Negócio do backend,
 * no escopo da empresa/departamento atuais. Expõe também as opções já rotuladas
 * como "Unidade de Negócio > Cliente" para uso nos seletores de iniciativa.
 */
export function useClientAreas(): {
  clientTeams: ClientTeam[];
  businessUnits: BusinessUnit[];
  options: ClientAreaOption[];
} {
  const { currentCompany, currentDepartment } = useAuth();
  const [clientTeams, setClientTeams] = useState<ClientTeam[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);

  useEffect(() => {
    let active = true;
    if (!currentCompany?.id) {
      setClientTeams([]);
      setBusinessUnits([]);
      return;
    }
    const scope = { companyId: currentCompany.id, departmentId: currentDepartment?.id };
    Promise.all([fetchClientTeams(scope), fetchBusinessUnits(scope)])
      .then(([teams, units]) => {
        if (!active) return;
        setClientTeams(teams);
        setBusinessUnits(units);
      })
      .catch(err => console.error('Failed to load client areas:', err));
    return () => {
      active = false;
    };
  }, [currentCompany?.id, currentDepartment?.id]);

  const options: ClientAreaOption[] = clientTeams
    .map(ct => ({ value: ct.name, label: formatClientArea(ct.name, clientTeams, businessUnits) }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return { clientTeams, businessUnits, options };
}
