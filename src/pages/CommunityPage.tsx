import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowUpRight,
  CheckCircle2,
  Flame,
  MessageSquare,
  Search,
  ShieldCheck,
  Tag,
  Users,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CommunityHelpButton } from '@/components/CommunityHelpButton';
import { hotTags, type CommunityQuestionSummary } from '@/lib/community';
import { getCommunityQuestions } from '@/lib/api/lms';

type CommunityFilter = 'Newest' | 'Unanswered' | 'Trending';

export default function CommunityPage() {
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<CommunityFilter>('Newest');
  const [questions, setQuestions] = useState<CommunityQuestionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [communityError, setCommunityError] = useState<string | null>(null);
  const locationState = location.state as { notice?: string } | null;
  const moderationNotice = locationState?.notice ?? null;

  useEffect(() => {
    let cancelled = false;

    getCommunityQuestions()
      .then((liveQuestions) => {
        if (cancelled) return;
        setCommunityError(null);
        setQuestions(liveQuestions);
      })
      .catch(() => {
        if (cancelled) return;
        setCommunityError("We couldn't load the community right now. Please try again.");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredQuestions = questions.filter((question) => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery =
      normalizedQuery.length === 0 ||
      question.title.toLowerCase().includes(normalizedQuery) ||
      question.excerpt.toLowerCase().includes(normalizedQuery) ||
      question.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));

    if (!matchesQuery) return false;
    if (activeFilter === 'Unanswered') return question.answers === 0;
    if (activeFilter === 'Trending') return question.trending;
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="space-y-6">
          {moderationNotice && (
            <Card className="border-primary/15 bg-primary/5 shadow-sm">
              <CardContent className="px-6 py-4 text-sm text-foreground">
                {moderationNotice}
              </CardContent>
            </Card>
          )}

          {communityError && (
            <Card className="border-destructive/20 bg-destructive/5 shadow-sm">
              <CardContent className="px-6 py-4 text-sm text-destructive">
                {communityError}
              </CardContent>
            </Card>
          )}

          <Card className="overflow-hidden border-primary/15 bg-linear-to-br from-primary/8 via-background to-accent/70 shadow-sm">
            <CardContent className="grid gap-5 px-6 py-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary shadow-sm ring-1 ring-primary/10">
                  <Users className="h-3.5 w-3.5" />
                  Community
                </span>
                <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                  Questions, answers, and field-tested advice.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  A learning community inspired by Stack Overflow: browse practical questions, compare answers,
                  and surface the best ideas from healthcare teams across LifeBank.
                </p>
              </div>

              <div className="flex flex-col gap-2 md:items-end">
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <Link to="/community/ask" className={buttonVariants({ size: 'lg' })}>
                    Ask a question
                  </Link>
                  <CommunityHelpButton size="lg" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="space-y-4 px-6 py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="w-full max-w-xl">
                  <label htmlFor="community-search" className="text-sm font-medium text-foreground">
                    Search
                  </label>
                  <div className="relative mt-1.5">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="community-search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      className="h-11 rounded-xl pl-9"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(['Newest', 'Unanswered', 'Trending'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActiveFilter(filter)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                        activeFilter === filter
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{loading ? 'Loading community…' : `${filteredQuestions.length} questions`}</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span>Sorted like a Q&A board</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span>Best for peer-to-peer learning</span>
              </div>
            </CardContent>
          </Card>

          <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
            {filteredQuestions.map((question, index) => (
              <article
                key={question.id}
                className={`grid gap-5 px-6 py-6 md:grid-cols-[7rem_minmax(0,1fr)] ${
                  index === 0 ? '' : 'border-t'
                }`}
              >
                <div className="grid grid-cols-3 gap-3 text-center md:grid-cols-1 md:gap-2 md:text-right">
                  <div>
                    <div className="text-xl font-semibold text-foreground">{question.votes}</div>
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Votes</div>
                  </div>
                  <div
                    className={`rounded-2xl border px-2 py-2 ${
                      question.hasAcceptedAnswer
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : 'border-border bg-muted/40 text-foreground'
                    }`}
                  >
                    <div className="text-xl font-semibold">{question.answers}</div>
                    <div className="text-xs uppercase tracking-[0.18em]">Answers</div>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-foreground">{question.views}</div>
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Views</div>
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold leading-snug tracking-tight text-foreground">
                        <Link
                          to={`/community/thread/${question.id}`}
                          className="transition-colors hover:text-primary"
                        >
                          {question.title}
                        </Link>
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{question.excerpt}</p>
                    </div>

                    {question.hasAcceptedAnswer && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Accepted answer
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {question.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                        {question.author.slice(0, 1)}
                      </span>
                      <span>
                        <span className="font-medium text-foreground">{question.author}</span>
                        {' '}· {question.role}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span>Asked {question.asked}</span>
                      <Link
                        to={`/community/thread/${question.id}`}
                        className="inline-flex items-center gap-1 text-primary transition-colors hover:text-primary/80"
                      >
                        Open thread
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {filteredQuestions.length === 0 && (
              <div className="px-6 py-14 text-center">
                <p className="text-base font-medium text-foreground">No community posts match this filter.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try a different keyword or switch back to the full feed.
                </p>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-primary" />
                Hot tags
              </CardTitle>
              <CardDescription>Topics getting the most traction this week.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {hotTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full border bg-background px-3 py-1 text-xs font-medium text-foreground"
                >
                  <Tag className="h-3.5 w-3.5 text-primary" />
                  {tag}
                </span>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Community norms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Ask practical questions with enough context for someone else to reproduce the issue.</p>
              <p>Share what you already tried before asking for help.</p>
              <p>Mark clear answers so the next learner finds the solution faster.</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Why this page exists
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Courses help people learn the curriculum. Community helps them compare how the work happens in
                real facilities.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}