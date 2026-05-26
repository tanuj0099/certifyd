# CertifyROI Verification Matrix

This matrix converts architecture behavior into binary assertions. Each row must resolve to `PASS` or `FAIL`; "partially works" is a failure until the assertion is narrowed or fixed.

## Status Values

| Status | Meaning |
|---|---|
| `UNMAPPED` | No automated or manual test is wired yet. |
| `AUTOMATED` | Covered by a repeatable test. |
| `MANUAL` | Requires a documented manual verification run. |
| `BLOCKED` | Cannot be verified without missing environment, credentials, or implementation. |

## Evidence Rules

Every verification run must attach one of:

- Test output with command, timestamp, and environment.
- API response body plus status code.
- Database query result with sensitive values redacted.
- Browser trace, HAR, screenshot, or analytics event export.
- Worker/job log showing input object ID and completed output.

## Phase 1: Identity And Authentication Routing

| ID | Assertion | Type | Automation Target | Pass Condition | Fail Condition | Evidence |
|---|---|---|---|---|---|---|
| AUTH-001 | Sign-up writes email and encrypted password only to `auth.users`. | Integration | Supabase auth API + database assertion | A new sign-up creates exactly one row in `auth.users`; password is not readable as plaintext; no password or password hash appears in public tables. | No `auth.users` row, duplicate row, plaintext password leak, or credential material in public schema. | Auth API response and redacted SQL query results. |
| AUTH-002 | `handle_new_user` trigger copies the user UUID into `public.profiles`. | Database | Supabase SQL test | After sign-up, `public.profiles.id` or `public.profiles.user_id` equals the new `auth.users.id`. | Missing profile row or mismatched UUID. | SQL result joining test user UUID to profile row. |
| AUTH-003 | `handle_new_user` trigger persists target domain into `public.profiles`. | Database | Supabase SQL test | The profile row contains the submitted target domain exactly once. | Null, wrong value, duplicate profile rows, or value stored in the wrong table. | SQL result for test user profile. |
| AUTH-004 | `handle_new_user` trigger persists career goals into `public.profiles`. | Database | Supabase SQL test | The profile row contains the submitted career goals exactly once. | Null, wrong value, duplicate profile rows, or value stored in the wrong table. | SQL result for test user profile. |
| AUTH-005 | Frontend anon client cannot query or read `auth.users` directly. | Negative security | Browser/API test | A frontend anon-key request to `auth.users` returns `403`, `401`, or equivalent unauthorized rejection. | Any row, metadata, or schema content is returned to the browser client. | Network response status and body. |
| AUTH-006 | Successful login returns a valid JWT. | Integration | Auth API test | Login for a seeded user returns a JWT whose signature and expiry validate against Supabase auth configuration. | Missing token, invalid token, expired token, or token for the wrong subject. | Redacted token claims and validation output. |
| AUTH-007 | Login session is stored in a secure HTTP-only cookie. | Security | Browser cookie inspection | Session cookie has `HttpOnly`, `Secure`, and appropriate `SameSite` attributes. | Session only exists in localStorage/sessionStorage or cookie lacks required flags. | Browser context cookie dump with token redacted. |
| AUTH-008 | Next.js/API client attaches JWT to subsequent API calls. | Integration | Playwright/API route test | After login, protected API calls include `Authorization: Bearer <jwt>` or server-side cookie-derived auth and succeed for the current user. | Protected request is unauthenticated, uses stale token, or succeeds without auth. | HAR or server log with redacted auth header. |
| AUTH-009 | User A's JWT cannot read User B's `public.profiles` row. | Negative security | RLS integration test | Querying User B's UUID with User A's JWT returns an empty array, `401`, or `403`. | User B profile fields are returned to User A. | API response and SQL/RLS policy reference. |

## Phase 2: Telemetry And UX Monitoring

| ID | Assertion | Type | Automation Target | Pass Condition | Fail Condition | Evidence |
|---|---|---|---|---|---|---|
| TEL-001 | Clicking a standard navigation control emits a silent PostHog payload. | E2E | Playwright network interception | A click on each sampled nav button sends one PostHog request containing CSS selector, timestamp, and anonymized session ID. | No request, missing required fields, duplicate spam, or direct PII in payload. | HAR or intercepted request JSON. |
| TEL-002 | Standard navigation tracking does not require manual `onClick` listeners. | Static analysis | Source scan | Navigation tracking is implemented through PostHog autocapture or shared instrumentation, with no per-nav manual tracking handlers required. | Standard nav buttons require individual analytics `onClick` handlers. | Static scan report and file references. |
| TEL-003 | Rapid clicks on a non-responsive element register `dead_click`. | E2E + analytics export | Playwright + PostHog events API/dashboard | Five or more rapid clicks on a static div or disabled button produce a `dead_click` event for the test session. | Event absent after ingestion window or attributed to the wrong session. | Analytics export or dashboard screenshot with session ID. |
| TEL-004 | Final "Calculate ROI" click emits `roi_calculated`. | E2E | Playwright network interception or PostHog test sink | Clicking the final ROI action sends `roi_calculated`. | No event or wrong event name. | Intercepted event payload. |
| TEL-005 | `roi_calculated` contains selected domain and baseline salary. | E2E | Playwright network interception or PostHog test sink | Event properties include selected domain and baseline salary as structured JSON values. | Missing field, stringified unparseable blob, wrong salary, or wrong domain. | Intercepted event payload. |

