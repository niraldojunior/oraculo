import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { LoginResult } from '../../domain/entities/Auth.js';
import type { AuthRepository } from '../../domain/repositories/AuthRepository.js';
import { AUTH_REPOSITORY } from '../../domain/repositories/tokens.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly repository: AuthRepository
  ) {}

  async login(email: string, password: string): Promise<LoginResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.repository.findCollaboratorByEmail(normalizedEmail);

    if (!user || user.password !== password) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return {
      user,
      isAdmin: user.isAdmin,
      type: 'collaborator'
    };
  }
}
