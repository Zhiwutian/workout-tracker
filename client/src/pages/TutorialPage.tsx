import { NavLinkButton } from '@/components/app/NavLinkButton';
import { Link } from 'react-router-dom';

const sections = [
  { id: 'before-you-start', title: '1. Before you start' },
  { id: 'start', title: '2. Sign in or continue as guest' },
  { id: 'workouts', title: '3. Start and finish workouts' },
  { id: 'sets', title: '4. Log sets' },
  { id: 'exercises', title: '5. Exercises catalog and custom moves' },
  { id: 'dashboard', title: '6. Dashboard, goals, and export' },
  { id: 'profile', title: '7. Profile and display' },
  { id: 'faq', title: '8. FAQ and troubleshooting' },
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
          Follow this end-to-end walkthrough to get value quickly. This page is
          focused on <strong>how to do tasks</strong>; see{' '}
          <Link to="/about" className="text-indigo-600 underline">
            About
          </Link>{' '}
          for app purpose and architecture context.
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
        <h2
          id="before-you-start"
          className="text-xl font-semibold scroll-mt-24">
          1. Before you start
        </h2>
        <p className="text-sm leading-relaxed">
          This app works best as a repeatable routine: create a workout, log
          sets consistently, and review your dashboard weekly. If you are
          exploring for the first time, complete steps 2 through 6 in order.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed">
          <li>
            Plan to log one full workout so dashboard metrics can populate.
          </li>
          <li>
            Use realistic exercise names and muscle groups for custom entries.
          </li>
          <li>
            If your week appears shifted, set timezone in Profile before
            evaluating trends.
          </li>
        </ul>

        <h2 id="start" className="text-xl font-semibold scroll-mt-24">
          2. Sign in or continue as guest
        </h2>
        <p className="text-sm leading-relaxed">
          Open <Link to="/sign-in">Sign in</Link>. Use OIDC when configured, or
          continue as <strong>guest</strong> to try the flow locally. Guests
          keep data in this browser until you sign out.
        </p>

        <h2 id="workouts" className="mt-10 text-xl font-semibold scroll-mt-24">
          3. Start and finish workouts
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
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed">
          <li>
            Keep one active workout at a time for cleaner recents behavior.
          </li>
          <li>
            If you leave mid-session, use the workout list <strong>Open</strong>{' '}
            action to continue.
          </li>
        </ul>

        <h2 id="sets" className="mt-10 text-xl font-semibold scroll-mt-24">
          4. Log sets
        </h2>
        <p className="text-sm leading-relaxed">
          Inside a workout, add sets with reps, weight, and optional warmup
          flag. Volume on the dashboard and in CSV export counts{' '}
          <strong>non-warmup</strong> sets only, matching how weekly stats are
          aggregated on the server.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed">
          <li>Use recent chips to speed up repetitive logging.</li>
          <li>
            Use <strong>Same as last</strong> when repeating the same exercise.
          </li>
          <li>Use rest seconds when pacing is part of your program.</li>
        </ul>

        <h2 id="exercises" className="mt-10 text-xl font-semibold scroll-mt-24">
          5. Exercises catalog and custom moves
        </h2>
        <p className="text-sm leading-relaxed">
          Use <Link to="/exercises">Exercises</Link> to open the catalog: pick{' '}
          <strong>Resistance</strong>, <strong>Cardio</strong>, or{' '}
          <strong>Flexibility</strong>, then a muscle group or cardio type (
          <strong>Standard</strong> vs <strong>HIIT</strong>), then the move.
          Add custom exercises from the same page; set pickers still follow the
          workout type you started.
        </p>
        <p className="mt-2 text-sm leading-relaxed">
          Custom exercises require a muscle group and can be edited or archived
          later. Archived exercises are hidden from active pickers but remain in
          historical logs.
        </p>

        <h2 id="dashboard" className="mt-10 text-xl font-semibold scroll-mt-24">
          6. Dashboard, goals, and export
        </h2>
        <p className="text-sm leading-relaxed">
          <Link to="/dashboard">Dashboard</Link> shows volume, streaks, goals,
          and achievements. Use the <strong>?</strong> button there for how
          weeks, timezone, and volume are calculated. From{' '}
          <Link to="/">Workouts</Link> you can download <strong>CSV</strong> of
          sets; the list’s <strong>?</strong> explains how the export relates to
          filters.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed">
          <li>
            Use goals to track either volume or count-based habits per week.
          </li>
          <li>
            If chart values look off, confirm warm-up sets are marked correctly.
          </li>
        </ul>

        <h2 id="profile" className="mt-10 text-xl font-semibold scroll-mt-24">
          7. Profile and display
        </h2>
        <p className="text-sm leading-relaxed">
          Set timezone and weight units under <Link to="/profile">Profile</Link>
          . Timezone drives Monday-based weeks for volume and goals. Adjust
          display preferences (theme, contrast, text size) to match how you read
          the app.
        </p>

        <h2 id="faq" className="mt-10 text-xl font-semibold scroll-mt-24">
          8. FAQ and troubleshooting
        </h2>
        <div className="mt-3 space-y-3">
          <details className="rounded-lg border border-slate-200 bg-white p-3">
            <summary className="cursor-pointer font-medium text-slate-900">
              Why is my dashboard empty?
            </summary>
            <p className="mt-2 text-sm text-slate-700">
              You need at least one logged set in the selected week window.
              Start a workout, add a few sets, finish it, then refresh the
              dashboard.
            </p>
          </details>
          <details className="rounded-lg border border-slate-200 bg-white p-3">
            <summary className="cursor-pointer font-medium text-slate-900">
              When should I clear recents?
            </summary>
            <p className="mt-2 text-sm text-slate-700">
              Clear recents when switching program blocks or workout focus. The
              clear action is now persisted, so it survives server restarts and
              deploys.
            </p>
          </details>
          <details className="rounded-lg border border-slate-200 bg-white p-3">
            <summary className="cursor-pointer font-medium text-slate-900">
              Do guest workouts sync across devices?
            </summary>
            <p className="mt-2 text-sm text-slate-700">
              No. Guest sessions are for quick local use. Sign in with an
              account to keep data portable and consistent.
            </p>
          </details>
          <details className="rounded-lg border border-slate-200 bg-white p-3">
            <summary className="cursor-pointer font-medium text-slate-900">
              How do I validate filters and exports?
            </summary>
            <p className="mt-2 text-sm text-slate-700">
              On Workouts, open the filters modal, apply a date/status range,
              then download CSV from the same flow. Confirm row totals and week
              labels align with dashboard ranges.
            </p>
          </details>
        </div>
      </article>
    </div>
  );
}
