import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { getCourse, getUserProgress } from '@/lib/api/lms';
import type { Course, Module, Lesson, UserProgress } from '@/types/lms';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import {
  ChevronLeft, CheckCircle2, PlayCircle, FileText, HelpCircle,
  PenLine, BookOpen, AlertCircle, ChevronRight, Layers3, X,
} from 'lucide-react';

const lessonTypeLabel: Record<string, string> = {
  text: 'Article',
  video: 'Video',
  quiz: 'Quiz',
  assignment: 'Assignment',
};

const lessonIcon: Record<string, React.ReactNode> = {
  text: <FileText className="w-4 h-4 text-emerald-500" />,
  video: <PlayCircle className="w-4 h-4 text-blue-500" />,
  quiz: <HelpCircle className="w-4 h-4 text-amber-500" />,
  assignment: <PenLine className="w-4 h-4 text-purple-500" />,
};

function normalizeModuleLessons(lessons: Lesson[]): Lesson[] {
  const uniqueLessons = new Map<string, Lesson>();

  for (const lesson of lessons) {
    const lessonId = lesson.id?.toString().trim();
    if (!lessonId) continue;
    if (!uniqueLessons.has(lessonId)) {
      uniqueLessons.set(lessonId, lesson);
    }
  }

  return Array.from(uniqueLessons.values());
}

