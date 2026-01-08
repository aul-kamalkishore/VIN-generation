import { describe, expect, it } from 'vitest';

import { computeCheckDigit, generateVIN, isValidVIN, yearToCode } from './vin';

describe('vin', () => {
  it('maps model years to codes (1980–2039)', () => {
    expect(yearToCode(1980)).toBe('A');
    expect(yearToCode(1987)).toBe('H');
    expect(yearToCode(1988)).toBe('J');
    expect(yearToCode(2000)).toBe('Y');
    expect(yearToCode(2001)).toBe('1');
    expect(yearToCode(2009)).toBe('9');
    expect(yearToCode(2010)).toBe('A');
    expect(yearToCode(2024)).toBe('R');
    expect(yearToCode(2039)).toBe('9');
  });

  it('computes check digit for example VIN 1M8GDM9AXKP042788', () => {
    expect(computeCheckDigit('1M8GDM9AXKP042788')).toBe('X');
    expect(isValidVIN('1M8GDM9AXKP042788')).toBe(true);
  });

  it('generates 100 valid VINs', () => {
    const vins = Array.from({ length: 100 }, () =>
      generateVIN({ wmi: '1M8', year: 2024, plant: 'K' }),
    );

    for (const vin of vins) {
      expect(vin).toHaveLength(17);
      expect(isValidVIN(vin)).toBe(true);
      expect(/[IOQ]/.test(vin)).toBe(false);
      expect(vin.slice(0, 3)).toBe('1M8');
      expect(vin[9]).toBe('R');
      expect(vin[10]).toBe('K');
    }

    // Ensure reasonable uniqueness (should be very high with random serials)
    expect(new Set(vins).size).toBeGreaterThan(90);
  });
});
