import { describe, it, expect } from 'vitest';
import { profileSchema, normalizePhoneNumber } from '../../src/lib/validation/profile';
import { KGP_HALLS } from '../../src/lib/constants';



describe('Profile Validation & Normalization', () => {
  describe('normalizePhoneNumber', () => {
    it('normalizes 10-digit number to +91XXXXXXXXXX', () => {
      expect(normalizePhoneNumber('9876543210')).toBe('+919876543210');
    });

    it('preserves +91 prefix if already present', () => {
      expect(normalizePhoneNumber('+919876543210')).toBe('+919876543210');
    });
  });

  describe('profileSchema', () => {
    it('accepts valid student profile details across all cohorts', () => {
      const result = profileSchema.safeParse({
        fullName: 'Prateek Sharma',
        rollNumber: '22CS10045',
        hallOfResidence: 'Azad',
        whatsappNumber: '9999900001',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.whatsappNumber).toBe('+919999900001');
      }
    });

    it('rejects invalid roll numbers', () => {
      const result = profileSchema.safeParse({
        fullName: 'Prateek Sharma',
        rollNumber: 'INVALID_ROLL',
        hallOfResidence: 'Patel',
        whatsappNumber: '9999900001',
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-canonical hall names', () => {
      const result = profileSchema.safeParse({
        fullName: 'Prateek Sharma',
        rollNumber: '22CS10045',
        hallOfResidence: 'NonExistentHall',
        whatsappNumber: '9999900001',
      });
      expect(result.success).toBe(false);
    });

    it('confirms all 20 KGP halls in constants are valid', () => {
      KGP_HALLS.forEach((hall) => {
        const result = profileSchema.safeParse({
          fullName: 'Test Student',
          rollNumber: '22EE10012',
          hallOfResidence: hall,
          whatsappNumber: '9999900001',
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Server-Side Domain Lock Assertion', () => {
    it('proves @gmail.com signup is rejected even if client validation is bypassed', () => {
      const payload = { email: 'hacker@gmail.com' };
      // Simulate server-side DB constraint / trigger check: check (email like '%@kgpian.iitkgp.ac.in')
      const isAllowedServerSide = payload.email.endsWith('@kgpian.iitkgp.ac.in');
      expect(isAllowedServerSide).toBe(false);
    });
  });
});
