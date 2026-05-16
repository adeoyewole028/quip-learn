
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getLesson, getUserProgress, completeLesson, submitQuiz, submitAssignmentFile } from '@/lib/api/lms';
import type { Lesson, RawQuizQuestion, TextLessonContent, VideoLessonContent, QuizLessonContent, AssignmentLessonContent, VideoProvider } from '@/types/lms';
import { useAuth } from '@/hooks/useAuth';

/** Convert a plain video page URL to an embeddable iframe URL. */
function toEmbedUrl(url: string, provider?: VideoProvider): string {
  try {
    const u = new URL(url);

    // YouTube: https://www.youtube.com/watch?v=ID or https://youtu.be/ID
    if (
      provider === 'youtube' ||
      u.hostname === 'www.youtube.com' ||
      u.hostname === 'youtube.com' ||
      u.hostname === 'youtu.be'
    ) {
      const videoId =
        u.hostname === 'youtu.be'
          ? u.pathname.slice(1)
          : u.searchParams.get('v');
      if (videoId) {
        const params = new URLSearchParams({
          rel: '0',
          modestbranding: '1',
          iv_load_policy: '3',
          playsinline: '1',
        });
        return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
      }
    }

    // Vimeo: https://vimeo.com/ID
    if (provider === 'vimeo' || u.hostname === 'vimeo.com') {
      const videoId = u.pathname.split('/').filter(Boolean)[0];
      if (videoId) {
        const params = new URLSearchParams({
          title: '0',
          byline: '0',
          portrait: '0',
        });
        return `https://player.vimeo.com/video/${videoId}?${params.toString()}`;
      }
    }

    // Loom: https://www.loom.com/share/ID
    if (provider === 'loom' || u.hostname === 'www.loom.com') {
      const videoId = u.pathname.split('/').filter(Boolean)[1];
      if (videoId) return `https://www.loom.com/embed/${videoId}`;
    }
  } catch {
    // fall through — return url as-is
  }
  return url;
}

function getSafeVideoEmbedUrl(url?: string, provider?: VideoProvider): string | null {
  const normalizedUrl = url?.trim();
  if (!normalizedUrl) return null;

  const embedUrl = toEmbedUrl(normalizedUrl, provider).trim();
  if (!embedUrl) return null;

  try {
    const parsed = new URL(embedUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, ChevronLeft, AlertCircle, FileText, PlayCircle, HelpCircle, PenLine, Paperclip } from 'lucide-react';

interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  percentageScore: number;
  timedOut: boolean;
}

const DEFAULT_MAX_QUIZ_ATTEMPTS = 3;

function parseMaxAttempts(content?: QuizLessonContent): number {
  if (!content) return DEFAULT_MAX_QUIZ_ATTEMPTS;

  const candidates: unknown[] = [
    content.max_attempts,
    content.maxAttempts,
    content.allowed_attempts,
    content.allowedAttempts,
    content.attempts,
    content.attempt_limit,
    content.attemptLimit,
  ];

  for (const candidate of candidates) {
    const parsed = Number(candidate);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.floor(parsed);
    }
  }

  return DEFAULT_MAX_QUIZ_ATTEMPTS;
}

