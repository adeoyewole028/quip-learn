import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { getCourse } from '@/lib/api/lms';
import type { Course, Module, Lesson } from '@/types/lms';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
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

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  // Course summary passed as route state from CoursesPage
  const course = (location.state as { course?: Course } | null)?.course ?? null;

  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sortedModules = modules
    .slice()
    .sort((a, b) => Number(a.order_index) - Number(b.order_index));

  useEffect(() => {
    if (!id) return;
    getCourse(id)
      .then(setModules)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-destructive">
        <AlertCircle className="w-8 h-8" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const allLessons: Lesson[] = modules.flatMap((m) => m.lessons);
  const completed = allLessons.filter((l) => l.completed).length;
  const progress = allLessons.length ? Math.round((completed / allLessons.length) * 100) : 0;

  const selectedModuleLessons = selectedModule
    ? selectedModule.lessons
        .slice()
        .sort((a, b) => Number(a.order_index ?? 0) - Number(b.order_index ?? 0))
    : [];

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
            {!loading && allLessons.length > 0 && (
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>{completed} / {allLessons.length} lessons completed</span>
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

            return (
              <button
                key={module.id}
                type="button"
                onClick={() => setSelectedModule(module)}
                className="group block w-full text-left"
              >
                <Card className="overflow-hidden border transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
                  <CardContent className="px-5 py-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            {module.title}
                          </span>
                        </div>

                        <div className="mt-4 flex items-start gap-3">
                          <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Layers3 className="h-5 w-5" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                              Lesson {idx + 1}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                              {moduleLessons.length} learning item{moduleLessons.length === 1 ? '' : 's'} inside this stack.
                              Click to open the lesson list.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 rounded-2xl border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                        <span>
                          {moduleCompleted}/{moduleLessons.length} done
                        </span>
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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
          onClick={() => setSelectedModule(null)}
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
                  onClick={() => setSelectedModule(null)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Close lesson list"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[calc(88vh-6.5rem)] overflow-y-auto px-3 py-3">
                <div className="space-y-2">
                  {selectedModuleLessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => {
                        setSelectedModule(null);
                        navigate(`/lessons/${lesson.id}`);
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