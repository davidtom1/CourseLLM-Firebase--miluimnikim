export type IntentLabel =
  | "ASK_EXPLANATION"
  | "ASK_EXAMPLES"
  | "ASK_STEP_BY_STEP_HELP"
  | "ASK_QUIZ"
  | "ASK_SUMMARY"
  | "ASK_WHAT_TO_LEARN_NEXT"
  | "META_SYSTEM_HELP"
  | "OFF_TOPIC"
  | "OTHER";

export type TrajectoryStatus =
  | "ON_TRACK"
  | "STRUGGLING"
  | "TOO_ADVANCED"
  | "REVIEW_NEEDED"
  | "NEW_TOPIC"
  | "UNKNOWN";

export type SkillTag = {
  id: string;
  displayName?: string;
  confidence: number;
  role?: "FOCUS" | "SECONDARY" | "PREREQUISITE";
};

export type MessageAnalysis = {
  intent: {
    labels: IntentLabel[];
    primary: IntentLabel;
    confidence: number;
  };
  skills: {
    items: SkillTag[];
  };
  trajectory: {
    currentNodes: string[];
    suggestedNextNodes: {
      id: string;
      reason?: string;
      priority?: number;    // 1 = highest
    }[];
    status: TrajectoryStatus;
  };
  metadata: {
    processedAt: string;   // ISO
    modelVersion: string;  // e.g. "v0.1-intent-skill-trajectory"
    threadId: string;
    messageId?: string | null;
    uid: string;           // Firebase user id
  };
};
