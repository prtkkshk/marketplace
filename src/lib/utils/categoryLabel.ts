import { CATEGORIES } from '../constants';

export function categoryLabel(id: string): string {
 const category = CATEGORIES.find(c => c.id === id);
 if (category) {
 return category.label;
 }
 return id
 .split('_')
 .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
 .join(' ');
}
