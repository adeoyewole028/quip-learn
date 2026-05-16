import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Clock3,
  Eye,
  Loader2,
  MessageSquareMore,
  PencilLine,
  Send,
  Share2,
  ShieldCheck,
  ThumbsUp,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommunityHelpButton } from '@/components/CommunityHelpButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  acceptCommunityAnswer,
  approveCommunityAnswer,
  approveCommunityQuestion,
  createCommunityAnswer,
  deleteCommunityAnswer,
  deleteCommunityQuestion,
  getCommunityQuestionById,
  updateCommunityAnswer,
  updateCommunityQuestion,
} from '@/lib/api/lms';
import { type CommunityAnswer, type CommunityThreadDetail } from '@/lib/community';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@/types/lms';

function isCommunityAdmin(user: User | null): boolean {
  if (!user) return false;

  const record = user as User & Record<string, unknown>;
  const permissionList = Array.isArray(record.permissions)
    ? record.permissions.filter((value): value is string => typeof value === 'string')
    : [];
  const adminSignals = [
    record.role,
    record.status,
    record.user_type,
    record.userType,
    record.account_type,
    record.accountType,
    ...permissionList,
  ];

  return adminSignals
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim().toLowerCase())
    .some((value) => ['admin', 'administrator', 'moderator', 'superadmin', 'super-admin'].includes(value));
}

