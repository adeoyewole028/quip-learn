import type {
  Course,
  Module,
  Lesson,
  User,
  LoginPayload,
  ChangePasswordPayload,
  CommunityQuestionPayload,
  CommunityAnswerPayload,
  ApiEnvelope,
  SubmitQuizPayload,
  SubmitAssignmentPayload,
  CompleteLessonPayload,
  UserProgress,
  UserCourseProgress,
} from '@/types/lms';
import type { CommunityAnswer, CommunityQuestionSummary, CommunityThreadDetail } from '@/lib/community';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'https://quip.lifebank.ng/api';

type JsonRecord = Record<string, unknown>;

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasQuestionFields(value: JsonRecord): boolean {
  return Boolean(value.title || value.summary || value.details || value.excerpt || value.what_tried);
}

function hasAnswerFields(value: JsonRecord): boolean {
  return Boolean(value.body || value.answer || value.content || value.text);
}

function parseApiJson(text: string): unknown | null {
  if (!text.trim()) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function parseApiText(text: string): (Partial<ApiEnvelope<unknown>> & { data?: unknown; message?: unknown }) | null {
  const parsed = parseApiJson(text);
  return isJsonRecord(parsed) ? parsed : null;
}

function getApiMessage(text: string, fallback: string): string {
  const parsed = parseApiText(text);

  if (typeof parsed?.message === 'string' && parsed.message.trim()) {
    return parsed.message.trim();
  }

  if (typeof parsed?.data === 'string' && parsed.data.trim()) {
    return parsed.data.trim();
  }

  return text.trim() || fallback;
}

function toTrimmedString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function getCommunityAuthorName(record: JsonRecord): string | undefined {
  const firstName = toTrimmedString(record.author_first_name);
  const lastName = toTrimmedString(record.author_last_name);
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

  return fullName || undefined;
}

function toIdentifier(value: unknown): number | string | undefined {
  const numericValue = toNumber(value);
  if (numericValue !== undefined) return numericValue;
  return toTrimmedString(value);
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
    if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  }
  return undefined;
}

function parseCommunityTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
      .filter(Boolean);
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = parseApiJson(value);
    if (Array.isArray(parsed)) {
      return parsed
        .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
        .filter(Boolean);
    }

    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

function parseParagraphs(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((part) => (typeof part === 'string' ? part.trim() : ''))
      .filter(Boolean);
  }

  if (typeof value === 'string' && value.trim()) {
    return value
      .split(/\n{2,}/)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  return [];
}

function extractCommunityQuestionArray(value: unknown): JsonRecord[] {
  if (Array.isArray(value)) {
    return value.filter(isJsonRecord);
  }

  if (!isJsonRecord(value)) return [];

  const directListCandidates = [value.data, value.questions, value.items, value.results];
  for (const candidate of directListCandidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(isJsonRecord);
    }

    if (isJsonRecord(candidate) && Array.isArray(candidate.questions)) {
      return candidate.questions.filter(isJsonRecord);
    }
  }

  return [];
}

function extractCommunityQuestionRecord(value: unknown): JsonRecord | null {
  if (isJsonRecord(value) && hasQuestionFields(value)) {
    return value;
  }

  if (!isJsonRecord(value)) return null;

  const candidates = [value.data, value.question, value.item, value.result];
  for (const candidate of candidates) {
    const record = extractCommunityQuestionRecord(candidate);
    if (record) {
      return record;
    }
  }

  return null;
}

function extractCommunityThreadDetailRecord(value: unknown): JsonRecord | null {
  if (!isJsonRecord(value)) return null;

  if (isJsonRecord(value.question)) {
    return {
      ...value.question,
      answers: value.answers ?? value.question.answers,
      answer_count: value.answer_count ?? value.question.answer_count,
      accepted_answer_id: value.accepted_answer_id ?? value.question.accepted_answer_id,
      related_threads: value.related_threads ?? value.question.related_threads,
      related_questions: value.related_questions ?? value.question.related_questions,
      relatedQuestions: value.relatedQuestions ?? value.question.relatedQuestions,
      views: value.views ?? value.question.views,
      view_count: value.view_count ?? value.question.view_count,
    };
  }

  if (hasQuestionFields(value)) {
    return value;
  }

  const candidates = [value.data, value.item, value.result];
  for (const candidate of candidates) {
    const record = extractCommunityThreadDetailRecord(candidate);
    if (record) {
      return record;
    }
  }

  return null;
}

