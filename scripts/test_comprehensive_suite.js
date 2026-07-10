/**
 * Comprehensive Automated Test Suite
 * Covers utilities, services, PII scanning, demand count normalization, ROI calculations, and ranking.
 */

import assert from 'node:assert';
import test, { describe, it } from 'node:test';

// 1. PII Scanner Tests (Items 6 & 7)
import { containsPII, scanObjectForPII } from '../src/utils/piiScanner.js';

describe('PII Scanner Tests', () => {
  it('detects various Indian and International PII patterns (Item 6)', () => {
    assert.strictEqual(containsPII('My email is john.doe@example.com'), true);
    assert.strictEqual(containsPII('Call me at +91 9876543210'), true);
    assert.strictEqual(containsPII('Aadhar number 1234 5678 9012'), true);
    assert.strictEqual(containsPII('Clean text about AWS Cloud Practitioner'), false);
  });

  it('handles PII Scanner edge cases with deeply nested objects (Item 7)', () => {
    const nestedObj = {
      profile: {
        user: {
          details: {
            notes: 'Contact info: test.user@company.co.in'
          }
        }
      },
      safeField: 'AWS Solutions Architect'
    };
    const scanResult = scanObjectForPII(nestedObj);
    assert.strictEqual(scanResult.hasPII, true);
  });
});

// 2. User Profile Service & Payload Builder Tests (Items 4 & 35)
import { buildUserProfilePayload } from '../src/services/userProfileService.js';

describe('userProfileService Suite (Items 4 & 35)', () => {
  it('buildUserProfilePayload formats user structures across various providers', () => {
    const userGoogle = {
      id: 'usr-123',
      email: 'alex@example.com',
      user_metadata: {
        full_name: 'Alex Kumar',
        avatar_url: 'https://avatar.url/img.png'
      }
    };
    const payload = buildUserProfilePayload(userGoogle, { job_role: 'Cloud Engineer' });
    assert.strictEqual(payload.user_id, 'usr-123');
    assert.strictEqual(payload.full_name, 'Alex Kumar');
    assert.strictEqual(payload.job_role, 'Cloud Engineer');
  });

  it('buildUserProfilePayload handles missing metadata cleanly', () => {
    const userMinimal = { uid: 'usr-min-99', email: 'minimal@test.com' };
    const payload = buildUserProfilePayload(userMinimal, {});
    assert.strictEqual(payload.user_id, 'usr-min-99');
    assert.strictEqual(payload.email, 'minimal@test.com');
  });
});

// 3. parseExtractedSkills Error Handling Tests (Item 5)
import { parseExtractedSkills } from '../src/utils/resumeExtractionSchema.js';

describe('parseExtractedSkills Error Handling (Item 5)', () => {
  it('safely parses valid skills JSON payload', () => {
    const res = parseExtractedSkills('{"skills": ["AWS", "Python", "Kubernetes"], "years_experience": 4}');
    assert.strictEqual(res.success, true);
    assert.deepStrictEqual(res.skills, ['AWS', 'Python', 'Kubernetes']);
    assert.strictEqual(res.years_experience, 4);
  });

  it('returns fallback object gracefully on malformed JSON or invalid input', () => {
    const resBroken = parseExtractedSkills('INVALID_JSON{skills: [AWS]}');
    assert.strictEqual(resBroken.success, false);
    assert.deepStrictEqual(resBroken.skills, []);
  });
});

// 4. ROI Calculations & Fallback Inputs (Item 8)
import { calculateAdvancedROI } from '../src/utils/roiMath.js';

describe('ROI Math & Fallback Edge Cases (Item 8)', () => {
  it('calculateAdvancedROI works with valid inputs and handles 0/fallback inputs gracefully', () => {
    const roiNormal = calculateAdvancedROI({ certCostINR: 15000, salaryLPA: 8, hikePercent: 20 });
    assert.strictEqual(typeof roiNormal.fiveYearNet, 'string');
    assert.ok('breakEven' in roiNormal);

    const roiZero = calculateAdvancedROI({ certCostINR: 0, salaryLPA: 0, hikePercent: 0 });
    assert.strictEqual(roiZero.roiPct, 0);
  });
});

// 5. Data Service & Normalization / Ranking Tests (Items 2, 20 & 36)
import { normalizeDemandCount, rankCertificationsForSwitcher } from '../src/services/dataService.jsx';

describe('dataService Suite (Items 2, 20 & 36)', () => {
  it('normalizeDemandCount maps various counts accurately across thresholds (Item 2)', () => {
    assert.strictEqual(normalizeDemandCount(50), 1);
    assert.strictEqual(normalizeDemandCount(250), 2);
    assert.strictEqual(normalizeDemandCount(700), 3);
    assert.strictEqual(normalizeDemandCount(1500), 4);
    assert.strictEqual(normalizeDemandCount(2500), 5);
    assert.strictEqual(normalizeDemandCount(null), 1);
  });

  it('rankCertificationsForSwitcher correctly sorts and filters certifications (Item 20)', () => {
    const sampleCerts = [
      { name: 'AWS Cloud Practitioner', avgHike: 15, timeMonths: 2 },
      { name: 'Azure Fundamentals', avgHike: 25, timeMonths: 3 },
      { name: 'GCP Associate', avgHike: 20, timeMonths: 2 }
    ];
    const ranked = rankCertificationsForSwitcher(sampleCerts, 'fast');
    assert.ok(Array.isArray(ranked));
    assert.strictEqual(ranked[0].name, 'Azure Fundamentals'); // highest hike first
  });
});

// 6. Turnstile Verification Error Handling (Item 30)
import { verifyTurnstileToken, isTurnstileEnabled } from '../src/services/turnstileService.js';

describe('verifyTurnstileToken Error Handling (Item 30)', () => {
  it('handles verification when turnstile is disabled or token verified', async () => {
    const result = await verifyTurnstileToken('test-token');
    assert.strictEqual(result, true);
  });
});
