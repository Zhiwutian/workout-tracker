/** Filter toolbar for the workouts list (date range, status, sort) plus CSV export trigger. */
import { Button, FieldLabel, Select } from '@/components/ui';
import type { RangePreset } from '@/lib/date-range-presets';

export type WorkoutStatusFilter = 'all' | 'active' | 'completed';
export type WorkoutSortFilter = 'startedAt_desc' | 'startedAt_asc';

export type WorkoutListFiltersProps = {
  rangePreset: RangePreset;
  onRangePresetChange: (v: RangePreset) => void;
  statusFilter: WorkoutStatusFilter;
  onStatusFilterChange: (v: WorkoutStatusFilter) => void;
  sortFilter: WorkoutSortFilter;
  onSortFilterChange: (v: WorkoutSortFilter) => void;
  exporting: boolean;
  loading: boolean;
  onExportCsv: () => void;
};

/**
 * Date range, status, sort, and CSV export for the workouts list.
 */
export function WorkoutListFilters({
  rangePreset,
  onRangePresetChange,
  statusFilter,
  onStatusFilterChange,
  sortFilter,
  onSortFilterChange,
  exporting,
  loading,
  onExportCsv,
}: WorkoutListFiltersProps) {
  return (
    <>
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
        <div>
          <FieldLabel htmlFor="workouts-filter-range">Date range</FieldLabel>
          <Select
            id="workouts-filter-range"
            value={rangePreset}
            onChange={(e) => onRangePresetChange(e.target.value as RangePreset)}
            aria-label="Date range">
            <option value="all">All time</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
          </Select>
        </div>
        <div>
          <FieldLabel htmlFor="workouts-filter-status">Status</FieldLabel>
          <Select
            id="workouts-filter-status"
            value={statusFilter}
            onChange={(e) =>
              onStatusFilterChange(e.target.value as WorkoutStatusFilter)
            }
            aria-label="Workout status">
            <option value="all">All</option>
            <option value="active">Active only</option>
            <option value="completed">Completed only</option>
          </Select>
        </div>
        <div>
          <FieldLabel htmlFor="workouts-filter-sort">Sort</FieldLabel>
          <Select
            id="workouts-filter-sort"
            value={sortFilter}
            onChange={(e) =>
              onSortFilterChange(e.target.value as WorkoutSortFilter)
            }
            aria-label="Sort workouts">
            <option value="startedAt_desc">Newest first</option>
            <option value="startedAt_asc">Oldest first</option>
          </Select>
        </div>
        <div className="ml-auto flex min-w-[9rem] flex-col gap-1">
          <span className="text-xs font-medium text-slate-600">Export</span>
          <Button
            type="button"
            variant="ghost"
            disabled={exporting || loading}
            onClick={() => void onExportCsv()}
            aria-label="Download workout sets as CSV for the date range above">
            {exporting ? 'Exporting…' : 'Download CSV'}
          </Button>
        </div>
      </div>
      <p className="text-xs text-slate-500">
        CSV includes every set for workouts that <strong>started</strong> in the
        selected date range (independent of status filters).
      </p>
    </>
  );
}
