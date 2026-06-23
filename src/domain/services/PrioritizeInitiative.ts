import type { Initiative } from '../entities/Initiative.js';

export function prioritizeInitiative(initiative: Initiative, nextPriority: number): Initiative {
  return {
    ...initiative,
    priority: nextPriority
  };
}