function parsePassingScore(content?: QuizLessonContent): number | null {
  if (!content?.passing_score) return null;
  const parsed = Number(content.passing_score);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function parseDurationToSeconds(duration?: string): number | null {
  if (!duration) return null;
  const raw = duration.trim().toLowerCase();
  if (!raw) return null;

  // Supports values like: "23" (minutes), "23m", "30 min", "30 mins", "45s", "01:30", "1h".
  if (/^\d+$/.test(raw)) return Number(raw) * 60;
  if (/^\d+\s*(min|mins|minute|minutes)$/.test(raw)) {
    const minutes = Number(raw.replace(/\s*(min|mins|minute|minutes)$/, ''));
    return minutes * 60;
  }
  if (/^\d+m$/.test(raw)) return Number(raw.slice(0, -1)) * 60;
  if (/^\d+s$/.test(raw)) return Number(raw.slice(0, -1));
  if (/^\d+\s*(sec|secs|second|seconds)$/.test(raw)) {
    return Number(raw.replace(/\s*(sec|secs|second|seconds)$/, ''));
  }
  if (/^\d+\s*(h|hr|hrs|hour|hours)$/.test(raw)) {
    const hours = Number(raw.replace(/\s*(h|hr|hrs|hour|hours)$/, ''));
    return hours * 60 * 60;
  }

  const timeParts = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (timeParts) {
    const minutes = Number(timeParts[1]);
    const seconds = Number(timeParts[2]);
    return minutes * 60 + seconds;
  }

  return null;
}

function formatCountdown(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

const lessonTypeIcon: Record<string, React.ReactNode> = {
  text: <FileText className="w-4 h-4" />,
  video: <PlayCircle className="w-4 h-4" />,
  quiz: <HelpCircle className="w-4 h-4" />,
  assignment: <PenLine className="w-4 h-4" />,
};

const lessonTypeBadgeClass: Record<string, string> = {
  text: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  video: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  quiz: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  assignment: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
};

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Quiz state
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  // Timer state for any time-based lesson
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null);
  const [quizTimeLeftSeconds, setQuizTimeLeftSeconds] = useState<number | null>(null);
  const [quizAttemptCount, setQuizAttemptCount] = useState(0);
  const autoSubmitTriggeredRef = useRef(false);
  // Assignment state
  const [assignmentText, setAssignmentText] = useState('');
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);

  const navigationState = location.state as { courseId?: string; moduleId?: string } | null;

  function navigateBackToCourse() {
    const courseId = navigationState?.courseId;
    if (!courseId) {
      navigate(-1);
      return;
    }

    const moduleParam = navigationState?.moduleId
      ? `?module=${encodeURIComponent(navigationState.moduleId)}`
      : '';
    navigate(`/courses/${courseId}${moduleParam}`);
  }

  let quizQuestions: RawQuizQuestion[] = [];
  let quizQuestionsError: string | null = null;
  const quizContent = lesson?.type === 'quiz' ? (lesson.content as QuizLessonContent | undefined) : undefined;
  const videoContent = lesson?.type === 'video' ? (lesson.content as VideoLessonContent | undefined) : undefined;
  const hasValidVideoUrl =
    lesson?.type === 'video'
      ? Boolean(getSafeVideoEmbedUrl(videoContent?.video_url, videoContent?.provider))
      : true;
  const maxQuizAttempts = parseMaxAttempts(quizContent);
  const passingScore = parsePassingScore(quizContent);
  const quizAttemptsLeft = Math.max(0, maxQuizAttempts - quizAttemptCount);
  const quizAttemptsExhausted = quizAttemptsLeft <= 0;

  if (lesson?.type === 'quiz' && lesson.content) {
    try {
      quizQuestions = JSON.parse((lesson.content as QuizLessonContent).questions_json) as RawQuizQuestion[];
    } catch {
      quizQuestionsError = 'Failed to parse quiz questions.';
    }
  }

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    Promise.all([
      getLesson(id, user?.cohort ?? undefined),
      user?.id ? getUserProgress(user.id) : Promise.resolve(null),
    ])
      .then(([nextLesson, progress]) => {
        if (cancelled) return;

        const attemptsStorageKey = user?.id ? `quiz-attempts:${user.id}:${nextLesson.id}` : null;
        const storedAttemptCount = attemptsStorageKey
          ? Number(window.localStorage.getItem(attemptsStorageKey) ?? 0)
          : 0;
        const normalizedAttemptCount =
          Number.isFinite(storedAttemptCount) && storedAttemptCount > 0
            ? Math.floor(storedAttemptCount)
            : 0;

        const completedFromProgress = progress?.completedLessonIds.includes(nextLesson.id) ?? false;
        setLesson({
          ...nextLesson,
          completed: nextLesson.completed || completedFromProgress,
        });
        setAnswers({});
        setQuizResult(null);
        setQuizAttemptCount(nextLesson.type === 'quiz' ? normalizedAttemptCount : 0);
        const nextMaxAttempts = nextLesson.type === 'quiz'
          ? parseMaxAttempts(nextLesson.content as QuizLessonContent | undefined)
          : 0;
        const attemptsReached = nextLesson.type === 'quiz' && normalizedAttemptCount >= nextMaxAttempts;
        setDone(nextLesson.type === 'quiz' ? attemptsReached : nextLesson.completed || completedFromProgress);
        setQuizTimeLeftSeconds(
          nextLesson.type === 'quiz' ? parseDurationToSeconds(nextLesson.duration) : null,
        );
        // For any time-based lesson, set timer
        setTimeLeftSeconds(nextLesson.duration ? parseDurationToSeconds(nextLesson.duration) : null);
        autoSubmitTriggeredRef.current = false;
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, user?.id, user?.cohort]);

  // Timer for quizzes
  useEffect(() => {
    if (
      !lesson ||
      lesson.type !== 'quiz' ||
      done ||
      submitting ||
      quizAttemptsExhausted ||
      quizTimeLeftSeconds === null ||
      quizTimeLeftSeconds <= 0
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setQuizTimeLeftSeconds((prev) => {
        if (prev === null) return null;
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [lesson, done, quizResult, submitting, quizTimeLeftSeconds, quizAttemptsExhausted]);

  // Timer for any time-based lesson (except quiz, which has its own logic)
  useEffect(() => {
    if (!lesson || lesson.type === 'quiz' || done || submitting || timeLeftSeconds === null || timeLeftSeconds <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev === null) return null;
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [lesson, done, submitting, timeLeftSeconds]);

  async function handleMarkComplete() {
    if (!id) return;
    if (!user?.id) {
      setError('You must be logged in to complete this lesson.');
      return;
    }

    setSubmitting(true);
    try {
      await completeLesson({ lessonId: id, user_id: user.id });
      setLesson((currentLesson) => (currentLesson ? { ...currentLesson, completed: true } : currentLesson));
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleQuizSubmit(timedOut: boolean = false) {
    if (!id) return;
    if (!lesson || lesson.type !== 'quiz') return;
    if (quizAttemptsExhausted) {
      setError(`You have used all ${maxQuizAttempts} attempts for this quiz.`);
      return;
    }
    if (!user?.id) {
      setError('You must be logged in to submit this quiz.');
      return;
    }

    if (!timedOut) {
      // Block manual submit if time already ran out; auto-submit effect handles that case.
      autoSubmitTriggeredRef.current = true;
    }

    setSubmitting(true);
    try {
      if (quizQuestionsError) {
        setError(quizQuestionsError);
        return;
      }

      if (quizQuestions.length === 0) {
        setError('Failed to load quiz questions.');
        return;
      }

      const totalQuestions = quizQuestions.length;
      const correctAnswers = quizQuestions.reduce((count, question, index) => {
        return answers[index] === question.c ? count + 1 : count;
      }, 0);
      const percentageScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

      const normalizedAnswers = quizQuestions.reduce<Record<number, number>>((acc, _question, index) => {
        acc[index] = typeof answers[index] === 'number' ? answers[index] : -1;
        return acc;
      }, {});

      await submitQuiz({
        lessonId: id,
        user_id: user.id,
        score: percentageScore,
        answers: normalizedAnswers,
      });

      const nextAttemptCount = quizAttemptCount + 1;
      const attemptsStorageKey = `quiz-attempts:${user.id}:${id}`;
      window.localStorage.setItem(attemptsStorageKey, String(nextAttemptCount));
      setQuizAttemptCount(nextAttemptCount);

      const didPass = passingScore !== null ? percentageScore >= passingScore : true;
      setLesson((currentLesson) => (currentLesson
        ? { ...currentLesson, completed: currentLesson.completed || didPass }
        : currentLesson));

      // Set result AFTER successful submit so timedOut is always accurate.
      setQuizResult({
        totalQuestions,
        correctAnswers,
        percentageScore,
        timedOut,
      });
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleRetryQuiz() {
    if (!lesson || lesson.type !== 'quiz') return;
    if (quizAttemptsExhausted) return;

    setError(null);
    setAnswers({});
    setQuizResult(null);
    setDone(false);
    setQuizTimeLeftSeconds(parseDurationToSeconds(lesson.duration));
    autoSubmitTriggeredRef.current = false;
  }

  const submitQuizOnTimeout = useEffectEvent(() => {
    void handleQuizSubmit(true);
  });

  useEffect(() => {
    if (!lesson || lesson.type !== 'quiz') return;
    if (done || submitting || quizTimeLeftSeconds !== 0 || autoSubmitTriggeredRef.current) return;
    autoSubmitTriggeredRef.current = true;
    submitQuizOnTimeout();
  }, [done, lesson, quizTimeLeftSeconds, submitting]);

  async function handleAssignmentSubmit() {
    if (!id) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('lessonId', id);
      if (assignmentText) fd.append('text', assignmentText);
      if (assignmentFile) fd.append('file', assignmentFile);
      await submitAssignmentFile(fd);
      setLesson((currentLesson) => (currentLesson ? { ...currentLesson, completed: true } : currentLesson));
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-destructive">
        <AlertCircle className="w-8 h-8" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <button
        onClick={navigateBackToCourse}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-96 rounded-xl mt-4" />
        </div>
      ) : lesson ? (
        <>
          {/* Lesson header */}
          <div className="mb-7">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${lessonTypeBadgeClass[lesson.type] ?? ''}`}
              >
                {lessonTypeIcon[lesson.type]}
                {lesson.type}
              </span>
              {lesson.duration && (
                <span className="text-xs text-muted-foreground">{lesson.duration}</span>
              )}
              {/* Show countdown for any time-based lesson */}
              {lesson.duration && !done && (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    (lesson.type === 'quiz' ? quizTimeLeftSeconds : timeLeftSeconds) !== null && (lesson.type === 'quiz' ? quizTimeLeftSeconds : timeLeftSeconds)! <= 60
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  Time left: {formatCountdown(lesson.type === 'quiz' ? quizTimeLeftSeconds ?? 0 : timeLeftSeconds ?? 0)}
                </span>
              )}
              {lesson.type === 'quiz' && (
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  Attempt {Math.min(quizAttemptCount + 1, maxQuizAttempts)} of {maxQuizAttempts}
                </span>
              )}
              {lesson.completed && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Completed
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{lesson.title}</h1>
          </div>

          {done ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-lg font-semibold">
                {lesson.type === 'quiz'
                  ? (quizResult && passingScore !== null && quizResult.percentageScore < passingScore
                    ? 'Quiz submitted - not passed yet.'
                    : 'Quiz submitted!')
                  : lesson.type === 'assignment'
                  ? 'Assignment submitted!'
                  : 'Lesson complete!'}
              </p>
              <p className="text-sm text-muted-foreground max-w-xs">
                {lesson.type === 'quiz' && quizResult
                  ? `You got ${quizResult.correctAnswers} of ${quizResult.totalQuestions} correct (${quizResult.percentageScore}%).`
                  : 'Great work! Keep up the momentum.'}
              </p>
              {lesson.type === 'quiz' && (
                <p className="text-xs text-muted-foreground">
                  Attempts used: {quizAttemptCount}/{maxQuizAttempts}
                  {quizAttemptsLeft > 0 ? ` · ${quizAttemptsLeft} left` : ' · no attempts left'}
                </p>
              )}
              {lesson.type === 'quiz' && quizResult && (
                <div className="text-sm text-muted-foreground">
                  Score: <span className="font-semibold text-foreground">{quizResult.correctAnswers}/{quizResult.totalQuestions}</span>
                  {' '}({quizResult.percentageScore}%)
                  {quizResult.timedOut ? ' - auto-submitted when time expired.' : ' - submitted successfully.'}
                </div>
              )}
              {lesson.type === 'quiz' && quizResult && quizAttemptsLeft > 0 && (
                <Button onClick={handleRetryQuiz} className="mt-1">
                  Retry Quiz ({quizAttemptsLeft} attempt{quizAttemptsLeft === 1 ? '' : 's'} left)
                </Button>
              )}
              <Button variant="outline" onClick={navigateBackToCourse} className="mt-2">
                Back to course
              </Button>
            </div>
          ) : (
            <>
              {/* Text lesson */}
              {lesson.type === 'text' && lesson.content && (
                <article
                  className="prose prose-sm dark:prose-invert max-w-none mb-8 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: (lesson.content as TextLessonContent).content_html }}
                />
              )}

              {/* Video */}
              {lesson.type === 'video' && lesson.content && (() => {
                const vc = lesson.content as VideoLessonContent;
                const embedUrl = getSafeVideoEmbedUrl(vc.video_url, vc.provider);

                if (!embedUrl) {
                  return (
                    <Card className="mb-8 border-dashed">
                      <CardContent className="flex items-start gap-3 py-5">
                        <AlertCircle className="mt-0.5 h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Video unavailable</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            This lesson does not have a valid video link yet. Please check back later.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }

                return (
                  <div className="mb-8">
                    <div className="rounded-2xl overflow-hidden aspect-video bg-black shadow-lg">
                      <iframe
                        src={embedUrl}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                        title={lesson.title}
                        referrerPolicy="strict-origin-when-cross-origin"
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Quiz */}
              {lesson.type === 'quiz' && lesson.content && (() => {
                if (quizQuestionsError) {
                  return <p className="text-destructive text-sm">{quizQuestionsError}</p>;
                }
                if (quizQuestions.length === 0) {
                  return <p className="text-muted-foreground text-sm">No quiz questions available.</p>;
                }
                return (
                  <div className="space-y-5 mb-8">
                    <p className="text-xs text-muted-foreground">
                      You can attempt this quiz up to {maxQuizAttempts} times.
                      {' '}Attempts used: {quizAttemptCount}/{maxQuizAttempts}.
                    </p>
                    {quizTimeLeftSeconds !== null && quizTimeLeftSeconds <= 0 && (
                      <p className="text-sm text-destructive">
                        Time is up. Your quiz has been submitted.
                      </p>
                    )}
                    {quizQuestions.map((q, qi) => (
                      <Card key={qi} className="overflow-hidden">
                        <CardContent className="pt-5">
                          <p className="font-semibold mb-4 leading-snug">
                            <span className="text-primary mr-1.5">{qi + 1}.</span>
                            {q.q}
                          </p>
                          <div className="space-y-2">
                            {q.a.map((opt, oi) => {
                              const selected = answers[qi] === oi;
                              return (
                                <label
                                  key={oi}
                                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                    selected
                                      ? 'border-primary bg-primary/8 shadow-sm'
                                      : 'border-border hover:border-primary/40 hover:bg-muted/40'
                                  }`}
                                >
                                  <span
                                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                                      selected ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                                    }`}
                                  >
                                    {selected && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                                  </span>
                                  <input
                                    type="radio"
                                    name={`q-${qi}`}
                                    checked={selected}
                                    onChange={() => setAnswers((prev) => ({ ...prev, [qi]: oi }))}
                                    disabled={submitting || (quizTimeLeftSeconds !== null && quizTimeLeftSeconds <= 0)}
                                    className="sr-only"
                                  />
                                  <span className="text-sm">{opt}</span>
                                </label>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <Button
                      onClick={() => {
                        void handleQuizSubmit(false);
                      }}
                      disabled={
                        submitting ||
                        quizAttemptsExhausted ||
                        (quizTimeLeftSeconds !== null && quizTimeLeftSeconds <= 0) ||
                        quizQuestions.length !== Object.keys(answers).length
                      }
                      className="w-full sm:w-auto"
                    >
                      {submitting ? 'Submitting…' : quizAttemptsExhausted ? 'No attempts left' : 'Submit Quiz'}
                    </Button>
                  </div>
                );
              })()}

              {/* Assignment */}
              {lesson.type === 'assignment' && (
                <div className="space-y-4 mb-8">
                  {lesson.content && (lesson.content as AssignmentLessonContent).instruction_html && (
                    <Card className="bg-accent border-accent">
                      <CardContent className="pt-4 pb-4">
                        <article
                          className="prose prose-sm dark:prose-invert max-w-none text-accent-foreground"
                          dangerouslySetInnerHTML={{
                            __html: (lesson.content as AssignmentLessonContent).instruction_html!,
                          }}
                        />
                      </CardContent>
                    </Card>
                  )}
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Your response</label>
                    <textarea
                      className="w-full rounded-xl border bg-background p-3.5 text-sm min-h-40 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      placeholder="Type your response here…"
                      value={assignmentText}
                      onChange={(e) => setAssignmentText(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Attach file <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <label className="flex items-center gap-2 w-full cursor-pointer rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors">
                      <Paperclip className="w-4 h-4 shrink-0" />
                      <span>{assignmentFile ? assignmentFile.name : 'Click to upload a file'}</span>
                      <input
                        type="file"
                        className="sr-only"
                        onChange={(e) => setAssignmentFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                  <Button
                    onClick={handleAssignmentSubmit}
                    disabled={submitting || (!assignmentText && !assignmentFile)}
                    className="w-full sm:w-auto"
                  >
                    {submitting ? 'Submitting…' : 'Submit Assignment'}
                  </Button>
                </div>
              )}

              {/* Mark complete (text / video) */}
              {(lesson.type === 'text' || lesson.type === 'video') && !lesson.completed && (
                <div className="pt-4 border-t">
                  {lesson.type === 'video' && !hasValidVideoUrl && (
                    <p className="mb-2 text-sm text-muted-foreground">
                      A valid video link is required before this lesson can be marked complete.
                    </p>
                  )}
                  <Button
                    onClick={handleMarkComplete}
                    disabled={submitting || (lesson.type === 'video' && !hasValidVideoUrl)}
                    className="w-full sm:w-auto"
                  >
                    {submitting ? 'Saving…' : 'Mark as Complete'}
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      ) : null}
    </div>
  );
}


