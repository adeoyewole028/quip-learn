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
  PenLine, BookOpen, AlertCircle, ChevronRight,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            <div className="w-full h-48 bg-gradient-to-br from-primary/20 via-accent to-primary/5 flex items-center justify-center">
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
        <div className="space-y-6">
          {modules
            .slice()
            .sort((a, b) => Number(a.order_index) - Number(b.order_index))
            .map((module, idx) => (
              <div key={module.id}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {module.title}
                  </h2>
                </div>
                <Card className="overflow-hidden">
                  <CardContent className="p-0 divide-y">
                    {module.lessons
                      .slice()
                      .sort((a, b) => Number(a.order_index ?? 0) - Number(b.order_index ?? 0))
                      .map((lesson) => (
                        <button
                          key={lesson.id}
                          onClick={() => navigate(`/lessons/${lesson.id}`)}
                          className="group w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left"
                        >
                          <span className="shrink-0">
                            {lessonIcon[lesson.type] ?? <FileText className="w-4 h-4" />}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-medium truncate group-hover:text-primary transition-colors">
                              {lesson.title}
                            </span>
                            <span className="block text-xs text-muted-foreground mt-0.5">
                              {lessonTypeLabel[lesson.type] ?? lesson.type}
                              {lesson.duration ? ` · ${lesson.duration}` : ''}
                            </span>
                          </span>
                          {lesson.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      ))}
                  </CardContent>
                </Card>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}