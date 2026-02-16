/**
 * Type Definitions
 * 
 * Tipos compartidos en toda la aplicación.
 */

// Re-export API types
export type { SignUpData, SignInData } from '@/src/lib/api/auth';
export type { Exam, ExamAttempt, Question } from '@/src/lib/api/exams';
export type { Subject, Topic } from '@/src/lib/api/courses';

// User types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  updated_at?: string;
}

// Common UI types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
