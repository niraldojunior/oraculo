import type { PrismaClient } from '@prisma/client';

interface CoreControllerDeps {
  prisma: PrismaClient;
}

export function createCoreController(deps: CoreControllerDeps) {
  const { prisma } = deps;

  const getHealth = async (_req: any, res: any) => {
    res.json({ status: 'OK', message: 'Server is running' });
  };

  const login = async (req: any, res: any) => {
    let { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });

    email = email.trim().toLowerCase();

    try {
      const collaborator = await prisma.collaborator.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          name: true,
          isAdmin: true,
          companyId: true,
          departmentId: true,
          role: true,
          associatedCompanyIds: true
        }
      });

      if (collaborator && (collaborator as any).password === password) {
        return res.json({
          user: collaborator,
          isAdmin: (collaborator as any).isAdmin || false,
          type: 'collaborator'
        });
      }

      res.status(401).json({ error: 'Credenciais inválidas' });
    } catch (error) {
      console.error('Login error detail:', error);
      res.status(500).json({ error: 'Erro interno no servidor (Banco de dados)' });
    }
  };

  return {
    getHealth,
    login
  };
}
