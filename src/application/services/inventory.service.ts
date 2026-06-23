import { Inject, Injectable } from '@nestjs/common';
import type { InventoryContext, InventoryScope } from '../../domain/entities/Inventory.js';
import { INVENTORY_REPOSITORY } from '../../domain/repositories/tokens.js';
import type { InventoryRepository } from '../../domain/repositories/InventoryRepository.js';

@Injectable()
export class InventoryService {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly repository: InventoryRepository
  ) {}

  getInventoryContext(scope: InventoryScope): Promise<InventoryContext> {
    return this.repository.getInventoryContext(scope);
  }
}
