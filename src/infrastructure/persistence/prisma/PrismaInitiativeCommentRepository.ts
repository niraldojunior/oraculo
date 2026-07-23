import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import type { InitiativeComment, InitiativeCommentRepository } from '../../../domain/repositories/InitiativeCommentRepository.js';

@Injectable()
export class PrismaInitiativeCommentRepository implements InitiativeCommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listByInitiativeId(initiativeId: string): Promise<InitiativeComment[]> {
    const comments = await this.prisma.initiativeComment.findMany({
      where: { initiativeId },
      orderBy: { timestamp: 'desc' }
    });
    return comments.map(this.mapToEntity);
  }

  async findById(id: string): Promise<InitiativeComment | null> {
    const comment = await this.prisma.initiativeComment.findUnique({
      where: { id }
    });
    return comment ? this.mapToEntity(comment) : null;
  }

  async create(payload: Omit<InitiativeComment, 'id' | 'timestamp'>): Promise<InitiativeComment> {
    const comment = await this.prisma.initiativeComment.create({
      data: {
        content: payload.content,
        userId: payload.userId,
        userName: payload.userName,
        initiativeId: payload.initiativeId
      }
    });
    return this.mapToEntity(comment);
  }

  async update(id: string, payload: Partial<Pick<InitiativeComment, 'content'>>): Promise<InitiativeComment> {
    const comment = await this.prisma.initiativeComment.update({
      where: { id },
      data: {
        ...(payload.content !== undefined && { content: payload.content })
      }
    });
    return this.mapToEntity(comment);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.initiativeComment.delete({
      where: { id }
    });
  }

  private mapToEntity(raw: any): InitiativeComment {
    return {
      id: raw.id,
      content: raw.content,
      userId: raw.userId,
      userName: raw.userName,
      timestamp: raw.timestamp,
      initiativeId: raw.initiativeId
    };
  }
}
