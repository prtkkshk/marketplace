/**
 * Formats an integer rupee amount into Indian Rupee format (e.g. 1200 -> ₹1,200)
 */
export function formatINR(amount: number): string {
 if (isNaN(amount)) return '₹0';
 const formatted = new Intl.NumberFormat('en-IN', {
 maximumFractionDigits: 0,
 }).format(amount);
 return `₹${formatted}`;
}
