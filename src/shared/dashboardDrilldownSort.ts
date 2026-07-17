import { parseDateSafe } from './initiativeCycleTime.js';

export type DrilldownSortKey = 'title' | 'type' | 'startDate' | 'endDate' | 'actualEndDate' | 'status' | 'cycleTime' | 'leader' | 'demandante';
export type DrilldownSortDirection = 'asc' | 'desc';

export type DrilldownInitiative = {
  id?: string;
  title?: string;
  type?: string;
  startDate?: string | null;
  endDate?: string | null;
  actualEndDate?: string | null;
  status?: string;
  leaderId?: string | null;
  originDirectorate?: string | null;
  cycleTime: number | null;
};

export type DrilldownSortConfig = {
  key: DrilldownSortKey;
  direction: DrilldownSortDirection;
} | null;

const compareNullableNumbers = (a: number | null | undefined, b: number | null | undefined): number => {
  const aMissing = a == null;
  const bMissing = b == null;
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;
  return a - b;
};

const compareNullableDates = (a?: string | null, b?: string | null): number => {
  const aTime = parseDateSafe(a)?.getTime();
  const bTime = parseDateSafe(b)?.getTime();
  return compareNullableNumbers(aTime, bTime);
};

const compareStrings = (a?: string | null, b?: string | null): number => {
  const left = String(a ?? '');
  const right = String(b ?? '');
  return left.localeCompare(right, 'pt-BR', { sensitivity: 'base' });
};

const compareByKey = (a: DrilldownInitiative, b: DrilldownInitiative, key: DrilldownSortKey): number => {
  switch (key) {
    case 'title':
      return compareStrings(a.title, b.title);
    case 'type':
      return compareStrings(a.type, b.type);
    case 'startDate':
      return compareNullableDates(a.startDate, b.startDate);
    case 'endDate':
      return compareNullableDates(a.endDate, b.endDate);
    case 'actualEndDate':
      return compareNullableDates(a.actualEndDate, b.actualEndDate);
    case 'status':
      return compareStrings(a.status, b.status);
    case 'cycleTime':
      return compareNullableNumbers(a.cycleTime, b.cycleTime);
    case 'leader':
      return compareStrings(a.leaderId, b.leaderId);
    case 'demandante':
      return compareStrings(a.originDirectorate, b.originDirectorate);
    default:
      return 0;
  }
};

export const sortDrilldownInitiatives = <T extends DrilldownInitiative>(
  initiatives: T[],
  sortConfig: DrilldownSortConfig
): T[] => {
  const list = [...initiatives];

  if (!sortConfig) {
    return list.sort((a, b) => {
      const dateA = parseDateSafe(a.actualEndDate)?.getTime() ?? parseDateSafe(a.endDate)?.getTime() ?? 0;
      const dateB = parseDateSafe(b.actualEndDate)?.getTime() ?? parseDateSafe(b.endDate)?.getTime() ?? 0;
      return dateA - dateB;
    });
  }

  const factor = sortConfig.direction === 'asc' ? 1 : -1;
  return list.sort((a, b) => compareByKey(a, b, sortConfig.key) * factor);
};