## Phase 3: Document Pipeline - Resume Upload

| ID | Assertion | Type | Automation Target | Pass Condition | Fail Condition | Evidence |
|---|---|---|---|---|---|---|
| DOC-001 | Upload request returns a temporary signed AWS S3 URL from the backend. | API | Backend endpoint test | Request returns HTTPS S3 URL with signature, expiration, method scope, key, and content constraints. | Unsigned URL, permanent credential, missing expiration, or non-S3 upload target. | API response with signature redacted. |
| DOC-002 | Browser uploads directly to S3 using `PUT`. | E2E | Playwright network interception | Browser issues `PUT` to returned S3 URL; backend does not receive the file bytes. | Browser posts file to app backend or uses wrong HTTP method. | HAR showing direct S3 `PUT`. |
| DOC-003 | A 10MB PDF upload bypasses Vercel payload limits. | Negative infra | E2E upload test | 10MB PDF completes without Vercel `413 Payload Too Large`; S3 returns success. | Any `413`, backend payload rejection, or timeout caused by serverless body handling. | HAR and upload result. |
| DOC-004 | S3 upload completion triggers OCR worker. | Integration | Worker/job test | Upload completion event creates a worker job and logs OCR start for the object key. | No worker job, wrong key, or job never starts. | Worker log or queue event. |
| DOC-005 | OCR/LLM extraction writes strict skills JSON to the database. | Integration | Worker + schema validation | Extracted output validates against schema containing skills and years of experience before database write. | Invalid JSON, missing required fields, freeform prose, or unvalidated database write. | JSON schema validation output and DB row. |
| DOC-006 | One year of experience hides certifications requiring 3+ years. | Negative logic | Unit/integration | Given extracted experience of `1`, recommendations exclude all certs with mandatory prerequisites greater than `1` year. | Any 3+ year prerequisite cert appears in recommendations. | Recommendation result fixture. |

## Phase 4: Recommendation Pivot Engine

| ID | Assertion | Type | Automation Target | Pass Condition | Fail Condition | Evidence |
|---|---|---|---|---|---|---|
| PIVOT-001 | `Domain Pivot` excludes vertical upskilling certifications. | Logic | Unit/integration | For `Domain Pivot`, result set contains no cert tagged as vertical upskilling for the current domain. | Any same-lane vertical upskilling cert appears. | Test fixture output. |
| PIVOT-002 | `Domain Pivot` returns cross-industry bridge certifications. | Logic | Unit/integration | For `Domain Pivot`, every returned cert is tagged as bridge, transition, or cross-industry. | Returned certs are foundational-only, vertical-only, or unrelated. | Test fixture output. |
| PIVOT-003 | `Level Up` bypasses foundational certifications. | Logic | Unit/integration | For `Level Up`, recommendations exclude foundational/beginner certs. | A foundational cert appears. | Test fixture output. |
| PIVOT-004 | `Level Up` returns advanced or executive credentials. | Logic | Unit/integration | For `Level Up`, every returned cert is advanced, professional, expert, executive, or equivalent. | Returned certs are beginner/foundational or unrelated. | Test fixture output. |
| PIVOT-005 | `Fast/Rush` filters out preparation times over 8 months. | Logic | Unit/integration | For rush pacing, every returned cert has `T_prep <= 8 months`. | Any returned cert has `T_prep > 8 months` or unknown prep time without explicit fallback rule. | Test fixture output. |

## Phase 5: Financial Modeling And ROI Calculations

