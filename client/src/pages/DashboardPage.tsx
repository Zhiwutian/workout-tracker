import { NavLinkButton } from '@/components/app/NavLinkButton';
import { Card } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import { mondayWeekStartISOInZoneNow } from '@/lib/week';
import { readWeeklyVolume, type WeeklyVolumeResponse } from '@/lib/workout-api';
import { useAbortableAsyncEffect } from '@/lib/use-abortable-async-effect';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Weekly training volume (sum of reps × weight) for workouts started in the profile
 * timezone week (Monday start), or UTC when profile timezone is unset.
 */
export function DashboardPage() {
  const { me } = useAuth();
  const profileTz = me?.timezone?.trim() || 'UTC';
  const weekStart = useMemo(
    () => mondayWeekStartISOInZoneNow(profileTz),
    [profileTz],
  );
  const [stats, setStats] = useState<WeeklyVolumeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useAbortableAsyncEffect(
    async (signal) => {
      setLoading(true);
      try {
        const data = await readWeeklyVolume(weekStart, profileTz);
        if (signal.aborted) return;
        setStats(data);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [weekStart, profileTz],
    'Could not load stats',
  );

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
