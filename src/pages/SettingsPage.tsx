import { useState } from 'react';
import { Eye, EyeOff, KeyRound, Loader2, ShieldAlert, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
// import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { changePassword } from '@/lib/api/lms';

export default function SettingsPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formNotice, setFormNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  const firstName = user?.first_name?.trim() || user?.name?.split(' ')[0] || 'Learner';
  const initials = (user?.name || firstName)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  function togglePasswordVisibility(field: 'current' | 'next' | 'confirm') {
    setPasswordVisibility((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFormNotice(null);

    if (!user?.email) {
      setFormError('No account email is available for this session. Please sign in again.');
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setFormError('Fill in your current password, new password, and confirmation.');
      return;
    }

    if (newPassword.length < 8) {
      setFormError('Choose a new password with at least 8 characters.');
      return;
    }

    if (newPassword === currentPassword) {
      setFormError('Choose a new password that is different from your current password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('Your new password and confirmation do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const message = await changePassword({
        email: user.email,
        old_password: currentPassword,
        new_password: newPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setFormNotice(message);
    } catch (error) {
      setFormError((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(21rem,0.8fr)]">
        <section className="space-y-6">
          <Card className="overflow-hidden border-primary/15 bg-linear-to-br from-background via-background to-accent/50 shadow-sm">
            <CardContent className="grid gap-5 px-6 py-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-2xl font-semibold text-primary-foreground shadow-sm">
                {initials || 'QL'}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Settings</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight">Profile and account security</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Review the profile data currently available in quiplearn and manage your account security from one
                  place.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-primary" />
                Profile details
              </CardTitle>
              <CardDescription>
                These values come from the authenticated user record currently stored in the app.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border bg-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Full name</p>
                <p className="mt-2 text-sm font-medium text-foreground">{user?.name || 'Not available'}</p>
              </div>
              <div className="rounded-2xl border bg-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Email</p>
                <p className="mt-2 break-all text-sm font-medium text-foreground">{user?.email || 'Not available'}</p>
              </div>
              <div className="rounded-2xl border bg-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">First name</p>
                <p className="mt-2 text-sm font-medium text-foreground">{user?.first_name || 'Not available'}</p>
              </div>
              <div className="rounded-2xl border bg-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Last name</p>
                <p className="mt-2 text-sm font-medium text-foreground">{user?.last_name || 'Not available'}</p>
              </div>
              <div className="rounded-2xl border bg-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cohort</p>
                <p className="mt-2 text-sm font-medium text-foreground">{user?.cohort || 'Not assigned'}</p>
              </div>
              <div className="rounded-2xl border bg-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Status</p>
                <p className="mt-2 text-sm font-medium capitalize text-foreground">{user?.status || 'Active'}</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" />
                Change password
              </CardTitle>
              <CardDescription>
                Your signed-in email is used automatically when submitting a password change.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handlePasswordSubmit}>
                <div className="rounded-2xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  Password change request will be submitted for{' '}
                  <span className="font-medium text-foreground">{user?.email || 'your current account'}</span>.
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="current-password" className="text-sm font-medium">
                    Current password
                  </label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={passwordVisibility.current ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      disabled={submitting}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={passwordVisibility.current ? 'Hide current password' : 'Show current password'}
                    >
                      {passwordVisibility.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="new-password" className="text-sm font-medium">
                    New password
                  </label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={passwordVisibility.next ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      disabled={submitting}
                      aria-invalid={Boolean(formError && (newPassword.length > 0 || currentPassword.length > 0))}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('next')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={passwordVisibility.next ? 'Hide new password' : 'Show new password'}
                    >
                      {passwordVisibility.next ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use at least 8 characters and make it different from your current password.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirm-password" className="text-sm font-medium">
                    Confirm new password
                  </label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={passwordVisibility.confirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      disabled={submitting}
                      aria-invalid={passwordsMismatch}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={passwordVisibility.confirm ? 'Hide confirmed password' : 'Show confirmed password'}
                    >
                      {passwordVisibility.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordsMismatch && (
                    <p className="text-xs text-destructive">Confirmation must match the new password.</p>
                  )}
                </div>

                {formError && (
                  <div className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {formError}
                  </div>
                )}
                {formNotice && (
                  <div className="rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">
                    {formNotice}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating password…
                    </>
                  ) : (
                    'Update password'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" />
                Security notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Choose a unique password that you are not reusing on another work or personal account.</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Use at least 8 characters.</li>
                <li>Do not reuse your current password.</li>
                <li>Prefer a phrase or combination that is difficult to guess.</li>
              </ul>
              {/* <p>
                This request uses your active authenticated session, so the browser must still be signed in when you
                submit the form.
              </p> */}
              {/* <Separator /> */}
              {/* <p>This app currently receives profile data from the login response and does not yet expose a live password-update API.</p>
              <Separator />
              <div className="flex items-start gap-3 rounded-2xl border bg-muted/30 p-4">
                <Mail className="mt-0.5 h-4 w-4 text-primary" />
                <p>
                  If you need an immediate password reset flow, the next step is to wire this form to the backend
                  endpoint that owns authentication.
                </p>
              </div> */}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}