import { ClientError } from '@server/lib/client-error.js';

/** Block logging new sets on a workout that has been marked finished (`endedAt` set). */
export function assertWorkoutAcceptsNewSets(endedAt: Date | null): void {
  if (endedAt != null) {
    throw new ClientError(
      400,
      'Workout is finished. Resume editing on the workout page to add sets.',
    );
  }
}
