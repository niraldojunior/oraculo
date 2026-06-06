import type { ContractApplicationService } from '../../../application/ContractApplicationService.js';

interface ContractsControllerDeps {
  contractService: ContractApplicationService;
  getCommonWhere: (req: any) => Record<string, string>;
  sanitizeContract: (data: Record<string, any>) => Record<string, any>;
  ensureCompanyMatchesDept: (data: any) => Promise<any>;
}

export function createContractsController(deps: ContractsControllerDeps) {
  const {
    contractService,
    getCommonWhere,
    sanitizeContract,
    ensureCompanyMatchesDept
  } = deps;

  const getContracts = async (req: any, res: any) => {
    try {
      const where = getCommonWhere(req);
      console.log('Fetching contracts with filter:', JSON.stringify(where));
      const queryStart = Date.now();
      const contracts = await contractService.listContracts(where);
      const queryMs = Date.now() - queryStart;
      console.log('Found', contracts.length, 'contracts', `| dbQueryMs=${queryMs}`);
      res.json(contracts);
    } catch (error: any) {
      console.error('API Error /api/contracts [GET]:', error?.message || error);
      if (error?.stack) console.error('Stack:', error.stack);
      res.status(500).json({
        error: 'Failed to fetch contracts',
        details: error?.message,
        code: error?.code
      });
    }
  };

  const createContract = async (req: any, res: any) => {
    try {
      const data = sanitizeContract(req.body);
      await ensureCompanyMatchesDept(data);
      const contract = await contractService.createContract(data);
      res.json(contract);
    } catch (error: any) {
      console.error('API Error /api/contracts [POST]:', error);
      res.status(500).json({ error: 'Failed to create contract', details: error.message });
    }
  };

  const updateContract = async (req: any, res: any) => {
    const { id } = req.params;
    try {
      const data = sanitizeContract(req.body);
      await ensureCompanyMatchesDept(data);
      const contract = await contractService.updateContract(id, data);
      res.json(contract);
    } catch (error: any) {
      console.error('API Error /api/contracts/:id [PATCH]:', error);
      res.status(500).json({ error: 'Failed to update contract', details: error.message });
    }
  };

  const deleteContract = async (req: any, res: any) => {
    const { id } = req.params;
    try {
      await contractService.deleteContract(id);
      res.json({ message: 'Contract deleted' });
    } catch (error: any) {
      console.error('API Error /api/contracts/:id [DELETE]:', error);
      res.status(500).json({ error: 'Failed to delete contract', details: error.message });
    }
  };

  return {
    getContracts,
    createContract,
    updateContract,
    deleteContract
  };
}
