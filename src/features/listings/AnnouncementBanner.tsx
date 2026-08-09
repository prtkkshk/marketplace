import React, { useState } from 'react';
import type { AnnouncementItem } from '../../lib/data/listings';
import { Megaphone, X } from 'lucide-react';

export const AnnouncementBanner: React.FC<{ announcement: AnnouncementItem | null }> = ({ announcement }) => {
 const [dismissed, setDismissed] = useState<boolean>(false);

 if (!announcement || !announcement.isActive || dismissed) {
 return null;
 }

 return (
 <div
 className="p-3.5 mb-4 rounded-2xl border flex items-start justify-between gap-3 text-xs font-medium bg-accent-wash border-line-strong text-ink"
 >
 <div className="flex items-start gap-2.5">
 <Megaphone className="w-4 h-4 shrink-0 mt-0.5" />
 <span>{announcement.message}</span>
 </div>
 <button
 onClick={() => setDismissed(true)}
 className="p-1 rounded-md hover:bg-black/5 transition-colors shrink-0"
 aria-label="Dismiss announcement"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 );
};
