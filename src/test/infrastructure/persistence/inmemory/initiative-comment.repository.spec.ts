import { describe, expect, it, beforeEach } from '@jest/globals';
import { InmemoryInitiativeCommentRepository } from '../../../../infrastructure/persistence/inmemory/InmemoryInitiativeCommentRepository.js';

describe('InmemoryInitiativeCommentRepository', () => {
  let repo: InmemoryInitiativeCommentRepository;

  beforeEach(() => {
    repo = new InmemoryInitiativeCommentRepository();
  });

  describe('create and listByInitiativeId', () => {
    it('should create and list comments', async () => {
      const comment = await repo.create({
        content: 'Test comment',
        userId: 'u1',
        userName: 'User 1',
        initiativeId: 'i1'
      });

      expect(comment.id).toBeDefined();
      expect(comment.content).toBe('Test comment');
      expect(comment.timestamp).toBeInstanceOf(Date);

      const comments = await repo.listByInitiativeId('i1');

      expect(comments).toHaveLength(1);
      expect(comments[0].id).toBe(comment.id);
    });
  });

  describe('findById', () => {
    it('should find a comment by id', async () => {
      const created = await repo.create({
        content: 'Test',
        userId: 'u1',
        userName: 'User 1',
        initiativeId: 'i1'
      });

      const found = await repo.findById(created.id);

      expect(found).toEqual(created);
    });

    it('should return null if not found', async () => {
      const result = await repo.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a comment', async () => {
      const created = await repo.create({
        content: 'Original',
        userId: 'u1',
        userName: 'User 1',
        initiativeId: 'i1'
      });

      const updated = await repo.update(created.id, { content: 'Updated' });

      expect(updated.content).toBe('Updated');

      const found = await repo.findById(created.id);
      expect(found?.content).toBe('Updated');
    });

    it('should throw if comment not found', async () => {
      await expect(repo.update('nonexistent', { content: 'Test' })).rejects.toThrow('Comment not found');
    });
  });

  describe('delete', () => {
    it('should delete a comment', async () => {
      const created = await repo.create({
        content: 'To delete',
        userId: 'u1',
        userName: 'User 1',
        initiativeId: 'i1'
      });

      await repo.delete(created.id);

      const found = await repo.findById(created.id);
      expect(found).toBeNull();
    });
  });

  describe('listByInitiativeId ordering', () => {
    it('should return comments ordered by timestamp desc', async () => {
      const c1 = await repo.create({
        content: 'First',
        userId: 'u1',
        userName: 'User 1',
        initiativeId: 'i1'
      });

      // Create a small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const c2 = await repo.create({
        content: 'Second',
        userId: 'u1',
        userName: 'User 1',
        initiativeId: 'i1'
      });

      const comments = await repo.listByInitiativeId('i1');

      expect(comments).toHaveLength(2);
      // Most recent first
      expect(comments[0].id).toBe(c2.id);
      expect(comments[1].id).toBe(c1.id);
    });
  });
});
