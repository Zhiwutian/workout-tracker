import { NavLinkButton } from '@/components/app/NavLinkButton';
import { useToast } from '@/components/app/toast-context';
import { Card } from '@/components/ui';
import { utcWeekStartISO } from '@/lib/week';
import { readWeeklyVolume, type WeeklyVolumeResponse } from '@/lib/workout-api';
import { useEffect, useState } from 'react';

/**
 * Weekly training volume (sum of reps × weight) for workouts started in the UTC week.
 */
export function DashboardPage() {
  const { showToast } = useToast();
  const [weekStart] = useState(() => utcWeekStartISO());
  const [stats, setStats] = useState<WeeklyVolumeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await readWeeklyVolume(weekStart);
        if (!cancelled) setStats(data);
      } catch (err) {
        if (!cancelled) {
          showToast({
            title: 'Could not load stats',
            description: err instanceof Error ? err.message : undefined,
            variant: 'error',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [weekStart, showToast]);

  return (
    <div className="space-y-6">
      <NavLinkButton to="/">← Workouts</NavLinkButton>
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Weekly volume</h1>
        <p className="text-sm text-slate-600">
          Week starting <time dateTime={weekStart}>{weekStart}</time> (UTC). See
          docs for timezone assumptions.
        </p>
      </header>
      {loading && <p className="text-sm text-slate-600">Loading…</p>}
      {!loading && stats && (
        <Card className="p-6">
          <p className="text-3xl font-bold text-slate-900">
            {stats.totalVolume.toLocaleString()}
          </p>
          <p className="text-sm text-slate-600">
            total volume (reps × weight) · {stats.setCount} sets
          </p>
        </Card>
      )}
    </div>
  );
}
