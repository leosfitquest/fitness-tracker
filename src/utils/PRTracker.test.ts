import { describe, it, expect } from 'vitest';
import { checkSetPR, SetPR } from '../utils/PRTracker';

describe('PRTracker', () => {
  it('should identify a new PR when volume is higher', () => {
    const previousSessions: SetPR[] = [
      { exerciseId: 'ex1', setNumber: 1, weight: 100, reps: 5, date: '2023-01-01' } // Volume 500
    ];

    const result = checkSetPR('ex1', 1, 100, 6, previousSessions); // Volume 600
    expect(result.isPR).toBe(true);
    expect(result.improvement).toBe('reps');
  });

  it('should not flag PR if volume is lower', () => {
    const previousSessions: SetPR[] = [
      { exerciseId: 'ex1', setNumber: 1, weight: 100, reps: 5, date: '2023-01-01' }
    ];

    const result = checkSetPR('ex1', 1, 90, 5, previousSessions);
    expect(result.isPR).toBe(false);
  });
});
