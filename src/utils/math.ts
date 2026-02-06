// 1RM Calculator with RPE Adjustment
// Based on Strength Level Table + RIR (Reps in Reserve)

export const calculate1RM = (weight: number, reps: number, rpe?: number | null): number => {
    if (reps === 1 && (!rpe || rpe === 10)) return weight;

    // Strength Level Repetition Percentages
    const repPercentages: Record<number, number> = {
        1: 1.00, 2: 0.97, 3: 0.94, 4: 0.92, 5: 0.89,
        6: 0.86, 7: 0.83, 8: 0.81, 9: 0.78, 10: 0.75,
        11: 0.73, 12: 0.71, 13: 0.70, 14: 0.68, 15: 0.67,
        16: 0.65, 17: 0.64, 18: 0.63, 19: 0.61, 20: 0.60,
        21: 0.59, 22: 0.58, 23: 0.57, 24: 0.56, 25: 0.55,
        26: 0.54, 27: 0.53, 28: 0.52, 29: 0.51, 30: 0.50,
    };

    // RPE to RIR (Reps in Reserve) Conversion
    const getRepsInReserve = (rpe: number): number => {
        if (rpe >= 10) return 0;
        if (rpe >= 9.5) return 0.5;
        if (rpe >= 9) return 1;
        if (rpe >= 8.5) return 1.5;
        if (rpe >= 8) return 2;
        if (rpe >= 7.5) return 2.5;
        if (rpe >= 7) return 3;
        if (rpe >= 6.5) return 3.5;
        if (rpe >= 6) return 4;
        return 5; // RPE < 6
    };

    // Adjust reps based on RPE
    let adjustedReps = reps;
    if (rpe && rpe < 10) {
        const rir = getRepsInReserve(rpe);
        adjustedReps = Math.round(reps + rir);
    }

    // Use percentage from table or fallback for >30 reps
    const percentage = repPercentages[adjustedReps] || (0.50 - (adjustedReps - 30) * 0.01);

    // Calculate 1RM: weight / percentage
    return Math.round(weight / percentage);
};

export const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const calculatePlates = (totalWeight: number, availablePlates: number[] = [25, 20, 15, 10, 5, 2.5, 1.25]): string => {
    const barWeight = 20;
    const weightPerSide = (totalWeight - barWeight) / 2;
    if (weightPerSide <= 0) return 'Bar only (20kg)';

    // Sort plates descending to ensure largest are used first
    const plates = [...availablePlates].sort((a, b) => b - a);

    let remaining = weightPerSide;
    const result: string[] = [];

    for (const plate of plates) {
        const count = Math.floor(remaining / plate);
        if (count > 0) {
            result.push(`${plate}kg × ${count}`);
            remaining -= plate * count;
        }
    }

    if (remaining > 0.1) {
        result.push(`${remaining.toFixed(2)}kg missing`);
    }

    return result.length > 0 ? result.join(' + ') : 'Bar only';
};
