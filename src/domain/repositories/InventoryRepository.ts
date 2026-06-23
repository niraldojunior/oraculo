import type { InventoryContext, InventoryScope } from '../entities/Inventory.js';

export interface InventoryRepository {
  getInventoryContext(scope: InventoryScope): Promise<InventoryContext>;
}
