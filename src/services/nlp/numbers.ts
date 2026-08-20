/**
 * Multilingual Number and Quantity Parser
 * Supports English textual numbers, Hindi words, Devanagari numerals, and fractions.
 */

const ENGLISH_NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  a: 1,
  an: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  hundred: 100,
  dozen: 12,
  dozens: 12,
  half: 0.5,
};

const HINDI_NUMBER_WORDS: Record<string, number> = {
  ek: 1,
  aik: 1,
  do: 2,
  doo: 2,
  teen: 3,
  char: 4,
  chaar: 4,
  paanch: 5,
  panch: 5,
  chhah: 6,
  cheh: 6,
  saat: 7,
  sat: 7,
  aath: 8,
  ath: 8,
  nau: 9,
  no: 9,
  das: 10,
  gyarah: 11,
  barah: 12,
  terah: 13,
  chaudah: 14,
  pandrah: 15,
  solah: 16,
  satrah: 17,
  atharah: 18,
  unnis: 19,
  bees: 20,
  pachis: 25,
  tis: 30,
  pachas: 50,
  sau: 100,
  aadha: 0.5,
  adho: 0.5,
  darjan: 12,
  derh: 1.5,
  dhai: 2.5,
};

const DEVANAGARI_WORDS: Record<string, number> = {
  शून्य: 0,
  एक: 1,
  दो: 2,
  तीन: 3,
  चार: 4,
  पाँच: 5,
  पांच: 5,
  छह: 6,
  सात: 7,
  आठ: 8,
  नौ: 9,
  दस: 10,
  ग्यारह: 11,
  बारह: 12,
  तेरह: 13,
  चौदह: 14,
  पंद्रह: 15,
  सोलह: 16,
  सत्रह: 17,
  अठारह: 18,
  उन्नीस: 19,
  बीस: 20,
  पच्चीस: 25,
  तीस: 30,
  पचास: 50,
  सौ: 100,
  आधा: 0.5,
  डेढ़: 1.5,
  ढाई: 2.5,
  दर्जन: 12,
};

const DEVANAGARI_DIGITS: Record<string, string> = {
  "०": "0",
  "१": "1",
  "२": "2",
  "३": "3",
  "४": "4",
  "५": "5",
  "६": "6",
  "७": "7",
  "८": "8",
  "९": "9",
};

/**
 * Converts Devanagari numerals (१, २, ३...) in a string to ASCII digits (1, 2, 3...)
 */
export function normalizeDevanagariDigits(text: string): string {
  return text.replace(/[०-९]/g, (char) => DEVANAGARI_DIGITS[char] ?? char);
}

/**
 * Parses numeric value from token or text segment.
 */
export function parseNumberWord(token: string): number | undefined {
  const clean = token.toLowerCase().trim();

  // Pure digit
  if (/^\d+(\.\d+)?$/.test(clean)) {
    return parseFloat(clean);
  }

  // English words
  if (ENGLISH_NUMBER_WORDS[clean] !== undefined) {
    return ENGLISH_NUMBER_WORDS[clean];
  }

  // Hindi words
  if (HINDI_NUMBER_WORDS[clean] !== undefined) {
    return HINDI_NUMBER_WORDS[clean];
  }

  // Devanagari words
  if (DEVANAGARI_WORDS[clean] !== undefined) {
    return DEVANAGARI_WORDS[clean];
  }

  return undefined;
}
