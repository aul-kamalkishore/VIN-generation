const VIN_ALLOWED_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;
const VIN_ALLOWED_CHARSET = '0123456789ABCDEFGHJKLMNPRSTUVWXYZ';

// Transliteration per ISO/NHTSA check digit algorithm
// (ref: Wikibooks VIN check digit)
const TRANSLITERATION: Record<string, number> = {
  '0': 0,
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  F: 6,
  G: 7,
  H: 8,
  J: 1,
  K: 2,
  L: 3,
  M: 4,
  N: 5,
  P: 7,
  R: 9,
  S: 2,
  T: 3,
  U: 4,
  V: 5,
  W: 6,
  X: 7,
  Y: 8,
  Z: 9,
};

// Weights for positions 1..17 (position 9 has weight 0)
const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2] as const;

// Model year codes (position 10) repeat every 30 years.
// 1980..2009 => A..Y, 1..9; 2010..2039 repeats.
// (ref: FAXVIN year chart)
const YEAR_CODES_1980_2009 = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'J',
  'K',
  'L',
  'M',
  'N',
  'P',
  'R',
  'S',
  'T',
  'V',
  'W',
  'X',
  'Y',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
] as const;

function randomAllowedChar(): string {
  return VIN_ALLOWED_CHARSET[Math.floor(Math.random() * VIN_ALLOWED_CHARSET.length)]!;
}

function randomDigits(count: number): string {
  let out = '';
  for (let i = 0; i < count; i++) out += Math.floor(Math.random() * 10).toString();
  return out;
}

function normalizeVinCandidate(value: string): string {
  return value.trim().toUpperCase();
}

export function yearToCode(year: number): string {
  if (!Number.isInteger(year) || year < 1980 || year > 2039) {
    throw new Error('Model year must be an integer between 1980 and 2039.');
  }
  const index = (year - 1980) % 30;
  return YEAR_CODES_1980_2009[index]!;
}

export function computeCheckDigit(vin: string): string {
  const normalized = normalizeVinCandidate(vin);
  if (normalized.length !== 17) {
    throw new Error('VIN must be exactly 17 characters.');
  }

  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const ch = normalized[i]!;
    const value = TRANSLITERATION[ch];
    if (value === undefined) {
      throw new Error(`Invalid VIN character '${ch}' at position ${i + 1}.`);
    }
    sum += value * WEIGHTS[i];
  }

  const remainder = sum % 11;
  return remainder === 10 ? 'X' : String(remainder);
}

export function isValidVIN(vin: string): boolean {
  const normalized = normalizeVinCandidate(vin);
  if (!VIN_ALLOWED_REGEX.test(normalized)) {
    return false;
  }

  try {
    const expected = computeCheckDigit(normalized);
    return normalized[8] === expected;
  } catch {
    return false;
  }
}

export function generateVIN(
  input: {
    wmi?: string;
    year?: number;
    plant?: string;
    batchSerial?: string;
  } = {},
): string {
  // ISO/UNECE structure summary:
  // 1-3 WMI, 4-9 VDS (check digit at 9), 10-17 VIS (year at 10, plant at 11)

  const wmiCandidate = input.wmi ? normalizeVinCandidate(input.wmi) : '';
  const wmi =
    wmiCandidate.length === 3 && /^[A-HJ-NPR-Z0-9]{3}$/.test(wmiCandidate)
      ? wmiCandidate
      : `${randomAllowedChar()}${randomAllowedChar()}${randomAllowedChar()}`;

  const vds = `${randomAllowedChar()}${randomAllowedChar()}${randomAllowedChar()}${randomAllowedChar()}${randomAllowedChar()}`;

  const year = input.year ?? new Date().getFullYear();
  const yearCode = yearToCode(Math.min(2039, Math.max(1980, Math.trunc(year))));

  const plantCandidate = input.plant ? normalizeVinCandidate(input.plant) : '';
  const plant =
    plantCandidate.length >= 1 && /^[A-HJ-NPR-Z0-9]$/.test(plantCandidate[0]!)
      ? plantCandidate[0]!
      : randomAllowedChar();

  const serial = randomDigits(6);

  const withPlaceholder = `${wmi}${vds}0${yearCode}${plant}${serial}`;
  const checkDigit = computeCheckDigit(withPlaceholder);

  return `${withPlaceholder.slice(0, 8)}${checkDigit}${withPlaceholder.slice(9)}`;
}
