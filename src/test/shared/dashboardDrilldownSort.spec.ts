import { describe, expect, it } from '@jest/globals';
import { sortDrilldownInitiatives } from '../../shared/dashboardDrilldownSort.js';

describe('dashboardDrilldownSort', () => {
  const initiatives = [
    { id: 'i1', title: 'Beta', status: '9- Concluído', startDate: '2026-06-01', endDate: '2026-06-10', actualEndDate: '2026-06-12', cycleTime: 11, createdAt: new Date('2026-06-01T00:00:00.000Z') },
    { id: 'i2', title: 'Alpha', status: '9- Concluído', startDate: '2026-06-01', endDate: '2026-06-08', actualEndDate: '2026-06-08', cycleTime: 7, createdAt: new Date('2026-06-01T00:00:00.000Z') },
    { id: 'i3', title: 'Gamma', status: '9- Concluído', startDate: '2026-06-01', endDate: '2026-06-15', actualEndDate: null, cycleTime: 14, createdAt: new Date('2026-06-01T00:00:00.000Z') }
  ] as any;

  it('keeps default order by actual/planned end date', () => {
    const result = sortDrilldownInitiatives(initiatives, null);
    expect(result.map(it => it.id)).toEqual(['i2', 'i1', 'i3']);
  });

  it('sorts by cycle time when clicked', () => {
    const result = sortDrilldownInitiatives(initiatives, { key: 'cycleTime', direction: 'asc' });
    expect(result.map(it => it.id)).toEqual(['i2', 'i1', 'i3']);
  });

  it('sorts by title descending', () => {
    const result = sortDrilldownInitiatives(initiatives, { key: 'title', direction: 'desc' });
    expect(result.map(it => it.id)).toEqual(['i3', 'i1', 'i2']);
  });
});
