import { Button, Input } from '@/components/ui';
import { useToast } from '@/components/app/toast-context';
import { useAuth } from '@/features/auth/AuthContext';
import { readAuthOptions, type AuthOptionsResponse } from '@/lib/workout-api';
import { cn } from '@/lib';
import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

const oidcButtonClass =
  'inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2';

/**
 * Sign-in: OpenID Connect (when enabled), demo JWT, or guest.
 */
export function SignInPage() {
  const { signIn, signUp, continueAsGuest, me } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [authOpt, setAuthOpt] = useState<AuthOptionsResponse | null>(null);

  useEffect(() => {
    void readAuthOptions()
      .then(setAuthOpt)
      .catch(() => setAuthOpt({ oidc: false, demo: true }));
  }, []);

  useEffect(() => {
    const err = searchParams.get('auth_error');
    if (err) {
      showToast({
        title: 'Sign-in failed',
        description: err,
        variant: 'error',
      });
      const next = new URLSearchParams(searchParams);
      next.delete('auth_error');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, showToast]);

  useEffect(() => {
    if (me) {
      navigate('/', { replace: true });
    }
  }, [me, navigate]);

  const oidcLoginHref = `${window.location.origin}/api/auth/oidc/login`;

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

  if (!authOpt) {
    return (
      <section className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-slate-600" role="status">
          Loading sign-in options…
        </p>
      </section>
    );
  }

  const showOidc = authOpt.oidc;
  const showDemo = authOpt.demo;

  return (
    <section className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900">Workout Tracker</h1>
      <p className="mt-2 text-sm text-slate-600">
        Sign in with your course identity provider, use a demo display name, or
        continue as a guest.
      </p>

      {showOidc ? (
        <div className="mt-6 space-y-2">
          <a className={cn(oidcButtonClass)} href={oidcLoginHref}>
            Sign in with OpenID Connect
          </a>
          <p className="text-center text-xs text-slate-500">
            Redirects to Auth0 or another OIDC host configured on the server.
          </p>
        </div>
      ) : null}

      {showOidc && showDemo ? (
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-500">or demo / guest</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
      ) : null}

      {showDemo ? (
        <form
          className={cn('space-y-4', showOidc ? 'mt-0' : 'mt-6')}
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
      ) : null}

      {!showOidc && !showDemo ? (
        <p className="mt-4 text-sm text-amber-800">
          Neither OIDC nor demo sign-in is enabled. Set{' '}
          <code className="text-xs">AUTH_OIDC_ENABLED</code> or{' '}
          <code className="text-xs">AUTH_DEMO_ENABLED</code> in server
          environment.
        </p>
      ) : null}

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
          or clear the site. Create an account or use OIDC to sign in from
          another device.
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