function extractCreatedCommunityQuestionId(value: unknown): number | undefined {
  if (!isJsonRecord(value)) return undefined;

  return (
    toNumber(value.question_id) ??
    toNumber(value.id) ??
    (isJsonRecord(value.data)
      ? toNumber(value.data.question_id) ?? toNumber(value.data.id)
      : undefined)
  );
}

function extractCommunityAnswerArray(value: unknown): JsonRecord[] {
  if (Array.isArray(value)) {
    return value.filter(isJsonRecord);
  }

  if (!isJsonRecord(value)) return [];

  const candidates = [value.answers, value.responses, value.items, value.results, value.data];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(isJsonRecord);
    }
  }

  return [];
}

function extractCommunityAnswerRecord(value: unknown): JsonRecord | null {
  if (isJsonRecord(value) && hasAnswerFields(value)) {
    return value;
  }

  if (!isJsonRecord(value)) return null;

  const candidates = [value.data, value.answer, value.item, value.result];
  for (const candidate of candidates) {
    const record = extractCommunityAnswerRecord(candidate);
    if (record) {
      return record;
    }
  }

  return null;
}

function extractRelatedQuestionIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (isJsonRecord(item)) {
        return toNumber(item.id) ?? toNumber(item.question_id);
      }

      return toNumber(item);
    })
    .filter((questionId): questionId is number => typeof questionId === 'number');
}

function extractProgressRoot(value: unknown): unknown {
  if (!isJsonRecord(value)) return value;

  const candidates = [value.data, value.progress, value.user_progress, value.userProgress, value.result];

  for (const candidate of candidates) {
    if (candidate !== undefined) {
      return candidate;
    }
  }

  return value;
}

function collectProgressRecords(value: unknown, seen = new Set<unknown>()): JsonRecord[] {
  if (value == null || seen.has(value)) return [];

  if (Array.isArray(value)) {
    seen.add(value);
    return value.flatMap((item) => collectProgressRecords(item, seen));
  }

  if (!isJsonRecord(value)) return [];

  seen.add(value);

  const looksLikeProgressRecord =
    value.course_id != null ||
    value.courseId != null ||
    value.lesson_id != null ||
    value.lessonId != null ||
    value.completed_lessons != null ||
    value.completedLessons != null ||
    value.total_lessons != null ||
    value.totalLessons != null ||
    value.progress != null ||
    value.progress_percent != null ||
    value.progressPercent != null;

  const nestedValues = Object.values(value).flatMap((item) => collectProgressRecords(item, seen));

  return looksLikeProgressRecord ? [value, ...nestedValues] : nestedValues;
}

function normalizeUserProgress(value: unknown): UserProgress {
  const root = extractProgressRoot(value);
  const records = collectProgressRecords(root);
  const completedLessonIds = new Set<string>();
  const courseProgress = new Map<string, UserCourseProgress>();

  for (const record of records) {
    const lessonId = toIdentifier(record.lesson_id ?? record.lessonId);
    const courseId = toIdentifier(record.course_id ?? record.courseId ?? record.id);
    const completed =
      toBoolean(record.completed) ??
      toBoolean(record.is_completed) ??
      toBoolean(record.isCompleted) ??
      toBoolean(record.done) ??
      toBoolean(record.status);

    if (lessonId !== undefined && completed !== false) {
      completedLessonIds.add(String(lessonId));
    }

    if (courseId === undefined) {
      continue;
    }

    const normalizedCourseId = String(courseId);
    const previous = courseProgress.get(normalizedCourseId) ?? { courseId: normalizedCourseId };
    const completedLessons =
      toNumber(record.completed_lessons) ??
      toNumber(record.completedLessons) ??
      toNumber(record.completed_count) ??
      toNumber(record.completedCount) ??
      previous.completedLessons;
    const totalLessons =
      toNumber(record.total_lessons) ??
      toNumber(record.totalLessons) ??
      toNumber(record.lesson_count) ??
      toNumber(record.lessonCount) ??
      previous.totalLessons;
    const progressPercent =
      toNumber(record.progress_percent) ??
      toNumber(record.progressPercent) ??
      toNumber(record.progress) ??
      toNumber(record.percentage) ??
      previous.progressPercent;

    courseProgress.set(normalizedCourseId, {
      courseId: normalizedCourseId,
      completedLessons,
      totalLessons,
      progressPercent,
    });
  }

  return {
    courseProgress: Object.fromEntries(courseProgress.entries()),
    completedLessonIds: Array.from(completedLessonIds),
  };
}

