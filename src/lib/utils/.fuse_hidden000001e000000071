/**
 * Constructs a wa.me deep link with URL-encoded message
 */
export function whatsappLink(phone: string, text: string): string {
 const cleanPhone = phone.replace(/\D/g, '');
 const encodedText = encodeURIComponent(text);
 return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}
