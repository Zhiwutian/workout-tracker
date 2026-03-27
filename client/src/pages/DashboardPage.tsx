import { NavLinkButton } from '@/components/app/NavLinkButton';
import { useToast } from '@/components/app/toast-context';
import { Card } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import { mondayWeekStartISOInZone } from '@/lib/week';
import { readWeeklyVolume, type WeeklyVolumeResponse } from '@/lib/workout-api';
import { DateTime } from 'luxon';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Weekly training volume (sum of reps × weight) for workouts started in the profile
 * timezone week (Monday start), or UTC when profile timezone is unset.
 */
export function DashboardPage() {
  const { me } = useAuth();
  const { showToast } = useToast();
  const profileTz = me?.timezone?.trim() || 'UTC';
  const weekStart = useMemo(
    () => mondayWeekStartISOInZone(profileTz, DateTime.now()),
    [profileTz],
  );
  const [stats, setStats] = useState<WeeklyVolumeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await readWeeklyVolume(weekStart, profileTz);
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
  }, [weekStart, profileTz, showToast]);

  const zoneLabel =
    stats?.timezone ??
    (profileTz !== 'UTC' && profileTz !== 'Etc/UTC' ? profileTz : 'UTC');

  return (
    <div className="space-y-6">
      <NavLinkButton to="/">← Workouts</NavLinkButton>
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Weekly volume</h1>
        <p className="text-sm text-slate-600">
          Week starting <time dateTime={weekStart}>{weekStart}</time> (
          {zoneLabel}
          ). Includes workouts whose start time falls in this window. Set
          timezone in{' '}
          <Link to="/profile" className="text-indigo-600 underline">
            Profile
          </Link>
          .
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
