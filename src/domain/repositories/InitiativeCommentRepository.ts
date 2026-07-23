export interface InitiativeComment {
  id: string;
  content: string;
  userId: string;
  userName: string;
  timestamp: Date;
  initiativeId: string;
}

export interface InitiativeCommentRepository {
  listByInitiativeId(initiativeId: string): Promise<InitiativeComment[]>;
  findById(id: string): Promise<InitiativeComment | null>;
  create(payload: Omit<InitiativeComment, 'id' | 'timestamp'>): Promise<InitiativeComment>;
  update(id: string, payload: Partial<Pick<InitiativeComment, 'content'>>): Promise<InitiativeComment>;
  delete(id: string): Promise<void>;
}
