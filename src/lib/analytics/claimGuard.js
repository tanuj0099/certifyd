/**
 * B3: Guard function enforcing minimum sample size before showing any aggregate claim
 * across results screens, Market Pulse insights, or marketing stats.
 */
export const MIN_AGGREGATE_SAMPLE_SIZE = 20;

export function canShowAggregateClaim(sampleSize) {
  if (typeof sampleSize !== 'number' || isNaN(sampleSize)) {
    return false;
  }
  return sampleSize >= MIN_AGGREGATE_SAMPLE_SIZE;
}

export const INSUFFICIENT_DATA_MESSAGE =
  'Not enough data yet — check back as more users report verified outcomes.';
