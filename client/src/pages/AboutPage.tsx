import { SectionHeader } from '@/components/ui';

/**
 * Course / product context for the workout tracker reference app.
 */
export function AboutPage() {
  return (
    <>
      <SectionHeader
        title="Workout Tracker"
        description="Educational full-stack app: workouts, sets, volume (reps × weight), weekly dashboard, and demo JWT auth (OIDC planned)."
      />
      <ul className="mt-4 list-inside list-disc text-sm text-slate-700">
        <li>
          PostgreSQL + Drizzle schema for users, profiles, exercises, workouts,
          sets.
        </li>
        <li>
          API uses a consistent JSON envelope and Zod validation on the server.
        </li>
        <li>
          Weekly stats use a UTC week window — see server docs for assumptions.
        </li>
      </ul>
    </>
  );
}
