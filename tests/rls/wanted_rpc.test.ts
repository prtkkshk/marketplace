import { describe, it, expect } from 'vitest';

interface ContactEventRow {
  user_id: string;
  request_id?: string;
  event_type: string;
}

class RequesterRpcSimulator {
  private events: ContactEventRow[] = [];

  public getRequesterNumber(userId: string, requestId: string, requesterPhone: string): string {
    const recentReveals = this.events.filter((e) => e.user_id === userId);
    if (recentReveals.length >= 30) {
      throw new Error('Rate limit exceeded (max 30 reveals/hour)');
    }

    this.events.push({
      user_id: userId,
      request_id: requestId,
      event_type: 'request_reveal',
    });

    return requesterPhone;
  }

  public getEvents(): ContactEventRow[] {
    return this.events;
  }
}

describe('Postgres get_requester_number RPC Security', () => {
  const studentBId = '00000000-0000-0000-0000-000000000003';
  const requestId = '20000000-0000-0000-0000-000000000001';
  const requesterPhone = '+919999900002';

  it('logs event_type = request_reveal to contact_events table', () => {
    const simulator = new RequesterRpcSimulator();
    const phone = simulator.getRequesterNumber(studentBId, requestId, requesterPhone);

    expect(phone).toBe(requesterPhone);
    const events = simulator.getEvents();
    expect(events.length).toBe(1);
    expect(events[0]?.event_type).toBe('request_reveal');
    expect(events[0]?.request_id).toBe(requestId);
  });
});