| ID | Assertion | Type | Automation Target | Pass Condition | Fail Condition | Evidence |
|---|---|---|---|---|---|---|
| ROI-001 | Bangalore and Bhopal produce different monthly salary deltas for identical inputs. | Logic | Unit/integration | Same cert and baseline salary produce different `Delta_S_m` values because `Loc_idx` differs. | Outputs are identical or city has no effect. | Calculation fixture output. |
| ROI-002 | PMP cost changes when `PMI Member` is enabled. | Logic | Unit/integration | PMP `C_cert` equals INR 34,194 when member toggle is true. | Member cost is not INR 34,194. | Calculation fixture output. |
| ROI-003 | PMP cost changes when `PMI Member` is disabled. | Logic | Unit/integration | PMP `C_cert` equals INR 42,863 when member toggle is false. | Non-member cost is not INR 42,863. | Calculation fixture output. |
| ROI-004 | Payback window equals `C_cert / Delta_S_m`. | Logic/UI | Unit + E2E UI assertion | UI payback value matches computed quotient with documented rounding. | UI value differs from formula beyond rounding tolerance. | Unit output and UI screenshot/value extraction. |

## Phase 6: Edge Cases And Anomalies

| ID | Assertion | Type | Automation Target | Pass Condition | Fail Condition | Evidence |
|---|---|---|---|---|---|---|
| EDGE-001 | Salary at or above INR 40,000,000 suppresses standard percentage-hike language. | E2E | Playwright | Entering baseline salary `40000000` or higher hides consumer percentage-hike copy. | Standard percentage-hike claim remains visible. | DOM assertion and screenshot. |
| EDGE-002 | Executive salary scenario shows B2B reimbursement business case. | E2E | Playwright | Same scenario displays corporate sponsorship/reimbursement business case content. | Consumer ROI output remains primary or business case is missing. | DOM assertion and screenshot. |
| EDGE-003 | INR 500,000 baseline with INR 5,000,000 immediate goal triggers variance limit. | Logic/E2E | Unit + Playwright | System flags goal as unrealistic and enters reality-anchoring flow. | System accepts goal as ordinary single-step path. | Test fixture output and UI assertion. |
| EDGE-004 | Unrealistic goal does not output a 900% ROI single-certification path. | Negative logic | Unit/E2E | Output contains no single-cert ROI path claiming 900% or equivalent direct jump. | A 900% single-cert path is returned or displayed. | Recommendation payload and DOM assertion. |
| EDGE-005 | Unrealistic goal returns maximum statistical ceiling for the user's tier. | Logic/E2E | Unit + Playwright | Output includes bounded ceiling value derived from tier rules. | Ceiling absent, unbounded, or greater than tier cap. | Calculation fixture and UI assertion. |
| EDGE-006 | Unrealistic goal returns multi-year sequential roadmap. | Logic/E2E | Unit + Playwright | Output contains two or more sequenced milestones across multiple years/certifications. | Output is a single-cert immediate jump or lacks sequence/timeline. | Recommendation payload and DOM assertion. |

## Phase 7: DPDP Act Legal Compliance

| ID | Assertion | Type | Automation Target | Pass Condition | Fail Condition | Evidence |
|---|---|---|---|---|---|---|
| DPDP-001 | PostHog SDK does not fire before analytics consent. | Negative privacy | Playwright network interception | Initial page load before consent sends no PostHog SDK init, capture, batch, identify, or autocapture request. | Any analytics request fires before consent. | HAR from first page load. |
| DPDP-002 | User can accept necessary auth cookies while rejecting analytics. | E2E | Playwright | Consent UI records necessary-cookie acceptance and analytics rejection as separate states. | Consent UI bundles auth and analytics into one all-or-nothing choice. | DOM assertion and persisted consent state. |
| DPDP-003 | Accepting consent writes timestamped audit log mapped to user UUID. | Integration | UI/API + database assertion | Consent acceptance creates a database row with user UUID, timestamp, consent version, consent scopes, and verifiable integrity field. | Missing row, missing UUID, missing timestamp, missing scope, or no integrity field. | Redacted DB row. |
| DPDP-004 | Revoking telemetry consent stops PostHog routing for the current session. | E2E | Playwright network interception | After revocation, no subsequent PostHog batch/capture requests are emitted for the same session. | Any analytics event routes after revocation. | HAR before and after revocation. |

## Import Guidance

For Jira, create one issue per row with:

- Summary: `<ID> - <Assertion>`
- Issue type: `Test`
- Priority: security/privacy negatives as `Highest`; financial and auth correctness as `High`; remaining UX telemetry as `Medium`
- Labels: phase slug, test type, `certifyroi-verification`
- Acceptance criteria: `Pass Condition`
- Rejection criteria: `Fail Condition`
- Evidence required: `Evidence`

For automated QA, use the ID as the stable test name prefix, for example:

```text
AUTH-009 user_a_jwt_cannot_read_user_b_profile
ROI-004 payback_window_matches_cost_divided_by_monthly_delta
DPDP-001 posthog_does_not_fire_before_consent
```
