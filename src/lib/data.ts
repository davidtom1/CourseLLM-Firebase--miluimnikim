/**
 * Re-exports mock data for use throughout the application.
 * This file serves as a compatibility layer for components that import from '@/lib/data'.
 */

import { courses, students, studentProgress, engagementData, getCourseById } from '@/shared/data/mock-data';
import type { Course } from '@/shared/types/domain';

// Re-export with uppercase names for backwards compatibility
export const COURSES: Course[] = courses.map(c => ({
  ...c,
  name: c.name ?? c.title,
  image: c.image ?? c.imageId,
}));

export const ANALYTICS_DATA = [
  { topic: 'Arrays', mastery: 92 },
  { topic: 'Linked Lists', mastery: 85 },
  { topic: 'Recursion', mastery: 65 },
  { topic: 'Trees', mastery: 58 },
  { topic: 'Graphs', mastery: 45 },
];

export { students, studentProgress, engagementData, getCourseById };
