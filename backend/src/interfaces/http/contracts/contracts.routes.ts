import { Router } from 'express';
import type { ContractApplicationService } from '../../../application/ContractApplicationService.js';
import { createContractsController } from './contracts.controller.js';

interface ContractsRouterDeps {
  contractService: ContractApplicationService;
  getCommonWhere: (req: any) => Record<string, string>;
  sanitizeContract: (data: Record<string, any>) => Record<string, any>;
  ensureCompanyMatchesDept: (data: any) => Promise<any>;
}

export function createContractsRouter(deps: ContractsRouterDeps) {
  const router = Router();
  const controller = createContractsController(deps);

  router.get('/api/contracts', controller.getContracts);
  router.post('/api/contracts', controller.createContract);
  router.patch('/api/contracts/:id', controller.updateContract);
  router.delete('/api/contracts/:id', controller.deleteContract);

  return router;
}
