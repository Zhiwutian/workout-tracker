import { describe, expect, it } from 'vitest';
import type { Exercise } from '@/lib/api/types';
import {
  catalogExercisesAtLeaf,
  catalogSubgroupKeys,
  CARDIO_SUBGROUP_HIIT,
  CARDIO_SUBGROUP_STANDARD,
  formatCatalogSubgroupLabel,
} from './exercise-catalog';

const ex = (
  partial: Partial<Exercise> &
    Pick<Exercise, 'exerciseTypeId' | 'name' | 'category'>,
): Exercise => ({
  userId: null,
  muscleGroup: null,
  archivedAt: null,
  ...partial,
});

describe('exercise-catalog', () => {
  const globals: Exercise[] = [
    ex({
      exerciseTypeId: 1,
      name: 'Squat',
      category: 'resistance',
      muscleGroup: 'legs',
    }),
    ex({
      exerciseTypeId: 2,
      name: 'Run',
      category: 'cardio',
      muscleGroup: CARDIO_SUBGROUP_STANDARD,
    }),
    ex({
      exerciseTypeId: 3,
      name: 'Rope',
      category: 'cardio',
      muscleGroup: CARDIO_SUBGROUP_HIIT,
    }),
    ex({
      exerciseTypeId: 4,
      name: 'Legacy cardio',
      category: 'cardio',
      muscleGroup: null,
    }),
  ];

  it('catalogSubgroupKeys groups resistance by muscle', () => {
    expect(catalogSubgroupKeys(globals, 'resistance')).toEqual(['legs']);
  });

  it('catalogSubgroupKeys includes Standard, HIIT, and Other for cardio', () => {
    expect(catalogSubgroupKeys(globals, 'cardio')).toEqual([
      CARDIO_SUBGROUP_HIIT,
      CARDIO_SUBGROUP_STANDARD,
      '',
    ]);
  });

  it('formatCatalogSubgroupLabel title-cases resistance keys', () => {
    expect(formatCatalogSubgroupLabel('resistance', 'legs')).toBe('Legs');
  });

  it('formatCatalogSubgroupLabel passes through cardio labels', () => {
    expect(formatCatalogSubgroupLabel('cardio', CARDIO_SUBGROUP_HIIT)).toBe(
      'HIIT',
    );
  });

  it('catalogExercisesAtLeaf filters by subgroup and name', () => {
    const leaf = catalogExercisesAtLeaf(
      globals,
      'cardio',
      CARDIO_SUBGROUP_STANDARD,
      'run',
    );
    expect(leaf.map((e) => e.name)).toEqual(['Run']);
  });
});