function normalizeCommunityQuestionSummary(
  record: JsonRecord,
  fallback?: Partial<CommunityQuestionSummary>,
): CommunityQuestionSummary {
  const tags = parseCommunityTags(record.tags);
  const acceptedFromRecord =
    toBoolean(record.hasAcceptedAnswer) ??
    toBoolean(record.has_accepted_answer) ??
    (record.accepted_answer_id != null ? Boolean(record.accepted_answer_id) : undefined);

  const id =
    toNumber(record.id) ??
    toNumber(record.question_id) ??
    fallback?.id ??
    Date.now();

  const title =
    toTrimmedString(record.title) ??
    fallback?.title ??
    'Untitled question';

  const excerpt =
    toTrimmedString(record.summary) ??
    toTrimmedString(record.excerpt) ??
    toTrimmedString(record.details) ??
    fallback?.excerpt ??
    'No summary provided yet.';

  const author =
    toTrimmedString(record.author_name) ??
    getCommunityAuthorName(record) ??
    toTrimmedString(record.author) ??
    toTrimmedString(record.name) ??
    fallback?.author ??
    'Community member';

  const role =
    toTrimmedString(record.role) ??
    toTrimmedString(record.author_role) ??
    toTrimmedString(record.audience) ??
    fallback?.role ??
    'Community';

  const asked =
    toTrimmedString(record.asked) ??
    toTrimmedString(record.created_at) ??
    toTrimmedString(record.createdAt) ??
    toTrimmedString(record.posted_at) ??
    fallback?.asked ??
    'Recently';

  return {
    id,
    authorId:
      toIdentifier(record.author_id) ??
      toIdentifier(record.user_id) ??
      toIdentifier(record.owner_id) ??
      fallback?.authorId,
    title,
    excerpt,
    tags: tags.length > 0 ? tags : (fallback?.tags ?? []),
    author,
    role,
    asked,
    votes:
      toNumber(record.votes) ??
      toNumber(record.vote_count) ??
      toNumber(record.upvotes) ??
      fallback?.votes ??
      0,
    answers:
      toNumber(record.answers) ??
      toNumber(record.answer_count) ??
      toNumber(record.answers_count) ??
      fallback?.answers ??
      0,
    views:
      toNumber(record.views) ??
      toNumber(record.view_count) ??
      fallback?.views ??
      0,
    hasAcceptedAnswer: acceptedFromRecord ?? fallback?.hasAcceptedAnswer,
    trending:
      toBoolean(record.trending) ??
      toBoolean(record.is_trending) ??
      fallback?.trending,
  };
}

function normalizeCommunityAnswer(
  record: JsonRecord,
  acceptedAnswerId?: number,
  fallback?: Partial<CommunityAnswer>,
): CommunityAnswer {
  const id =
    toNumber(record.id) ??
    toNumber(record.answer_id) ??
    fallback?.id ??
    Date.now();

  const acceptedFromRecord =
    toBoolean(record.accepted) ??
    toBoolean(record.is_accepted) ??
    toBoolean(record.isAccepted);

  const body = parseParagraphs(record.body ?? record.answer ?? record.content ?? record.text);

  return {
    id,
    authorId:
      toIdentifier(record.author_id) ??
      toIdentifier(record.user_id) ??
      toIdentifier(record.owner_id) ??
      fallback?.authorId,
    author:
      toTrimmedString(record.author_name) ??
      getCommunityAuthorName(record) ??
      toTrimmedString(record.author) ??
      toTrimmedString(record.name) ??
      fallback?.author ??
      'Community member',
    role:
      toTrimmedString(record.role) ??
      toTrimmedString(record.author_role) ??
      fallback?.role ??
      'Community',
    posted:
      toTrimmedString(record.posted) ??
      toTrimmedString(record.created_at) ??
      toTrimmedString(record.createdAt) ??
      toTrimmedString(record.updated_at) ??
      fallback?.posted ??
      'Just now',
    votes:
      toNumber(record.votes) ??
      toNumber(record.vote_count) ??
      toNumber(record.upvotes) ??
      fallback?.votes ??
      0,
    accepted:
      acceptedFromRecord ??
      (acceptedAnswerId !== undefined ? id === acceptedAnswerId : undefined) ??
      fallback?.accepted,
    body: body.length > 0 ? body : (fallback?.body ?? []),
  };
}

