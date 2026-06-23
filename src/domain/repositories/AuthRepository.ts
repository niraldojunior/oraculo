import type { AuthUser } from '../entities/Auth.js';

export interface AuthRepository {
  findCollaboratorByEmail(email: string): Promise<AuthUser | null>;
}