function parseLiveDate(value?: string | null): Date | null {
  if (!value || value.startsWith('0000-00-00')) return null;

  const match = value.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})(?:\s+([0-9]{2}):([0-9]{2}):([0-9]{2}))?$/);
  if (!match) return null;

  const [, year, month, day, hour = '0', minute = '0', second = '0'] = match;
  const parsedDate = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatLiveDateLabel(liveDate?: string | null): string | null {
  const parsedLiveDate = parseLiveDate(liveDate);
  if (!parsedLiveDate) return null;

  return parsedLiveDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isLiveDateReached(liveDate?: string | null): boolean {
  const parsedLiveDate = parseLiveDate(liveDate);
  if (!parsedLiveDate) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const liveDay = new Date(parsedLiveDate);
  liveDay.setHours(0, 0, 0, 0);

  return liveDay.getTime() <= today.getTime();
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  // Course summary passed as route state from CoursesPage
  const course = (location.state as { course?: Course } | null)?.course ?? null;

  const [modules, setModules] = useState<Module[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const courseId = id;

    let cancelled = false;

    async function loadCourseDetail() {
      setLoading(true);
      setError(null);

      try {
        const [nextModules, nextProgress] = await Promise.all([
          getCourse(courseId, user?.cohort ?? undefined),
          user?.id ? getUserProgress(user.id) : Promise.resolve<UserProgress | null>(null),
        ]);

        if (cancelled) return;

        setModules(nextModules);
        setUserProgress(nextProgress);
      } catch (err) {
        if (cancelled) return;
        setError((err as Error).message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCourseDetail();

    return () => {
      cancelled = true;
    };
  }, [id, user?.id, user?.cohort]);

  const completedLessonIds = new Set(userProgress?.completedLessonIds ?? []);
  const modulesWithProgress = modules.map((module) => ({
    ...module,
    lessons: normalizeModuleLessons(module.lessons).map((lesson) => ({
      ...lesson,
      completed: lesson.completed || completedLessonIds.has(lesson.id),
    })),
  }));
  const sortedModules = modulesWithProgress
    .slice()
    .sort((a, b) => Number(a.order_index) - Number(b.order_index));
  const selectedModuleId = new URLSearchParams(location.search).get('module');
  const requestedModule = selectedModuleId
    ? sortedModules.find((module) => module.id === selectedModuleId) ?? null
    : null;
  const selectedModule = requestedModule && isLiveDateReached(requestedModule.live_date)
    ? requestedModule
    : null;
  const trackedCourseProgress = id ? userProgress?.courseProgress[id] : undefined;
  const allLessons: Lesson[] = modulesWithProgress.flatMap((module) => module.lessons);
  const completed = trackedCourseProgress?.completedLessons ?? allLessons.filter((lesson) => lesson.completed).length;
  const totalLessons = trackedCourseProgress?.totalLessons ?? allLessons.length;
  const progress =
    trackedCourseProgress?.progressPercent ??
    (totalLessons ? Math.round((completed / totalLessons) * 100) : 0);

  const selectedModuleLessons = selectedModule
    ? selectedModule.lessons
        .slice()
        .sort((a, b) => Number(a.order_index ?? 0) - Number(b.order_index ?? 0))
    : [];

  function navigateWithModule(moduleId: string | null, replace = false) {
    const search = moduleId ? `?module=${encodeURIComponent(moduleId)}` : '';
    navigate(
      {
        pathname: location.pathname,
        search,
      },
      { replace },
    );
  }

  useEffect(() => {
    if (!requestedModule || selectedModule) return;
    navigate(
      {
        pathname: location.pathname,
        search: '',
      },
      { replace: true },
    );
  }, [location.pathname, navigate, requestedModule, selectedModule]);

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
      {/* Back breadcrumb */}
      <Link
        to="/courses"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        All courses
      </Link>

      {/* Course hero card */}
      {course ? (
        <div className="mb-8 rounded-2xl overflow-hidden border bg-card shadow-sm">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-linear-to-br from-primary/20 via-accent to-primary/5 flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-primary/50" />
            </div>
          )}
          <div className="p-5">
            <div className="flex items-start gap-3 mb-2">
              <h1 className="text-xl font-bold tracking-tight flex-1">{course.title}</h1>
              {course.cohort_restriction && (
                <Badge variant="secondary" className="shrink-0">{course.cohort_restriction}</Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm mb-4">{course.description}</p>
            {!loading && totalLessons > 0 && (
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>{completed} / {totalLessons} lessons completed</span>
                  <span className="font-medium text-primary">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>
        </div>
      ) : loading ? (
        <div className="mb-8 space-y-3">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-full" />
        </div>
      ) : null}

      {/* Module list */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : modules.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3 text-muted-foreground">
          <BookOpen className="w-8 h-8" />
          <p className="text-sm">No modules found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedModules.map((module, idx) => {
            const moduleLessons = module.lessons
              .slice()
              .sort((a, b) => Number(a.order_index ?? 0) - Number(b.order_index ?? 0));
            const moduleCompleted = moduleLessons.filter((lesson) => lesson.completed).length;
            const moduleWeekNumber = Number(module.order_index) > 0 ? Number(module.order_index) : idx + 1;
            const moduleLiveDateLabel = formatLiveDateLabel(module.live_date);
            const moduleIsLive = isLiveDateReached(module.live_date);
            const moduleWeekLabel = moduleLiveDateLabel
              ? `Week ${moduleWeekNumber} – ${moduleLiveDateLabel}`
              : `Week ${moduleWeekNumber}`;

            return (
              <button
                key={module.id}
                type="button"
                onClick={() => {
                  if (!moduleIsLive) return;
                  navigateWithModule(module.id);
                }}
                disabled={!moduleIsLive}
                className="group block w-full text-left disabled:cursor-not-allowed"
              >
                <Card className={`overflow-hidden border transition-all ${
                  moduleIsLive ? 'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg' : 'opacity-80'
                }`}>
                  <CardContent className="px-5 py-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className={`text-xs font-semibold ${moduleIsLive ? 'text-primary' : 'text-muted-foreground'}`}>
                          {moduleWeekLabel}
                        </div>

                        <div className="mt-4 flex items-start gap-3">
                          <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Layers3 className="h-5 w-5" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                              {module.title}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                              {moduleIsLive
                                ? `${moduleLessons.length} lesson${moduleLessons.length === 1 ? '' : 's'} available. Click to view lessons.`
                                : `Available ${moduleLiveDateLabel ?? 'soon'}.`}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm ${
                        moduleIsLive
                          ? 'bg-muted/30 text-muted-foreground'
                          : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300'
                      }`}>
                        {moduleIsLive ? (
                          <>
                            <span>
                              {moduleCompleted}/{moduleLessons.length} done
                            </span>
                            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                          </>
                        ) : (
                          <span>Not live yet</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {moduleLessons.slice(0, 3).map((lesson) => (
                        <span
                          key={lesson.id}
                          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground"
                        >
                          {lessonIcon[lesson.type] ?? <FileText className="w-3.5 h-3.5" />}
                          {lesson.title}
                        </span>
                      ))}
                      {moduleLessons.length > 3 && (
                        <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
                          +{moduleLessons.length - 3} more
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      {selectedModule && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6"
          onClick={() => {
            navigateWithModule(null, true);
          }}
          role="presentation"
        >
          <Card
            className="max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-t-3xl border bg-card shadow-2xl sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <CardContent className="p-0">
              <div className="flex items-start justify-between gap-4 border-b px-6 py-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      {selectedModule.title}
                    </span>
                    <Badge variant="secondary">{selectedModuleLessons.length} lessons</Badge>
                  </div>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                    Open a lesson from this stack
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose one of the lessons below to continue learning.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigateWithModule(null, true);
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Close lesson list"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[calc(88vh-6.5rem)] overflow-y-auto px-3 pt-3 pb-14">
                <div className="space-y-2">
                  {selectedModuleLessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => {
                        navigate(`/lessons/${lesson.id}`, {
                          state: {
                            courseId: id,
                            moduleId: selectedModule.id,
                          },
                        });
                      }}
                      className="group flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left transition-colors hover:bg-muted/50"
                    >
                      <span className="shrink-0">
                        {lessonIcon[lesson.type] ?? <FileText className="w-4 h-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium transition-colors group-hover:text-primary">
                          {lesson.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {lessonTypeLabel[lesson.type] ?? lesson.type}
                          {lesson.duration ? ` · ${lesson.duration}` : ''}
                        </span>
                      </span>
                      {lesson.completed ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}