function normalizeCommunityThreadDetail(
  record: JsonRecord,
  fallback?: Partial<CommunityThreadDetail>,
): CommunityThreadDetail {
  const tags = parseCommunityTags(record.tags);
  const acceptedAnswerId =
    toNumber(record.accepted_answer_id) ??
    toNumber(record.acceptedAnswerId);
  const details = parseParagraphs(record.details ?? record.body ?? record.content ?? record.description);
  const whatTried = toTrimmedString(record.what_tried) ?? toTrimmedString(record.whatTried);

  const body = details.length > 0 ? [...details] : [...(fallback?.body ?? [])];
  if (whatTried) {
    body.push(`What I have tried: ${whatTried}`);
  }

  const answers = extractCommunityAnswerArray(record).map((answer) =>
    normalizeCommunityAnswer(answer, acceptedAnswerId),
  );

  const asked =
    toTrimmedString(record.asked) ??
    toTrimmedString(record.created_at) ??
    toTrimmedString(record.createdAt) ??
    fallback?.asked ??
    'Recently';

  const updated =
    toTrimmedString(record.updated) ??
    toTrimmedString(record.updated_at) ??
    toTrimmedString(record.updatedAt) ??
    fallback?.updated ??
    asked;

  const relatedQuestionIds = extractRelatedQuestionIds(
    record.related_questions ?? record.related_threads ?? record.relatedQuestions ?? record.related,
  );
  const relatedQuestionRecords = extractCommunityQuestionArray(
    record.related_threads ?? record.related_questions ?? record.relatedQuestions ?? record.related,
  );
  const relatedQuestions = relatedQuestionRecords.map((relatedQuestion) =>
    normalizeCommunityQuestionSummary(relatedQuestion, {
      excerpt: 'No summary provided yet.',
      tags: [],
      author: 'Community member',
      role: 'Community',
      asked: 'Recently',
      votes: 0,
      answers: 0,
      views: 0,
    }),
  );

  return {
    id:
      toNumber(record.id) ??
      toNumber(record.question_id) ??
      fallback?.id ??
      Date.now(),
    authorId:
      toIdentifier(record.author_id) ??
      toIdentifier(record.user_id) ??
      toIdentifier(record.owner_id) ??
      fallback?.authorId,
    title:
      toTrimmedString(record.title) ??
      fallback?.title ??
      'Untitled question',
    excerpt:
      toTrimmedString(record.summary) ??
      toTrimmedString(record.excerpt) ??
      toTrimmedString(record.details) ??
      fallback?.excerpt ??
      'No summary provided yet.',
    body,
    tags: tags.length > 0 ? tags : (fallback?.tags ?? []),
    author:
      toTrimmedString(record.author_name) ??
      getCommunityAuthorName(record) ??
      toTrimmedString(record.author) ??
      toTrimmedString(record.name) ??
      fallback?.author ??
      'Community member',
    role:
      toTrimmedString(record.role) ??
      toTrimmedString(record.author_role) ??
      toTrimmedString(record.audience) ??
      fallback?.role ??
      'Community',
    asked,
    updated,
    votes:
      toNumber(record.votes) ??
      toNumber(record.vote_count) ??
      toNumber(record.upvotes) ??
      fallback?.votes ??
      0,
    answerCount:
      toNumber(record.answer_count) ??
      toNumber(record.answers_count) ??
      toNumber(record.answers) ??
      (answers.length > 0 ? answers.length : (fallback?.answerCount ?? 0)),
    views:
      toNumber(record.views) ??
      toNumber(record.view_count) ??
      fallback?.views ??
      0,
    hasAcceptedAnswer:
      (acceptedAnswerId !== undefined ? true : undefined) ??
      toBoolean(record.hasAcceptedAnswer) ??
      toBoolean(record.has_accepted_answer) ??
      fallback?.hasAcceptedAnswer,
    trending:
      toBoolean(record.trending) ??
      toBoolean(record.is_trending) ??
      fallback?.trending,
    answers: answers.length > 0 ? answers : (fallback?.answers ?? []),
    relatedQuestionIds: relatedQuestionIds.length > 0 ? relatedQuestionIds : (fallback?.relatedQuestionIds ?? []),
    relatedQuestions: relatedQuestions.length > 0 ? relatedQuestions : fallback?.relatedQuestions,
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(getApiMessage(text, res.statusText || 'Request failed'));
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

/** POST /orange_army_change_password */
export async function changePassword(payload: ChangePasswordPayload): Promise<string> {
  const res = await fetch(`${BASE_URL}/orange_army_change_password`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text().catch(() => '');

  if (!res.ok) {
    throw new Error(getApiMessage(text, res.statusText || 'Password change failed'));
  }

  const parsed = parseApiText(text);
  const statusCode = Number(parsed?.res);

  if (!Number.isNaN(statusCode) && statusCode === 0) {
    throw new Error(getApiMessage(text, 'Password change failed'));
  }

  if (typeof parsed?.message === 'string' && parsed.message.trim()) {
    return parsed.message.trim();
  }

  if (typeof parsed?.data === 'string' && parsed.data.trim()) {
    return parsed.data.trim();
  }

  return text.trim() || 'Password updated successfully.';
}

/** GET /community/questions */
export async function getCommunityQuestions(): Promise<CommunityQuestionSummary[]> {
  const res = await fetch(`${BASE_URL}/community/questions`, {
    method: 'GET',
    credentials: 'include',
  });

  const text = await res.text().catch(() => '');

  if (!res.ok) {
    throw new Error(getApiMessage(text, res.statusText || 'Failed to load community questions'));
  }

  const parsedJson = parseApiJson(text);
  const envelope = isJsonRecord(parsedJson) ? parsedJson : null;
  const statusCode = Number(envelope?.res);

  if (!Number.isNaN(statusCode) && statusCode === 0) {
    throw new Error(getApiMessage(text, 'Failed to load community questions'));
  }

  return extractCommunityQuestionArray(parsedJson).map((record) => normalizeCommunityQuestionSummary(record));
}

/** POST /community/questions */
export async function createCommunityQuestion(payload: CommunityQuestionPayload): Promise<CommunityQuestionSummary> {
  const res = await fetch(`${BASE_URL}/community/questions`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text().catch(() => '');

  if (!res.ok) {
    throw new Error(getApiMessage(text, res.statusText || 'Failed to create community question'));
  }

  const parsedJson = parseApiJson(text);
  const envelope = isJsonRecord(parsedJson) ? parsedJson : null;
  const statusCode = Number(envelope?.res);

  if (!Number.isNaN(statusCode) && statusCode === 0) {
    throw new Error(getApiMessage(text, 'Failed to create community question'));
  }

  const createdQuestionId = extractCreatedCommunityQuestionId(parsedJson);

  const fallback: Partial<CommunityQuestionSummary> = {
    id: createdQuestionId,
    authorId: payload.author_id,
    title: payload.title,
    excerpt: payload.summary || payload.details,
    tags: payload.tags,
    role: payload.audience,
    author: 'You',
    asked: 'Just now',
    votes: 0,
    answers: 0,
    views: 0,
  };

  const record = extractCommunityQuestionRecord(parsedJson);

  if (!record) {
    return normalizeCommunityQuestionSummary({}, fallback);
  }

  return normalizeCommunityQuestionSummary(record, fallback);
}

/** GET /community/questions/{id} */
export async function getCommunityQuestionById(
  questionId: number | string,
  fallback?: Partial<CommunityThreadDetail>,
): Promise<CommunityThreadDetail> {
  const res = await fetch(`${BASE_URL}/community/questions/${questionId}`, {
    method: 'GET',
    credentials: 'include',
  });

  const text = await res.text().catch(() => '');

  if (!res.ok) {
    throw new Error(getApiMessage(text, res.statusText || 'Failed to load question details'));
  }

  const parsedJson = parseApiJson(text);
  const envelope = isJsonRecord(parsedJson) ? parsedJson : null;
  const statusCode = Number(envelope?.res);

  if (!Number.isNaN(statusCode) && statusCode === 0) {
    throw new Error(getApiMessage(text, 'Failed to load question details'));
  }

  const record = extractCommunityThreadDetailRecord(parsedJson);
  if (!record) {
    if (fallback) {
      return normalizeCommunityThreadDetail({ id: questionId }, fallback);
    }

    throw new Error('Question details are unavailable.');
  }

  return normalizeCommunityThreadDetail(record, fallback);
}

/** POST /community/questions/{id}/answers */
export async function createCommunityAnswer(
  questionId: number | string,
  payload: CommunityAnswerPayload,
  fallback?: Partial<CommunityAnswer>,
): Promise<CommunityAnswer> {
  const res = await fetch(`${BASE_URL}/community/questions/${questionId}/answers`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text().catch(() => '');

  if (!res.ok) {
    throw new Error(getApiMessage(text, res.statusText || 'Failed to post answer'));
  }

  const parsedJson = parseApiJson(text);
  const envelope = isJsonRecord(parsedJson) ? parsedJson : null;
  const statusCode = Number(envelope?.res);

  if (!Number.isNaN(statusCode) && statusCode === 0) {
    throw new Error(getApiMessage(text, 'Failed to post answer'));
  }

  const record = extractCommunityAnswerRecord(parsedJson);

  if (!record) {
    return normalizeCommunityAnswer({}, undefined, {
      id: Date.now(),
      authorId: payload.author_id,
      body: [payload.body],
      ...fallback,
    });
  }

  return normalizeCommunityAnswer(record, undefined, fallback);
}

/** POST /community/answers/{id}/accept */
export async function acceptCommunityAnswer(answerId: number | string): Promise<string> {
  const res = await fetch(`${BASE_URL}/community/answers/${answerId}/accept`, {
    method: 'POST',
    credentials: 'include',
  });

  const text = await res.text().catch(() => '');

  if (!res.ok) {
    throw new Error(getApiMessage(text, res.statusText || 'Failed to accept answer'));
  }

  const parsed = parseApiText(text);
  const statusCode = Number(parsed?.res);

  if (!Number.isNaN(statusCode) && statusCode === 0) {
    throw new Error(getApiMessage(text, 'Failed to accept answer'));
  }

  if (typeof parsed?.message === 'string' && parsed.message.trim()) {
    return parsed.message.trim();
  }

  if (typeof parsed?.data === 'string' && parsed.data.trim()) {
    return parsed.data.trim();
  }

  return text.trim() || 'Answer accepted successfully.';
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

/** POST /lms/user-progres/{userId} */
export async function getUserProgress(userId: string | number): Promise<UserProgress> {
  const res = await fetch(`${BASE_URL}/lms/user-progres/${userId}`, {
    method: 'POST',
    credentials: 'include',
  });

  const text = await res.text().catch(() => '');

  if (!res.ok) {
    throw new Error(getApiMessage(text, res.statusText || 'Failed to load user progress'));
  }

  const parsedJson = parseApiJson(text);
  const parsedRecord = isJsonRecord(parsedJson) ? parsedJson : null;
  const statusCode = Number(parsedRecord?.res);

  if (!Number.isNaN(statusCode) && statusCode === 0) {
    throw new Error(getApiMessage(text, 'Failed to load user progress'));
  }

  return normalizeUserProgress(parsedJson);
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
export async function completeLesson(payload: CompleteLessonPayload): Promise<string> {
  const res = await fetch(`${BASE_URL}/lms/complete-lesson`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: payload.user_id,
      lesson_id: payload.lessonId,
    }),
  });

  const text = await res.text().catch(() => '');

  if (!res.ok) {
    throw new Error(getApiMessage(text, res.statusText || 'Failed to complete lesson'));
  }

  const parsed = parseApiText(text);
  const statusCode = Number(parsed?.res);

  if (!Number.isNaN(statusCode) && statusCode === 0) {
    throw new Error(getApiMessage(text, 'Failed to complete lesson'));
  }

  if (typeof parsed?.message === 'string' && parsed.message.trim()) {
    return parsed.message.trim();
  }

  if (typeof parsed?.data === 'string' && parsed.data.trim()) {
    return parsed.data.trim();
  }

  return text.trim() || 'Lesson completed successfully.';
}
