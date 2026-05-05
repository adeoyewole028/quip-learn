/** Shape returned by GET /lms/courses and GET /lms/course/{id} */
export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  cohort_restriction?: string;
  created_at?: string;
  // Present only on GET /lms/course/{id}
  modules?: Module[];
  totalLessons?: number;
  completedLessons?: number;
}

/** Every API response is wrapped in { res: "1" | "0" | 1 | 0; data: T } */
export interface ApiEnvelope<T> {
  res: number | string;
  data: T;
  message?: string;
  redirect?: string;
}

export interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  email: string;
  cohort?: string;
  status?: string;
  [key: string]: unknown;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ChangePasswordPayload {
  email: string;
  old_password: string;
  new_password: string;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  order_index: string;
  lessons: Lesson[];
}

/** 'text' is the API name for an article/reading lesson */
export type LessonType = 'text' | 'video' | 'quiz' | 'assignment';

export interface Lesson {
  id: string;
  module_id?: string;
  title: string;
  type: LessonType;
  duration?: string;  // e.g. "1m", "10m"
  order_index?: string;
  content?: LessonContent;
  completed?: boolean;
}

/** Discriminated union — shape depends on lesson type */
export type LessonContent =
  | TextLessonContent
  | VideoLessonContent
  | QuizLessonContent
  | AssignmentLessonContent;

export interface TextLessonContent {
  content_html: string;
  reading_time?: string;
}

export type VideoProvider = 'youtube' | 'vimeo' | 'loom' | string;

export interface VideoLessonContent {
  video_url: string;
  provider?: VideoProvider;
  description?: string;
}

export interface QuizLessonContent {
  /** Serialised JSON array of RawQuizQuestion objects */
  questions_json: string;
  passing_score?: string;
}

/** Shape of each item inside the parsed questions_json array */
export interface RawQuizQuestion {
  /** Question text */
  q: string;
  /** Answer options */
  a: string[];
  /** Index of correct answer */
  c: number;
}

export interface AssignmentLessonContent {
  instruction_html?: string;
  file_path?: string;
}

// Request / Response payloads

export interface SubmitQuizPayload {
  lessonId: string;
  user_id: string;
  score: number;
  answers: Record<number, number>; // questionIndex → selectedOptionIndex
}

export interface SubmitAssignmentPayload {
  lessonId: string;
  text?: string;
  // file uploads handled as FormData externally
}

export interface CompleteLessonPayload {
  lessonId: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
