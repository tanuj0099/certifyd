import fs from 'fs';
import path from 'path';

export interface SubmissionOverride {
  id: string;
  status?: 'approved' | 'rejected' | 'flagged' | 'pending';
  rejection_reason?: string;
  internal_notes?: Array<{ author: string; text: string; timestamp: string }>;
}

const CACHE_DIRS = [
  path.join(process.cwd(), 'data', 'ops_cache'),
  path.join('/tmp', 'ops_cache'),
  path.join(process.cwd(), '.next', 'ops_cache'),
];

for (const dir of CACHE_DIRS) {
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch (e) {}
}

function getCacheFilePath(dir: string): string {
  return path.join(dir, 'submissions_cache.json');
}

export function getSubmissionOverrides(): Record<string, SubmissionOverride> {
  for (const dir of CACHE_DIRS) {
    try {
      const file = getCacheFilePath(dir);
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch (e) {}
  }
  return {};
}

export function saveSubmissionOverride(id: string, override: Partial<SubmissionOverride>) {
  const current = getSubmissionOverrides();
  const existing = current[id] || { id };
  const updated = { ...existing, ...override, id };
  current[id] = updated;

  for (const dir of CACHE_DIRS) {
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const file = getCacheFilePath(dir);
      fs.writeFileSync(file, JSON.stringify(current, null, 2), 'utf-8');
    } catch (e) {}
  }
  return updated;
}
