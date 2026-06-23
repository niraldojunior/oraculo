import { describe, expect, it, jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../application/services/auth.service.js';
import type { AuthRepository } from '../domain/repositories/AuthRepository.js';

describe('AuthService', () => {
  it('returns login result for valid credentials', async () => {
    const repository: AuthRepository = {
      findCollaboratorByEmail: jest.fn(async () => ({
        id: 'u1',
        email: 'user@corp.com',
        password: '123456',
        name: 'User',
        isAdmin: true,
        companyId: 'c1',
        departmentId: 'd1',
        role: 'Master',
        associatedCompanyIds: []
      }))
    };

    const service = new AuthService(repository);
    const result = await service.login('USER@corp.com', '123456');

    expect(repository.findCollaboratorByEmail).toHaveBeenCalledWith('user@corp.com');
    expect(result.isAdmin).toBe(true);
    expect(result.type).toBe('collaborator');
  });

  it('throws unauthorized for invalid credentials', async () => {
    const repository: AuthRepository = {
      findCollaboratorByEmail: jest.fn(async () => null)
    };

    const service = new AuthService(repository);

    await expect(service.login('user@corp.com', 'wrong')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
