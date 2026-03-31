import { useState } from 'react';
import type { SetRow } from '@/lib/workout-api';

/**
 * Local UI state for superset composition in workout detail.
 */
export function useSupersetComposer() {
  const [pendingSupersetGroupId, setPendingSupersetGroupId] = useState<
    number | null
  >(null);
  const [startNewSuperset, setStartNewSuperset] = useState(false);

  function handleStartNewSupersetChange(checked: boolean): void {
    setStartNewSuperset(checked);
    if (checked) {
      setPendingSupersetGroupId(null);
    }
  }

  function handleSetCreated(row: SetRow): void {
    if (!startNewSuperset) return;
    setPendingSupersetGroupId(row.groupId);
    setStartNewSuperset(false);
  }

  function addInSuperset(groupId: number): void {
    setPendingSupersetGroupId(groupId);
    setStartNewSuperset(false);
  }

  function stopGrouping(): void {
    setPendingSupersetGroupId(null);
  }

  return {
    pendingSupersetGroupId,
    startNewSuperset,
    handleStartNewSupersetChange,
    handleSetCreated,
    addInSuperset,
    stopGrouping,
  };
}
