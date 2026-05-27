const NUMBER_WORDS = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

function normalizeYearsExperience(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, value);

  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();
    if (Object.prototype.hasOwnProperty.call(NUMBER_WORDS, trimmed)) {
      return NUMBER_WORDS[trimmed];
    }

    const numeric = Number(trimmed.replace(/[^\d.]/g, ''));
    if (Number.isFinite(numeric)) return Math.max(0, numeric);
  }

  throw new Error('years_experience must be a number');
}

export function parseExtractedSkills(input) {
  const value = typeof input === 'string' ? JSON.parse(input) : input;

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('extraction payload must be an object');
  }

  if (!Array.isArray(value.skills)) {
    throw new Error('skills must be an array');
  }

  const skills = value.skills
    .map((skill) => String(skill || '').trim())
    .filter(Boolean);

  if (skills.length === 0) {
    throw new Error('skills must contain at least one skill');
  }

  return {
    skills,
    years_experience: normalizeYearsExperience(value.years_experience),
  };
}
