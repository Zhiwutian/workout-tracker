import type { Exercise } from '@/lib/api/types';
import type { WorkoutType } from '@shared/workout-types';

/** Stored on `muscleGroup` for global cardio rows (catalog second step). */
export const CARDIO_SUBGROUP_STANDARD = 'Standard';
export const CARDIO_SUBGROUP_HIIT = 'HIIT';

/** Internal key for exercises with no muscleGroup (legacy rows). */
export const CATALOG_SUBGROUP_OTHER = '';

/**
 * Raw subgroup keys for globals in a category (`""` = null/empty muscleGroup).
 */
export function catalogSubgroupKeys(
  globals: Exercise[],
  category: WorkoutType,
): string[] {
  const set = new Set<string>();
  for (const e of globals) {
    if (e.category !== category) continue;
    set.add((e.muscleGroup ?? '').trim() || CATALOG_SUBGROUP_OTHER);
  }
  return [...set].sort((a, b) => {
    if (a === CATALOG_SUBGROUP_OTHER) return 1;
    if (b === CATALOG_SUBGROUP_OTHER) return -1;
    return formatCatalogSubgroupLabel(category, a).localeCompare(
      formatCatalogSubgroupLabel(category, b),
    );
  });
}

export function formatCatalogSubgroupLabel(
  category: WorkoutType,
  subgroupKey: string,
): string {
  if (!subgroupKey) {
    return 'Other';
  }
  if (category === 'cardio') {
    return subgroupKey;
  }
  return subgroupKey.charAt(0).toUpperCase() + subgroupKey.slice(1);
}

export function catalogExercisesAtLeaf(
  globals: Exercise[],
  category: WorkoutType,
  subgroupKey: string,
  nameQuery: string,
): Exercise[] {
  const q = nameQuery.trim().toLowerCase();
  return globals.filter((e) => {
    if (e.category !== category) return false;
    const g = (e.muscleGroup ?? '').trim() || CATALOG_SUBGROUP_OTHER;
    if (g !== subgroupKey) return false;
    if (q && !e.name.toLowerCase().includes(q)) return false;
    return true;
  });
}
