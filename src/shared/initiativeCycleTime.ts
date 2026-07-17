import type { Initiative } from '../domain/entities/Initiative.js';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const parseDateSafe = (dateStr?: string | Date | null): Date | null => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;

  const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = datePart.split('-');

  if (parts.length === 3) {
    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = Number(parts[2]);
    return new Date(year, month, day);
  }

  return new Date(dateStr);
};

export const getInitiativeCycleTime = (
  initiative: Pick<Initiative, 'startDate' | 'endDate' | 'actualEndDate' | 'status' | 'createdAt'>,
  now = new Date()
): number => {
  const startReference = parseDateSafe(initiative.startDate) || (initiative.createdAt ? new Date(initiative.createdAt) : null);
  if (!startReference) return -1;

  const actualEnd = parseDateSafe(initiative.actualEndDate);
  const plannedEnd = parseDateSafe(initiative.endDate);
  const isTerminal = ['9- Concluído', 'Suspenso', 'Cancelado'].includes(initiative.status);
  const endReference = actualEnd || ((isTerminal && plannedEnd) ? plannedEnd : now);

  if (!endReference) return -1;

  return Math.floor((endReference.getTime() - startReference.getTime()) / DAY_IN_MS);
};

export const getInitiativeTargetTone = (
  initiative: Pick<Initiative, 'endDate' | 'actualEndDate'>
): 'green' | 'red' | 'neutral' => {
  const actualEnd = parseDateSafe(initiative.actualEndDate);
  const plannedEnd = parseDateSafe(initiative.endDate);

  if (!actualEnd) return 'neutral';
  if (!plannedEnd) return 'green';
  return actualEnd.getTime() > plannedEnd.getTime() ? 'red' : 'green';
};

export const shouldStrikePlannedTarget = (
  initiative: Pick<Initiative, 'endDate' | 'actualEndDate'>
): boolean => Boolean(initiative.actualEndDate && initiative.endDate);
