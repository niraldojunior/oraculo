import type { Collaborator } from './Collaborator.js';
import type { Department } from './Department.js';
import type { System } from './System.js';
import type { Team } from './Team.js';
import type { Vendor } from './Vendor.js';

export interface InventoryScope {
  companyId?: string;
  departmentId?: string;
}

export interface InventoryContext {
  systems: System[];
  teams: Team[];
  collaborators: Collaborator[];
  vendors: Vendor[];
  departments: Department[];
}
