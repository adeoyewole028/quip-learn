import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CircleHelp, FileText, Send, Sparkles, Tag } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { hotTags, type CommunityQuestionDraft } from '@/lib/community';

const audienceOptions = ['All healthcare teams', 'Operations', 'Clinical teams', 'Biomedical teams'];

export default function AskQuestionPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('How should we structure cold-chain incident handoffs across shift changes?');
  const [summary, setSummary] = useState(
    'We want one operational log that QA can review without forcing dispatchers to rewrite the same incident details.',
  );
  const [details, setDetails] = useState(
    'Today the dispatcher records the exception, then a supervisor creates a second QA report with nearly the same narrative. I want a cleaner handoff model that still preserves timestamps, ownership, and escalation steps.',
  );
  const [whatTried, setWhatTried] = useState(
    'We tested a shared spreadsheet and a WhatsApp escalation template. The spreadsheet improved tracking, but people still copied the same story into multiple places.',
  );
  const [tagsInput, setTagsInput] = useState('operations, cold-chain, compliance');
  const [audience, setAudience] = useState(audienceOptions[1]);
  const [error, setError] = useState<string | null>(null);

  const draftTags = tagsInput
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  function handlePreviewSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Add a clear title so other teams know what you need help with.');
      return;
    }

    if (!details.trim()) {
      setError('Describe the situation before previewing the question.');
      return;
    }

    if (draftTags.length === 0) {
      setError('Add at least one tag so the question can be routed correctly.');
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

    navigate('/community/thread/preview', {
      state: { draft },
    });
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
                  This prototype shows the question fields, submission flow, and resulting thread layout so the
                  backend team can see exactly what the discussion API needs to support.
                </p>
              </div>

              <div className="rounded-2xl border bg-background/80 px-4 py-3 text-sm shadow-sm">
                <p className="font-medium text-foreground">Prototype flow</p>
                <p className="mt-1 text-muted-foreground">Submit opens a thread preview instead of calling an API.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Question details</CardTitle>
              <CardDescription>
                Use the form exactly the way a production posting endpoint would expect it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handlePreviewSubmit}>
                <div className="space-y-1.5">
                  <label htmlFor="question-title" className="text-sm font-medium">
                    Title
                  </label>
                  <Input
                    id="question-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Describe the problem in one sentence"
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="question-summary" className="text-sm font-medium">
                    Short summary
                  </label>
                  <Input
                    id="question-summary"
                    value={summary}
                    onChange={(event) => setSummary(event.target.value)}
                    placeholder="A short excerpt shown in the community feed"
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="question-details" className="text-sm font-medium">
                      Describe the situation
                    </label>
                    <textarea
                      id="question-details"
                      value={details}
                      onChange={(event) => setDetails(event.target.value)}
                      className="min-h-40 w-full rounded-xl border bg-background px-3 py-3 text-sm leading-6 outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/20"
                      placeholder="What happened? What makes this difficult?"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="question-tried" className="text-sm font-medium">
                      What have you tried?
                    </label>
                    <textarea
                      id="question-tried"
                      value={whatTried}
                      onChange={(event) => setWhatTried(event.target.value)}
                      className="min-h-40 w-full rounded-xl border bg-background px-3 py-3 text-sm leading-6 outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/20"
                      placeholder="List the steps, tools, or workarounds you already tested"
                    />
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_15rem]">
                  <div className="space-y-1.5">
                    <label htmlFor="question-tags" className="text-sm font-medium">
                      Tags
                    </label>
                    <Input
                      id="question-tags"
                      value={tagsInput}
                      onChange={(event) => setTagsInput(event.target.value)}
                      placeholder="operations, logistics, compliance"
                      className="h-11 rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground">
                      Separate tags with commas to show which topics this question belongs to.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="question-audience" className="text-sm font-medium">
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
                  <Button type="submit" size="lg">
                    <Send className="h-4 w-4" />
                    Preview thread
                  </Button>
                  <Link to="/community" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
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
                <Sparkles className="h-4 w-4 text-primary" />
                Live preview
              </CardTitle>
              <CardDescription>What the draft will look like in the thread view.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Title</p>
                <p className="mt-2 text-base font-semibold text-foreground">{title || 'Untitled question'}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Summary</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {summary || 'Add a short summary so the community feed has a useful excerpt.'}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tags</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {draftTags.length > 0 ? (
                    draftTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground"
                      >
                        <Tag className="h-3.5 w-3.5" />
                        {tag}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Add one or more tags.</p>
                  )}
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Audience</p>
                <p className="mt-2 text-sm text-foreground">{audience}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Backend handoff
              </CardTitle>
              <CardDescription>Useful endpoints and payload fields to support this UI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">Likely endpoints</p>
                <p className="mt-2">POST /community/questions</p>
                <p>GET /community/questions</p>
                <p>GET /community/questions/:id</p>
                <p>POST /community/questions/:id/answers</p>
              </div>
              <Separator />
              <div>
                <p className="font-medium text-foreground">Question payload</p>
                <p className="mt-2">title</p>
                <p>summary</p>
                <p>details</p>
                <p>what_tried</p>
                <p>tags[]</p>
                <p>audience</p>
              </div>
              <Separator />
              <div>
                <p className="font-medium text-foreground">Suggested starter tags</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {hotTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (draftTags.includes(tag)) return;
                        setTagsInput((prev) => (prev.trim() ? `${prev}, ${tag}` : tag));
                      }}
                      className="rounded-full border px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}