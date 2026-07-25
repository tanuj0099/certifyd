export interface SubmissionOverride {
  id: string;
  status?: 'approved' | 'rejected' | 'flagged' | 'pending';
  rejection_reason?: string;
  internal_notes?: Array<{ author: string; text: string; timestamp: string }>;
}

const memoryCache: Record<string, SubmissionOverride> = {};

export function getSubmissionOverrides(): Record<string, SubmissionOverride> {
  return memoryCache;
}

export function saveSubmissionOverride(id: string, override: Partial<SubmissionOverride>) {
  const current = getSubmissionOverrides();
  const existing = current[id] || { id };
  const updated = { ...existing, ...override, id };
  memoryCache[id] = updated;
  return updated;
}
