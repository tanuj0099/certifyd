# Certifyd Test Strategy

This project has several paid or flaky external systems: LLM providers, PostHog, Supabase, and future S3 upload flows. Automated CI must prove behavior without depending on those live services.

## Default CI Mode

Set these variables for automated tests:

```text
NODE_ENV=test
TEST_MODE=true
VITE_TEST_MODE=true
```

In test mode:

- `/api/groq` returns deterministic OpenAI-compatible fixture responses.
- `/api/claude` returns a deterministic offer-analysis fixture.
- PostHog initialization and capture are disabled in the browser.
- S3 upload tests must use Playwright route mocks.
- Database tests must use seeded local/test data, never production market data.

## What To Unit Test First

- ROI math, payback window, cost toggles, city multipliers, and executive edge-case branching.
- LLM output schema parsing with static JSON fixtures.
- Recommendation filters for prerequisite years, pivot mode, level-up mode, and rush pacing.
- Analytics wrapper calls with a mocked capture function.

## What To Use Playwright For

Use Playwright for wiring and browser-only behavior:

- The browser attempts a direct `PUT` to the S3 signed URL, with the request fulfilled by a mock.
- Consent prevents analytics before opt-in and stops it after withdrawal.
- Critical route wiring loads the expected tool shell.

Avoid using Playwright for math, copy-sensitive business logic, or tests where a component/unit test can assert the same branch.

## What Can Hit Live Services

Only staging smoke jobs should call live services, and they should be opt-in:

```text
TEST_MODE=false
VITE_TEST_MODE=false
STAGING_SMOKE=true
```

Production services should not be used as test fixtures. If live market data changes, CI should not fail because a business metric moved.
