import { describe, it, expect } from 'vitest';
import { validateImageMagicBytes } from '../../src/utils/imageUtils';

/**
 * Tests for the P1 upload controls.
 *
 * These exist because both fixes shipped unverified: the EXIF leak survived two audits on
 * the strength of someone reading the upload code, and magic-byte validation was accepted
 * as done while a `.wav` renamed `.jpg` still passed. Reading an implementation is not a
 * test.
 *
 * stripExif() needs a real canvas and a real image decoder, neither of which jsdom
 * provides, so it is covered by the Playwright spec in tests/e2e/upload-privacy.spec.ts
 * which uploads a GPS-tagged JPEG and reads the EXIF back off the STORED object.
 */

/** Builds a File whose leading bytes are exactly `bytes`, padded to `size`. */
function fileWithHeader(bytes: number[], name: string, size = 32): File {
  const buf = new Uint8Array(size);
  buf.set(bytes, 0);
  return new File([buf], name, { type: 'image/jpeg' }); // MIME deliberately lies
}

const JPEG = [0xff, 0xd8, 0xff, 0xe0];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const GIF87 = [0x47, 0x49, 0x46, 0x38, 0x37, 0x61];
const GIF89 = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61];
// "RIFF" + 4 size bytes + "WEBP"
const WEBP = [0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50];
// "RIFF" + size + "AVI " — a RIFF container that is NOT an image.
const AVI = [0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x41, 0x56, 0x49, 0x20];
// "RIFF" + size + "WAVE"
const WAV = [0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45];

describe('validateImageMagicBytes', () => {
  describe('accepts real images', () => {
    it.each([
      ['JPEG', JPEG],
      ['PNG', PNG],
      ['GIF87a', GIF87],
      ['GIF89a', GIF89],
      ['WebP', WEBP],
    ])('accepts %s', async (_label, header) => {
      expect(await validateImageMagicBytes(fileWithHeader(header, 'photo.jpg'))).toBe(true);
    });
  });

  describe('rejects everything else', () => {
    it('rejects a .txt renamed .jpg — the original reported bypass', async () => {
      const file = new File(['this is definitely not an image'], 'sneaky.jpg', {
        type: 'image/jpeg',
      });
      expect(await validateImageMagicBytes(file)).toBe(false);
    });

    it('rejects SVG — it is XML, can carry <script>, and is a stored-XSS vector', async () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
      const file = new File([svg], 'payload.jpg', { type: 'image/svg+xml' });
      expect(await validateImageMagicBytes(file)).toBe(false);
    });

    it('rejects an AVI — RIFF alone is not enough, bytes 8-11 must spell WEBP', async () => {
      expect(await validateImageMagicBytes(fileWithHeader(AVI, 'clip.jpg'))).toBe(false);
    });

    it('rejects a WAV for the same reason', async () => {
      expect(await validateImageMagicBytes(fileWithHeader(WAV, 'audio.jpg'))).toBe(false);
    });

    it('rejects a zero-byte file', async () => {
      expect(await validateImageMagicBytes(new File([], 'empty.jpg'))).toBe(false);
    });

    it('rejects a truncated header', async () => {
      const file = new File([new Uint8Array([0xff, 0xd8])], 'truncated.jpg');
      expect(await validateImageMagicBytes(file)).toBe(false);
    });

    it('rejects a PDF', async () => {
      const file = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], 'doc.jpg');
      expect(await validateImageMagicBytes(file)).toBe(false);
    });

    it('does not trust the declared MIME type', async () => {
      const file = new File([new Uint8Array(32)], 'zeros.png', { type: 'image/png' });
      expect(await validateImageMagicBytes(file)).toBe(false);
    });
  });
});
