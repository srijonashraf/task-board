const REBALANCE_THRESHOLD = 0.001;

export function calculatePosition(
  prevPosition: number | null,
  nextPosition: number | null
): number {
  if (prevPosition === null && nextPosition === null) return 1000;
  if (prevPosition === null) return (nextPosition as number) / 2;
  if (nextPosition === null) return prevPosition + 1000;

  const mid = (prevPosition + nextPosition) / 2;
  if (Math.abs(mid - prevPosition) < REBALANCE_THRESHOLD) {
    return prevPosition + 1;
  }
  return mid;
}

export function needsRebalance(positions: number[]): boolean {
  if (positions.length < 2) return false;
  for (let i = 1; i < positions.length; i++) {
    if (Math.abs(positions[i] - positions[i - 1]) < REBALANCE_THRESHOLD) {
      return true;
    }
  }
  return false;
}

export function rebalancePositions(count: number): number[] {
  return Array.from({ length: count }, (_, i) => (i + 1) * 1000);
}
