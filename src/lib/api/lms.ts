import type {
  Course,
  Module,
  Lesson,
  User,
  LoginPayload,
  ApiEnvelope,
  SubmitQuizPayload,
  SubmitAssignmentPayload,
  CompleteLessonPayload,
} from '@/types/lms';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'https://quip.lifebank.ng/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }

  const envelope = (await res.json()) as ApiEnvelope<T>;
  const statusCode = Number(envelope.res);
  if (Number.isNaN(statusCode)) {
    throw new Error('Invalid API response status');
  }
  if (statusCode === 0) {
    throw new Error(envelope.message ?? 'Request failed');
  }
  return envelope.data;
}

/** POST /orange-army-login */
export function login(payload: LoginPayload): Promise<User> {
  return request<User>('/orange-army-login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** GET /lms/courses — optionally filter by cohort */
export function getCourses(cohort?: string): Promise<Course[]> {
  const params = cohort ? `?cohort=${encodeURIComponent(cohort)}` : '';
  return request<Course[]>(`/lms/courses${params}`);
}

/** GET /lms/course/{id} — returns the modules (with lessons) for a course */
export function getCourse(id: string): Promise<Module[]> {
  return request<Module[]>(`/lms/course/${id}`);
}

/** GET /lms/lesson/{id} — lesson content */
export function getLesson(id: string | number): Promise<Lesson> {
  return request<Lesson>(`/lms/lesson/${id}`);
}

/** POST /lms/submit-quiz */
export function submitQuiz(payload: SubmitQuizPayload): Promise<unknown> {
  return request('/lms/submit-quiz', {
    method: 'POST',
    body: JSON.stringify({
      lesson_id: payload.lessonId,
      user_id: payload.user_id,
      score: payload.score,
      answers: payload.answers,
    }),
  });
}

/** POST /lms/submit-assignment (JSON text; use submitAssignmentFile for files) */
export function submitAssignment(payload: SubmitAssignmentPayload): Promise<unknown> {
  return request('/lms/submit-assignment', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** POST /lms/submit-assignment with file upload (multipart/form-data) */
export function submitAssignmentFile(formData: FormData): Promise<unknown> {
  return request('/lms/submit-assignment', {
    method: 'POST',
    headers: {}, // let browser set multipart boundary
    body: formData,
  });
}

/** POST /lms/complete-lesson */
export function completeLesson(payload: CompleteLessonPayload): Promise<unknown> {
  return request('/lms/complete-lesson', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
