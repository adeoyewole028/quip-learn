import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CircleHelp, Loader2, Send, Tag } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CommunityHelpButton } from "@/components/CommunityHelpButton";
import { hotTags, type CommunityQuestionDraft } from "@/lib/community";
import { createCommunityQuestion } from "@/lib/api/lms";
import { useAuth } from "@/hooks/useAuth";

const audienceOptions = [
  "All healthcare teams",
  "Operations",
  "Clinical teams",
  "Biomedical teams",
];

export default function AskQuestionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");
  const [whatTried, setWhatTried] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [audience, setAudience] = useState(audienceOptions[1]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const draftTags = tagsInput
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  async function handleQuestionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!user?.id) {
      setError(
        "Please sign in again before posting a question.",
      );
      return;
    }

    if (!title.trim()) {
      setError(
        "Add a clear title so other teams know what you need help with.",
      );
      return;
    }

    if (!details.trim()) {
      setError("Describe the situation before posting the question.");
      return;
    }

    if (draftTags.length === 0) {
      setError("Add at least one tag so the question can be routed correctly.");
      return;
    }

    const draft: CommunityQuestionDraft = {
      title: title.trim(),
      summary: summary.trim(),
      details: details.trim(),
      whatTried: whatTried.trim(),
      tags: draftTags,
      audience,
    };

    setSubmitting(true);
    try {
      const createdQuestion = await createCommunityQuestion({
        author_id: Number(user.id) || user.id,
        title: draft.title,
        summary: draft.summary,
        details: draft.details,
        what_tried: draft.whatTried,
        tags: draft.tags,
        audience: draft.audience,
      });

      navigate(`/community/thread/${createdQuestion.id}`, {
        state: {
          justCreated: true,
        },
      });
    } catch {
      setError("We couldn't share your question right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
        <span className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Ask question
        </span>
        <CommunityHelpButton />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="space-y-6">
          <Card className="overflow-hidden border-primary/15 bg-linear-to-br from-background via-background to-accent/60 shadow-sm">
            <CardContent className="grid gap-4 px-6 py-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary ring-1 ring-primary/10">
                  <CircleHelp className="h-3.5 w-3.5" />
                  New discussion
                </span>
                <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                  Ask a practical question your peers can answer.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Share your question with the community and continue the
                  conversation in its own thread.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Question details</CardTitle>
              <CardDescription>
                Add enough detail so other teams can understand the situation
                and respond clearly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleQuestionSubmit}>
                <div className="space-y-1.5">
                  <label
                    htmlFor="question-title"
                    className="text-sm font-medium"
                  >
                    Title
                  </label>
                  <Input
                    id="question-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="question-summary"
                    className="text-sm font-medium"
                  >
                    Short summary
                  </label>
                  <Input
                    id="question-summary"
                    value={summary}
                    onChange={(event) => setSummary(event.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="question-details"
                      className="text-sm font-medium"
                    >
                      Describe the situation
                    </label>
                    <textarea
                      id="question-details"
                      value={details}
                      onChange={(event) => setDetails(event.target.value)}
                      className="min-h-40 w-full rounded-xl border bg-background px-3 py-3 text-sm leading-6 outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="question-tried"
                      className="text-sm font-medium"
                    >
                      What have you tried?
                    </label>
                    <textarea
                      id="question-tried"
                      value={whatTried}
                      onChange={(event) => setWhatTried(event.target.value)}
                      className="min-h-40 w-full rounded-xl border bg-background px-3 py-3 text-sm leading-6 outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/20"
                    />
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_15rem]">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="question-tags"
                      className="text-sm font-medium"
                    >
                      Tags
                    </label>
                    <Input
                      id="question-tags"
                      value={tagsInput}
                      onChange={(event) => setTagsInput(event.target.value)}
                      className="h-11 rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground">
                      Separate tags with commas to show which topics this
                      question belongs to.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="question-audience"
                      className="text-sm font-medium"
                    >
                      Audience
                    </label>
                    <select
                      id="question-audience"
                      value={audience}
                      onChange={(event) => setAudience(event.target.value)}
                      className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/20"
                    >
                      {audienceOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" size="lg" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Posting question…
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Post question
                      </>
                    )}
                  </Button>
                  <Link
                    to="/community"
                    className={buttonVariants({
                      size: "lg",
                      variant: "outline",
                    })}
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                Suggested tags
              </CardTitle>
              <CardDescription>
                Quick ways to classify the question for the right audience.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {hotTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    if (draftTags.includes(tag)) return;
                    setTagsInput((prev) =>
                      prev.trim() ? `${prev}, ${tag}` : tag,
                    );
                  }}
                  className="rounded-full border px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {tag}
                </button>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
