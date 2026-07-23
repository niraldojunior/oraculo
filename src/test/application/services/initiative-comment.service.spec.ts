import { describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { InitiativeCommentService } from '../../../application/services/initiative-comment.service.js';
import type { InitiativeCommentRepository, InitiativeComment } from '../../../domain/repositories/InitiativeCommentRepository.js';
import type { InitiativeRepository } from '../../../domain/repositories/InitiativeRepository.js';
import type { Initiative } from '../../../domain/entities/Initiative.js';
import { CacheService } from '../../../infrastructure/cache/cache.service.js';

function makeCommentRepo(overrides: Partial<InitiativeCommentRepository> = {}): InitiativeCommentRepository {
  return {
    listByInitiativeId: jest.fn(async () => []) as any,
    findById: jest.fn(async () => null) as any,
    create: jest.fn(async (p: any) => ({ ...p, id: 'c1', timestamp: new Date() })) as any,
    update: jest.fn(async (id: string, p: any) => ({ id, content: p.content, userId: 'u1', userName: 'U1', timestamp: new Date(), initiativeId: 'i1' })) as any,
    delete: jest.fn(async () => undefined) as any,
    ...overrides
  };
}

function makeInitiativeRepo(overrides: Partial<InitiativeRepository> = {}): InitiativeRepository {
  const base: Initiative = { id: 'i1', title: 'T', status: '1- Backlog', priority: 0, companyId: 'c1', departmentId: 'd1', createdAt: new Date() };
  return {
    listByScope: jest.fn(async () => [base]) as any,
    findById: jest.fn(async () => base) as any,
    countByClientTeamId: jest.fn(async () => 0) as any,
    save: jest.fn(async (i: Initiative) => i) as any,
    create: jest.fn(async () => base) as any,
    delete: jest.fn(async () => undefined) as any,
    ...overrides
  };
}

describe('InitiativeCommentService', () => {

  describe('listByInitiativeId', () => {
    it('should list comments for an initiative', async () => {
      const initiativeId = 'i1';
      const comments: InitiativeComment[] = [
        { id: 'c1', content: 'Comment 1', userId: 'u1', userName: 'User 1', timestamp: new Date(), initiativeId }
      ];

      const commentRepo = makeCommentRepo({ listByInitiativeId: jest.fn(async () => comments) });
      const initiativeRepo = makeInitiativeRepo();
      const cache = new CacheService();
      const service = new InitiativeCommentService(commentRepo, initiativeRepo, cache);

      const result = await service.listByInitiativeId(initiativeId);

      expect(result).toEqual(comments);
      expect(initiativeRepo.findById).toHaveBeenCalledWith(initiativeId);
      expect(commentRepo.listByInitiativeId).toHaveBeenCalledWith(initiativeId);
    });

    it('should throw if initiative does not exist', async () => {
      const commentRepo = makeCommentRepo();
      const initiativeRepo = makeInitiativeRepo({ findById: jest.fn(async () => null) });
      const cache = new CacheService();
      const service = new InitiativeCommentService(commentRepo, initiativeRepo, cache);

      await expect(service.listByInitiativeId('i1')).rejects.toThrow();
    });
  });

  describe('getById', () => {
    it('should get a comment by id', async () => {
      const comment: InitiativeComment = { id: 'c1', content: 'Comment 1', userId: 'u1', userName: 'User 1', timestamp: new Date(), initiativeId: 'i1' };
      const commentRepo = makeCommentRepo({ findById: jest.fn(async () => comment) });
      const service = new InitiativeCommentService(commentRepo, makeInitiativeRepo(), new CacheService());

      const result = await service.getById('c1');

      expect(result).toEqual(comment);
    });

    it('should throw if comment does not exist', async () => {
      const commentRepo = makeCommentRepo({ findById: jest.fn(async () => null) });
      const service = new InitiativeCommentService(commentRepo, makeInitiativeRepo(), new CacheService());

      await expect(service.getById('c1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a comment', async () => {
      const initiativeId = 'i1';
      const payload = { content: 'New comment', userId: 'u1', userName: 'User 1' };
      const createdComment: InitiativeComment = { ...payload, id: 'c1', timestamp: new Date(), initiativeId };

      const commentRepo = makeCommentRepo({ create: jest.fn(async () => createdComment) });
      const service = new InitiativeCommentService(commentRepo, makeInitiativeRepo(), new CacheService());

      const result = await service.create(initiativeId, payload);

      expect(result).toEqual(createdComment);
      expect(commentRepo.create).toHaveBeenCalledWith({ ...payload, initiativeId });
    });
  });

  describe('update', () => {
    it('should update a comment', async () => {
      const commentId = 'c1';
      const initiativeId = 'i1';
      const oldComment: InitiativeComment = { id: commentId, content: 'Old', userId: 'u1', userName: 'User 1', timestamp: new Date(), initiativeId };
      const updatedComment: InitiativeComment = { ...oldComment, content: 'Updated' };

      const findByIdFn = jest.fn() as any;
      findByIdFn.mockResolvedValueOnce(oldComment).mockResolvedValueOnce(updatedComment);

      const commentRepo = makeCommentRepo({
        findById: findByIdFn,
        update: jest.fn(async () => updatedComment) as any
      });
      const service = new InitiativeCommentService(commentRepo, makeInitiativeRepo(), new CacheService());

      const result = await service.update(commentId, { content: 'Updated' });

      expect(result).toEqual(updatedComment);
      expect(commentRepo.update).toHaveBeenCalledWith(commentId, { content: 'Updated' });
    });
  });

  describe('delete', () => {
    it('should delete a comment', async () => {
      const commentId = 'c1';
      const initiativeId = 'i1';
      const comment: InitiativeComment = { id: commentId, content: 'Content', userId: 'u1', userName: 'User 1', timestamp: new Date(), initiativeId };

      const commentRepo = makeCommentRepo({ findById: jest.fn(async () => comment) });
      const service = new InitiativeCommentService(commentRepo, makeInitiativeRepo(), new CacheService());

      await service.delete(commentId);

      expect(commentRepo.delete).toHaveBeenCalledWith(commentId);
    });
  });
});
