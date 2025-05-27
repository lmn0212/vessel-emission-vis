export function calculateDeviation(actual: number, target: number): number {
  if (target === 0) return 0;
  return ((actual - target) / target) * 100;
} 