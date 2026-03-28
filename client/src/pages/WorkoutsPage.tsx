import { NavLinkButton } from '@/components/app/NavLinkButton';
import { useToast } from '@/components/app/toast-context';
import { Badge, Button, Card, EmptyState } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import {
  type RangePreset,
  rangePresetToIsoRange,
} from '@/lib/date-range-presets';
import {
  createWorkout,
  downloadWorkoutSetsCsv,
  readWorkouts,
  type ReadWorkoutsParams,
  type WorkoutType,
  type WorkoutSummary,
} from '@/lib/workout-api';
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPES } from '@shared/workout-types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

type StatusFilter = 'all' | 'active' | 'completed';
type SortFilter = 'startedAt_desc' | 'startedAt_asc';

function buildListParams(
  rangePreset: RangePreset,
  status: StatusFilter,
  sort: SortFilter,
): ReadWorkoutsParams {
  const range = rangePresetToIsoRange(rangePreset);
  return {
    ...range,
    status,
    sort,
  };
}

/**
 * List workouts with date range, status, and sort filters; resume banner for active session.
 */
export function WorkoutsPage() {
  const { me } = useAuth();
  const { showToast } = useToast();
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [activeSessions, setActiveSessions] = useState<WorkoutSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [rangePreset, setRangePreset] = useState<RangePreset>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortFilter, setSortFilter] = useState<SortFilter>('startedAt_desc');
  const [newWorkoutType, setNewWorkoutType] =
    useState<WorkoutType>('resistance');

  const listParams = useMemo(
    () => buildListParams(rangePreset, statusFilter, sortFilter),
    [rangePreset, statusFilter, sortFilter],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, active] = await Promise.all([
        readWorkouts(listParams),
        readWorkouts({ status: 'active', sort: 'startedAt_desc' }),
      ]);
      setWorkouts(list);
      setActiveSessions(active);
    } catch (err) {
      showToast({
        title: 'Could not load workouts',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [listParams, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleNewWorkout(): Promise<void> {
    setCreating(true);
    try {
      const w = await createWorkout({ workoutType: newWorkoutType });
      setWorkouts((prev) => [w, ...prev]);
      setActiveSessions((prev) => [w, ...prev]);
      showToast({ title: 'Workout started', variant: 'success' });
    } catch (err) {
      showToast({
        title: 'Could not start workout',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleExportCsv(): Promise<void> {
    setExporting(true);
    try {
      const range = rangePresetToIsoRange(rangePreset);
      await downloadWorkoutSetsCsv(range);
      showToast({ title: 'CSV downloaded', variant: 'success' });
    } catch (err) {
      showToast({
        title: 'Could not export CSV',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    } finally {
      setExporting(false);
    }
  }

  const resumeWorkout = activeSessions[0];
  const activeShownInList =
    !!resumeWorkout &&
    workouts.some((w) => w.workoutId === resumeWorkout.workoutId);
  const showResumeBar = !!resumeWorkout && !activeShownInList;

  const emptyTitle =
    rangePreset !== 'all' || statusFilter !== 'all'
      ? 'No workouts match these filters'
      : 'No workouts yet';
  const emptyDescription =
    rangePreset !== 'all' || statusFilter !== 'all'
      ? 'Try widening the date range or setting Status to “All”.'
      : 'Start a workout to log sets.';

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-semibold text-slate-900"
            data-testid="workouts-page-heading">
            Workouts
          </h1>
          <p className="text-sm text-slate-600">
            {me?.isGuest ? (
              <>
                Guest session — workouts save on this device until you sign out.{' '}
                <Link className="text-indigo-600 underline" to="/sign-in">
                  Create an account
                </Link>{' '}
                to sign in by name later.
              </>
            ) : (
              <>
                Signed in as <strong>{me?.displayName}</strong>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Workout type
            </label>
            <select
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              value={newWorkoutType}
              onChange={(e) => setNewWorkoutType(e.target.value as WorkoutType)}
              aria-label="Workout type">
              {WORKOUT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {WORKOUT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            disabled={creating}
            onClick={() => void handleNewWorkout()}>
            Start workout
          </Button>
        </div>
      </header>

      {showResumeBar && (
        <Card className="border-indigo-200 bg-indigo-50/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-indigo-900">
                Workout in progress
              </p>
              <p className="text-xs text-indigo-800/90">
                {resumeWorkout.title ?? `Workout #${resumeWorkout.workoutId}`} ·{' '}
                {new Date(resumeWorkout.startedAt).toLocaleString()}
              </p>
            </div>
            <NavLinkButton
              to={`/workouts/${resumeWorkout.workoutId}`}
              className="bg-indigo-600 text-white hover:bg-indigo-500 hover:text-white">
              Resume
            </NavLinkButton>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Date range
          </label>
          <select
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            value={rangePreset}
            onChange={(e) => setRangePreset(e.target.value as RangePreset)}
            aria-label="Date range">
            <option value="all">All time</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Status
          </label>
          <select
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            aria-label="Workout status">
            <option value="all">All</option>
            <option value="active">Active only</option>
            <option value="completed">Completed only</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Sort
          </label>
          <select
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            value={sortFilter}
            onChange={(e) => setSortFilter(e.target.value as SortFilter)}
            aria-label="Sort workouts">
            <option value="startedAt_desc">Newest first</option>
            <option value="startedAt_asc">Oldest first</option>
          </select>
        </div>
        <div className="ml-auto flex min-w-[9rem] flex-col gap-1">
          <span className="text-xs font-medium text-slate-600">Export</span>
          <Button
            type="button"
            variant="ghost"
            disabled={exporting || loading}
            onClick={() => void handleExportCsv()}
            aria-label="Download workout sets as CSV for the date range above">
            {exporting ? 'Exporting…' : 'Download CSV'}
          </Button>
        </div>
      </div>
      <p className="text-xs text-slate-500">
        CSV includes every set for workouts that <strong>started</strong> in the
        selected date range (independent of status filters).
      </p>

      {loading && <p className="text-sm text-slate-600">Loading…</p>}
      {!loading && workouts.length === 0 && (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          actions={
            (rangePreset !== 'all' || statusFilter !== 'all') && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setRangePreset('all');
                  setStatusFilter('all');
                }}>
                Clear filters
              </Button>
            )
          }
        />
      )}
      <ul className="space-y-3" aria-label="Workout list">
        {workouts.map((w) => (
          <li key={w.workoutId}>
            <Card className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900">
                    {w.title ?? `Workout #${w.workoutId}`}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(w.startedAt).toLocaleString()}
                    {w.endedAt
                      ? ` → ${new Date(w.endedAt).toLocaleString()}`
                      : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-slate-200 text-slate-800">
                    {WORKOUT_TYPE_LABELS[w.workoutType ?? 'resistance']}
                  </Badge>
                  {!w.endedAt && (
                    <Badge className="bg-amber-100 text-amber-900">
                      Active
                    </Badge>
                  )}
                  <NavLinkButton
                    to={`/workouts/${w.workoutId}`}
                    className="bg-indigo-600 text-white hover:bg-indigo-500 hover:text-white">
                    Open
                  </NavLinkButton>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>
      <p className="text-sm text-slate-500">
        <Link className="text-indigo-600 underline" to="/dashboard">
          Weekly volume dashboard
        </Link>
      </p>
    </div>
  );
}
