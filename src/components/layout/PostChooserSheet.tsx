import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet } from '../ui/Sheet';
import { Card } from '../ui/Card';
import { ShoppingBag, Megaphone, ChevronRight } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthProvider';

export interface PostChooserSheetProps {
 isOpen: boolean;
 onClose: () => void;
}

export const PostChooserSheet: React.FC<PostChooserSheetProps> = ({ isOpen, onClose }) => {
 const navigate = useNavigate();
 const { session } = useAuth();

 const handleChoice = (path: string) => {
 onClose();
 if (!session) {
 navigate('/auth/signin', { state: { from: { pathname: path } } });
 } else {
 navigate(path);
 }
 };

 return (
 <Sheet isOpen={isOpen} onClose={onClose} title="Create New Post">
 <div className="flex flex-col gap-3 py-2 text-left">
 <Card
 
 onClick={() => handleChoice('/new')}
 className="flex items-center gap-4 hover:border-accent p-4"
 >
 <div className="w-12 h-12 rounded-2xl bg-accent-wash text-accent flex items-center justify-center shrink-0">
 <ShoppingBag className="w-6 h-6" />
 </div>
 <div className="flex-1">
 <h3 className="text-sm font-bold text-ink">Sell something</h3>
 <p className="text-xs text-subtle">Post a cycle, book, electronics, or lab gear for sale.</p>
 </div>
 <ChevronRight className="w-5 h-5 text-subtle" />
 </Card>

 <Card
 
 onClick={() => handleChoice('/new-request')}
 className="flex items-center gap-4 hover:border-accent p-4"
 >
 <div className="w-12 h-12 rounded-2xl bg-accent-wash text-accent flex items-center justify-center shrink-0">
 <Megaphone className="w-6 h-6" />
 </div>
 <div className="flex-1">
 <h3 className="text-sm font-bold text-ink">Ask for something</h3>
 <p className="text-xs text-subtle">Let campus know what second-hand item you need.</p>
 </div>
 <ChevronRight className="w-5 h-5 text-subtle" />
 </Card>
 </div>
 </Sheet>
 );
};
