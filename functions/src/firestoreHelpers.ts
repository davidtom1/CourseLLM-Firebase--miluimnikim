import * as admin from "firebase-admin";
import { MessageAnalysis } from "./types/messageAnalysis";

export const saveAnalysisToFirestore = async (
  threadId: string,
  messageId: string,
  analysis: MessageAnalysis
): Promise<void> => {
  await admin
    .firestore()
    .collection("threads")
    .doc(threadId)
    .collection("analysis")
    .doc(messageId)
    .set(analysis);
};

export const loadRecentMessages = async (
  threadId: string,
  limit: number
): Promise<any[]> => {
  // For now, returning a stubbed response as per the requirements.
  return [];
};

export const loadStudentProfile = async (uid: string): Promise<any | null> => {
  // For now, returning a stubbed response as per the requirements.
  return null;
};

export const loadGraphSnippet = async (
  courseId?: string
): Promise<any | null> => {
  // For now, returning a stubbed response as per the requirements.
  return null;
};
