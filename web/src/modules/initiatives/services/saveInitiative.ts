import type { Initiative, InitiativeHistory } from '@/types';
import { updateInitiative } from './initiativesApi';

/**
 * Persiste uma atualização de iniciativa, derivando o `history` a partir do
 * diff de status (ou reaproveitando o histórico já anexado em `updated`,
 * caso de criação). Compartilhado entre o peek panel e o drag-and-drop do
 * quadro kanban — ambos chamam PATCH /api/initiatives/:id com o mesmo formato.
 */
export async function saveInitiativeWithHistory(
  current: Initiative | undefined,
  updated: Initiative,
  actionName: string,
  updatedBy: string
): Promise<Initiative | null> {
  if (!String(updated.leaderId || '').trim()) {
    alert('Uma iniciativa precisa ter um líder responsável.');
    return null;
  }

  const isNew = updated.id.startsWith('new_');
  const { history: existingHistory, ...updatedWithoutHistory } = updated;
  const payload: any = { ...updatedWithoutHistory };

  let historyDelta: InitiativeHistory[] = [];

  if (isNew && Array.isArray(existingHistory) && existingHistory.length > 0) {
    historyDelta = existingHistory;
  } else if (current) {
    const currentHistoryLength = current.history?.length || 0;
    const nextHistoryLength = existingHistory?.length || 0;

    if (current.status !== updated.status) {
      historyDelta = [{
        id: `h_${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: updatedBy,
        action: `${actionName}: Status alterado de ${current.status} para ${updated.status}`,
        fromStatus: current.status,
        toStatus: updated.status
      }];
      payload.previousStatus = current.status !== 'Suspenso' ? current.status : current.previousStatus;
    } else if (nextHistoryLength > currentHistoryLength) {
      historyDelta = (existingHistory || []).slice(currentHistoryLength);
    }
  }

  if (historyDelta.length > 0) {
    payload.history = historyDelta;
  }

  try {
    return await updateInitiative(updated.id, {
      ...payload,
      updatedBy
    });
  } catch (err) {
    console.error('Failed to update initiative:', err);
    return null;
  }
}
