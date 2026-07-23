import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { INITIATIVE_COMMENT_REPOSITORY, INITIATIVE_REPOSITORY } from '../../domain/repositories/tokens.js';
import type { InitiativeCommentRepository, InitiativeComment } from '../../domain/repositories/InitiativeCommentRepository.js';
import type { InitiativeRepository } from '../../domain/repositories/InitiativeRepository.js';
import { CacheService } from '../../infrastructure/cache/cache.service.js';

@Injectable()
export class InitiativeCommentService {
  constructor(
    @Inject(INITIATIVE_COMMENT_REPOSITORY)
    private readonly commentRepository: InitiativeCommentRepository,
    @Inject(INITIATIVE_REPOSITORY)
    private readonly initiativeRepository: InitiativeRepository,
    private readonly cache: CacheService
  ) {}

  async listByInitiativeId(initiativeId: string): Promise<InitiativeComment[]> {
    const initiative = await this.initiativeRepository.findById(initiativeId);
    if (!initiative) {
      throw new NotFoundException('Initiative not found');
    }
    return this.cache.getOrFetch(
      `initiative-comments:${initiativeId}`,
      () => this.commentRepository.listByInitiativeId(initiativeId)
    );
  }

  async getById(id: string): Promise<InitiativeComment> {
    const comment = await this.commentRepository.findById(id);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return comment;
  }

  async create(initiativeId: string, payload: { content: string; userId: string; userName: string }): Promise<InitiativeComment> {
    const initiative = await this.initiativeRepository.findById(initiativeId);
    if (!initiative) {
      throw new NotFoundException('Initiative not found');
    }
    const comment = await this.commentRepository.create({
      ...payload,
      initiativeId
    });
    this.cache.invalidatePrefix(`initiative-comments:${initiativeId}`);
    return comment;
  }

  async update(id: string, payload: { content: string }): Promise<InitiativeComment> {
    const comment = await this.getById(id);
    const updated = await this.commentRepository.update(id, { content: payload.content });
    this.cache.invalidatePrefix(`initiative-comments:${comment.initiativeId}`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const comment = await this.getById(id);
    await this.commentRepository.delete(id);
    this.cache.invalidatePrefix(`initiative-comments:${comment.initiativeId}`);
  }
}
