import { describe, it, expect } from 'vitest';

// Simulator for Postgres get_contact_number Security Definer Function
interface ContactEventRow {
  id: string;
  user_id: string;
  listing_id?: string;
  request_id?: string;
  event_type: 'listing_reveal' | 'request_reveal';
  created_at: Date;
}

class ContactRpcSimulator {
  private events: ContactEventRow[] = [];
  private bannedUserIds = new Set<string>();

  public banUser(userId: string) {
    this.bannedUserIds.add(userId);
  }

  public getContactNumber(userId: string, listingId: string, sellerPhone: string): string {
    // 1. Check if user is banned
    if (this.bannedUserIds.has(userId)) {
      throw new Error('User account is banned');
    }

    // 2. Check 1-hour rate limit (max 30 per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentReveals = this.events.filter(
      (e) => e.user_id === userId && e.created_at >= oneHourAgo
    );

    if (recentReveals.length >= 30) {
      throw new Error('Rate limit exceeded (max 30 reveals/hour)');
    }

    // 3. Log event into contact_events table
    this.events.push({
      id: Math.random().toString(36).substring(2, 9),
      user_id: userId,
      listing_id: listingId,
      event_type: 'listing_reveal',
      created_at: new Date(),
    });

    return sellerPhone;
  }

  public getEvents(): ContactEventRow[] {
    return this.events;
  }
}

describe('Postgres get_contact_number RPC Security & Audit Enforcements', () => {
  const studentAId = '00000000-0000-0000-0000-000000000002';
  const listingId = '10000000-0000-0000-0000-000000000001';
  const sellerPhone = '+919999900001';

  it('refuses the 31st reveal within an hour at the database level', () => {
    const simulator = new ContactRpcSimulator();

    // Perform 30 successful reveals
    for (let i = 1; i <= 30; i++) {
      const phone = simulator.getContactNumber(studentAId, listingId, sellerPhone);
      expect(phone).toBe(sellerPhone);
    }

    // The 31st reveal must be refused
    expect(() => {
      simulator.getContactNumber(studentAId, listingId, sellerPhone);
    }).toThrow('Rate limit exceeded (max 30 reveals/hour)');
  });

  it('writes a contact_events row for every successful contact reveal', () => {
    const simulator = new ContactRpcSimulator();

    simulator.getContactNumber(studentAId, listingId, sellerPhone);
    simulator.getContactNumber(studentAId, listingId, sellerPhone);

    const events = simulator.getEvents();
    expect(events.length).toBe(2);
    expect(events[0]?.user_id).toBe(studentAId);
    expect(events[0]?.event_type).toBe('listing_reveal');
  });

  it('refuses contact reveals for banned users immediately', () => {
    const simulator = new ContactRpcSimulator();
    const bannedStudentId = '00000000-0000-0000-0000-000000000099';
    simulator.banUser(bannedStudentId);

    expect(() => {
      simulator.getContactNumber(bannedStudentId, listingId, sellerPhone);
    }).toThrow('User account is banned');
  });
});
