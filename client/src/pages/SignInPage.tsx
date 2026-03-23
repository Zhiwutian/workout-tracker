import { Button, Input } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import { useToast } from '@/components/app/toast-context';
import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

/**
 * Demo auth: unique display name per account. Replace with OIDC when wired.
 */
export function SignInPage() {
  const { signIn, signUp, continueAsGuest } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);

  async function runGuest(): Promise<void> {
    setBusy(true);
    try {
      await continueAsGuest();
      showToast({ title: 'Continuing as guest', variant: 'success' });
      navigate('/', { replace: true });
    } catch (err) {
      showToast({
        title: 'Could not start guest session',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      });
    } finally {
      setBusy(false);
    }
  }

  async function runAuth(mode: 'sign-in' | 'sign-up'): Promise<void> {
    const name = displayName.trim();
    if (!name) {
      showToast({
        title: 'Display name required',
        variant: 'error',
      });
      return;
    }
    setBusy(true);
    try {
      if (mode === 'sign-up') await signUp(name);
      else await signIn(name);
      showToast({ title: 'Welcome', variant: 'success' });
      navigate('/', { replace: true });
    } catch (err) {
      showToast({
        title: mode === 'sign-up' ? 'Sign up failed' : 'Sign in failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900">Workout Tracker</h1>
      <p className="mt-2 text-sm text-slate-600">
        Demo accounts use a unique display name. This flow will be replaced by
        OAuth (OIDC).
      </p>
      <form
        className="mt-6 space-y-4"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void runAuth('sign-in');
        }}>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Display name
          </label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="username"
            placeholder="e.g. Alex"
            aria-label="Display name"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy}>
            Sign in
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => void runAuth('sign-up')}>
            Create account
          </Button>
        </div>
      </form>
      <div className="mt-6 border-t border-slate-200 pt-6">
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-center border border-slate-200 bg-slate-50"
          disabled={busy}
          onClick={() => void runGuest()}>
          Continue as guest
        </Button>
        <p className="mt-2 text-center text-xs text-slate-500">
          Guest data is stored on the server for this browser until you sign out
          or clear the site. Create an account to use a name you can sign in
          with again.
        </p>
      </div>
      <p className="mt-4 text-center text-sm text-slate-500">
        <Link className="text-indigo-600 underline" to="/about">
          About
        </Link>
      </p>
    </section>
  );
}
