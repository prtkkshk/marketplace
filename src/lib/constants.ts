// Canonical list of IIT Kharagpur Halls of Residence
// Confirmed correct (docs/PRODUCT_SPEC.md §4) - do not alter entries or order
export const KGP_HALLS = [
 'Azad',
 'Patel',
 'Nehru',
 'RK',
 'RP',
 'LLR',
 'MMM',
 'VS',
 'HJB',
 'JCB',
 'Zakir Hussain',
 'Gokhale',
 'Nivedita',
 'SNIG',
 'MS',
 'MT',
 'Rani Laxmibai',
 'BCR',
 'Vikramshila Residency',
 'Other',
] as const;

export type KgpHall = (typeof KGP_HALLS)[number];

export const ALLOWED_EMAIL_DOMAIN = '@kgpian.iitkgp.ac.in';
export const ROLL_NUMBER_REGEX = /^[0-9]{2}[A-Z]{2}[0-9]{5}$/;
export const PHONE_NUMBER_REGEX = /^\+91[0-9]{10}$/;

export const CATEGORIES = [
 { id: 'cycles', label: 'Cycles & Accessories', icon: 'Bike' },
 { id: 'books', label: 'Books, Notes & Academics', icon: 'BookOpen' },
 { id: 'electronics', label: 'Electronics & Gadgets', icon: 'Laptop' },
 { id: 'room_essentials', label: 'Room Essentials & Furniture', icon: 'BedDouble' },
 { id: 'lab_gear', label: 'Lab & Course Gear', icon: 'TestTube' },
 { id: 'other', label: 'Other / Misc', icon: 'Package' },
] as const;

export const CONDITIONS = [
 { id: 'brand_new', label: 'Brand New' },
 { id: 'like_new', label: 'Like New' },
 { id: 'good', label: 'Good' },
 { id: 'fair', label: 'Fair' },
] as const;

export const REPORT_REASONS = [
 { id: 'spam_scam', label: 'Spam or scam' },
 { id: 'prohibited', label: 'Prohibited item' },
 { id: 'offensive', label: 'Offensive content' },
 { id: 'wrong_category', label: 'Wrong category' },
 { id: 'already_sold', label: 'Already sold' },
 { id: 'harassment', label: 'Harassment' },
 { id: 'other', label: 'Other' },
] as const;
