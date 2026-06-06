import type { SkillApplicationService } from '../../../application/SkillApplicationService.js';

interface SkillsControllerDeps {
  skillService: SkillApplicationService;
  optimizeFieldInPlace: (obj: any, field: string, kind: any) => Promise<any>;
  invalidateImageCacheByPrefix: (prefix: string) => void;
  transformSkillImage: <T extends { id: string; icon?: string | null }>(s: T) => T;
  transformCollaboratorImage: <T extends { id: string; photoUrl?: string | null }>(c: T) => T;
  sanitizeSkill: (data: Record<string, any>) => Record<string, any>;
}

export function createSkillsController(deps: SkillsControllerDeps) {
  const {
    skillService,
    optimizeFieldInPlace,
    invalidateImageCacheByPrefix,
    transformSkillImage,
    transformCollaboratorImage,
    sanitizeSkill
  } = deps;

  const getSkills = async (req: any, res: any) => {
    const { companyId, departmentId } = req.query;
    try {
      const where: any = {};
      if (companyId) where.companyId = companyId as string;
      if (departmentId) where.departmentId = departmentId as string;

      const list = await skillService.listSkills(where);

      const transformed = list.map(s => {
        const skill = transformSkillImage(s as any);
        if (Array.isArray(skill.collaborators)) {
          skill.collaborators = skill.collaborators.map((sc: any) => ({
            ...sc,
            collaborator: sc.collaborator ? transformCollaboratorImage(sc.collaborator) : sc.collaborator
          }));
        }
        return skill;
      });
      res.json(transformed);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch skills' });
    }
  };

  const createSkill = async (req: any, res: any) => {
    const { memberIds, ...rest } = req.body;
    const skillData = sanitizeSkill(rest);
    await optimizeFieldInPlace(skillData, 'icon', 'icon');
    try {
      const skill = await skillService.createSkill(skillData, memberIds);
      invalidateImageCacheByPrefix(`img:skill:${skill.id}`);
      res.json(skill);
    } catch (error: any) {
      console.error('Error creating skill:', error);
      res.status(500).json({ error: 'Failed to create skill', details: error.message });
    }
  };

  const updateSkill = async (req: any, res: any) => {
    const { id } = req.params;
    const { id: _, collaborators, memberIds, ...rest } = req.body;
    const updateData = sanitizeSkill(rest);
    await optimizeFieldInPlace(updateData, 'icon', 'icon');
    console.log(`PATCH /api/skills/${id} — memberIds:`, memberIds);
    try {
      const skill = await skillService.updateSkill(id, updateData, memberIds);
      invalidateImageCacheByPrefix(`img:skill:${id}`);
      console.log(`PATCH /api/skills/${id} — saved collaborators:`, (skill as any)?.collaborators?.length);
      res.json(skill);
    } catch (error: any) {
      console.error('Error updating skill:', error);
      res.status(500).json({ error: 'Failed to update skill', details: error.message });
    }
  };

  const deleteSkill = async (req: any, res: any) => {
    const { id } = req.params;
    try {
      await skillService.deleteSkill(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete skill' });
    }
  };

  return {
    getSkills,
    createSkill,
    updateSkill,
    deleteSkill
  };
}