export default function CommunityThreadPage() {
  const { questionId } = useParams<{ questionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [answerDraft, setAnswerDraft] = useState('');
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [answerNotice, setAnswerNotice] = useState<string | null>(null);
  const [answerSubmitting, setAnswerSubmitting] = useState(false);
  const [acceptingAnswerId, setAcceptingAnswerId] = useState<number | null>(null);
  const [editingQuestion, setEditingQuestion] = useState(false);
  const [questionEditDraft, setQuestionEditDraft] = useState({
    title: '',
    summary: '',
    details: '',
    tags: '',
  });
  const [editingAnswerId, setEditingAnswerId] = useState<number | null>(null);
  const [editedAnswerBody, setEditedAnswerBody] = useState('');
  const [moderationSubmittingKey, setModerationSubmittingKey] = useState<string | null>(null);
  const [fetchedThread, setFetchedThread] = useState<CommunityThreadDetail | null>(null);
  const [threadError, setThreadError] = useState<{ questionId: number; message: string } | null>(null);

  const locationState = location.state as { justCreated?: boolean } | null;
  const justCreated = Boolean(locationState?.justCreated);
  const currentUserId = user?.id ? String(user.id) : null;
  const parsedQuestionId = questionId ? Number(questionId) : null;
  const numericQuestionId = parsedQuestionId !== null && Number.isFinite(parsedQuestionId) ? parsedQuestionId : null;
  const thread = numericQuestionId !== null && fetchedThread?.id === numericQuestionId ? fetchedThread : null;
  const isAdmin = isCommunityAdmin(user);
  const activeThreadError =
    numericQuestionId === null
      ? 'This discussion link is invalid.'
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

  function beginQuestionEdit() {
    if (!thread) return;

    setQuestionEditDraft({
      title: thread.title,
      summary: thread.excerpt,
      details: thread.body.join('\n\n'),
      tags: thread.tags.join(', '),
    });
    setEditingQuestion(true);
    setAnswerError(null);
    setAnswerNotice(null);
  }

  function beginAnswerEdit(answer: CommunityAnswer) {
    setEditingAnswerId(answer.id);
    setEditedAnswerBody(answer.body.join('\n\n'));
    setAnswerError(null);
    setAnswerNotice(null);
  }

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
      .catch(() => {
        if (cancelled) return;
        setThreadError({
          questionId: numericQuestionId,
          message: "We couldn't open this discussion right now. Please try again.",
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
      setAnswerError('Please sign in again before posting an answer.');
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
    } catch {
      setAnswerError("We couldn't post your answer right now. Please try again.");
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
      await acceptCommunityAnswer(answerId);
      await refreshThread(numericQuestionId);
      setAnswerNotice('Answer accepted.');
    } catch {
      setAnswerError("We couldn't accept that answer right now. Please try again.");
    } finally {
      setAcceptingAnswerId(null);
    }
  }

  async function handleApproveQuestion() {
    if (numericQuestionId === null || !thread) {
      setAnswerError('This question could not be loaded.');
      return;
    }

    setAnswerError(null);
    setAnswerNotice(null);
    setModerationSubmittingKey('approve-question');

    try {
      await approveCommunityQuestion(numericQuestionId);
      await refreshThread(numericQuestionId);
      setAnswerNotice('Post approved.');
    } catch {
      setAnswerError("We couldn't approve this post right now. Please try again.");
    } finally {
      setModerationSubmittingKey(null);
    }
  }

  async function handleQuestionEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (numericQuestionId === null || !thread) {
      setAnswerError('This question could not be loaded.');
      return;
    }

    const normalizedTags = questionEditDraft.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (!questionEditDraft.title.trim()) {
      setAnswerError('Add a title before saving the post.');
      return;
    }

    if (!questionEditDraft.details.trim()) {
      setAnswerError('Add the main discussion content before saving the post.');
      return;
    }

    if (normalizedTags.length === 0) {
      setAnswerError('Add at least one tag before saving the post.');
      return;
    }

    setAnswerError(null);
    setAnswerNotice(null);
    setModerationSubmittingKey('save-question');

    try {
      await updateCommunityQuestion(numericQuestionId, {
        title: questionEditDraft.title.trim(),
        summary: questionEditDraft.summary.trim(),
        details: questionEditDraft.details.trim(),
        what_tried: '',
        tags: normalizedTags,
        audience: thread.role,
      });
      await refreshThread(numericQuestionId);
      setEditingQuestion(false);
      setAnswerNotice('Post updated.');
    } catch {
      setAnswerError("We couldn't save your changes right now. Please try again.");
    } finally {
      setModerationSubmittingKey(null);
    }
  }

  async function handleDeleteQuestion() {
    if (numericQuestionId === null || !thread) {
      setAnswerError('This question could not be loaded.');
      return;
    }

    if (!window.confirm('Delete this discussion post? This action cannot be undone.')) {
      return;
    }

    setAnswerError(null);
    setAnswerNotice(null);
    setModerationSubmittingKey('delete-question');

    try {
      await deleteCommunityQuestion(numericQuestionId);
      navigate('/community', {
        replace: true,
        state: {
          notice: 'Post deleted.',
        },
      });
    } catch {
      setAnswerError("We couldn't delete this post right now. Please try again.");
    } finally {
      setModerationSubmittingKey(null);
    }
  }

  async function handleApproveAnswer(answerId: number) {
    if (numericQuestionId === null || !thread) {
      setAnswerError('This question could not be loaded.');
      return;
    }

    setAnswerError(null);
    setAnswerNotice(null);
    setModerationSubmittingKey(`approve-answer-${answerId}`);

    try {
      await approveCommunityAnswer(answerId);
      await refreshThread(numericQuestionId);
      setAnswerNotice('Answer approved.');
    } catch {
      setAnswerError("We couldn't approve this answer right now. Please try again.");
    } finally {
      setModerationSubmittingKey(null);
    }
  }

  async function handleSaveAnswerEdit(answerId: number) {
    if (numericQuestionId === null || !thread) {
      setAnswerError('This question could not be loaded.');
      return;
    }

    if (!editedAnswerBody.trim()) {
      setAnswerError('Write the updated answer before saving it.');
      return;
    }

    setAnswerError(null);
    setAnswerNotice(null);
    setModerationSubmittingKey(`save-answer-${answerId}`);

    try {
      await updateCommunityAnswer(answerId, {
        body: editedAnswerBody.trim(),
      });
      await refreshThread(numericQuestionId);
      setEditingAnswerId(null);
      setEditedAnswerBody('');
      setAnswerNotice('Answer updated.');
    } catch {
      setAnswerError("We couldn't save this answer right now. Please try again.");
    } finally {
      setModerationSubmittingKey(null);
    }
  }

  async function handleDeleteAnswer(answerId: number) {
    if (numericQuestionId === null || !thread) {
      setAnswerError('This question could not be loaded.');
      return;
    }

    if (!window.confirm('Delete this answer? This action cannot be undone.')) {
      return;
    }

    setAnswerError(null);
    setAnswerNotice(null);
    setModerationSubmittingKey(`delete-answer-${answerId}`);

    try {
      await deleteCommunityAnswer(answerId);
      await refreshThread(numericQuestionId);
      if (editingAnswerId === answerId) {
        setEditingAnswerId(null);
        setEditedAnswerBody('');
      }
      setAnswerNotice('Answer deleted.');
    } catch {
      setAnswerError("We couldn't delete this answer right now. Please try again.");
    } finally {
      setModerationSubmittingKey(null);
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
              {activeThreadError || "This discussion isn't available right now."}
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
        <CommunityHelpButton />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <section className="space-y-6">
          {justCreated && (
            <Card className="border-primary/15 bg-linear-to-r from-primary/8 to-accent/50 shadow-sm">
              <CardContent className="px-6 py-5">
                <p className="text-sm font-medium text-foreground">Question posted successfully.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your question is live and you can follow the conversation here.
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
                    {isAdmin && (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                          thread.approved === true
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {thread.approved === true ? 'Approved' : 'Pending review'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isAdmin && thread.approved !== true && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        void handleApproveQuestion();
                      }}
                      disabled={moderationSubmittingKey === 'approve-question'}
                    >
                      {moderationSubmittingKey === 'approve-question' ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Approving…
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          Approve post
                        </>
                      )}
                    </Button>
                  )}
                  {isAdmin && (
                    <>
                      <Button variant="outline" size="sm" onClick={beginQuestionEdit}>
                        <PencilLine className="h-4 w-4" />
                        Edit post
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          void handleDeleteQuestion();
                        }}
                        disabled={moderationSubmittingKey === 'delete-question'}
                      >
                        {moderationSubmittingKey === 'delete-question' ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Deleting…
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4" />
                            Delete post
                          </>
                        )}
                      </Button>
                    </>
                  )}
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

          {isAdmin && editingQuestion && (
            <Card className="border-primary/15 shadow-sm">
              <CardHeader>
                <CardTitle>Edit discussion post</CardTitle>
                <CardDescription>
                  Update the discussion post and save your changes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleQuestionEditSubmit}>
                  <div className="space-y-1.5">
                    <label htmlFor="thread-title" className="text-sm font-medium text-foreground">
                      Title
                    </label>
                    <Input
                      id="thread-title"
                      value={questionEditDraft.title}
                      onChange={(event) => setQuestionEditDraft((prev) => ({ ...prev, title: event.target.value }))}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="thread-summary" className="text-sm font-medium text-foreground">
                      Short summary
                    </label>
                    <Input
                      id="thread-summary"
                      value={questionEditDraft.summary}
                      onChange={(event) => setQuestionEditDraft((prev) => ({ ...prev, summary: event.target.value }))}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="thread-details" className="text-sm font-medium text-foreground">
                      Discussion body
                    </label>
                    <textarea
                      id="thread-details"
                      value={questionEditDraft.details}
                      onChange={(event) => setQuestionEditDraft((prev) => ({ ...prev, details: event.target.value }))}
                      className="min-h-40 w-full rounded-xl border bg-background px-3 py-3 text-sm leading-6 outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="thread-tags" className="text-sm font-medium text-foreground">
                      Tags
                    </label>
                    <Input
                      id="thread-tags"
                      value={questionEditDraft.tags}
                      onChange={(event) => setQuestionEditDraft((prev) => ({ ...prev, tags: event.target.value }))}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit" disabled={moderationSubmittingKey === 'save-question'}>
                      {moderationSubmittingKey === 'save-question' ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving changes…
                        </>
                      ) : (
                        <>
                          <PencilLine className="h-4 w-4" />
                          Save changes
                        </>
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setEditingQuestion(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

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
                        {editingAnswerId === answer.id ? (
                          <div className="space-y-3">
                            <label
                              htmlFor={`answer-edit-${answer.id}`}
                              className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                            >
                              Edit answer
                            </label>
                            <textarea
                              id={`answer-edit-${answer.id}`}
                              value={editedAnswerBody}
                              onChange={(event) => setEditedAnswerBody(event.target.value)}
                              className="min-h-36 w-full rounded-xl border bg-background px-3 py-3 text-sm leading-6 outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/20"
                            />
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                  void handleSaveAnswerEdit(answer.id);
                                }}
                                disabled={moderationSubmittingKey === `save-answer-${answer.id}`}
                              >
                                {moderationSubmittingKey === `save-answer-${answer.id}` ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving…
                                  </>
                                ) : (
                                  <>
                                    <PencilLine className="h-4 w-4" />
                                    Save answer
                                  </>
                                )}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingAnswerId(null);
                                  setEditedAnswerBody('');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4 text-sm leading-7 text-foreground">
                            {answer.body.map((paragraph) => (
                              <p key={paragraph}>{paragraph}</p>
                            ))}
                          </div>
                        )}

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
                            {isAdmin && answer.approved !== true && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  void handleApproveAnswer(answer.id);
                                }}
                                disabled={moderationSubmittingKey === `approve-answer-${answer.id}`}
                                className="h-8 rounded-full border-primary/20 bg-background px-3 text-xs font-semibold text-primary hover:bg-primary/5 hover:text-primary"
                              >
                                {moderationSubmittingKey === `approve-answer-${answer.id}` ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Approving…
                                  </>
                                ) : (
                                  <>
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    Approve
                                  </>
                                )}
                              </Button>
                            )}
                            {isAdmin && (
                              <>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => beginAnswerEdit(answer)}
                                  className="h-8 rounded-full px-3 text-xs"
                                >
                                  <PencilLine className="h-3.5 w-3.5" />
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    void handleDeleteAnswer(answer.id);
                                  }}
                                  disabled={moderationSubmittingKey === `delete-answer-${answer.id}`}
                                  className="h-8 rounded-full px-3 text-xs"
                                >
                                  {moderationSubmittingKey === `delete-answer-${answer.id}` ? (
                                    <>
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      Deleting…
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 className="h-3.5 w-3.5" />
                                      Delete
                                    </>
                                  )}
                                </Button>
                              </>
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
                    Be the first to reply and help move the conversation forward.
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