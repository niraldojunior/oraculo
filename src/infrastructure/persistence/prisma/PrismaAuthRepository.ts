import type { PrismaClient } from '@prisma/client';
import type { AuthUser } from '../../../domain/entities/Auth.js';
import type { AuthRepository } from '../../../domain/repositories/AuthRepository.js';

export class PrismaAuthRepository implements AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findCollaboratorByEmail(email: string): Promise<AuthUser | null> {
    const row = await this.prisma.collaborator.findUnique({
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

    return row as unknown as AuthUser | null;
  }
}
