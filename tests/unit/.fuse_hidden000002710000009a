import { describe, it, expect } from 'vitest';
import { listingSchema } from '../../src/lib/validation/listing';

describe('Listing Zod Schema Validation', () => {
  it('accepts valid listing inputs matching DB constraints', () => {
    const validData = {
      title: 'Hero Hawk 21-Speed Cycle',
      description: 'Used for 1 year, great condition',
      category: 'cycles',
      price: 3500,
      isNegotiable: true,
      condition: 'like_new',
      hallOfResidence: 'Patel',
      photoPaths: ['user1/listing1/0.webp'],
    };

    const result = listingSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects titles shorter than 3 characters', () => {
    const result = listingSchema.safeParse({
      title: 'Ab',
      category: 'cycles',
      price: 100,
      isNegotiable: false,
      condition: 'good',
      hallOfResidence: 'Azad',
      photoPaths: ['path/1.webp'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects titles longer than 80 characters', () => {
    const result = listingSchema.safeParse({
      title: 'A'.repeat(81),
      category: 'cycles',
      price: 100,
      isNegotiable: false,
      condition: 'good',
      hallOfResidence: 'Azad',
      photoPaths: ['path/1.webp'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative prices or non-integer prices', () => {
    const resultNegative = listingSchema.safeParse({
      title: 'Cycle',
      category: 'cycles',
      price: -10,
      isNegotiable: false,
      condition: 'good',
      hallOfResidence: 'Azad',
      photoPaths: ['path/1.webp'],
    });
    expect(resultNegative.success).toBe(false);
  });

  it('rejects empty photo array or more than 4 photos', () => {
    const resultEmpty = listingSchema.safeParse({
      title: 'Cycle',
      category: 'cycles',
      price: 100,
      isNegotiable: false,
      condition: 'good',
      hallOfResidence: 'Azad',
      photoPaths: [],
    });
    expect(resultEmpty.success).toBe(false);

    const resultTooMany = listingSchema.safeParse({
      title: 'Cycle',
      category: 'cycles',
      price: 100,
      isNegotiable: false,
      condition: 'good',
      hallOfResidence: 'Azad',
      photoPaths: ['1', '2', '3', '4', '5'],
    });
    expect(resultTooMany.success).toBe(false);
  });
});
