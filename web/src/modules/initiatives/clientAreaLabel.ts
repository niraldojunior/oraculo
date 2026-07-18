import type { BusinessUnit, ClientTeam } from '@/types';

/**
 * Monta o rótulo "Unidade de Negócio > Cliente" para uma área cliente selecionada
 * numa iniciativa. A iniciativa guarda apenas o NOME do cliente (originDirectorate);
 * a Unidade de Negócio é derivada através do ClientTeam correspondente.
 *
 * Fallback: se o nome não bater com nenhum ClientTeam, ou o cliente não tiver
 * Unidade associada, retorna o nome cru (preserva iniciativas legadas).
 */
export function formatClientArea(
  name: string | null | undefined,
  clientTeams: ClientTeam[],
  businessUnits: BusinessUnit[] = []
): string {
  if (!name) return '';

  const team = clientTeams.find(ct => ct.name === name);
  if (!team) return name;

  const unitName =
    team.businessUnitName ??
    businessUnits.find(bu => bu.id === team.businessUnitId)?.name ??
    null;

  return unitName ? `${unitName} > ${name}` : name;
}
