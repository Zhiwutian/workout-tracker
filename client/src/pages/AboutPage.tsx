import { SectionHeader } from '@/components/ui';
import { Link } from 'react-router-dom';

/**
 * Course / product context for the workout tracker reference app.
 */
export function AboutPage() {
  return (
    <>
      <SectionHeader
        title="Workout Tracker"
        description="Educational full-stack app for logging workouts, tracking weekly trends, and practicing accessible product workflows in a modern React plus Express stack."
      />
      <p className="mt-3 text-sm text-slate-700">
        Looking for step-by-step usage guidance? Open the{' '}
        <Link to="/tutorial" className="text-indigo-600 underline">
          Tutorial
        </Link>{' '}
        page for task-focused walkthroughs and FAQ troubleshooting.
      </p>
      <ul className="mt-4 list-inside list-disc text-sm text-slate-700">
        <li>
          Tracks workouts, sets, exercise recents, and weekly summary stats
          (volume, streaks, active days).
        </li>
        <li>
          Supports custom exercises, workout-type filtering, and superset group
          workflows in workout detail.
        </li>
        <li>
          Backend uses PostgreSQL plus Drizzle and a consistent JSON envelope
          with Zod validation on API contracts.
        </li>
        <li>
          Weekly analytics are timezone-aware and designed to match CSV/export
          semantics for easier verification.
        </li>
      </ul>
    </>
  );
}
