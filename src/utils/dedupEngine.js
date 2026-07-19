// Data Redundancy Removal System - Core Deduplication Engine with Advanced Phonetics & Configuration

const DEFAULT_CONFIG = {
  nameThreshold: 0.85,
  contactThreshold: 0.80,
  enablePhonetic: true,
  strictGmail: true
};

/**
 * Normalizes text by converting to lowercase, trimming, and replacing multiple spaces with a single space.
 */
export function normalizeText(text) {
  if (typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Normalizes email address by trimming, lowercasing, and removing sub-addressing (if strictGmail is active).
 */
export function normalizeEmail(email, strictGmail = true) {
  if (typeof email !== 'string') return '';
  let cleaned = email.toLowerCase().trim();
  
  if (strictGmail && cleaned.includes('@gmail.com')) {
    const [local, domain] = cleaned.split('@');
    const baseLocal = local.split('+')[0].replace(/\./g, ''); // ignore dots and plus tags
    cleaned = `${baseLocal}@${domain}`;
  }
  return cleaned;
}

/**
 * Normalizes phone numbers by stripping all non-digit characters except leading '+'.
 */
export function normalizePhone(phone) {
  if (typeof phone !== 'string' && typeof phone !== 'number') return '';
  const str = String(phone).trim();
  const digits = str.replace(/\D/g, '');
  if (str.startsWith('+')) {
    return '+' + digits;
  }
  return digits;
}

/**
 * Computes Soundex code for a single word. Returns a 4-character string (e.g., 'R263').
 */
export function getSoundex(word) {
  if (typeof word !== 'string') return '';
  let str = word.toUpperCase().replace(/[^A-Z]/g, '');
  if (str.length === 0) return '';

  const firstLetter = str[0];
  const mappings = {
    B: '1', F: '1', P: '1', V: '1',
    C: '2', G: '2', J: '2', K: '2', Q: '2', S: '2', X: '2', Z: '2',
    D: '3', T: '3',
    L: '4',
    M: '5', N: '5',
    R: '6'
  };

  let soundexCode = firstLetter;
  let prevCode = mappings[firstLetter] || '';

  for (let i = 1; i < str.length; i++) {
    const letter = str[i];
    // Skip letters that do not map to numbers
    if (['A', 'E', 'I', 'O', 'U', 'Y', 'H', 'W'].includes(letter)) {
      prevCode = ''; // Vowels reset groupings
      continue;
    }
    
    const code = mappings[letter];
    if (code) {
      if (code !== prevCode) {
        soundexCode += code;
        prevCode = code;
      }
    }
  }

  return (soundexCode + '000').slice(0, 4);
}

/**
 * Compares two multi-word names phonetically using the Soundex algorithm.
 */
export function namesSoundexMatch(name1, name2) {
  const parts1 = normalizeText(name1).split(' ').filter(Boolean);
  const parts2 = normalizeText(name2).split(' ').filter(Boolean);

  if (parts1.length === 0 || parts2.length === 0) return false;

  const codes1 = parts1.map(getSoundex);
  const codes2 = parts2.map(getSoundex);

  // If name has multiple components, check first name AND last name codes
  if (parts1.length >= 2 && parts2.length >= 2) {
    const firstMatch = codes1[0] === codes2[0];
    const lastMatch = codes1[parts1.length - 1] === codes2[parts2.length - 1];
    return firstMatch && lastMatch;
  }

  // Fallback check: Check if their primary name components match phonetically
  return codes1[0] === codes2[0];
}

/**
 * Computes Jaro-Winkler Similarity (0.0 to 1.0)
 */
export function getJaroWinklerSimilarity(s1, s2) {
  s1 = normalizeText(s1);
  s2 = normalizeText(s2);

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const len1 = s1.length;
  const len2 = s2.length;

  const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
  const matches1 = new Array(len1).fill(false);
  const matches2 = new Array(len2).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(len2 - 1, i + matchWindow);

    for (let j = start; j <= end; j++) {
      if (matches2[j]) continue;
      if (s1[i] === s2[j]) {
        matches1[i] = true;
        matches2[j] = true;
        matches++;
        break;
      }
    }
  }

  if (matches === 0) return 0.0;

  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!matches1[i]) continue;
    while (!matches2[k]) k++;
    if (s1[i] !== s2[k]) {
      transpositions++;
    }
    k++;
  }

  transpositions = Math.floor(transpositions / 2);
  const jaro = (matches / len1 + matches / len2 + (matches - transpositions) / matches) / 3.0;

  let prefix = 0;
  const maxPrefix = Math.min(4, Math.min(len1, len2));
  for (let i = 0; i < maxPrefix; i++) {
    if (s1[i] === s2[i]) {
      prefix++;
    } else {
      break;
    }
  }

  const p = 0.1;
  return jaro + prefix * p * (1 - jaro);
}

