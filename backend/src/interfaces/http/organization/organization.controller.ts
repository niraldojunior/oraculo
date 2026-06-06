import type { Response } from 'express';
import type { OrganizationApplicationService } from '../../../application/OrganizationApplicationService.js';

interface OrganizationControllerDeps {
  organizationService: OrganizationApplicationService;
  buildCacheKey: (resource: string, where?: Record<string, unknown>) => string;
  getCachedState: <T>(key: string) => { value: T; stale: boolean } | null;
  isRefreshing: (key: string) => boolean;
  markRefreshing: (key: string, refreshing: boolean) => void;
  singleflight: <T>(key: string, factory: () => Promise<T>) => Promise<T>;
  setCached: (key: string, value: unknown) => void;
  invalidateCacheByPrefix: (prefix: string) => void;
  invalidateImageCacheByPrefix: (prefix: string) => void;
  serveSWR: <T>(
    res: Response,
    cacheKey: string,
    fetchFresh: () => Promise<T>,
    logLabel: string
  ) => Promise<void>;
  getCommonWhere: (req: any) => Record<string, string>;
  sanitizeTeam: (data: Record<string, any>) => Record<string, any>;
  sanitizeCollaborator: (data: Record<string, any>) => Record<string, any>;
  ensureCompanyMatchesDept: (data: any) => Promise<any>;
  optimizeFieldInPlace: (obj: any, field: string, kind: any) => Promise<any>;
  transformCollaboratorImage: <T extends { id: string; photoUrl?: string | null }>(c: T) => T;
  collaboratorSafeSelect: any;
  collaboratorDashboardSelect: any;
}

