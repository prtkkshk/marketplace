import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet } from '../ui/Sheet';
import { Card } from '../ui/Card';
import { ShoppingBag, Megaphone } from 'lucide-react';

export interface PostChooserSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PostChooserSheet: React.FC<PostChooserSheetProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleChoice = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="Create New Post">
      <div className="flex flex-col gap-3 py-2 text-left">
        <Card
          interactive
          onClick={() => handleChoice('/new')}
          className="flex items-center gap-4 hover:border-brand-primary"
        >
          <div className="w-12 h-12 rounded-2xl bg-brand-wash text-brand-primary flex items-center justify-center text-xl shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-content-primary">Sell an Item</h3>
            <p className="text-xs text-content-muted">Post a cycle, book, electronics, or lab gear for sale.</p>
          </div>
        </Card>

        <Card
          interactive
          onClick={() => handleChoice('/new-request')}
          className="flex items-center gap-4 hover:border-brand-primary"
        >
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-800 flex items-center justify-center text-xl shrink-0">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-content-primary">Post a Wanted Request</h3>
            <p className="text-xs text-content-muted">Let campus know what second-hand item you need.</p>
          </div>
        </Card>
      </div>
    </Sheet>
  );
};
