import type { BusinessUnit, ClientTeam } from '@/types';

/**
 * Monta o rótulo "Unidade de Negócio > Cliente" usando ClientTeam.id.
 * O fallback por nome existe somente para respostas legadas durante o rollout.
 */
export function formatClientArea(
  clientTeamIdOrLegacyName: string | null | undefined,
  clientTeams: ClientTeam[],
  businessUnits: BusinessUnit[] = []
): string {
  if (!clientTeamIdOrLegacyName) return '';

  const team = clientTeams.find(ct => ct.id === clientTeamIdOrLegacyName)
    ?? clientTeams.find(ct => ct.name === clientTeamIdOrLegacyName);
  if (!team) return clientTeamIdOrLegacyName;

  const unitName =
    team.businessUnitName ??
    businessUnits.find(bu => bu.id === team.businessUnitId)?.name ??
    null;

  return unitName ? `${unitName} > ${team.name}` : team.name;
}
