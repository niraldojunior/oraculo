import type { Initiative } from '../models/Initiative.js';

export function prioritizeInitiative(
  initiative: Initiative,
  nextPriority: number
): Initiative {
  return {
    ...initiative,
    priority: nextPriority
  };
}