export function createOrganizationController(deps: OrganizationControllerDeps) {
  const {
    organizationService,
    buildCacheKey,
    getCachedState,
    isRefreshing,
    markRefreshing,
    singleflight,
    setCached,
    invalidateCacheByPrefix,
    invalidateImageCacheByPrefix,
    serveSWR,
    getCommonWhere,
    sanitizeTeam,
    sanitizeCollaborator,
    ensureCompanyMatchesDept,
    optimizeFieldInPlace,
    transformCollaboratorImage,
    collaboratorSafeSelect,
    collaboratorDashboardSelect
  } = deps;

  const getTeams = async (req: any, res: any) => {
    try {
      const where = getCommonWhere(req);
      const cacheKey = buildCacheKey('teams', where);
      await serveSWR(res, cacheKey, async () => {
        const queryStart = Date.now();
        const teams = await organizationService.listTeamsByScope(where);
        console.log('Found', teams.length, 'teams', `| dbQueryMs=${Date.now() - queryStart}`);
        setCached(cacheKey, teams);
        return teams;
      }, 'teams');
    } catch (error) {
      console.error('API Error /api/teams [GET]:', error);
      res.status(500).json({ error: 'Failed to fetch teams' });
    }
  };

  const createTeam = async (req: any, res: any) => {
    try {
      const data = sanitizeTeam(req.body);
      await ensureCompanyMatchesDept(data);

      const team = await organizationService.createTeam(data);
      invalidateCacheByPrefix('teams');
      res.json(team);
    } catch (error: any) {
      console.error('API Error /api/teams [POST]:', error);
      res.status(500).json({ error: 'Failed to create team', details: error.message });
    }
  };

  const updateTeam = async (req: any, res: any) => {
    const { id } = req.params;
    try {
      const data = sanitizeTeam(req.body);

      const team = await organizationService.updateTeam(id, data);
      invalidateCacheByPrefix('teams');
      res.json(team);
    } catch (error: any) {
      console.error('API Error /api/teams/:id [PATCH]:', error);
      res.status(500).json({ error: 'Failed to update team', details: error.message });
    }
  };

  const deleteTeam = async (req: any, res: any) => {
    const { id } = req.params;
    try {
      await organizationService.deleteTeam(id);
      invalidateCacheByPrefix('teams');
      res.json({ message: 'Team deleted' });
    } catch (error) {
      console.error('API Error /api/teams/:id [DELETE]:', error);
      res.status(500).json({ error: 'Failed to delete team' });
    }
  };

  const getCollaborators = async (req: any, res: any) => {
    try {
      const lite = String(req.query.lite || 'false').toLowerCase() === 'true';
      const where = getCommonWhere(req);
      const cacheKey = buildCacheKey('collaborators', { ...where, lite });
      await serveSWR(res, cacheKey, async () => {
        const queryStart = Date.now();
        const collaborators = (await organizationService.listCollaboratorsByScope({
          scope: where,
          lite,
          safeSelect: collaboratorSafeSelect,
          dashboardSelect: collaboratorDashboardSelect
        }))
          .map(c => transformCollaboratorImage(c as any));
        console.log('Found', collaborators.length, 'collaborators', `| dbQueryMs=${Date.now() - queryStart}`, `| lite=${lite}`);
        setCached(cacheKey, collaborators);
        return collaborators;
      }, `collaborators lite=${lite}`);
    } catch (error) {
      console.error('API Error /api/collaborators [GET]:', error);
      res.status(500).json({ error: 'Failed to fetch collaborators' });
    }
  };

  const createCollaborator = async (req: any, res: any) => {
    try {
      const data = sanitizeCollaborator(req.body);
      await optimizeFieldInPlace(data, 'photoUrl', 'photo');

      const collaborator = await organizationService.createCollaborator(data);
      invalidateCacheByPrefix('collaborators');
      invalidateImageCacheByPrefix(`img:collaborator:${collaborator.id}`);
      res.json(collaborator);
    } catch (error: any) {
      console.error('API Error /api/collaborators [POST]:', error);
      if (error?.code === 'P2002') {
        return res.status(409).json({ error: 'Já existe um colaborador com este e-mail corporativo.' });
      }
      res.status(500).json({ error: 'Failed to create collaborator', details: error.message });
    }
  };

  const updateCollaborator = async (req: any, res: any) => {
    const { id } = req.params;
    try {
      const data = sanitizeCollaborator(req.body);
      await ensureCompanyMatchesDept(data);
      await optimizeFieldInPlace(data, 'photoUrl', 'photo');

      const collaborator = await organizationService.updateCollaborator(id, data);
      invalidateCacheByPrefix('collaborators');
      invalidateImageCacheByPrefix(`img:collaborator:${id}`);
      res.json(collaborator);
    } catch (error: any) {
      console.error('API Error /api/collaborators/:id [PATCH]:', error);
      res.status(500).json({ error: 'Failed to update collaborator', details: error.message });
    }
  };

  const deleteCollaborator = async (req: any, res: any) => {
    const { id } = req.params;
    try {
      const collaborator = await organizationService.findCollaboratorById(id);
      if (!collaborator) return res.status(404).json({ error: 'Collaborator not found' });

      await organizationService.deleteCollaborator(id);
      invalidateCacheByPrefix('collaborators');
      invalidateImageCacheByPrefix(`img:collaborator:${id}`);
      res.json({ message: 'Collaborator deleted' });
    } catch (error: any) {
      console.error('API Error /api/collaborators/:id [DELETE]:', error);
      res.status(500).json({ error: 'Failed to delete collaborator', details: error.message });
    }
  };

  const getCollaboratorByEmail = async (req: any, res: any) => {
    const { email } = req.params;
    const cacheKey = buildCacheKey('auth-collaborator', { email });
    try {
      const state = getCachedState<any>(cacheKey);
      const fetchFresh = async () => {
        const queryStart = Date.now();
        const collaborator = await organizationService.findCollaboratorByEmail(email);
        console.log('auth-collaborator', email, `| dbQueryMs=${Date.now() - queryStart}`);
        if (collaborator) setCached(cacheKey, collaborator);
        return collaborator;
      };

      if (state) {
        if (state.stale && !isRefreshing(cacheKey)) {
          markRefreshing(cacheKey, true);
          singleflight(cacheKey, fetchFresh)
            .catch(err => console.error('SWR refresh failed for', cacheKey, err))
            .finally(() => markRefreshing(cacheKey, false));
        }
        return res.json(state.value);
      }

      const collaborator = await singleflight(cacheKey, fetchFresh);
      return res.json(collaborator);
    } catch (error) {
      console.error('API Error /api/collaborators/email/:email [GET]:', error);
      res.status(500).json({ error: 'Failed to fetch collaborator data (Database error)' });
    }
  };

  const toggleCollaboratorSkill = async (req: any, res: any) => {
    const { collaboratorId, skillId, active } = req.body;
    try {
      await organizationService.toggleCollaboratorSkill({ collaboratorId, skillId, active });
      invalidateCacheByPrefix('collaborators');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to toggle skill' });
    }
  };

  return {
    getTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    getCollaborators,
    createCollaborator,
    updateCollaborator,
    deleteCollaborator,
    getCollaboratorByEmail,
    toggleCollaboratorSkill
  };
}
