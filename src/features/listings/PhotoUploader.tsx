import React, { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '../../lib/supabase';
import { Camera, Image as ImageIcon, X, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

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

async function uploadToSupabase(file: Blob, userId: string, listingId: string, photoId: string): Promise<string> {
  const path = `${userId}/${listingId}/${photoId}.webp`;
  const { data, error } = await supabase.storage.from('listing-photos').upload(path, file, {
    contentType: 'image/webp',
    upsert: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data.path;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  userId,
  listingId,
  photos,
  onChange,
}) => {
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const processAndUploadFile = async (file: File, photoId: string, currentPhotos: PhotoItem[]) => {
    try {
      // 1. Compress image to max 1600px long edge, convert to WebP
      let compressedFile: File | Blob = file;
      try {
        const options = {
          maxSizeMB: 1.5,
          maxWidthOrHeight: 1600,
          useWebWorker: true,
          fileType: 'image/webp',
        };
        compressedFile = await imageCompression(file, options);
      } catch (cErr) {
        console.warn('Image compression fallback to raw file:', cErr);
      }

      // Update progress to 50%
      onChange(
        currentPhotos.map((p) => (p.id === photoId ? { ...p, progress: 50, error: undefined } : p))
      );

      // 2. Upload to Supabase Storage
      const finalPath = await uploadToSupabase(compressedFile, userId, listingId, photoId);

      // 3. Success - update state with finalPath
      onChange(
        currentPhotos.map((p) =>
          p.id === photoId ? { ...p, storagePath: finalPath, progress: 100, error: undefined } : p
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Processing failed';
      onChange(
        currentPhotos.map((p) => (p.id === photoId ? { ...p, progress: 0, error: msg } : p))
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

    let updatedList = [...photos, ...newPhotos];
    onChange(updatedList);

    // Process each new photo independently
    for (const photo of newPhotos) {
      if (photo.file) {
        await processAndUploadFile(photo.file, photo.id, updatedList);
        // Keep updated state in sync
        updatedList = updatedList.map((p) =>
          p.id === photo.id && p.progress === 100 ? { ...p } : p
        );
      }
    }

    setIsCompressing(false);
    e.target.value = '';
  };

  const handleRetry = async (photo: PhotoItem) => {
    if (!photo.file) return;
    onChange(photos.map((p) => (p.id === photo.id ? { ...p, progress: 10, error: undefined } : p)));
    await processAndUploadFile(photo.file, photo.id, photos);
  };

  const handleRemove = async (id: string) => {
    const target = photos.find((p) => p.id === id);
    if (target?.storagePath) {
      supabase.storage.from('listing-photos').remove([target.storagePath]).catch(console.error);
    }
    onChange(photos.filter((p) => p.id !== id));
  };

  return (
    <div className="flex flex-col gap-2 text-left">
      <div className="text-sm font-medium text-ink">
        Photos (1–4 images)
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        disabled={isCompressing}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        disabled={isCompressing}
        className="hidden"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', index.toString());
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
              if (dragIndex === index || isNaN(dragIndex)) return;
              const newPhotos = [...photos];
              const draggedItem = newPhotos.splice(dragIndex, 1)[0];
              if (draggedItem) {
                newPhotos.splice(index, 0, draggedItem);
                onChange(newPhotos);
              }
            }}
            className="relative aspect-[4/5] rounded-xl bg-slate-100 border border-line overflow-hidden group cursor-move"
          >
            <img src={photo.previewUrl} alt="Preview" className="w-full h-full object-cover" />

            {/* Remove Button */}
            <button
              type="button"
              onClick={() => handleRemove(photo.id)}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-900/70 text-white flex items-center justify-center hover:bg-rose-600 transition-colors z-10"
              aria-label="Remove photo"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Upload Progress Overlay */}
            {photo.progress < 100 && !photo.error && (
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                <Loader2 className="w-5 h-5 animate-spin mb-1" />
                <span className="text-[10px] font-medium">{photo.progress}%</span>
              </div>
            )}

            {/* Upload Error Overlay & Retry */}
            {photo.error && (
              <div className="absolute inset-0 bg-rose-950/80 p-2 flex flex-col items-center justify-center text-white text-center">
                <AlertCircle className="w-5 h-5 text-rose-300 mb-1" />
                <span className="text-[10px] line-clamp-2 leading-tight mb-1.5">{photo.error}</span>
                {photo.file && (
                  <button
                    type="button"
                    onClick={() => handleRetry(photo)}
                    className="px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded text-[10px] font-medium flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Retry
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Upload Action Card */}
        {photos.length < 4 && (
          <div className="aspect-[4/5] rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-2 gap-2 text-ink-3">
            <span className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider mt-2">
              Add Photo
            </span>
            <div className="flex flex-col gap-1.5 w-full px-1">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isCompressing}
                className="w-full py-1.5 px-1 bg-brand text-white rounded-lg flex items-center justify-center gap-1.5 text-[10px] font-medium hover:bg-brand/90 transition-colors shadow-1"
                title="Take photo with device camera"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Camera</span>
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={isCompressing}
                className="w-full py-1.5 px-1 bg-slate-200 text-slate-800 rounded-lg flex items-center justify-center gap-1.5 text-[10px] font-medium hover:bg-slate-300 transition-colors shadow-1"
                title="Select photo from library"
              >
                <ImageIcon className="w-3.5 h-3.5 text-slate-700" />
                <span>Gallery</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <span className="text-xs text-ink-3">
        Select 📷 Camera to snap directly or 📁 Gallery to pick existing images. Images are automatically converted to WebP (≤1600px) with EXIF metadata stripped.
      </span>
    </div>
  );
};

