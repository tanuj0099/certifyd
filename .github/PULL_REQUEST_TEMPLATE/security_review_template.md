# SDLC Security Review Gate

**This template is a MANDATORY checklist for any Pull Request that touches the database, authentication, or the offer letter pipeline.** 

---

## 1. STRIDE Threat Model (15-Minute Review)
Before reviewing the code, the author and reviewer must discuss and answer the following questions for the new feature:

- [ ] **Spoofing**: Can someone forge a session or spoof a webhook payload?
- [ ] **Tampering**: Can a user manipulate data they don't own (e.g., modifying another user's CTC)?
- [ ] **Repudiation**: If a user submits fraudulent data, is there an audit trail (e.g., `user_id`, timestamps)?
- [ ] **Information Disclosure**: Can data leak to someone who shouldn't see it (e.g., PII in JSON responses)?
- [ ] **Denial of Service**: Does this endpoint lack rate limiting, allowing someone to exhaust the Groq API or Supabase quotas?
- [ ] **Elevation of Privilege**: Could a crafted payload change a user's role or grant admin access?

*Notes on STRIDE findings:*
> (Write any mitigations implemented here)

---

## 2. Trust Boundaries & Data Flow
Did you draw/verify the trust boundaries for this feature? 
*Example: [User] → [Vercel API] → [Groq] → [Supabase]*

- [ ] I have re-validated, re-authenticated, and re-authorized all data at every boundary crossing. Internal traffic is NOT trusted by default.

---

## 3. Defense in Depth (Assume Breach)
If the primary security control fails, what is the fallback?

- [ ] **Least Privilege**: The feature uses the Supabase `anon` key, NOT the `service_role` key. Backend scripts only have access to tables they explicitly need.
- [ ] **PII Scanning**: Any new data extraction pathways run through `scanAndScrubPII()` before database insertion.
- [ ] **K-Anonymity**: Any new aggregate statistics displayed to users enforce the $k=5$ minimum threshold.

---

## 4. Deployment Verification
- [ ] Did this PR modify RLS policies? (If yes, confirm manual testing as a non-admin user).
- [ ] Does this PR add new dependencies? (If yes, confirm `npm audit` was run and the package publisher was verified).
- [ ] Are all new environment variables properly secured in Vercel and absent from git?

---

**Author Sign-off**: ___________
**Reviewer Sign-off**: ___________
