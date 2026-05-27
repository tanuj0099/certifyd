export function isServerTestMode() {
  return process.env.NODE_ENV === 'test' || process.env.TEST_MODE === 'true';
}

export function createMockGroqResponse(body = {}) {
  const prompt = Array.isArray(body.messages)
    ? body.messages.map((message) => message?.content || '').join('\n')
    : '';

  let content = {
    verdict: 'Moderate ROI - deterministic test response',
    breakEven: '6 months - deterministic test response',
    projection: 'Rs.4.2L net over 5 years',
    demand: ['Mock demand signal'],
    risks: ['Mock risk'],
    studentTrack: '',
    bottomLine: 'Mocked in TEST_MODE.',
  };

  if (/domain validator|career domain classifier/i.test(prompt)) {
    content = {
      isValid: true,
      normalized: 'Data Analytics',
      reason: 'Deterministic test-mode domain validation.',
    };
  }

  if (/Resume:/i.test(prompt)) {
    content = {
      name: 'Test User',
      summary: 'Deterministic resume analysis fixture.',
      city: 'Bangalore',
      domain: 'data',
      gaps: ['Portfolio proof', 'Interview readiness'],
      certs: [
        {
          name: 'Google Data Analytics',
          why: 'Matches the seeded resume fixture.',
          roi: '15-25%',
          timeline: '3 months',
          fastTrack: 'Build one dashboard project.',
        },
      ],
      immediateAction: 'Complete a static fixture-backed project this week.',
      marketInsight: 'Seeded market data only.',
    };
  }

  return {
    id: 'test-mode-groq-response',
    object: 'chat.completion',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: JSON.stringify(content),
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    },
  };
}

export function createMockClaudeResponse() {
  return {
    content: JSON.stringify({
      offered_ctc: 12,
      offered_fixed: 10,
      offered_variable: 2,
      market_median: 11,
      market_75th: 14,
      percent_diff: 9,
      assessment: 'Deterministic test-mode offer assessment.',
      breakdown: { base: 10, bonus: 2, stocks_esop: 0, benefits_note: 'Fixture only.' },
      counter_offer_script: 'Use this deterministic fixture in tests only.',
      red_flags: [],
      strengths: ['Stable fixture'],
      market_trend: 'Seeded market trend only.',
    }),
    usage: {
      input_tokens: 0,
      output_tokens: 0,
    },
  };
}
