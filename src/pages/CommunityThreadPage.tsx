import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Clock3,
  Eye,
  Loader2,
  MessageSquareMore,
  Send,
  Share2,
  ThumbsUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { acceptCommunityAnswer, createCommunityAnswer, getCommunityQuestionById } from '@/lib/api/lms';
import { type CommunityThreadDetail } from '@/lib/community';
import { useAuth } from '@/hooks/useAuth';

export default function CommunityThreadPage() {
  const { questionId } = useParams<{ questionId: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const [answerDraft, setAnswerDraft] = useState('');
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [answerNotice, setAnswerNotice] = useState<string | null>(null);
  const [answerSubmitting, setAnswerSubmitting] = useState(false);
  const [acceptingAnswerId, setAcceptingAnswerId] = useState<number | null>(null);
  const [fetchedThread, setFetchedThread] = useState<CommunityThreadDetail | null>(null);
  const [threadError, setThreadError] = useState<{ questionId: number; message: string } | null>(null);

  const locationState = location.state as { justCreated?: boolean } | null;
  const justCreated = Boolean(locationState?.justCreated);
  const currentUserId = user?.id ? String(user.id) : null;
  const parsedQuestionId = questionId ? Number(questionId) : null;
  const numericQuestionId = parsedQuestionId !== null && Number.isFinite(parsedQuestionId) ? parsedQuestionId : null;
  const thread = numericQuestionId !== null && fetchedThread?.id === numericQuestionId ? fetchedThread : null;
  const activeThreadError =
    numericQuestionId === null
      ? 'Invalid question id.'
      : threadError?.questionId === numericQuestionId
        ? threadError.message
        : null;
  const showLoadingThread = numericQuestionId !== null && !thread && !activeThreadError;
  const canAcceptAnswers = Boolean(
    currentUserId &&
    thread?.authorId != null &&
    String(thread.authorId) === currentUserId &&
    !thread.hasAcceptedAnswer,
  );

  const relatedQuestions = thread?.relatedQuestions ?? [];

  async function refreshThread(questionIdToRefresh: number): Promise<void> {
    const liveQuestion = await getCommunityQuestionById(questionIdToRefresh);
    setFetchedThread(liveQuestion);
    setThreadError(null);
  }

  useEffect(() => {
    if (numericQuestionId === null) return;

    let cancelled = false;

    getCommunityQuestionById(numericQuestionId)
      .then((liveQuestion) => {
        if (cancelled) return;
        setFetchedThread(liveQuestion);
        setThreadError(null);
      })
      .catch((error) => {
        if (cancelled) return;
        setThreadError({
          questionId: numericQuestionId,
          message: (error as Error).message,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [numericQuestionId]);

  async function handleAnswerSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAnswerError(null);
    setAnswerNotice(null);

    if (!answerDraft.trim()) {
      setAnswerError('Write an answer before submitting.');
      return;
    }

    if (numericQuestionId === null || !thread) {
      setAnswerError('This question could not be loaded.');
      return;
    }

    if (!user?.id) {
      setAnswerError('Your account id is missing. Please sign in again before posting an answer.');
      return;
    }

    setAnswerSubmitting(true);
    try {
      await createCommunityAnswer(
        numericQuestionId,
        {
          author_id: Number(user.id) || user.id,
          body: answerDraft.trim(),
        },
      );

      setAnswerDraft('');
      await refreshThread(numericQuestionId);
      setAnswerNotice('Answer posted successfully.');
    } catch (error) {
      setAnswerError((error as Error).message);
    } finally {
      setAnswerSubmitting(false);
    }
  }

  async function handleAcceptAnswer(answerId: number) {
    if (numericQuestionId === null || !thread) {
      setAnswerError('This question could not be loaded.');
      return;
    }

    setAnswerError(null);
    setAnswerNotice(null);
    setAcceptingAnswerId(answerId);

    try {
      const message = await acceptCommunityAnswer(answerId);
      await refreshThread(numericQuestionId);
      setAnswerNotice(message);
    } catch (error) {
      setAnswerError((error as Error).message);
    } finally {
      setAcceptingAnswerId(null);
    }
  }

  if (showLoadingThread) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-center gap-3 px-6 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading question details…
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 lg:px-8">
        <Card className="shadow-sm">
          <CardContent className="space-y-4 px-6 py-10">
            <p className="text-lg font-semibold text-foreground">Thread not found</p>
            <p className="text-sm text-muted-foreground">
              {activeThreadError || 'The requested question could not be loaded.'}
            </p>
            <div className="flex justify-center">
              <Link to="/community">
                <Button>Back to community</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          to="/community"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to community
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <section className="space-y-6">
          {justCreated && (
            <Card className="border-primary/15 bg-linear-to-r from-primary/8 to-accent/50 shadow-sm">
              <CardContent className="px-6 py-5">
                <p className="text-sm font-medium text-foreground">Question posted successfully.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  The question has been created and this page will keep itself in sync with the live detail endpoint.
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm">
            <CardContent className="space-y-6 px-6 py-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">{thread.title}</h1>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-4 w-4" />
                      Asked {thread.asked}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MessageSquareMore className="h-4 w-4" />
                      {thread.answerCount} answers
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Eye className="h-4 w-4" />
                      {thread.views} views
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Bookmark className="h-4 w-4" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-[4.5rem_minmax(0,1fr)]">
                <div className="flex flex-row gap-3 md:flex-col md:items-center md:gap-2">
                  <div className="rounded-2xl border bg-muted/40 px-3 py-2 text-center md:w-full">
                    <p className="text-xl font-semibold text-foreground">{thread.votes}</p>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Votes</p>
                  </div>
                  <div className="rounded-2xl border bg-muted/40 px-3 py-2 text-center md:w-full">
                    <p className="text-xl font-semibold text-foreground">{thread.answerCount}</p>
                    <p className="text-[8px] uppercase tracking-[0.18em] text-muted-foreground">Answers</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-2xl border bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
                    {thread.excerpt}
                  </div>

                  <div className="space-y-4 text-sm leading-7 text-foreground">
                    {thread.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {thread.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="rounded-2xl border bg-background px-4 py-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Asked by
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                        {thread.author.slice(0, 1)}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{thread.author}</p>
                        <p className="text-xs text-muted-foreground">{thread.role}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">Updated {thread.updated}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>{thread.answerCount} answers</CardTitle>
              <CardDescription>
                Accepted or highly voted responses appear first in the conversation flow.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {thread.answers.length > 0 ? (
                thread.answers.map((answer) => (
                  <article key={answer.id} className="rounded-2xl border bg-background p-5 shadow-sm">
                    <div className="grid gap-5 md:grid-cols-[4.5rem_minmax(0,1fr)]">
                      <div className="flex flex-row gap-3 md:flex-col md:items-center md:gap-2">
                        <div className="rounded-2xl border bg-muted/40 px-3 py-2 text-center md:w-full">
                          <p className="text-xl font-semibold text-foreground">{answer.votes}</p>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Votes</p>
                        </div>
                        {answer.accepted && (
                          <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Accepted
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="space-y-4 text-sm leading-7 text-foreground">
                          {answer.body.map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                          ))}
                        </div>

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center gap-1.5">
                              <ThumbsUp className="h-3.5 w-3.5" />
                              {answer.votes} people found this helpful
                            </span>
                            {canAcceptAnswers && !answer.accepted && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleAcceptAnswer(answer.id)}
                                disabled={acceptingAnswerId === answer.id}
                                className="h-8 cursor-pointer rounded-full border-primary/20 bg-background px-3 text-xs font-semibold text-primary hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {acceptingAnswerId === answer.id ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Accepting…
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Accept answer
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                          <span>
                            <span className="font-medium text-foreground">{answer.author}</span>
                            {' '}· {answer.role} · answered {answer.posted}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed px-6 py-10 text-center">
                  <p className="text-base font-medium text-foreground">No answers yet</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This is the empty-state view the backend can expect before the first reply arrives.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Your answer</CardTitle>
              <CardDescription>
                Post a reply directly into this discussion thread.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleAnswerSubmit}>
                <textarea
                  value={answerDraft}
                  onChange={(event) => setAnswerDraft(event.target.value)}
                  className="min-h-40 w-full rounded-xl border bg-background px-3 py-3 text-sm leading-6 outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/20"
                  placeholder="Explain your answer, reference your experience, and include any caveats."
                  disabled={answerSubmitting}
                />
                {answerError && <p className="text-sm text-destructive">{answerError}</p>}
                {answerNotice && <p className="text-sm text-primary">{answerNotice}</p>}
                <Button type="submit" disabled={answerSubmitting}>
                  {answerSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Posting answer…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Post answer
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Thread summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-center justify-between gap-3">
                <span>Audience</span>
                <span className="font-medium text-foreground">{thread.role}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Accepted answer</span>
                <span className="font-medium text-foreground">{thread.hasAcceptedAnswer ? 'Yes' : 'Not yet'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Related discussions</CardTitle>
              <CardDescription>Linked threads from the same topic.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {relatedQuestions.length > 0 ? (
                relatedQuestions.map((question) => (
                  <Link
                    key={question.id}
                    to={`/community/thread/${question.id}`}
                    className="block rounded-2xl border p-4 transition-colors hover:bg-muted/40"
                  >
                    <p className="text-sm font-medium leading-6 text-foreground">{question.title}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {question.answers} answers · {question.views} views
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No related discussions yet.</p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}