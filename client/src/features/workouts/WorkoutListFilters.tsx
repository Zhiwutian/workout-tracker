/** Filter toolbar for the workouts list (date range, status, sort) plus CSV export trigger. */
import { Button, FieldLabel, Modal, Select } from '@/components/ui';
import type { RangePreset } from '@/lib/date-range-presets';
import type {
  WorkoutSortFilter,
  WorkoutStatusFilter,
} from '@/lib/workout-list-url';
import { useRef, useState } from 'react';

export type {
  WorkoutSortFilter,
  WorkoutStatusFilter,
} from '@/lib/workout-list-url';

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

function rangeLabel(preset: RangePreset): string {
  if (preset === 'week') return 'This week';
  if (preset === 'month') return 'This month';
  return 'All time';
}

function statusLabel(status: WorkoutStatusFilter): string {
  if (status === 'active') return 'Active only';
  if (status === 'completed') return 'Completed only';
  return 'All statuses';
}

function sortLabel(sort: WorkoutSortFilter): string {
  return sort === 'startedAt_asc' ? 'Oldest first' : 'Newest first';
}

function filterSummary(
  rangePreset: RangePreset,
  statusFilter: WorkoutStatusFilter,
  sortFilter: WorkoutSortFilter,
): string {
  return [
    rangeLabel(rangePreset),
    statusLabel(statusFilter),
    sortLabel(sortFilter),
  ].join(' · ');
}

/**
 * Filters in a modal (opened from a summary button) plus CSV export on the page.
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-600">
            List filters
          </span>
          <Button
            ref={openButtonRef}
            type="button"
            variant="ghost"
            data-testid="workouts-filters-open"
            className="min-h-11 justify-start border border-slate-200 bg-slate-50/80 px-3 text-left text-sm font-medium text-slate-800"
            aria-expanded={filtersOpen}
            aria-haspopup="dialog"
            onClick={() => setFiltersOpen(true)}>
            {filterSummary(rangePreset, statusFilter, sortFilter)}
          </Button>
        </div>
        <div className="ml-auto flex min-w-[9rem] flex-col gap-1">
          <span className="text-xs font-medium text-slate-600">Export</span>
          <Button
            type="button"
            variant="ghost"
            disabled={exporting || loading}
            onClick={() => void onExportCsv()}
            aria-label="Download workout sets as CSV for the selected date range">
            {exporting ? 'Exporting…' : 'Download CSV'}
          </Button>
        </div>
      </div>
      <p className="text-xs text-slate-500">
        CSV uses workout <strong>start</strong> dates in this range (status
        filters do not apply).
      </p>

      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filter workouts"
        initialFocusRef={openButtonRef}>
        <div className="flex flex-col gap-4">
          <div>
            <FieldLabel htmlFor="workouts-filter-range">Date range</FieldLabel>
            <Select
              id="workouts-filter-range"
              value={rangePreset}
              onChange={(e) =>
                onRangePresetChange(e.target.value as RangePreset)
              }
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
          <Button type="button" onClick={() => setFiltersOpen(false)}>
            Done
          </Button>
        </div>
      </Modal>
    </>
  );
}
