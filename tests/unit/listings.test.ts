import { describe, it, expect } from 'vitest';
import { mapListingRow } from '../../src/lib/data/listings';
import type { Database } from '../../src/lib/database.types';

type ListingRow = Database['public']['Tables']['listings']['Row'];

describe('Listings Data Layer & Privacy Audit', () => {
  it('maps listing row without exposing phone numbers or sensitive profile fields', () => {
    const rawRow: ListingRow & { profiles?: { full_name: string | null; hall_of_residence: string | null } } = {
      id: '10000000-0000-0000-0000-000000000001',
      user_id: '00000000-0000-0000-0000-000000000002',
      title: 'Hero Hawk 21-Speed Cycle',
      description: 'Great condition cycle',
      category: 'cycles',
      price: 3500,
      is_negotiable: true,
      condition: 'like_new',
      photo_paths: ['path/1.webp'],
      hall_of_residence: 'Patel',
      status: 'active',
      is_pinned: false,
      sold_at: null,
      deleted_at: null,
      expires_at: '2026-09-01T00:00:00Z',
      created_at: '2026-08-01T00:00:00Z',
      updated_at: '2026-08-01T00:00:00Z',
      profiles: {
        full_name: 'Aarav Gupta',
        hall_of_residence: 'Patel',
      },
    };

    const mapped = mapListingRow(rawRow);

    expect(mapped.id).toBe(rawRow.id);
    expect(mapped.title).toBe(rawRow.title);
    expect(mapped.price).toBe(3500);
    expect(mapped.sellerName).toBe('Aarav Gupta');
    expect(mapped.sellerHall).toBe('Patel');

    // Confirm whatsapp_number is not a property on ListingItem
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((mapped as any).whatsapp_number).toBeUndefined();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((mapped as any).whatsappNumber).toBeUndefined();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((mapped as any).phone).toBeUndefined();
  });
});