/**
 * Computes Levenshtein Distance
 */
export function getLevenshteinDistance(s1, s2) {
  s1 = normalizeText(s1);
  s2 = normalizeText(s2);

  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  const matrix = [];
  for (let i = 0; i <= s2.length; i++) matrix[i] = [i];
  for (let j = 0; j <= s1.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2[i - 1] === s1[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[s2.length][s1.length];
}

export function getLevenshteinSimilarity(s1, s2) {
  const norm1 = normalizeText(s1);
  const norm2 = normalizeText(s2);
  const maxLen = Math.max(norm1.length, norm2.length);
  if (maxLen === 0) return 1.0;
  const dist = getLevenshteinDistance(norm1, norm2);
  return (maxLen - dist) / maxLen;
}

/**
 * Validates entry based on settings config parameter.
 */
export function validateEntry(newEntry, database, config = DEFAULT_CONFIG) {
  const activeConfig = { ...DEFAULT_CONFIG, ...config };
  const traceSteps = [];
  
  traceSteps.push({
    step: 'Normalization & Policy Check',
    status: 'info',
    details: `Normalizing details. strictGmail Policy: ${activeConfig.strictGmail ? 'ACTIVE' : 'INACTIVE'}`
  });

  const normName = normalizeText(newEntry.name);
  const normEmail = normalizeEmail(newEntry.email, activeConfig.strictGmail);
  const normPhone = normalizePhone(newEntry.phone);
  const normCompany = normalizeText(newEntry.company);
  const normAddress = normalizeText(newEntry.address);

  if (!normName) {
    return {
      status: 'rejected',
      confidence: 1.0,
      matchedRecord: null,
      reasons: ['Name field cannot be left blank.'],
      traceSteps: [
        ...traceSteps,
        { step: 'Validation Failure', status: 'danger', details: 'No Name provided. Process aborted.' }
      ]
    };
  }

  // Exact Match Fast-Path
  traceSteps.push({
    step: 'Fast-Path Exact Check',
    status: 'info',
    details: 'Searching database keys for exact email/phone duplicates.'
  });

  for (const record of database) {
    const dbEmail = normalizeEmail(record.email, activeConfig.strictGmail);
    const dbPhone = normalizePhone(record.phone);
    const dbName = normalizeText(record.name);

    if (normEmail && dbEmail && normEmail === dbEmail) {
      traceSteps.push({
        step: 'Exact Duplicate Prevented',
        status: 'danger',
        details: `Identical record email match detected: "${record.email}".`
      });
      return {
        status: 'duplicate',
        confidence: 1.0,
        matchedRecord: record,
        reasons: [`Email "${record.email}" is already registered.`],
        traceSteps
      };
    }

    if (normPhone && dbPhone && normPhone === dbPhone) {
      traceSteps.push({
        step: 'Exact Duplicate Prevented',
        status: 'danger',
        details: `Identical record phone match detected: "${record.phone}".`
      });
      return {
        status: 'duplicate',
        confidence: 1.0,
        matchedRecord: record,
        reasons: [`Phone number "${record.phone}" is already registered.`],
        traceSteps
      };
    }

    if (normName === dbName && normalizeText(record.company) === normCompany) {
      traceSteps.push({
        step: 'Exact Duplicate Prevented',
        status: 'danger',
        details: `Identical composite index match: "${record.name}" at "${record.company}".`
      });
      return {
        status: 'duplicate',
        confidence: 1.0,
        matchedRecord: record,
        reasons: [`Record for "${record.name}" at company "${record.company}" already exists.`],
        traceSteps
      };
    }
  }

  // Fuzzy & Phonetic Matching
  traceSteps.push({
    step: 'Fuzzy & Phonetic Scan',
    status: 'info',
    details: `No exact matches. Checking similarities. Thresholds: Name >= ${activeConfig.nameThreshold}, Contact >= ${activeConfig.contactThreshold}`
  });

  let bestMatch = null;
  let highestNameSim = 0;
  let matchesPhonetically = false;
  let bestMetrics = null;

  for (const record of database) {
    const nameSim = getJaroWinklerSimilarity(newEntry.name, record.name);
    
    let isPhonetic = false;
    if (activeConfig.enablePhonetic) {
      isPhonetic = namesSoundexMatch(newEntry.name, record.name);
    }

    const emailSim = newEntry.email && record.email ? getJaroWinklerSimilarity(newEntry.email, record.email) : 0;
    const phoneSim = newEntry.phone && record.phone ? getLevenshteinSimilarity(newEntry.phone, record.phone) : 0;
    const addrSim = newEntry.address && record.address ? getJaroWinklerSimilarity(newEntry.address, record.address) : 0;

    // A match is tracked if it's the highest Jaro-Winkler, OR if we get a phonetic match
    if (nameSim > highestNameSim || (isPhonetic && !matchesPhonetically)) {
      highestNameSim = nameSim;
      matchesPhonetically = isPhonetic;
      bestMatch = record;
      bestMetrics = { nameSim, emailSim, phoneSim, addrSim, isPhonetic };
    }
  }

  // Determine if name counts as a match (either JW similarity is high, or phonetic matches and JW is at least moderate)
  const isNameMatch = highestNameSim >= activeConfig.nameThreshold || (matchesPhonetically && highestNameSim >= 0.70);

  if (bestMatch && isNameMatch) {
    const { nameSim, emailSim, phoneSim, addrSim, isPhonetic } = bestMetrics;
    
    traceSteps.push({
      step: 'Similar Record Identified',
      status: 'warning',
      details: `Matched on: "${bestMatch.name}". JW Similarity: ${(nameSim * 100).toFixed(1)}%. Phonetic Match: ${isPhonetic ? 'YES' : 'NO'}`
    });

    const hasContactOverlap = 
      emailSim >= activeConfig.contactThreshold || 
      phoneSim >= activeConfig.contactThreshold || 
      addrSim >= activeConfig.contactThreshold;

    if (hasContactOverlap) {
      const confidence = (nameSim + Math.max(emailSim, phoneSim, addrSim)) / 2;
      traceSteps.push({
        step: 'Classification: Suspicious Duplicate',
        status: 'warning',
        details: 'Identified name overlap + similar contact info. Staging entry for manual verification.'
      });
      return {
        status: 'suspected_duplicate',
        confidence,
        matchedRecord: bestMatch,
        reasons: [
          `Potential duplicate of "${bestMatch.name}" (Name Jaro-Winkler: ${(nameSim * 100).toFixed(0)}%).`,
          isPhonetic ? `Names are phonetically identical (Soundex: ${getSoundex(newEntry.name)}).` : null,
          emailSim >= activeConfig.contactThreshold ? `Similar email: "${bestMatch.email}" (similarity: ${(emailSim * 100).toFixed(0)}%).` : null,
          phoneSim >= activeConfig.contactThreshold ? `Similar phone: "${bestMatch.phone}" (similarity: ${(phoneSim * 100).toFixed(0)}%).` : null,
          addrSim >= activeConfig.contactThreshold ? `Similar address: "${bestMatch.address}" (similarity: ${(addrSim * 100).toFixed(0)}%).` : null
        ].filter(Boolean),
        traceSteps
      };
    }

    // False Positive case: Name matches but contact channels are unique
    traceSteps.push({
      step: 'Classification: False Positive Bypass',
      status: 'success',
      details: 'Name similarities matched, but all contact parameters differ. Classified as separate entities.'
    });
    return {
      status: 'false_positive_bypass',
      confidence: 1.0 - Math.max(emailSim, phoneSim),
      matchedRecord: bestMatch,
      reasons: [`Shares name similarity with "${bestMatch.name}" but contact channels are fully separate.`],
      traceSteps
    };
  }

  // Unique Profile
  traceSteps.push({
    step: 'Deduplication Complete',
    status: 'success',
    details: 'Verified unique. No conflicts identified across database.'
  });

  return {
    status: 'unique',
    confidence: 1.0,
    matchedRecord: null,
    reasons: [],
    traceSteps
  };
}
