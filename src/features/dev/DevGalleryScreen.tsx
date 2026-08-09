import React from 'react';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Chip } from '../../components/ui/Chip';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { SoldStamp } from '../../components/ui/SoldStamp';
import { Heart, Search } from 'lucide-react';

export default function DevGalleryScreen() {
 const [seg, setSeg] = React.useState('sale');

 return (
 <div className="p-8 max-w-4xl mx-auto space-y-16 pb-32">
 <h1 className="text-display text-ink mb-12 tabular-nums">v5 Primitives Gallery</h1>

 <section className="space-y-6">
 <h2 className="text-title font-bold text-ink border-b-[1.5px] border-line pb-2">Buttons</h2>
 <div className="flex flex-wrap gap-4 items-end">
 <Button variant="primary">Primary</Button>
 <Button variant="secondary">Secondary</Button>
 <Button variant="link">Link Button</Button>
 <Button variant="primary" disabled>Disabled</Button>
 <Button variant="primary" loading>Loading</Button>
 </div>
 </section>

 <section className="space-y-6">
 <h2 className="text-title font-bold text-ink border-b-[1.5px] border-line pb-2">Icon Button</h2>
 <div className="flex gap-4">
 <IconButton aria-label="Save"><Heart className="w-5 h-5" /></IconButton>
 <IconButton aria-label="Search"><Search className="w-5 h-5" /></IconButton>
 <IconButton disabled aria-label="Disabled"><Heart className="w-5 h-5" /></IconButton>
 </div>
 </section>

 <section className="space-y-6">
 <h2 className="text-title font-bold text-ink border-b-[1.5px] border-line pb-2">Inputs</h2>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
 <Input label="Standard Input" placeholder="Placeholder..." hint="This is a subtle hint." />
 <Input label="Invalid Input" placeholder="Placeholder..." error="This field is required." />
 <Select label="Select">
 <option>Option 1</option>
 <option>Option 2</option>
 </Select>
 <Textarea label="Textarea" placeholder="Write something..." />
 </div>
 </section>

 <section className="space-y-6">
 <h2 className="text-title font-bold text-ink border-b-[1.5px] border-line pb-2">Chips & Controls</h2>
 <div className="flex gap-4 items-center">
 <Chip>Default</Chip>
 <Chip active>Active</Chip>
 </div>
 <div className="max-w-[300px]">
 <SegmentedControl 
 options={[{ label: ' For Sale', value: 'sale' }, { label: ' Wanted', value: 'wanted' }]} 
 value={seg} 
 onChange={setSeg} 
 />
 </div>
 </section>

 <section className="space-y-6">
 <h2 className="text-title font-bold text-ink border-b-[1.5px] border-line pb-2">Badges</h2>
 <div className="flex gap-4">
 <Badge>Default</Badge>
 <Badge variant="success">Available</Badge>
 <Badge variant="default">Reported</Badge>
 </div>
 </section>

 <section className="space-y-6">
 <h2 className="text-title font-bold text-ink border-b-[1.5px] border-line pb-2">Card & Sold Stamp</h2>
 <div className="max-w-xs relative">
 <Card className="p-4 relative">
 <div className="w-full h-32 bg-surface-2 rounded mb-3"></div>
 <div className="space-y-2">
 <h3 className="text-base font-bold">Item Title</h3>
 <p className="text-price text-ink tabular-nums">₹1,200</p>
 </div>
 <SoldStamp className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
 </Card>
 </div>
 </section>

 <section className="space-y-6">
 <h2 className="text-title font-bold text-ink border-b-[1.5px] border-line pb-2">Empty State</h2>
 <EmptyState 
 icon={<Search className="w-5 h-5" />}
 title="No results found"
 description="Try adjusting your search or filters to find what you're looking for."
 action={<Button variant="primary">Clear filters</Button>}
 />
 </section>

 <section className="space-y-6">
 <h2 className="text-title font-bold text-ink border-b-[1.5px] border-line pb-2">Skeleton</h2>
 <div className="max-w-xs space-y-2">
 <Skeleton className="w-full h-32" />
 <Skeleton className="w-3/4 h-6" />
 <Skeleton className="w-1/2 h-6" />
 </div>
 </section>
 </div>
 );
}
