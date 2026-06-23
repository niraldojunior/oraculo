import { getJson } from '@/shared/http/apiClient';
import type { Integration, System } from '../../../types';

export interface TopologyData {
  systems: System[];
  integrations: Integration[];
}

export async function fetchTopologyData(): Promise<TopologyData> {
  const [systems, integrations] = await Promise.all([
    getJson<System[]>('/api/systems'),
    getJson<Integration[]>('/api/integrations')
  ]);

  return {
    systems: Array.isArray(systems) ? systems : [],
    integrations: Array.isArray(integrations) ? integrations : []
  };
}
