import type { PrismaClient } from '@prisma/client';

interface AbsencesControllerDeps {
  prisma: PrismaClient;
}

export function createAbsencesController(deps: AbsencesControllerDeps) {
  const { prisma } = deps;

  const getAbsences = async (req: any, res: any) => {
    const { companyId, departmentId, teamId } = req.query;
    try {
      const absences = await prisma.absence.findMany({
        where: {
          collaborator: {
            companyId: companyId as string,
            departmentId: departmentId as string,
            squadId: teamId ? (teamId as string) : undefined
          }
        },
        include: { collaborator: true }
      });
      res.json(absences);
    } catch (error) {
      console.error('API Error /api/absences [GET]:', error);
      res.status(500).json({ error: 'Failed to fetch absences' });
    }
  };

  const createAbsence = async (req: any, res: any) => {
    try {
      const absence = await prisma.absence.create({
        data: req.body,
        include: { collaborator: true }
      });
      res.json(absence);
    } catch (error) {
      console.error('API Error /api/absences [POST]:', error);
      res.status(500).json({ error: 'Failed to create absence' });
    }
  };

  const deleteAbsence = async (req: any, res: any) => {
    const { id } = req.params;
    try {
      await prisma.absence.delete({ where: { id } });
      res.json({ message: 'Absence deleted' });
    } catch (error) {
      console.error('API Error /api/absences/:id [DELETE]:', error);
      res.status(500).json({ error: 'Failed to delete absence' });
    }
  };

  return {
    getAbsences,
    createAbsence,
    deleteAbsence
  };
}
