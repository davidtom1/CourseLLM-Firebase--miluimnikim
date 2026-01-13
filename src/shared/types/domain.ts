export type Material = {
  id: string;
  title: string;
  type: 'PDF' | 'PPT' | 'DOC' | 'MD';
  content: string;
};

export type Course = {
  id: string;
  title: string;
  description: string;
  imageId: string;
  materials: Material[];
  learningObjectives: string;
  learningSkills: string;
  learningTrajectories: string;
  name?: string; // Optional for backwards compatibility
  image?: string; // Optional for backwards compatibility
};

export type Student = {
  id: string;
  name: string;
  avatarUrl: string;
};

export type StudentProgress = {
  studentId: string;
  courseId: string;
  progress: number;
  questionsAsked: number;
  lastAccessed: string;
};

export type EngagementData = {
  date: string;
  logins: number;
  questions: number;
};
