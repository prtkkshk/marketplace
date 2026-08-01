import { supabase } from '../supabase';
import { whatsappLink } from '../utils/whatsappLink';
import { formatINR } from '../utils/formatINR';

export interface ContactResponse {
  phoneNumber: string;
  whatsappDeepLink: string;
}

export async function fetchContactNumber(
  listingId: string,
  title: string,
  price: number
): Promise<ContactResponse> {
  const { data, error } = await supabase.rpc('get_contact_number', {
    p_listing_id: listingId,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('banned')) {
      throw new Error('Your account is currently suspended from revealing contact numbers.');
    }
    if (msg.includes('rate limit')) {
      throw new Error('You have reached the contact limit (30 reveals per hour). Please try again later.');
    }
    if (msg.includes('active listing')) {
      throw new Error('This listing is no longer active for contact.');
    }
    throw new Error(`Failed to reveal contact: ${error.message}`);
  }

  if (!data) {
    throw new Error('No contact number returned for this seller.');
  }

  const phoneNumber = data as string;
  const formattedPrice = formatINR(price).replace('₹', '');
  const message = `Hi! I saw your listing "${title}" for ₹${formattedPrice} on KGP Bazaar. Is it available?`;
  const deepLink = whatsappLink(phoneNumber, message);

  return {
    phoneNumber,
    whatsappDeepLink: deepLink,
  };
}
