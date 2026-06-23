import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../../../domain/entities/Auth.js';
import type { AuthRepository } from '../../../domain/repositories/AuthRepository.js';

@Injectable()
export class InMemoryAuthRepository implements AuthRepository {
  async findCollaboratorByEmail(_email: string): Promise<AuthUser | null> {
    return null;
  }
}
