import { describe, it, expect } from 'vitest';
import { whatsappLink } from '../../src/lib/utils/whatsappLink';

describe('wa.me deep link security', () => {
  it('encodes special characters and prevents parameter smuggling', () => {
    const maliciousText = 'Hello ? & # \n \u00A9 "><script>alert(1)</script>';
    const phone = '+91 98765 43210';
    const link = whatsappLink(phone, maliciousText);

    // Assert that non-digits are stripped from phone
    expect(link.startsWith('https://wa.me/919876543210?text=')).toBe(true);

    // Assert that &, ?, and # are URL encoded
    expect(link).not.toContain('? ');
    expect(link).not.toContain('& ');
    expect(link).toContain(encodeURIComponent('?'));
    expect(link).toContain(encodeURIComponent('&'));
    expect(link).toContain(encodeURIComponent('#'));
    
    // Assert no raw scripts
    expect(link).not.toContain('<script>');
    expect(link).toContain(encodeURIComponent('<script>'));
  });
});
