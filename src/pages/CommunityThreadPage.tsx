import { useState, type FormEvent } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Clock3,
  Eye,
  MessageSquareMore,
  Send,
  Share2,
  ThumbsUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  communityQuestions,
  getCommunityThreadById,
  getRelatedCommunityQuestions,
  type CommunityQuestionDraft,
  type CommunityThreadDetail,
} from '@/lib/community';
import { useAuth } from '@/hooks/useAuth';

function buildPreviewThread(draft: CommunityQuestionDraft, authorName: string): CommunityThreadDetail {
  const summaryText = draft.summary.trim();
  const detailsText = draft.details.trim();
  const whatTriedText = draft.whatTried.trim();

  return {
    id: 0,
    title: draft.title || 'Untitled question',
    excerpt: summaryText || detailsText.slice(0, 180),
    body: [detailsText, whatTriedText && `What I have tried: ${whatTriedText}`].filter(Boolean),
    tags: draft.tags,
    author: authorName,
    role: draft.audience,
    asked: 'Just now',
    updated: 'Preview mode',
    votes: 0,
    answerCount: 0,
    views: 1,
    answers: [],
    relatedQuestionIds: [],
  };
}

export default function CommunityThreadPage() {
  const { questionId } = useParams<{ questionId: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const [answerDraft, setAnswerDraft] = useState('');
  const [answerNotice, setAnswerNotice] = useState<string | null>(null);

  const draft = (location.state as { draft?: CommunityQuestionDraft } | null)?.draft;
  const previewMode = questionId === 'preview' && Boolean(draft);
  const authorName = user?.name || user?.first_name || 'You';

  const thread = previewMode
    ? buildPreviewThread(draft!, authorName)
    : questionId
      ? getCommunityThreadById(Number(questionId))
      : undefined;

  const relatedQuestions = previewMode
    ? communityQuestions.slice(0, 3)
    : thread
      ? getRelatedCommunityQuestions(thread.relatedQuestionIds)
      : [];

  function handleAnswerPreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!answerDraft.trim()) {
      setAnswerNotice('Write an answer first so the backend team can see the full composer state.');
      return;
    }

    setAnswerNotice(
      'Prototype only: this composer is ready for a POST /community/questions/:id/answers endpoint.',
    );
  }

  if (!thread) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 lg:px-8">
        <Card className="shadow-sm">
          <CardContent className="space-y-4 px-6 py-10">
            <p className="text-lg font-semibold text-foreground">Thread not found</p>
            <p className="text-sm text-muted-foreground">
              The requested question does not exist in the prototype data set.
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
        {previewMode && (
          <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Preview thread
          </span>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <section className="space-y-6">
          {previewMode && (
            <Card className="border-primary/15 bg-linear-to-r from-primary/8 to-accent/50 shadow-sm">
              <CardContent className="px-6 py-5">
                <p className="text-sm font-medium text-foreground">
                  This thread is rendered from the Ask Question form and can be used for backend screenshots.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  A real implementation would persist the question first, then return the created thread with its ID.
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
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Answers</p>
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
                          <span className="inline-flex items-center gap-1.5">
                            <ThumbsUp className="h-3.5 w-3.5" />
                            {answer.votes} people found this helpful
                          </span>
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
                This composer shows the layout for posting a reply inside an existing thread.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleAnswerPreview}>
                <textarea
                  value={answerDraft}
                  onChange={(event) => setAnswerDraft(event.target.value)}
                  className="min-h-40 w-full rounded-xl border bg-background px-3 py-3 text-sm leading-6 outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/20"
                  placeholder="Explain your answer, reference your experience, and include any caveats."
                />
                {answerNotice && <p className="text-sm text-primary">{answerNotice}</p>}
                <Button type="submit">
                  <Send className="h-4 w-4" />
                  Preview answer action
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
              <div className="flex items-center justify-between gap-3">
                <span>Preview mode</span>
                <span className="font-medium text-foreground">{previewMode ? 'On' : 'Off'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Related discussions</CardTitle>
              <CardDescription>How linked threads could surface in the right rail.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {relatedQuestions.map((question) => (
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
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Backend support</CardTitle>
              <CardDescription>Useful payloads for the thread and answer views.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>GET /community/questions/:id should return the question, answers, counts, and related threads.</p>
              <p>POST /community/questions/:id/answers should accept the answer body and return the created answer.</p>
              <p>The response should also include accepted-answer state and author metadata for every post.</p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}