import { NavLinkButton } from '@/components/app/NavLinkButton';
import { Link } from 'react-router-dom';

const sections = [
  { id: 'start', title: '1. Sign in or continue as guest' },
  { id: 'workouts', title: '2. Start and finish workouts' },
  { id: 'sets', title: '3. Log sets' },
  { id: 'exercises', title: '4. Exercises catalog and custom moves' },
  { id: 'dashboard', title: '5. Dashboard, goals, and export' },
  { id: 'profile', title: '6. Profile and display' },
] as const;

/**
 * Task-oriented walkthrough (distinct from About, which is product context).
 */
export function TutorialPage() {
  return (
    <div className="space-y-8">
      <NavLinkButton to="/">← Workouts</NavLinkButton>

      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Tutorial</h1>
        <p className="mt-2 text-sm text-slate-600">
          Follow these steps to get value from the app quickly. This page is
          about <strong>tasks</strong>; see{' '}
          <Link to="/about" className="text-indigo-600 underline">
            About
          </Link>{' '}
          for what the project is for.
        </p>
      </header>

      <nav
        aria-label="Tutorial sections"
        className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        <p className="font-medium text-slate-800">On this page</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-700">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-indigo-600 underline">
                {s.title.replace(/^\d+\.\s*/, '')}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <article className="max-w-none text-slate-800">
        <h2 id="start" className="text-xl font-semibold scroll-mt-24">
          1. Sign in or continue as guest
        </h2>
        <p className="text-sm leading-relaxed">
          Open <Link to="/sign-in">Sign in</Link>. Use OIDC when configured, or
          continue as <strong>guest</strong> to try the flow locally. Guests
          keep data in this browser until you sign out.
        </p>

        <h2 id="workouts" className="mt-10 text-xl font-semibold scroll-mt-24">
          2. Start and finish workouts
        </h2>
        <p className="text-sm leading-relaxed">
          From <Link to="/">Workouts</Link>, pick a type and{' '}
          <strong>Start workout</strong>. Use <strong>Continue</strong> to log
          sets; tap <strong>Finish workout</strong> when you are done, then{' '}
          <strong>Confirm finish</strong> in the dialog (you can{' '}
          <strong>Resume editing</strong> later to add sets). The shortcut
          labeled <strong>Finish</strong> on the list jumps to the finish
          action.
        </p>

        <h2 id="sets" className="mt-10 text-xl font-semibold scroll-mt-24">
          3. Log sets
        </h2>
        <p className="text-sm leading-relaxed">
          Inside a workout, add sets with reps, weight, and optional warmup
          flag. Volume on the dashboard and in CSV export counts{' '}
          <strong>non-warmup</strong> sets only, matching how weekly stats are
          aggregated on the server.
        </p>

        <h2 id="exercises" className="mt-10 text-xl font-semibold scroll-mt-24">
          4. Exercises catalog and custom moves
        </h2>
        <p className="text-sm leading-relaxed">
          Use <Link to="/exercises">Exercises</Link> to open the catalog: pick{' '}
          <strong>Resistance</strong>, <strong>Cardio</strong>, or{' '}
          <strong>Flexibility</strong>, then a muscle group or cardio type (
          <strong>Standard</strong> vs <strong>HIIT</strong>), then the move.
          Add custom exercises from the same page; set pickers still follow the
          workout type you started.
        </p>

        <h2 id="dashboard" className="mt-10 text-xl font-semibold scroll-mt-24">
          5. Dashboard, goals, and export
        </h2>
        <p className="text-sm leading-relaxed">
          <Link to="/dashboard">Dashboard</Link> shows volume, streaks, goals,
          and achievements. Use the <strong>?</strong> button there for how
          weeks, timezone, and volume are calculated. From{' '}
          <Link to="/">Workouts</Link> you can download <strong>CSV</strong> of
          sets; the list’s <strong>?</strong> explains how the export relates to
          filters.
        </p>

        <h2 id="profile" className="mt-10 text-xl font-semibold scroll-mt-24">
          6. Profile and display
        </h2>
        <p className="text-sm leading-relaxed">
          Set timezone and weight units under <Link to="/profile">Profile</Link>
          . Timezone drives Monday-based weeks for volume and goals. Adjust
          display preferences (theme, contrast, text size) to match how you read
          the app.
        </p>
      </article>
    </div>
  );
}
