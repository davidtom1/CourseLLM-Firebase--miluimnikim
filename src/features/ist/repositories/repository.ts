
import type { MessageAnalysis } from '@/shared/types';
import { db } from '@/features/firebase';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';

export interface IstAnalysisRepository {
  save(analysis: MessageAnalysis): Promise<void>;
  get(threadId: string, messageId: string): Promise<MessageAnalysis | null>;
  listByThread(threadId: string): Promise<MessageAnalysis[]>;
}

type AnalysisKey = string; // e.g. `${threadId}::${messageId}`

function makeKey(threadId: string, messageId: string): AnalysisKey {
  return `${threadId}::${messageId}`;
}

export class InMemoryIstAnalysisRepository implements IstAnalysisRepository {
  private store = new Map<AnalysisKey, MessageAnalysis>();

  async save(analysis: MessageAnalysis): Promise<void> {
    const { threadId, messageId } = analysis.metadata;
    if (!threadId || !messageId) {
      throw new Error(
        'IstAnalysisRepository.save: analysis.metadata.threadId and analysis.metadata.messageId are required'
      );
    }
    const key = makeKey(threadId, messageId);
    this.store.set(key, analysis);
  }

  async get(threadId: string, messageId: string): Promise<MessageAnalysis | null> {
    const key = makeKey(threadId, messageId);
    return this.store.get(key) ?? null;
  }

  async listByThread(threadId: string): Promise<MessageAnalysis[]> {
    const results: MessageAnalysis[] = [];
    for (const analysis of this.store.values()) {
      if (analysis.metadata.threadId === threadId) {
        results.push(analysis);
      }
    }
    return results;
  }
}

// Firestore-based repository that saves to threads/{threadId}/analysis/{messageId}
export class FirestoreIstAnalysisRepository implements IstAnalysisRepository {
  async save(analysis: MessageAnalysis): Promise<void> {
    const { threadId, messageId } = analysis.metadata;
    if (!threadId || !messageId) {
      throw new Error(
        'IstAnalysisRepository.save: analysis.metadata.threadId and analysis.metadata.messageId are required'
      );
    }

    try {
      // Save to Firestore at path: threads/{threadId}/analysis/{messageId}
      const analysisRef = doc(db, 'threads', threadId, 'analysis', messageId);

      // Convert the analysis to a plain object and handle Date serialization
      const dataToSave = JSON.parse(JSON.stringify(analysis));
      dataToSave.savedAt = new Date().toISOString();

      await setDoc(analysisRef, dataToSave);
      console.log(`[IST][Firestore] Saved analysis to threads/${threadId}/analysis/${messageId}`);
    } catch (error) {
      console.error('[IST][Firestore] Error saving analysis:', error);
      // Don't throw - allow the app to continue even if Firestore save fails
      console.warn('[IST][Firestore] Continuing despite error - analysis may not appear in UI');
    }
  }

  async get(threadId: string, messageId: string): Promise<MessageAnalysis | null> {
    try {
      const analysisRef = doc(db, 'threads', threadId, 'analysis', messageId);
      const snapshot = await getDoc(analysisRef);

      if (!snapshot.exists()) {
        return null;
      }

      return snapshot.data() as MessageAnalysis;
    } catch (error) {
      console.error('[IST][Firestore] Error getting analysis:', error);
      return null;
    }
  }

  async listByThread(threadId: string): Promise<MessageAnalysis[]> {
    try {
      const analysisCollection = collection(db, 'threads', threadId, 'analysis');
      const snapshot = await getDocs(analysisCollection);

      return snapshot.docs.map(doc => doc.data() as MessageAnalysis);
    } catch (error) {
      console.error('[IST][Firestore] Error listing analyses:', error);
      return [];
    }
  }
}

let singletonRepo: IstAnalysisRepository | null = null;

export function getIstAnalysisRepository(): IstAnalysisRepository {
  if (!singletonRepo) {
    // Use Firestore repository for real-time UI updates
    singletonRepo = new FirestoreIstAnalysisRepository();
  }
  return singletonRepo;
}

