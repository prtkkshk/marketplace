import { describe, it, expect } from 'vitest';
import { formatINR } from '../../src/lib/utils/formatINR';
import { whatsappLink } from '../../src/lib/utils/whatsappLink';
import { timeAgo } from '../../src/lib/utils/timeAgo';
import { cn } from '../../src/lib/utils/cn';
import { getPhotoPublicUrl, DEFAULT_FALLBACK_PHOTO } from '../../src/lib/utils/image';

describe('Utility Functions', () => {
  describe('formatINR', () => {
    it('formats numbers into Indian Rupee format', () => {
      expect(formatINR(1200)).toBe('₹1,200');
      expect(formatINR(50000)).toBe('₹50,000');
      expect(formatINR(0)).toBe('₹0');
    });
  });

  describe('whatsappLink', () => {
    it('builds wa.me deep links with encoded text', () => {
      const link = whatsappLink('+919999900001', 'Hi! Is it available?');
      expect(link).toBe('https://wa.me/919999900001?text=Hi!%20Is%20it%20available%3F');
    });
  });

  describe('timeAgo', () => {
    it('formats recent timestamps to human readable relative strings', () => {
      const now = new Date();
      expect(timeAgo(now)).toBe('Just now');

      const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000);
      expect(timeAgo(tenMinsAgo)).toBe('10m ago');

      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      expect(timeAgo(twoHoursAgo)).toBe('2h ago');

      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      expect(timeAgo(threeDaysAgo)).toBe('3d ago');
    });
  });

  describe('cn', () => {
    it('combines conditional classes cleanly', () => {
      expect(cn('btn', true && 'btn-primary', false && 'hidden')).toBe('btn btn-primary');
      expect(cn('base', { active: true, disabled: false })).toBe('base active');
    });
  });

  describe('getPhotoPublicUrl', () => {
    it('returns default fallback when path is null or undefined', () => {
      expect(getPhotoPublicUrl(null)).toBe(DEFAULT_FALLBACK_PHOTO);
      expect(getPhotoPublicUrl('')).toBe(DEFAULT_FALLBACK_PHOTO);
    });

    it('returns category-specific fallback when path is missing', () => {
      const bookFallback = getPhotoPublicUrl(null, 'books');
      expect(bookFallback).toContain('unsplash');
      expect(bookFallback).not.toBe('');
    });

    it('returns full HTTP URLs and Base64 Data URIs unchanged', () => {
      const externalUrl = 'https://example.com/photo.jpg';
      expect(getPhotoPublicUrl(externalUrl)).toBe(externalUrl);

      const dataUrl = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAQAcJaQAA3AA/v3AgAA=';
      expect(getPhotoPublicUrl(dataUrl)).toBe(dataUrl);
    });
  });
});
