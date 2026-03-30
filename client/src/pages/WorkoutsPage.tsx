import { NavLinkButton } from '@/components/app/NavLinkButton';
import { useToast } from '@/components/app/toast-context';
import {
  Badge,
  Button,
  Card,
  ContextualHelp,
  EmptyState,
  FieldLabel,
  Select,
} from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import {
  WorkoutListFilters,
  type WorkoutSortFilter,
  type WorkoutStatusFilter,
} from '@/features/workouts/WorkoutListFilters';
import { WorkoutResumeBanner } from '@/features/workouts/WorkoutResumeBanner';
import {
  type RangePreset,
  rangePresetToIsoRange,
} from '@/lib/date-range-presets';
import {
  buildWorkoutListSearchParams,
  filtersAreDefault,
  parseRangePreset,
  parseStatusFilter,
  sortFromUrlParam,
} from '@/lib/workout-list-url';
import {
  createWorkout,
  downloadWorkoutSetsCsv,
  readWorkouts,
  type ReadWorkoutsParams,
  type WorkoutType,
  type WorkoutSummary,
} from '@/lib/workout-api';
import { useAbortableAsyncEffect } from '@/lib/use-abortable-async-effect';
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPES } from '@shared/workout-types';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

function buildListParams(
  rangePreset: RangePreset,
  status: WorkoutStatusFilter,
  sort: WorkoutSortFilter,
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [activeSessions, setActiveSessions] = useState<WorkoutSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState(false);

  const rangePreset = parseRangePreset(searchParams.get('range'));
  const statusFilter = parseStatusFilter(searchParams.get('status'));
  const sortFilter = sortFromUrlParam(searchParams.get('sort'));

  const setRangePreset = (v: RangePreset) => {
    setSearchParams(buildWorkoutListSearchParams(v, statusFilter, sortFilter), {
      replace: true,
    });
  };
  const setStatusFilter = (v: WorkoutStatusFilter) => {
    setSearchParams(buildWorkoutListSearchParams(rangePreset, v, sortFilter), {
      replace: true,
    });
  };
  const setSortFilter = (v: WorkoutSortFilter) => {
    setSearchParams(
      buildWorkoutListSearchParams(rangePreset, statusFilter, v),
      { replace: true },
    );
  };

  const [newWorkoutType, setNewWorkoutType] =
    useState<WorkoutType>('resistance');

  const listParams = useMemo(
    () => buildListParams(rangePreset, statusFilter, sortFilter),
    [rangePreset, statusFilter, sortFilter],
  );

  useAbortableAsyncEffect(
    async (signal) => {
      setLoading(true);
      try {
        const [list, active] = await Promise.all([
          readWorkouts(listParams),
          readWorkouts({ status: 'active', sort: 'startedAt_desc' }),
        ]);
        if (signal.aborted) return;
        setWorkouts(list);
        setActiveSessions(active);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [listParams],
    'Could not load workouts',
  );

  async function handleNewWorkout(): Promise<void> {
    setCreating(true);
    try {
      const w = await createWorkout({ workoutType: newWorkoutType });
      setWorkouts((prev) => [w, ...prev]);
      setActiveSessions((prev) => [w, ...prev]);
      showToast({ title: 'Workout started', variant: 'success' });
    } catch (err) {
      showToast({
        title: 'Start failed',
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
      showToast({ title: 'Export ready', variant: 'success' });
    } catch (err) {
      showToast({
        title: 'Export failed',
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

  const hasActiveFilters = !filtersAreDefault(
    rangePreset,
    statusFilter,
    sortFilter,
  );

  const emptyTitle = hasActiveFilters
    ? 'No workouts match these filters'
    : 'No workouts yet';
  const emptyDescription = hasActiveFilters
    ? 'Try widening the date range or setting Status to “All”.'
    : 'Start a workout to log sets.';

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-2">
            <div className="min-w-0">
              <h1
                className="text-2xl font-semibold text-slate-900"
                data-testid="workouts-page-heading">
                Workouts
              </h1>
              <p className="text-sm text-slate-600">
                {me?.isGuest ? (
                  <>
                    Guest — saved on this device.{' '}
                    <Link className="text-indigo-600 underline" to="/sign-in">
                      Sign in
                    </Link>{' '}
                    for a named account.
                  </>
                ) : (
                  <>{me?.displayName}</>
                )}
              </p>
            </div>
            <ContextualHelp
              label="About the workouts list"
              title="Workouts list">
              <div>
                <h3 className="font-semibold">Guest sessions</h3>
                <p className="mt-1">
                  Guest workouts stay in this browser until you sign out. Use{' '}
                  <Link to="/sign-in" className="text-indigo-600 underline">
                    Sign in
                  </Link>{' '}
                  to keep access across devices with a named account.
                </p>
              </div>
              <div>
                <h3 className="mt-3 font-semibold">Finishing a workout</h3>
                <p className="mt-1">
                  Open an active workout and tap <strong>Finish workout</strong>{' '}
                  when you are done, then <strong>Confirm finish</strong> in the
                  dialog. Use <strong>Resume editing</strong> if you need to add
                  sets after that.
                </p>
              </div>
              <div>
                <h3 className="mt-3 font-semibold">CSV export</h3>
                <p className="mt-1">
                  The CSV includes sets for workouts whose{' '}
                  <strong>start time</strong> falls in the date range you pick.
                  Status filters (active / completed) do not affect the export.
                </p>
              </div>
            </ContextualHelp>
          </div>
        </div>
        <div className="flex min-w-0 flex-wrap items-end gap-2">
          <div className="min-w-0">
            <FieldLabel htmlFor="new-workout-type">Type</FieldLabel>
            <Select
              id="new-workout-type"
              className="w-full min-w-[9rem]"
              value={newWorkoutType}
              onChange={(e) => setNewWorkoutType(e.target.value as WorkoutType)}
              aria-label="Workout type">
              {WORKOUT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {WORKOUT_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </div>
          <Button
            type="button"
            disabled={creating}
            onClick={() => void handleNewWorkout()}>
            Start workout
          </Button>
        </div>
      </header>

      {showResumeBar && resumeWorkout ? (
        <WorkoutResumeBanner workout={resumeWorkout} />
      ) : null}

      <WorkoutListFilters
        rangePreset={rangePreset}
        onRangePresetChange={setRangePreset}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortFilter={sortFilter}
        onSortFilterChange={setSortFilter}
        exporting={exporting}
        loading={loading}
        onExportCsv={handleExportCsv}
      />

      {loading && <p className="text-sm text-slate-600">Loading…</p>}
      {!loading && workouts.length === 0 && (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          actions={
            <div className="flex flex-wrap gap-3">
              {!hasActiveFilters ? (
                <NavLinkButton
                  to="/tutorial"
                  className="border border-slate-300 bg-white text-slate-800 hover:bg-slate-50">
                  Open tutorial
                </NavLinkButton>
              ) : null}
              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSearchParams(new URLSearchParams(), { replace: true });
                  }}>
                  Clear filters
                </Button>
              ) : null}
            </div>
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
                  {!w.endedAt ? (
                    <NavLinkButton
                      to={`/workouts/${w.workoutId}#finish`}
                      className="border border-slate-300 bg-white text-slate-800 hover:bg-slate-50">
                      Finish
                    </NavLinkButton>
                  ) : null}
                  <NavLinkButton
                    to={`/workouts/${w.workoutId}`}
                    className="bg-indigo-600 text-white hover:bg-indigo-500 hover:text-white">
                    {w.endedAt ? 'Open' : 'Continue'}
                  </NavLinkButton>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>
      <p className="text-sm text-slate-500">
        <Link className="text-indigo-600 underline" to="/dashboard">
          Dashboard
        </Link>
        {' · '}
        <Link className="text-indigo-600 underline" to="/tutorial">
          Tutorial
        </Link>
      </p>
    </div>
  );
}
