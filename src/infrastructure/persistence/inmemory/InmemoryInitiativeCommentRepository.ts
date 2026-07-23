import { randomUUID } from 'node:crypto';
import type { InitiativeComment, InitiativeCommentRepository } from '../../../domain/repositories/InitiativeCommentRepository.js';

export class InmemoryInitiativeCommentRepository implements InitiativeCommentRepository {
  private comments: Map<string, InitiativeComment> = new Map();

  async listByInitiativeId(initiativeId: string): Promise<InitiativeComment[]> {
    const comments = Array.from(this.comments.values()).filter(c => c.initiativeId === initiativeId);
    return comments.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async findById(id: string): Promise<InitiativeComment | null> {
    return this.comments.get(id) ?? null;
  }

  async create(payload: Omit<InitiativeComment, 'id' | 'timestamp'>): Promise<InitiativeComment> {
    const comment: InitiativeComment = {
      ...payload,
      id: randomUUID(),
      timestamp: new Date()
    };
    this.comments.set(comment.id, comment);
    return comment;
  }

  async update(id: string, payload: Partial<Pick<InitiativeComment, 'content'>>): Promise<InitiativeComment> {
    const comment = this.comments.get(id);
    if (!comment) throw new Error('Comment not found');

    const updated = { ...comment, ...payload };
    this.comments.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.comments.delete(id);
  }
}
