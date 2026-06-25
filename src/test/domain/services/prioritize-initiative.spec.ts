import { describe, expect, it } from '@jest/globals';
import { prioritizeInitiative } from '../../../domain/services/PrioritizeInitiative.js';

describe('prioritizeInitiative', () => {
  it('should update priority preserving other fields', () => {
    const original = {
      id: 'i1',
      title: 'Improve API',
      priority: 1,
      status: 'Backlog' as const,
      createdAt: new Date('2026-01-01T00:00:00.000Z')
    };

    const updated = prioritizeInitiative(original, 5);

    expect(updated.priority).toBe(5);
    expect(updated.id).toBe(original.id);
    expect(updated.title).toBe(original.title);
  });
});

