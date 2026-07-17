import { describe, expect, it } from '@jest/globals';
import { getInitiativeCycleTime, getInitiativeTargetTone, parseDateSafe, shouldStrikePlannedTarget } from '../../shared/initiativeCycleTime.js';

describe('initiativeCycleTime helpers', () => {
  it('prefers actualEndDate over endDate when calculating cycle time', () => {
    const initiative = {
      startDate: '2026-06-01',
      endDate: '2026-06-20',
      actualEndDate: '2026-06-21',
      status: '9- Concluído',
      createdAt: new Date('2026-06-01T00:00:00.000Z')
    } as const;

    expect(getInitiativeCycleTime(initiative, new Date('2026-06-30T00:00:00.000Z'))).toBe(20);
  });

  it('falls back to endDate when actualEndDate is missing', () => {
    const initiative = {
      startDate: '2026-06-01',
      endDate: '2026-06-20',
      status: '9- Concluído',
      createdAt: new Date('2026-06-01T00:00:00.000Z')
    } as const;

    expect(getInitiativeCycleTime(initiative, new Date('2026-06-30T00:00:00.000Z'))).toBe(19);
  });

  it('parses local dates without UTC drift', () => {
    const parsed = parseDateSafe('2026-06-21');

    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(5);
    expect(parsed?.getDate()).toBe(21);
  });

  it('colors target green when actual date is earlier or on time and red when delayed', () => {
    expect(getInitiativeTargetTone({
      endDate: '2026-06-20',
      actualEndDate: '2026-06-18',
    })).toBe('green');

    expect(getInitiativeTargetTone({
      endDate: '2026-06-20',
      actualEndDate: '2026-06-22',
    })).toBe('red');

    expect(getInitiativeTargetTone({
      endDate: '2026-06-20',
    })).toBe('neutral');
  });

  it('strikes the planned target whenever actual date exists', () => {
    expect(shouldStrikePlannedTarget({
      endDate: '2026-06-20',
      actualEndDate: '2026-06-18'
    })).toBe(true);

    expect(shouldStrikePlannedTarget({
      endDate: '2026-06-20'
    })).toBe(false);
  });
});
