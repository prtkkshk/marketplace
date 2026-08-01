import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '../../lib/supabase';
import { Camera, X, Loader2, AlertCircle } from 'lucide-react';

export interface PhotoItem {
  id: string;
  file?: File;
  previewUrl: string;
  storagePath?: string;
  progress: number;
  error?: string;
}

export interface PhotoUploaderProps {
  userId: string;
  listingId: string;
  photos: PhotoItem[];
  onChange: (photos: PhotoItem[]) => void;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  userId,
  listingId,
  photos,
  onChange,
}) => {
  const [isCompressing, setIsCompressing] = useState<boolean>(false);

  const processAndUploadFile = async (file: File, photoId: string) => {
    try {
      // 1. Compress image to max 1600px long edge, convert to WebP, strip EXIF
      const options = {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        fileType: 'image/webp',
      };

      const compressedFile = await imageCompression(file, options);

      // 2. Determine storage path: listing-photos/{userId}/{listingId}/{photoId}.webp
      const storagePath = `${userId}/${listingId}/${photoId}.webp`;

      // Update progress to 50%
      onChange(
        photos.map((p) => (p.id === photoId ? { ...p, progress: 50 } : p))
      );

      // 3. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('listing-photos')
        .upload(storagePath, compressedFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/webp',
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Success
      onChange(
        photos.map((p) =>
          p.id === photoId ? { ...p, storagePath, progress: 100, error: undefined } : p
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      onChange(
        photos.map((p) => (p.id === photoId ? { ...p, progress: 0, error: msg } : p))
      );
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const availableSlots = 4 - photos.length;
    const selectedFiles = files.slice(0, availableSlots);

    setIsCompressing(true);

    const newPhotos: PhotoItem[] = selectedFiles.map((file, idx) => {
      const id = `${Date.now()}_${idx}`;
      return {
        id,
        file,
        previewUrl: URL.createObjectURL(file),
        progress: 10,
      };
    });

    const updated = [...photos, ...newPhotos];
    onChange(updated);

    // Process each new photo independently so one failure doesn't ruin the batch
    for (const photo of newPhotos) {
      if (photo.file) {
        await processAndUploadFile(photo.file, photo.id);
      }
    }

    setIsCompressing(false);
    e.target.value = '';
  };

  const handleRemove = async (id: string) => {
    const target = photos.find((p) => p.id === id);
    if (target?.storagePath) {
      // Remove from storage if uploaded
      supabase.storage.from('listing-photos').remove([target.storagePath]).catch(console.error);
    }

    onChange(photos.filter((p) => p.id !== id));
  };

  return (
    <div className="flex flex-col gap-2 text-left">
      <label className="text-sm font-medium text-content-primary">
        Photos (1–4 images)
      </label>

      <div className="grid grid-cols-4 gap-2">
        {photos.map((photo) => (
          <div key={photo.id} className="relative aspect-square rounded-xl bg-slate-100 border border-surface-border overflow-hidden group">
            <img src={photo.previewUrl} alt="Preview" className="w-full h-full object-cover" />

            {/* Remove Button */}
            <button
              type="button"
              onClick={() => handleRemove(photo.id)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-900/70 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
              aria-label="Remove photo"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Upload Progress Overlay */}
            {photo.progress < 100 && !photo.error && (
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            )}

            {/* Upload Error Indicator */}
            {photo.error && (
              <div className="absolute inset-0 bg-rose-900/60 p-1 flex flex-col items-center justify-center text-white text-[10px] text-center">
                <AlertCircle className="w-4 h-4 mb-0.5" />
                <span className="line-clamp-1">Failed</span>
              </div>
            )}
          </div>
        ))}

        {/* Upload Trigger Button */}
        {photos.length < 4 && (
          <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-brand-primary bg-slate-50 flex flex-col items-center justify-center cursor-pointer transition-colors text-content-muted hover:text-brand-primary">
            <Camera className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Add Photo</span>
            <input
              type="file"
              accept="image/png, image/jpeg, image/webp"
              multiple
              onChange={handleFileSelect}
              disabled={isCompressing}
              className="hidden"
            />
          </label>
        )}
      </div>

      <span className="text-xs text-content-muted">
        Photos are compressed to WebP (≤1600px) and EXIF metadata is automatically stripped for privacy.
      </span>
    </div>
  );
};
