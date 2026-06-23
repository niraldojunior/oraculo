import { Injectable } from '@nestjs/common';
import type { InventoryContext, InventoryScope } from '../../../domain/entities/Inventory.js';
import type { InventoryRepository } from '../../../domain/repositories/InventoryRepository.js';

@Injectable()
export class InMemoryInventoryRepository implements InventoryRepository {
  async getInventoryContext(_scope: InventoryScope): Promise<InventoryContext> {
    return {
      systems: [],
      teams: [],
      collaborators: [],
      vendors: [],
      departments: []
    };
  }
}
