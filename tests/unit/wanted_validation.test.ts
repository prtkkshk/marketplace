import { describe, it, expect } from 'vitest';
import { wantedRequestSchema } from '../../src/lib/validation/wanted';
import { whatsappLink } from '../../src/lib/utils/whatsappLink';

describe('Wanted Request Validation & WhatsApp Message Builder', () => {
  it('accepts valid wanted request input', () => {
    const validData = {
      title: 'Looking for Casio FX-991EX Calculator',
      description: 'Need it for MA20101 exam before Friday',
      category: 'electronics',
      maxBudget: 800,
      hallOfResidence: 'LBS',
    };

    const result = wantedRequestSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects titles under 3 characters', () => {
    const result = wantedRequestSchema.safeParse({
      title: 'Hi',
      category: 'electronics',
      hallOfResidence: 'LBS',
    });
    expect(result.success).toBe(false);
  });

  it('accepts blank, null, or NaN maxBudget as optional budget', () => {
    const dataWithNaN = {
      title: 'Looking for Cycle Lock',
      category: 'cycles',
      maxBudget: NaN,
      hallOfResidence: 'Patel',
    };
    const result = wantedRequestSchema.safeParse(dataWithNaN);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.maxBudget).toBeNull();
    }
  });

  it('formats exact response message URL-encoded per spec', () => {
    const phone = '+919876543210';
    const title = 'Casio FX-991EX Calculator';
    const message = `Hi! I saw your request "${title}" on KGP Bazaar Wanted Board. I have this item available!`;

    const link = whatsappLink(phone, message);
    expect(link).toBe(
      'https://wa.me/919876543210?text=Hi!%20I%20saw%20your%20request%20%22Casio%20FX-991EX%20Calculator%22%20on%20KGP%20Bazaar%20Wanted%20Board.%20I%20have%20this%20item%20available!'
    );
  });
});
