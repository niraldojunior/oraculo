import { randomUUID } from 'node:crypto';
import type { InitiativeComment, InitiativeCommentRepository } from '../../../domain/repositories/InitiativeCommentRepository.js';
import type { OracleService } from './oracle.service.js';

type Row = Record<string, unknown>;

export class OracleInitiativeCommentRepository implements InitiativeCommentRepository {
  constructor(private readonly oracle: OracleService) {}

  async listByInitiativeId(initiativeId: string): Promise<InitiativeComment[]> {
    const rows = await this.oracle.query<Row>(
      `
        SELECT "id", "content", "userId", "userName", "timestamp", "initiativeId"
        FROM "InitiativeComment"
        WHERE "initiativeId" = :initiativeId
        ORDER BY "timestamp" DESC
      `,
      { initiativeId }
    );

    return rows.map(this.mapToEntity);
  }

  async findById(id: string): Promise<InitiativeComment | null> {
    const rows = await this.oracle.query<Row>(
      `
        SELECT "id", "content", "userId", "userName", "timestamp", "initiativeId"
        FROM "InitiativeComment"
        WHERE "id" = :id
      `,
      { id }
    );

    return rows.length > 0 ? this.mapToEntity(rows[0]) : null;
  }

  async create(payload: Omit<InitiativeComment, 'id' | 'timestamp'>): Promise<InitiativeComment> {
    const id = randomUUID();
    const timestamp = new Date();

    await this.oracle.execute(
      `
        INSERT INTO "InitiativeComment" ("id", "content", "userId", "userName", "timestamp", "initiativeId")
        VALUES (:id, :content, :userId, :userName, :timestamp, :initiativeId)
      `,
      {
        id,
        content: payload.content,
        userId: payload.userId,
        userName: payload.userName,
        timestamp,
        initiativeId: payload.initiativeId
      }
    );

    return {
      id,
      content: payload.content,
      userId: payload.userId,
      userName: payload.userName,
      timestamp,
      initiativeId: payload.initiativeId
    };
  }

  async update(id: string, payload: Partial<Pick<InitiativeComment, 'content'>>): Promise<InitiativeComment> {
    if (payload.content !== undefined) {
      await this.oracle.execute(
        `UPDATE "InitiativeComment" SET "content" = :content WHERE "id" = :id`,
        { id, content: payload.content }
      );
    }

    const comment = await this.findById(id);
    if (!comment) throw new Error('Comment not found');
    return comment;
  }

  async delete(id: string): Promise<void> {
    await this.oracle.execute('DELETE FROM "InitiativeComment" WHERE "id" = :id', { id });
  }

  private mapToEntity(row: Row): InitiativeComment {
    return {
      id: String(row.id),
      content: String(row.content ?? ''),
      userId: String(row.userId ?? ''),
      userName: String(row.userName ?? ''),
      timestamp: row.timestamp instanceof Date ? row.timestamp : new Date(String(row.timestamp ?? new Date())),
      initiativeId: String(row.initiativeId ?? '')
    };
  }
}
