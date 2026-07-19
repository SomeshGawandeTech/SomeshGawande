// Data Redundancy Removal System - Test Runner for Advanced Features
// Run this file with Node.js to verify core matching, phonetic matching, and configuration rules.

import { 
  getJaroWinklerSimilarity, 
  getLevenshteinDistance, 
  getLevenshteinSimilarity, 
  getSoundex,
  namesSoundexMatch,
  normalizeText, 
  normalizeEmail, 
  normalizePhone, 
  validateEntry 
} from './dedupEngine.js';

let passes = 0;
let fails = 0;

function assert(condition, message) {
  if (condition) {
    passes++;
    console.log(`[PASS] ${message}`);
  } else {
    fails++;
    console.error(`[FAIL] ${message}`);
  }
}

console.log('=== STARTING ADVANCED DEDUPLICATION ENGINE TESTS ===\n');

// 1. Normalization & Distance Tests
assert(normalizeText('  John   DOE  ') === 'john doe', 'Text normalization converts to lowercase and collapses spaces');
assert(normalizeEmail('John.Doe+test@gmail.com', true) === 'johndoe@gmail.com', 'Gmail email normalization (strict) strips dots and plus sub-addresses');
assert(normalizeEmail('John.Doe+test@gmail.com', false) === 'john.doe+test@gmail.com', 'Gmail email normalization (non-strict) preserves dots and tags');
assert(normalizePhone('+1 (555) 123-4567') === '+15551234567', 'Phone normalization strips non-digits except leading plus');

// 2. Soundex Phonetic Matcher Tests
assert(getSoundex('John') === getSoundex('Jon'), 'Soundex: John and Jon yield the same code (J500)');
assert(getSoundex('Smith') === getSoundex('Smyth'), 'Soundex: Smith and Smyth yield the same code (S530)');
assert(namesSoundexMatch('Robert Smith', 'Rupert Smyth'), 'Phonetic matcher flags Robert Smith and Rupert Smyth (R163 and S530)');

// 3. Similarity Metric Tests
const sim1 = getJaroWinklerSimilarity('martha', 'marhta');
assert(sim1 > 0.90 && sim1 < 1.0, `Jaro-Winkler transposition ('martha' vs 'marhta' similarity: ${sim1.toFixed(3)})`);

const dist = getLevenshteinDistance('kitten', 'sitting');
assert(dist === 3, `Levenshtein distance ('kitten' vs 'sitting' distance is ${dist})`);

// 4. Classification Engine Tests
const mockDatabase = [
  {
    id: 'rec_1',
    name: 'Alex Mercer',
    email: 'alex.mercer@gmail.com',
    phone: '+15551234567',
    company: 'Mercer Labs',
    address: '123 Pine St, Seattle, WA'
  }
];

// Test Case A: Exact Duplicate
const resExact = validateEntry({
  name: 'Alex Mercer',
  email: 'alex.mercer@gmail.com',
  phone: '+1 (555) 123-4567',
  company: 'Mercer Labs',
  address: '123 Pine St, Seattle, WA'
}, mockDatabase);
assert(resExact.status === 'duplicate', 'Exact matching email/phone matches duplicate status');

// Test Case B: Fuzzy Duplicate (Near-Match)
const resFuzzy = validateEntry({
  name: 'Alex Mencer',
  email: 'alex.mencer@gmail.com',
  phone: '+1 (555) 123-4568', // typo in phone last digit (not exact, triggers fuzzy check)
  company: 'Mercer Labs',
  address: '123 Pine St'
}, mockDatabase);
assert(resFuzzy.status === 'suspected_duplicate', 'Typo name and similar phone matches suspected_duplicate status');

// Test Case C: Phonetic Match under customized configuration
// We ingest "Alx Mercer" (typo) with same phone but different email.
// Standard threshold might miss it, but Soundex catch triggers duplication warning.
const resPhoneticMatch = validateEntry({
  name: 'Alx Mercer', // Jaro-Winkler is around 0.82
  email: 'different.email@gmail.com',
  phone: '+1 (555) 123-4567', // exact phone match (would block). Let's use similar phone
  phone: '+1 (555) 123-4568', // similar phone
  company: 'Mercer Labs',
  address: '123 Pine St'
}, mockDatabase, { nameThreshold: 0.95, enablePhonetic: true }); // Strict JW name threshold, but phonetic enabled
assert(resPhoneticMatch.status === 'suspected_duplicate', 'Soundex-backed match flags duplicate even under strict name thresholds');

// Test Case D: False Positive Bypass (Same name but completely different contact info)
const resFalsePositive = validateEntry({
  name: 'Alex Mercer',
  email: 'totally.different.email@yahoo.com',
  phone: '+1 (415) 777-8888',
  company: 'Global Arch',
  address: 'Denver, CO'
}, mockDatabase);
assert(resFalsePositive.status === 'false_positive_bypass', 'Same name but different email/phone correctly bypassed as false positive duplicate');

// Test Case E: Unique Record
const resUnique = validateEntry({
  name: 'Elena Rostova',
  email: 'elena.rostova@gmail.com',
  phone: '+1 (650) 444-9999',
  company: 'Stark Industries',
  address: 'Los Angeles'
}, mockDatabase);
assert(resUnique.status === 'unique', 'Completely new record classified as unique');

console.log(`\n=== TEST SUMMARY: ${passes} passed, ${fails} failed ===`);
if (fails > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
