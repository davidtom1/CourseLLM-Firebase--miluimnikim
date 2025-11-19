import { MessageAnalysis } from "../types/messageAnalysis";

export const mapLLMResponseToMessageAnalysis = (
  raw: any,
  meta: { uid: string; threadId: string; messageId: string }
): MessageAnalysis => {
  const now = new Date().toISOString();

  return {
    intent: {
      labels: raw.intent?.labels || ["OTHER"],
      primary: raw.intent?.primary || "OTHER",
      confidence: raw.intent?.confidence || 0.5,
    },
    skills: {
      items: raw.skills?.items || [],
    },
    trajectory: {
      currentNodes: raw.trajectory?.currentNodes || [],
      suggestedNextNodes: raw.trajectory?.suggestedNextNodes || [],
      status: raw.trajectory?.status || "UNKNOWN",
    },
    metadata: {
      processedAt: now,
      modelVersion: "v0.1-intent-skill-trajectory",
      uid: meta.uid,
      threadId: meta.threadId,
      messageId: meta.messageId,
    },
  };
};
