import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCourses } from '@/lib/api/lms';
import type { Course } from '@/types/lms';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { BookOpen, ArrowRight, AlertCircle } from 'lucide-react';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getCourses()
      .then(setCourses)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-destructive">
        <AlertCircle className="w-8 h-8" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Hero */}
      <div className="mb-10">
        <span className="inline-block rounded-full bg-accent text-accent-foreground text-xs font-semibold px-3 py-1 mb-3">
          Learning Hub
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">My Courses</h1>
        <p className="text-muted-foreground mt-2 text-base max-w-lg">
          Curated micro-learning content for healthcare professionals. Grow your skills at your own pace.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden">
              <Skeleton className="h-40 w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 gap-4 text-muted-foreground">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <BookOpen className="w-7 h-7" />
          </div>
          <p className="font-medium">No courses available yet.</p>
          <p className="text-sm">Check back soon for new content.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const progress =
              course.totalLessons && course.completedLessons != null
                ? Math.round((course.completedLessons / course.totalLessons) * 100)
                : null;

            return (
              <Card
                key={course.id}
                className="group cursor-pointer flex flex-col overflow-hidden border hover:border-primary/50 hover:shadow-lg transition-all duration-200"
                onClick={() => navigate(`/courses/${course.id}`, { state: { course } })}
              >
                {/* Thumbnail or placeholder */}
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-primary/20 via-accent to-primary/5 flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-primary/60" />
                  </div>
                )}

                <CardHeader className="pb-2 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors">
                      {course.title}
                    </CardTitle>
                    {course.cohort_restriction && (
                      <Badge variant="secondary" className="shrink-0 text-[10px]">
                        {course.cohort_restriction}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2 text-sm mt-1">
                    {course.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  {progress !== null ? (
                    <>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                        <span>
                          {course.completedLessons} / {course.totalLessons} lessons
                        </span>
                        <span className="font-medium text-primary">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </>
                  ) : (
                    <div className="flex items-center text-xs text-primary font-medium gap-1 group-hover:gap-2 transition-all">
                      Start learning <ArrowRight className="w-3 h-3" />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
