import CircuitBreaker from 'opossum';

const groqCallOptions = {
  timeout: 45000, // If Groq takes > 45 seconds, trigger timeout
  errorThresholdPercentage: 50, // When 50% of requests fail, trip breaker
  resetTimeout: 30000, // After 30s, try one request (half-open)
  rollingCountTimeout: 10000, // 10s window for statistics
  rollingCountBuckets: 10,
};

async function executeGroqFetch(url, options) {
  const res = await fetch(url, options);
  let data = await res.json().catch(() => ({ error: res.statusText || `HTTP ${res.status}` }));
  if (!res.ok && (!data || Object.keys(data).length === 0)) {
    data = { error: res.statusText || `HTTP Error ${res.status} from Groq API` };
  }
  if (res.status >= 500) {
    throw new Error(`Groq API Server Error (${res.status})`);
  }
  return { status: res.status, ok: res.ok, data };
}

export const groqCircuitBreaker = new CircuitBreaker(executeGroqFetch, groqCallOptions);

groqCircuitBreaker.on('open', () => console.warn('[CircuitBreaker] Groq API breaker OPENED — rejecting fast to protect server resources.'));
groqCircuitBreaker.on('halfOpen', () => console.log('[CircuitBreaker] Groq API breaker HALF-OPEN — testing connection.'));
groqCircuitBreaker.on('close', () => console.log('[CircuitBreaker] Groq API breaker CLOSED — service restored.'));
