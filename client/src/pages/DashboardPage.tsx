import { NavLinkButton } from '@/components/app/NavLinkButton';
import { useToast } from '@/components/app/toast-context';
import {
  Button,
  Card,
  EmptyState,
  FieldLabel,
  Input,
  Select,
} from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import { cn } from '@/lib';
import { effectiveDarkShell } from '@/lib/display-shell';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';
import { useAbortableAsyncEffect } from '@/lib/use-abortable-async-effect';
import { useSystemPrefersDark } from '@/lib/use-system-prefers-dark';
import {
  createGoal,
  patchGoal,
  readGoals,
  readStatsSummary,
  readVolumeSeries,
  removeGoal,
  type GoalTypeId,
  type GoalWithProgress,
  type StatsSummaryResponse,
  type VolumeSeriesResponse,
  type WorkoutType,
} from '@/lib/workout-api';
import { useAppState } from '@/state';
import { WORKOUT_TYPE_LABELS, WORKOUT_TYPES } from '@shared/workout-types';
import {
  type FormEvent,
  KeyboardEvent,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const GOAL_TYPE_LABELS: Record<GoalTypeId, string> = {
  weekly_volume: 'Weekly volume (reps × weight)',
  workouts_per_week: 'Workouts started per week',
  active_days_per_week: 'Active days per week',
};

const BADGE_LABELS: Record<string, string> = {
  first_log: 'First log',
  streak_3: '3-day streak',
  streak_7: '7-day streak',
  volume_week_10k: '10k volume week',
};

const SERIES_WEEKS = 8;
type InsightsTabId = 'weekly-stats' | 'volume-trend';

function isDashboardEmpty(
  summary: StatsSummaryResponse['summary'],
  series: VolumeSeriesResponse['series'],
): boolean {
  const cur = summary.currentWeek;
  const noWeek =
    cur.totalVolume === 0 && cur.setCount === 0 && cur.workoutCount === 0;
  const noSeries = series.every(
    (r) => r.totalVolume === 0 && r.setCount === 0 && r.workoutCount === 0,
  );
  return noWeek && noSeries && summary.streakDays === 0;
}

function goalProgressMax(goal: GoalWithProgress): number {
  const t = goal.targetValue;
  return t > 0 ? t : 1;
}

function goalProgressValue(goal: GoalWithProgress): number {
  const p = goal.currentPeriod?.progress ?? 0;
  return Math.max(0, Math.min(p, goalProgressMax(goal)));
}

export function DashboardPage() {
  const { me } = useAuth();
  const { showToast } = useToast();
  const state = useAppState();
  const systemDark = useSystemPrefersDark();
  const darkShell = effectiveDarkShell(
    state.highContrast,
    state.themeMode,
    systemDark,
  );
  const reducedMotion = usePrefersReducedMotion();

  const profileTz = me?.timezone?.trim() || 'UTC';

  const [summaryPack, setSummaryPack] = useState<StatsSummaryResponse | null>(
    null,
  );
  const [volumeSeries, setVolumeSeries] = useState<VolumeSeriesResponse | null>(
    null,
  );
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const [newGoalType, setNewGoalType] = useState<GoalTypeId>('weekly_volume');
  const [newTarget, setNewTarget] = useState('5000');
  const [newTypeFilter, setNewTypeFilter] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);
  const [activeInsightsTab, setActiveInsightsTab] =
    useState<InsightsTabId>('weekly-stats');
  const insightsTablistLabelId = useId();
  const insightsTabRefs = useRef<
    Record<InsightsTabId, HTMLButtonElement | null>
  >({
    'weekly-stats': null,
    'volume-trend': null,
  });

  useAbortableAsyncEffect(
    async (signal) => {
      setLoading(true);
      try {
        const [sum, vol, g] = await Promise.all([
          readStatsSummary(profileTz),
          readVolumeSeries(SERIES_WEEKS, profileTz),
          readGoals(),
        ]);
        if (signal.aborted) return;
        setSummaryPack(sum);
        setVolumeSeries(vol);
        setGoals(g.goals);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [profileTz],
    'Could not load dashboard',
  );

  const summary = summaryPack?.summary;
  const achievements = summaryPack?.achievements ?? [];

  const chartData = useMemo(() => {
    if (!volumeSeries?.series.length) return [];
    return volumeSeries.series.map((row) => ({
      weekLabel: row.weekStart.slice(5),
      weekStart: row.weekStart,
      totalVolume: row.totalVolume,
      setCount: row.setCount,
      workoutCount: row.workoutCount,
    }));
  }, [volumeSeries]);

  const gridStroke = darkShell ? '#334155' : '#e2e8f0';
  const axisStroke = darkShell ? '#94a3b8' : '#64748b';
  const barFill = state.highContrast
    ? '#171717'
    : darkShell
      ? '#818cf8'
      : '#4f46e5';
  const tooltipBg = darkShell ? '#1e293b' : '#fff';
  const tooltipFg = darkShell ? '#f1f5f9' : '#0f172a';

  const empty =
    summary && volumeSeries && isDashboardEmpty(summary, volumeSeries.series);

  async function refreshGoals(): Promise<void> {
    const g = await readGoals();
    setGoals(g.goals);
  }

  async function handleAddGoal(e: FormEvent): Promise<void> {
    e.preventDefault();
    const raw = Number(newTarget);
    if (!Number.isFinite(raw) || raw <= 0) {
      showToast({ title: 'Enter a positive target', variant: 'error' });
      return;
    }
    setSavingGoal(true);
    try {
      await createGoal({
        goalType: newGoalType,
        targetValue: raw,
        workoutTypeFilter: newTypeFilter.trim() || null,
      });
      showToast({ title: 'Goal added', variant: 'success' });
      await refreshGoals();
    } catch (err) {
      showToast({
        title: 'Could not add goal',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    } finally {
      setSavingGoal(false);
    }
  }

  async function toggleGoalActive(g: GoalWithProgress): Promise<void> {
    try {
      await patchGoal(g.id, { isActive: !g.isActive });
      await refreshGoals();
    } catch (err) {
      showToast({
        title: 'Could not update goal',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    }
  }

  async function deleteGoalRow(id: number): Promise<void> {
    try {
      await removeGoal(id);
      await refreshGoals();
      showToast({ title: 'Goal removed', variant: 'success' });
    } catch (err) {
      showToast({
        title: 'Could not remove goal',
        description: err instanceof Error ? err.message : undefined,
        variant: 'error',
      });
    }
  }

  function handleInsightsTabKeyDown(
    e: KeyboardEvent<HTMLButtonElement>,
    currentTab: InsightsTabId,
  ): void {
    const tabs: InsightsTabId[] = ['weekly-stats', 'volume-trend'];
    const idx = tabs.indexOf(currentTab);
    if (idx < 0) return;

    let nextIdx: number | null = null;
    if (e.key === 'ArrowRight') nextIdx = (idx + 1) % tabs.length;
    if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home') nextIdx = 0;
    if (e.key === 'End') nextIdx = tabs.length - 1;
    if (nextIdx === null) return;

    e.preventDefault();
    const nextTab = tabs[nextIdx];
    setActiveInsightsTab(nextTab);
    insightsTabRefs.current[nextTab]?.focus();
  }

  return (
    <div className="space-y-8">
      <NavLinkButton to="/">← Workouts</NavLinkButton>

      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
      </header>

      {loading && <p className="text-sm text-slate-600">Loading…</p>}

      {!loading && empty ? (
        <EmptyState
          title="No training data this week yet"
          description="Log a workout and add sets to see volume, streaks, and charts here."
          actions={
            <div className="flex flex-wrap gap-3">
              <NavLinkButton
                to="/"
                className="bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 hover:text-white">
                Start workout
              </NavLinkButton>
              <NavLinkButton
                to="/tutorial"
                className="border border-slate-300 bg-white text-slate-800 hover:bg-slate-50">
                Open tutorial
              </NavLinkButton>
            </div>
          }
        />
      ) : null}

      {!loading && summary ? (
        <>
          <section aria-labelledby="dash-insights-heading">
            <Card className="p-4">
              <h2
                id="dash-insights-heading"
                className="text-lg font-semibold text-slate-900">
                Weekly insights
              </h2>
              <p
                id={insightsTablistLabelId}
                className="mt-1 text-sm text-slate-600">
                Use tabs to switch between this-week stats and the multi-week
                trend.
              </p>
              <div
                className="mt-3 inline-flex rounded-lg border border-slate-200 bg-white p-1"
                role="tablist"
                aria-labelledby={insightsTablistLabelId}>
                <button
                  ref={(el) => {
                    insightsTabRefs.current['weekly-stats'] = el;
                  }}
                  type="button"
                  role="tab"
                  id="dash-tab-weekly-stats"
                  aria-controls="dash-panel-weekly-stats"
                  aria-selected={activeInsightsTab === 'weekly-stats'}
                  tabIndex={activeInsightsTab === 'weekly-stats' ? 0 : -1}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium',
                    activeInsightsTab === 'weekly-stats'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100',
                  )}
                  onClick={() => setActiveInsightsTab('weekly-stats')}
                  onKeyDown={(e) =>
                    handleInsightsTabKeyDown(e, 'weekly-stats')
                  }>
                  Weekly stats
                </button>
                <button
                  ref={(el) => {
                    insightsTabRefs.current['volume-trend'] = el;
                  }}
                  type="button"
                  role="tab"
                  id="dash-tab-volume-trend"
                  aria-controls="dash-panel-volume-trend"
                  aria-selected={activeInsightsTab === 'volume-trend'}
                  tabIndex={activeInsightsTab === 'volume-trend' ? 0 : -1}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium',
                    activeInsightsTab === 'volume-trend'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100',
                  )}
                  onClick={() => setActiveInsightsTab('volume-trend')}
                  onKeyDown={(e) =>
                    handleInsightsTabKeyDown(e, 'volume-trend')
                  }>
                  Volume trend
                </button>
              </div>

              <div
                id="dash-panel-weekly-stats"
                role="tabpanel"
                aria-labelledby="dash-tab-weekly-stats"
                hidden={activeInsightsTab !== 'weekly-stats'}
                className="mt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card className="p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      This week
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {summary.currentWeek.totalVolume.toLocaleString()}
                    </p>
                    <p className="text-sm text-slate-600">
                      volume · {summary.currentWeek.setCount} sets ·{' '}
                      {summary.currentWeek.workoutCount} sessions
                    </p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Previous week
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {summary.previousWeek.totalVolume.toLocaleString()}
                    </p>
                    <p className="text-sm text-slate-600">
                      volume · {summary.previousWeek.setCount} sets ·{' '}
                      {summary.previousWeek.workoutCount} sessions
                    </p>
                  </Card>
                </div>
                <dl className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                  <div>
                    <dt className="font-medium text-slate-600">
                      Workout day streak
                    </dt>
                    <dd>{summary.streakDays} days</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-600">
                      Active days this week
                    </dt>
                    <dd>{summary.activeDaysThisWeek} days</dd>
                  </div>
                </dl>
              </div>

              <div
                id="dash-panel-volume-trend"
                role="tabpanel"
                aria-labelledby="dash-tab-volume-trend"
                hidden={activeInsightsTab !== 'volume-trend'}
                className="mt-4">
                {volumeSeries && chartData.length > 0 ? (
                  <>
                    <p
                      id="volume-chart-desc"
                      className="text-sm text-slate-600">
                      Bar height is total volume per week; numeric values are in
                      the table below for screen readers and exact figures.
                    </p>
                    <figure className="mt-4 rounded-lg border border-slate-200 bg-white p-2">
                      <div
                        className="h-64 w-full min-h-[16rem]"
                        role="img"
                        aria-label="Weekly training volume chart"
                        aria-describedby="volume-chart-desc">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={chartData}
                            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid
                              stroke={gridStroke}
                              vertical={false}
                            />
                            <XAxis
                              dataKey="weekLabel"
                              tick={{ fill: axisStroke, fontSize: 12 }}
                              tickLine={{ stroke: axisStroke }}
                            />
                            <YAxis
                              tick={{ fill: axisStroke, fontSize: 12 }}
                              tickLine={{ stroke: axisStroke }}
                              width={48}
                            />
                            <Tooltip
                              contentStyle={{
                                background: tooltipBg,
                                color: tooltipFg,
                                border: `1px solid ${gridStroke}`,
                              }}
                              formatter={(value) => {
                                const n =
                                  typeof value === 'number'
                                    ? value
                                    : Number(value ?? 0);
                                return [
                                  Number.isFinite(n) ? n.toLocaleString() : '—',
                                  'Volume',
                                ];
                              }}
                              labelFormatter={(_label, payload) => {
                                const p = payload?.[0]?.payload as
                                  | { weekStart?: string }
                                  | undefined;
                                return p?.weekStart ?? '';
                              }}
                            />
                            <Bar
                              dataKey="totalVolume"
                              fill={barFill}
                              name="Volume"
                              isAnimationActive={!reducedMotion}
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <figcaption className="sr-only">
                        Weekly training volume by week start date. Same numbers
                        appear in the data table following this figure.
                      </figcaption>
                    </figure>

                    <div
                      className="mt-4 overflow-x-auto rounded-lg border border-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                      role="region"
                      tabIndex={0}
                      aria-labelledby="volume-series-table-caption">
                      <table className="w-full min-w-[28rem] text-left text-sm text-slate-800">
                        <caption
                          id="volume-series-table-caption"
                          className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-medium text-slate-700">
                          Weekly stats (same series as the chart)
                        </caption>
                        <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                          <tr>
                            <th scope="col" className="px-3 py-2">
                              Week start
                            </th>
                            <th scope="col" className="px-3 py-2">
                              Volume
                            </th>
                            <th scope="col" className="px-3 py-2">
                              Sets
                            </th>
                            <th scope="col" className="px-3 py-2">
                              Sessions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {chartData.map((row) => (
                            <tr
                              key={row.weekStart}
                              className="border-t border-slate-100">
                              <th scope="row" className="px-3 py-2 font-medium">
                                {row.weekStart}
                              </th>
                              <td className="px-3 py-2">
                                {row.totalVolume.toLocaleString()}
                              </td>
                              <td className="px-3 py-2">{row.setCount}</td>
                              <td className="px-3 py-2">{row.workoutCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-600">
                    No weekly trend data yet. Log workouts and sets to populate
                    this chart.
                  </p>
                )}
              </div>
            </Card>
          </section>

          {achievements.length > 0 ? (
            <section aria-labelledby="dash-badges-heading">
              <h2
                id="dash-badges-heading"
                className="text-lg font-semibold text-slate-900">
                Achievements
              </h2>
              <ul className="mt-2 flex flex-wrap gap-2">
                {[...achievements]
                  .sort(
                    (a, b) =>
                      new Date(a.unlockedAt).getTime() -
                      new Date(b.unlockedAt).getTime(),
                  )
                  .map((a) => (
                    <li
                      key={a.badgeId}
                      className={cn(
                        'rounded-full border px-3 py-1 text-sm font-medium',
                        state.highContrast
                          ? 'border-black bg-white text-black'
                          : 'border-indigo-200 bg-indigo-50 text-indigo-900',
                      )}>
                      <span className="mr-1" aria-hidden="true">
                        ★
                      </span>
                      {BADGE_LABELS[a.badgeId] ?? a.badgeId}
                      <span className="sr-only">
                        . Unlocked {new Date(a.unlockedAt).toLocaleString()}
                      </span>
                    </li>
                  ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="dash-goals-heading">
            <h2
              id="dash-goals-heading"
              className="text-lg font-semibold text-slate-900">
              Weekly goals
            </h2>

            <form
              className="mt-4 max-w-xl space-y-3 rounded-lg border border-slate-200 bg-slate-50/80 p-4"
              onSubmit={(e) => void handleAddGoal(e)}>
              <div>
                <FieldLabel htmlFor="goal-type">Type</FieldLabel>
                <Select
                  id="goal-type"
                  className="w-full"
                  value={newGoalType}
                  onChange={(e) =>
                    setNewGoalType(e.target.value as GoalTypeId)
                  }>
                  {(Object.keys(GOAL_TYPE_LABELS) as GoalTypeId[]).map((k) => (
                    <option key={k} value={k}>
                      {GOAL_TYPE_LABELS[k]}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <FieldLabel htmlFor="goal-target">Target</FieldLabel>
                <Input
                  id="goal-target"
                  inputMode="decimal"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  aria-describedby="goal-target-hint"
                />
                <p
                  id="goal-target-hint"
                  className="mt-1 text-xs text-slate-600">
                  Volume goals use reps × weight (non-warmup). Count goals use
                  whole numbers.
                </p>
              </div>
              <div>
                <FieldLabel htmlFor="goal-filter-type">
                  Workout type filter (optional)
                </FieldLabel>
                <Select
                  id="goal-filter-type"
                  className="w-full"
                  value={newTypeFilter}
                  onChange={(e) => setNewTypeFilter(e.target.value)}>
                  <option value="">All types</option>
                  {WORKOUT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {WORKOUT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </Select>
              </div>
              <Button type="submit" disabled={savingGoal}>
                Add goal
              </Button>
            </form>

            {goals.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">No goals yet.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {goals.map((g) => {
                  const max = goalProgressMax(g);
                  const val = goalProgressValue(g);
                  const pct = Math.round((val / max) * 100);
                  return (
                    <li key={g.id}>
                      <Card className="p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-slate-900">
                              {GOAL_TYPE_LABELS[g.goalType] ?? g.goalType}
                            </p>
                            <p className="text-sm text-slate-600">
                              Target {g.targetValue.toLocaleString()}
                              {g.workoutTypeFilter
                                ? ` · ${
                                    WORKOUT_TYPES.includes(
                                      g.workoutTypeFilter as WorkoutType,
                                    )
                                      ? WORKOUT_TYPE_LABELS[
                                          g.workoutTypeFilter as WorkoutType
                                        ]
                                      : g.workoutTypeFilter
                                  }`
                                : ''}
                              {!g.isActive ? ' · paused' : ''}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              className="text-sm"
                              onClick={() => void toggleGoalActive(g)}>
                              {g.isActive ? 'Pause' : 'Resume'}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              className="text-sm text-red-700"
                              onClick={() => void deleteGoalRow(g.id)}>
                              Remove
                            </Button>
                          </div>
                        </div>
                        {g.currentPeriod ? (
                          <div className="mt-3">
                            <div className="flex justify-between text-sm text-slate-600">
                              <span>Progress this week</span>
                              <span aria-hidden="true">
                                {val.toLocaleString()} / {max.toLocaleString()}{' '}
                                ({pct}
                                %)
                              </span>
                            </div>
                            <progress
                              className="mt-1 h-3 w-full accent-indigo-600"
                              max={max}
                              value={val}
                              aria-valuemin={0}
                              aria-valuemax={max}
                              aria-valuenow={val}
                              aria-label={`Progress toward goal: ${val} of ${max}`}
                            />
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-slate-500">
                            No active period (goal paused).
                          </p>
                        )}
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
